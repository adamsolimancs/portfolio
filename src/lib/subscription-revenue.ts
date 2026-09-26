import type Stripe from "stripe";

// Stripe allocates item, subscription, and customer discounts to invoice lines.
// Use those allocations instead of reproducing coupon arithmetic locally.
export const monthlyRevenueFromInvoice = (
  subscription: Stripe.Subscription,
  lines: Stripe.InvoiceLineItem[],
): number | null => {
  if (subscription.items.has_more) return null;
  let total = 0;
  const seen = new Set<string>();
  for (const line of lines) {
    const details = line.parent?.subscription_item_details;
    if (!details || details.proration || details.subscription !== subscription.id) continue;
    const item = subscription.items.data.find((item) => item.id === details.subscription_item);
    const recurring = item?.price.recurring;
    if (!item || !recurring || recurring.usage_type === "metered") return null;
    const discount = (line.discount_amounts ?? []).reduce((sum, value) => sum + value.amount, 0);
    const net = Math.max(0, (line.subtotal ?? line.amount) - discount);
    const months = recurring.interval === "year" ? 12 * recurring.interval_count
      : recurring.interval === "month" ? recurring.interval_count
      : recurring.interval === "week" ? 12 * recurring.interval_count / 52
      : 12 * recurring.interval_count / 365;
    total += net / months;
    seen.add(item.id);
  }
  // An incomplete preview must not silently understate revenue.
  return subscription.items.data.every((item) => seen.has(item.id)) ? Math.round(total) : null;
};
