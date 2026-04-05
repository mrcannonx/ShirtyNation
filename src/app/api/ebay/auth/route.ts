import { NextResponse } from "next/server";

/**
 * GET /api/ebay/auth
 *
 * Redirects to eBay OAuth consent page using the pre-built OAuth URL
 * from eBay Developer Portal with all scopes included.
 */
export async function GET() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const ruName = process.env.EBAY_RU_NAME;

  if (!clientId || !ruName) {
    return NextResponse.json(
      { error: "EBAY_CLIENT_ID and EBAY_RU_NAME are required" },
      { status: 500 }
    );
  }

  const scopes = [
    "https://api.ebay.com/oauth/api_scope",
    "https://api.ebay.com/oauth/api_scope/sell.marketing.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.marketing",
    "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.inventory",
    "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.account",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
    "https://api.ebay.com/oauth/api_scope/sell.analytics.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.finances",
    "https://api.ebay.com/oauth/api_scope/sell.payment.dispute",
    "https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.reputation",
    "https://api.ebay.com/oauth/api_scope/sell.reputation.readonly",
    "https://api.ebay.com/oauth/api_scope/commerce.notification.subscription",
    "https://api.ebay.com/oauth/api_scope/commerce.notification.subscription.readonly",
    "https://api.ebay.com/oauth/api_scope/sell.stores",
    "https://api.ebay.com/oauth/api_scope/sell.stores.readonly",
  ].join(" ");

  const authUrl = `https://auth.ebay.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(ruName)}&scope=${encodeURIComponent(scopes)}`;

  return NextResponse.redirect(authUrl);
}
