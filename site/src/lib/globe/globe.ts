/**
 * globe.ts — #dunya: noktalı WebGL küre (three.js, tembel yüklenir).
 *
 * <div data-globe-scene>
 *   <div data-globe-stage>            ≥1100px: position: sticky (CSS) — küre sahnede kalır
 *     <figure data-globe='{"origin":{…},"markets":[…]}'>
 *       <canvas data-globe-canvas></canvas><span data-globe-origin>Malatya</span>
 *     </figure>
 *   </div>
 *   … <ol data-globe-list> <button data-market="0" aria-pressed="false">…</button> …
 * </div>
 *
 * - Kara noktaları: land-data.ts (Natural Earth 110m → Fibonacci küresi bit dizisi, çevrimdışı).
 *   Krem → kehribar: ışık sağ-üst-önden gelir; aydınlık yüz kehribara döner.
 * - Sert kenar yok: atmosfer, kameraya bakan bir düzlemde siluetten dışa sönen yumuşak ışıma
 *   (+ yüzeyde fresnel kenar). Tüm saydam çıktılar vec4(renk, alfa) → saydam tuvalde siyah halka oluşmaz.
 * - Rotalar (ince tüp) sahne kaydırıldıkça sırayla çizilir: ilk yay erken, onuncusu ilerlemenin ~%65'inde
 *   iner (varış nabzı). İnenlerde ara ara kuyruklu yıldız dolaşır. Liste odağı: küre ülkeye döner, rota renklenir.
 * - Bölüm görünüşe yaklaşınca (rootMargin) three dinamik içe aktarılır, renderer kurulur;
 *   ekran dışında / sekme gizliyken döngü durur; DPR ≤ 2 (büyük tuvalde daha da sınırlı);
 *   pagehide'da her şey serbest bırakılır.
 * - reduced-motion ya da WebGL yok → Canvas 2D ile durağan ortografik çizim (aynı veri, aynı liste).
 */
import { LAND_N, LAND_BITS } from './land-data';
import type { Market } from '@/content/tr/dunya';
import type { WebGLRenderer, MeshBasicMaterial } from 'three';

type Origin = { name: string; lat: number; lon: number };
type GlobeData = { origin: Origin; markets: Market[] };
type V3 = [number, number, number];

const DEG = Math.PI / 180;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const C = {
  dot: '#f6ebdd',
  dotLit: '#f1c98c',
  warm: '#f28c28',
  amber: '#e9a23b',
  honey: '#f6c56b',
  body: '#150c07',
  bodyLit: '#3a1f10',
};
/** Görünüm uzayında ışık yönü (sağ-üst-ön). */
const LIGHT: V3 = (() => {
  const v: V3 = [0.55, 0.5, 0.67];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
/** Kamera: küre tuvalin ~%64'ünü kaplar (CSS --F = D·1,564 bununla eşleşir); kalan pay atmosferin
 *  tuval kenarına varmadan sönmesi için (yoksa dikey kesik kenar görünür). */
const CAM_Z = 4.7;
const HALF = 1.6; // z=0 düzleminde tuvalin yarı genişliği (dünya birimi)
const FOV = (2 * Math.atan(HALF / CAM_Z) * 180) / Math.PI;
/** Rota zamanlaması (sahne ilerlemesi 0–1): i. yay START+i·STEP'te başlar, DUR sürede iner. */
const START = 0.02;
const STEP = 0.056;
const DUR = 0.13;

/** lat/lon (°) → birim küre; lon=0 kameraya (+z) bakar. */
function toVec(lat: number, lon: number, r = 1): V3 {
  const p = lat * DEG;
  const l = lon * DEG;
  return [r * Math.cos(p) * Math.sin(l), r * Math.sin(p), r * Math.cos(p) * Math.cos(l)];
}

/** Bit dizisi → kara noktalarının xyz'si (build-land.mjs ile aynı Fibonacci formülü). */
function landPositions(): Float32Array {
  const bin = atob(LAND_BITS);
  const out: number[] = [];
  for (let i = 0; i < LAND_N; i++) {
    if (!((bin.charCodeAt(i >> 3) >> (i & 7)) & 1)) continue;
    const y = 1 - ((i + 0.5) * 2) / LAND_N;
    const r = Math.sqrt(1 - y * y);
    const t = i * GOLDEN;
    out.push(Math.cos(t) * r, y, Math.sin(t) * r);
  }
  return new Float32Array(out);
}

/** a→b büyük çember yayı, ortası yükseltilmiş. segs+1 nokta. */
function arcPoints(a: V3, b: V3, segs: number): Float32Array {
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const ang = Math.acos(dot);
  const s = Math.sin(ang) || 1;
  const lift = 0.05 + 0.3 * (ang / Math.PI);
  const out = new Float32Array((segs + 1) * 3);
  for (let k = 0; k <= segs; k++) {
    const t = k / segs;
    const wa = Math.sin((1 - t) * ang) / s;
    const wb = Math.sin(t * ang) / s;
    const h = 1.006 + lift * Math.sin(Math.PI * t);
    out[k * 3] = (a[0] * wa + b[0] * wb) * h;
    out[k * 3 + 1] = (a[1] * wa + b[1] * wb) * h;
    out[k * 3 + 2] = (a[2] * wa + b[2] * wb) * h;
  }
  return out;
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 2.2);

/* ------------------------------------------------------------------------ */
/* Liste ↔ küre bağlantısı                                                   */
/* ------------------------------------------------------------------------ */
type FocusFn = (i: number) => void;

function wireList(section: HTMLElement, onFocus: FocusFn): () => void {
  const buttons = Array.from(section.querySelectorAll<HTMLButtonElement>('[data-market]'));
  let pinned = -1;
  const set = (i: number): void => {
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    section.toggleAttribute('data-market-active', i >= 0);
    onFocus(i);
  };
  const offs: (() => void)[] = [];
  buttons.forEach((b, i) => {
    const on = (): void => set(i);
    const off = (): void => set(pinned);
    // dokunmatikte dokunuş = sabitle/çöz (click), fare için üzerine gelme önizlemesi
    const click = (): void => {
      pinned = pinned === i ? -1 : i;
      set(pinned);
    };
    b.addEventListener('pointerenter', on);
    b.addEventListener('pointerleave', off);
    b.addEventListener('focus', on);
    b.addEventListener('blur', off);
    b.addEventListener('click', click);
    offs.push(() => {
      b.removeEventListener('pointerenter', on);
      b.removeEventListener('pointerleave', off);
      b.removeEventListener('focus', on);
      b.removeEventListener('blur', off);
      b.removeEventListener('click', click);
    });
  });
  return () => offs.forEach((f) => f());
}

/* ------------------------------------------------------------------------ */
/* Durağan çizim (reduced-motion / WebGL yok / bağlam kaybı)                  */
/* ------------------------------------------------------------------------ */
function drawStatic(figure: HTMLElement, canvas: HTMLCanvasElement, data: GlobeData, land: Float32Array, focus = -1): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = figure.clientWidth;
  const h = figure.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2, 2600 / Math.max(1, w, h));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const R = Math.min(w, h) * 0.32;
  const cx = w / 2;
  const cy = h / 2;
  // Merkez: Malatya'nın ~18° batısı; ry = −lon, rx = lat (WebGL dönüş kuralıyla aynı)
  const ry = -(data.origin.lon - 18) * DEG;
  const rx = data.origin.lat * 0.55 * DEG;
  const rot = (x: number, y: number, z: number): V3 => {
    const x1 = x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    return [x1, y2, z2];
  };
  // yumuşak atmosfer (dışa söner, sert halka yok)
  const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.5);
  halo.addColorStop(0, 'rgba(233,162,59,0.34)');
  halo.addColorStop(0.35, 'rgba(233,162,59,0.12)');
  halo.addColorStop(1, 'rgba(233,162,59,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createRadialGradient(cx + R * 0.38, cy - R * 0.34, R * 0.1, cx, cy, R);
  body.addColorStop(0, C.bodyLit);
  body.addColorStop(1, C.body);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  const o = toVec(data.origin.lat, data.origin.lon);
  for (let i = 0; i < land.length; i += 3) {
    const lx = land[i]!;
    const ly = land[i + 1]!;
    const lz = land[i + 2]!;
    const [x, y, z] = rot(lx, ly, lz);
    if (z <= 0) continue;
    const near = Math.max(0, 1 - Math.hypot(lx - o[0], ly - o[1], lz - o[2]) / 0.32);
    const lit = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2];
    ctx.globalAlpha = Math.min(1, (0.35 + 0.55 * z) * (0.75 + 0.35 * lit) * (1 + near * 0.5));
    ctx.fillStyle = near > 0 ? C.warm : lit > 0.62 ? C.amber : lit > 0.25 ? C.dotLit : C.dot;
    ctx.beginPath();
    ctx.arc(cx + x * R, cy - y * R, Math.max(0.7, R / 300) * (0.7 + 0.6 * z), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  data.markets.forEach((m, i) => {
    const pts = arcPoints(o, toVec(m.lat, m.lon), 64);
    const hi = focus === i;
    ctx.strokeStyle = hi ? C.honey : C.amber;
    ctx.globalAlpha = focus < 0 ? 0.75 : hi ? 1 : 0.22;
    ctx.lineWidth = hi ? 2.5 : 1.5;
    ctx.beginPath();
    let pen = false;
    for (let k = 0; k < pts.length; k += 3) {
      const [x, y, z] = rot(pts[k]!, pts[k + 1]!, pts[k + 2]!);
      // kürenin arkasında kalan kısım (diskin içinde ve z<0) çizilmez
      const hidden = z < 0 && x * x + y * y < 1;
      if (hidden) {
        pen = false;
        continue;
      }
      const sx = cx + x * R;
      const sy = cy - y * R;
      if (pen) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
      pen = true;
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const [ox, oy] = rot(o[0], o[1], o[2]);
  ctx.fillStyle = C.honey;
  ctx.beginPath();
  ctx.arc(cx + ox * R, cy - oy * R, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.honey;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(cx + ox * R, cy - oy * R, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------------ */
/* WebGL küre                                                                */
/* ------------------------------------------------------------------------ */
async function boot(section: HTMLElement, figure: HTMLElement, canvas: HTMLCanvasElement, data: GlobeData, land: Float32Array): Promise<void> {
  const THREE = await import('three');
  const originLabel = figure.querySelector<HTMLElement>('[data-globe-origin]');
  const scene3 = section.querySelector<HTMLElement>('[data-globe-scene]');
  const stage = section.querySelector<HTMLElement>('[data-globe-stage]');

  let renderer: WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    renderer = null;
  }
  if (!renderer) {
    staticMode(section, figure, canvas, data, land, true);
    return;
  }
  const gl: WebGLRenderer = renderer;
  gl.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAM_Z);
  const globe = new THREE.Group();
  scene.add(globe);

  const col = (hex: string) => new THREE.Color(hex);
  const OUT = '#include <colorspace_fragment>';
  const uLight = { value: new THREE.Vector3(...LIGHT) };
  const uDpr = { value: 1 };
  const uScale = { value: 1 };

  // Gövde: gece rengine yakın, ışık tarafı hafif ılık; arka yüzü örter (opak)
  const bodyGeo = new THREE.SphereGeometry(0.992, 72, 54);
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: { uBase: { value: col(C.body) }, uLit: { value: col(C.bodyLit) }, uL: uLight },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uBase; uniform vec3 uLit; uniform vec3 uL; varying vec3 vN;
      void main() {
        float l = max(dot(normalize(vN), uL), 0.0);
        gl_FragColor = vec4(mix(uBase, uLit, pow(l, 1.6) * 0.85), 1.0);
        ${OUT}
      }`,
  });
  globe.add(new THREE.Mesh(bodyGeo, bodyMat));

  // Kara noktaları: krem → kehribar (aydınlık yüz), Malatya çevresi sıcak
  const o = toVec(data.origin.lat, data.origin.lon);
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute('position', new THREE.BufferAttribute(land, 3));
  const dotsMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uSize: { value: 2.7 },
      uDpr,
      uScale,
      uL: uLight,
      uColor: { value: col(C.dot) },
      uLitCol: { value: col(C.amber) },
      uWarm: { value: col(C.warm) },
      uOrigin: { value: new THREE.Vector3(...o) },
    },
    vertexShader: /* glsl */ `
      uniform float uSize; uniform float uDpr; uniform float uScale; uniform vec3 uOrigin; uniform vec3 uL;
      varying float vFace; varying float vNear; varying float vLit;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * position);
        vFace = dot(n, normalize(-mv.xyz));
        vLit = smoothstep(-0.15, 0.9, dot(n, uL));
        vNear = 1.0 - smoothstep(0.0, 0.3, distance(position, uOrigin));
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uDpr * uScale * (0.6 + 0.4 * smoothstep(0.0, 0.6, vFace)) * (1.0 + 0.3 * vNear);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uLitCol; uniform vec3 uWarm;
      varying float vFace; varying float vNear; varying float vLit;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = 1.0 - smoothstep(0.36, 0.5, d);
        a *= smoothstep(0.0, 0.22, vFace) * (0.5 + 0.5 * vLit + 0.35 * vNear);
        if (a < 0.01) discard;
        vec3 c = mix(uColor, uLitCol, vLit * 0.82);
        gl_FragColor = vec4(mix(c, uWarm, vNear * 0.85), min(a, 1.0));
        ${OUT}
      }`,
  });
  globe.add(new THREE.Points(dotsGeo, dotsMat));

  // Yüzeyde fresnel kenar (ışık tarafında bal, gölgede kehribar)
  const rimGeo = new THREE.SphereGeometry(1.0, 72, 54);
  const rimMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uA: { value: col(C.warm) }, uB: { value: col(C.honey) }, uL: uLight },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uL; varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.6);
        float side = 0.45 + 0.55 * smoothstep(-0.6, 0.8, dot(normalize(vN), uL));
        gl_FragColor = vec4(mix(uA, uB, side), clamp(f * side * 0.95, 0.0, 1.0));
        ${OUT}
      }`,
  });
  scene.add(new THREE.Mesh(rimGeo, rimMat));

  // Atmosfer: kameraya bakan düzlem; siluetten dışa üstel sönüm, düzlem kenarına varmadan sıfır
  const GR = 1.75;
  const uRs = { value: CAM_Z / Math.sqrt(CAM_Z * CAM_Z - 1) };
  const glowGeo = new THREE.PlaneGeometry(GR * 2, GR * 2);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uRs, uA: { value: col(C.warm) }, uB: { value: col(C.honey) }, uL: uLight },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uRs; uniform vec3 uA; uniform vec3 uB; uniform vec3 uL; varying vec2 vP;
      void main() {
        float r = length(vP);
        float t = max(r - uRs, 0.0);
        float side = 0.4 + 0.6 * smoothstep(-0.7, 0.9, dot(vP / max(r, 1e-4), normalize(uL.xy)));
        float a = (0.62 * exp(-t * 9.0) + 0.14 * exp(-t * 4.5)) * side;
        a *= 1.0 - smoothstep(uRs + 0.04, ${(HALF * 0.9).toFixed(3)}, r);
        if (a < 0.003) discard;
        gl_FragColor = vec4(mix(uA, uB, side * exp(-t * 4.0)), a);
        ${OUT}
      }`,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.renderOrder = -1;
  scene.add(glow);

  // Halkalar (Malatya nabzı + varış nabızları) — tek geometri
  const ringGeo = new THREE.RingGeometry(0.014, 0.02, 48);
  const Z = new THREE.Vector3(0, 0, 1);
  const makeRing = (v: V3, color: string) => {
    const m = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    );
    const n = new THREE.Vector3(...v).normalize();
    m.position.copy(n).multiplyScalar(1.007);
    m.quaternion.setFromUnitVectors(Z, n);
    globe.add(m);
    return m;
  };
  const originRings = [makeRing(o, C.honey), makeRing(o, C.honey)];
  const coreGeo = new THREE.CircleGeometry(0.012, 24);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: C.honey, depthWrite: false }));
  core.position.set(...o).multiplyScalar(1.008);
  core.quaternion.setFromUnitVectors(Z, new THREE.Vector3(...o).normalize());
  globe.add(core);

  // Rotalar: ince tüp (1px GL çizgisinden kalın ve net); uv.x = yay boyunca t
  const SEGS = 96;
  const arcs = data.markets.map((m) => {
    const pts = arcPoints(o, toVec(m.lat, m.lon), SEGS);
    const vecs: InstanceType<typeof THREE.Vector3>[] = [];
    for (let k = 0; k <= SEGS; k++) vecs.push(new THREE.Vector3(pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2]));
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(vecs), 140, 0.0042, 6, false);
    const u = {
      uDraw: { value: 0 },
      uHead: { value: -1 },
      uHi: { value: 0 },
      uDim: { value: 1 },
      uA: { value: col(C.amber) },
      uB: { value: col(C.honey) },
    };
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: u,
      vertexShader: /* glsl */ `
        varying float vT;
        void main() { vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uDraw; uniform float uHead; uniform float uHi; uniform float uDim; uniform vec3 uA; uniform vec3 uB;
        varying float vT;
        void main() {
          if (vT > uDraw) discard;
          float base = mix(0.4, 0.95, uHi);
          float d = uHead - vT;
          float trail = step(0.0, d) * (1.0 - smoothstep(0.0, 0.3, d));
          float front = (1.0 - step(0.999, uDraw)) * (1.0 - smoothstep(0.0, 0.12, uDraw - vT));
          float g = max(trail, front);
          float a = clamp((base + g * 0.9) * uDim, 0.0, 1.0);
          gl_FragColor = vec4(mix(uA, uB, clamp(g + uHi, 0.0, 1.0)), a);
          ${OUT}
        }`,
    });
    globe.add(new THREE.Mesh(geo, mat));
    const ring = makeRing(toVec(m.lat, m.lon), C.honey);
    ring.visible = false;
    return { pts, u, ring, hi: 0, dim: 1, fd: 0, landed: false, pulseAt: -10, cycleAt: 0, lastCycle: -1 };
  });

  // Yay başları: tek Points, büyük ışıltılı çekirdek; konumlar her karede güncellenir
  const headPos = new Float32Array(arcs.length * 3);
  const headAlpha = new Float32Array(arcs.length);
  const headGeo = new THREE.BufferGeometry();
  const headPosAttr = new THREE.BufferAttribute(headPos, 3);
  const headAlphaAttr = new THREE.BufferAttribute(headAlpha, 1);
  headGeo.setAttribute('position', headPosAttr);
  headGeo.setAttribute('aAlpha', headAlphaAttr);
  const headMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uDpr, uScale, uColor: { value: col(C.honey) }, uCore: { value: col(C.dot) } },
    vertexShader: /* glsl */ `
      attribute float aAlpha; uniform float uDpr; uniform float uScale; varying float vA;
      void main() { vA = aAlpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = 30.0 * uDpr * max(0.7, uScale); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform vec3 uCore; varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float halo = exp(-d * d * 22.0) * 0.75;
        float core = 1.0 - smoothstep(0.05, 0.11, d);
        float a = clamp((halo + core) * vA, 0.0, 1.0);
        if (a < 0.01) discard;
        gl_FragColor = vec4(mix(uColor, uCore, core), a);
        ${OUT}
      }`,
  });
  globe.add(new THREE.Points(headGeo, headMat));

  /* --- durum ------------------------------------------------------------ */
  let pS = 0; // yumuşatılmış sahne ilerlemesi
  const homeX = data.origin.lat * 0.55 * DEG;
  const homeY = (p: number): number => -(data.origin.lon - (18 + 22 * p)) * DEG;
  let rotY = homeY(0);
  let rotX = homeX;
  let velY = 0;
  let focus = -1;
  let idleAt = -1e9;
  let dragging = false;
  let running = false;
  let visible = false;
  let last = performance.now();
  let time = 0;

  let W = 1;
  let H = 1;
  let sticky = false;
  const resize = (): void => {
    const w = figure.clientWidth;
    const h = figure.clientHeight;
    if (!w || !h) return;
    W = w;
    H = h;
    const pr = Math.min(window.devicePixelRatio || 1, 2, 2600 / Math.max(w, h));
    gl.setPixelRatio(pr);
    uDpr.value = pr;
    gl.setSize(w, h, false);
    camera.aspect = w / h;
    // küre kısa kenara sığsın
    const fit = w < h ? h / w : 1;
    camera.position.z = CAM_Z * fit;
    const d = camera.position.z;
    uRs.value = d / Math.sqrt(d * d - 1);
    camera.updateProjectionMatrix();
    uScale.value = Math.min(w, h) / 640;
    sticky = !!stage && getComputedStyle(stage).position === 'sticky';
  };
  const ro = new ResizeObserver(resize);
  ro.observe(figure);
  resize();

  /** Sahne ilerlemesi: sticky düzende bölüm boyunca, akışta kürenin ekrandan geçişi boyunca. */
  const progress = (): number => {
    const vh = window.innerHeight;
    if (sticky && scene3) {
      const r = scene3.getBoundingClientRect();
      const lead = vh * 0.45;
      return clamp01((lead - r.top) / Math.max(1, r.height - vh + lead));
    }
    const r = figure.getBoundingClientRect();
    return clamp01((vh - r.top) / Math.max(1, vh + r.height * 0.3));
  };

  /* --- sürükleme -------------------------------------------------------- */
  let px = 0;
  let py = 0;
  let pt = 0;
  const down = (e: PointerEvent): void => {
    dragging = true;
    px = e.clientX;
    py = e.clientY;
    pt = performance.now();
    velY = 0;
    canvas.setPointerCapture(e.pointerId);
    figure.classList.add('is-dragging');
  };
  const move = (e: PointerEvent): void => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - px;
    const dy = e.clientY - py;
    const k = 3.2 / Math.max(320, W * 0.8);
    rotY += dx * k;
    rotX = Math.min(0.95, Math.max(-0.6, rotX + dy * k * 0.8));
    velY = ((dx * k) / Math.max(1, now - pt)) * 1000;
    px = e.clientX;
    py = e.clientY;
    pt = now;
  };
  const up = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    idleAt = performance.now();
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    figure.classList.remove('is-dragging');
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const unwire = wireList(section, (i) => {
    focus = i;
    if (i < 0) idleAt = performance.now() - 1800;
  });

  /* --- döngü ------------------------------------------------------------ */
  const v = new THREE.Vector3();
  const TRAVEL = 2.2;
  const tick = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    pS += (progress() - pS) * (1 - Math.exp(-dt * 5));

    // dönüş: odak → ülke; sürükleme → serbest; bırakınca kısa atalet; sonra eve (Malatya görünür) döner
    const m = focus >= 0 ? data.markets[focus] : undefined;
    if (m) {
      const k = 1 - Math.exp(-dt * 3.2);
      rotY += wrap(-m.lon * DEG - rotY) * k;
      rotX += (Math.min(0.95, Math.max(-0.6, m.lat * 0.7 * DEG)) - rotX) * k;
      velY = 0;
    } else if (!dragging) {
      if (now - idleAt < 2600) {
        velY *= Math.exp(-dt * 2.4);
        rotY += velY * dt;
      } else {
        const k = 1 - Math.exp(-dt * 0.9);
        const ty = homeY(pS) + 0.11 * Math.sin(time * 0.17);
        rotY += wrap(ty - rotY) * k;
        rotX += (homeX - rotX) * k;
      }
    }
    globe.rotation.set(rotX, rotY, 0);

    // Malatya nabzı
    originRings.forEach((r, k) => {
      const p = (time / 2.4 + k * 0.5) % 1;
      r.scale.setScalar(1 + p * 3.2);
      (r.material as MeshBasicMaterial).opacity = (1 - p) * 0.9;
    });

    arcs.forEach((a, i) => {
      const isF = focus === i;
      const ke = Math.min(1, dt * 6);
      a.hi += ((isF ? 1 : 0) - a.hi) * ke;
      a.dim += ((focus < 0 || isF ? 1 : 0.25) - a.dim) * ke;
      a.fd += ((isF ? 1 : 0) - a.fd) * Math.min(1, dt * 3);
      a.u.uHi.value = a.hi;
      a.u.uDim.value = a.dim;

      const draw = Math.max(easeOut(clamp01((pS - (START + i * STEP)) / DUR)), a.fd);
      a.u.uDraw.value = draw;
      if (draw >= 0.999 && !a.landed) {
        a.landed = true;
        a.pulseAt = time;
        a.cycleAt = time + 1.4 + (i % 4) * 0.9;
        a.lastCycle = -1;
      } else if (draw < 0.999) {
        a.landed = false;
      }

      let head = -1;
      let headA = 0;
      if (!a.landed) {
        if (draw > 0.002) {
          head = draw;
          headA = Math.min(1, draw * 12);
        }
        a.u.uHead.value = -1;
      } else {
        // indikten sonra ara ara kuyruklu yıldız (odakta daha sık)
        const cyc = isF ? TRAVEL + 0.9 : 7.5;
        const since = time - a.cycleAt;
        if (since >= 0) {
          const n = Math.floor(since / cyc);
          const local = (since - n * cyc) / TRAVEL;
          if (local <= 1) {
            head = easeInOut(local);
            headA = Math.min(1, local * 8);
          } else if (a.lastCycle !== n) {
            a.lastCycle = n;
            a.pulseAt = time;
          }
          a.u.uHead.value = local <= 1 ? head : 1 + (local - 1) * 0.6;
        } else {
          a.u.uHead.value = -1;
        }
      }
      const hk = Math.min(SEGS, Math.round(clamp01(head) * SEGS)) * 3;
      headPos[i * 3] = a.pts[hk]!;
      headPos[i * 3 + 1] = a.pts[hk + 1]!;
      headPos[i * 3 + 2] = a.pts[hk + 2]!;
      headAlpha[i] = headA * a.dim;

      // varış nabzı
      const age = time - a.pulseAt;
      a.ring.visible = a.landed && age >= 0 && age < 1.4;
      if (a.ring.visible) {
        a.ring.scale.setScalar(1 + age * 3.8);
        (a.ring.material as MeshBasicMaterial).opacity = (1 - age / 1.4) * a.dim;
      }
    });
    headPosAttr.needsUpdate = true;
    headAlphaAttr.needsUpdate = true;

    // Malatya etiketi (DOM; yalnız transform/opacity)
    if (originLabel) {
      v.set(o[0], o[1], o[2]).multiplyScalar(1.01);
      globe.localToWorld(v);
      const facing = v.z > 0.18;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      originLabel.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      originLabel.style.opacity = facing ? '1' : '0';
    }

    gl.render(scene, camera);
  };

  const sync = (): void => {
    const should = visible && document.visibilityState === 'visible';
    if (should === running) return;
    running = should;
    last = performance.now();
    if (running) pS = progress();
    gl.setAnimationLoop(running ? tick : null);
  };
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sync();
    },
    { rootMargin: '10% 0px' },
  );
  io.observe(figure);
  document.addEventListener('visibilitychange', sync);
  figure.classList.add('is-live');

  /* --- teardown --------------------------------------------------------- */
  let disposed = false;
  function destroy(): void {
    if (disposed) return;
    disposed = true;
    gl.setAnimationLoop(null);
    io.disconnect();
    ro.disconnect();
    unwire();
    document.removeEventListener('visibilitychange', sync);
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
    scene.traverse((obj) => {
      const mm = obj as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } };
      mm.geometry?.dispose();
      mm.material?.dispose();
    });
    ringGeo.dispose();
    gl.dispose();
    figure.classList.remove('is-live');
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    destroy();
    staticMode(section, figure, canvas, data, land, true);
  });
  window.addEventListener('pagehide', (e) => {
    if (!e.persisted) destroy();
  });
}

/** Durağan mod. `fresh`: tuvalde WebGL bağlamı kaldıysa 2D bağlam alınamaz → tuvali yenile. */
function staticMode(section: HTMLElement, figure: HTMLElement, canvas: HTMLCanvasElement, data: GlobeData, land: Float32Array, fresh: boolean): void {
  let cv = canvas;
  if (fresh) {
    cv = canvas.cloneNode() as HTMLCanvasElement;
    canvas.replaceWith(cv);
  }
  figure.classList.add('is-static');
  let f = -1;
  const draw = (): void => drawStatic(figure, cv, data, land, f);
  wireList(section, (i) => {
    f = i;
    draw();
  });
  new ResizeObserver(draw).observe(figure);
  draw();
}

/** Pazar çubukları: liste görününce sırayla dolar (CSS .is-in). */
function revealBars(section: HTMLElement): void {
  const list = section.querySelector<HTMLElement>('[data-globe-list]');
  if (!list) return;
  if (!('IntersectionObserver' in window)) {
    list.classList.add('is-in');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      list.classList.add('is-in');
    },
    { threshold: 0.25 },
  );
  io.observe(list);
}

/* ------------------------------------------------------------------------ */
function init(): void {
  const figure = document.querySelector<HTMLElement>('[data-globe]');
  const section = figure?.closest<HTMLElement>('section');
  const canvas = figure?.querySelector<HTMLCanvasElement>('[data-globe-canvas]');
  if (!figure || !section || !canvas) return;
  revealBars(section);
  let data: GlobeData;
  try {
    data = JSON.parse(figure.dataset.globe ?? '');
  } catch {
    return;
  }
  const land = landPositions();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !hasWebGL()) {
    staticMode(section, figure, canvas, data, land, false);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      void boot(section, figure, canvas, data, land);
    },
    { rootMargin: '80% 0px' },
  );
  io.observe(section);
}

init();
