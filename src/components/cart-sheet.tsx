"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Truck, Minus, Plus } from "lucide-react";
import { useCart } from "./cart-provider";
import { formatPrice } from "@/lib/utils";
import { cartItemKey } from "@/lib/types";
import { amountUntilFreeShipping } from "@/lib/shipping";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";

export function CartSheet() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-[#0A0A0A] border-l border-[#262626]">
        <SheetHeader>
          <SheetTitle className="text-white">Your Cart ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#737373] mb-4">Your cart is empty</p>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center bg-[#E8630A] text-white font-medium h-8 px-4 rounded-lg text-sm hover:bg-[#C2410C] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => {
                const key = cartItemKey(item);
                const img = item.product.mockup_urls?.[0] || item.product.design_url;
                return (
                  <div
                    key={key}
                    className="flex gap-3 p-3 bg-[#141414] rounded-lg border border-[#262626]"
                  >
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-[#0A0A0A] flex-shrink-0">
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
                      <p className="text-sm font-medium text-white truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#737373] mt-0.5">
                        {item.size} / {item.color}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(key, item.quantity - 1)}
                            className="p-0.5 rounded hover:bg-[#262626] text-[#737373]"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(key, item.quantity + 1)}
                            className="p-0.5 rounded hover:bg-[#262626] text-[#737373]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(key)}
                      className="p-1 self-start hover:bg-[#262626] text-[#525252] hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#262626] pt-4 space-y-3">
              {amountUntilFreeShipping(totalPrice) > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-[#E8630A] bg-[#E8630A]/10 rounded-lg px-3 py-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Add <b>{formatPrice(amountUntilFreeShipping(totalPrice))}</b> for free shipping!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                  <Truck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">FREE shipping!</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-white">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full bg-[#E8630A] hover:bg-[#C2410C] text-white font-semibold h-11 rounded-lg transition-colors"
              >
                View Cart & Checkout
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
