---
name: supabase-auth
description: Wire Supabase Auth into this Next.js 16 app with @supabase/ssr — browser/server clients, the proxy.ts session refresh (Next 16 renamed middleware), getClaims vs getSession, protected routes and sign-in flows. Use when the user asks for login, accounts, a client portal, gated content, or "add auth". Not needed for a plain marketing site.
---

# Supabase Auth in Next.js 16

Only reach for this if the project genuinely needs user accounts. A marketing
site backed by Payload does **not** — Payload has its own admin auth, and adding
Supabase Auth on top is pure complexity.

Verified 2026-08 against `@supabase/ssr` 0.12.4.

## The Next.js 16 wrinkle

`middleware.ts` no longer exists — it is **`proxy.ts`**, exporting a function
named `proxy`, running on **Node** (the Edge runtime is gone and cannot be
configured). Next's guidance is the "thin proxy" pattern: cheap cookie checks and
redirects only. Session refresh is fine there; heavy authorisation is not.

```bash
yarn add @supabase/supabase-js @supabase/ssr
```

Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(both zod-validated in `src/env.ts`).

## Three clients, three files

**`src/lib/supabase/client.ts`** — browser:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — Server Components, Route Handlers, Actions:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, _headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore when the proxy
            // is refreshing sessions.
          }
        },
      },
    }
  )
}
```

**`src/lib/supabase/proxy.ts`** — the session refresher:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // With Fluid compute, never hoist this client into a module-level variable.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**`src/proxy.ts`** — the entry point:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## The three rules that cause every mystery bug

1. **Never trust `getSession()` in server code.** It reads the cookie without
   revalidating. Use `getClaims()` (verifies the JWT signature against the
   project's published keys) or `getUser()` (round-trips to Supabase).
2. **Never put code between `createServerClient` and `getClaims()`** in the proxy.
   It desynchronises cookie refresh and logs users out at random.
3. **Return `supabaseResponse` unmodified.** If you must build a new response,
   pass `{ request }` and copy every cookie across, or the refreshed session is
   dropped.

## Authorisation still lives in the database

The proxy redirect is UX, not security — it only checks a cookie. Real access
control is **RLS** (see the `supabase-db` skill). Assume every client-side query
is attacker-controlled and let Postgres decide.

## Fits with this starter

- The auth form is a **client leaf**; the page and view stay Server Components.
- Motion on the form obeys hard rule #1 — springs, not CSS keyframes.
- Sign-in/out actions live in Route Handlers or Server Actions, never as direct
  third-party calls from the browser (`obsidian/backend/api-architecture.md`).
- Adding `proxy.ts` means every matched route runs Node before serving — keep the
  matcher tight so static marketing pages are not dragged through it.
