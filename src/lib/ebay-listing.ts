/**
 * eBay Listing Service
 *
 * Creates fully SEO-optimized eBay listings via the Inventory API.
 * Handles: inventory items, offers, publishing, and item specifics.
 */

import { ebayFetch, uploadPhotoToEbay } from "./ebay";

// eBay category IDs
const CATEGORY_IDS: Record<string, string> = {
  default: "15687",     // Men's T-Shirts (Graphic Tee)
  vintage: "175781",    // Vintage T-Shirts
};

// Category → eBay theme mapping
const THEME_MAP: Record<string, string> = {
  funny: "Humor",
  motivational: "Inspirational",
  vintage: "Vintage",
  gaming: "Gaming",
  sports: "Sports",
  music: "Music",
  "dad-jokes": "Humor",
  coding: "Technology",
  animals: "Animal Print",
  trending: "Pop Culture",
};

// --- Inventory Item ---

interface CreateListingInput {
  sku: string;
  title: string;           // SEO-optimized, 80 chars max for eBay
  description: string;     // HTML description
  category: string;        // our category slug
  colors: string[];
  sizes: string[];
  price: number;
  imageUrls: string[];     // Printify mockup URLs to upload to eBay
}

function generateEbayTitle(title: string, category: string): string {
  // eBay allows 80 chars — front-load keywords
  const theme = THEME_MAP[category] || "Graphic";
  const base = title
    .replace(" T-Shirt", "")
    .replace(" Tee", "")
    .replace("| Funny Graphic Tee", "")
    .replace("| Gaming Graphic Tee", "")
    .replace(/\|.*$/, "")
    .trim();

  const suffix = `T-Shirt ${theme} Graphic Tee Unisex Gift`;
  const full = `${base} ${suffix}`;

  // Truncate to 80 chars at word boundary
  if (full.length <= 80) return full;
  return full.slice(0, 77).replace(/\s+\S*$/, "") + "...";
}

function generateEbayHtmlDescription(
  title: string,
  description: string,
  colors: string[],
  imageUrl?: string
): string {
  const colorList = colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");

  return `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
  ${imageUrl ? `<div style="text-align: center; margin-bottom: 20px;">
    <img src="${imageUrl}" alt="${title}" style="max-width: 500px; border-radius: 8px;" />
  </div>` : ""}

  <h2 style="font-size: 22px; margin-bottom: 10px;">${title}</h2>

  <p style="font-size: 14px; line-height: 1.6; color: #555;">
    ${title.replace(/ T-Shirt.*$/, "")} — a design that speaks for itself.
  </p>

  <h3 style="font-size: 16px; margin-top: 20px; color: #222;">Premium Quality</h3>
  <ul style="font-size: 14px; line-height: 1.8; color: #555;">
    <li>Bella+Canvas 3001 Unisex Jersey Tee</li>
    <li>100% combed ring-spun cotton (4.2 oz)</li>
    <li>Retail fit with side seams</li>
    <li>Crew neckline with ribbed collar</li>
    <li>Pre-shrunk for consistent sizing</li>
    <li>DTG printed — vibrant, long-lasting color</li>
  </ul>

  <h3 style="font-size: 16px; margin-top: 20px; color: #222;">Available Options</h3>
  <ul style="font-size: 14px; line-height: 1.8; color: #555;">
    <li><strong>Sizes:</strong> S, M, L, XL, 2XL, 3XL</li>
    <li><strong>Color:</strong> ${colorList}</li>
    <li><strong>Fit:</strong> Unisex — works for everyone</li>
  </ul>

  <h3 style="font-size: 16px; margin-top: 20px; color: #222;">Shipping</h3>
  <p style="font-size: 14px; color: #555;">
    Made to order. Ships within 3-5 business days from the USA.
    Free shipping on orders over $35.
  </p>

  <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 8px; text-align: center;">
    <p style="font-size: 13px; color: #888; margin: 0;">
      ShirtyNation — The Largest Selection of Shirts in Every Niche
    </p>
  </div>
</div>`;
}

function buildAspects(category: string, colors: string[], sizes: string[]): Record<string, string[]> {
  const theme = THEME_MAP[category] || "Graphic Print";

  return {
    Brand: ["ShirtyNation"],
    Type: ["Graphic Tee"],
    Size: sizes,
    "Size Type": ["Regular"],
    Color: colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    Style: ["Graphic Tee"],
    Neckline: ["Crew Neck"],
    "Sleeve Length": ["Short Sleeve"],
    Material: ["100% Cotton"],
    Fit: ["Regular"],
    Theme: [theme],
    Pattern: ["Graphic Print"],
    Department: ["Unisex Adult"],
    Occasion: ["Casual"],
    "Fabric Type": ["Jersey"],
  };
}

// --- Create Full Listing ---

export async function createEbayListing(input: CreateListingInput): Promise<{
  listingId: string;
  offerId: string;
  sku: string;
}> {
  // Step 1: Upload images to eBay hosting
  console.log("  🖼️  Uploading images to eBay...");
  const ebayImageUrls: string[] = [];
  for (const url of input.imageUrls) {
    try {
      const ebayUrl = await uploadPhotoToEbay(url);
      ebayImageUrls.push(ebayUrl);
      console.log(`  ✅ Image uploaded to eBay`);
    } catch (err) {
      console.log(`  ⚠️  Image upload failed: ${(err as Error).message}`);
    }
  }

  if (ebayImageUrls.length === 0) {
    throw new Error("No images uploaded to eBay successfully");
  }

  // Step 2: Create inventory item
  console.log("  📦 Creating eBay inventory item...");
  const ebayTitle = generateEbayTitle(input.title, input.category);
  const htmlDescription = generateEbayHtmlDescription(
    input.title,
    input.description,
    input.colors,
    ebayImageUrls[0]
  );

  await ebayFetch(`/sell/inventory/v1/inventory_item/${input.sku}`, {
    method: "PUT",
    body: JSON.stringify({
      product: {
        title: ebayTitle,
        description: htmlDescription,
        aspects: buildAspects(input.category, input.colors, input.sizes),
        imageUrls: ebayImageUrls,
      },
      condition: "NEW_WITH_TAGS",
      availability: {
        shipToLocationAvailability: {
          quantity: 999,
        },
      },
    }),
  });
  console.log(`  ✅ Inventory item created: ${input.sku}`);

  // Step 3: Create offer
  console.log("  💰 Creating eBay offer...");
  const categoryId = CATEGORY_IDS[input.category] || CATEGORY_IDS.default;

  let offerId: string;
  try {
    const offerResult = await ebayFetch<{ offerId: string }>("/sell/inventory/v1/offer", {
      method: "POST",
      body: JSON.stringify({
        sku: input.sku,
        marketplaceId: "EBAY_US",
        format: "FIXED_PRICE",
        listingDuration: "GTC",
        availableQuantity: 999,
        pricingSummary: {
          price: {
            currency: "USD",
            value: input.price.toFixed(2),
          },
        },
        categoryId,
        listingPolicies: {
          // These will use seller's default policies
          // Can be configured in eBay seller hub
        },
        merchantLocationKey: undefined,
      }),
    });
    offerId = offerResult.offerId;
  } catch (err) {
    // Error 25002 = offer already exists for this SKU
    const errMsg = (err as Error).message;
    const existingMatch = errMsg.match(/"offerId"\s*:\s*"([^"]+)"/);
    if (existingMatch) {
      offerId = existingMatch[1];
      console.log(`  ℹ️  Reusing existing offer: ${offerId}`);
    } else {
      throw err;
    }
  }
  console.log(`  ✅ Offer created: ${offerId}`);

  // Step 4: Publish
  console.log("  🚀 Publishing to eBay...");
  const publishResult = await ebayFetch<{ listingId: string }>(
    `/sell/inventory/v1/offer/${offerId}/publish`,
    { method: "POST" }
  );
  const listingId = publishResult.listingId;
  console.log(`  ✅ Published on eBay: ${listingId}`);

  return { listingId, offerId, sku: input.sku };
}

// --- Update Existing Listing ---

export async function updateEbayListing(
  sku: string,
  updates: Partial<{
    title: string;
    description: string;
    price: number;
    imageUrls: string[];
  }>
): Promise<void> {
  if (updates.title || updates.description || updates.imageUrls) {
    const body: Record<string, unknown> = { product: {} };
    if (updates.title) (body.product as Record<string, unknown>).title = updates.title;
    if (updates.description) (body.product as Record<string, unknown>).description = updates.description;
    if (updates.imageUrls) (body.product as Record<string, unknown>).imageUrls = updates.imageUrls;

    await ebayFetch(`/sell/inventory/v1/inventory_item/${sku}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

export { generateEbayTitle, generateEbayHtmlDescription, buildAspects };
