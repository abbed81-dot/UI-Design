"use client";

import dynamic from "next/dynamic";

/**
 * §1 of optimize-3d-scene: keep `three` out of the first-load bundle.
 *
 * `ssr: false` is only permitted inside a Client Component, so this thin
 * boundary exists purely to hold the dynamic import — the scene then lands in
 * its own chunk that is never fetched, parsed or evaluated until after
 * hydration, which is what a Lighthouse run and a crawler are actually paying
 * for.
 *
 * There is deliberately no poster behind it. A poster earns its place when the
 * scene IS the content; here the canvas is `aria-hidden` decoration behind a
 * page whose copy, headings and links are all real DOM, so a crawler with no
 * JavaScript already sees everything that matters, and the share card is the
 * Open Graph image. Adding a poster would be weight for a picture nobody needs.
 */
const GlobeCanvas = dynamic(
  () => import("@/components/site/globe-canvas").then((m) => m.GlobeCanvas),
  { ssr: false },
);

export const SceneMount = () => <GlobeCanvas />;
