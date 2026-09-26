import assert from 'node:assert/strict';
import test from 'node:test';
import { monthlyRevenueFromInvoice } from '../src/lib/subscription-revenue.ts';

const item = (id = 'si_1', interval = 'month', interval_count = 1) => ({
  id, price: { recurring: { interval, interval_count, usage_type: 'licensed' } },
});
const subscription = { id: 'sub_1', items: { data: [item()] } };
const line = (subtotal = 14900, discounts = [], id = 'si_1') => ({
  subtotal, amount: subtotal, discount_amounts: discounts.map(amount => ({ amount })),
  parent: { subscription_item_details: { subscription: 'sub_1', subscription_item: id, proration: false } },
});

test('uses Stripe discount allocations for the $37.50 monthly rate', () => {
  assert.equal(monthlyRevenueFromInvoice(subscription, [line(14900, [11150])]), 3750);
});
test('combines allocated item and subscription discounts without reapplying them', () => {
  assert.equal(monthlyRevenueFromInvoice(subscription, [line(14900, [1490, 2000])]), 11410);
});
test('uses the pre-discount subtotal when Stripe amount is already net', () => {
  const value = line(14900, [11150]);
  value.amount = 3750;
  assert.equal(monthlyRevenueFromInvoice(subscription, [value]), 3750);
});
test('quantity is already included in invoice subtotal; zero-dollar rates are valid', () => {
  assert.equal(monthlyRevenueFromInvoice(subscription, [line(29800, [2980])]), 26820);
  assert.equal(monthlyRevenueFromInvoice(subscription, [line(14900, [14900])]), 0);
});
test('excludes one-time items, prorations, and other subscriptions', () => {
  const proration = line(5000);
  proration.parent.subscription_item_details.proration = true;
  const other = line(7000);
  other.parent.subscription_item_details.subscription = 'sub_other';
  assert.equal(monthlyRevenueFromInvoice(subscription, [line(14900, [11150]), proration, other, {subtotal: 10000, parent: null}]), 3750);
});
test('normalizes annual and multi-month items after discounts and adds all items', () => {
  const sub = { id: 'sub_1', items: { data: [item('annual', 'year'), item('quarter', 'month', 3)] } };
  assert.equal(monthlyRevenueFromInvoice(sub, [line(120000, [12000], 'annual'), line(30000, [3000], 'quarter')]), 18000);
});
test('incomplete and metered previews show unavailable rather than false revenue', () => {
  assert.equal(monthlyRevenueFromInvoice(subscription, []), null);
  const sub = structuredClone(subscription);
  sub.items.data[0].price.recurring.usage_type = 'metered';
  assert.equal(monthlyRevenueFromInvoice(sub, [line()]), null);
});
