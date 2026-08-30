"use client";

import TextEngine from "spring-text-engine";
import { Inview } from "@/components/animation/springs/in-view";
import { COPY } from "@/content/site";
import { useSite } from "@/lib/site-store";
import { LocaleToggle } from "@/components/site/locale-toggle";

/**
 * Composition: `noema-hero` — an edge-pinned viewport frame around a centred
 * scene. The display headline is ONE WORD pinned to each edge with NOTHING
 * between them; the gap is the subject, not empty space to be filled.
 *
 * Which is the ShopyLink wordmark exactly: shopy ⛓ link, the chain in the seam.
 * Here the globe is the chain. In Arabic it mirrors to شوبي · لينك, which is
 * what the Brand Guide's bilingual system already specifies.
 *
 * DO NOT put anything in the middle band. Moving either word inward, stacking
 * them, or filling the centre collapses this into a conventional centred hero
 * and the scene stops being the subject.
 */
export const Hero = () => {
  const locale = useSite((s) => s.locale);
  const revealed = useSite((s) => s.revealed);

  return (
    <section className="relative flex h-lvh flex-col justify-between p-5 md:p-7">
      {/* masthead — a hairline rule, wordmark far-start, actions far-end */}
      <header className="flex items-baseline justify-between border-b border-line pb-3">
        <span className="font-display text-sm font-extrabold tracking-display">
          shopy<span className="text-accent">link</span>
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-label text-foreground-subtle md:inline">
          {COPY.tagline[locale]}
        </span>
        <LocaleToggle />
      </header>

      {/* the split headline — the centre between them stays empty */}
      <div className="pointer-events-none flex items-center justify-between">
        <TextEngine
          key={`mark-left-${locale}`}
          tag="h1"
          enabled={revealed}
          mode="once"
          className="font-display text-[clamp(2.5rem,9vw,7rem)] font-extrabold leading-display tracking-display text-foreground justify-start"
          overflow
          lineIn={{ y: "0%", opacity: 1 }}
          lineOut={{ y: "100%", opacity: 0 }}
          delayIn={120}
        >
          {COPY.markLeft[locale]}
        </TextEngine>

        <TextEngine
          key={`mark-right-${locale}`}
          tag="span"
          enabled={revealed}
          mode="once"
          className="font-display text-[clamp(2.5rem,9vw,7rem)] font-extrabold leading-display tracking-display text-accent justify-end"
          overflow
          lineIn={{ y: "0%", opacity: 1 }}
          lineOut={{ y: "100%", opacity: 0 }}
          delayIn={260}
        >
          {COPY.markRight[locale]}
        </TextEngine>
      </div>

      {/* base row — copy and actions at the start, one opaque card at the end */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[36ch]">
          <TextEngine
            key={`promise-${locale}`}
            tag="p"
            enabled={revealed}
            mode="once"
            className="text-sm leading-relaxed text-foreground-muted justify-start"
            wordIn={{ opacity: 1, y: "0%" }}
            wordOut={{ opacity: 0, y: "40%" }}
            delayIn={420}
          >
            {COPY.promise[locale]}
          </TextEngine>

          <Inview
            enabled={revealed}
            mode="once"
            delayIn={620}
            from={{ opacity: 0, y: 14 }}
            to={{ opacity: 1, y: 0 }}
            className="mt-5"
          >
            <div className="pointer-events-auto flex gap-2">
              <a
                href="#start"
                className="whitespace-nowrap rounded-pill bg-accent px-5 py-2.5 font-mono text-[11px] uppercase tracking-label text-accent-foreground transition-opacity duration-[var(--duration-fast)] ease-entrance hover:opacity-90"
              >
                {COPY.ctaPrimary[locale]}
              </a>
              <a
                href="#track"
                className="whitespace-nowrap rounded-pill border border-line bg-surface px-5 py-2.5 font-mono text-[11px] uppercase tracking-label text-foreground backdrop-blur-[10px] transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-accent"
              >
                {COPY.ctaSecondary[locale]}
              </a>
            </div>
          </Inview>
        </div>

        {/* the only opaque surface in the frame — which is what makes it read
            as raised without a shadow */}
        <Inview
          enabled={revealed}
          mode="once"
          delayIn={760}
          from={{ opacity: 0, y: 18 }}
          to={{ opacity: 1, y: 0 }}
        >
          <article className="w-full rounded-md bg-surface-raised p-4 backdrop-blur-[10px] md:w-72">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
                {COPY.marketsLabel[locale]}
              </span>
              <svg
                aria-hidden
                viewBox="0 0 12 12"
                className="size-3 text-accent rtl:-scale-x-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <path d="M3 9 9 3M4 3h5v5" />
              </svg>
            </div>
            <p className="mt-3 font-display text-lg font-bold tracking-display">
              {COPY.tagline[locale]}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">{COPY.lead[locale]}</p>
          </article>
        </Inview>
      </div>
    </section>
  );
};
