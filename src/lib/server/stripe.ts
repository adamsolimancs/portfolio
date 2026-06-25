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

const priceEnvByService: Record<ServiceTierId, string> = {
  professional: "STRIPE_PROFESSIONAL_PRICE_ID",
  "professional-plus": "STRIPE_PROFESSIONAL_PLUS_PRICE_ID",
};

const getConfiguredStripePrice = (serviceTierId: ServiceTierId) => {
  const envVarName = priceEnvByService[serviceTierId];
  const priceId = process.env[envVarName];
  const service = getServiceById(serviceTierId);
  const trimmedPriceId = priceId?.trim();

  if (!trimmedPriceId) {
    throw new Error(
      `Missing ${envVarName} for ${service?.title || serviceTierId}.`,
    );
  }

  return { envVarName, service, value: trimmedPriceId };
};

const resolveProductPriceId = async (
  stripe: Stripe,
  productId: string,
  serviceTierId: ServiceTierId,
  envVarName: string,
) => {
  const service = getServiceById(serviceTierId);
  const serviceName = service?.title || serviceTierId;
  const product = await stripe.products.retrieve(productId, {
    expand: ["default_price"],
  });

  const defaultPrice = "default_price" in product ? product.default_price : null;
  const defaultPriceId =
    typeof defaultPrice === "string" ? defaultPrice : defaultPrice?.id;

  if (defaultPriceId?.startsWith("price_")) {
    return defaultPriceId;
  }

  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: "recurring",
    limit: 10,
  });
  const matchingPrices = prices.data.filter(
    (price) =>
      price.recurring?.interval === "month" &&
      price.unit_amount === service?.monthlyPriceCents,
  );

  if (matchingPrices.length === 1) {
    return matchingPrices[0].id;
  }

  throw new Error(
    `${envVarName} points to a Stripe product for ${serviceName}, but no single active monthly price matches ${service?.priceLabel || "the configured service price"}. Set ${envVarName} to the Stripe Price ID that starts with "price_".`,
  );
};

export const getStripePriceId = async (
  stripe: Stripe,
  serviceTierId: ServiceTierId,
) => {
  const { envVarName, service, value } = getConfiguredStripePrice(serviceTierId);

  if (value.startsWith("price_")) {
    return value;
  }

  if (value.startsWith("prod_")) {
    return resolveProductPriceId(stripe, value, serviceTierId, envVarName);
  }

  throw new Error(
    `${envVarName} for ${service?.title || serviceTierId} must be a Stripe Price ID starting with "price_" or a Product ID starting with "prod_".`,
  );
};
