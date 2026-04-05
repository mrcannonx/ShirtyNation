import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/ebay";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/ebay/callback?code=...
 *
 * eBay OAuth callback. Exchanges authorization code for tokens.
 * Stores refresh token in Supabase settings table for persistence.
 *
 * IMPORTANT: After this completes, copy the refresh token to .env.local
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // eBay sometimes includes # in the code — handle both query param formats
  let code = url.searchParams.get("code");
  if (!code) {
    // Try to extract from the full URL string (eBay quirk)
    const codeMatch = request.url.match(/code=([^&]+)/);
    code = codeMatch ? decodeURIComponent(codeMatch[1]) : null;
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code received from eBay", raw_url: request.url },
      { status: 400 }
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    // Store refresh token in Supabase for persistence
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminClient();
      await supabase.from("settings").upsert({
        key: "ebay_refresh_token",
        value: tokens.refreshToken,
        updated_at: new Date().toISOString(),
      });
      await supabase.from("settings").upsert({
        key: "ebay_access_token",
        value: tokens.accessToken,
        updated_at: new Date().toISOString(),
      });
    }

    // Show success page with the refresh token to copy
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><title>eBay Connected</title></head>
<body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; background: #0A0A0A; color: #F5F5F5;">
  <h1 style="color: #E8630A;">eBay Connected!</h1>
  <p>Your eBay account is now linked to ShirtyNation.</p>

  <h3>Refresh Token (copy to .env.local):</h3>
  <textarea style="width: 100%; height: 100px; background: #141414; color: #E8630A; border: 1px solid #262626; padding: 10px; font-family: monospace; font-size: 11px;" readonly>${tokens.refreshToken}</textarea>

  <p style="color: #737373; font-size: 12px; margin-top: 20px;">
    Add this as EBAY_REFRESH_TOKEN in your .env.local file.
    Token expires in ${Math.round(tokens.expiresIn / 3600)} hours — the refresh token is long-lived.
  </p>

  <p style="color: #737373; font-size: 12px;">
    Also saved to Supabase settings table for persistence.
  </p>
</body>
</html>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
