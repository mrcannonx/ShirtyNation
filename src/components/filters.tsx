"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "funny", label: "Funny" },
  { value: "motivational", label: "Motivational" },
  { value: "vintage", label: "Vintage" },
  { value: "gaming", label: "Gaming" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
  { value: "dad-jokes", label: "Dad Jokes" },
  { value: "coding", label: "Coding" },
  { value: "animals", label: "Animals" },
  { value: "trending", label: "Trending" },
];

const SIZES = [
  { value: "all", label: "All Sizes" },
  { value: "S", label: "Small" },
  { value: "M", label: "Medium" },
  { value: "L", label: "Large" },
  { value: "XL", label: "XL" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "all";
  const size = searchParams.get("size") || "all";
  const sort = searchParams.get("sort") || "newest";

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "newest") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select value={category} onValueChange={(v: string | null) => updateFilter("category", v ?? "all")}>
        <SelectTrigger className="w-[160px] bg-[#141414] border-[#262626] text-white">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="bg-[#141414] border-[#262626]">
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value} className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={size} onValueChange={(v: string | null) => updateFilter("size", v ?? "all")}>
        <SelectTrigger className="w-[140px] bg-[#141414] border-[#262626] text-white">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className="bg-[#141414] border-[#262626]">
          {SIZES.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v: string | null) => updateFilter("sort", v ?? "newest")}>
        <SelectTrigger className="w-[180px] bg-[#141414] border-[#262626] text-white">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="bg-[#141414] border-[#262626]">
          {SORT_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
