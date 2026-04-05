"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductGrid } from "@/components/product-grid";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Your Wishlist
      </h1>
      <p className="text-sm text-[#737373] mb-8">
        {items.length} {items.length === 1 ? "item" : "items"} saved
      </p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-12 w-12 text-[#404040] mx-auto mb-4" />
          <p className="text-[#737373] mb-2">Your wishlist is empty</p>
          <p className="text-sm text-[#525252] mb-6">
            Tap the heart icon on any product to save it here
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-10 px-6 rounded-lg text-sm transition-colors"
          >
            Browse Shirts
          </Link>
        </div>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
