"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete: ${error.message}`);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "draft" : "active";
    const supabase = createClient();
    const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", id);
    if (error) {
      alert(`Failed to update: ${error.message}`);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus as Product["status"] } : p))
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400",
    draft: "bg-[#E8630A]/10 text-[#E8630A]",
    archived: "bg-[#262626] text-[#525252]",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-[#E8630A] hover:bg-[#C2410C] text-white font-medium h-8 px-3 rounded-lg text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-[#737373]">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-[#141414] rounded-xl border border-[#262626]">
          <p className="text-[#737373] mb-4">No products yet</p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center bg-[#E8630A] text-white font-medium h-8 px-4 rounded-lg text-sm"
          >
            Add Your First Design
          </Link>
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0A0A] border-b border-[#262626]">
                <tr>
                  <th className="text-left text-xs font-medium text-[#737373] uppercase px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-[#737373] uppercase px-4 py-3">Price</th>
                  <th className="text-left text-xs font-medium text-[#737373] uppercase px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-[#737373] uppercase px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-[#737373] uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {products.map((product) => {
                  const img = product.mockup_urls?.[0] || product.design_url;
                  return (
                    <tr key={product.id} className="hover:bg-[#1C1C1C]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-[#0A0A0A] flex-shrink-0">
                            {img ? (
                              <Image
                                src={img}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#404040]">👕</div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate max-w-[200px]">
                            {product.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{formatPrice(product.price)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs bg-[#262626] text-[#A3A3A3] capitalize">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleStatus(product.id, product.status)}>
                          <Badge className={`text-xs cursor-pointer ${statusColors[product.status] || statusColors.draft}`}>
                            {product.status}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-[#262626] text-[#737373] hover:text-white transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-[#525252] hover:text-red-400 hover:bg-red-400/10"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
