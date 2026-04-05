export const SHIPPING_RATE = 5.99;
export const FREE_SHIPPING_THRESHOLD = 35;

export function getShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
}

export function amountUntilFreeShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return Math.round((FREE_SHIPPING_THRESHOLD - subtotal) * 100) / 100;
}
