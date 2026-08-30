"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Inview } from "@/components/animation/springs/in-view";
import { PRIVACY, type LegalBlock } from "@/content/privacy";
import { LocaleToggle } from "@/components/site/locale-toggle";
import { useSite } from "@/lib/site-store";

/**
 * A legal document, not a designed marketing section — so it is deliberately
 * NOT built from a hero composition. What it needs is a comfortable measure, a
 * numbered outline someone can cite ("section 6"), and a table of contents that
 * stays put while they read. It inherits the committed Style and nothing else.
 *
 * There is no 3D scene here on purpose: the globe is the landing page's
 * argument, and behind a privacy policy it would be noise over text people are
 * reading for a reason.
 */

/** `[like this]` renders as an unfilled field — impossible to ship by accident. */
const withPlaceholders = (text: string) =>
  text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <mark
        key={i}
        className="rounded-sm bg-counter-accent/60 px-1 text-foreground decoration-accent decoration-dotted underline-offset-4 [text-decoration-line:underline]"
      >
        {part}
      </mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );

const Block = ({ block }: { block: LegalBlock }) => {
  const locale = useSite((s) => s.locale);

  if (block.kind === "p") {
    return (
      <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
        {withPlaceholders(block.text[locale])}
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {block.items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground-muted">
          <span aria-hidden className="mt-2 h-px w-4 shrink-0 bg-accent" />
          <span>{withPlaceholders(item[locale])}</span>
        </li>
      ))}
    </ul>
  );
};

export const LegalDocument = () => {
  const locale = useSite((s) => s.locale);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-7">
      <header className="flex items-baseline justify-between gap-4 border-b border-line py-5">
        <Link
          href="/"
          className="font-display text-sm font-extrabold tracking-display text-foreground"
        >
          shopy<span className="text-accent">link</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden font-mono text-[10px] uppercase tracking-label text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent sm:inline"
          >
            {PRIVACY.backLabel[locale]}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <div className="pt-14 md:pt-20">
        <p className="font-mono text-[10px] uppercase tracking-label text-accent">
          {PRIVACY.kicker[locale]}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2rem,6vw,4rem)] font-extrabold leading-display tracking-display">
          {PRIVACY.title[locale]}
        </h1>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
          {PRIVACY.updatedLabel[locale]} · {PRIVACY.updated[locale]}
        </p>
        <p className="mt-8 max-w-[68ch] text-base leading-relaxed text-foreground">
          {PRIVACY.intro[locale]}
        </p>
      </div>

      <div className="mt-16 flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-16">
        {/* the outline stays put while they read */}
        <nav
          aria-label={PRIVACY.tocLabel[locale]}
          className="lg:sticky lg:top-8 lg:w-64 lg:shrink-0"
        >
          <p className="font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
            {PRIVACY.tocLabel[locale]}
          </p>
          <ol className="mt-4 flex flex-col gap-2">
            {PRIVACY.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-xs text-foreground-muted transition-colors duration-[var(--duration-fast)] ease-entrance hover:text-accent"
                >
                  {section.title[locale]}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-[68ch] flex-1">
          {PRIVACY.sections.map((section, i) => (
            <Inview
              key={section.id}
              mode="once"
              delayIn={Math.min(i, 4) * 60}
              from={{ opacity: 0, y: 14 }}
              to={{ opacity: 1, y: 0 }}
              innerTag="section"
              innerClassName="scroll-mt-8 border-t border-line pt-8 mt-10 first:mt-0 first:border-t-0 first:pt-0"
            >
              <h2 id={section.id} className="font-display text-xl font-bold tracking-display">
                {section.title[locale]}
              </h2>
              {section.blocks.map((block, bi) => (
                <Block key={bi} block={block} />
              ))}
            </Inview>
          ))}
        </div>
      </div>
    </div>
  );
};
