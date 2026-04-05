"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Order } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: (id: string, updates: Partial<Pick<Order, "status" | "tracking_number">>) => void }) {
  const [tracking, setTracking] = useState(order.tracking_number || "");

  return (
    <div className="bg-white rounded-xl border border-neutral-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium text-black">
            {order.customer_name || "No name"}
          </p>
          <p className="text-xs text-neutral-400">
            {order.customer_email}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatPrice(order.total)}</p>
          <Badge className={`text-xs ${STATUS_COLORS[order.status] || ""}`}>
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Items */}
      <div className="bg-neutral-50 rounded-lg p-3 mb-4">
        <p className="text-xs font-medium text-neutral-500 mb-2">
          Items ({order.items.length})
        </p>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1">
            <span className="text-neutral-700">
              {item.name} x{item.quantity}
            </span>
            <span className="font-medium">
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <div className="text-xs text-neutral-500 mb-4">
          <p className="font-medium text-neutral-600 mb-0.5">Ship to:</p>
          <p>
            {order.shipping_address.line1}
            {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}
          </p>
          <p>
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.postal_code}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100">
        <Select
          value={order.status}
          onValueChange={(v: string | null) => {
            if (v) onUpdate(order.id, { status: v as Order["status"] });
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Input
            placeholder="Tracking number"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => {
              onUpdate(order.id, {
                tracking_number: tracking || null,
                status: "shipped",
              });
            }}
          >
            Mark Shipped
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

  async function updateOrder(
    id: string,
    updates: Partial<Pick<Order, "status" | "tracking_number">>
  ) {
    const supabase = createClient();
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) {
      alert(`Failed to update order: ${error.message}`);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-black mb-6">Orders</h1>

      {loading ? (
        <p className="text-neutral-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-neutral-100">
          <p className="text-neutral-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={updateOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
