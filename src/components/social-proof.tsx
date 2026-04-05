"use client";

import { useState, useEffect } from "react";
import { X, ShoppingBag } from "lucide-react";

interface ProofItem {
  name: string;
  city: string;
  product: string;
}

const FALLBACK_DATA: ProofItem[] = [
  { name: "Sarah", city: "Austin, TX", product: "Retro Gaming Tee" },
  { name: "Mike", city: "Atlanta, GA", product: "Dad Joke Champion Shirt" },
  { name: "Jessica", city: "Denver, CO", product: "Vintage Sunset Tee" },
  { name: "David", city: "Portland, OR", product: "Code & Coffee Shirt" },
  { name: "Emily", city: "Miami, FL", product: "Motivational Hustle Tee" },
  { name: "Chris", city: "Nashville, TN", product: "Classic Rock Band Shirt" },
  { name: "Ashley", city: "Charlotte, NC", product: "Cat Lover Funny Tee" },
  { name: "Jordan", city: "Phoenix, AZ", product: "90s Throwback Vintage" },
];

export function SocialProof() {
  const [current, setCurrent] = useState<ProofItem | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (dismissed) return;
    const initialTimer = setTimeout(() => {
      setCurrent(FALLBACK_DATA[0]);
      setVisible(true);
    }, 5000);
    return () => clearTimeout(initialTimer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed || !current) return;
    const hideTimer = setTimeout(() => setVisible(false), 4000);
    const nextTimer = setTimeout(() => {
      const nextIndex = (index + 1) % FALLBACK_DATA.length;
      setIndex(nextIndex);
      setCurrent(FALLBACK_DATA[nextIndex]);
      setVisible(true);
    }, 10000);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [current, index, dismissed]);

  if (dismissed || !current) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-xs bg-[#141414] border border-[#262626] rounded-xl shadow-2xl p-3 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-[#525252] hover:text-[#A3A3A3] transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 bg-[#E8630A]/10 rounded-full flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-4 w-4 text-[#E8630A]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-white leading-tight">
            {current.name} from {current.city}
          </p>
          <p className="text-[11px] text-[#737373] leading-tight mt-0.5">
            just purchased <span className="font-medium text-[#A3A3A3]">{current.product}</span>
          </p>
          <p className="text-[10px] text-[#525252] mt-0.5">
            {Math.floor(Math.random() * 10) + 2} min ago
          </p>
        </div>
      </div>
    </div>
  );
}
