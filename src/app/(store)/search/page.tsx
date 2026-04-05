import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import { SearchInput } from "./search-input";
import type { Product } from "@/lib/types";

export const revalidate = 0;

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q;

  if (query) {
    return {
      title: `Search results for "${query}" | ShirtyNation`,
      description: `Find shirts matching "${query}" at ShirtyNation. Browse unique t-shirt designs across every niche.`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: "Search Shirts | ShirtyNation",
    description:
      "Search thousands of unique t-shirt designs at ShirtyNation. Find shirts by name, category, or style.",
    alternates: {
      canonical: "/search",
    },
  };
}

async function searchProducts(query: string): Promise<Product[]> {
  if (!query || query.trim().length === 0) return [];

  const supabase = await createClient();
  const searchTerm = query.trim();

  // Search by name using ilike, then also by category and tags
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .or(
      `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`
    )
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  return (data ?? []) as Product[];
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q || "";
  const products = await searchProducts(query);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-6">
          Search Shirts
        </h1>
        <SearchInput defaultValue={query} />
      </div>

      {hasQuery && (
        <p className="text-sm text-[#737373] mb-6">
          {products.length} {products.length === 1 ? "result" : "results"} for{" "}
          <span className="text-white font-medium">&ldquo;{query}&rdquo;</span>
        </p>
      )}

      {hasQuery && products.length > 0 && (
        <ProductGrid products={products} />
      )}

      {hasQuery && products.length === 0 && (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-[#404040] mx-auto mb-4" />
          <p className="text-[#737373] text-lg mb-2">
            No shirts found for &ldquo;{query}&rdquo;
          </p>
          <p className="text-[#525252] text-sm mb-6">
            Try a different search term or browse our categories.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-10 px-6 rounded-lg text-sm transition-colors"
          >
            Browse All Shirts
          </Link>
        </div>
      )}

      {!hasQuery && (
        <div className="text-center py-16">
          <Search className="h-12 w-12 text-[#404040] mx-auto mb-4" />
          <p className="text-[#737373] text-lg">
            Type a search term to find shirts
          </p>
          <p className="text-[#525252] text-sm mt-1">
            Try &ldquo;funny cat&rdquo;, &ldquo;motivational&rdquo;, or &ldquo;vintage&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
