const BASE_URL = "https://api.printify.com/v1";

function getHeaders() {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "ShirtyNation/1.0",
  };
}

function getShopId() {
  const id = process.env.PRINTIFY_SHOP_ID;
  if (!id) throw new Error("PRINTIFY_SHOP_ID is not set");
  return id;
}

async function printifyFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Printify API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// === Catalog ===

export interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintProvider {
  id: number;
  title: string;
}

export interface Variant {
  id: number;
  title: string;
  options: { color: string; size: string };
  placeholders: { position: string; height: number; width: number }[];
}

export async function getBlueprints(): Promise<Blueprint[]> {
  return printifyFetch("/catalog/blueprints.json");
}

export async function getBlueprint(blueprintId: number): Promise<Blueprint> {
  return printifyFetch(`/catalog/blueprints/${blueprintId}.json`);
}

export async function getPrintProviders(blueprintId: number): Promise<PrintProvider[]> {
  return printifyFetch(`/catalog/blueprints/${blueprintId}/print_providers.json`);
}

export async function getVariants(blueprintId: number, printProviderId: number): Promise<{ variants: Variant[] }> {
  return printifyFetch(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`);
}

// === Image Upload ===

interface UploadResult {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}

export async function uploadImage(imageUrl: string, fileName: string): Promise<UploadResult> {
  return printifyFetch(`/uploads/images.json`, {
    method: "POST",
    body: JSON.stringify({ file_name: fileName, url: imageUrl }),
  });
}

// === Product Creation ===

interface CreateProductInput {
  title: string;
  description: string;
  blueprintId: number;
  printProviderId: number;
  variantIds: number[];
  imageId: string;
  price: number; // in cents
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: unknown[];
  variants: { id: number; price: number; is_enabled: boolean }[];
  images: { src: string; variant_ids: number[]; position: string; is_default: boolean }[];
}

export async function createProduct(input: CreateProductInput): Promise<PrintifyProduct> {
  const shopId = getShopId();

  const variants = input.variantIds.map((id) => ({
    id,
    price: input.price,
    is_enabled: true,
  }));

  return printifyFetch(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      blueprint_id: input.blueprintId,
      print_provider_id: input.printProviderId,
      variants,
      print_areas: [
        {
          variant_ids: input.variantIds,
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: input.imageId,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0,
                },
              ],
            },
          ],
        },
      ],
    }),
  });
}

export async function publishProduct(productId: string): Promise<void> {
  const shopId = getShopId();
  await printifyFetch(`/shops/${shopId}/products/${productId}/publish.json`, {
    method: "POST",
    body: JSON.stringify({
      title: true,
      description: true,
      images: true,
      variants: true,
      tags: true,
      keyFeatures: true,
      shipping_template: true,
    }),
  });
}

export async function getProduct(productId: string): Promise<PrintifyProduct> {
  const shopId = getShopId();
  return printifyFetch(`/shops/${shopId}/products/${productId}.json`);
}

// === Orders ===

interface CreateOrderInput {
  externalId: string;
  label: string;
  lineItems: {
    productId: string;
    variantId: number;
    quantity: number;
  }[];
  shippingMethod: number; // 1 = standard, 2 = express
  address: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    country: string;
    region: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

interface PrintifyOrder {
  id: string;
  status: string;
  shipments: {
    carrier: string;
    number: string;
    url: string;
    delivered_at: string | null;
  }[];
}

export async function createOrder(input: CreateOrderInput): Promise<PrintifyOrder> {
  const shopId = getShopId();
  return printifyFetch(`/shops/${shopId}/orders.json`, {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      label: input.label,
      line_items: input.lineItems.map((li) => ({
        product_id: li.productId,
        variant_id: li.variantId,
        quantity: li.quantity,
      })),
      shipping_method: input.shippingMethod,
      send_shipping_notification: true,
      address_to: input.address,
    }),
  });
}

export async function getOrder(orderId: string): Promise<PrintifyOrder> {
  const shopId = getShopId();
  return printifyFetch(`/shops/${shopId}/orders/${orderId}.json`);
}
