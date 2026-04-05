import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import { ProductDetail } from "./product-detail";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
  return data as Product | null;
}

async function getRelatedProducts(
  category: string,
  excludeId: string
): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("category", category)
    .eq("status", "active")
    .neq("id", excludeId)
    .limit(4);
  return (data ?? []) as Product[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Shirt Not Found | ShirtyNation" };
  }

  const title = `${product.name} — ${formatPrice(product.price)} | ShirtyNation`;
  const description = product.description
    || `${product.name} for ${formatPrice(product.price)}. Premium quality shirt in the ${product.category} category. Available in multiple sizes and colors.`;

  const ogImage = product.mockup_urls?.[0] || product.design_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-6">
            You Might Also Like
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
