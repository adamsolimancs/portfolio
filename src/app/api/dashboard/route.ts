import { NextResponse } from "next/server";
import { SERVICES } from "@/lib/services";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";
import { getStripe } from "@/lib/server/stripe";
import {
  billingToDashboardSubscription,
  isActiveSubscriptionStatus,
  subscriptionToBillingUpdate,
  getDashboardSubscription,
} from "@/lib/server/subscriptions";
import type { CustomerBilling } from "@/lib/supabase";
import { loadStripeDashboardRecords } from "@/lib/stripe-dashboard";

export const dynamic = "force-dynamic";

const currency = "usd";

const findLatestSubscription = async (stripeCustomerId: string) => {
  const subscriptions = await getStripe().subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 10,
  });

  const subscription =
    subscriptions.data.find((subscription) =>
      isActiveSubscriptionStatus(subscription.status),
    ) ??
    subscriptions.data.sort((a, b) => b.created - a.created)[0] ??
    null;

  if (!subscription) {
    return null;
  }

  return getStripe().subscriptions.retrieve(subscription.id, {
    expand: ["items.data.price.product"],
  });
};

export async function GET(request: Request) {
  try {
    if (!isServerSupabaseConfigured) {
      return NextResponse.json(
        { error: "We couldn’t load your dashboard. Please try again later." },
        { status: 500 },
      );
    }

    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in again to continue." },
        { status: 401 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const [
      { data: customer, error: customerError },
      { data: billing, error: billingError },
      { data: adminRow, error: adminError },
      { data: serviceRequests, error: serviceRequestsError },
    ] = await Promise.all([
      supabase.from("Customer").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("CustomerBilling")
        .select("*")
        .eq("customer_id", user.id)
        .maybeSingle(),
      supabase
        .from("AdminUser")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("ServiceRequest")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const initialError =
      customerError || billingError || adminError || serviceRequestsError;

    if (initialError) {
      console.error("Dashboard database read failed:", initialError);
      return NextResponse.json(
        { error: "We couldn’t load your dashboard. Please try again." },
        { status: 500 },
      );
    }

    const billingRow = billing as CustomerBilling | null;
    let subscription = billingToDashboardSubscription(billingRow);

    if (billingRow?.stripe_customer_id) {
      try {
        const stripeSubscription = await findLatestSubscription(
          billingRow.stripe_customer_id,
        );

        if (stripeSubscription) {
          subscription = await getDashboardSubscription(stripeSubscription);
          const update = subscriptionToBillingUpdate(subscription);

          await supabase
            .from("CustomerBilling")
            .update(update)
            .eq("customer_id", user.id);
        }
      } catch (error) {
        console.error("Unable to refresh Stripe subscription:", error);
      }
    }

    const isAdmin = Boolean(adminRow);
    let admin = null;

    if (isAdmin) {
      const [
        { data: customers, error: customersError },
        { data: billings, error: billingsError },
        { data: allRequests, error: allRequestsError },
      ] = await Promise.all([
        supabase.from("Customer").select("*").order("created_at"),
        supabase.from("CustomerBilling").select("*").order("created_at"),
        supabase
          .from("ServiceRequest")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      const adminError = customersError || billingsError || allRequestsError;

      if (adminError) {
        console.error("Admin dashboard read failed:", adminError);
        return NextResponse.json(
          { error: "We couldn’t load your dashboard. Please try again." },
          { status: 500 },
        );
      }

      let totalRecurringRevenueCents: number | null = null;
      let refreshedBillings = (billings ?? []) as CustomerBilling[];
      let totalRevenueCents: number | null = null;
      let revenueNote =
        "Stripe revenue is unavailable; customer rates could not be refreshed.";

      try {
        const records = await loadStripeDashboardRecords(getStripe());
        if (records.charges.status === "fulfilled") {
          totalRevenueCents = records.charges.value.data
            .filter((charge) => charge.paid && !charge.refunded)
            .reduce((sum, charge) => sum + charge.amount, 0);
        } else {
          console.error("Unable to load Stripe charges:", records.charges.reason);
        }
        if (records.subscriptions.status === "rejected") {
          throw records.subscriptions.reason;
        }
        const subscriptions = records.subscriptions.value;

        const normalized = [];
        for (let index = 0; index < subscriptions.length; index += 10) {
          normalized.push(...await Promise.all(
            subscriptions.slice(index, index + 10).map(getDashboardSubscription),
          ));
        }
        const byId = new Map(normalized.map((item) => [item.id, item]));
        const active = normalized.filter((item) => isActiveSubscriptionStatus(item.status));
        totalRecurringRevenueCents = active.some((item) => item.monthlyRateCents === null)
          ? null
          : active.reduce((sum, item) => sum + (item.monthlyRateCents ?? 0), 0);
        refreshedBillings = refreshedBillings.map((billing) => {
          const matches = subscriptions.filter((item) =>
            (typeof item.customer === "string" ? item.customer : item.customer.id) === billing.stripe_customer_id,
          );
          const latest = matches.find((item) => isActiveSubscriptionStatus(item.status))
            ?? matches.sort((a, b) => b.created - a.created)[0];
          const live = latest ? byId.get(latest.id) : null;
          return live ? {
            ...billing,
            stripe_subscription_id: live.id,
            subscription_status: live.status,
            monthly_rate_cents: live.monthlyRateCents,
            stripe_product_name: live.productName ?? billing.stripe_product_name,
            stripe_price_id: live.priceId,
            current_period_start: live.currentPeriodStart,
            current_period_end: live.currentPeriodEnd,
            cancel_at_period_end: live.cancelAtPeriodEnd,
          } : billing;
        });

        revenueNote =
          totalRecurringRevenueCents === null
            ? "Discounted recurring revenue is unavailable."
            : "Recurring revenue uses discounted Stripe renewal rates.";
      } catch (error) {
        console.error("Unable to load Stripe revenue:", error);
        refreshedBillings = refreshedBillings.map((billing) => ({
          ...billing,
          monthly_rate_cents: null,
        }));
      }
      revenueNote += totalRevenueCents === null
        ? " Revenue so far is unavailable."
        : " Revenue so far uses the latest 100 Stripe charges.";

      admin = {
        customers: customers ?? [],
        billings: refreshedBillings,
        serviceRequests: allRequests ?? [],
        totalRecurringRevenueCents,
        totalRevenueCents,
        currency,
        revenueNote,
      };
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name:
          customer?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          "username",
      },
      services: SERVICES,
      customer,
      subscription,
      hasActiveSubscription: isActiveSubscriptionStatus(subscription?.status),
      serviceRequests: serviceRequests ?? [],
      isAdmin,
      admin,
    });
  } catch (error) {
    console.error("Dashboard load failed:", error);

    return NextResponse.json(
      {
        error: "We couldn’t load your dashboard. Please try again.",
      },
      { status: 500 },
    );
  }
}
