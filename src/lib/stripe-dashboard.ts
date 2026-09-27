import type Stripe from "stripe";

export const loadStripeDashboardRecords = async (stripe: Stripe) => {
  const [charges, subscriptions] = await Promise.allSettled([
    stripe.charges.list({ limit: 100 }),
    (async () => {
      const records: Stripe.Subscription[] = [];
      // List expansions include the leading `data` level. Product expansion
      // here would exceed Stripe's maximum of four levels.
      for await (const subscription of stripe.subscriptions.list({
        status: "all",
        limit: 100,
      })) {
        records.push(subscription);
      }
      return records;
    })(),
  ]);
  return { charges, subscriptions };
};
