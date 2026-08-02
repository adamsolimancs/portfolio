# Supabase keep-alive

The production deployment schedules `GET /api/cron/keep-alive` every day at
04:15 UTC. Each authorized invocation performs three bounded reads of one
`Customer.id` at most. It never inserts, updates, or returns database data.

## Production setup

1. In Vercel, open the project and add `CRON_SECRET` to the Production
   environment. Use a random value of at least 16 characters and do not add the
   real value to this repository.
2. Confirm that `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` are also
   configured for Production.
3. Redeploy Production so `vercel.json` and the environment variables become
   active together. Preview deployments do not run Vercel Cron Jobs.
4. Open **Settings → Cron Jobs** and confirm `/api/cron/keep-alive` is listed.
5. After its first scheduled run, select **View Logs** and verify a `200`
   response containing `{ "ok": true }`.

Vercel sends `CRON_SECRET` as `Authorization: Bearer <secret>`. Requests are
rejected when the configured secret is absent or does not match, and responses
are marked `no-store` so every invocation reaches Supabase.

## Local smoke test

Start the app with the required Supabase environment variables and a temporary
`CRON_SECRET`, then call the route:

```sh
curl -i http://localhost:3000/api/cron/keep-alive
curl -i -H 'Authorization: Bearer <your-local-secret>' \
  http://localhost:3000/api/cron/keep-alive
```

The first request must return `401`. With valid Supabase credentials, the
second must return `200`; an unavailable or misconfigured upstream returns
`503`.

## Reliability limits

Supabase documents that Free Plan projects with low activity over seven days
may be paused, and says a few daily database requests are typically enough to
avoid that outcome. This job is a practical activity signal, not an uptime
guarantee; Supabase documents upgrading to Pro as the way to prevent inactivity
pausing.

Vercel Hobby schedules may run at any point within the configured hour, and
Vercel does not retry failed cron invocations. Check the Cron Jobs logs after
deployments and periodically thereafter, especially after any Supabase
credential rotation.

Official references:

- [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Cron management and security](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel Cron usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
