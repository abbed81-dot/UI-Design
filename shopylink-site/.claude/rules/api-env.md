---
paths:
  - "src/app/api/**/*.ts"
  - "src/lib/api/**/*.ts"
  - "src/lib/api-client.ts"
  - "src/env.ts"
description: API route-handler convention and secret handling
---

# API & secrets

Full note: `obsidian/backend/api-architecture.md`

- **The one hard line:** third-party/external calls run **server-side** in
  `app/api/**/route.ts`. The browser only ever calls same-origin `/api/*`.
- **Secrets are server-only** env vars read through `getServerEnv()` in
  `src/env.ts`. Never `NEXT_PUBLIC_` a secret; never read `process.env` directly
  from a component.
- **Validate input with `zod`**, always. Parse, don't trust.
- **Return the envelope** — `{ data }` on success, `{ error }` on failure — via
  the `handle()` wrapper in `src/lib/api/`, which maps `ApiError` to a status.
- Client calls go through `apiFetch<T>()` in `src/lib/api-client.ts`, never bare
  `fetch` to an external origin.

If a new endpoint needs a new env var, add it to the zod schema in `src/env.ts`
and to `.env.example` in the same change.
