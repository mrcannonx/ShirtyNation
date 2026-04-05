import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = createAdminClient();

    const items = session.metadata?.items
      ? JSON.parse(session.metadata.items)
      : [];

    const shipping = (session as unknown as { shipping_details?: { address?: Stripe.Address } }).shipping_details?.address;

    // Insert order — idempotent via unique stripe_session_id
    const { error: insertError } = await supabase.from("orders").insert({
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
      shipping_address: shipping
        ? {
            line1: shipping.line1,
            line2: shipping.line2,
            city: shipping.city,
            state: shipping.state,
            postal_code: shipping.postal_code,
            country: shipping.country,
          }
        : null,
      items,
      total: (session.amount_total || 0) / 100,
      shipping_cost: 0, // calculated at checkout
      status: "paid",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      console.error("Order insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record order" },
        { status: 500 }
      );
    }

    // TODO: Auto-submit to Printify API when PRINTIFY_API_TOKEN is configured
    // This will be handled by /api/printify/submit-order
  }

  return NextResponse.json({ received: true });
}
