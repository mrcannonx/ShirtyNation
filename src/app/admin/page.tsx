"use client";

import { useEffect, useState } from "react";
import { Package, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [productsRes, activeRes, ordersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase.from("orders").select("total"),
      ]);

      const totalRevenue = (ordersRes.data ?? []).reduce(
        (sum, o) => sum + Number(o.total),
        0
      );

      setStats({
        totalProducts: productsRes.count ?? 0,
        activeProducts: activeRes.count ?? 0,
        totalOrders: ordersRes.data?.length ?? 0,
        totalRevenue,
      });
    }

    fetchStats();
  }, []);

  const cards = [
    {
      title: "Total Designs",
      value: stats.totalProducts.toString(),
      icon: Package,
      sub: `${stats.activeProducts} active`,
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      sub: "All time",
    },
    {
      title: "Revenue",
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      sub: "All time",
    },
    {
      title: "Avg Order Value",
      value:
        stats.totalOrders > 0
          ? formatPrice(stats.totalRevenue / stats.totalOrders)
          : "$0.00",
      icon: TrendingUp,
      sub: "Per order",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-[#141414] border-[#262626]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#737373]">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-[#525252]" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-[#525252] mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
