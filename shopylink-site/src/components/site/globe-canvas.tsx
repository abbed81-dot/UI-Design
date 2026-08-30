"use client";

import { useEffect, useRef } from "react";
import { createGlobeScene, type GlobeHandle } from "@/lib/scene/globe";
import { setGlobeHandle } from "@/lib/scene/handle-ref";
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

    // the scene tiers itself from src/lib/scene/device.ts — one module owns it
    const handle = createGlobeScene({
      canvas,
      onReady: () => useSite.getState().setSceneReady(true),
    });
    handleRef.current = handle;
    setGlobeHandle(handle);

    const runway = document.getElementById(RUNWAY_ID);

    const read = () => {
      // while the visitor is inside a district the page does not scroll, and the
      // camera belongs to the city — do not fight it with a station update
      if (!runway || useSite.getState().cityOpen !== null) return;
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
    // §13: on touch, iOS fires `resize` every time the URL bar collapses during
    // scroll, and rebuilding the framebuffer mid-scroll reads as a whole-scene
    // flash. Rotation still needs a re-fit, so listen for THAT instead.
    const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    const resizeEvent = touch ? "orientationchange" : "resize";
    window.addEventListener(resizeEvent, onResize);

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener(resizeEvent, onResize);
      handle.dispose();
      setGlobeHandle(null);
      handleRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      /* §13: its own compositor layer — without it a neighbouring fixed element
         repainting during scroll invalidates the WebGL composite on WebKit and
         the whole scene flickers. `lvh` so a collapsing URL bar never
         re-allocates the framebuffer. */
      className="pointer-events-none fixed inset-0 -z-10 h-lvh w-full transform-gpu backface-hidden will-change-transform"
    />
  );
};
