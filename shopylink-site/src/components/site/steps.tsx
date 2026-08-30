"use client";

import { Inview } from "@/components/animation/springs/in-view";
import { COPY } from "@/content/site";
import { useSite } from "@/lib/site-store";

/** Below the fold is plain viewport-entry — don't gate what nobody can see. */
export const Steps = () => {
  const locale = useSite((s) => s.locale);

  return (
    <section id="start" className="relative bg-background px-5 py-24 md:px-7 md:py-32">
      <p className="font-mono text-[10px] uppercase tracking-label text-accent">
        {COPY.stepsLabel[locale]}
      </p>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-md bg-line md:grid-cols-3">
        {COPY.steps[locale].map((step, i) => (
          <Inview
            key={step.n}
            mode="once"
            delayIn={i * 110}
            from={{ opacity: 0, y: 18 }}
            to={{ opacity: 1, y: 0 }}
            innerTag="li"
            innerClassName="bg-surface-raised p-7 h-full"
          >
            <span className="font-mono text-xs text-accent">{step.n}</span>
            <h3 className="mt-3 font-display text-xl font-bold tracking-display">{step.t}</h3>
            <p className="mt-2 text-sm text-foreground-muted">{step.d}</p>
          </Inview>
        ))}
      </ol>

      <footer
        id="track"
        className="mt-24 flex flex-col gap-3 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-label text-foreground-subtle md:flex-row md:justify-between"
      >
        <span>{COPY.site[locale]}</span>
        <span>{COPY.tagline[locale]}</span>
        <a className="hover:text-accent" href={`mailto:${COPY.footerContact[locale]}`}>
          {COPY.footerContact[locale]}
        </a>
      </footer>
    </section>
  );
};
