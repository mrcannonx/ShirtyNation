import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import type { Product } from "@/lib/types";

export const revalidate = 60;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://shirtynation.vercel.app";

const CATEGORY_DATA: Record<
  string,
  { name: string; title: string; description: string; icon: string }
> = {
  funny: {
    name: "Funny",
    title: "Funny Shirts",
    description:
      "Browse hilarious funny t-shirts that will make everyone laugh. Sarcastic, witty, and outright funny designs on premium quality tees at ShirtyNation.",
    icon: "😂",
  },
  motivational: {
    name: "Motivational",
    title: "Motivational Shirts",
    description:
      "Inspire greatness with motivational t-shirts. Hustle, grind, and positive vibes printed on premium quality blanks at ShirtyNation.",
    icon: "💪",
  },
  vintage: {
    name: "Vintage",
    title: "Vintage Shirts",
    description:
      "Throwback vintage t-shirt designs with retro aesthetics. 70s, 80s, and 90s inspired graphics on soft premium tees at ShirtyNation.",
    icon: "📻",
  },
  gaming: {
    name: "Gaming",
    title: "Gaming Shirts",
    description:
      "Level up your wardrobe with gaming t-shirts. Designs for PC gamers, console players, and retro gaming fans at ShirtyNation.",
    icon: "🎮",
  },
  "dad-jokes": {
    name: "Dad Jokes",
    title: "Dad Joke Shirts",
    description:
      "The ultimate dad joke t-shirts. Puns, groaners, and classic dad humor on comfortable premium tees at ShirtyNation.",
    icon: "👨",
  },
  coding: {
    name: "Coding",
    title: "Coding Shirts",
    description:
      "Developer and programmer t-shirts with coding humor. JavaScript, Python, and software engineering designs at ShirtyNation.",
    icon: "💻",
  },
  animals: {
    name: "Animals",
    title: "Animal Shirts",
    description:
      "Animal lover t-shirts featuring cats, dogs, and wildlife designs. Cute, funny, and artistic animal graphics at ShirtyNation.",
    icon: "🐾",
  },
  music: {
    name: "Music",
    title: "Music Shirts",
    description:
      "Music-inspired t-shirts for every genre. Rock, hip-hop, jazz, and electronic music designs on premium tees at ShirtyNation.",
    icon: "🎵",
  },
  sports: {
    name: "Sports",
    title: "Sports Shirts",
    description:
      "Sports-themed t-shirts for athletes and fans. Football, basketball, soccer, and fitness designs at ShirtyNation.",
    icon: "⚽",
  },
  trending: {
    name: "Trending",
    title: "Trending Shirts",
    description:
      "The hottest trending t-shirt designs right now. Stay ahead of the curve with the latest shirt drops at ShirtyNation.",
    icon: "🔥",
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORY_DATA[slug];

  if (!cat) {
    return { title: "Category Not Found | ShirtyNation" };
  }

  return {
    title: `${cat.title} | ShirtyNation`,
    description: cat.description,
    openGraph: {
      title: `${cat.title} | ShirtyNation`,
      description: cat.description,
      url: `${BASE_URL}/category/${slug}`,
    },
    twitter: {
      card: "summary",
      title: `${cat.title} | ShirtyNation`,
      description: cat.description,
    },
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORY_DATA).map((slug) => ({ slug }));
}

async function getCategoryProducts(category: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data ?? []) as Product[];
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = CATEGORY_DATA[slug];

  if (!cat) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-white mb-3">Category not found</h1>
        <p className="text-[#737373] mb-6">
          The category you are looking for does not exist.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-10 px-6 rounded-lg text-sm transition-colors"
        >
          Browse All Shirts
        </Link>
      </div>
    );
  }

  const products = await getCategoryProducts(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-[#737373]">
          <li>
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href="/shop" className="hover:text-white transition-colors">
              Shop
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="text-[#A3A3A3]">{cat.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{cat.icon}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {cat.title}
          </h1>
        </div>
        <p className="text-sm text-[#737373] max-w-2xl">
          {cat.description}
        </p>
        <p className="text-sm text-[#525252] mt-2">
          {products.length} {products.length === 1 ? "design" : "designs"} available
        </p>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👕</p>
          <p className="text-[#737373] text-lg">
            No shirts in {cat.name} yet.
          </p>
          <p className="text-[#525252] text-sm mt-1">
            Check back soon — new designs drop weekly.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-10 px-6 rounded-lg text-sm transition-colors"
          >
            Browse All Shirts
          </Link>
        </div>
      )}
    </div>
  );
}
