"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist-provider";
import { ProductGrid } from "@/components/product-grid";
import type { Metadata } from "next";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
        Your Wishlist
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        {items.length} {items.length === 1 ? "item" : "items"} saved
      </p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-12 w-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-500 mb-2">Your wishlist is empty</p>
          <p className="text-sm text-neutral-400 mb-6">
            Tap the heart icon on any product to save it here
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground font-medium h-8 px-4 rounded-lg text-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
