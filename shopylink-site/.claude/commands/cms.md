---
description: Set up Payload CMS in this app, backed by Supabase
argument-hint: [collection-names?]
---

Set up Payload CMS for this project. Collections requested: **$ARGUMENTS**

Use the `payload-cms` skill and follow it exactly. Before installing anything:

1. Check the Next.js version against `@payloadcms/next`'s peer range
   (`>=16.2.6 <17` as of 3.88). The starter satisfies this today — verify rather
   than assume, and bump Next with `eslint-config-next` together if it does not.
2. Confirm a Supabase project exists with both connection strings (transaction
   pooler for runtime, direct for migrations). If not, run the `supabase-db`
   skill first.
3. Propose the collection schema from what the site actually renders — read
   `src/views/**` and `src/data/mocks/**` and name real content types. Confirm
   with the user before writing config.

Prove the loop before reporting done: `/admin` loads, a document with an uploaded
image saves, that image renders from Supabase Storage in the browser, and the
content appears on a public route. Then `yarn build`.

Finish by updating `obsidian/backend/cms-payload.md`, `tech-stack.md`,
`environment-variables.md` and the changelog.
