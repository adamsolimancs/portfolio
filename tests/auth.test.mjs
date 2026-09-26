import assert from 'node:assert/strict';
import test from 'node:test';
import { getPostAuthRedirect, getAuthErrorMessage } from '../src/lib/auth-navigation.ts';
import { requestDashboard } from '../src/lib/dashboard-request.ts';

for (const value of [null, '', 'https://example.com', '//example.com', '/\\example.com', 'javascript:alert(1)', '/sign-in', '/sign-up', '/api/dashboard', '/dashboard/../sign-in', '/%2fexample.com', '/dashboard\n']) {
  test(`reject unapproved redirect ${JSON.stringify(value)}`, () => {
    assert.equal(getPostAuthRedirect(value), '/dashboard');
  });
}
for (const value of ['/', '/dashboard', '/dashboard?checkout=success', '/#services']) {
  test(`preserve approved redirect ${value}`, () => assert.equal(getPostAuthRedirect(value), value));
}

test('unknown provider errors never expose backend messages', () => {
  const message = getAuthErrorMessage({ code: 'bad_jwt', message: 'JWT expired' });
  assert.equal(message, 'We couldn’t complete that request. Please try again in a moment.');
});
test('email confirmation and incorrect credentials have actionable messages', () => {
  assert.match(getAuthErrorMessage({code:'email_not_confirmed'}), /check your email/);
  assert.match(getAuthErrorMessage({code:'invalid_credentials'}), /email and password/);
});

const result = (token) => ({data:{session:token ? {access_token:token} : null},error:null});
function fixture(statuses, refreshed = 'renewed') {
  const requests = [];
  let renewals = 0;
  return {
    auth: {
      getSession: async () => result('original'),
      refreshSession: async () => { renewals++; return result(refreshed); },
    },
    fetcher: async (url, options) => {
      requests.push({url, ...options});
      return new Response(null, {status:statuses.shift()});
    },
    requests,
    renewals: () => renewals,
  };
}
test('a valid session loads once with the current bearer token', async () => {
  const f = fixture([200]);
  const response = await requestDashboard(f.auth, new AbortController().signal, f.fetcher);
  assert.equal(response.status,200);
  assert.equal(f.requests.length,1);
  assert.equal(f.requests[0].headers.Authorization,'Bearer original');
  assert.equal(f.renewals(),0);
});
test('a rejected session renews once and retries using the new token', async () => {
  const f = fixture([401,200]);
  const response = await requestDashboard(f.auth, new AbortController().signal, f.fetcher);
  assert.equal(response.status,200);
  assert.equal(f.requests.length,2);
  assert.equal(f.requests[1].headers.Authorization,'Bearer renewed');
  assert.equal(f.renewals(),1);
});
test('repeated rejection does not cause an infinite refresh loop', async () => {
  const f = fixture([401,401]);
  assert.equal((await requestDashboard(f.auth, new AbortController().signal, f.fetcher)).status,401);
  assert.equal(f.renewals(),1);
  assert.equal(f.requests.length,2);
});
test('a database/server failure does not renew a valid user session', async () => {
  const f = fixture([500]);
  assert.equal((await requestDashboard(f.auth, new AbortController().signal, f.fetcher)).status,500);
  assert.equal(f.renewals(),0);
});
test('missing sessions do not call the dashboard', async () => {
  const f = fixture([]);
  f.auth.getSession = async () => result(null);
  assert.equal((await requestDashboard(f.auth, new AbortController().signal, f.fetcher)).status,401);
  assert.equal(f.requests.length,0);
});
test('failed renewal returns the rejected response without another request', async () => {
  const f = fixture([401],null);
  assert.equal((await requestDashboard(f.auth, new AbortController().signal, f.fetcher)).status,401);
  assert.equal(f.requests.length,1);
});
test('unmount during session lookup cancels the obsolete request', async () => {
  const f = fixture([]);
  const controller = new AbortController();
  f.auth.getSession = async () => {controller.abort(); return result('original');};
  await assert.rejects(requestDashboard(f.auth, controller.signal, f.fetcher), {name:'AbortError'});
  assert.equal(f.requests.length,0);
});
test('unmount during renewal prevents the retry', async () => {
  const f = fixture([401]);
  const controller = new AbortController();
  f.auth.refreshSession = async () => {controller.abort(); return result('renewed');};
  await assert.rejects(requestDashboard(f.auth, controller.signal, f.fetcher), {name:'AbortError'});
  assert.equal(f.requests.length,1);
});
test('network failures propagate to the dashboard recovery UI', async () => {
  const f = fixture([]);
  f.fetcher = async () => {throw new TypeError('Failed to fetch');};
  await assert.rejects(requestDashboard(f.auth, new AbortController().signal, f.fetcher), TypeError);
});
