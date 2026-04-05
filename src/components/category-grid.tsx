import Link from "next/link";
import type { Category } from "@/lib/types";

const DEFAULT_CATEGORIES = [
  { name: "Funny", slug: "funny", icon: "😂" },
  { name: "Motivational", slug: "motivational", icon: "💪" },
  { name: "Vintage", slug: "vintage", icon: "📻" },
  { name: "Gaming", slug: "gaming", icon: "🎮" },
  { name: "Dad Jokes", slug: "dad-jokes", icon: "👨" },
  { name: "Coding", slug: "coding", icon: "💻" },
  { name: "Animals", slug: "animals", icon: "🐾" },
  { name: "Music", slug: "music", icon: "🎵" },
  { name: "Sports", slug: "sports", icon: "⚽" },
  { name: "Trending", slug: "trending", icon: "🔥" },
];

export function CategoryGrid({ categories }: { categories?: Category[] }) {
  const items = categories?.map((c) => ({
    name: c.name,
    slug: c.slug,
    icon: DEFAULT_CATEGORIES.find((d) => d.slug === c.slug)?.icon ?? "👕",
  })) ?? DEFAULT_CATEGORIES;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {items.map((cat) => (
        <Link
          key={cat.slug}
          href={`/category/${cat.slug}`}
          className="group relative bg-[#141414] rounded-xl p-5 text-center hover:bg-[#1C1C1C] transition-all border border-[#262626] hover:border-[#E8630A]/30"
          aria-label={`Browse ${cat.name} shirts`}
        >
          <span className="text-2xl block mb-2" role="img" aria-hidden="true">
            {cat.icon}
          </span>
          <span className="text-sm font-semibold text-[#A3A3A3] group-hover:text-white transition-colors">
            {cat.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
