"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  "funny", "motivational", "vintage", "gaming", "sports",
  "music", "dad-jokes", "coding", "animals", "trending",
];

const ALL_SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compare_at_price?.toString() ?? "");
  const [category, setCategory] = useState(product?.category ?? "funny");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [designUrl, setDesignUrl] = useState(product?.design_url ?? "");
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "");
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ALL_SIZES);
  const [colors, setColors] = useState(product?.colors?.join(", ") ?? "Black, White, Navy");
  const [status, setStatus] = useState<string>(product?.status ?? "draft");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleSize(size: string) {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price || !designUrl) {
      setError("Name, price, and design URL are required.");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();
    const slug = slugify(name);
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const parsedColors = colors.split(",").map((c) => c.trim()).filter(Boolean);

    const data = {
      name,
      slug,
      price: parseFloat(price),
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      category,
      subcategory: subcategory || null,
      description: description || null,
      design_url: designUrl,
      mockup_urls: [] as string[],
      tags: parsedTags,
      sizes,
      colors: parsedColors,
      status,
      featured,
    };

    if (isEdit) {
      const { error: updateError } = await supabase
        .from("products")
        .update(data)
        .eq("id", product.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("products")
        .insert(data);

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label className="text-white">Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Retro Gaming Champion Tee"
          required
          className="bg-[#141414] border-[#262626] text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Price *</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="24.99"
            required
            className="bg-[#141414] border-[#262626] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Compare at Price</Label>
          <Input
            type="number"
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="34.99"
            className="bg-[#141414] border-[#262626] text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Category *</Label>
          <Select value={category} onValueChange={(v: string | null) => setCategory(v ?? "funny")}>
            <SelectTrigger className="bg-[#141414] border-[#262626] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#262626]">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-[#A3A3A3] capitalize focus:text-white focus:bg-[#262626]">
                  {c.replace("-", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white">Subcategory</Label>
          <Input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g. Dad Jokes, 80s Retro"
            className="bg-[#141414] border-[#262626] text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Design URL *</Label>
        <Input
          value={designUrl}
          onChange={(e) => setDesignUrl(e.target.value)}
          placeholder="https://... (Supabase storage URL)"
          required
          className="bg-[#141414] border-[#262626] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the design..."
          rows={3}
          className="bg-[#141414] border-[#262626] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Tags (comma-separated)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="funny, gaming, retro, 90s"
          className="bg-[#141414] border-[#262626] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white">Sizes</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                sizes.includes(size)
                  ? "bg-[#E8630A] border-[#E8630A] text-white"
                  : "bg-[#141414] border-[#262626] text-[#737373]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white">Colors (comma-separated)</Label>
        <Input
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          placeholder="Black, White, Navy, Heather Gray"
          className="bg-[#141414] border-[#262626] text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-white">Status</Label>
          <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "draft")}>
            <SelectTrigger className="bg-[#141414] border-[#262626] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#262626]">
              <SelectItem value="draft" className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">Draft</SelectItem>
              <SelectItem value="active" className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">Active</SelectItem>
              <SelectItem value="archived" className="text-[#A3A3A3] focus:text-white focus:bg-[#262626]">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-white">Featured</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-[#262626] accent-[#E8630A]"
            />
            <span className="text-sm text-[#A3A3A3]">Show on homepage</span>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={saving}
          className="bg-[#E8630A] hover:bg-[#C2410C] text-white"
        >
          {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-[#737373] hover:text-white hover:bg-[#1C1C1C]"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
