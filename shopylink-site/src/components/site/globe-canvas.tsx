"use client";

import { useEffect, useRef } from "react";
import { createGlobeScene, type GlobeHandle } from "@/lib/scene/globe";
import { useSite } from "@/lib/site-store";

/** the element whose scroll range drives the one clock */
export const RUNWAY_ID = "globe-runway";

export const GlobeCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GlobeHandle | null>(null);
  const stationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // tier the device once — DPR, counts and the frame budget all read from here
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const handle = createGlobeScene({
      canvas,
      reducedMotion: reduced,
      maxFps: coarse ? 30 : 0,
      dotCount: coarse ? 9000 : undefined,
      onReady: () => useSite.getState().setSceneReady(true),
    });
    handleRef.current = handle;

    const runway = document.getElementById(RUNWAY_ID);

    const read = () => {
      if (!runway) return;
      const rect = runway.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

      // progress lives in a ref and is read imperatively — scrolling must never
      // re-render the tree. Only the QUANTISED station is allowed to be state,
      // and it is quantised from this same value the camera uses.
      handle.setProgress(p);
      const station = Math.round(p * handle.legs);
      if (station !== stationRef.current) {
        stationRef.current = station;
        useSite.getState().setStation(station);
      }
    };

    const onResize = () => {
      handle.resize();
      read();
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", onResize);
      handle.dispose();
      handleRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-lvh w-full"
    />
  );
};
