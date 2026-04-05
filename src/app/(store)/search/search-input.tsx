"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search shirts
      </label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#525252] pointer-events-none" />
      <input
        id="search-input"
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search shirts by name, category, or style..."
        className="w-full h-12 pl-12 pr-4 bg-[#141414] border border-[#262626] rounded-xl text-white placeholder:text-[#525252] focus:outline-none focus:border-[#E8630A] transition-colors"
        autoFocus
      />
    </form>
  );
}
