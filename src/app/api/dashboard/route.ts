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
  toDashboardSubscription,
} from "@/lib/server/subscriptions";
import type { CustomerBilling } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const currency = "usd";

const findLatestSubscription = async (stripeCustomerId: string) => {
  const subscriptions = await getStripe().subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price.product"],
  });

  return (
    subscriptions.data.find((subscription) =>
      isActiveSubscriptionStatus(subscription.status),
    ) ??
    subscriptions.data.sort((a, b) => b.created - a.created)[0] ??
    null
  );
};

export async function GET(request: Request) {
  if (!isServerSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 500 },
    );
  }

  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    supabase.from("AdminUser").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("ServiceRequest")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const initialError =
    customerError || billingError || adminError || serviceRequestsError;

  if (initialError) {
    return NextResponse.json({ error: initialError.message }, { status: 500 });
  }

  const billingRow = billing as CustomerBilling | null;
  let subscription = billingToDashboardSubscription(billingRow);

  if (billingRow?.stripe_customer_id) {
    const stripeSubscription = await findLatestSubscription(
      billingRow.stripe_customer_id,
    );

    if (stripeSubscription) {
      const update = subscriptionToBillingUpdate(stripeSubscription);
      subscription = toDashboardSubscription(stripeSubscription);

      await supabase
        .from("CustomerBilling")
        .update(update)
        .eq("customer_id", user.id);
    }
  }

  const isAdmin = Boolean(adminRow);
  let admin = null;

  if (isAdmin) {
    const [
      { data: customers, error: customersError },
      { data: billings, error: billingsError },
      { data: allRequests, error: allRequestsError },
      charges,
      subscriptions,
    ] = await Promise.all([
      supabase.from("Customer").select("*").order("created_at"),
      supabase.from("CustomerBilling").select("*").order("created_at"),
      supabase
        .from("ServiceRequest")
        .select("*")
        .order("created_at", { ascending: false }),
      getStripe().charges.list({ limit: 100 }),
      getStripe().subscriptions.list({ status: "all", limit: 100 }),
    ]);

    const adminError = customersError || billingsError || allRequestsError;

    if (adminError) {
      return NextResponse.json({ error: adminError.message }, { status: 500 });
    }

    const totalRecurringRevenueCents = subscriptions.data
      .filter((item) => isActiveSubscriptionStatus(item.status))
      .reduce(
        (sum, item) =>
          sum +
          item.items.data.reduce(
            (itemSum, subscriptionItem) =>
              itemSum +
              (subscriptionItem.price.unit_amount ?? 0) *
                (subscriptionItem.quantity ?? 1),
            0,
          ),
        0,
      );

    const totalRevenueCents = charges.data
      .filter((charge) => charge.paid && !charge.refunded)
      .reduce((sum, charge) => sum + charge.amount, 0);

    admin = {
      customers: customers ?? [],
      billings: billings ?? [],
      serviceRequests: allRequests ?? [],
      totalRecurringRevenueCents,
      totalRevenueCents,
      currency,
      revenueNote:
        "Revenue totals use the latest 100 Stripe records returned by the API.",
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
}
