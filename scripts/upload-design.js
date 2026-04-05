#!/usr/bin/env node
/**
 * ShirtyNation — Automated Design Upload Pipeline
 *
 * Takes a PNG file, uploads to Printify, creates product with variants,
 * and saves to Supabase. Full automation from file drop to live on store.
 *
 * File naming convention:
 *   CATEGORY__slug-name__colors.png
 *   funny__coffee-before-talkie__white,heather.png
 *   gaming__natural-20-critical-hit__black,navy.png
 *
 * Usage: node scripts/upload-design.js /path/to/design.png
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { execSync } = require("child_process");

// --- Config ---
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const PRINTIFY_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BLUEPRINT_ID = 12; // Bella Canvas 3001 Unisex Jersey
const PRINT_PROVIDER_ID = 29; // Monster Digital

// Variant IDs for Bella Canvas 3001 via Monster Digital
const VARIANT_MAP = {
  white:   { S: 18540, M: 18541, L: 18542, XL: 18543, "2XL": 18544, "3XL": 18545 },
  black:   { S: 18100, M: 18101, L: 18102, XL: 18103, "2XL": 18104, "3XL": 18105 },
  navy:    { S: 18396, M: 18397, L: 18398, XL: 18399, "2XL": 18400, "3XL": 18401 },
};

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const PRICE_STANDARD = 2499; // $24.99 in cents
const PRICE_PLUS = 2799;     // $27.99 for 2XL/3XL

// --- Helpers ---

function apiRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === "https:" ? https : http;

    const req = transport.request(parsedUrl, options, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 300)}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Parse error (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error("Timeout")); });
    if (body) req.write(body);
    req.end();
  });
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function parseFilename(filepath) {
  const basename = path.basename(filepath, ".png");
  const parts = basename.split("__");

  if (parts.length < 2) {
    throw new Error(
      `Invalid filename format. Expected: CATEGORY__slug-name.png (colors optional)\n` +
      `Got: ${basename}.png\n` +
      `Example: funny__coffee-before-talkie.png`
    );
  }

  const category = parts[0].toLowerCase();
  const slug = parts[1].toLowerCase();
  const colors = parts[2] ? parts[2].toLowerCase().split(",").map((c) => c.trim()) : ["white"]; // default white, override via filename
  const title = slugToTitle(slug) + " Tee";

  return { category, slug, title, colors };
}

// --- Upscale ---

const REALESRGAN_BIN = path.join(process.env.HOME, ".local/bin/realesrgan-ncnn-vulkan");
const REALESRGAN_MODELS = path.join(process.env.HOME, ".local/share/realesrgan/models");
const MIN_WIDTH = 3000;

async function upscaleIfNeeded(filepath) {
  const sizeCheck = execSync(
    "python3 -c \"from PIL import Image; img=Image.open('" + filepath.replace(/'/g, "\\'") + "'); print(str(img.size[0])+'x'+str(img.size[1]))\"",
    { encoding: "utf8" }
  ).trim();
  const [w, h] = sizeCheck.split("x").map(Number);

  if (w >= MIN_WIDTH) {
    console.log("  📐 Resolution OK: " + w + "x" + h + " (>= " + MIN_WIDTH + "px)");
    return filepath;
  }

  if (!fs.existsSync(REALESRGAN_BIN)) {
    console.log("  ⚠️  Real-ESRGAN not found, skipping upscale (" + w + "x" + h + ")");
    return filepath;
  }

  // Pick scale factor: keep result under ~3500px to stay within Printify upload limit
  const maxDim = Math.max(w, h);
  const scale = (maxDim * 4 <= 3500) ? 4 : (maxDim * 3 <= 3500) ? 3 : 2;
  const targetW = w * scale;
  const targetH = h * scale;

  console.log("  📐 Upscaling: " + w + "x" + h + " -> " + targetW + "x" + targetH + " (" + scale + "x Real-ESRGAN)...");
  const outPath = filepath.replace(".png", "-" + scale + "x.png");

  execSync(
    "\"" + REALESRGAN_BIN + "\" -i \"" + filepath + "\" -o \"" + outPath + "\" -s " + scale + " -n realesrgan-x4plus -m \"" + REALESRGAN_MODELS + "\"",
    { stdio: "pipe", timeout: 120000 }
  );

  const newSize = execSync(
    "python3 -c \"from PIL import Image; img=Image.open('" + outPath.replace(/'/g, "\\'") + "'); print(str(img.size[0])+'x'+str(img.size[1]))\"",
    { encoding: "utf8" }
  ).trim();
  console.log("  ✅ Upscaled to " + newSize);

  return outPath;
}

// --- SEO Content Generator ---

const CATEGORY_KEYWORDS = {
  funny: ["funny", "humor", "hilarious", "sarcastic", "witty", "comedy"],
  motivational: ["motivational", "inspirational", "positive", "empowering", "uplifting"],
  vintage: ["vintage", "retro", "throwback", "nostalgic", "classic", "old school"],
  gaming: ["gaming", "gamer", "video game", "retro gaming", "nerd", "geek"],
  sports: ["sports", "athletic", "fitness", "workout", "gym"],
  music: ["music", "band", "rock", "concert", "musician"],
  "dad-jokes": ["dad", "father", "dad joke", "dad humor", "papa", "daddy"],
  coding: ["coding", "programmer", "developer", "software engineer", "tech", "code"],
  animals: ["animal", "pet", "cute", "wildlife", "animal lover"],
  trending: ["trending", "viral", "popular", "hot", "must-have"],
};

function generateSeoContent(title, category, colors) {
  const humanTitle = title.replace(" Tee", "");
  const keywords = CATEGORY_KEYWORDS[category] || [category];
  const colorList = colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ");
  const primaryKeyword = keywords[0];
  const secondaryKeyword = keywords[1] || keywords[0];

  // SEO-optimized title — includes primary keyword + product type
  const seoTitle = `${humanTitle} T-Shirt | ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Graphic Tee`;

  // Rich description for both our store and eBay
  const seoDescription = [
    `${humanTitle} — the perfect ${primaryKeyword} graphic tee for anyone who gets it.`,
    ``,
    `This ${secondaryKeyword} design is printed on a premium Bella+Canvas 3001 unisex jersey t-shirt — the gold standard for comfort and durability.`,
    ``,
    `WHY YOU'LL LOVE IT:`,
    `• Soft, lightweight 100% combed ring-spun cotton`,
    `• Retail fit with crew neckline`,
    `• Side-seamed for a modern, tailored look`,
    `• Durable ribbed collar that holds its shape`,
    `• Pre-shrunk to maintain size wash after wash`,
    ``,
    `SIZING: Available in S, M, L, XL, 2XL, 3XL — unisex fit works for everyone`,
    `COLOR: ${colorList}`,
    ``,
    `Perfect as a gift for ${primaryKeyword} fans or treat yourself to a tee that actually means something.`,
    ``,
    `Printed with care using DTG (direct-to-garment) technology for vibrant, long-lasting color that won't crack or fade.`,
    ``,
    `Ships within 3-5 business days. Free shipping on orders over $35.`,
  ].join("\n");

  // Tags for Printify + eBay discoverability
  const seoTags = [
    ...keywords.slice(0, 4),
    "graphic tee",
    "t-shirt",
    "unisex",
    "gift",
    humanTitle.toLowerCase().split(" ").slice(0, 3).join(" "),
    `${primaryKeyword} shirt`,
    `${primaryKeyword} gift`,
  ].slice(0, 13); // Printify/eBay tag limits

  return { seoTitle, seoDescription, seoTags };
}

// --- Pipeline Steps ---

async function uploadToPrintify(filepath) {
  console.log("  📤 Uploading design to Printify...");
  const imgData = fs.readFileSync(filepath);
  const b64 = imgData.toString("base64");

  const result = await apiRequest(
    "https://api.printify.com/v1/uploads/images.json",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRINTIFY_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "ShirtyNation/1.0",
      },
    },
    JSON.stringify({ file_name: path.basename(filepath), contents: b64 })
  );

  console.log(`  ✅ Uploaded: ${result.id} (${result.width}x${result.height})`);
  return result;
}

async function createPrintifyProduct(imageId, title, colors, seoTitle, seoDescription, seoTags) {
  console.log("  🛒 Creating Printify product...");

  // Build variant list for selected colors
  const variants = [];
  for (const color of colors) {
    const colorVariants = VARIANT_MAP[color];
    if (!colorVariants) {
      console.log(`  ⚠️  Unknown color "${color}", skipping`);
      continue;
    }
    for (const size of SIZES) {
      const variantId = colorVariants[size];
      const price = size === "2XL" || size === "3XL" ? PRICE_PLUS : PRICE_STANDARD;
      variants.push({ id: variantId, price, is_enabled: true });
    }
  }

  if (variants.length === 0) throw new Error("No valid variants");

  const variantIds = variants.map((v) => v.id);

  const result = await apiRequest(
    `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRINTIFY_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "ShirtyNation/1.0",
      },
    },
    JSON.stringify({
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
              images: [{ id: imageId, x: 0.5, y: 0.33, scale: 0.9, angle: 0 }],
            },
          ],
        },
      ],
      tags: seoTags,
    })
  );

  // Extract front mockup URLs (one per color)
  const mockups = [];
  const seenColors = new Set();
  for (const img of result.images || []) {
    if (img.src && img.src.includes("front-2")) {
      const vids = img.variant_ids || [];
      // Check which color this mockup belongs to
      for (const color of colors) {
        const colorVids = Object.values(VARIANT_MAP[color] || {});
        if (vids.some((v) => colorVids.includes(v)) && !seenColors.has(color)) {
          seenColors.add(color);
          mockups.push(img.src);
          break;
        }
      }
    }
  }

  console.log(`  ✅ Product created: ${result.id} (${variants.length} variants, ${mockups.length} mockups)`);
  return { productId: result.id, mockups };
}

async function saveToSupabase(slug, title, category, colors, price, mockups, printifyProductId, designUrl, seoTitle, seoDescription, seoTags) {
  console.log("  💾 Saving to Supabase...");

  const product = {
    name: seoTitle,
    slug: slug + "-tee",
    description: seoDescription,
    price: PRICE_STANDARD / 100,
    compare_at_price: 34.99,
    category,
    subcategory: null,
    tags: seoTags,
    design_url: designUrl,
    mockup_urls: mockups,
    printify_product_id: printifyProductId,
    printify_blueprint_id: BLUEPRINT_ID,
    print_provider_id: PRINT_PROVIDER_ID,
    colors: colors.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
    sizes: SIZES,
    status: "active",
    featured: false,
  };

  const result = await apiRequest(
    `${SUPABASE_URL}/rest/v1/products`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
    },
    JSON.stringify(product)
  );

  const saved = Array.isArray(result) ? result[0] : result;
  console.log(`  ✅ Saved to Supabase: ${saved.id}`);
  return saved;
}

// --- Main ---

async function main() {
  const filepath = process.argv[2];
  const categoryArg = process.argv[3];   // e.g. "funny"
  const slugArg = process.argv[4];       // e.g. "i-paused-my-game-to-be-here"
  const colorsArg = process.argv[5];     // e.g. "black" or "black,navy"

  if (!filepath) {
    console.error("Usage:");
    console.error("  Option 1 (named file): node upload-design.js CATEGORY__slug-name.png");
    console.error("  Option 2 (any file):   node upload-design.js /path/to/any.png CATEGORY slug-name colors");
    console.error("");
    console.error("Examples:");
    console.error("  node upload-design.js funny__coffee-before-talkie.png");
    console.error("  node upload-design.js 'Retro pause menu.png' funny i-paused-my-game-to-be-here black");
    process.exit(1);
  }

  if (!fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    process.exit(1);
  }

  if (!PRINTIFY_TOKEN || !PRINTIFY_SHOP_ID || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing env vars. Ensure .env.local has PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  try {
    let category, slug, title, colors;

    if (categoryArg && slugArg) {
      // Option 2: args provided — any filename works
      category = categoryArg.toLowerCase();
      slug = slugArg.toLowerCase();
      title = slugToTitle(slug) + " Tee";
      colors = colorsArg ? colorsArg.toLowerCase().split(",").map((c) => c.trim()) : ["white"];
    } else {
      // Option 1: parse from filename
      ({ category, slug, title, colors } = parseFilename(filepath));
    }

    // Generate SEO content
    const { seoTitle, seoDescription, seoTags } = generateSeoContent(title, category, colors);

    console.log(`\n🔥 ShirtyNation Pipeline`);
    console.log(`  📋 Title: ${seoTitle}`);
    console.log(`  🏷️  Category: ${category}`);
    console.log(`  🎨 Colors: ${colors.join(", ")}`);
    console.log(`  🏷️  Tags: ${seoTags.slice(0, 5).join(", ")}...`);
    console.log("");

    // Step 1: Upload to Printify (design should be pre-upscaled via Canva)
    const upload = await uploadToPrintify(filepath);

    // Step 2: Create Printify product with SEO content
    const { productId, mockups } = await createPrintifyProduct(upload.id, title, colors, seoTitle, seoDescription, seoTags);

    // Step 3: Save to Supabase with SEO content
    await saveToSupabase(slug, title, category, colors, PRICE_STANDARD / 100, mockups, productId, upload.preview_url, seoTitle, seoDescription, seoTags);

    // Step 4: Move to processed
    const processedDir = path.join(path.dirname(filepath), "processed");
    if (fs.existsSync(processedDir)) {
      const dest = path.join(processedDir, path.basename(filepath));
      fs.renameSync(filepath, dest);
      console.log(`  📂 Moved to processed/`);
      // Clean up any upscaled versions
      const upscalePattern = filepath.replace(".png", "-");
      const dir = path.dirname(filepath);
      fs.readdirSync(dir).filter(f => f.startsWith(path.basename(upscalePattern))).forEach(f => {
        fs.renameSync(path.join(dir, f), path.join(processedDir, f));
      });
    }

    console.log(`\n🎉 LIVE on ShirtyNation!`);
    console.log(`   https://shirtynation.vercel.app/shop/${slug}-tee`);
    console.log("");
  } catch (err) {
    console.error(`\n❌ Pipeline failed: ${err.message}`);
    process.exit(1);
  }
}

main();
