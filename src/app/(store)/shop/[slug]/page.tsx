import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product-grid";
import { ProductDetail } from "./product-detail";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://shirtynation.vercel.app";

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
    || `${product.name} for ${formatPrice(product.price)}. Premium quality shirt in the ${product.category} category. Available in multiple sizes and colors. Free shipping over $35.`;

  const ogImage = product.mockup_urls?.[0] || product.design_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${BASE_URL}/shop/${slug}`,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 800,
              height: 800,
              alt: product.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `/shop/${slug}`,
    },
  };
}

function ProductJsonLd({ product }: { product: Product }) {
  const ogImage = product.mockup_urls?.[0] || product.design_url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ||
      `${product.name} - Premium quality shirt in the ${product.category} category.`,
    image: ogImage || undefined,
    brand: {
      "@type": "Brand",
      name: "ShirtyNation",
    },
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "USD",
      availability:
        product.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/shop/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "ShirtyNation",
      },
    },
    category: product.category,
    ...(product.sizes?.length > 0 && {
      size: product.sizes,
    }),
    ...(product.colors?.length > 0 && {
      color: product.colors,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function Breadcrumbs({ product }: { product: Product }) {
  const categoryName =
    product.category.charAt(0).toUpperCase() +
    product.category.slice(1).replace("-", " ");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${BASE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: categoryName,
        item: `${BASE_URL}/category/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.name,
        item: `${BASE_URL}/shop/${product.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
          <li>
            <Link
              href={`/category/${product.category}`}
              className="hover:text-white transition-colors"
            >
              {categoryName}
            </Link>
          </li>
          <li>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="text-[#A3A3A3] truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>
    </>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <ProductJsonLd product={product} />
      <Breadcrumbs product={product} />
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
