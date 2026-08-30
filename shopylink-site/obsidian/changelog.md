
## ShopyLink — 3D hero scene

- **Added** `three@0.169.0` + `@types/three`; `playwright` as a dev dependency for
  headless render verification. Recorded in [[tech-stack]].
- **Added** `scenes/shopylink-globe.html` — an original scene authored via GetLayers
  scene-lab (nothing in the library was a city scene; the closest assets, `planet`
  and `container-yard`, were read for technique only). A light paper-model globe on
  cream, four shopping capitals as beacons under slow radar pings, shipping routes
  bowed off the sphere with parcels riding them, and a miniature skyline that rises
  on its plinth as one scroll clock flies the camera city to city.
- **Added** `yarn scene:vendor` / `yarn scene:preview`.

## ShopyLink — masthead clock

- **Added** `LocalClock` in the hero masthead — `noema-hero`'s own meta slot. It
  opens on the reader's time in Damascus and re-zones to each city as the camera
  arrives, showing the offset from home. Verified live: Dubai +1, Guangzhou +5,
  Istanbul same, New York −7.
- **Added** `HOME` and a `timezone` per city in `src/content/site.ts`. The scene's
  route convergence point and the clock's reference now read the same constant,
  and the globe's city markers are derived from `CITIES` rather than duplicated.

## ShopyLink — bilingual cookie consent

- **Changed** `CookieBanner` and `CookiePreferencesModal` to read their copy from
  `COOKIE` in `src/content/site.ts` instead of carrying English strings in the
  markup (hard rule #4). Both now follow the site locale.
- **Fixed** two RTL bugs in the same components: the banner was pinned with
  physical `right`, and the switch knob with physical `left`; both now use logical
  inset. The knob's spring travel is negated under RTL, since a CSS transform is
  not flipped by `dir`.

## ShopyLink — walkable city districts

- **Changed** the city diorama from a cluster of random boxes into an authored
  district: a plinth, two crossing streets, filler blocks, and one building per
  store at the position and height written beside its name in `src/content/site.ts`.
- **Added** city mode to `src/lib/scene/globe.ts` — `enterCity` / `exitCity` /
  `bindStoreLabels`. The camera orbits inside a tangent frame built on the sphere
  at the district, so the city's own "up" stays up however far the globe has
  turned, and it rides the same damped camera as the scroll flight rather than a
  second one.
- **Added** `CityExplorer` — store labels as DOM buttons whose transforms the
  scene writes each frame, a store card, and an exit that restores the scroll.
- **Added** `stores` (four per city, bilingual) to the content module.

## ShopyLink — the architecture kit

- **Added** `src/lib/scene/architecture.ts` — the form vocabulary every building
  is assembled from. Four signature landmarks (a spiralling tapered spire, a
  twisted hyperboloid lattice, a domed mass with minarets, a stepped setback
  tower with a crown) and six store forms (podium, vaulted hall, sawtooth shed,
  wind tower, loft block, terrace row).
- **Changed** `Store` to carry a `form` instead of a raw `height`, and `City` to
  carry a `landmark`. Massing is now a consequence of the form, not a number set
  beside the name.
- **Added** a central plaza so the streets read as a roundabout around the
  landmark rather than running under it, contact shadows under every mass, and a
  three-step tonal hierarchy (ground → filler → landmark and stores).
- **Changed** the city framing to be per-city: the distance is set by the plate,
  which is the same in every district, and the look-at height by that city's
  landmark.
