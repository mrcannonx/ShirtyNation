import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- Printify Config ---
const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN!;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID!;
const PRINTIFY_BASE = "https://api.printify.com/v1";

const BLUEPRINT_ID = 12; // Bella Canvas 3001 Unisex Jersey
const PRINT_PROVIDER_ID = 29; // Monster Digital

const VARIANT_MAP: Record<string, Record<string, number>> = {
  black: { S: 18100, M: 18101, L: 18102, XL: 18103, "2XL": 18104, "3XL": 18105 },
  white: { S: 18540, M: 18541, L: 18542, XL: 18543, "2XL": 18544, "3XL": 18545 },
  navy: { S: 18396, M: 18397, L: 18398, XL: 18399, "2XL": 18400, "3XL": 18401 },
  red: { S: 18444, M: 18445, L: 18446, XL: 18447, "2XL": 18448, "3XL": 18449 },
  forest: { S: 18180, M: 18181, L: 18182, XL: 18183, "2XL": 18184, "3XL": 18185 },
  maroon: { S: 18372, M: 18373, L: 18374, XL: 18375, "2XL": 18376, "3XL": 18377 },
  "dark-grey": { S: 18140, M: 18141, L: 18142, XL: 18143, "2XL": 18144, "3XL": 18145 },
  "true-royal": { S: 18516, M: 18517, L: 18518, XL: 18519, "2XL": 18520, "3XL": 18521 },
  gold: { S: 18188, M: 18189, L: 18190, XL: 18191, "2XL": 18192, "3XL": 18193 },
  army: { S: 18060, M: 18061, L: 18062, XL: 18063, "2XL": 18064, "3XL": 18065 },
  orange: { S: 18420, M: 18421, L: 18422, XL: 18423, "2XL": 18424, "3XL": 18425 },
  "athletic-heather": { S: 18076, M: 18077, L: 18078, XL: 18079, "2XL": 18080, "3XL": 18081 },
  "soft-cream": { S: 18460, M: 18461, L: 18462, XL: 18463, "2XL": 18464, "3XL": 18465 },
  "light-blue": { S: 18356, M: 18357, L: 18358, XL: 18359, "2XL": 18360, "3XL": 18361 },
  pink: { S: 18436, M: 18437, L: 18438, XL: 18439, "2XL": 18440, "3XL": 18441 },
  kelly: { S: 18340, M: 18341, L: 18342, XL: 18343, "2XL": 18344, "3XL": 18345 },
  silver: { S: 18452, M: 18453, L: 18454, XL: 18455, "2XL": 18456, "3XL": 18457 },
  brown: { S: 39577, M: 39580, L: 39583, XL: 39586, "2XL": 39589, "3XL": 39592 },
  "heather-navy": { S: 18268, M: 18269, L: 18270, XL: 18271, "2XL": 18272, "3XL": 18273 },
};

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const PRICE_STANDARD = 2799;
const PRICE_PLUS = 3199;

// --- Etsy SEO Categories ---
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  unhinged: ["funny shirt", "unhinged shirt", "chaotic energy", "sarcastic tee", "bold statement shirt"],
  "dark-humor": ["dark humor shirt", "mental health shirt", "funny anxiety tee", "sarcastic gift", "dark comedy shirt"],
  "work-satire": ["funny coworker gift", "office humor shirt", "corporate satire tee", "work from home shirt", "anti corporate shirt"],
  introvert: ["introvert shirt", "antisocial shirt", "selectively social tee", "introvert gift", "funny introvert shirt"],
  parenting: ["funny mom shirt", "funny dad shirt", "parenting humor tee", "sarcastic mom gift", "tired parent shirt"],
  "social-commentary": ["thought provoking shirt", "opinion shirt", "bold statement tee", "controversial shirt", "normalize shirt"],
  "gen-z": ["gen z shirt", "internet culture tee", "main character energy", "chronically online shirt", "y2k aesthetic tee"],
  kids: ["funny kids shirt", "sarcastic kids tee", "kids attitude shirt", "funny toddler shirt", "youth graphic tee"],
  baby: ["funny baby onesie", "sarcastic baby bodysuit", "funny newborn gift", "baby shower gift", "audacity baby shirt"],
  occupation: ["funny nurse shirt", "funny teacher gift", "electrician humor tee", "occupation humor shirt", "trades humor shirt"],
  funny: ["funny shirt", "humor tee", "hilarious shirt", "sarcastic gift", "witty shirt"],
};

// --- Helpers ---

async function printifyFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${PRINTIFY_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PRINTIFY_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "AudacityTees/1.0",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateSeoContent(title: string, category: string, colors: string[], audience: string) {
  const keywords = CATEGORY_KEYWORDS[category] || ["funny shirt", "sarcastic tee"];
  const isBaby = audience === "baby";
  const isKids = audience === "kids";
  const audienceLabel = isBaby ? "Baby Bodysuit" : isKids ? "Youth Shirt" : "Shirt";
  const giftLabel = isBaby ? "Baby Shower Gift" : isKids ? "Gift for Kids" : "Gift for Him Her";

  const seoTitle = `${title} ${audienceLabel}, ${keywords[0].split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}, Sarcastic ${audienceLabel}, ${giftLabel}`.slice(0, 140);

  const seoDescription = [
    `${title} — for people who say what they think and wear what they mean.`,
    "",
    isBaby
      ? "This sarcastic baby bodysuit is the perfect way to announce that your tiny human already has a personality."
      : isKids
      ? "This funny kids shirt is for the little one who already has more attitude than most adults."
      : "This bold graphic tee is printed on a premium Bella+Canvas 3001 unisex jersey — the gold standard for comfort.",
    "",
    "DETAILS:",
    "\u2022 Soft, lightweight 100% combed ring-spun cotton",
    "\u2022 Retail fit with crew neckline",
    "\u2022 Side-seamed for a modern, tailored look",
    "\u2022 Pre-shrunk to maintain size wash after wash",
    "",
    `SIZING: ${isBaby ? "NB, 6M, 12M, 18M, 24M" : isKids ? "XS, S, M, L, XL" : "S, M, L, XL, 2XL, 3XL"}`,
    `COLORS: ${colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")).join(", ")}`,
    "",
    "PERFECT GIFT FOR:",
    "\u2022 People who say what everyone else is thinking",
    "\u2022 Sarcastic friends and coworkers",
    "\u2022 Birthday, holiday, and just-because gifts",
    "\u2022 Anyone who values honesty over politeness",
    "",
    "Ships within 3-5 business days from the USA.",
    "",
    "Wear the audacity.",
  ].join("\n");

  const phraseWords = title.toLowerCase().split(" ").slice(0, 4).join(" ");
  const seoTags = [
    ...keywords.slice(0, 5),
    `${audienceLabel.toLowerCase()}s with sayings`,
    `funny ${giftLabel.toLowerCase()}`,
    phraseWords,
    "graphic tee for adults",
    "bold statement shirt",
    "audacity tees",
    "thought provoking shirt",
    "controversial shirt",
  ].slice(0, 13);

  return { seoTitle, seoDescription, seoTags };
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, colors: colorsRaw, audience: audienceRaw, imageUrl, fileName } = body;

    if (!imageUrl || !title || !category || !colorsRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const audience = audienceRaw || "adult";
    const colors = (typeof colorsRaw === "string" ? colorsRaw.split(",") : colorsRaw as string[]).map((c: string) => c.trim()).filter(Boolean);
    if (colors.length === 0) {
      return NextResponse.json({ error: "Select at least one color" }, { status: 400 });
    }

    const slug = generateSlug(title);
    const { seoTitle, seoDescription, seoTags } = generateSeoContent(title, category, colors, audience);

    // Step 1: Upload image to Printify via URL (image already in Supabase Storage)
    const uploadResult = await printifyFetch("/uploads/images.json", {
      method: "POST",
      body: JSON.stringify({ file_name: fileName || "design.png", url: imageUrl }),
    });

    // Step 2: Build variants for selected colors
    const variants = [];
    for (const color of colors) {
      const colorVariants = VARIANT_MAP[color];
      if (!colorVariants) continue;
      for (const size of SIZES) {
        const variantId = colorVariants[size];
        const price = size === "2XL" || size === "3XL" ? PRICE_PLUS : PRICE_STANDARD;
        variants.push({ id: variantId, price, is_enabled: true });
      }
    }

    if (variants.length === 0) {
      return NextResponse.json({ error: "No valid color variants found" }, { status: 400 });
    }

    const variantIds = variants.map((v) => v.id);

    // Step 3: Create Printify product
    const product = await printifyFetch(`/shops/${PRINTIFY_SHOP_ID}/products.json`, {
      method: "POST",
      body: JSON.stringify({
        title: seoTitle,
        description: seoDescription,
        blueprint_id: BLUEPRINT_ID,
        print_provider_id: PRINT_PROVIDER_ID,
        variants,
        print_areas: [
          {
            variant_ids: variantIds,
            placeholders: [
              {
                position: "front",
                images: [{ id: uploadResult.id, x: 0.5, y: 0.33, scale: 0.9, angle: 0 }],
              },
            ],
          },
        ],
        tags: seoTags,
      }),
    });

    // Extract mockup URLs
    const mockups: string[] = [];
    for (const img of product.images || []) {
      if (img.src && mockups.length < colors.length) {
        mockups.push(img.src);
      }
    }

    // Step 4: Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: saved, error: dbError } = await supabase
      .from("products")
      .insert({
        name: seoTitle,
        slug: `${slug}-tee`,
        description: seoDescription,
        price: PRICE_STANDARD / 100,
        compare_at_price: 34.99,
        category,
        tags: seoTags,
        design_url: uploadResult.preview_url,
        mockup_urls: mockups,
        printify_product_id: product.id,
        printify_blueprint_id: BLUEPRINT_ID,
        print_provider_id: PRINT_PROVIDER_ID,
        colors: colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace("-", " ")),
        sizes: SIZES,
        status: "active",
        featured: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase error:", dbError);
    }

    // Step 5: Publish to Etsy via Printify
    let etsyPublished = false;
    try {
      await printifyFetch(`/shops/${PRINTIFY_SHOP_ID}/products/${product.id}/publish.json`, {
        method: "POST",
        body: JSON.stringify({
          title: true,
          description: true,
          images: true,
          variants: true,
          tags: true,
          keyFeatures: true,
          shipping_template: true,
        }),
      });
      etsyPublished = true;
    } catch (pubErr: unknown) {
      console.error("Etsy publish error:", pubErr);
    }

    return NextResponse.json({
      success: true,
      productId: product.id,
      supabaseId: saved?.id,
      etsyPublished,
      seoTitle,
      mockups,
      variantCount: variants.length,
      colorCount: colors.length,
    });
  } catch (err: unknown) {
    console.error("Upload pipeline error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
