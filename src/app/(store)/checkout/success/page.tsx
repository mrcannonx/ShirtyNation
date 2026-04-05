"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useCart } from "@/components/cart-provider";

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setValid(false);
      return;
    }
    clearCart();
    setValid(true);
  }, [sessionId, clearCart]);

  if (valid === null) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-[#737373]">Verifying your order...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Invalid Order</h1>
        <p className="text-[#737373] mb-8">
          We couldn&apos;t verify this order. If you completed a purchase,
          check your email for confirmation.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-semibold h-9 px-6 rounded-lg transition-colors"
        >
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h1>
      <p className="text-[#737373] mb-2">
        Thanks for your purchase! Your shirt is being printed now.
      </p>
      <p className="text-[#525252] text-sm mb-8">
        You&apos;ll receive a confirmation email with tracking info within 1-2 days.
      </p>
      <Link
        href="/shop"
        className="inline-flex items-center justify-center bg-[#E8630A] hover:bg-[#C2410C] text-white font-semibold h-9 px-6 rounded-lg transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <p className="text-[#737373]">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
