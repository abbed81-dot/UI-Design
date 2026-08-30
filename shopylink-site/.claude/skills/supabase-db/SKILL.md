---
name: supabase-db
description: Provision and operate Supabase Postgres for this project — creating the project, picking the right connection string for each job, local CLI workflow, migrations, generated types, RLS policies, and storage buckets. Use when the user asks to "set up the database", "add Supabase", "write a migration", "add RLS", "connect Payload to Supabase", or hits pooler/prepared-statement errors.
---

# Supabase Postgres

Supabase is the **database** for this project. In a Payload build it is Payload's
Postgres; in a bespoke build it is queried directly. Either way the connection
rules below are what break first.

Verified 2026-08 against `@supabase/supabase-js` 2.112, `@supabase/ssr` 0.12.

## 1. Connection strings — pick per job, not per project

Supabase hands you several strings. They are not interchangeable.

| Job | Connection | Port | Why |
|-----|-----------|------|-----|
| App runtime on serverless / Fluid Compute | Supavisor **transaction** | 6543 | many short-lived connections |
| Migrations, `payload migrate`, `psql`, `pg_dump` | **Direct** | 5432 | needs session state + DDL |
| Long-lived Node server, IPv4-only network | Supavisor **session** | 5432 | pooled but session-safe |

Two traps:

- **Transaction mode (6543) does not support prepared statements.** Symptoms:
  `prepared statement "s0" already exists`, or intermittent failures under load.
  Disable prepared statements in the client for that URL.
- **Direct connections are IPv6 by default.** On an IPv4-only network (many CI
  runners) they fail to resolve — use the session pooler, or add the IPv4 add-on.

Store both: `DATABASE_URL` (6543, runtime) and `DATABASE_URL_DIRECT` (5432,
migrations). Wire both into `src/env.ts` as server-only zod-validated vars.

## 2. Keys — use the new ones

Legacy `anon` / `service_role` JWTs are being retired (end of 2026). Use:

- **Publishable** `sb_publishable_…` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  Browser-safe **only because RLS is enforced**. It is not a secret, but it is
  also not protection.
- **Secret** `sb_secret_…` → server-only, via `getServerEnv()`. **Bypasses RLS
  entirely.** Never `NEXT_PUBLIC_`, never import into a client component, never
  log it. Supabase now 401s a secret key sent from a browser user-agent, but do
  not rely on that as your control.

## 3. Local workflow

```bash
brew install supabase/tap/supabase        # or npx supabase
supabase init                             # creates supabase/
supabase link --project-ref <ref>
supabase start                            # local Postgres + Studio in Docker
supabase db pull                          # snapshot remote schema into a migration
supabase migration new <name>             # hand-written SQL migration
supabase db push                          # apply migrations to the linked project
supabase gen types typescript --linked > src/types/database.ts
```

**Never point local dev at the production database.** A schema push — Payload's
or the CLI's — will rewrite it. Use a separate project or a Supabase branch.

If Payload owns the schema, Payload owns migrations (`payload generate:migrations`)
and the Supabase CLI is only used for things outside Payload's tables: RLS on your
own tables, extensions, functions, storage policies. Do not let both tools
generate migrations for the same tables.

## 4. RLS — the default, not the afterthought

Every table holding user or tenant data gets RLS enabled plus at least one policy.
A table with RLS enabled and no policy denies everything; a table without RLS is
readable by anyone holding the publishable key.

```sql
alter table public.submissions enable row level security;

create policy "insert own submissions"
  on public.submissions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "read own submissions"
  on public.submissions for select to authenticated
  using ((select auth.uid()) = user_id);
```

- Wrap `auth.uid()` in `(select …)` so Postgres caches it per statement instead of
  per row — the single biggest RLS performance win on large tables.
- Index every column a policy filters on (`user_id`, `tenant_id`).
- Always name the role (`to authenticated`) — an unqualified policy also applies
  to `anon`.
- **Payload's own tables should not get RLS policies.** Payload connects as the
  database owner and enforces its own access control; adding RLS there breaks the
  admin panel in confusing ways.

## 5. Storage

Buckets are private by default — keep it that way for anything user-supplied.
For Payload media, use the S3-compatible endpoint with `forcePathStyle: true`
(see the `payload-cms` skill). For direct use, prefer signed URLs over public
buckets, and write storage policies the same way as table policies.

## 6. Verify before reporting done

- Both connection strings tested — runtime query on 6543, a migration on 5432.
- `select * from pg_policies where schemaname = 'public';` — every user-data table
  appears, with the intended roles.
- Types regenerated and committed if the schema changed.
- No secret key anywhere in client-reachable code:
  `grep -rn "sb_secret" src/` returns nothing outside `src/env.ts` usage.
- `.env.example` updated; `src/env.ts` zod schema updated.

## 7. Update the vault

`obsidian/backend/database-supabase.md`, `obsidian/architecture/environment-variables.md`,
`obsidian/architecture/tech-stack.md`, `obsidian/meta/changelog.md`.
