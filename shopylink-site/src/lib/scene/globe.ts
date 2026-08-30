/**
 * ShopyLink globe — the page's one WebGL scene.
 *
 * Authored via GetLayers scene-lab; the library has no city scene, so nothing
 * here is pulled. `planet` and `container-yard` were read for technique only.
 *
 * HOUSE CONTRACT (GetLayers): every colour below is an `#rrggbb` string and
 * every art-direction number is hoisted into `CONFIG`. Re-tint by editing
 * CONFIG and calling `applyConfig()`. NEVER edit a shader to recolour — shaders
 * are not re-tintable by editing and you will produce garbage.
 *
 * The standalone, panel-driven version of this scene lives at
 * `scenes/shopylink-globe.html` (`yarn scene:preview`). Keep the two in step.
 */
import * as THREE from "three";

import { CITIES, HOME } from "@/content/site";
import {
  buildLandmark,
  buildStoreForm,
  contactShadow,
  contactShadowTexture,
  type ArchPalette,
} from "@/lib/scene/architecture";
import {
  getDotCount,
  getFrameBudget,
  getPixelRatio,
  getRendererFlags,
  getTier,
  sceneShouldFreeze,
} from "@/lib/scene/device";

export type GlobeConfig = {
  bgColor: string;
  sphereColor: string;
  rimColor: string;
  rimPower: number;
  rimStrength: number;
  landColor: string;
  seaColor: string;
  dotCount: number;
  landDotSize: number;
  seaDotSize: number;
  seaOpacity: number;
  beaconColor: string;
  pingColor: string;
  beaconSize: number;
  pingSize: number;
  pingSpeed: number;
  pingOpacity: number;
  arcColor: string;
  arcOpacity: number;
  arcLift: number;
  arcWidth: number;
  parcelColor: string;
  parcelSize: number;
  parcelsPerRoute: number;
  parcelSpeed: number;
  streetColor: string;
  groundColor: string;
  fillerColor: string;
  storeColor: string;
  awningColor: string;
  districtSpread: number;
  storeyHeight: number;
  cityDistance: number;
  portraitFill: number;
  dioramaColor: string;
  dioramaEdge: string;
  dioramaSpread: number;
  dioramaBlocks: number;
  globeRadius: number;
  tilt: number;
  autoSpin: number;
  worldRadius: number;
  stationRadius: number;
  cameraDamp: number;
  lookAtOffsetX: number;
  openLat: number;
  openLon: number;
  cityPitch: number;
  homeLat: number;
  homeLon: number;
};

export const CONFIG: GlobeConfig = {
  bgColor: "#f7f4ec",
  sphereColor: "#fdfcf6",
  rimColor: "#38bdf8",
  rimPower: 2.6,
  rimStrength: 0.55,

  landColor: "#0ea5e9",
  seaColor: "#bae6fd",
  dotCount: 16000,
  landDotSize: 0.019,
  seaDotSize: 0.012,
  seaOpacity: 0.55,

  beaconColor: "#0ea5e9",
  pingColor: "#38bdf8",
  beaconSize: 0.013,
  pingSize: 0.062,
  pingSpeed: 0.42,
  pingOpacity: 0.34,

  arcColor: "#38bdf8",
  arcOpacity: 0.58,
  arcLift: 0.34,
  arcWidth: 0.0075,

  parcelColor: "#0b2a3b",
  parcelSize: 0.02,
  parcelsPerRoute: 3,
  parcelSpeed: 0.085,

  streetColor: "#e6e2d6",
  /* Three tonal steps, and they are the whole hierarchy: the ground is the
     darkest, the background blocks sit between, the landmark and the four
     stores are the only pure white. Without this everything is white on white
     and nothing reads as important. */
  groundColor: "#dfeefb",
  fillerColor: "#eaf3fa",
  storeColor: "#ffffff",
  awningColor: "#0ea5e9",
  districtSpread: 1.8,
  storeyHeight: 0.020,
  cityDistance: 0.13,   // fallback RADIUS, if a city has no computed framing
  /* Fitting BOTH axes on a portrait phone pushes the camera back roughly twice
     as far as the vertical needs, leaving the district small in a field of
     empty ground. The outermost ring of a district is filler blocks — no store
     sits there and no label — so on a narrow screen we fit slightly less than
     the full plate and let those edges run off. */
  portraitFill: 0.84,
  dioramaColor: "#f4fbff",
  dioramaEdge: "#0ea5e9",
  dioramaSpread: 0.06,
  dioramaBlocks: 14,

  globeRadius: 1,
  tilt: 0.22,
  autoSpin: 0.045,
  /* These are RADII, not distances. The distance that fits a radius depends on
     the viewport: a portrait phone has a far narrower horizontal field than a
     16:9 desktop at the same distance, which is why a fixed distance overflowed
     the screen on a phone. `fitDistance` converts, every frame, from the live
     aspect — so rotating the device re-frames correctly too. */
  worldRadius: 1.22,
  stationRadius: 0.9,
  cameraDamp: 3.2,
  lookAtOffsetX: 0,
  openLat: 20,
  openLon: 58,
  /** radians a city is lifted ABOVE the camera axis, so its towers read in
   *  profile rather than end-on down their own normal */
  cityPitch: 0.4,

  /** the customer's door — every route converges here. Sourced from HOME in
   *  src/content/site.ts, so the masthead clock and the scene agree. */
  homeLat: HOME.lat,
  homeLon: HOME.lon,
};

/**
 * The scene's palette has ONE source of truth: the design tokens in globals.css.
 *
 * WebGL cannot read a CSS variable, so the CONFIG literals above are defaults
 * and this pulls the committed Style's real values over them at startup. That
 * keeps the house contract intact — CONFIG is still the only tint surface, and
 * every value in it is still an `#rrggbb` string — while making the token layer
 * authoritative, so re-skinning the site re-skins the globe with it.
 */
export const syncConfigFromTokens = (root: HTMLElement = document.documentElement) => {
  const css = getComputedStyle(root);
  const read = (token: string): string | null => {
    const raw = css.getPropertyValue(token).trim();
    if (!raw) return null;
    try {
      return `#${new THREE.Color(raw).getHexString()}`;
    } catch {
      return null;
    }
  };

  const map: [keyof GlobeConfig, string][] = [
    ["bgColor", "--background"],
    ["landColor", "--accent"],
    ["seaColor", "--accent-quiet"],
    ["rimColor", "--glow"],
    ["arcColor", "--glow"],
    ["pingColor", "--glow"],
    ["beaconColor", "--accent"],
    ["dioramaEdge", "--accent"],
    ["parcelColor", "--foreground"],
  ];

  for (const [key, token] of map) {
    const value = read(token);
    // `sphereColor` is deliberately absent: the paper-model body is a near-white
    // that has no role in the token set, and --surface-raised carries alpha.
    if (value) (CONFIG[key] as string) = value;
  }
};

type Marker = { lat: number; lon: number };

/** Derived from the content module, so a city cannot drift between the copy
 *  and the globe. Station order is `station` ascending. */
const CITY_MARKERS: readonly Marker[] = [...CITIES]
  .sort((a, b) => a.station - b.station)
  .map((c) => ({ lat: c.lat, lon: c.lon }));

/** Stylised land as lat/lon boxes — a paper model of the world, not a survey map. */
const LAND: readonly (readonly [number, number, number, number])[] = [
  [49, 71, -168, -95], [49, 73, -95, -58], [30, 49, -125, -70],
  [16, 31, -112, -86], [8, 17, -92, -77], [60, 82, -52, -22],
  [-5, 12, -80, -58], [-20, -5, -78, -35], [-35, -20, -72, -46], [-55, -35, -74, -58],
  [12, 35, -17, 32], [4, 13, -16, 45], [-12, 5, 8, 42], [-35, -12, 12, 40], [-25, -12, 43, 50],
  [36, 60, -10, 30], [55, 71, 4, 31], [44, 60, 30, 58],
  [40, 75, 30, 180], [30, 45, 45, 75], [13, 32, 35, 60], [8, 35, 68, 90],
  [20, 45, 90, 122], [30, 46, 126, 146], [0, 20, 95, 110], [-10, 6, 95, 141], [5, 19, 118, 127],
  [-39, -11, 113, 154], [-47, -34, 166, 179], [-90, -66, -180, 180],
] as const;

const D2R = Math.PI / 180;

const hexToVec3 = (hex: string): THREE.Vector3 => {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
};

const latLonToVec3 = (lat: number, lon: number, r: number): THREE.Vector3 => {
  const phi = (90 - lat) * D2R;
  const theta = (lon + 180) * D2R;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
};

const isLand = (lat: number, lon: number): boolean =>
  LAND.some(([a, b, c, d]) => lat >= a && lat <= b && lon >= c && lon <= d);

const arcCurve = (a0: Marker, b0: Marker, r: number, lift: number) => {
  const a = latLonToVec3(a0.lat, a0.lon, r);
  const b = latLonToVec3(b0.lat, b0.lon, r);
  const h = r * (1 + lift * (a.angleTo(b) / Math.PI) * 2);
  return new THREE.CubicBezierCurve3(
    a,
    a.clone().lerp(b, 0.25).normalize().multiplyScalar(h * 0.94),
    a.clone().lerp(b, 0.75).normalize().multiplyScalar(h * 0.94),
    b,
  );
};

export type GlobeHandle = {
  /** the one clock — 0 at the world view, 1 at the last city */
  setProgress: (p: number) => void;
  /** drop into a city's district; index is the city's station minus one */
  enterCity: (index: number) => void;
  exitCity: () => void;
  /** hand the scene the store-label elements to drive; it writes their
   *  transforms directly, because a per-frame setState would re-render the tree */
  bindStoreLabels: (elements: (HTMLElement | null)[]) => void;
  resize: () => void;
  applyConfig: () => void;
  dispose: () => void;
  /** how many scroll legs the runway must provide (stations − 1) */
  legs: number;
};

export type GlobeOptions = {
  canvas: HTMLCanvasElement;
  /** fired after the first DRAWN frame — a resolved promise is not readiness */
  onReady?: () => void;
};

export const createGlobeScene = ({ canvas, onReady }: GlobeOptions): GlobeHandle => {
  syncConfigFromTokens();

  // §2: one module decides what "mobile" means; everything below reads from it
  const tier = getTier();
  const reducedMotion = sceneShouldFreeze(tier);
  const dotCount = getDotCount(tier);
  const frameGap = getFrameBudget(tier) / 1000;

  const renderer = new THREE.WebGLRenderer({ canvas, ...getRendererFlags(tier) });
  renderer.setPixelRatio(getPixelRatio(tier));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  // the context is opaque now (alpha: false), so the canvas paints the ground
  scene.background = new THREE.Color(CONFIG.bgColor);
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);

  // fewest lights the look survives — a light-count change recompiles every program
  scene.add(new THREE.HemisphereLight(0xffffff, 0xeef4f8, 2.15));
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2.4, 2, 3.4);
  scene.add(key);

  // The axial tilt lives on a PARENT group. Writing globe.rotation.z in the frame
  // loop would rebuild the quaternion from euler and destroy the camera slerp.
  const tiltGroup = new THREE.Group();
  tiltGroup.rotation.z = CONFIG.tilt;
  const globe = new THREE.Group();
  tiltGroup.add(globe);
  scene.add(tiltGroup);

  const R = CONFIG.globeRadius;

  /* ── the paper-model body and its atmosphere edge ── */
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(R * 0.988, 96, 96),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(CONFIG.sphereColor),
      roughness: 1,
      metalness: 0,
    }),
  );
  globe.add(body);

  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.045, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uColor: { value: hexToVec3(CONFIG.rimColor) },
        uPower: { value: CONFIG.rimPower },
        uStrength: { value: CONFIG.rimStrength },
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vP;
        void main(){
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vP = mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uPower; uniform float uStrength;
        varying vec3 vN; varying vec3 vP;
        void main(){
          float f = 1.0 - abs(dot(normalize(vN), normalize(-vP)));
          gl_FragColor = vec4(uColor, pow(f, uPower) * uStrength);
        }`,
    }),
  );
  globe.add(rim);

  /* ── the dotted surface: a Fibonacci sphere, land vs sea ── */
  const makePoints = (list: THREE.Vector3[], color: string, size: number, opacity: number) =>
    new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(list),
      new THREE.PointsMaterial({
        color: new THREE.Color(color),
        size,
        sizeAttenuation: true,
        transparent: opacity < 1,
        opacity,
        depthWrite: opacity >= 1,
      }),
    );

  const land: THREE.Vector3[] = [];
  const sea: THREE.Vector3[] = [];
  const N = Math.floor(dotCount);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const v = new THREE.Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad);
    const lat = Math.asin(v.y) / D2R;
    let lon = Math.atan2(v.z, -v.x) / D2R - 180;
    if (lon < -180) lon += 360;
    (isLand(lat, lon) ? land : sea).push(v.multiplyScalar(R * 1.004));
  }
  const landDots = makePoints(land, CONFIG.landColor, CONFIG.landDotSize, 1);
  const seaDots = makePoints(sea, CONFIG.seaColor, CONFIG.seaDotSize, CONFIG.seaOpacity);
  globe.add(landDots, seaDots);

  /* ── routes and the parcels riding them ── */
  const home: Marker = { lat: CONFIG.homeLat, lon: CONFIG.homeLon };
  const pairs: [Marker, Marker][] = CITY_MARKERS.map((c) => [c, home] as [Marker, Marker]);
  for (let i = 0; i < CITY_MARKERS.length - 1; i++) {
    pairs.push([CITY_MARKERS[i], CITY_MARKERS[i + 1]]);
  }

  const arcMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(CONFIG.arcColor),
    transparent: true,
    opacity: CONFIG.arcOpacity,
    depthWrite: false,
  });
  const routeGroup = new THREE.Group();
  const routes: THREE.CubicBezierCurve3[] = [];
  for (const [a, b] of pairs) {
    const curve = arcCurve(a, b, R, CONFIG.arcLift);
    routeGroup.add(
      new THREE.Mesh(new THREE.TubeGeometry(curve, 72, CONFIG.arcWidth, 6, false), arcMaterial),
    );
    routes.push(curve);
  }
  globe.add(routeGroup);

  const per = Math.max(1, Math.floor(CONFIG.parcelsPerRoute));
  const parcelRiders: { route: number; offset: number }[] = [];
  const parcelSeed: THREE.Vector3[] = [];
  routes.forEach((_, r) => {
    for (let k = 0; k < per; k++) {
      parcelRiders.push({ route: r, offset: k / per + r * 0.13 });
      parcelSeed.push(new THREE.Vector3());
    }
  });
  const parcels = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(parcelSeed),
    new THREE.PointsMaterial({
      color: new THREE.Color(CONFIG.parcelColor),
      size: CONFIG.parcelSize,
      sizeAttenuation: true,
    }),
  );
  globe.add(parcels);

  /* ── beacons under slow radar pings ── */
  const pings: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = [];
  const beacons: THREE.Mesh[] = [];
  const beaconMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(CONFIG.beaconColor) });
  const pingMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(CONFIG.pingColor),
    transparent: true,
    opacity: CONFIG.pingOpacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  [...CITY_MARKERS, home].forEach((m, i) => {
    const p = latLonToVec3(m.lat, m.lon, R * 1.012);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(CONFIG.beaconSize, 16, 16), beaconMaterial);
    dot.position.copy(p);
    globe.add(dot);
    beacons.push(dot);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1, 40), pingMaterial.clone());
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    ring.userData = { phase: i * 0.37 };
    globe.add(ring);
    pings.push(ring);
  });

  /* ── the miniature district you can walk into ── */
  const CITY_LIST = [...CITIES].sort((a, b) => a.station - b.station);
  const dioramas: THREE.Group[] = [];
  /** one entry per city, one inner entry per store: the label's local anchor */
  const storeAnchors: THREE.Vector3[][] = [];
  /** One framing per city. A fixed distance cannot serve both a district whose
   *  landmark is a needle and one whose landmark is a dome — the first leaves
   *  the frame, the second is lost in it. */
  const cityFrameRadius: number[] = [];
  const cityFrameLook: number[] = [];

  const districtMat = (color: string, roughness: number) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness: 0,
    });

  CITY_LIST.forEach((city, ci) => {
    const group = new THREE.Group();
    const anchor = latLonToVec3(city.lat, city.lon, R);
    group.position.copy(anchor);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), anchor.clone().normalize());

    const U = CONFIG.dioramaSpread;
    const D = U * CONFIG.districtSpread;
    // ONE MODULE. Every dimension in the kit is a multiple of this.
    const M = CONFIG.storeyHeight;
    const palette: ArchPalette = {
      body: CONFIG.storeColor,
      cap: CONFIG.dioramaColor,
      accent: CONFIG.awningColor,
      shadow: CONFIG.parcelColor,
    };

    // deterministic per city, so a skyline never re-rolls between frames
    let seed = ci * 977 + 13;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

    // ground plate — what makes a cluster of boxes read as a model, not debris
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(U * 1.75, U * 1.75, 0.006, 56),
      districtMat(CONFIG.groundColor, 0.9),
    );
    plinth.position.y = 0.003;
    group.add(plinth);

    // two crossing streets. They are why the blocks read as a city rather than
    // a pile: the eye needs somewhere to walk before it believes the buildings.
    const streetMat = districtMat(CONFIG.streetColor, 0.95);
    for (const rot of [0, Math.PI / 2]) {
      const street = new THREE.Mesh(
        new THREE.BoxGeometry(U * 0.34, 0.004, U * 3.3),
        streetMat,
      );
      street.position.y = 0.0075;
      street.rotation.y = rot;
      group.add(street);
    }

    // the central plaza — the streets read as a roundabout around the landmark
    // instead of running straight under it
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(U * 0.62, U * 0.62, 0.003, 40),
      districtMat(CONFIG.groundColor, 0.82),
    );
    plaza.position.y = 0.0085;
    group.add(plaza);

    // the signature landmark. One per city, and it is the reason a district is
    // recognisable at a glance rather than being four sets of the same boxes.
    const landmark = buildLandmark(city.landmark, M, palette);
    landmark.position.y = 0.01;

    const bbox = new THREE.Box3();
    bbox.setFromObject(landmark); // measured while unparented, so this is local
    const landmarkTop = bbox.max.y;
    group.add(landmark);

    // The DISTANCE is set by the plate — it has to fit, and it is the same size
    // in every city. What a tall landmark actually needs is not more distance but
    // a higher look-at, so the tower is centred in the frame instead of leaving
    // through the top. Pulling back for height shrinks the streets for no gain.
    const districtRadius = U * 1.75;
    cityFrameRadius.push(Math.max(districtRadius * 1.15, landmarkTop * 0.82));
    cityFrameLook.push(landmarkTop * 0.45);

    const anchors: THREE.Vector3[] = [];

    city.stores.forEach((store) => {
      const building = buildStoreForm(store.form, M, palette);

      // Measure it BEFORE it is parented: Box3.setFromObject works in world
      // space, and once this group is sitting on the side of a rotating sphere
      // a world-space max.y is meaningless as a local label height.
      bbox.setFromObject(building);
      const top = bbox.max.y;

      building.position.set(store.x * D, 0.006, store.z * D);
      // long forms run parallel to the street they sit beside
      building.rotation.y = Math.abs(store.x) > Math.abs(store.z) ? Math.PI / 2 : 0;
      group.add(building);

      // the label rides the form's real top, so it never floats or sinks
      anchors.push(new THREE.Vector3(store.x * D, top + 0.006 + M * 0.5, store.z * D));
    });

    // Filler blocks give the district its background rhythm. They stay dumb on
    // purpose: if every block competes, nothing reads as a landmark.
    const taken = city.stores.map((st) => ({ x: st.x, z: st.z }));
    for (let gx = -2; gx <= 2; gx++) {
      for (let gz = -2; gz <= 2; gz++) {
        const nx = gx * 0.42;
        const nz = gz * 0.42;
        if (Math.abs(nx) < 0.2 || Math.abs(nz) < 0.2) continue; // the streets
        if (Math.hypot(nx, nz) < 0.34) continue; // the plaza
        if (taken.some((t) => Math.hypot(t.x - nx, t.z - nz) < 0.34)) continue;
        const h = M * (0.42 + rnd() * 0.9);
        const w = U * (0.2 + rnd() * 0.12);
        const block = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, w),
          districtMat(CONFIG.fillerColor, 0.72),
        );
        block.position.set(nx * D, h / 2 + 0.006, nz * D);
        block.rotation.y = rnd() * 0.3 - 0.15;
        group.add(block);
        const blot = contactShadow(w * 1.5, palette, 0.16);
        blot.position.set(nx * D, 0.0075, nz * D);
        group.add(blot);
      }
    }

    group.scale.set(1, 0.001, 1);
    group.visible = false;
    globe.add(group);
    dioramas.push(group);
    storeAnchors.push(anchors);
  });

  /* ── stations: the world view, then one per city ── */
  tiltGroup.updateMatrixWorld(true);
  const invTilt = tiltGroup.quaternion.clone().invert();
  const worldAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(invTilt);
  // A city parked exactly on the camera axis is viewed straight down its own
  // normal — its towers point at the lens and collapse to flat flakes.
  const cityAxis = new THREE.Vector3(0, Math.sin(CONFIG.cityPitch), Math.cos(CONFIG.cityPitch))
    .normalize()
    .applyQuaternion(invTilt);

  const worldBase = new THREE.Quaternion().setFromUnitVectors(
    latLonToVec3(CONFIG.openLat, CONFIG.openLon, 1).normalize(),
    worldAxis,
  );
  const spinQuat = new THREE.Quaternion();
  const stationQuats: THREE.Quaternion[] = [worldBase.clone()];
  for (const m of CITY_MARKERS) {
    stationQuats.push(
      new THREE.Quaternion().setFromUnitVectors(latLonToVec3(m.lat, m.lon, 1).normalize(), cityAxis),
    );
  }
  const legs = stationQuats.length - 1;

  /* ── the loop ── */
  const clock = new THREE.Clock();
  /** the distance at which a sphere of this radius fits BOTH axes of the frame */
  const fitDistance = (radius: number) => {
    const vTan = Math.tan((camera.fov * Math.PI) / 360);
    return Math.max(radius / vTan, radius / (vTan * camera.aspect));
  };

  const camPos = new THREE.Vector3(0, 0, fitDistance(CONFIG.worldRadius));
  const lookAt = new THREE.Vector3(0, 0, 0);
  const qTarget = new THREE.Quaternion();
  const spinAxis = new THREE.Vector3(0, 1, 0);
  let progress = 0;
  let smoothed = 0;
  let ready = false;
  let visible = true;

  // ── city mode ──
  let activeCity = -1;
  let lastCity = 0;
  let cityBlend = 0;
  let orbitAz = 0.6;
  let orbitEl = 0.55;
  /** a multiplier on the city's fitted distance, driven by the wheel */
  let orbitZoom = 1;
  let labelEls: (HTMLElement | null)[] = [];
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const worldUp = new THREE.Vector3(0, 1, 0).applyQuaternion(tiltGroup.quaternion);
  const anchorWorld = new THREE.Vector3();
  const upVec = new THREE.Vector3();
  const eastVec = new THREE.Vector3();
  const northVec = new THREE.Vector3();
  const cityPos = new THREE.Vector3();
  const cityLook = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const blendPos = new THREE.Vector3();
  const blendLook = new THREE.Vector3();
  // camera.lookAt resolves roll against camera.up. Left at world Y, a district
  // standing on the side of a sphere comes out rotated on the screen — its
  // streets read as a vertical ellipse. The up vector has to travel with us.
  const blendUp = new THREE.Vector3(0, 1, 0);
  const worldY = new THREE.Vector3(0, 1, 0);

  const onPointerDown = (e: PointerEvent) => {
    if (activeCity < 0) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging || activeCity < 0) return;
    orbitAz -= (e.clientX - lastX) * 0.006;
    // elevation is clamped well short of either pole: at the top the district
    // flattens into a floor plan, at the bottom the camera sinks into the globe
    orbitEl = Math.min(1.25, Math.max(0.12, orbitEl + (e.clientY - lastY) * 0.005));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (activeCity >= 0) canvas.style.cursor = "grab";
  };
  const onWheel = (e: WheelEvent) => {
    if (activeCity < 0) return;
    e.preventDefault();
    orbitZoom = Math.min(2.0, Math.max(0.55, orbitZoom + e.deltaY * 0.0016));
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  let lastFrame = 0;

  const applyConfig = () => {
    scene.background = new THREE.Color(CONFIG.bgColor);
    body.material.color.set(CONFIG.sphereColor);
    rim.material.uniforms.uColor.value.copy(hexToVec3(CONFIG.rimColor));
    rim.material.uniforms.uPower.value = CONFIG.rimPower;
    rim.material.uniforms.uStrength.value = CONFIG.rimStrength;
    landDots.material.color.set(CONFIG.landColor);
    landDots.material.size = CONFIG.landDotSize;
    seaDots.material.color.set(CONFIG.seaColor);
    seaDots.material.size = CONFIG.seaDotSize;
    seaDots.material.opacity = CONFIG.seaOpacity;
    arcMaterial.color.set(CONFIG.arcColor);
    arcMaterial.opacity = CONFIG.arcOpacity;
    parcels.material.color.set(CONFIG.parcelColor);
    parcels.material.size = CONFIG.parcelSize;
    for (const ring of pings) ring.material.color.set(CONFIG.pingColor);
  };
  applyConfig();

  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(getPixelRatio(tier));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  /**
   * §3: after the loader hands off, the frame loop must compile nothing.
   *
   * The districts are `visible = false` at load, and an invisible object's
   * material is exactly what gets compiled the first time it is shown — which
   * is mid-scroll, on the boundary where a city arrives. Everything is made
   * visible for the compile, then put back.
   */
  const prewarm = () => {
    const wasVisible = dioramas.map((g) => g.visible);
    for (const g of dioramas) {
      g.visible = true;
      g.scale.set(1, 1, 1);
    }
    const shadow = contactShadowTexture();
    if (shadow) renderer.initTexture(shadow);
    renderer.compile(scene, camera);
    renderer.render(scene, camera); // one real frame through the whole graph
    dioramas.forEach((g, i) => {
      g.visible = wasVisible[i];
      g.scale.set(1, 0.001, 1);
    });
  };

  const frame = () => {
    // render only when visible — the biggest saving on a scroll site
    if (document.hidden || !visible) return;

    const delta = Math.min(clock.getDelta(), 0.1); // a tab-restore must not teleport
    const t = clock.getElapsedTime();
    if (frameGap > 0 && t - lastFrame < frameGap) return;
    lastFrame = t;

    // one low-pass, upstream — everything downstream reads this value
    smoothed += (progress - smoothed) * (reducedMotion ? 1 : 0.26);

    const legT = smoothed * legs;
    const i = Math.min(legs - 1, Math.floor(legT));
    const f = legT - i;
    const e = f * f * (3 - 2 * f);

    if (!reducedMotion) {
      spinQuat.setFromAxisAngle(spinAxis, t * CONFIG.autoSpin);
      stationQuats[0].copy(worldBase).multiply(spinQuat);
    }
    qTarget.copy(stationQuats[i]).slerp(stationQuats[i + 1], e);
    globe.quaternion.slerp(qTarget, reducedMotion ? 1 : 1 - Math.exp(-4 * delta));

    // interpolate linearly, damp ONCE — that lag is the weight
    const stationDist = fitDistance(CONFIG.stationRadius);
    const dist = THREE.MathUtils.lerp(
      i === 0 ? fitDistance(CONFIG.worldRadius) : stationDist,
      stationDist,
      e,
    );
    const cityFramed = Math.min(1, legT);
    blendPos.set(0, 0, dist);
    blendLook.set(CONFIG.lookAtOffsetX, Math.sin(CONFIG.cityPitch) * 0.92 * cityFramed, 0);

    // ── city mode rides the SAME damped camera, blended over the station framing ──
    cityBlend +=
      ((activeCity >= 0 ? 1 : 0) - cityBlend) *
      (reducedMotion ? 1 : 1 - Math.exp(-3.6 * delta));
    if (cityBlend > 0.001) {
      const group = dioramas[activeCity >= 0 ? activeCity : lastCity];
      group.getWorldPosition(anchorWorld);
      upVec.copy(anchorWorld).normalize();
      // A tangent frame on the sphere at the district. The orbit happens inside
      // it, so the city's own "up" stays up however far the globe has turned.
      eastVec.copy(worldUp).cross(upVec);
      if (eastVec.lengthSq() < 1e-6) eastVec.set(1, 0, 0);
      eastVec.normalize();
      northVec.copy(upVec).cross(eastVec).normalize();

      const framedIdx = activeCity >= 0 ? activeCity : lastCity;
      const framedRadius = cityFrameRadius[framedIdx] ?? CONFIG.cityDistance;
      const fill = camera.aspect < 0.8 ? CONFIG.portraitFill : 1;
      const orbitDist = fitDistance(framedRadius * fill) * orbitZoom;
      const ce = Math.cos(orbitEl);
      const se = Math.sin(orbitEl);
      cityPos
        .copy(anchorWorld)
        .addScaledVector(upVec, se * orbitDist)
        .addScaledVector(eastVec, Math.cos(orbitAz) * ce * orbitDist)
        .addScaledVector(northVec, Math.sin(orbitAz) * ce * orbitDist);
      cityLook
        .copy(anchorWorld)
        .addScaledVector(upVec, cityFrameLook[activeCity >= 0 ? activeCity : lastCity]);

      const e2 = cityBlend * cityBlend * (3 - 2 * cityBlend);
      blendPos.lerp(cityPos, e2);
      blendLook.lerp(cityLook, e2);
      blendUp.copy(worldY).lerp(upVec, e2).normalize();
    } else {
      blendUp.copy(worldY);
    }

    const k = reducedMotion ? 1 : 1 - Math.exp(-CONFIG.cameraDamp * delta);
    camPos.lerp(blendPos, k);
    // damped as a separate vector, so the framing swings instead of pivoting
    lookAt.lerp(blendLook, k);
    camera.position.copy(camPos);
    camera.up.copy(blendUp);
    camera.lookAt(lookAt);

    const framedCity = activeCity >= 0 ? activeCity : lastCity;
    dioramas.forEach((g, ci) => {
      const a = Math.max(0, 1 - Math.abs(legT - (ci + 1)));
      let eased = a * a * (3 - 2 * a);
      // the district you are standing in stays up, whatever the scroll says
      if (ci === framedCity) eased = Math.max(eased, cityBlend);
      g.visible = eased > 0.002;
      if (g.visible) g.scale.set(1, Math.max(0.001, eased), 1);
    });

    // ── store labels: projected straight onto their DOM nodes, never through state ──
    if (labelEls.length > 0) {
      const group = dioramas[framedCity];
      const anchors = storeAnchors[framedCity];
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      const show = cityBlend > 0.45;
      labelEls.forEach((el, li) => {
        if (!el) return;
        const anchor = anchors[li];
        if (!anchor || !show) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          return;
        }
        projected.copy(anchor);
        group.localToWorld(projected);
        projected.project(camera);
        const behind = projected.z > 1;
        el.style.opacity = behind ? "0" : "1";
        el.style.pointerEvents = behind ? "none" : "auto";
        el.style.transform =
          `translate3d(${(projected.x * halfW + halfW).toFixed(1)}px, ` +
          `${(-projected.y * halfH + halfH).toFixed(1)}px, 0) translate(-50%, -100%)`;
      });
    }

    // A size-attenuated point becomes a huge square at arm's length, so the
    // surface dots have to shrink as the camera descends into a district —
    // otherwise they stand beside the buildings as blue slabs.
    const dotScale = 1 - 0.88 * cityBlend;
    landDots.material.size = CONFIG.landDotSize * dotScale;
    seaDots.material.size = CONFIG.seaDotSize * dotScale;

    // Everything that marks a city FROM ORBIT is wrong once you are standing in
    // it: the beacon becomes a boulder, the ping a lake, the atmosphere shell a
    // wall across the street. They belong to the world view, so they leave with it.
    const inCity = cityBlend > 0.6;
    routeGroup.visible = !inCity;
    parcels.visible = !inCity;
    for (const beacon of beacons) beacon.visible = !inCity;
    rim.material.uniforms.uStrength.value = CONFIG.rimStrength * (1 - cityBlend);

    // A canvas loop is NOT covered by an animation library's global skip flag —
    // turn the ambient motion off here, ourselves.
    if (!reducedMotion) {
      for (const ring of pings) {
        ring.visible = !inCity;
        const phase = typeof ring.userData.phase === "number" ? ring.userData.phase : 0;
        const u = (t * CONFIG.pingSpeed + phase) % 1;
        const s = 0.12 + u * CONFIG.pingSize;
        ring.scale.set(s, s, s);
        ring.material.opacity = (1 - u) * CONFIG.pingOpacity;
      }
      const pos = parcels.geometry.attributes.position as THREE.BufferAttribute;
      parcelRiders.forEach((p, idx) => {
        const v = routes[p.route].getPoint((t * CONFIG.parcelSpeed + p.offset) % 1);
        pos.setXYZ(idx, v.x, v.y, v.z);
      });
      pos.needsUpdate = true;
    }

    renderer.render(scene, camera);

    if (!ready) {
      // warm the whole graph BEFORE telling the loader it may leave
      prewarm();
      ready = true;
      onReady?.();
    }
  };

  renderer.setAnimationLoop(frame);

  // §4: one viewport of margin, so the scene is already warm when it arrives
  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0, rootMargin: "100% 0px" },
  );
  observer.observe(canvas);

  return {
    setProgress: (p: number) => {
      progress = Math.min(1, Math.max(0, p));
    },
    enterCity: (index: number) => {
      activeCity = index;
      lastCity = index;
      orbitAz = 0.6;
      orbitEl = 0.55;
      orbitZoom = 1;
      canvas.style.pointerEvents = "auto";
      canvas.style.cursor = "grab";
      // without this a touch drag scrolls the page instead of orbiting the city
      canvas.style.touchAction = "none";
      // The canvas normally sits at -z-10, behind <main> — which means <main>
      // swallows the pointer and the drag never reaches the scene. Inside a
      // district the canvas has to come above the page content, but stay under
      // the labels (z-30) and the chrome (z-40).
      canvas.style.zIndex = "20";
    },
    exitCity: () => {
      activeCity = -1;
      dragging = false;
      canvas.style.pointerEvents = "none";
      canvas.style.cursor = "";
      canvas.style.touchAction = "";
      canvas.style.zIndex = "";
    },
    bindStoreLabels: (elements) => {
      labelEls = elements;
    },
    resize,
    applyConfig,
    legs,
    dispose: () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      observer.disconnect();
      renderer.setAnimationLoop(null);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();
    },
  };
};
