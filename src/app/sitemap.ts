import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const CATEGORIES = [
  "funny",
  "motivational",
  "vintage",
  "gaming",
  "dad-jokes",
  "coding",
  "animals",
  "music",
  "sports",
  "trending",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shirtynation.vercel.app";

  let products: { slug: string; created_at: string; updated_at: string }[] | null = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("products")
      .select("slug, created_at, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    products = data;
  }

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${baseUrl}/shop/${p.slug}`,
    lastModified: new Date(p.updated_at || p.created_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/category/${cat}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
