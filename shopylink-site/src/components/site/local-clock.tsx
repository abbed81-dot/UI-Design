"use client";

import { useEffect, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { CITIES, COPY, HOME, type Locale } from "@/content/site";
import { useSite } from "@/lib/site-store";

/**
 * The masthead clock — `noema-hero` calls for a meta group (clock + contact)
 * inset from the wordmark, so this is the composition's own slot, not an add-on.
 *
 * It opens on the reader's own time in Damascus and re-zones as the camera
 * arrives at each city, which is the point: this is a forwarding service, and
 * the useful fact about a warehouse eleven time zones away is what o'clock it
 * is there right now.
 */

/** minutes east of UTC for an IANA zone at a given instant */
const zoneOffsetMinutes = (timezone: string, at: Date): number | null => {
  try {
    const name = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" })
      .formatToParts(at)
      .find((part) => part.type === "timeZoneName")?.value;
    if (!name) return null;
    // "GMT+03:00", "GMT-04:00", or plain "GMT" at UTC
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
    if (!match) return name === "GMT" ? 0 : null;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3]));
  } catch {
    return null;
  }
};

const formatDelta = (minutes: number, locale: Locale): string => {
  if (minutes === 0) return COPY.sameTime[locale];
  const hours = Math.abs(minutes) / 60;
  const value = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 1,
  }).format(hours);
  const word = minutes > 0 ? COPY.aheadOfYou[locale] : COPY.behindYou[locale];
  // Arabic keeps the sign and drops the unit — "ساعة / ساعتان / ساعات" would
  // need number agreement for a line that has no room for it. English drops the
  // sign instead, because "behind" already carries the direction.
  const sign = minutes > 0 ? "+" : "−";
  return locale === "ar" ? `${sign}${value} ${word}` : `${value}h ${word}`;
};

export const LocalClock = () => {
  const locale = useSite((s) => s.locale);
  const station = useSite((s) => s.station);
  // Station 0 is the world view, so it holds the reader's own zone; 1-4 are cities.
  const place = station === 0 ? HOME : (CITIES.find((c) => c.station === station) ?? HOME);

  // Render nothing on the server: a clock is the classic hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Dantora's one motion vocabulary: copy resolves OUT OF a blur while rising.
  const [style, api] = useSpring(() => ({ p: 1 }));
  useEffect(() => {
    api.start({ from: { p: 0 }, to: { p: 1 }, config: { tension: 170, friction: 26 } });
  }, [station, locale, api]);

  if (!now) {
    // reserve the row so the masthead does not shift when the clock arrives
    return <span aria-hidden className="hidden h-4 w-40 md:inline-block" />;
  }

  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    timeZone: place.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const here = zoneOffsetMinutes(HOME.timezone, now);
  const there = zoneOffsetMinutes(place.timezone, now);
  const delta = here !== null && there !== null ? there - here : null;

  return (
    <animated.span
      style={{
        opacity: style.p,
        filter: style.p.to((v) => `blur(${(1 - v) * 10}px)`),
        transform: style.p.to((v) => `translateY(${(1 - v) * 5}px)`),
      }}
      className="hidden items-baseline gap-2 font-mono text-[10px] uppercase tracking-label text-foreground-muted md:inline-flex"
    >
      <span className="text-foreground-subtle">{COPY.localTime[locale]}</span>
      <span className="text-foreground">{place.name[locale]}</span>
      {/* the digits are the only thing that must not reflow as they tick */}
      <time dateTime={now.toISOString()} className="tabular-nums text-accent">
        {time}
      </time>
      {delta !== null && station !== 0 && (
        <span className="text-foreground-subtle">{formatDelta(delta, locale)}</span>
      )}
    </animated.span>
  );
};
