# AGENTS.md

## Scope

- These instructions apply to the whole repository.
- This is a Next.js TypeScript portfolio and client dashboard app. It uses the App Router under `src/app`, delegates most page bodies to `src/views`, and shares UI through `src/components`.
- There is currently no repo README; treat `package.json`, `next.config.ts`, `eslint.config.js`, `tsconfig.json`, `tailwind.config.ts`, `components.json`, `.env.example`, and `supabase/migrations` as the primary project reference points.

## Repo Workflow

- Start unfamiliar work by checking `git status --short`, this file, and the relevant package/config files before editing.
- Preserve user changes in dirty worktrees. Do not revert or overwrite changes you did not make.
- Keep diffs narrow. Avoid broad refactors, dependency churn, formatting-only sweeps, or generated file edits unless the task explicitly requires them.
- Prefer `rg` and `rg --files` for searching.
- Do not edit `node_modules`, `.next`, `dist`, `.playwright-cli`, `.DS_Store`, or other generated/local artifacts.
- Do not read, print, or commit secrets from `.env`. Use `.env.example` for environment names.

## Package And Commands

- Use npm for normal dependency and script work; `package-lock.json` is the active lockfile. Leave `bun.lockb` untouched unless the user specifically asks for Bun maintenance.
- Development server: `npm run dev` starts Next.js on port 3000.
- Production build: `npm run build`.
- Lint: `npm run lint`.
- Production start/preview: `npm run start` or `npm run preview`.
- There is no dedicated test script in `package.json` right now. For code changes, run the smallest relevant validation, usually `npm run lint`; use `npm run build` when touching routing, server/API code, env handling, or TypeScript-heavy shared code.
- For frontend behavior changes, smoke-test the affected route in a browser at desktop and mobile widths and check for obvious console/runtime errors.

## Architecture

- Use `src/app` for routes, layouts, metadata, and API route handlers. Keep client-heavy page implementations in `src/views` when that matches the existing pattern.
- Prefer Server Components by default in App Router files. Add `"use client"` only for components that need browser APIs, React state/effects, event handlers, context hooks, or client-side auth/session access.
- Shared providers live in `src/app/providers.tsx` and currently wrap React Query, tooltip, auth, and toast providers.
- Use the `@/*` alias for imports from `src/*`.
- Shared domain data, such as service tiers, belongs in `src/lib`. Keep UI copies of the same facts from drifting.
- Server-only helpers belong under `src/lib/server` and should import `"server-only"` when they depend on secrets or backend-only SDK usage.

## UI And Styling

- The design system is Tailwind CSS plus shadcn/Radix-style primitives. Reuse components in `src/components/ui` before adding new primitives.
- Use `cn` from `src/lib/utils.ts` for conditional class composition and Tailwind merging.
- Use lucide-react icons for actions and labels when an icon is needed.
- Keep the current minimalist portfolio aesthetic: neutral palette, restrained borders/shadows, generous spacing, clean typography, and token-based colors from `src/index.css`.
- Prefer existing utility classes such as `section-container`, `section-spacing`, `text-display`, `text-heading`, `text-body`, `text-caption`, `card-minimal`, and `link-minimal` where they fit.
- Respect CSS variables and Tailwind theme tokens in `src/index.css` and `tailwind.config.ts`; avoid hard-coded one-off colors unless matching an existing local pattern.
- Ensure text and controls fit on mobile and desktop. Avoid overlapping fixed elements, oversized text inside compact controls, and layout shifts from dynamic labels.
- Public images live in `public`; reference them with root-relative paths such as `/logo.png`.

## Auth, Data, And Payments

- Client Supabase access is centralized in `src/lib/supabase.ts`. It may be `null` when public Supabase env vars are missing, so client UI should handle unconfigured auth gracefully.
- Server Supabase access is centralized in `src/lib/server/supabase.ts`. API routes should use `getAuthenticatedUser`, `createSupabaseAdminClient`, and `isServerSupabaseConfigured` rather than duplicating auth/client setup.
- Bearer tokens from the client dashboard are the current API authentication pattern.
- Stripe setup is centralized in `src/lib/server/stripe.ts`; subscription normalization is in `src/lib/server/subscriptions.ts`.
- Keep Stripe, Supabase service-role, EmailJS private, and webhook secret usage server-only. Never expose non-`NEXT_PUBLIC_` secrets to client components.
- API route inputs should be validated before use. Existing routes use `zod` for service request/status payloads; follow that pattern for new mutable endpoints.
- Return `NextResponse.json` with clear status codes for auth failures, validation errors, missing configuration, and backend errors.
- Stripe webhooks must read the raw request text and verify `stripe-signature` before using the event.

## Database

- Supabase schema changes belong in timestamped SQL files under `supabase/migrations`.
- Preserve row-level security. When changing tables, add or update policies deliberately and keep admin behavior explicit through `AdminUser` or `public.is_admin()`.
- Keep TypeScript database row/insert/update types in `src/lib/supabase.ts` aligned with migrations when schema changes.
- Do not run remote Supabase operations or apply migrations without explicit user approval and the required credentials.

## Content And Metadata

- This is a personal portfolio and paid services site. Do not invent credentials, achievements, client claims, SEO scores, pricing, availability, or response-time promises.
- For regulated, factual, or personal copy, use only facts already present in the repo or supplied by the user. Surface gaps instead of filling them from memory.
- Keep metadata in `src/app/layout.tsx`, sitemap logic in `src/app/sitemap.ts`, and robots logic in `src/app/robots.ts` aligned with public URLs and site copy.

## Validation

- Markdown-only instruction changes can be validated with `git diff --check`.
- For TypeScript, component, or route edits, run `npm run lint` at minimum.
- Run `npm run build` when changes affect Next.js routing, API handlers, env-dependent server code, metadata, config, or shared types.
- Report every validation command run and any skipped validation with the reason.
