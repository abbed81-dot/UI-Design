"use client";

import { useEffect } from "react";
import { COPY, DIRECTION } from "@/content/site";
import { useSite } from "@/lib/site-store";

/**
 * The Brand Guide's bilingual rule: in Arabic layouts set dir="rtl" and the
 * arrows and tagline flip to point ←. Keeping each script whole is why the two
 * halves of the wordmark are separate strings rather than one interleaved line.
 */
export const LocaleToggle = () => {
  const locale = useSite((s) => s.locale);
  const setLocale = useSite((s) => s.setLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = DIRECTION[locale];
  }, [locale]);

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      className="rounded-pill border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-label text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-accent hover:text-accent"
    >
      {COPY.switchTo[locale]}
    </button>
  );
};
