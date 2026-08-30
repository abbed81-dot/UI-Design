"use client";

import { useCallback, useEffect, useRef } from "react";
import { animated, useSpring } from "@react-spring/web";
import { CITIES, COPY, type Store } from "@/content/site";
import { getGlobeHandle } from "@/lib/scene/handle-ref";
import { useScroll } from "@/hooks/smooth-scroll/use-scroll";
import { useSite } from "@/lib/site-store";

/**
 * The overlay you get once you walk into a district.
 *
 * The store labels are plain DOM buttons living over the canvas; the scene
 * writes their transforms every frame through `bindStoreLabels`. Projecting
 * through React state instead would re-render this tree sixty times a second
 * for no benefit — and Arabic set as a WebGL texture loses its letter joining,
 * so the labels have to be DOM anyway.
 */
export const CityExplorer = () => {
  const locale = useSite((s) => s.locale);
  const cityOpen = useSite((s) => s.cityOpen);
  const setCityOpen = useSite((s) => s.setCityOpen);
  const activeStore = useSite((s) => s.activeStore);
  const setActiveStore = useSite((s) => s.setActiveStore);

  const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const city = cityOpen !== null ? CITIES.find((c) => c.station === cityOpen) : undefined;

  const close = useCallback(() => {
    getGlobeHandle()?.exitCity();
    useScroll.getState().start();
    setCityOpen(null);
  }, [setCityOpen]);

  // hand the scene this city's label nodes; clear them on the way out
  useEffect(() => {
    const handle = getGlobeHandle();
    if (!handle) return;
    handle.bindStoreLabels(city ? labelRefs.current : []);
    return () => handle.bindStoreLabels([]);
  }, [city]);

  useEffect(() => {
    if (!city) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [city, close]);

  const chrome = useSpring({
    to: { opacity: city ? 1 : 0, y: city ? 0 : 12 },
    config: { tension: 190, friction: 28 },
  });

  const selected: Store | undefined = city?.stores.find((s) => s.id === activeStore);

  return (
    <>
      {/* the labels stay mounted so the scene always has nodes to drive */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {(city?.stores ?? []).map((store, i) => (
          <button
            key={store.id}
            type="button"
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            onClick={() => setActiveStore(store.id === activeStore ? null : store.id)}
            style={{ position: "absolute", left: 0, top: 0, opacity: 0 }}
            className={`flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1 ${
              store.id === activeStore ? "z-10" : ""
            }`}
          >
            <span
              className={`whitespace-nowrap rounded-pill border px-3 py-1 font-mono text-[10px] uppercase tracking-label backdrop-blur-[10px] ${
                store.id === activeStore
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-line bg-surface-raised text-foreground"
              }`}
            >
              {store.name[locale]}
            </span>
            <span aria-hidden className="block h-3 w-px bg-accent" />
          </button>
        ))}
      </div>

      {city && (
        <animated.div
          style={{ opacity: chrome.opacity, transform: chrome.y.to((v) => `translateY(${v}px)`) }}
          className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-5 md:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="rounded-md bg-surface-raised p-4 backdrop-blur-[10px]">
              <p className="font-mono text-[10px] uppercase tracking-label text-accent">
                {COPY.bestStores[locale]}
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-display">
                {city.name[locale]}
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              className="pointer-events-auto whitespace-nowrap rounded-pill border border-line bg-surface-raised px-4 py-2 font-mono text-[10px] uppercase tracking-label text-foreground backdrop-blur-[10px] transition-colors duration-[var(--duration-fast)] ease-entrance hover:border-accent hover:text-accent"
            >
              {COPY.exitCity[locale]}
            </button>
          </div>

          <div className="flex items-end justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-label text-foreground-subtle">
              {COPY.dragHint[locale]}
            </span>
            {selected && (
              <article className="pointer-events-auto w-full max-w-xs rounded-md bg-surface-raised p-4 backdrop-blur-[10px]">
                <p className="font-mono text-[10px] uppercase tracking-label text-accent">
                  {selected.kind[locale]}
                </p>
                <h3 className="mt-1 font-display text-lg font-bold tracking-display">
                  {selected.name[locale]}
                </h3>
                <p className="mt-1 text-xs text-foreground-muted">{COPY.storePrompt[locale]}</p>
              </article>
            )}
          </div>
        </animated.div>
      )}
    </>
  );
};
