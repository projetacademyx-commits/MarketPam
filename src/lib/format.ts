export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard", detail: "4–6 business days", price: 0 },
  { id: "express", label: "Express", detail: "2 business days", price: 1200 },
  { id: "overnight", label: "Overnight", detail: "Next business day", price: 2800 },
] as const;

export const FREE_SHIPPING_THRESHOLD = 15000;
export const TAX_RATE = 0.0825;

export function computeTotals(subtotal: number, shippingId: string) {
  const option = SHIPPING_OPTIONS.find((o) => o.id === shippingId) ?? SHIPPING_OPTIONS[0];
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD && option.id === "standard" ? 0 : option.price;
  const tax = Math.round(subtotal * TAX_RATE);
  return { shipping, tax, total: subtotal + shipping + tax };
}
