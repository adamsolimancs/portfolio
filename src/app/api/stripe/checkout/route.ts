import { NextResponse } from "next/server";
import { getServiceById, type ServiceTierId } from "@/lib/services";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
  upsertCustomerForUser,
} from "@/lib/server/supabase";
import { getSiteUrl, getStripe, getStripePriceId } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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

    const body = (await request.json().catch(() => null)) as {
      serviceTierId?: ServiceTierId;
    } | null;
    const serviceTierId = body?.serviceTierId;
    const service = serviceTierId ? getServiceById(serviceTierId) : null;

    if (!service) {
      return NextResponse.json(
        { error: "Invalid service tier." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const customerError = await upsertCustomerForUser(supabase, user);

    if (customerError) {
      return NextResponse.json(
        { error: customerError.message },
        { status: 500 },
      );
    }

    const { data: existingBilling, error: billingError } = await supabase
      .from("CustomerBilling")
      .select("*")
      .eq("customer_id", user.id)
      .maybeSingle();

    if (billingError) {
      return NextResponse.json(
        { error: billingError.message },
        { status: 500 },
      );
    }

    let stripeCustomerId = existingBilling?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : typeof user.user_metadata?.name === "string"
              ? user.user_metadata.name
              : undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      const { error } = await supabase.from("CustomerBilling").upsert(
        {
          customer_id: user.id,
          stripe_customer_id: stripeCustomerId,
          subscription_status: "inactive",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "customer_id" },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      allow_promotion_codes: true,
      line_items: [
        {
          price: getStripePriceId(service.id),
          quantity: 1,
        },
      ],
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          service_tier_id: service.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        service_tier_id: service.id,
      },
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to start checkout.",
      },
      { status: 500 },
    );
  }
}
