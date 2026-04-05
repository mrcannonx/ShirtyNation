/**
 * eBay OAuth & API Client
 *
 * Handles token management and authenticated requests to eBay APIs.
 * Uses Authorization Code Grant flow with refresh tokens.
 */

const PRODUCTION_BASE = "https://api.ebay.com";
const SANDBOX_BASE = "https://api.sandbox.ebay.com";
const PRODUCTION_AUTH = "https://auth.ebay.com/oauth2/authorize";
const SANDBOX_AUTH = "https://auth.sandbox.ebay.com/oauth2/authorize";

function getConfig() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const ruName = process.env.EBAY_RU_NAME;
  const environment = process.env.EBAY_ENVIRONMENT || "production";

  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are required");
  }

  const isSandbox = environment === "sandbox";
  return {
    clientId,
    clientSecret,
    ruName: ruName || "",
    baseUrl: isSandbox ? SANDBOX_BASE : PRODUCTION_BASE,
    authUrl: isSandbox ? SANDBOX_AUTH : PRODUCTION_AUTH,
    isSandbox,
  };
}

// In-memory token cache (refreshed as needed)
let cachedAccessToken: string | null = null;
let tokenExpiry: number = 0;

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
  "https://api.ebay.com/oauth/api_scope/sell.account",
  "https://api.ebay.com/oauth/api_scope/sell.marketing",
  "https://api.ebay.com/oauth/api_scope/commerce.identity.readonly",
];

// --- OAuth ---

export function getAuthUrl(callbackUrl: string): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.ruName || callbackUrl,
    response_type: "code",
    scope: SCOPES.join(" "),
  });
  return `${config.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const config = getConfig();
  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.ruName,
  });

  const res = await fetch(`${config.baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`eBay token exchange failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5 min buffer

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

async function refreshAccessToken(): Promise<string> {
  const config = getConfig();
  const refreshToken = process.env.EBAY_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error("EBAY_REFRESH_TOKEN not set. Run OAuth flow first: /api/ebay/auth");
  }

  const basicAuth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: SCOPES.join(" "),
  });

  const res = await fetch(`${config.baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`eBay token refresh failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

// --- API Client ---

export async function ebayFetch<T>(
  path: string,
  options?: RequestInit & { retried?: boolean }
): Promise<T> {
  const config = getConfig();
  const token = await getAccessToken();

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options?.headers,
    },
  });

  // Auto-retry on 401 (token expired)
  if (res.status === 401 && !options?.retried) {
    cachedAccessToken = null;
    tokenExpiry = 0;
    return ebayFetch(path, { ...options, retried: true });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`eBay API ${res.status} ${path}: ${body.slice(0, 500)}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// --- Trading API (XML) for photo upload ---

export async function uploadPhotoToEbay(imageUrl: string): Promise<string> {
  const config = getConfig();
  const token = await getAccessToken();

  const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ExternalPictureURL>${imageUrl}</ExternalPictureURL>
</UploadSiteHostedPicturesRequest>`;

  const tradingBase = config.isSandbox
    ? "https://api.sandbox.ebay.com"
    : "https://api.ebay.com";

  const res = await fetch(`${tradingBase}/ws/api.dll`, {
    method: "POST",
    headers: {
      "X-EBAY-API-IAF-TOKEN": token,
      "X-EBAY-API-CALL-NAME": "UploadSiteHostedPictures",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1225",
      "X-EBAY-API-SITEID": "0",
      "Content-Type": "text/xml",
    },
    body: xmlPayload,
  });

  const xml = await res.text();

  // Extract FullURL from XML response
  const match = xml.match(/<FullURL>(.*?)<\/FullURL>/);
  if (!match) {
    // Check for errors
    const errMatch = xml.match(/<ShortMessage>(.*?)<\/ShortMessage>/);
    throw new Error(`eBay photo upload failed: ${errMatch?.[1] || "Unknown error"}`);
  }

  return match[1];
}

export { getConfig };
