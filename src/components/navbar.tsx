"use client";

import Link from "next/link";
import { ShoppingBag, Heart, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { useWishlist } from "./wishlist-provider";
import { CartSheet } from "./cart-sheet";
import { Button } from "./ui/button";

const NAV_CATEGORIES = [
  { name: "Shop All", href: "/shop" },
  { name: "Funny", href: "/category/funny" },
  { name: "Motivational", href: "/category/motivational" },
  { name: "Vintage", href: "/category/vintage" },
  { name: "Gaming", href: "/category/gaming" },
  { name: "Trending", href: "/category/trending" },
];

export function Navbar() {
  const { totalItems, setIsOpen } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">
                SHIRTY<span className="text-[#E8630A]">NATION</span>
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="text-sm font-medium text-[#A3A3A3] hover:text-white transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <Link
                href="/search"
                className="relative p-2 hover:bg-[#1C1C1C] rounded-full transition-colors"
                aria-label="Search shirts"
              >
                <Search className="h-5 w-5 text-[#A3A3A3]" />
              </Link>
              <Link
                href="/wishlist"
                className="relative p-2 hover:bg-[#1C1C1C] rounded-full transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5 text-[#A3A3A3]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#E8630A] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 hover:bg-[#1C1C1C] rounded-full transition-colors"
                aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
              >
                <ShoppingBag className="h-5 w-5 text-[#A3A3A3]" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#E8630A] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#A3A3A3] hover:text-white hover:bg-[#1C1C1C]"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="lg:hidden pb-4 space-y-1">
              {NAV_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="block px-3 py-2 text-sm font-medium text-[#A3A3A3] hover:text-white hover:bg-[#1C1C1C] rounded-md transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <CartSheet />
    </>
  );
}
