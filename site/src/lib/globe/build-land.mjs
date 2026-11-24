// Kara maskesi üreteci — Natural Earth 110m (world-atlas land-110m.json, kamu malı veri) →
// Fibonacci küresi üzerindeki N noktanın kara/deniz bit dizisi (base64) → land-data.ts
// Kullanım: node src/lib/globe/build-land.mjs <land-110m.json yolu> [N]
// Çalışma zamanı (globe.ts) aynı Fibonacci formülüyle i → xyz hesaplar; burada yalnız bitler üretilir.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const src = process.argv[2];
const N = Number(process.argv[3] ?? 36000);
if (!src) throw new Error('land-110m.json yolu gerekli');
const topo = JSON.parse(readFileSync(src, 'utf8'));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

// TopoJSON yayları: delta kodlu, nicemlenmiş → [lon, lat]
const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});
const ring = (ids) => {
  const out = [];
  ids.forEach((id) => {
    const a = id < 0 ? arcs[~id].slice().reverse() : arcs[id];
    a.forEach((p, k) => {
      if (k > 0 || out.length === 0) out.push(p);
    });
  });
  return out;
};
// Antimeridyeni kesen halka (Fiji, Çukotka): 179° → −180° sıçraması düzlemde tüm genişliği keser
// ve şerit hatası üretir. Halkayı sürekli aç (sıçramada ±360 ofset) → düzlemde geçerli çokgen;
// test lon, lon±360 ile yapılır. Kutba inen Antarktika halkası olduğu gibi kalır.
const seam = (r) => {
  if (Math.min(...r.map((p) => p[1])) < -80) return r;
  let off = 0;
  return r.map((p, k) => {
    if (k > 0 && Math.abs(p[0] - r[k - 1][0]) > 180) off -= Math.sign(p[0] - r[k - 1][0]) * 360;
    return [p[0] + off, p[1]];
  });
};
const polys = [];
topo.objects.land.geometries.forEach((g) => {
  const list = g.type === 'Polygon' ? [g.arcs] : g.arcs;
  list.forEach((rings) => {
    const rs = rings.map(ring).map(seam);
    let minX = 540, maxX = -540, minY = 90, maxY = -90;
    rs[0].forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    polys.push({ rs, minX, maxX, minY, maxY });
  });
});

const inRing = (x, y, r) => {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const isLand = (lon0, lat) =>
  [lon0, lon0 + 360, lon0 - 360].some((lon) => hit(lon, lat));
const hit = (lon, lat) =>
  polys.some((p) => {
    if (lon < p.minX || lon > p.maxX || lat < p.minY || lat > p.maxY) return false;
    if (!inRing(lon, lat, p.rs[0])) return false;
    for (let h = 1; h < p.rs.length; h++) if (inRing(lon, lat, p.rs[h])) return false;
    return true;
  });

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const bytes = new Uint8Array(Math.ceil(N / 8));
let land = 0;
for (let i = 0; i < N; i++) {
  const y = 1 - ((i + 0.5) * 2) / N;
  const r = Math.sqrt(1 - y * y);
  const t = i * GOLDEN;
  const x = Math.cos(t) * r;
  const z = Math.sin(t) * r;
  const lat = (Math.asin(y) * 180) / Math.PI;
  const lon = (Math.atan2(x, z) * 180) / Math.PI;
  if (isLand(lon, lat)) {
    bytes[i >> 3] |= 1 << (i & 7);
    land++;
  }
}
const b64 = Buffer.from(bytes).toString('base64');
const out = `// ÜRETİLDİ — elle düzenleme. Kaynak: Natural Earth 110m kara (world-atlas@2 land-110m.json, kamu malı).
// Üreteç: src/lib/globe/build-land.mjs · ${N} Fibonacci noktası, ${land} kara noktası.
export const LAND_N = ${N};
export const LAND_COUNT = ${land};
export const LAND_BITS = '${b64}';
`;
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'land-data.ts'), out);
console.log(`N=${N} land=${land} b64=${b64.length}B`);
