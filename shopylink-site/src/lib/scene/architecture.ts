/**
 * The architecture kit.
 *
 * Every building in every district is assembled from these forms, so the four
 * cities read as one designed system rather than four sets of boxes. The rules
 * that keep it from looking like a toy:
 *
 *   1. ONE MODULE. Every dimension is a multiple of `M` (a storey). Nothing is
 *      an arbitrary number, so nothing sits half a beat off its neighbour.
 *   2. SILHOUETTE FIRST. Each form must be recognisable from its outline alone;
 *      detail is only ever added to sharpen that outline, never to decorate.
 *   3. SLENDERNESS IS EARNED. A tower tapers or steps back as it rises. A mass
 *      that goes straight up at a constant footprint reads as a carton.
 *   4. EVERYTHING SITS. Every form gets a base and a contact shadow. Objects
 *      that float are the single loudest amateur tell in a 3D scene.
 *   5. ONE ACCENT, RATIONED. Sky blue marks the street edge and nothing else.
 *
 * Forms are abstractions of a city's massing — a tapered spire, a domed mass
 * with minarets, a stepped setback tower. They are deliberately NOT models of
 * named buildings.
 */
import * as THREE from "three";

export type ArchPalette = {
  /** the main mass */
  body: string;
  /** roofs, caps, and anything that should sit back a step */
  cap: string;
  /** the one rationed hue */
  accent: string;
  /** contact shadow ink */
  shadow: string;
};

const mat = (color: string, roughness = 0.62) =>
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness: 0,
  });

/** A soft radial blot, drawn once and shared. Grounding without a shadow map. */
let shadowTexture: THREE.CanvasTexture | null = null;
const getShadowTexture = (): THREE.CanvasTexture => {
  if (shadowTexture) return shadowTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  shadowTexture = new THREE.CanvasTexture(canvas);
  return shadowTexture;
};

/** §3: the loader must upload this before the first scroll frame samples it. */
export const contactShadowTexture = (): THREE.CanvasTexture | null => shadowTexture;

export const contactShadow = (radius: number, palette: ArchPalette, opacity = 0.22) => {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette.shadow),
      map: getShadowTexture(),
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.0009;
  return plane;
};

/** A hairline along a mass's own edges. On the masses only — never on struts. */
const outline = (mesh: THREE.Mesh, palette: ArchPalette, opacity = 0.5) => {
  mesh.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 18),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.accent),
        transparent: true,
        opacity,
      }),
    ),
  );
  return mesh;
};

/** The street-level band that says "you can walk in here". */
export const shopfront = (width: number, depth: number, M: number, palette: ArchPalette) => {
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(width * 1.06, M * 0.1, depth * 1.06),
    mat(palette.accent, 0.55),
  );
  band.position.y = M * 0.12;
  return band;
};

const base = (width: number, depth: number, M: number, palette: ArchPalette) => {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(width * 1.18, M * 0.18, depth * 1.18),
    mat(palette.cap, 0.8),
  );
  b.position.y = M * 0.09;
  return b;
};

/* ────────────────────────────────────────────────────────────────
   Signature landmarks — one per city. These carry the skyline.
   ──────────────────────────────────────────────────────────────── */

/** Dubai — a triple-lobed shaft stepping back in a spiral to a needle. */
export const spire = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const tiers = 9;
  const bodyMat = mat(palette.body, 0.5);

  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    // the footprint contracts on a curve, not linearly — that curve IS the form
    const r = M * 0.5 * Math.pow(1 - t, 0.72) + M * 0.045;
    const h = M * 0.62;
    const lobe = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, h, 3, 1), bodyMat);
    lobe.position.y = M * 0.2 + h * i + h / 2;
    lobe.rotation.y = i * 0.42; // the spiral
    g.add(lobe);
  }

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.008, M * 0.03, M * 1.5, 6),
    mat(palette.cap, 0.4),
  );
  mast.position.y = M * 0.2 + M * 0.62 * tiers + M * 0.75;
  g.add(mast);

  g.add(base(M * 1.2, M * 1.2, M, palette));
  g.add(contactShadow(M * 1.5, palette));
  return g;
};

/** Guangzhou — a hyperboloid of slender struts, waisted at the middle. */
export const latticeTower = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const height = M * 5.0;
  const struts = 22;
  const twist = 1.05;
  const rBottom = M * 0.46;
  const rTop = M * 0.24;
  const strutMat = mat(palette.body, 0.45);
  const strutGeo = new THREE.CylinderGeometry(M * 0.017, M * 0.017, 1, 5, 1);

  for (let i = 0; i < struts; i++) {
    const a0 = (i / struts) * Math.PI * 2;
    const a1 = a0 + twist;
    const p0 = new THREE.Vector3(Math.cos(a0) * rBottom, 0, Math.sin(a0) * rBottom);
    const p1 = new THREE.Vector3(Math.cos(a1) * rTop, height, Math.sin(a1) * rTop);
    const dir = p1.clone().sub(p0);

    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.scale.y = dir.length();
    strut.position.copy(p0).addScaledVector(dir, 0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    g.add(strut);
  }

  // three rings tie the cage together — without them it reads as loose sticks
  [0.12, 0.52, 0.94].forEach((t) => {
    const r = THREE.MathUtils.lerp(rBottom, rTop, t) * 1.02;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, M * 0.016, 6, 28),
      mat(palette.cap, 0.5),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = height * t;
    g.add(ring);
  });

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.006, M * 0.016, M * 1.0, 6),
    mat(palette.cap, 0.4),
  );
  antenna.position.y = height + M * 0.5;
  g.add(antenna);

  g.add(base(M * 1.1, M * 1.1, M, palette));
  g.add(contactShadow(M * 1.4, palette));
  return g;
};

/** Istanbul — a drum and dome with a ring of half-domes and four minarets. */
export const domedMass = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const bodyMat = mat(palette.body, 0.68);
  const capMat = mat(palette.cap, 0.6);

  const hall = outline(
    new THREE.Mesh(new THREE.BoxGeometry(M * 1.5, M * 0.9, M * 1.5), bodyMat),
    palette,
    0.35,
  );
  hall.position.y = M * 0.63;
  g.add(hall);

  const drum = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.5, M * 0.54, M * 0.34, 16),
    bodyMat,
  );
  drum.position.y = M * 1.25;
  g.add(drum);

  // an ogee profile, not a hemisphere — the difference is the whole silhouette
  const profile: THREE.Vector2[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * Math.PI * 0.5;
    profile.push(
      new THREE.Vector2(Math.cos(angle) * M * 0.5, Math.sin(angle) * M * 0.44 * (1 - 0.12 * t)),
    );
  }
  const dome = new THREE.Mesh(new THREE.LatheGeometry(profile, 20), capMat);
  dome.position.y = M * 1.42;
  g.add(dome);

  // four half-domes buttressing the corners — what makes it read Ottoman
  [0, 1, 2, 3].forEach((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const half = new THREE.Mesh(new THREE.SphereGeometry(M * 0.26, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    half.position.set(Math.cos(a) * M * 0.62, M * 1.08, Math.sin(a) * M * 0.62);
    g.add(half);
  });

  // minarets: slender, with a balcony and a conical cap
  [0, 1, 2, 3].forEach((i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * M * 0.95;
    const z = Math.sin(a) * M * 0.95;

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(M * 0.045, M * 0.058, M * 2.3, 10),
      bodyMat,
    );
    shaft.position.set(x, M * 1.15, z);
    g.add(shaft);

    const balcony = new THREE.Mesh(
      new THREE.CylinderGeometry(M * 0.075, M * 0.075, M * 0.06, 10),
      capMat,
    );
    balcony.position.set(x, M * 1.95, z);
    g.add(balcony);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(M * 0.055, M * 0.34, 10), capMat);
    cap.position.set(x, M * 2.47, z);
    g.add(cap);
  });

  g.add(base(M * 1.9, M * 1.9, M, palette));
  g.add(contactShadow(M * 2.0, palette));
  return g;
};

/** New York — setbacks stepping back to a crown and a mast. */
export const decoTower = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const bodyMat = mat(palette.body, 0.55);
  const tiers = [
    { w: 1.05, h: 1.5 },
    { w: 0.86, h: 1.3 },
    { w: 0.7, h: 1.1 },
    { w: 0.54, h: 0.95 },
    { w: 0.4, h: 0.8 },
    { w: 0.27, h: 0.6 },
  ];
  let y = M * 0.18;
  tiers.forEach((tier, i) => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(M * tier.w, M * tier.h, M * tier.w),
      bodyMat,
    );
    box.position.y = y + (M * tier.h) / 2;
    g.add(i < 3 ? outline(box, palette, 0.32) : box);
    y += M * tier.h;
  });

  const crown = new THREE.Mesh(new THREE.ConeGeometry(M * 0.15, M * 0.5, 8), mat(palette.cap, 0.45));
  crown.position.y = y + M * 0.25;
  g.add(crown);

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.007, M * 0.014, M * 1.1, 6),
    mat(palette.cap, 0.4),
  );
  mast.position.y = y + M * 1.05;
  g.add(mast);

  g.add(base(M * 1.25, M * 1.25, M, palette));
  g.add(contactShadow(M * 1.5, palette));
  return g;
};

/* ────────────────────────────────────────────────────────────────
   Store forms — quieter, but built from the same module.
   ──────────────────────────────────────────────────────────────── */

/** A long low mall: two stepped slabs and a glazed entry. */
export const podium = (M: number, palette: ArchPalette, storeys = 2) => {
  const g = new THREE.Group();
  const w = M * 1.6;
  const d = M * 1.05;
  const lower = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w, M * storeys * 0.5, d), mat(palette.body)),
    palette,
    0.34,
  );
  lower.position.y = M * 0.18 + (M * storeys * 0.5) / 2;
  g.add(lower);

  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.62, M * storeys * 0.34, d * 0.72),
    mat(palette.cap, 0.7),
  );
  upper.position.y = M * 0.18 + M * storeys * 0.5 + (M * storeys * 0.34) / 2;
  g.add(upper);

  g.add(shopfront(w, d, M, palette));
  g.add(base(w, d, M, palette));
  g.add(contactShadow(M * 1.35, palette));
  return g;
};

/** A souk hall under a barrel vault, with an arched mouth. */
export const vaultedHall = (M: number, palette: ArchPalette, bays = 3) => {
  const g = new THREE.Group();
  const w = M * 1.35;
  const d = M * 0.92;

  const walls = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w, M * 0.62, d), mat(palette.body, 0.72)),
    palette,
    0.3,
  );
  walls.position.y = M * 0.18 + M * 0.31;
  g.add(walls);

  for (let i = 0; i < bays; i++) {
    const vault = new THREE.Mesh(
      new THREE.CylinderGeometry(d * 0.5, d * 0.5, w / bays - M * 0.03, 14, 1, false, 0, Math.PI),
      mat(palette.cap, 0.66),
    );
    vault.rotation.z = Math.PI / 2;
    vault.position.set(-w / 2 + (w / bays) * (i + 0.5), M * 0.18 + M * 0.62, 0);
    g.add(vault);
  }

  g.add(shopfront(w, d, M, palette));
  g.add(base(w, d, M, palette));
  g.add(contactShadow(M * 1.25, palette));
  return g;
};

/** A wholesale shed: a sawtooth north-light roof over a long floor plate. */
export const sawtoothShed = (M: number, palette: ArchPalette, bays = 5) => {
  const g = new THREE.Group();
  const w = M * 1.7;
  const d = M * 1.0;

  const hall = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w, M * 0.5, d), mat(palette.body, 0.75)),
    palette,
    0.28,
  );
  hall.position.y = M * 0.18 + M * 0.25;
  g.add(hall);

  const toothShape = new THREE.Shape();
  toothShape.moveTo(0, 0);
  toothShape.lineTo(w / bays, 0);
  toothShape.lineTo(w / bays, M * 0.1);
  toothShape.lineTo(0, M * 0.3);
  toothShape.lineTo(0, 0);
  const toothGeo = new THREE.ExtrudeGeometry(toothShape, { depth: d, bevelEnabled: false });

  for (let i = 0; i < bays; i++) {
    const tooth = new THREE.Mesh(toothGeo, mat(palette.cap, 0.7));
    tooth.position.set(-w / 2 + (w / bays) * i, M * 0.68, -d / 2);
    g.add(tooth);
  }

  g.add(shopfront(w, d, M, palette));
  g.add(base(w, d, M, palette));
  g.add(contactShadow(M * 1.4, palette));
  return g;
};

/** A Gulf wind tower: a square block capped by a slotted barjeel. */
export const windTower = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const w = M * 0.86;

  const block = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w, M * 0.95, w), mat(palette.body, 0.74)),
    palette,
    0.34,
  );
  block.position.y = M * 0.18 + M * 0.475;
  g.add(block);

  const tower = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, M * 0.75, w * 0.42), mat(palette.body, 0.7)),
    palette,
    0.4,
  );
  tower.position.y = M * 0.18 + M * 0.95 + M * 0.375;
  g.add(tower);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.56, M * 0.08, w * 0.56),
    mat(palette.cap, 0.6),
  );
  cap.position.y = M * 0.18 + M * 0.95 + M * 0.75 + M * 0.04;
  g.add(cap);

  g.add(shopfront(w, w, M, palette));
  g.add(base(w, w, M, palette));
  g.add(contactShadow(M * 1.0, palette));
  return g;
};

/** A loft block with a water tank on the roof — the New York tell. */
export const loftBlock = (M: number, palette: ArchPalette, storeys = 3) => {
  const g = new THREE.Group();
  const w = M * 0.95;
  const d = M * 0.8;
  const h = M * storeys * 0.42;

  const block = outline(
    new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(palette.body, 0.7)),
    palette,
    0.32,
  );
  block.position.y = M * 0.18 + h / 2;
  g.add(block);

  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(w * 1.05, M * 0.07, d * 1.05),
    mat(palette.cap, 0.7),
  );
  parapet.position.y = M * 0.18 + h + M * 0.035;
  g.add(parapet);

  const tank = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.11, M * 0.13, M * 0.26, 10),
    mat(palette.cap, 0.6),
  );
  tank.position.set(w * 0.2, M * 0.18 + h + M * 0.28, -d * 0.15);
  g.add(tank);

  const legs = new THREE.Mesh(
    new THREE.BoxGeometry(M * 0.2, M * 0.12, M * 0.2),
    mat(palette.cap, 0.7),
  );
  legs.position.set(w * 0.2, M * 0.18 + h + M * 0.09, -d * 0.15);
  g.add(legs);

  g.add(shopfront(w, d, M, palette));
  g.add(base(w, d, M, palette));
  g.add(contactShadow(M * 1.0, palette));
  return g;
};

/** A terrace of narrow units — the quiet form that gives a street its rhythm. */
export const terraceRow = (M: number, palette: ArchPalette, units = 4) => {
  const g = new THREE.Group();
  const unitW = M * 0.32;
  const w = unitW * units;
  const d = M * 0.7;

  for (let i = 0; i < units; i++) {
    const h = M * (0.62 + ((i * 37) % 5) * 0.07);
    const unit = outline(
      new THREE.Mesh(new THREE.BoxGeometry(unitW * 0.94, h, d), mat(palette.body, 0.72)),
      palette,
      0.3,
    );
    unit.position.set(-w / 2 + unitW * (i + 0.5), M * 0.18 + h / 2, 0);
    g.add(unit);
  }

  g.add(shopfront(w, d, M, palette));
  g.add(base(w, d, M, palette));
  g.add(contactShadow(M * 1.1, palette));
  return g;
};


/**
 * New York — a robed figure on a star fort, arm raised to a torch.
 *
 * Four cues carry this silhouette, and nothing else is needed: the raised torch
 * arm, the seven-ray crown, the triangular flare of the robe, and the star
 * pedestal. Get those and it is recognised at a glance; add face, folds or
 * fingers and it stops being a model and starts being a doll.
 */
export const libertyFigure = (M: number, palette: ArchPalette) => {
  const g = new THREE.Group();
  const bodyMat = mat(palette.body, 0.66);
  const capMat = mat(palette.cap, 0.6);

  /* ── the star fort ── */
  const points = 11;
  const star = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? M * 0.92 : M * 0.56;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) star.moveTo(x, y);
    else star.lineTo(x, y);
  }
  star.closePath();
  const fort = new THREE.Mesh(
    new THREE.ExtrudeGeometry(star, { depth: M * 0.3, bevelEnabled: false }),
    capMat,
  );
  fort.rotation.x = -Math.PI / 2;
  fort.position.y = M * 0.3 + 0.006;
  g.add(fort);

  /* ── the pedestal. It must read WIDER than the robe's hem, or the figure
        looks like it is growing out of the ground rather than standing on
        something built for it. ── */
  const pedestal = outline(
    new THREE.Mesh(new THREE.CylinderGeometry(M * 0.52, M * 0.66, M * 1.35, 4, 1), bodyMat),
    palette,
    0.3,
  );
  pedestal.rotation.y = Math.PI / 4;
  pedestal.position.y = M * 0.3 + M * 0.675 + 0.006;
  g.add(pedestal);

  const cornice = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.6, M * 0.6, M * 0.11, 4, 1),
    capMat,
  );
  cornice.rotation.y = Math.PI / 4;
  cornice.position.y = M * 0.3 + M * 1.35 + M * 0.055 + 0.006;
  g.add(cornice);

  const plinthTop = M * 0.3 + M * 1.35 + M * 0.11 + 0.006;

  /* ── the robe. A gentle taper, NOT a point: a hem twice the width of the
        shoulders reads as a standing figure, a hem four times their width
        reads as a cone. ── */
  const robeHeight = M * 1.9;
  const profile: THREE.Vector2[] = [];
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = M * (0.42 - 0.19 * t + 0.03 * Math.sin(t * Math.PI * 1.4));
    profile.push(new THREE.Vector2(r, t * robeHeight));
  }
  const robe = new THREE.Mesh(new THREE.LatheGeometry(profile, 22), bodyMat);
  robe.position.y = plinthTop;
  g.add(robe);

  const shoulderY = plinthTop + robeHeight;

  // a shoulder shelf, so the head sits ON something and the arm has an origin
  const shoulders = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.27, M * 0.24, M * 0.09, 20),
    bodyMat,
  );
  shoulders.position.y = shoulderY + M * 0.045;
  g.add(shoulders);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.09, M * 0.1, M * 0.13, 12),
    bodyMat,
  );
  neck.position.y = shoulderY + M * 0.155;
  g.add(neck);

  const headY = shoulderY + M * 0.36;
  const head = new THREE.Mesh(new THREE.SphereGeometry(M * 0.15, 16, 12), bodyMat);
  head.position.y = headY;
  g.add(head);

  /* ── the seven-ray crown ── */
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI; // a half turn, facing forward
    const lean = 0.72;
    const ray = new THREE.Mesh(new THREE.ConeGeometry(M * 0.026, M * 0.36, 5), capMat);
    ray.position.set(
      Math.cos(a) * M * 0.19,
      headY + M * 0.15,
      Math.sin(a) * M * 0.19,
    );
    ray.rotation.z = -Math.cos(a) * lean;
    ray.rotation.x = Math.sin(a) * lean;
    g.add(ray);
  }

  /* ── the raised arm, springing from the shoulder — not from the apex ── */
  const shoulderPoint = new THREE.Vector3(M * 0.24, shoulderY - M * 0.05, 0);
  const torchPoint = new THREE.Vector3(M * 0.72, shoulderY + M * 1.0, 0);
  const armDir = torchPoint.clone().sub(shoulderPoint);
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(M * 0.062, M * 0.08, armDir.length(), 10),
    bodyMat,
  );
  arm.position.copy(shoulderPoint).addScaledVector(armDir, 0.5);
  arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), armDir.clone().normalize());
  g.add(arm);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(M * 0.13, M * 0.075, M * 0.15, 12), capMat);
  cup.position.copy(torchPoint);
  g.add(cup);

  // the one place the accent is allowed to be a solid — and it is the focal
  // point of the whole district, so it earns it
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(M * 0.085, M * 0.26, 8),
    mat(palette.accent, 0.4),
  );
  flame.position.set(torchPoint.x, torchPoint.y + M * 0.2, torchPoint.z);
  g.add(flame);

  /* ── the tablet, held across the body ── */
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(M * 0.36, M * 0.5, M * 0.09), capMat);
  tablet.position.set(-M * 0.26, shoulderY - M * 0.5, M * 0.2);
  tablet.rotation.set(0.3, 0.4, 0.34);
  g.add(tablet);

  g.add(contactShadow(M * 1.6, palette));
  return g;
};

export type StoreForm =
  | "podium"
  | "vaultedHall"
  | "sawtoothShed"
  | "windTower"
  | "loftBlock"
  | "terraceRow";

export const buildStoreForm = (form: StoreForm, M: number, palette: ArchPalette) => {
  switch (form) {
    case "podium":
      return podium(M, palette, 3);
    case "vaultedHall":
      return vaultedHall(M, palette, 3);
    case "sawtoothShed":
      return sawtoothShed(M, palette, 5);
    case "windTower":
      return windTower(M, palette);
    case "loftBlock":
      return loftBlock(M, palette, 4);
    case "terraceRow":
      return terraceRow(M, palette, 4);
  }
};

export type LandmarkForm = "spire" | "latticeTower" | "domedMass" | "decoTower" | "libertyFigure";

export const buildLandmark = (form: LandmarkForm, M: number, palette: ArchPalette) => {
  switch (form) {
    case "spire":
      return spire(M, palette);
    case "latticeTower":
      return latticeTower(M, palette);
    case "domedMass":
      return domedMass(M, palette);
    case "decoTower":
      return decoTower(M, palette);
    case "libertyFigure":
      return libertyFigure(M, palette);
  }
};
