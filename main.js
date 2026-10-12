import * as THREE from './lib/three.module.min.js';
import { CONFIG, STOPS, TEXT } from './content.js';

const gsap = window.gsap;
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const UP = new THREE.Vector3(0, 1, 0);

/* ───────────── Renderer (with a plain-text fallback) ───────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  showFallback();
  throw err;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

function showFallback() {
  const letter = STOPS.find((s) => s.letter);
  $('#fallback').innerHTML = `<div class="wrap"><h1>${CONFIG.herName}, ye tumhare liye.</h1>
    <div class="letter">${letter ? letter.steps[0] : ''}</div></div>`;
  $('#fallback').hidden = false;
  $('#intro').hidden = true;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x120a0e);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 60);

/* ───────────── Helpers ───────────── */
function makeTex(w, h, draw, { repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...o });
function box(w, h, d, mat, x, y, z, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

const glowTex = makeTex(64, 64, (g) => {
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
});

/* ───────────── Loading ───────────── */
const manager = new THREE.LoadingManager();
const texLoader = new THREE.TextureLoader(manager);
let assetsReady = false;
manager.onLoad = () => { assetsReady = true; enableEnter(); };
setTimeout(() => { assetsReady = true; enableEnter(); }, 9000);

/* ───────────── Room shell ───────────── */
const W = 8, H = 4, D = 9;

const floorTex = makeTex(512, 512, (g, w, h) => {
  g.fillStyle = '#5b3a2d'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `hsl(${20 + Math.random() * 8}, ${34 + Math.random() * 10}%, ${21 + Math.random() * 8}%)`;
    g.fillRect(0, i * 64 + 1, w, 62);
    g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      const y = i * 64 + 6 + Math.random() * 52;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + (Math.random() - 0.5) * 6); g.stroke();
    }
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(Math.random() * w, i * 64, 2, 64);
  }
}, { repeat: [3, 3.4] });

const back = THREE.BackSide;
const room = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [
  std(0x4e303c, { side: back }),                  // +x right wall
  std(0x4e303c, { side: back }),                  // -x left wall
  std(0x24151c, { side: back }),                  // ceiling
  std(0xffffff, { side: back, map: floorTex, roughness: 0.7 }), // floor
  std(0x4a2c38, { side: back }),                  // +z (behind camera)
  std(0x5e3947, { side: back }),                  // -z back wall
]);
room.position.y = H / 2;
scene.add(room);

const baseboard = std(0x2c1a22);
box(W, 0.16, 0.05, baseboard, 0, 0.08, -D / 2 + 0.025);
box(W, 0.16, 0.05, baseboard, 0, 0.08, D / 2 - 0.025);
box(0.05, 0.16, D, baseboard, -W / 2 + 0.025, 0.08, 0);
box(0.05, 0.16, D, baseboard, W / 2 - 0.025, 0.08, 0);

/* Rug + cushions */
const rugTex = makeTex(512, 512, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const cols = ['#f0d9c2', '#d98c8c', '#f0d9c2', '#c47478', '#e8b3a5', '#b8636d'];
  for (let i = 0; i < cols.length; i++) {
    g.fillStyle = cols[i];
    g.beginPath(); g.arc(w / 2, h / 2, w / 2 - i * 38, 0, Math.PI * 2); g.fill();
  }
});
const rug = new THREE.Mesh(new THREE.CircleGeometry(1.9, 64), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.012, -0.3);
scene.add(rug);

[[-0.9, 1.0, 0xe8a3a0], [-0.35, 1.45, 0xf0d2a8], [0.7, 0.6, 0xb8636d]].forEach(([x, z, c], i) => {
  const cu = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14), std(c));
  cu.scale.set(1, 0.38, 1); cu.position.set(x, 0.16, z - 0.3); cu.rotation.y = i * 0.9;
  scene.add(cu);
});

/* ───────────── Photo wall (back wall) ───────────── */
const frames = [];
const FRAME_LIST = [
  { id: 'p5', ar: 360 / 638,  h: 1.35, x: -3.35, y: 2.0,  r: 0.05 },
  { id: 'p4', ar: 360 / 480,  h: 1.05, x: -2.3,  y: 2.5,  r: -0.04 },
  { id: 'p2', ar: 360 / 640,  h: 1.5,  x: -1.35, y: 1.85, r: 0.025 },
  { id: 'p1', ar: 675 / 1200, h: 1.95, x: 0,     y: 2.2,  r: -0.015 },
  { id: 'p3', ar: 360 / 638,  h: 1.5,  x: 1.35,  y: 1.9,  r: -0.03 },
  { id: 'p6', ar: 360 / 638,  h: 1.45, x: 2.55,  y: 2.35, r: 0.04 },
];
FRAME_LIST.forEach((f) => {
  const tex = texLoader.load(`photos/${f.id}.webp`);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const w = f.h * f.ar;
  const g = new THREE.Group();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.34, f.h + 0.46),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }));
  shadow.position.set(0.04, -0.09, -0.01);
  const card = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, f.h + 0.26, 0.04), std(0xf3e7d6, { roughness: 0.8 }));
  card.position.y = -0.06;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, f.h),
    new THREE.MeshBasicMaterial({ map: tex, color: 0xe4ddd5, toneMapped: false }));
  pic.position.z = 0.022;
  const clip = box(0.07, 0.12, 0.03, std(0x3a2a2a), 0, f.h / 2 + 0.1, 0.03, g);
  [shadow, card, pic, clip].forEach((m) => { m.userData.photo = f.id; });
  g.add(shadow, card, pic);
  g.position.set(f.x, f.y, -D / 2 + 0.045);
  g.rotation.z = f.r;
  scene.add(g);
  frames.push(g);
});

/* ───────────── Fairy lights ───────────── */
const wire = [], bulbs = [];
function swag(a, b, sag, n) {
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= sag * Math.sin(Math.PI * t);
    pts.push(p);
  }
  wire.push(pts);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    bulbs.push(new THREE.Vector3().lerpVectors(a, b, t).setY(a.y + (b.y - a.y) * t - sag * Math.sin(Math.PI * t)));
  }
}
const BZ = -D / 2 + 0.08;
[-3.9, -1.95, 0, 1.95, 3.9].forEach((x, i, arr) => {
  if (i < arr.length - 1) swag(new THREE.Vector3(x, 3.75, BZ), new THREE.Vector3(arr[i + 1], 3.75, BZ), 0.42, 7);
});
const LX = -W / 2 + 0.08;
[-4.3, -1.4, 1.4, 4.3].forEach((z, i, arr) => {
  if (i < arr.length - 1) swag(new THREE.Vector3(LX, 3.8, z), new THREE.Vector3(LX, 3.8, arr[i + 1]), 0.4, 6);
});
const wireMat = new THREE.LineBasicMaterial({ color: 0x1a1013 });
wire.forEach((pts) => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireMat)));

const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.04, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0xffe3b5, toneMapped: false }), bulbs.length);
const mtx = new THREE.Matrix4();
bulbs.forEach((p, i) => { mtx.setPosition(p); bulbMesh.setMatrixAt(i, mtx); });
scene.add(bulbMesh);

function glowSet(points, color) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const m = new THREE.PointsMaterial({
    size: 0.34, map: glowTex, color, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0.9,
  });
  const p = new THREE.Points(geo, m); scene.add(p); return m;
}
const glowA = glowSet(bulbs.filter((_, i) => i % 2 === 0), 0xffc47e);
const glowB = glowSet(bulbs.filter((_, i) => i % 2 === 1), 0xffb0a0);

/* ───────────── Bed + window (left wall) ───────────── */
const BX = -W / 2;
box(2.7, 0.34, 1.9, std(0x3a2530), BX + 1.55, 0.17, 0);               // frame
box(2.6, 0.26, 1.8, std(0xf1e4d4), BX + 1.5, 0.47, 0);                // mattress
box(1.75, 0.13, 1.86, std(0xd98c94), BX + 2.0, 0.66, 0);              // blanket
box(0.12, 1.15, 2.0, std(0x3a2530), BX + 0.08, 0.62, 0);              // headboard
[-0.45, 0.45].forEach((z) => {
  const pil = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 14), std(0xfbf1e4));
  pil.scale.set(0.8, 0.28, 0.75); pil.position.set(BX + 0.55, 0.72, z); pil.rotation.y = z * 0.2;
  scene.add(pil);
});

const skyTex = makeTex(1024, 768, (g, w, h) => {
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#08102a'); bg.addColorStop(0.65, '#1d1d4d'); bg.addColorStop(1, '#3a2a5e');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.75})`;
    const s = Math.random() < 0.9 ? 1.3 : 2.4;
    g.fillRect(Math.random() * w, Math.random() * h * 0.85, s, s);
  }
  const mx = 720, my = 250;
  const halo = g.createRadialGradient(mx, my, 40, mx, my, 230);
  halo.addColorStop(0, 'rgba(255,240,205,.5)'); halo.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = halo; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f6f0df'; g.beginPath(); g.arc(mx, my, 92, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(160,150,130,.35)';
  [[-30, -20, 16], [25, 15, 22], [-10, 38, 11], [40, -35, 9], [-45, 20, 8]].forEach(([dx, dy, r]) => {
    g.beginPath(); g.arc(mx + dx, my + dy, r, 0, Math.PI * 2); g.fill();
  });
  // distant rooftops
  g.fillStyle = '#0d0a1c';
  let x = 0;
  while (x < w) { const bw = 50 + Math.random() * 80, bh = 40 + Math.random() * 110; g.fillRect(x, h - bh, bw, bh); x += bw + 4; }
  g.fillStyle = 'rgba(255,200,120,.8)';
  for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, h - 10 - Math.random() * 90, 3, 4);
});
const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.9), new THREE.MeshBasicMaterial({ map: skyTex, toneMapped: false }));
sky.rotation.y = Math.PI / 2; sky.position.set(BX + 0.03, 2.3, 0);
scene.add(sky);

const frameMat = std(0xe9dcc8, { roughness: 0.7 });
box(0.12, 0.12, 2.74, frameMat, BX + 0.06, 3.28, 0);
box(0.12, 0.12, 2.74, frameMat, BX + 0.06, 1.34, 0);
box(0.12, 2.06, 0.12, frameMat, BX + 0.06, 2.31, -1.31);
box(0.12, 2.06, 0.12, frameMat, BX + 0.06, 2.31, 1.31);
box(0.1, 1.94, 0.05, frameMat, BX + 0.06, 2.3, 0);
box(0.1, 0.05, 2.5, frameMat, BX + 0.06, 2.3, 0);
box(0.3, 0.07, 2.9, frameMat, BX + 0.17, 1.28, 0);                    // sill
[-1.62, 1.62].forEach((z) => {                                        // curtains
  box(0.1, 2.6, 0.62, std(0xd7a09f, { roughness: 1 }), BX + 0.1, 2.25, z);
  box(0.12, 0.08, 0.64, std(0xb8636d), BX + 0.11, 1.5, z);
});

/* ───────────── Desk, lamp, letter, diary, calendar (right wall) ───────────── */
const RX = W / 2;
const wood = std(0x7a5236, { roughness: 0.6 });
box(1.3, 0.07, 3.0, wood, RX - 0.75, 0.92, -1.3);
[[-0.2, -2.7], [-0.2, 0.1], [-1.2, -2.7], [-1.2, 0.1]].forEach(([dx, z]) => box(0.07, 0.9, 0.07, wood, RX + dx - 0.15, 0.45, z));

const lampX = RX - 0.55, lampZ = 0.0;
box(0.26, 0.03, 0.26, std(0x2c1a22), lampX, 0.97, lampZ);
box(0.025, 0.5, 0.025, std(0x2c1a22), lampX, 1.22, lampZ);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.22, 0.24, 20, 1, true),
  new THREE.MeshStandardMaterial({ color: 0xf5c78a, emissive: 0xffa84d, emissiveIntensity: 1.1, side: THREE.DoubleSide }));
shade.position.set(lampX, 1.5, lampZ); scene.add(shade);
const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb36b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
lampGlow.scale.set(0.85, 0.85, 1); lampGlow.position.set(lampX, 1.45, lampZ); scene.add(lampGlow);

// letter
const paperTex = makeTex(256, 340, (g, w, h) => {
  g.fillStyle = '#f7ecd9'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(140,100,80,.28)'; g.lineWidth = 1.2;
  for (let y = 70; y < h - 20; y += 22) { g.beginPath(); g.moveTo(26, y); g.lineTo(w - 26, y); g.stroke(); }
  g.fillStyle = '#6b3e3a'; g.font = '30px cursive'; g.fillText(`${CONFIG.herName},`, 26, 50);
  g.fillStyle = 'rgba(217,110,130,.9)'; g.font = '34px serif'; g.fillText('♥', w - 62, h - 28);
});
const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9 }));
paper.rotation.set(-Math.PI / 2, 0, 0);
paper.rotateOnWorldAxis(UP, -Math.PI / 2 + 0.14);   // top of the page points to the wall, so the writing reads upright
paper.position.set(RX - 0.8, 0.965, -0.85);
scene.add(paper);
const env = box(0.36, 0.012, 0.25, std(0xefd9bd), RX - 0.55, 0.97, -0.35); env.rotation.y = -0.25;
const seal = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), std(0xb8363f));
seal.rotation.x = -Math.PI / 2; seal.position.set(RX - 0.55, 0.98, -0.35); scene.add(seal);

// diary (open book)
const pageTex = makeTex(256, 340, (g, w, h) => {
  g.fillStyle = '#f5ead6'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,90,70,.3)'; g.lineWidth = 1.2;
  for (let y = 40; y < h - 20; y += 24) { g.beginPath(); g.moveTo(24, y); g.lineTo(w - 24, y); g.stroke(); }
});
box(0.84, 0.03, 0.56, std(0x8a4a52), RX - 0.8, 0.975, -2.0);
[-0.2, 0.2].forEach((dx, i) => {
  const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.52), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9 }));
  pg.rotation.set(-Math.PI / 2, 0, Math.PI / 2); pg.position.set(RX - 0.8, 0.993, -2.0 + (i ? 0.2 : -0.2));
  scene.add(pg);
});
const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), std(0x2a2a40));
pen.rotation.set(0, 0.5, Math.PI / 2); pen.position.set(RX - 0.55, 1.0, -2.5); scene.add(pen);

// calendar
const now = new Date();
const calTex = makeTex(360, 440, (g, w, h) => {
  g.fillStyle = '#fbf3e6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d98c94'; g.fillRect(0, 0, w, 86);
  g.fillStyle = '#fff'; g.font = '600 34px Georgia, serif'; g.textAlign = 'center';
  g.fillText(now.toLocaleString('en', { month: 'long' }).toUpperCase() + ' ' + now.getFullYear(), w / 2, 55);
  g.fillStyle = '#9a7a70'; g.font = '700 17px sans-serif';
  'SMTWTFS'.split('').forEach((d, i) => g.fillText(d, 36 + i * 48, 120));
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  g.font = '600 21px sans-serif';
  for (let d = 1; d <= days; d++) {
    const idx = first + d - 1, cx = 36 + (idx % 7) * 48, cy = 168 + Math.floor(idx / 7) * 50;
    if (d === now.getDate()) {
      g.fillStyle = 'rgba(217,110,130,.9)'; g.beginPath(); g.arc(cx, cy - 7, 21, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
    } else g.fillStyle = '#5a4038';
    g.fillText(String(d), cx, cy);
  }
});
const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshStandardMaterial({ map: calTex, roughness: 0.9 }));
cal.rotation.y = -Math.PI / 2; cal.position.set(RX - 0.03, 2.35, -2.0);
scene.add(cal);

/* ───────────── Plants ───────────── */
function plant(x, z) {
  box(0.4, 0.5, 0.4, std(0xc98a6a), x, 0.25, z);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), std(i % 2 ? 0x5f8a58 : 0x4b7648));
    const a = (i / 9) * Math.PI * 2;
    leaf.scale.set(0.8, 1.7, 0.4);
    leaf.position.set(x + Math.cos(a) * 0.22, 0.85 + (i % 3) * 0.2, z + Math.sin(a) * 0.22);
    leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    scene.add(leaf);
  }
}
plant(RX - 0.5, 3.6);
plant(-W / 2 + 0.5, -3.7);

/* ───────────── Floating dust / light motes ───────────── */
const MOTES = 140;
const motePos = new Float32Array(MOTES * 3), moteSeed = [];
for (let i = 0; i < MOTES; i++) {
  motePos[i * 3] = (Math.random() - 0.5) * 7.4;
  motePos[i * 3 + 1] = 0.3 + Math.random() * 3.5;
  motePos[i * 3 + 2] = (Math.random() - 0.5) * 8.4;
  moteSeed.push(0.5 + Math.random());
}
const moteGeo = new THREE.BufferGeometry();
moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
scene.add(new THREE.Points(moteGeo, new THREE.PointsMaterial({
  size: 0.07, map: glowTex, color: 0xffd9aa, transparent: true, opacity: 0.55,
  depthWrite: false, blending: THREE.AdditiveBlending,
})));

/* ───────────── Lights (they "turn on" when she walks in) ───────────── */
const hemi = new THREE.HemisphereLight(0xffd7b8, 0x3a2430, 0);
const amb = new THREE.AmbientLight(0xffb98a, 0);
const lampLight = new THREE.PointLight(0xffb36b, 0, 7, 2); lampLight.position.set(lampX, 1.55, lampZ);
const moonLight = new THREE.PointLight(0x9db4ff, 0, 8, 2); moonLight.position.set(BX + 0.8, 2.4, 0);
const fairyLights = [-2.4, 0, 2.4].map((x) => {
  const l = new THREE.PointLight(0xffc98a, 0, 7, 2); l.position.set(x, 3.2, BZ + 0.3); return l;
});
scene.add(hemi, amb, lampLight, moonLight, ...fairyLights);

const LEVELS = [
  [hemi, 1.1], [amb, 0.9], [lampLight, 13], [moonLight, 9],
  ...fairyLights.map((l) => [l, 10]),
];
LEVELS.forEach(([l, v]) => { l.intensity = v * 0.3; });          // dim until she enters
function lightsOn(seconds) {
  LEVELS.forEach(([l, v]) => gsap.to(l, { intensity: v, duration: reduceMotion ? 0.01 : seconds, ease: 'power2.out' }));
}
function warmUp() {
  lightsOnBoost = 1.25;
  gsap.to(lampLight, { intensity: 17, duration: 3 });
  gsap.to(amb, { intensity: 1.05, duration: 3 });
}
let lightsOnBoost = 1;

/* ───────────── Camera rig ───────────── */
const rig = { px: 0, py: 1.65, pz: 4.3, lx: 0, ly: 1.75, lz: -3 };
const look = { yaw: 0, pitch: 0 };
let parX = 0, parY = 0, parXs = 0, parYs = 0;
let portrait = false;

const CAMS = {
  door:     () => ({ p: [0, 1.65, 3.3], l: [0, 1.75, -3] }),
  photos:   (s, pt) => pt
    ? [{ p: [-2.2, 1.9, 0.4], l: [-2.2, 2.15, -4.5] }, { p: [0, 1.9, 0.4], l: [0, 2.15, -4.5] }, { p: [2.2, 1.9, 0.4], l: [2.2, 2.15, -4.5] }][Math.min(s, 2)]
    : { p: [0, 1.85, 1.0], l: [0, 1.7, -4.5] },
  letter:   () => ({ p: [1.45, 2.05, 0.1], l: [RX - 0.8, 0.9, -0.85] }),
  unsaid:   () => ({ p: [-0.4, 1.75, 1.3], l: [BX + 0.1, 2.0, 0.1] }),
  promises: (s, pt) => pt
    ? { p: [-1.0, 1.9, -1.9], l: [RX - 0.4, 1.45, -2.0] }
    : { p: [0.9, 1.85, -1.9], l: [RX - 0.4, 1.6, -2.0] },
  final:    () => ({ p: [0, 1.75, 3.0], l: [0, 2.0, -4] }),
};
const camSteps = (id) => (id === 'photos' && portrait ? 3 : 1);

function flyTo(c, seconds = 2.6) {
  gsap.to(rig, {
    px: c.p[0], py: c.p[1], pz: c.p[2], lx: c.l[0], ly: c.l[1], lz: c.l[2],
    duration: reduceMotion ? 0.01 : seconds, ease: 'power3.inOut', overwrite: true,
  });
}

/* ───────────── Resize ───────────── */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const wasPortrait = portrait;
  portrait = w / h < 0.9;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 700 ? 1.75 : 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = portrait ? 70 : 55;
  if (portrait) camera.setViewOffset(w, h, 0, h * 0.17, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  if (started && wasPortrait !== portrait) applyStop(false);
}
window.addEventListener('resize', resize);

/* ───────────── Interaction (drag to look, click frames) ───────────── */
const canvas = $('#scene');
const ray = new THREE.Raycaster();
let drag = null;

canvas.addEventListener('pointerdown', (e) => {
  drag = { sx: e.clientX, sy: e.clientY, yaw: look.yaw, pitch: look.pitch, moved: 0 };
  canvas.setPointerCapture(e.pointerId);
  gsap.killTweensOf(look);
});
canvas.addEventListener('pointermove', (e) => {
  if (drag) {
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    look.yaw = clamp(drag.yaw + dx * 0.004, -0.7, 0.7);
    look.pitch = clamp(drag.pitch + dy * 0.003, -0.32, 0.32);
  } else if (e.pointerType === 'mouse') {
    parX = -(e.clientX / window.innerWidth - 0.5) * 0.07;
    parY = -(e.clientY / window.innerHeight - 0.5) * 0.04;
  }
});
function endDrag(e) {
  if (!drag) return;
  const wasTap = drag.moved < 6;
  drag = null;
  gsap.to(look, { yaw: 0, pitch: 0, duration: 1.8, delay: 0.5, ease: 'power2.out' });
  if (wasTap && e.type === 'pointerup') tapAt(e.clientX, e.clientY);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

function tapAt(cx, cy) {
  if (!started || STOPS[state.i].id !== 'photos') return;
  ray.setFromCamera(new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1), camera);
  const hits = ray.intersectObjects(frames, true);
  const hit = hits.find((h) => h.object.userData.photo);
  if (hit) openLightbox(hit.object.userData.photo);
}
function openLightbox(id) {
  const lb = $('#lightbox');
  lb.querySelector('img').src = `photos/${id}.webp`;
  lb.hidden = false;
  gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: 0.3 });
}
$('#lightbox').addEventListener('click', () => { $('#lightbox').hidden = true; });

let wheelLock = 0;
canvas.addEventListener('wheel', (e) => {
  if (!started || performance.now() < wheelLock || Math.abs(e.deltaY) < 20) return;
  wheelLock = performance.now() + 1100;
  e.deltaY > 0 ? next() : prev();
}, { passive: true });

window.addEventListener('keydown', (e) => {
  if (!started || !$('#lightbox').hidden) { if (e.key === 'Escape') $('#lightbox').hidden = true; return; }
  if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key) && e.target === document.body) { e.preventDefault(); next(); }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
});

/* ───────────── Story state + panel ───────────── */
const state = { i: 0, s: 0 };
let started = false;

const totalSteps = (i) => Math.max(STOPS[i].steps.length, camSteps(STOPS[i].id));

function buildDots() {
  const nav = $('#dots');
  STOPS.forEach((st, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', st.title);
    b.addEventListener('click', () => { if (i !== state.i) { state.i = i; state.s = 0; applyStop(true); } });
    nav.appendChild(b);
  });
}

function applyStop(animateText = true) {
  const stop = STOPS[state.i];
  const stepCount = totalSteps(state.i);
  const textIdx = Math.min(state.s, stop.steps.length - 1);

  flyTo(CAMS[stop.id](state.s, portrait));

  $('#panel').classList.toggle('is-letter', !!stop.letter);
  $('#eyebrow').textContent = stop.eyebrow;
  $('#title').textContent = stop.title;
  const body = $('#body');
  body.innerHTML = stop.steps[textIdx];
  const parts = [...body.children].length ? [...body.children] : [body];
  if (animateText && !reduceMotion) {
    gsap.fromTo(parts, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, stagger: stop.letter ? 0.45 : 0.18, delay: 0.5 });
  }

  const isFinal = !!stop.final;
  const actions = $('#actions');
  actions.innerHTML = '';
  const backBtn = mkBtn(TEXT.back, 'btn ghost', prev);
  if (state.i > 0 || state.s > 0) actions.appendChild(backBtn);

  if (isFinal) {
    const talk = mkBtn(TEXT.talk, 'btn primary', onTalk);
    const replay = mkBtn(TEXT.replay, 'btn ghost', () => { state.i = 0; state.s = 0; applyStop(true); });
    actions.append(talk, replay);
    spawnHearts();
    warmUp();
  } else {
    const isLastStep = state.s >= stepCount - 1;
    const label = isLastStep ? (stop.next || 'Aage') : (state.i === 1 ? 'Aage' : 'Aage');
    actions.appendChild(mkBtn(label, 'btn primary', next));
  }

  [...$('#dots').children].forEach((d, i) => d.classList.toggle('on', i === state.i));
  showHint();
}

function mkBtn(label, cls, fn) {
  const b = document.createElement('button');
  b.className = cls; b.textContent = label; b.addEventListener('click', fn);
  return b;
}

function next() {
  if (!started) return;
  if (state.s < totalSteps(state.i) - 1) state.s++;
  else if (state.i < STOPS.length - 1) { state.i++; state.s = 0; }
  else return;
  applyStop(true);
}
function prev() {
  if (!started) return;
  if (state.s > 0) state.s--;
  else if (state.i > 0) { state.i--; state.s = 0; }
  else return;
  applyStop(true);
}

function onTalk() {
  if (CONFIG.whatsappNumber) {
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappText)}`, '_blank', 'noopener');
  } else {
    const body = $('#body');
    body.innerHTML = `<p>${TEXT.talkSoft}</p>`;
    gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.8 });
  }
}

function spawnHearts() {
  if (reduceMotion) return;
  const wrap = $('#hearts');
  for (let i = 0; i < 16; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = '♥';
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = 14 + Math.random() * 22 + 'px';
    h.style.animationDuration = 6 + Math.random() * 6 + 's';
    h.style.animationDelay = Math.random() * 4 + 's';
    wrap.appendChild(h);
    setTimeout(() => h.remove(), 14000);
  }
}

let hintShown = 0;
function showHint() {
  if (hintShown >= 2 || state.i > 1) return;
  hintShown++;
  const h = $('#hint');
  h.textContent = TEXT.hintDrag;
  gsap.fromTo(h, { opacity: 0 }, { opacity: 0.9, duration: 0.8, delay: 2.4, yoyo: true, repeat: 1, repeatDelay: 2.4 });
}

/* ───────────── Music (YouTube, starts on her first tap) ───────────── */
let yt = null, ytReady = false, wantPlay = false, musicOn = false;
function initMusic() {
  if (!CONFIG.songYouTubeId) return;
  $('#soundnote').textContent = TEXT.soundOn;
  $('#soundnote').hidden = false;
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(s);
  window.onYouTubeIframeAPIReady = () => {
    yt = new window.YT.Player('yt', {
      width: '1', height: '1', videoId: CONFIG.songYouTubeId,
      playerVars: { playsinline: 1, controls: 0, disablekb: 1, loop: 1, playlist: CONFIG.songYouTubeId, start: CONFIG.songStartSeconds, modestbranding: 1 },
      events: {
        onReady: () => { ytReady = true; yt.setVolume(60); if (wantPlay) playMusic(); },
        onError: () => { $('#mute').hidden = true; },
      },
    });
  };
}
function playMusic() { wantPlay = true; if (ytReady) { yt.playVideo(); musicOn = true; $('#mute').classList.remove('off'); } }
function toggleMusic() {
  if (!ytReady) return;
  if (musicOn) { yt.pauseVideo(); musicOn = false; $('#mute').classList.add('off'); }
  else playMusic();
}
$('#mute').addEventListener('click', toggleMusic);

/* ───────────── Entrance ───────────── */
function enableEnter() {
  const b = $('#enter');
  if (!b.disabled) return;
  b.disabled = false; b.textContent = TEXT.enter;
}
$('#enter').addEventListener('click', () => {
  if (started) return;
  started = true;
  if (CONFIG.songYouTubeId) { playMusic(); $('#mute').hidden = false; }
  gsap.to('#intro', { opacity: 0, duration: 1.4, ease: 'power1.inOut', onComplete: () => { $('#intro').hidden = true; } });
  $('#hud').hidden = false;
  lightsOn(3.2);
  state.i = 0; state.s = 0;
  applyStop(true);
  gsap.fromTo('#panel', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, delay: 1.2 });
});

/* ───────────── Render loop ───────────── */
const clock = new THREE.Clock();
const dir = new THREE.Vector3(), right = new THREE.Vector3(), target = new THREE.Vector3();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), 0.05);

  parXs += (parX - parXs) * 0.05; parYs += (parY - parYs) * 0.05;
  const swayX = reduceMotion ? 0 : Math.sin(t * 0.35) * 0.035;
  const swayY = reduceMotion ? 0 : Math.sin(t * 0.5) * 0.02;

  dir.set(rig.lx - rig.px, rig.ly - rig.py, rig.lz - rig.pz);
  const len = dir.length();
  dir.normalize().applyAxisAngle(UP, look.yaw + parXs);
  right.crossVectors(dir, UP).normalize();
  dir.applyAxisAngle(right, look.pitch + parYs);

  camera.position.set(rig.px + swayX, rig.py + swayY, rig.pz);
  target.copy(camera.position).addScaledVector(dir, len);
  camera.lookAt(target);

  // fairy twinkle + lamp flicker
  glowA.opacity = 0.65 + 0.35 * Math.sin(t * 1.7);
  glowB.opacity = 0.65 + 0.35 * Math.sin(t * 1.7 + Math.PI);
  lampGlow.material.opacity = (0.42 + 0.05 * Math.sin(t * 3.1)) * lightsOnBoost;

  // drifting motes
  for (let i = 0; i < MOTES; i++) {
    const sp = moteSeed[i];
    motePos[i * 3 + 1] += 0.012 * sp * (1 / 60);
    motePos[i * 3] += Math.sin(t * 0.3 * sp + i) * 0.0009;
    if (motePos[i * 3 + 1] > 3.9) motePos[i * 3 + 1] = 0.3;
  }
  moteGeo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
});

/* ───────────── Boot ───────────── */
buildDots();
initMusic();
resize();
const first = CAMS.door();
Object.assign(rig, { px: first.p[0], py: first.p[1], pz: first.p[2] + 1.0, lx: first.l[0], ly: first.l[1], lz: first.l[2] });
window.__room = { next, prev, go: (i, s = 0) => { state.i = i; state.s = s; applyStop(true); }, state };
