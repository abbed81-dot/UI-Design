/**
 * One module decides what "mobile" means.
 *
 * DPR, renderer flags, the frame budget, surface-dot counts and whether the
 * pointer is listened to at all read from HERE, so the values can never drift
 * apart. Read once at construction: a device does not change tier mid-session,
 * and rebuilding buffers on resize costs more than the mismatch is worth.
 */

export type Tier = "mobile" | "tablet" | "desktop";

export const getTier = (): Tier => {
  if (typeof window === "undefined") return "desktop";
  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  // the coarse-pointer clause is what catches tablets and large phones
  if (window.innerWidth < 768 || (coarse && window.innerWidth < 1024)) return "mobile";
  if (coarse) return "tablet";
  return "desktop";
};

/**
 * Pixel ratio, clamped hard. A 3x phone renders NINE times the fragments of a
 * 1x screen. The usual advice is to go below 1.0 on mobile, but this scene is
 * hard-edged — building corners, 1px district outlines, the spire's needle —
 * and those alias visibly, so mobile stops at 1.0 rather than 0.85.
 */
export const getPixelRatio = (tier: Tier): number => {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio;
  if (tier === "mobile") return Math.min(dpr, 1);
  if (tier === "tablet") return Math.min(Math.max(dpr, 0.75), 1.25);
  return Math.min(Math.max(dpr, 0.75), 1.5);
};

/** ms between frames; 0 means every tick. */
export const getFrameBudget = (tier: Tier): number => {
  if (tier === "mobile") return 1000 / 30;
  if (tier === "tablet") return 1000 / 45;
  return 0;
};

/** surface dots — cut fill, not detail */
export const getDotCount = (tier: Tier): number => {
  if (tier === "mobile") return 9000;
  if (tier === "tablet") return 12000;
  return 16000;
};

export const getRendererFlags = (tier: Tier) => ({
  // the DPR clamp and the soft cream ground hide the lack of MSAA on a phone,
  // where it is expensive
  antialias: tier !== "mobile",
  /* This three version always REQUESTS an alpha context regardless, so the
     measured context attributes still read `alpha: true`. What the flag
     actually buys is an opaque clear; `scene.background` is what paints the
     ground, and together they mean the canvas composites as opaque. */
  alpha: false,
  stencil: false,
  powerPreference: (tier === "desktop" ? "high-performance" : "default") as
    | "high-performance"
    | "default",
});

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The nearest web-exposed proxy for iOS Low Power Mode, which has no API.
 */
export const isEnergySaver = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;
};

/**
 * Play the entrance, then stop drawing on a settled frame. WebGL keeps the last
 * frame on the canvas, so a frozen scene costs zero.
 */
export const sceneShouldFreeze = (tier: Tier): boolean =>
  prefersReducedMotion() || (tier === "mobile" && isEnergySaver());
