import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';
import { loadStripeDashboardRecords } from '../src/lib/stripe-dashboard.ts';

function fixture({ chargesFail = false, subscriptionsFail = false } = {}) {
  const requests = [];
  const stripe = new Stripe('sk_test_fixture', {
    maxNetworkRetries: 0,
    httpClient: Stripe.createFetchHttpClient(async (url) => {
      const parsed = new URL(url);
      requests.push(parsed);
      const subscriptions = parsed.pathname.endsWith('/subscriptions');
      // Model Stripe's documented four-level expansion limit.
      const invalidExpand = [...parsed.searchParams].some(([key, value]) =>
        key.startsWith('expand') && value.split('.').length > 4,
      );
      if (invalidExpand || (subscriptions ? subscriptionsFail : chargesFail)) {
        return new Response(JSON.stringify({ error: { type: 'invalid_request_error', message: invalidExpand ? 'Expansion exceeds four levels' : 'Read failed' } }), { status: 400 });
      }
      const secondPage = parsed.searchParams.has('starting_after');
      return new Response(JSON.stringify({
        object: 'list',
        url: parsed.pathname,
        has_more: subscriptions && !secondPage,
        data: subscriptions
          ? [{ id: secondPage ? 'sub_2' : 'sub_1', object: 'subscription' }]
          : [{ id: 'ch_1', paid: true, refunded: false, amount: 7450 }],
      }), { status: 200 });
    }),
  });
  return { stripe, requests };
}

test('real Stripe SDK lists all subscription pages using valid expansion depth', async () => {
  const f = fixture();
  const result = await loadStripeDashboardRecords(f.stripe);
  assert.equal(result.subscriptions.status, 'fulfilled');
  assert.deepEqual(result.subscriptions.value.map(item => item.id), ['sub_1', 'sub_2']);
  assert.equal(f.requests.filter(url => url.pathname.endsWith('/subscriptions')).length, 2);
  assert.equal(result.charges.value.data[0].amount, 7450);
});

test('a subscription read failure preserves independently loaded charge revenue', async () => {
  const result = await loadStripeDashboardRecords(fixture({ subscriptionsFail: true }).stripe);
  assert.equal(result.subscriptions.status, 'rejected');
  assert.equal(result.charges.status, 'fulfilled');
  assert.equal(result.charges.value.data[0].amount, 7450);
});

test('a charge read failure preserves independently loaded subscriptions', async () => {
  const result = await loadStripeDashboardRecords(fixture({ chargesFail: true }).stripe);
  assert.equal(result.charges.status, 'rejected');
  assert.equal(result.subscriptions.status, 'fulfilled');
  assert.equal(result.subscriptions.value.length, 2);
});
