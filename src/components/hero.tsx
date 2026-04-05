import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative bg-[#0A0A0A] overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(232,99,10,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(232,99,10,0.05)_0%,_transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-36">
        <div className="max-w-3xl">
          <p className="text-[#E8630A] text-sm font-semibold tracking-[0.2em] uppercase mb-5">
            Every niche. Every vibe. One nation.
          </p>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
            The shirt store
            <br />
            <span className="text-[#E8630A]">for everyone.</span>
          </h1>
          <p className="mt-6 text-lg text-[#737373] max-w-lg leading-relaxed">
            Thousands of unique designs across funny, motivational, vintage, gaming,
            and every niche you can imagine. Premium quality. Shipped to your door.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 bg-[#E8630A] hover:bg-[#C2410C] text-white font-semibold text-base px-8 h-12 rounded-lg transition-colors"
            >
              Shop All Shirts <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shop?category=trending"
              className="inline-flex items-center justify-center gap-2 border border-[#262626] hover:border-[#404040] text-white font-medium text-base px-8 h-12 rounded-lg transition-colors"
            >
              See Trending
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
