---
name: payload-cms
description: Install and wire Payload CMS into this Next.js 16 app, backed by Supabase Postgres and Supabase Storage — packages, payload.config.ts, the (payload) route group, collections derived from the actual page views, type generation, migrations, and proving the read loop end-to-end. Use when the user asks to "add a CMS", "make the content editable", "set up Payload", "wire up the blog", or wants marketing copy out of hardcoded props.
---

# Payload CMS in this starter

Payload is a **Next-native** CMS: it installs into this app's `app/` directory
rather than running as a separate service. The database is **Supabase Postgres**
(see the `supabase-db` skill), media goes to **Supabase Storage** over its
S3-compatible API.

Verified against Payload **3.88.0** (2026-08). Payload 4 is in canary — do not
use it here without checking the peer ranges yourself.

## 0. Pre-flight — three things that break the install

1. **Next.js version.** `@payloadcms/next@3.88` peer-requires
   `next >=16.2.6 <17`. The starter is on `16.3.1`, which satisfies it — but
   **check, don't assume**, since both sides move:
   ```bash
   node -p "require('./package.json').dependencies.next"
   npm view @payloadcms/next peerDependencies
   ```
   If Next is below the floor, bump it and `eslint-config-next` together.
2. **ESM.** `next.config.ts` must be ESM to wrap with `withPayload`. This starter
   already uses `next.config.ts` with ESM syntax — check before assuming.
3. **A Supabase project must exist** with both connection strings to hand. Run
   the `supabase-db` skill first if it does not.

Confirm the collection list with the user before writing any config. Derive the
proposal from what the site actually renders — read `src/views/**` and the mock
data in `src/data/mocks/` and name real content types, not a generic `posts`.

## 1. Install

```bash
yarn add payload @payloadcms/next @payloadcms/db-postgres \
         @payloadcms/richtext-lexical @payloadcms/storage-s3 graphql sharp
```

`sharp` is required for image resizing. `graphql` is a hard peer dep even if you
never use the GraphQL API.

## 2. `src/payload.config.ts`

```ts
import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { Media } from './collections/media'
import { Pages } from './collections/pages'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Pages, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema is pushed automatically in dev. In production this must be false —
    // ship migrations instead, or a deploy can rewrite the live schema.
    push: process.env.NODE_ENV !== 'production',
  }),
  plugins: [
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,      // https://<ref>.storage.supabase.co/storage/v1/s3
        region: process.env.S3_REGION,          // e.g. eu-central-1
        forcePathStyle: true,                   // REQUIRED for Supabase
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
  sharp,
})
```

`forcePathStyle: true` is not optional — without it the S3 client builds
virtual-host URLs Supabase does not serve, and every upload 404s.

## 3. Route group + next.config

Scaffold `src/app/(payload)/` — `layout.tsx`, `admin/[[...segments]]/page.tsx`,
`api/[...slug]/route.ts`, `api/graphql/route.ts`. Copy these from the current
Payload blank template rather than writing them by hand; they are generated
plumbing that changes between versions:
`github.com/payloadcms/payload/tree/main/templates/blank/src/app/(payload)`

Wrap the Next config:

```ts
import { withPayload } from '@payloadcms/next/withPayload'
export default withPayload(nextConfig)
```

Add the scripts:

```json
"payload": "payload",
"generate:types": "payload generate:types",
"generate:importmap": "payload generate:importmap"
```

## 4. Env

Add to `src/env.ts` (zod) **and** `.env.example` in the same change:

| Var | Scope | Notes |
|-----|-------|-------|
| `PAYLOAD_SECRET` | server | long random string; rotating it invalidates sessions |
| `DATABASE_URL` | server | Supavisor **transaction** pooler, port 6543 |
| `DATABASE_URL_DIRECT` | server | **direct** connection, port 5432 — migrations only |
| `S3_BUCKET` / `S3_ENDPOINT` / `S3_REGION` | server | Supabase Storage |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | server | never `NEXT_PUBLIC_` |

## 5. Collections that match this starter

Model collections on the sections the site actually renders. A section whose copy
is currently a mock file is a candidate; a section that is pure layout is not.

- Use **blocks** for page composition when a page is a stack of sections — one
  block per section component, so an editor reorders sections without a deploy.
- Keep field names identical to the component prop names. The whole point is that
  `<Hero {...page.hero} />` type-checks against the generated type.
- `Media` collection: `upload: true`, and **require `alt`** — hard rule #10 says
  every image has meaningful alt text, so make the CMS enforce it.
- Rich text: Lexical. Render with `@payloadcms/richtext-lexical/react`, never
  `dangerouslySetInnerHTML`.

## 6. Reading content — Local API only

```ts
// src/views/home.tsx — a Server Component
import { getPayload } from 'payload'
import config from '@/payload.config'

export const HomeView = async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: 'home' } }, limit: 1 })
  const page = docs[0]
  return <main>{/* pass page fields down as props */}</main>
}
```

The Local API talks to the database in-process — no HTTP hop, works during static
generation. Never fetch your own REST endpoint from your own server code.

Keep the route thin: `app/page.tsx` still only imports `HomeView` (hard rule #5).
Payload data enters at the **view**, and presentational components below it stay
CMS-agnostic and receive props (hard rule #4).

## 7. Types and migrations

```bash
yarn payload generate:types        # after ANY collection/field change
yarn payload generate:migrations   # after a schema change
yarn payload migrate               # apply — against DATABASE_URL_DIRECT (5432)
```

`src/payload-types.ts` is generated output: never hand-edit it, always commit it.
In production `push: false` + committed migrations; `push: true` against a live
database is how people lose data.

## 8. Prove it before reporting done

1. `yarn dev` → `/admin` loads, create the first user.
2. Create one document with an image upload → the image resolves from Supabase
   Storage in the browser (not a 404, not a signed-URL error).
3. That document's content renders on the public route.
4. `yarn build` passes.
5. `.claude/scripts/verify.sh` passes — Payload data must reach components as
   props, not as hardcoded content.

## 9. Update the vault (same turn)

- `obsidian/architecture/tech-stack.md` — new dependencies
- `obsidian/backend/cms-payload.md` — collections created and why
- `obsidian/meta/changelog.md` — entry
- `obsidian/meta/decisions-log.md` — ADR if the content model shapes architecture
- `obsidian/architecture/environment-variables.md` — the new vars
