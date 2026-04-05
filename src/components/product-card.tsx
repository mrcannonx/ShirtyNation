"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { useWishlist } from "./wishlist-provider";

export function ProductCard({ product }: { product: Product }) {
  const { isInWishlist, toggleItem } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const mockupImage = product.mockup_urls?.[0] || product.design_url;

  return (
    <div className="group relative bg-[#141414] rounded-xl overflow-hidden border border-[#262626] hover:border-[#E8630A]/30 transition-all duration-300">
      <Link href={`/shop/${product.slug}`}>
        <div className="relative aspect-square bg-[#0A0A0A] overflow-hidden">
          {mockupImage ? (
            <Image
              src={mockupImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#404040]">
              <span className="text-5xl">👕</span>
            </div>
          )}

          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-[#E8630A] hover:bg-[#E8630A] text-white text-[10px] font-bold">
              HOT
            </Badge>
          )}
        </div>
      </Link>

      {/* Wishlist heart */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggleItem(product);
        }}
        className="absolute top-2 right-2 p-1.5 bg-[#0A0A0A]/70 backdrop-blur-sm rounded-full hover:bg-[#0A0A0A] transition-colors z-10"
      >
        <Heart
          className={`h-4 w-4 transition-colors ${
            wishlisted ? "fill-[#E8630A] text-[#E8630A]" : "text-[#737373] hover:text-[#E8630A]"
          }`}
        />
      </button>

      <div className="p-3 sm:p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="text-sm font-medium text-[#E5E5E5] line-clamp-1 hover:text-[#E8630A] transition-colors">
            {product.name}
          </h3>
        </Link>

        <p className="text-[11px] text-[#737373] mt-0.5 capitalize">
          {product.category}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-base font-bold text-white">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-xs text-[#525252] line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {product.sizes.length > 0 && (
          <p className="text-[10px] text-[#525252] mt-1.5">
            {product.sizes.join(" / ")}
          </p>
        )}
      </div>
    </div>
  );
}
