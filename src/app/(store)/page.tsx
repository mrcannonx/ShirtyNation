import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { CategoryGrid } from "@/components/category-grid";
import { ProductGrid } from "@/components/product-grid";
import { NewsletterForm } from "@/components/newsletter-form";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

async function getFeaturedProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function getLatestProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedProducts(),
    getLatestProducts(),
  ]);

  const displayProducts = featured.length > 0 ? featured : latest;

  return (
    <>
      <Hero />

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
          Browse by Category
        </h2>
        <CategoryGrid />
      </section>

      {/* Featured / Latest Products */}
      {displayProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {featured.length > 0 ? "Featured Shirts" : "New Arrivals"}
            </h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-[#E8630A] hover:text-[#F59E0B] flex items-center gap-1"
            >
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <ProductGrid products={displayProducts} />
        </section>
      )}

      {/* Newsletter Banner */}
      <section className="border-y border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Never Miss a Drop
          </h2>
          <p className="text-[#737373] text-sm mb-6 max-w-md mx-auto">
            New designs land every week across every niche. Get notified first.
          </p>
          <NewsletterForm variant="banner" />
        </div>
      </section>

      {/* Value Props */}
      <section className="border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-white">Every Niche</p>
              <p className="text-sm text-[#737373] mt-1">
                Thousands of designs from funny to motivational to vintage
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Premium Quality</p>
              <p className="text-sm text-[#737373] mt-1">
                Bella+Canvas & Comfort Colors blanks. Soft. Durable.
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Fast Shipping</p>
              <p className="text-sm text-[#737373] mt-1">
                Printed & shipped within 3-5 business days
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
