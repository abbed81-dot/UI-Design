---
tags: [workflow, seo, stable]
updated: 2026-08-18
---

# Workflow — Site Migration

Protecting search rankings when a build **replaces an existing live site**.
Skill: `site-migration`. Command: `/migrate-site`.

Traffic collapse after a relaunch has one dominant cause: URLs changed and nothing
told search engines where they went. The work happens **before** the rebuild — and
should be raised at the start of the engagement, not at the end.

## The three artefacts

| File | Contains |
|------|----------|
| `MIGRATION-URL-INVENTORY.md` | every indexed URL: title, H1, type, ranking |
| `MIGRATION-RANKINGS-SNAPSHOT.md` | top pages, top queries, positions 1–10 |
| `MIGRATION-REDIRECT-MAP.md` | old → new, 301, one hop |

Build the inventory from several sources — sitemap, Search Console Pages report,
an actual crawl, the old CMS. Each misses different things, and what they miss
(old landing pages, PDFs, paginated archives) is exactly what quietly carries links.

## Redirect rules

- Every old URL gets a destination. A `[TBD]` at launch is a 404.
- Map to the **closest equivalent page** — never blanket-redirect to the homepage;
  Google treats that as a soft 404 and the equity is lost.
- 301, not 302. One hop — if the old site already redirects, map to the final target.
- Decide trailing-slash and query-parameter behaviour deliberately, then be consistent.

In this starter redirects live in `next.config.ts` (`redirects()`) so they are
reviewable in code, or at the platform edge if the volume is large.

## Carry over what is already trusted

Keep URL structure where there is no strong reason to change it; preserve titles,
H1s and content on pages that rank; re-add structured data. "The new IA is nicer"
rarely justifies the risk on a ranking page.

## Launch and after

The redirect map must be **live on the server the moment the new site goes up**,
and staging's `noindex`/robots block must be gone. Then watch weekly for a month:
coverage errors, 404s, and the snapshot from before. Two to four weeks of
fluctuation is normal; a sustained per-page drop means that page's redirect or
content is wrong.

## Related

[[seo-aeo]] · [[ship]] · [[routing]] · [[agent-harness]]
