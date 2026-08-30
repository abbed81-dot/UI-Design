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
  dioramaColor: string;
  dioramaEdge: string;
  dioramaHeight: number;
  dioramaSpread: number;
  dioramaBlocks: number;
  globeRadius: number;
  tilt: number;
  autoSpin: number;
  farDistance: number;
  nearDistance: number;
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

  dioramaColor: "#f4fbff",
  dioramaEdge: "#0ea5e9",
  dioramaHeight: 0.23,
  dioramaSpread: 0.06,
  dioramaBlocks: 14,

  globeRadius: 1,
  tilt: 0.22,
  autoSpin: 0.045,
  farDistance: 3.5,
  nearDistance: 2.62,
  cameraDamp: 3.2,
  lookAtOffsetX: 0,
  openLat: 20,
  openLon: 58,
  /** radians a city is lifted ABOVE the camera axis, so its towers read in
   *  profile rather than end-on down their own normal */
  cityPitch: 0.4,

  /** the customer's door — every route converges here */
  homeLat: 24.71,
  homeLon: 46.68,
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

/** Station order must match `station` in src/content/site.ts. */
const CITY_MARKERS: readonly Marker[] = [
  { lat: 25.2, lon: 55.27 },
  { lat: 23.13, lon: 113.26 },
  { lat: 41.01, lon: 28.98 },
  { lat: 40.71, lon: -74.01 },
];

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
  resize: () => void;
  applyConfig: () => void;
  dispose: () => void;
  /** how many scroll legs the runway must provide (stations − 1) */
  legs: number;
};

export type GlobeOptions = {
  canvas: HTMLCanvasElement;
  /** cut fill, not detail — fewer surface dots on a phone */
  dotCount?: number;
  /** fired after the first DRAWN frame — a resolved promise is not readiness */
  onReady?: () => void;
  reducedMotion?: boolean;
  /** frame budget in fps; 0 means uncapped */
  maxFps?: number;
};

export const createGlobeScene = ({
  canvas,
  onReady,
  reducedMotion = false,
  maxFps = 0,
  dotCount = CONFIG.dotCount,
}: GlobeOptions): GlobeHandle => {
  syncConfigFromTokens();

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // a 3× phone renders 9× the fragments
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
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

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1, 40), pingMaterial.clone());
    ring.position.copy(p);
    ring.lookAt(p.clone().multiplyScalar(2));
    ring.userData = { phase: i * 0.37 };
    globe.add(ring);
    pings.push(ring);
  });

  /* ── a miniature skyline that rises where the camera is looking ── */
  const dioramas: THREE.Group[] = [];
  const blockCount = Math.max(3, Math.floor(CONFIG.dioramaBlocks));
  CITY_MARKERS.forEach((m, ci) => {
    const group = new THREE.Group();
    const anchor = latLonToVec3(m.lat, m.lon, R);
    group.position.copy(anchor);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), anchor.clone().normalize());

    // deterministic per city, so a skyline never re-rolls between frames
    let seed = ci * 977 + 13;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

    for (let i = 0; i < blockCount; i++) {
      const h = CONFIG.dioramaHeight * (0.34 + rnd());
      const w = CONFIG.dioramaSpread * (0.22 + rnd() * 0.26);
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, w),
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(CONFIG.dioramaColor),
          roughness: 0.55,
          metalness: 0,
        }),
      );
      const a = rnd() * Math.PI * 2;
      const rr = Math.sqrt(rnd()) * CONFIG.dioramaSpread;
      box.position.set(Math.cos(a) * rr, h / 2, Math.sin(a) * rr);
      box.rotation.y = rnd() * Math.PI;
      box.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(box.geometry),
          new THREE.LineBasicMaterial({
            color: new THREE.Color(CONFIG.dioramaEdge),
            transparent: true,
            opacity: 0.92,
          }),
        ),
      );
      group.add(box);
    }

    // the plinth is what makes a cluster of boxes read as a model, not debris
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(CONFIG.dioramaSpread * 1.55, CONFIG.dioramaSpread * 1.55, 0.006, 48),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(CONFIG.dioramaColor),
        roughness: 0.85,
        metalness: 0,
      }),
    );
    plinth.position.y = 0.003;
    group.add(plinth);

    group.scale.set(1, 0.001, 1);
    group.visible = false;
    globe.add(group);
    dioramas.push(group);
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
  const camPos = new THREE.Vector3(0, 0, CONFIG.farDistance);
  const lookAt = new THREE.Vector3(0, 0, 0);
  const qTarget = new THREE.Quaternion();
  const spinAxis = new THREE.Vector3(0, 1, 0);
  let progress = 0;
  let smoothed = 0;
  let ready = false;
  let visible = true;
  let lastFrame = 0;
  const frameGap = maxFps > 0 ? 1 / maxFps : 0;

  const applyConfig = () => {
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
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
    const dist = THREE.MathUtils.lerp(
      i === 0 ? CONFIG.farDistance : CONFIG.nearDistance,
      CONFIG.nearDistance,
      e,
    );
    const cityFramed = Math.min(1, legT);
    const k = reducedMotion ? 1 : 1 - Math.exp(-CONFIG.cameraDamp * delta);
    camPos.lerp(new THREE.Vector3(0, 0, dist), k);
    // damped as a separate vector, so the framing swings instead of pivoting
    lookAt.lerp(
      new THREE.Vector3(CONFIG.lookAtOffsetX, Math.sin(CONFIG.cityPitch) * 0.92 * cityFramed, 0),
      k,
    );
    camera.position.copy(camPos);
    camera.lookAt(lookAt);

    dioramas.forEach((g, ci) => {
      const a = Math.max(0, 1 - Math.abs(legT - (ci + 1)));
      const eased = a * a * (3 - 2 * a);
      g.visible = eased > 0.002;
      if (g.visible) g.scale.set(1, Math.max(0.001, eased), 1);
    });

    // A canvas loop is NOT covered by an animation library's global skip flag —
    // turn the ambient motion off here, ourselves.
    if (!reducedMotion) {
      for (const ring of pings) {
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
      ready = true;
      onReady?.();
    }
  };

  renderer.setAnimationLoop(frame);

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 },
  );
  observer.observe(canvas);

  return {
    setProgress: (p: number) => {
      progress = Math.min(1, Math.max(0, p));
    },
    resize,
    applyConfig,
    legs,
    dispose: () => {
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
