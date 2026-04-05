"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface NewsletterFormProps {
  variant?: "inline" | "banner";
}

export function NewsletterForm({ variant = "inline" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else if (res.status === 409) {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={variant === "banner" ? "text-center" : ""}>
        <p className="text-sm font-medium text-[#E8630A]">
          You&apos;re in! We&apos;ll notify you when new designs drop.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={variant === "banner" ? "max-w-md mx-auto" : ""}>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle" && status !== "loading") setStatus("idle");
          }}
          required
          className={`flex-1 bg-[#1C1C1C] border-[#262626] text-white placeholder:text-[#525252] ${
            variant === "banner" ? "h-10" : "h-8 text-sm"
          }`}
        />
        <Button
          type="submit"
          disabled={status === "loading"}
          className={`bg-[#E8630A] hover:bg-[#C2410C] text-white ${
            variant === "banner" ? "h-10 px-6" : "h-8 px-3 text-sm"
          }`}
        >
          {status === "loading" ? "..." : "Subscribe"}
        </Button>
      </div>
      {status === "duplicate" && (
        <p className="text-xs text-[#737373] mt-1.5">You&apos;re already subscribed!</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400 mt-1.5">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
