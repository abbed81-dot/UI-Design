import { create } from "zustand";
import type { Locale } from "@/content/site";

type SiteState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** flipped at the START of the curtain's exit, not on its rest */
  revealed: boolean;
  setRevealed: (revealed: boolean) => void;
  /** the scene has drawn at least one frame */
  sceneReady: boolean;
  setSceneReady: (ready: boolean) => void;
  /** quantised from the SAME clock the camera reads — 0 is the world view */
  station: number;
  setStation: (station: number) => void;
  /** the city whose district the visitor is standing in, or null */
  cityOpen: number | null;
  setCityOpen: (city: number | null) => void;
  /** the store whose card is showing */
  activeStore: string | null;
  setActiveStore: (id: string | null) => void;
};

export const useSite = create<SiteState>((set) => ({
  locale: "ar",
  setLocale: (locale) => set({ locale }),
  revealed: false,
  setRevealed: (revealed) => set({ revealed }),
  sceneReady: false,
  setSceneReady: (sceneReady) => set({ sceneReady }),
  station: 0,
  setStation: (station) => set({ station }),
  cityOpen: null,
  setCityOpen: (cityOpen) => set({ cityOpen, activeStore: null }),
  activeStore: null,
  setActiveStore: (activeStore) => set({ activeStore }),
}));
