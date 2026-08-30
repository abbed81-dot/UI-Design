import type { GlobeHandle } from "@/lib/scene/globe";

/**
 * The live scene handle, held in a module ref rather than in React state.
 *
 * Entering a city, orbiting it and positioning the store labels are all
 * per-frame or imperative concerns; routing them through state would re-render
 * the tree on every frame, which is the one thing the scroll architecture
 * forbids. Components read this to command the scene, never to render from it.
 */
let handle: GlobeHandle | null = null;

export const setGlobeHandle = (next: GlobeHandle | null) => {
  handle = next;
};

export const getGlobeHandle = (): GlobeHandle | null => handle;
