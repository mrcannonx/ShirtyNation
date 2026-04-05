import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShippingCost } from "@/lib/shipping";

interface CheckoutItem {
  product_id: string;
  quantity: number;
  size: string;
  color: string;
}

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items: CheckoutItem[] };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const productIds = [...new Set(items.map((i) => i.product_id))];

    // Fetch real products from database — never trust client prices
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, mockup_urls, design_url, status")
      .in("id", productIds);

    if (error || !products) {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products exist and are active
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
      if (product.status !== "active") {
        return NextResponse.json({ error: `${product.name} is no longer available` }, { status: 409 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Calculate subtotal for shipping
    const subtotal = items.reduce((sum, item) => {
      const product = productMap.get(item.product_id)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);
    const shippingCost = getShippingCost(subtotal);

    // Build line items from DATABASE prices
    const lineItems = items.map((item) => {
      const product = productMap.get(item.product_id)!;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.name} (${item.size} / ${item.color})`,
            ...(product.mockup_urls?.[0]
              ? { images: [product.mockup_urls[0]] }
              : product.design_url
                ? { images: [product.design_url] }
                : {}),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Add shipping as a line item if not free
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      line_items: lineItems,
      metadata: {
        items: JSON.stringify(
          items.map((item) => {
            const product = productMap.get(item.product_id)!;
            return {
              product_id: product.id,
              name: product.name,
              price: product.price,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              image: product.mockup_urls?.[0] || product.design_url || null,
            };
          })
        ),
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
