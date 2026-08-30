/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper. Update the placeholder values per project.
 */
import { publicEnv } from "@/env";

export const siteConfig = {
  name: "ShopyLink · شوبي لينك",
  description:
    "عنوان لك في كل عواصم التسوّق — الإمارات والصين وأمريكا وتركيا. نستلم ونجمّع ونوصّل طردك إلى بابك.",
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "https://shopylink.co",
  /**
   * Default Open Graph / Twitter share image (path under `public/`).
   * The file exists but is still the starter's placeholder artwork — replace it
   * with a ShopyLink card (900x600) before launch, or every WhatsApp and X
   * share shows someone else's design.
   */
  ogImage: "/open-graph.png",
  /**
   * Left empty deliberately. A guessed handle in `twitter:site` credits the
   * card to whoever actually owns that name — set the real one before launch.
   */
  twitterHandle: "",
  author: "ShopyLink",
  /** Browser theme-color (address bar / PWA) — the brand's Cream ground. */
  themeColor: "#f7f4ec",
} as const;
