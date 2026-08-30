import { Curtain } from "@/components/site/curtain";
import { CityExplorer } from "@/components/site/city-explorer";
import { CityRunway } from "@/components/site/city-runway";
import { GlobeCanvas } from "@/components/site/globe-canvas";
import { Hero } from "@/components/site/hero";
import { Steps } from "@/components/site/steps";

/**
 * ShopyLink landing page — a Server Component that composes client leaves.
 *
 * Built with the real GetLayers flow: committed Style `dantora-style`
 * (re-dressed to the Brand Guide palette in globals.css), hero composition
 * `noema-hero`, and ONE authored scene — the library carries no city scene.
 *
 * The scene is a single fixed canvas behind everything. There is exactly one
 * of them on the page, per the combination rules: one scene above the fold,
 * at most two anywhere.
 */
export const HomeView = () => {
  return (
    <>
      <GlobeCanvas />
      <CityExplorer />
      <Curtain />
      <main className="relative">
        <Hero />
        <CityRunway />
        <Steps />
      </main>
    </>
  );
};
