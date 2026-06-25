import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createSupabaseAdminClient,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";
import { getStripe } from "@/lib/server/stripe";
import { subscriptionToBillingUpdate } from "@/lib/server/subscriptions";

export const dynamic = "force-dynamic";

const upsertSubscription = async (
  subscription: Stripe.Subscription,
  customerId: string,
  supabaseUserId?: string | null,
) => {
  const supabase = createSupabaseAdminClient();
  const update = subscriptionToBillingUpdate(subscription);

  if (supabaseUserId) {
    await supabase.from("CustomerBilling").upsert(
      {
        customer_id: supabaseUserId,
        stripe_customer_id: customerId,
        ...update,
      },
      { onConflict: "customer_id" },
    );
    return;
  }

  await supabase
    .from("CustomerBilling")
    .update(update)
    .eq("stripe_customer_id", customerId);
};

export async function POST(request: Request) {
  if (!isServerSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase server credentials are not configured." },
      { status: 500 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (typeof session.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription,
        {
          expand: ["items.data.price.product"],
        },
      );
      const stripeCustomerId =
        typeof session.customer === "string"
          ? session.customer
          : typeof subscription.customer === "string"
            ? subscription.customer
            : null;

      if (stripeCustomerId) {
        await upsertSubscription(
          subscription,
          stripeCustomerId,
          session.client_reference_id || session.metadata?.supabase_user_id,
        );
      }
    }
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId =
      typeof subscription.customer === "string" ? subscription.customer : null;

    if (stripeCustomerId) {
      const expandedSubscription = await stripe.subscriptions.retrieve(
        subscription.id,
        {
          expand: ["items.data.price.product"],
        },
      );

      await upsertSubscription(
        expandedSubscription,
        stripeCustomerId,
        subscription.metadata?.supabase_user_id,
      );
    }
  }

  return NextResponse.json({ received: true });
}
