import { NextResponse } from "next/server";
import { ebayFetch } from "@/lib/ebay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrder as createPrintifyOrder } from "@/lib/printify";

/**
 * GET /api/ebay/orders
 *
 * Polls eBay for new orders and routes them to Printify for fulfillment.
 * Called periodically (cron) or manually.
 *
 * Flow:
 * 1. Fetch recent eBay orders via Fulfillment API
 * 2. For each new order, look up the product SKU in Supabase
 * 3. Submit order to Printify for printing + shipping
 * 4. Save order to Supabase with source: "ebay"
 */

interface EbayOrder {
  orderId: string;
  creationDate: string;
  orderFulfillmentStatus: string;
  buyer: {
    username: string;
    buyerRegistrationAddress?: {
      fullName: string;
      email: string;
    };
  };
  fulfillmentStartInstructions: {
    shippingStep: {
      shipTo: {
        fullName: string;
        contactAddress: {
          addressLine1: string;
          addressLine2?: string;
          city: string;
          stateOrProvince: string;
          postalCode: string;
          countryCode: string;
        };
        email?: string;
        primaryPhone?: { phoneNumber: string };
      };
    };
  }[];
  lineItems: {
    lineItemId: string;
    title: string;
    sku: string;
    quantity: number;
    lineItemCost: { value: string; currency: string };
    variationAspects?: { name: string; value: string }[];
  }[];
  pricingSummary: {
    total: { value: string };
  };
}

interface EbayOrdersResponse {
  orders: EbayOrder[];
  total: number;
}

export async function GET() {
  if (!process.env.EBAY_REFRESH_TOKEN) {
    return NextResponse.json({ error: "eBay not connected" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch recent unfulfilled orders from eBay
    const result = await ebayFetch<EbayOrdersResponse>(
      "/sell/fulfillment/v1/order?filter=orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}&limit=50"
    );

    if (!result.orders || result.orders.length === 0) {
      return NextResponse.json({ message: "No new orders", processed: 0 });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const order of result.orders) {
      // Check if we already processed this order
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_session_id", `ebay_${order.orderId}`)
        .single();

      if (existing) continue; // Already processed

      try {
        const shipping = order.fulfillmentStartInstructions?.[0]?.shippingStep?.shipTo;
        if (!shipping) continue;

        // Look up products by SKU
        const skus = order.lineItems.map((li) => li.sku).filter(Boolean);
        const { data: products } = await supabase
          .from("products")
          .select("id, printify_product_id, ebay_sku")
          .in("ebay_sku", skus);

        // Extract size/color from variation aspects
        const items = order.lineItems.map((li) => {
          const size = li.variationAspects?.find((a) => a.name === "Size")?.value || "L";
          const color = li.variationAspects?.find((a) => a.name === "Color")?.value || "Black";
          return {
            product_id: products?.find((p) => p.ebay_sku === li.sku)?.id || li.sku,
            name: li.title,
            price: parseFloat(li.lineItemCost.value),
            quantity: li.quantity,
            size,
            color,
          };
        });

        // Submit to Printify for fulfillment
        const printifyProductId = products?.[0]?.printify_product_id;
        if (printifyProductId && process.env.PRINTIFY_API_TOKEN) {
          try {
            const nameParts = shipping.fullName.split(" ");
            await createPrintifyOrder({
              externalId: order.orderId,
              label: `eBay #${order.orderId.slice(-8)}`,
              lineItems: order.lineItems.map((li) => ({
                productId: printifyProductId,
                variantId: 18100, // TODO: map size/color to variant ID
                quantity: li.quantity,
              })),
              shippingMethod: 1,
              address: {
                first_name: nameParts[0] || "Customer",
                last_name: nameParts.slice(1).join(" ") || "",
                email: shipping.email || order.buyer.buyerRegistrationAddress?.email || "",
                phone: shipping.primaryPhone?.phoneNumber,
                country: shipping.contactAddress.countryCode,
                region: shipping.contactAddress.stateOrProvince,
                address1: shipping.contactAddress.addressLine1,
                address2: shipping.contactAddress.addressLine2,
                city: shipping.contactAddress.city,
                zip: shipping.contactAddress.postalCode,
              },
            });
            console.log(`  📦 eBay order ${order.orderId} submitted to Printify`);
          } catch (printifyErr) {
            console.error(`  ⚠️  Printify submission failed: ${(printifyErr as Error).message}`);
          }
        }

        // Save to Supabase
        await supabase.from("orders").insert({
          stripe_session_id: `ebay_${order.orderId}`,
          customer_email: shipping.email || order.buyer.buyerRegistrationAddress?.email || "ebay-buyer",
          customer_name: shipping.fullName,
          shipping_address: {
            line1: shipping.contactAddress.addressLine1,
            line2: shipping.contactAddress.addressLine2,
            city: shipping.contactAddress.city,
            state: shipping.contactAddress.stateOrProvince,
            postal_code: shipping.contactAddress.postalCode,
            country: shipping.contactAddress.countryCode,
          },
          items,
          total: parseFloat(order.pricingSummary.total.value),
          status: "paid",
          source: "ebay",
        });

        processed++;
        console.log(`  ✅ eBay order ${order.orderId} processed`);
      } catch (err) {
        errors.push(`${order.orderId}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} eBay orders`,
      processed,
      total: result.total,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("eBay order poll error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
