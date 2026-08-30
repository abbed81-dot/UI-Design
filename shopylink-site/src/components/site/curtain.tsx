"use client";

import { useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { COPY } from "@/content/site";
import { useSite } from "@/lib/site-store";

/** anti-flash floor, so a warm cache never flashes a curtain */
const MIN_VISIBLE = 1300;
/** hard cap, so a stalled asset can never trap the visitor */
const MAX_VISIBLE = 5000;
/** the counter parks here until the scene is actually ready */
const HOLDING_CEILING = 92;

export const Curtain = () => {
  const locale = useSite((s) => s.locale);
  const sceneReady = useSite((s) => s.sceneReady);
  const setRevealed = useSite((s) => s.setRevealed);

  const [value, setValue] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [gone, setGone] = useState(false);
  const mounted = useRef(0);

  useEffect(() => {
    mounted.current = performance.now();
  }, []);

  // Asset-backed with a holding ceiling: a slow crawl to 92 while loading, a
  // fast run to 100 once ready. If the scene stalls, the bar sits at 92 —
  // which is honest. Never a setTimeout dressed as progress.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let v = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const elapsed = now - mounted.current;
      const ready = (sceneReady && elapsed > MIN_VISIBLE) || elapsed > MAX_VISIBLE;

      if (ready && v >= 99.4) v = 100;
      else {
        const ceiling = ready ? 100 : HOLDING_CEILING;
        v += (ceiling - v) * (ready ? 6 : 1.7) * dt;
      }
      setValue(v);

      if (v >= 100) {
        // The gate flips at the START of the exit, never on its rest — the
        // content must animate in THROUGH the departing curtain.
        setLifting(true);
        setRevealed(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sceneReady, setRevealed]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A full-viewport translate needs a stiff spring: at tension 120 the plate was
  // still clearing the masthead eight seconds in, which is a covered first
  // impression, not a reveal. `clamp` stops it settling past the edge.
  const style = useSpring({
    to: { y: lifting ? "-100%" : "0%" },
    config: { tension: 220, friction: 32, clamp: true },
    immediate: reduced,
    // scroll release is separate from the visual gate, and later — that is correct
    onRest: () => setGone(true),
  });

  const bar = useSpring({ to: { width: `${Math.min(100, value)}%` }, config: { tension: 200, friction: 30 } });

  // The plate must never be able to sit over the masthead. onRest can be starved
  // on a slow frame budget, so removal is also on a hard deadline once lifting.
  useEffect(() => {
    if (!lifting) return;
    const id = window.setTimeout(() => setGone(true), 1200);
    return () => window.clearTimeout(id);
  }, [lifting]);

  if (gone) return null;

  return (
    <animated.div
      style={style}
      aria-hidden={lifting}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background"
    >
      <span className="font-display text-4xl tracking-display text-foreground">
        shopy<span className="text-accent">link</span>
      </span>
      <div className="h-px w-40 bg-line" role="presentation">
        <animated.div style={bar} className="h-px bg-accent" />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
        {COPY.loading[locale]} · {Math.round(value)}%
      </span>
    </animated.div>
  );
};
