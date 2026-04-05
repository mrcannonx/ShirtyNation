"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, Check, Heart } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { useWishlist } from "@/components/wishlist-provider";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleItem } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const wishlisted = isInWishlist(product.id);
  const images = product.mockup_urls?.length > 0 ? product.mockup_urls : [product.design_url];

  function handleAdd() {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem(product, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Images */}
      <div className="space-y-3">
        <div className="relative bg-[#141414] rounded-xl overflow-hidden border border-[#262626]">
          {images[selectedImage] ? (
            <Image
              src={images[selectedImage]}
              alt={`${product.name} - ${product.category} t-shirt by ShirtyNation`}
              width={800}
              height={800}
              className="w-full h-auto object-contain"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="aspect-square flex items-center justify-center text-[#404040]">
              <span className="text-6xl">👕</span>
            </div>
          )}

          {product.featured && (
            <Badge className="absolute top-3 left-3 bg-[#E8630A] hover:bg-[#E8630A] text-white font-bold text-sm px-3 py-1">
              HOT
            </Badge>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                aria-label={`View image ${i + 1} of ${product.name}`}
                className={`relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                  selectedImage === i
                    ? "border-[#E8630A]"
                    : "border-[#262626] hover:border-[#404040]"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} - view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <p className="text-sm text-[#737373] capitalize">{product.category}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
          {product.name}
        </h1>

        <div className="flex items-baseline gap-3 mt-4">
          <span className="text-3xl font-bold text-white">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-lg text-[#525252] line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-[#A3A3A3] text-sm leading-relaxed mt-5">
            {product.description}
          </p>
        )}

        {/* Size Selector */}
        {product.sizes.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-white mb-2">
              Size {sizeError && <span className="text-red-400 ml-1">- Please select a size</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSize(size);
                    setSizeError(false);
                  }}
                  aria-label={`Select size ${size}`}
                  aria-pressed={selectedSize === size}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedSize === size
                      ? "bg-[#E8630A] border-[#E8630A] text-white"
                      : "bg-[#141414] border-[#262626] text-[#A3A3A3] hover:border-[#404040]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Selector */}
        {product.colors.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium text-white mb-2">
              Color: <span className="text-[#A3A3A3]">{selectedColor}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                  aria-pressed={selectedColor === color}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    selectedColor === color
                      ? "bg-[#E8630A] border-[#E8630A] text-white"
                      : "bg-[#141414] border-[#262626] text-[#A3A3A3] hover:border-[#404040]"
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-8">
          <Button
            onClick={handleAdd}
            size="lg"
            className={`flex-1 sm:flex-none px-12 text-base font-semibold transition-all ${
              added
                ? "bg-green-600 hover:bg-green-600"
                : "bg-[#E8630A] hover:bg-[#C2410C]"
            }`}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart
              </>
            )}
          </Button>

          <button
            onClick={() => toggleItem(product)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`p-3 rounded-lg border transition-colors ${
              wishlisted
                ? "border-[#E8630A]/30 bg-[#E8630A]/10 text-[#E8630A]"
                : "border-[#262626] text-[#525252] hover:text-[#E8630A] hover:border-[#E8630A]/30"
            }`}
          >
            <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Shipping Info */}
        <div className="mt-8 pt-6 border-t border-[#262626] space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-sm">📦</span>
            <div>
              <p className="text-sm font-medium text-white">Printed & Shipped</p>
              <p className="text-xs text-[#737373]">Made to order. Ships within 3-5 business days.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm">👕</span>
            <div>
              <p className="text-sm font-medium text-white">Premium Blanks</p>
              <p className="text-xs text-[#737373]">
                Bella+Canvas & Comfort Colors. Soft, durable, pre-shrunk.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-sm">🚚</span>
            <div>
              <p className="text-sm font-medium text-white">Free Shipping Over $35</p>
              <p className="text-xs text-[#737373]">Standard shipping on qualifying orders.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
