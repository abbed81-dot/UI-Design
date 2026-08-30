---
paths:
  - "src/payload.config.ts"
  - "payload.config.ts"
  - "src/collections/**"
  - "src/app/(payload)/**"
  - "src/payload-types.ts"
description: Payload CMS conventions in this Next.js app
---

# Payload CMS

Full note: `obsidian/backend/cms-payload.md` · Setup playbook: the `payload-cms` skill

- Payload runs **inside this Next.js app** — no separate service. Admin UI lives
  under the `src/app/(payload)/` route group; the site lives in `src/app/` as normal.
- **`src/payload-types.ts` is generated** — never hand-edit it. Run
  `yarn payload generate:types` after any collection or field change.
- **The schema is the contract.** Adding a field to a collection means: update the
  collection → `generate:types` → `generate:migrations` → use the generated type
  in the view. Never cast Payload data to a hand-written interface.
- **Content flows through props.** Views receive Payload data as props from a
  Server Component; presentational components stay pure and unaware of the CMS
  (`obsidian/frontend/component-conventions.md`).
- Fetch with the **Local API** (`getPayload({ config })`) in Server Components —
  it queries the database directly, no HTTP hop. Do not call the REST API from
  your own server code.
- After changing the config: `yarn payload generate:importmap` if you added a
  custom admin component.
- **Never point local development at the production database** — schema push will
  rewrite it. Use a separate Supabase project or branch for dev.

Media uploads go to Supabase Storage via `@payloadcms/storage-s3` with
`forcePathStyle: true`. Do not commit uploaded media to the repo.
