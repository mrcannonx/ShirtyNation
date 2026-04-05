"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowLeft, Truck, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { cartItemKey } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { getShippingCost, amountUntilFreeShipping, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping = getShippingCost(totalPrice);
  const remaining = amountUntilFreeShipping(totalPrice);
  const orderTotal = totalPrice + shipping;

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-5xl mb-4">👕</p>
        <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
        <p className="text-[#737373] mb-6">
          Find your next favorite shirt.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-10 px-6 rounded-lg text-sm transition-colors"
        >
          Browse Shirts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/shop"
        className="inline-flex items-center text-sm text-[#737373] hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Continue Shopping
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        Shopping Cart ({items.reduce((s, i) => s + i.quantity, 0)})
      </h1>

      {/* Free shipping progress */}
      {remaining > 0 ? (
        <div className="mb-6 p-3 bg-[#E8630A]/10 border border-[#E8630A]/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-[#E8630A]" />
            <span className="text-[#E8630A]">
              Add <span className="font-bold">{formatPrice(remaining)}</span> more for{" "}
              <span className="font-bold">FREE shipping!</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E8630A] rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Truck className="h-4 w-4" />
            <span className="font-medium">You qualify for FREE shipping!</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const key = cartItemKey(item);
          const img = item.product.mockup_urls?.[0] || item.product.design_url;
          return (
            <div
              key={key}
              className="flex gap-4 p-4 bg-[#141414] border border-[#262626] rounded-xl"
            >
              <div className="relative h-28 w-24 rounded-lg overflow-hidden bg-[#0A0A0A] flex-shrink-0">
                {img ? (
                  <Image
                    src={img}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#404040] text-2xl">
                    👕
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-[#737373] mt-0.5">
                      {item.size} / {item.color}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white whitespace-nowrap">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3 bg-[#0A0A0A] rounded-lg border border-[#262626] px-2 py-1">
                    <button
                      onClick={() => updateQuantity(key, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-0.5 text-[#737373] hover:text-white disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm text-white w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(key, item.quantity + 1)}
                      className="p-0.5 text-[#737373] hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(key)}
                    className="p-2 text-[#525252] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-5 bg-[#141414] rounded-xl border border-[#262626]">
        <div className="flex justify-between text-base mb-1">
          <span className="text-[#A3A3A3]">Subtotal</span>
          <span className="font-medium text-white">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-[#525252]">Shipping</span>
          {shipping === 0 ? (
            <span className="font-medium text-green-400">FREE</span>
          ) : (
            <span className="text-[#A3A3A3]">{formatPrice(shipping)}</span>
          )}
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-[#262626] pt-3 mb-4 text-white">
          <span>Total</span>
          <span>{formatPrice(orderTotal)}</span>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 mb-3">
            {error}
          </p>
        )}

        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full bg-[#E8630A] hover:bg-[#C2410C] text-white font-semibold h-11"
        >
          {loading ? "Redirecting to checkout..." : "Proceed to Checkout"}
        </Button>
      </div>
    </div>
  );
}
