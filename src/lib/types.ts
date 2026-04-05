// === Product ===

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  design_url: string;
  mockup_urls: string[];
  printify_product_id: string | null;
  printify_blueprint_id: number | null;
  print_provider_id: number | null;
  colors: string[];
  sizes: string[];
  status: "draft" | "active" | "sold_out" | "archived";
  featured: boolean;
  created_at: string;
  updated_at: string;
}

// === Cart ===

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

/** Unique key for a cart line: same product + different size/color = separate line */
export function cartItemKey(item: CartItem): string {
  return `${item.product.id}__${item.size}__${item.color}`;
}

// === Order ===

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  printify_order_id: string | null;
  customer_email: string;
  customer_name: string | null;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
  items: OrderItem[];
  total: number;
  shipping_cost: number;
  status: "pending" | "paid" | "in_production" | "shipped" | "delivered";
  tracking_number: string | null;
  tracking_url: string | null;
  created_at: string;
}

// === Category ===

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  product_count: number;
}

// === Printify ===

export interface PrintifyVariant {
  id: number;
  title: string;
  options: Record<string, string>; // e.g. { color: "Black", size: "M" }
  price: number;
}

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}
