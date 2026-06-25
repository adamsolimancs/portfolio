import "server-only";

import type Stripe from "stripe";
import type { CustomerBilling } from "@/lib/supabase";

export type DashboardSubscription = {
  id: string | null;
  status: string;
  monthlyRateCents: number | null;
  productName: string | null;
  priceId: string | null;
  startedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const secondsToIso = (seconds: number | null | undefined) =>
  typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;

const getProductName = (price: Stripe.Price | null | undefined) => {
  const product = price?.product;

  if (product && typeof product !== "string" && !("deleted" in product)) {
    return product.name;
  }

  return null;
};

export const toDashboardSubscription = (
  subscription: Stripe.Subscription,
): DashboardSubscription => {
  const item = subscription.items.data[0];
  const price = item?.price ?? null;

  return {
    id: subscription.id,
    status: subscription.status,
    monthlyRateCents: price?.unit_amount ?? null,
    productName: getProductName(price),
    priceId: price?.id ?? null,
    startedAt: secondsToIso(subscription.start_date),
    currentPeriodStart: secondsToIso(item?.current_period_start),
    currentPeriodEnd: secondsToIso(item?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
};

export const billingToDashboardSubscription = (
  billing: CustomerBilling | null,
): DashboardSubscription | null => {
  if (!billing) {
    return null;
  }

  return {
    id: billing.stripe_subscription_id,
    status: billing.subscription_status,
    monthlyRateCents: billing.monthly_rate_cents,
    productName: billing.stripe_product_name,
    priceId: billing.stripe_price_id,
    startedAt: billing.subscription_started_at,
    currentPeriodStart: billing.current_period_start,
    currentPeriodEnd: billing.current_period_end,
    cancelAtPeriodEnd: billing.cancel_at_period_end,
  };
};

export const isActiveSubscriptionStatus = (status: string | null | undefined) =>
  status === "active" || status === "trialing";

export const subscriptionToBillingUpdate = (
  subscription: Stripe.Subscription,
) => {
  const normalized = toDashboardSubscription(subscription);

  return {
    stripe_subscription_id: normalized.id,
    stripe_price_id: normalized.priceId,
    stripe_product_name: normalized.productName,
    subscription_status: normalized.status,
    monthly_rate_cents: normalized.monthlyRateCents,
    subscription_started_at: normalized.startedAt,
    current_period_start: normalized.currentPeriodStart,
    current_period_end: normalized.currentPeriodEnd,
    cancel_at_period_end: normalized.cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  };
};
