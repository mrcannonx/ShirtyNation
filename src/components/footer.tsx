import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const CATEGORIES = [
  { name: "Funny Shirts", href: "/category/funny" },
  { name: "Motivational Shirts", href: "/category/motivational" },
  { name: "Vintage Shirts", href: "/category/vintage" },
  { name: "Gaming Shirts", href: "/category/gaming" },
  { name: "Dad Joke Shirts", href: "/category/dad-jokes" },
  { name: "Coding Shirts", href: "/category/coding" },
  { name: "Animal Shirts", href: "/category/animals" },
  { name: "Music Shirts", href: "/category/music" },
  { name: "Sports Shirts", href: "/category/sports" },
  { name: "Trending Shirts", href: "/category/trending" },
];

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#262626] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" aria-label="ShirtyNation home">
              <span className="text-lg font-black text-white tracking-tight">
                SHIRTY<span className="text-[#E8630A]">NATION</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[#737373]">
              The largest selection of shirts in every niche.
              Premium quality, designed with AI, shipped to your door.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.href} className="text-[#737373] hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Shop
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="text-[#737373] hover:text-white transition-colors">All Shirts</Link></li>
              <li><Link href="/search" className="text-[#737373] hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/wishlist" className="text-[#737373] hover:text-white transition-colors">Wishlist</Link></li>
              <li><Link href="/cart" className="text-[#737373] hover:text-white transition-colors">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Stay Updated
            </h3>
            <p className="text-sm text-[#737373] mb-3">
              New designs drop every week. Get first access.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-[#262626] mt-10 pt-6 text-xs text-[#525252]">
          &copy; {new Date().getFullYear()} ShirtyNation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
