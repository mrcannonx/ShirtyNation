"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductForm } from "../../product-form";
import type { Product } from "@/lib/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      setProduct(data as Product | null);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading) return <p className="text-neutral-500">Loading...</p>;
  if (!product) return <p className="text-red-500">Product not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-6">Edit Product</h1>
      <ProductForm product={product} />
    </div>
  );
}
