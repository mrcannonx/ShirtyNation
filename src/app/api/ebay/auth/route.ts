import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/ebay";

/**
 * GET /api/ebay/auth
 *
 * One-time OAuth flow. Redirects to eBay consent page.
 * After user grants access, eBay redirects to /api/ebay/callback
 */
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/ebay/callback`;

  try {
    const authUrl = getAuthUrl(callbackUrl);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
