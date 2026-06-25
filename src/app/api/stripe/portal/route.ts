import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getAuthenticatedUser,
  isServerSupabaseConfigured,
} from "@/lib/server/supabase";
import { getSiteUrl, getStripe } from "@/lib/server/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
  const { data: billing, error } = await supabase
    .from("CustomerBilling")
    .select("stripe_customer_id")
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!billing?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account." },
      { status: 404 },
    );
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: billing.stripe_customer_id,
    return_url: `${getSiteUrl()}/dashboard`,
  });

  return NextResponse.json({ url: portalSession.url });
}
