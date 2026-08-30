"use client";

import { animated, useSpring } from "@react-spring/web";
import { CITIES, COPY, type City, type Locale } from "@/content/site";
import { RUNWAY_ID } from "@/components/site/globe-canvas";
import { useSite } from "@/lib/site-store";

/**
 * The city journey. One panel of scroll = one leg of the camera, so keyframe i
 * lands exactly when panel i fills the viewport — with N stations the progress
 * is spread over N−1 legs. This section's scroll range IS the clock the scene
 * reads (see globe-canvas.tsx), so its height must stay (legs + 1) × 100lvh.
 *
 * Everything is edge-pinned: the diorama rises just above the optical centre,
 * so the copy sits at the bottom and the middle band stays clear.
 */
/** Arabic sets its numerals Arabic-Indic, as the Brand Guide's own steps do. */
const formatIndex = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(n);

const CityPanel = ({ city }: { city: City }) => {
  const locale = useSite((s) => s.locale);
  const active = useSite((s) => s.station) === city.station;

  // discrete state change, spring-driven — not a CSS keyframe
  const style = useSpring({
    to: { opacity: active ? 1 : 0, y: active ? 0 : 26 },
    config: { tension: 170, friction: 30 },
  });

  return (
    <div className="sticky top-0 flex h-lvh flex-col justify-end p-5 md:p-7">
      <animated.div style={style} className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-accent">
            {formatIndex(city.station, locale)} · {city.country[locale]}
          </p>
          <h2 className="mt-2 font-display text-[clamp(2rem,6vw,4.5rem)] font-extrabold leading-display tracking-display">
            {city.name[locale]}
          </h2>
          <p className="mt-3 max-w-[38ch] text-sm text-foreground-muted">{city.note[locale]}</p>
        </div>

        <div className="rounded-md bg-surface p-4 backdrop-blur-[10px] md:w-72">
          <span className="font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
            {COPY.marketsLabel[locale]}
          </span>
          <ul className="mt-3 flex flex-wrap gap-2">
            {city.markets[locale].map((m) => (
              <li
                key={m}
                className="rounded-pill border border-line px-3 py-1 font-mono text-[11px] text-foreground"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      </animated.div>
    </div>
  );
};

export const CityRunway = () => {
  const locale = useSite((s) => s.locale);

  return (
    // legs = stations − 1 = 4, plus the world view's own screen
    <section id={RUNWAY_ID} aria-label={COPY.marketsLabel[locale]} className="relative">
      <div className="h-lvh" aria-hidden />
      {CITIES.map((city) => (
        <CityPanel key={city.key} city={city} />
      ))}
    </section>
  );
};
