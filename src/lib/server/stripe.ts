import "server-only";

import Stripe from "stripe";
import { getServiceById, type ServiceTierId } from "@/lib/services";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
};

export const getSiteUrl = () =>
  (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "http://localhost:3000"
  )
    .replace(/^([^:]+:\/\/)?/, (match) => match || "https://")
    .replace(/\/$/, "");

export const getStripePriceId = (serviceTierId: ServiceTierId) => {
  const priceId =
    serviceTierId === "professional"
      ? process.env.STRIPE_PROFESSIONAL_PRICE_ID
      : process.env.STRIPE_PROFESSIONAL_PLUS_PRICE_ID;

  if (!priceId?.trim()) {
    const service = getServiceById(serviceTierId);
    throw new Error(
      `Missing Stripe price ID for ${service?.title || serviceTierId}.`,
    );
  }

  return priceId.trim();
};
