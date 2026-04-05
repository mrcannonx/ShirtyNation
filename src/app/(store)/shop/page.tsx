import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import { Filters } from "@/components/filters";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  funny: {
    title: "Funny Shirts",
    description:
      "Browse hilarious funny t-shirts that will make everyone laugh. Sarcastic, witty, and outright funny designs on premium quality tees.",
  },
  motivational: {
    title: "Motivational Shirts",
    description:
      "Inspire greatness with motivational t-shirts. Hustle, grind, and positive vibes printed on premium quality blanks.",
  },
  vintage: {
    title: "Vintage Shirts",
    description:
      "Throwback vintage t-shirt designs with retro aesthetics. 70s, 80s, and 90s inspired graphics on soft premium tees.",
  },
  gaming: {
    title: "Gaming Shirts",
    description:
      "Level up your wardrobe with gaming t-shirts. Designs for PC gamers, console players, and retro gaming fans.",
  },
  "dad-jokes": {
    title: "Dad Joke Shirts",
    description:
      "The ultimate dad joke t-shirts. Puns, groaners, and classic dad humor on comfortable premium tees.",
  },
  coding: {
    title: "Coding Shirts",
    description:
      "Developer and programmer t-shirts with coding humor. JavaScript, Python, and software engineering designs.",
  },
  animals: {
    title: "Animal Shirts",
    description:
      "Animal lover t-shirts featuring cats, dogs, and wildlife designs. Cute, funny, and artistic animal graphics.",
  },
  music: {
    title: "Music Shirts",
    description:
      "Music-inspired t-shirts for every genre. Rock, hip-hop, jazz, and electronic music designs on premium tees.",
  },
  sports: {
    title: "Sports Shirts",
    description:
      "Sports-themed t-shirts for athletes and fans. Football, basketball, soccer, and fitness designs.",
  },
  trending: {
    title: "Trending Shirts",
    description:
      "The hottest trending t-shirt designs right now. Stay ahead of the curve with the latest shirt drops.",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string; sort?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;

  if (category && category !== "all" && CATEGORY_META[category]) {
    const meta = CATEGORY_META[category];
    return {
      title: `${meta.title} | ShirtyNation`,
      description: meta.description,
      openGraph: {
        title: `${meta.title} | ShirtyNation`,
        description: meta.description,
      },
      alternates: {
        canonical: `/shop?category=${category}`,
      },
    };
  }

  return {
    title: "Shop All Shirts | ShirtyNation",
    description:
      "Browse thousands of unique shirt designs across every niche. Funny, motivational, vintage, gaming, coding, dad jokes and more. Premium quality tees.",
    openGraph: {
      title: "Shop All Shirts | ShirtyNation",
      description:
        "Browse thousands of unique shirt designs across every niche. Premium quality tees.",
    },
    alternates: {
      canonical: "/shop",
    },
  };
}

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    size?: string;
    sort?: string;
  }>;
}

async function getProducts(params: {
  category?: string;
  size?: string;
  sort?: string;
}): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select("*").eq("status", "active");

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category);
  }

  if (params.size && params.size !== "all") {
    query = query.contains("sizes", [params.size]);
  }

  switch (params.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "popular":
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query.limit(60);
  return (data ?? []) as Product[];
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const products = await getProducts(params);

  const categoryTitle = params.category && params.category !== "all"
    ? params.category.charAt(0).toUpperCase() + params.category.slice(1).replace("-", " ")
    : "All Shirts";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {categoryTitle}
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            {products.length} {products.length === 1 ? "design" : "designs"}
          </p>
        </div>
        <Suspense>
          <Filters />
        </Suspense>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👕</p>
          <p className="text-[#737373] text-lg">No shirts found in this category yet.</p>
          <p className="text-[#525252] text-sm mt-1">Check back soon — new designs drop weekly.</p>
        </div>
      )}
    </div>
  );
}
