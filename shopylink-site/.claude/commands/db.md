---
description: Set up or operate Supabase Postgres for this project
argument-hint: [setup|migrate|rls|types]
---

Supabase task: **$ARGUMENTS**

Use the `supabase-db` skill. The things that go wrong first:

- **Connection strings are not interchangeable.** Runtime → Supavisor transaction
  pooler (6543, no prepared statements). Migrations → direct connection (5432).
  Store both, zod-validated in `src/env.ts`, server-only.
- **Use the current keys** — publishable (`sb_publishable_…`) client-side, secret
  (`sb_secret_…`) server-only. The secret key bypasses RLS entirely.
- **RLS on every user-data table**, with a named role and an index on any column
  a policy filters. Payload's own tables are excluded — Payload enforces its own
  access control.
- **Never point local dev at production** — a schema push will rewrite it.

If Payload owns the schema, Payload owns migrations; use the Supabase CLI only
for what sits outside Payload's tables.
