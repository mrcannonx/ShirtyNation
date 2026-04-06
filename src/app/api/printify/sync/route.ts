import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/printify/sync
 *
 * Pulls all products from Printify and syncs to Supabase.
 * Updates: mockup images, titles, descriptions, tags.
 * Preserves: slug, category, colors, sizes, price (managed by us).
 *
 * Call this after editing products on Printify dashboard.
 * Can also be called on a cron schedule for automatic sync.
 */

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  images: { src: string; variant_ids: number[]; is_default: boolean }[];
  variants: { id: number; price: number; is_enabled: boolean; options: Record<string, string> }[];
  visible: boolean;
  created_at: string;
  updated_at: string;
}

interface PrintifyProductList {
  data?: PrintifyProduct[];
}

async function fetchPrintifyProducts(): Promise<PrintifyProduct[]> {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) throw new Error("Printify credentials not configured");

  const res = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json?limit=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "ShirtyNation/1.0",
    },
  });

  if (!res.ok) throw new Error(`Printify API error: ${res.status}`);

  const data: PrintifyProductList | PrintifyProduct[] = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

function extractMockups(product: PrintifyProduct): string[] {
  const mockups: string[] = [];
  const seen = new Set<string>();

  for (const img of product.images || []) {
    if (img.src && img.src.includes("102044") && !seen.has(img.src)) {
      // Add cache-bust param to force fresh image
      const url = img.src.includes("?")
        ? `${img.src}&v=${Date.now()}`
        : `${img.src}?v=${Date.now()}`;
      mockups.push(url);
      seen.add(img.src);
    }
  }

  // Fallback to first image if no front mockup found
  if (mockups.length === 0 && product.images?.length > 0) {
    mockups.push(`${product.images[0].src}?v=${Date.now()}`);
  }

  return mockups;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const printifyProducts = await fetchPrintifyProducts();

    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const pp of printifyProducts) {
      try {
        // Find matching product in Supabase by printify_product_id
        const { data: existing } = await supabase
          .from("products")
          .select("id, slug, printify_product_id")
          .eq("printify_product_id", pp.id)
          .single();

        if (!existing) {
          skipped++;
          continue;
        }

        // Extract updated mockup URLs
        const mockups = extractMockups(pp);

        // Sync: update mockups and description from Printify
        // Preserve: slug, category, colors, sizes, price, status (managed by us)
        const { error: updateError } = await supabase
          .from("products")
          .update({
            mockup_urls: mockups,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) {
          errors.push(`${pp.title}: ${updateError.message}`);
        } else {
          synced++;
        }
      } catch (err) {
        errors.push(`${pp.title}: ${(err as Error).message}`);
      }
    }

    return NextResponse.json({
      message: `Synced ${synced} products from Printify`,
      synced,
      skipped,
      total: printifyProducts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
