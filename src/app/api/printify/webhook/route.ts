import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/printify/webhook
 *
 * Receives Printify webhook events and syncs changes to Supabase.
 * Events: product.updated, order.shipped, order.delivered
 *
 * Register this webhook URL in Printify dashboard:
 * Settings → Webhooks → Add → https://shirtynation.vercel.app/api/printify/webhook
 */

interface PrintifyWebhookEvent {
  type: string;
  resource: {
    id: string;
    type: string;
    data?: Record<string, unknown>;
  };
}

async function syncProductFromPrintify(productId: string) {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) return;

  // Fetch latest product data from Printify
  const res = await fetch(
    `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "ShirtyNation/1.0",
      },
    }
  );

  if (!res.ok) {
    console.error(`Printify product fetch failed: ${res.status}`);
    return;
  }

  const product = await res.json();

  // Extract front mockup URLs with cache-bust
  const mockups: string[] = [];
  for (const img of product.images || []) {
    if (img.src && img.src.includes("102044")) {
      mockups.push(`${img.src}?v=${Date.now()}`);
    }
  }
  if (mockups.length === 0 && product.images?.length > 0) {
    mockups.push(`${product.images[0].src}?v=${Date.now()}`);
  }

  // Update Supabase
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({
      mockup_urls: mockups,
      updated_at: new Date().toISOString(),
    })
    .eq("printify_product_id", productId);

  if (error) {
    console.error(`Supabase sync failed for ${productId}: ${error.message}`);
  } else {
    console.log(`Synced product ${productId} from Printify webhook`);
  }
}

async function handleOrderShipment(orderId: string, event: PrintifyWebhookEvent) {
  const supabase = createAdminClient();

  // Try to find matching order and update tracking
  const trackingNumber = (event.resource.data as Record<string, unknown>)?.tracking_number as string;
  const trackingUrl = (event.resource.data as Record<string, unknown>)?.tracking_url as string;
  const carrier = (event.resource.data as Record<string, unknown>)?.carrier as string;

  if (trackingNumber) {
    await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || null,
      })
      .or(`printify_order_id.eq.${orderId},stripe_session_id.eq.ebay_${orderId}`);

    console.log(`Order ${orderId} shipped: ${carrier} ${trackingNumber}`);
  }
}

export async function POST(request: Request) {
  try {
    const event: PrintifyWebhookEvent = await request.json();
    const eventType = event.type || "";
    const resourceId = event.resource?.id || "";

    console.log(`[printify-webhook] ${eventType} | ${resourceId}`);

    switch (eventType) {
      case "product:publish:started":
      case "product:updated":
        await syncProductFromPrintify(resourceId);
        break;

      case "order:shipment:created":
        await handleOrderShipment(resourceId, event);
        break;

      case "order:shipment:delivered":
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({ status: "delivered" })
          .or(`printify_order_id.eq.${resourceId},stripe_session_id.eq.ebay_${resourceId}`);
        break;

      default:
        console.log(`[printify-webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[printify-webhook] Error:", error);
    return NextResponse.json({ received: true }); // Always 200 so Printify doesn't retry
  }
}
