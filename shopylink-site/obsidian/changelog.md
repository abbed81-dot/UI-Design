
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
