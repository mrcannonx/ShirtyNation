"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const MESSAGES = [
  "FREE shipping on orders over $35!",
  "New designs dropping every week",
  "Thousands of shirts across every niche",
];

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("shirtynation-announcement-dismissed");
    setDismissed(wasDismissed === "true");
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed]);

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("shirtynation-announcement-dismissed", "true");
  }

  if (dismissed) return null;

  return (
    <div className="bg-[#E8630A] text-white text-xs sm:text-sm font-medium text-center py-2 px-8 relative">
      <span className="transition-opacity duration-300">{MESSAGES[messageIndex]}</span>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/70 hover:text-white transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
