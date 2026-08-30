---
paths:
  - "src/lib/supabase/**"
  - "supabase/**"
  - "src/proxy.ts"
  - "proxy.ts"
description: Supabase client, connection and auth conventions
---

# Supabase

Full note: `obsidian/backend/database-supabase.md` · Skills: `supabase-db`, `supabase-auth`

## Connection strings (getting this wrong is the #1 Payload+Supabase failure)

| Use | Pooler | Port |
|-----|--------|------|
| App runtime (serverless / Fluid) | Supavisor **transaction** | 6543 |
| Migrations, `payload migrate`, psql, dumps | **Direct** connection | 5432 |
| Long-lived Node server on IPv4 | Supavisor **session** | 5432 |

Transaction mode (6543) **does not support prepared statements** — disable them
in the client. Run migrations on the direct connection, never through 6543.

## Keys

Use the current **publishable** (`sb_publishable_…`) and **secret**
(`sb_secret_…`) keys — the legacy `anon` / `service_role` JWTs are being retired.

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe, RLS applies.
- Secret key — **server only**, via `getServerEnv()`. It bypasses RLS. Never
  `NEXT_PUBLIC_` it, never import it into a client component.

## Auth (only if the project needs it)

- Use `@supabase/ssr`, never `@supabase/auth-helpers` (deprecated).
- **Never trust `getSession()` in server code** — it does not revalidate the
  token. Use `getClaims()` (verifies the JWT signature) or `getUser()`.
- In `proxy.ts` (Next 16's renamed middleware): do **not** run code between
  `createServerClient` and `getClaims()`, and return the `supabaseResponse`
  object unmodified or users get randomly logged out.
- **RLS on by default** on every table holding user data. A table without a
  policy is either locked or wide open — neither by accident.

Payload manages its own tables and its own auth; do not put RLS policies on
Payload's tables or apply Supabase Auth to the admin panel.
