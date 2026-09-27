# Adam Soliman portfolio

Next.js App Router application containing a public portfolio, customer sign-in,
subscription billing, service requests, and an administrator dashboard.

## Local development

Use npm; `package-lock.json` is the active lockfile.

```sh
npm ci
# On first setup only; do not overwrite an existing .env:
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. The public portfolio can render without service
credentials. Authentication requires the public Supabase variables; dashboard
APIs also require the server secret. Never commit `.env` or print its contents.

```sh
npm run lint
npm run build
npm run start
```

`start` serves the production build on port 3000. `preview` is an alias for the
same command. There is currently no automated test script or checked-in CI
workflow; lint and build do not verify live integrations.

Run the focused auth regression tests with Node.js 22.18 or newer:

```sh
node --experimental-strip-types --test tests/auth.test.mjs
```

These tests cover redirect allowlisting, readable auth errors, and bounded
session renewal. They use local fakes and never call Supabase or Stripe.
Email-confirmation sign-ups remain on the form until the customer follows the
confirmation link. Allow the homepage and `/dashboard` return URLs for your
deployment in Supabase's auth redirect settings.

## Configuration

See `.env.example` for all variable names.

| Integration | Configuration and behavior |
| --- | --- |
| Supabase browser auth | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the code also accepts the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| Supabase server | `SUPABASE_SECRET_KEY`, used only by server helpers. |
| Checkout and billing portal | `STRIPE_SECRET_KEY`, `STRIPE_PROFESSIONAL_PRICE_ID`, and `STRIPE_PROFESSIONAL_PLUS_PRICE_ID`. Prefer explicit `price_` IDs; the implementation also resolves `prod_` IDs. Confirm prices match `src/lib/services.ts`. |
| Billing webhooks | `STRIPE_WEBHOOK_SECRET`; route: `/api/stripe/webhook`. Handled events: `checkout.session.completed` and `customer.subscription.created`, `.updated`, `.deleted`. |
| Return URLs | Set `NEXT_PUBLIC_SITE_URL` to the intended deployment origin. The server falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then localhost. Public SEO URLs are separately defined in layout, sitemap, and robots files. |
| Request notifications | `EMAILJS_SERVICE_ID`, `EMAILJS_SERVICE_REQUEST_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, and optional `EMAILJS_PRIVATE_KEY`. Template parameters: `title`, `name`, `email`, `time`, `message`. Requests are saved before notification delivery; email failure does not undo the saved request. |
| Scheduled database reads | `CRON_SECRET`; see [KEEP_ALIVE.md](KEEP_ALIVE.md). |

Use isolated test services when exercising sign-up, requests, checkout, or
webhooks. A local server using production credentials can still change remote
data or send email. Supabase auth redirect settings and Stripe portal settings
must agree with the deployment; those settings are not managed in this repo.

## Data and authorization

Schema history is in `supabase/migrations`, ordered by timestamp. It defines
`Customer`, `CustomerBilling`, `ServiceRequest`, `AdminUser`, row-level security,
and customer-creation triggers. Migration files are not applied by `npm run
build`; remote migrations require explicit approval.

Dashboard APIs validate bearer tokens with Supabase. Administrative reads and
request updates check `AdminUser` membership. Server database access uses the
service credential, so API authorization and database policies must both be
reviewed when changing access rules. Never grant admin membership from public
sign-up metadata.

## Source map

- `src/app`: routes, API handlers, metadata, sitemap, and robots.
- `src/views`: portfolio, auth forms, and dashboard page bodies.
- `src/components`: navigation, project cards, auth context, and UI primitives.
- `src/lib/services.ts`: shared service descriptions and prices.
- `src/lib/server`: Supabase, Stripe, and subscription normalization helpers.
- `src/lib/supabase.ts`: browser client and database types.
- `public`: public assets.

Administrator recurring revenue and active customer rates use Stripe invoice
preview subscription lines after Stripe's allocated discounts, normalized to a
monthly amount. One-time invoice items, prorations, taxes, and account balances
are excluded. Scheduled cancellation is removed only in the preview to show the
current renewal rate; this never changes the live subscription. A failed or
incomplete preview shows the rate and recurring total as unavailable instead of
using the undiscounted price. Active and trialing customers appear above a
collapsed non-active customer section. Revenue so far still uses the latest
100 Stripe charges. Charge and subscription reads fail independently; failed
reads show unavailable values instead of zero or stale customer rates.

Run the focused revenue regression tests with:

```sh
node --experimental-strip-types --test tests/subscription-revenue.test.mjs tests/stripe-dashboard.test.mjs
```

Follow [AGENTS.md](AGENTS.md) for contribution and validation requirements.
