---
tags: [backend, database, wip]
updated: 2026-08-18
---

# Database — Supabase

Postgres for projects built from this starter, normally as the database behind
[[cms-payload|Payload]]. **Not installed in the starter itself** — added per
project by the `supabase-db` skill (`/db`). ADR: [[decisions-log]] ADR-0020.

## Connection strings — the thing that breaks first

Supabase issues several, and they are not interchangeable.

| Job | Connection | Port |
|-----|-----------|------|
| App runtime (serverless / Fluid Compute) | Supavisor **transaction** | 6543 |
| Migrations, `payload migrate`, `psql`, dumps | **Direct** | 5432 |
| Long-lived Node server on IPv4 | Supavisor **session** | 5432 |

- **Transaction mode does not support prepared statements** — symptoms are
  `prepared statement "s0" already exists` and intermittent failures under load.
  Disable them for that URL.
- **Direct connections are IPv6 by default**; on IPv4-only networks (many CI
  runners) they simply fail to resolve.

Keep both as server-only zod-validated vars: `DATABASE_URL` (6543) and
`DATABASE_URL_DIRECT` (5432). See [[environment-variables]].

## Keys

Use the current **publishable** (`sb_publishable_…`) and **secret**
(`sb_secret_…`) keys; the legacy `anon`/`service_role` JWTs are being retired.

The publishable key is browser-safe **only because RLS is enforced** — it is not
protection in itself. The secret key **bypasses RLS entirely** and is server-only
via `getServerEnv()`, never `NEXT_PUBLIC_`, never logged ([[api-architecture]]).

## RLS

Every table holding user or tenant data gets RLS enabled plus at least one named
policy. Wrap `auth.uid()` in `(select …)` so it is cached per statement rather
than per row, and index every column a policy filters on.

**Payload's own tables are excluded** — Payload connects as owner and enforces its
own access control; adding RLS there breaks the admin panel in confusing ways.

## Ownership of migrations

If Payload owns the schema, **Payload owns migrations**
(`payload generate:migrations` / `payload migrate`), and the Supabase CLI is used
only for what sits outside Payload's tables: extensions, functions, RLS on your
own tables, storage policies. Never let both tools generate migrations for the
same tables.

## Auth

Optional, and usually unnecessary — a marketing site with Payload already has
admin auth. If the project genuinely needs user accounts, the `supabase-auth`
skill covers `@supabase/ssr` in Next 16, where the key traps are: `getClaims()`
not `getSession()` on the server, no code between `createServerClient` and
`getClaims()`, and returning the response object unmodified. Note Next 16 renamed
`middleware.ts` to `proxy.ts` — see [[routing]].

## Related

[[cms-payload]] · [[api-architecture]] · [[environment-variables]] · [[backend/README]]
