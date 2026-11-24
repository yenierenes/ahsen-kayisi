/**
 * petals.ts — rüzgârla sürüklenen çiçek ve yapraklar.
 *
 * Tek rüzgâr yönü (sol üst → sağ alt, θ derece). Her kesim bir "şeritte" ilerler:
 *   konum = s·n + u·d   (d rüzgâr yönü, n ona dik; s şeridin yanal konumu, u şerit boyu)
 * Şerit, alanın (kesim boyu kadar genişletilmiş) dikdörtgenini kesen doğru parçasıdır:
 * kesim daima ekran DIŞINDAN girer (u < uIn) ve dışarıdan çıkar (u > uOut) — ortada belirmez.
 * İlerleme = kaydırma (px) × katman çarpanı × rüzgâr + zamanla yavaş sürüklenme;
 * üstüne yanal salınım, dönüş ve çırpınma. Çırpınma 3B dönüş değil: perspektifsiz rotateX·rotateY'nin
 * düzlem izdüşümü olan 2B matris (görüntü aynı; 3B katman sıralaması ve canlı filtre yok).
 * Yakın katmanın yumuşaklığı (soften) bir kez canvas'ta bulanıklaştırılmış kopyayla verilir.
 * Yazı alanı: o dikdörtgenin n üzerindeki izdüşümü yasak s aralığıdır; hiçbir şerit yazının
 * üstünden geçmez. Yoğunluk: her kesimin bir "sırası" var; sıra < yoğunluk ise görevde,
 * değilse geçişini bitirip ekran dışında bekler.
 */

export type Depth = 0 | 1 | 2;

export interface SpriteSources {
  /** bütün çiçekler */
  b: string[];
  /** tek yapraklar */
  p: string[];
}

interface DepthSpec {
  petal: [number, number];
  blossom: [number, number];
  /** px/sn, rüzgâr 1'de */
  drift: number;
  /** kaydırılan her px için şerit boyunca px */
  travel: number;
  /** yanal salınım genliği (px) */
  sway: number;
  /** fare parallaksı (px) */
  mouse: number;
}

/** uzak: küçük, keskin, yavaş · orta · yakın: büyük, hafif bulanık (CSS), hızlı */
export const DEPTHS: Record<Depth, DepthSpec> = {
  0: { petal: [16, 24], blossom: [30, 42], drift: 13, travel: 0.32, sway: 9, mouse: 5 },
  1: { petal: [30, 46], blossom: [56, 80], drift: 26, travel: 0.68, sway: 18, mouse: 13 },
  2: { petal: [54, 84], blossom: [118, 160], drift: 54, travel: 1.3, sway: 30, mouse: 28 },
};

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Sprite {
  el: HTMLElement;
  depth: Depth;
  size: number;
  blossom: boolean;
  /** 0–1; yoğunluk bunun üstündeyse görev dışı */
  rank: number;
  s: number;
  u: number;
  uIn: number;
  uOut: number;
  parked: boolean;
  rz: number;
  spin: number;
  flutter: number;
  w1: number;
  w2: number;
  w3: number;
  ph1: number;
  ph2: number;
  ph3: number;
}

export interface FieldOptions {
  /** derece; 0 = yatay sağa */
  angle: number;
  /** "any": dikdörtgenin her kenarından giriş; "left": yalnız sol kenardan (köprü) */
  entry: 'any' | 'left';
  /** katman kapları (derinlik → eleman) */
  layers: Partial<Record<Depth, HTMLElement>>;
  /** alan ölçüsünü veren eleman (katmanlar bunun içinde, sol üst köşesi 0,0) */
  box: HTMLElement;
  /** yazı alanı (box koordinatlarında) ya da null */
  exclude?: () => Rect | null;
  /** derinlik 2 kesimleri için görüntü boyunda bulanıklık (px); bir kez pişirilir */
  soften?: number;
}

const softCache = new Map<string, Promise<string | null>>();
const canFilter = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

/**
 * Kesimin önceden bulanıklaştırılmış, görüntü boyuna yakın küçük kopyası (object URL).
 * Canvas filtresi yoksa null → keskin kesim kalır.
 */
export function softened(src: string, size: number, blur: number): Promise<string | null> {
  if (!canFilter) return Promise.resolve(null);
  const box = Math.max(48, Math.round((size * 1.5) / 16) * 16);
  const key = `${src}|${box}|${blur}`;
  let p = softCache.get(key);
  if (!p) {
    p = (async (): Promise<string | null> => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const k = box / Math.max(img.naturalWidth, img.naturalHeight, 1);
      const w = Math.round(img.naturalWidth * k);
      const h = Math.round(img.naturalHeight * k);
      const r = (blur * box) / size;
      const m = Math.ceil(r * 2.5);
      const c = document.createElement('canvas');
      c.width = w + 2 * m;
      c.height = h + 2 * m;
      const x = c.getContext('2d');
      if (!x) return null;
      x.filter = `blur(${r.toFixed(2)}px)`;
      x.drawImage(img, m, m, w, h);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/webp', 0.92));
      return blob ? URL.createObjectURL(blob) : null;
    })().catch(() => null);
    softCache.set(key, p);
  }
  return p;
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

export class Field {
  readonly sprites: Sprite[] = [];
  private w = 0;
  private h = 0;
  private dx: number;
  private dy: number;
  private nx: number;
  private ny: number;
  private ex: Rect | null = null;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  private scale = 1;
  private layerTf: Partial<Record<Depth, string>> = {};

  constructor(private opt: FieldOptions) {
    const a = (opt.angle * Math.PI) / 180;
    this.dx = Math.cos(a);
    this.dy = Math.sin(a);
    this.nx = -Math.sin(a);
    this.ny = Math.cos(a);
    this.measure();
  }

  /** Ekran boyuna göre kesim ölçeği (390px telefonda ≈0,72; 1440'ta 1) */
  private sizeScale(): number {
    return Math.min(1.15, Math.max(0.72, this.w / 1440));
  }

  add(src: string, depth: Depth, blossom: boolean, rank: number): void {
    const spec = DEPTHS[depth];
    const [a, b] = blossom ? spec.blossom : spec.petal;
    const el = document.createElement('div');
    el.className = 'cicek-sprite';
    el.dataset.d = String(depth);
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    el.appendChild(img);
    const base = rand(a, b);
    if (depth === 2 && this.opt.soften) {
      void softened(src, base * this.scale, this.opt.soften).then((url) => {
        if (url) img.src = url;
      });
    }
    const sp: Sprite = {
      el,
      depth,
      size: base * this.scale,
      blossom,
      rank,
      s: 0,
      u: 0,
      uIn: 0,
      uOut: 0,
      parked: false,
      rz: rand(0, 360),
      spin: rand(14, 42) * (Math.random() < 0.5 ? -1 : 1) * (blossom ? 0.5 : 1),
      flutter: blossom ? rand(10, 22) : rand(38, 64),
      w1: rand(0.35, 0.7),
      w2: rand(0.9, 1.5),
      w3: rand(1.1, 2.2),
      ph1: rand(0, TAU),
      ph2: rand(0, TAU),
      ph3: rand(0, TAU),
    };
    el.style.setProperty('--s', `${sp.size.toFixed(1)}px`);
    el.dataset.base = base.toFixed(2);
    this.opt.layers[depth]?.appendChild(el);
    this.sprites.push(sp);
    // Başlangıç: şeridin herhangi bir yerinde (alan o an ekran dışında kurulur)
    this.lane(sp);
    sp.u = rand(sp.uIn - (sp.uOut - sp.uIn) * 0.3, sp.uOut);
  }

  measure(): void {
    this.w = this.opt.box.clientWidth;
    this.h = this.opt.box.clientHeight;
    const k = this.sizeScale();
    if (Math.abs(k - this.scale) > 0.01) {
      this.scale = k;
      for (const sp of this.sprites) {
        sp.size = Number(sp.el.dataset.base ?? sp.size) * k;
        sp.el.style.setProperty('--s', `${sp.size.toFixed(1)}px`);
      }
    }
    this.ex = this.opt.exclude?.() ?? null;
    for (const sp of this.sprites) this.bounds(sp);
  }

  /** kesimin şeridi için alan dışı payı */
  private margin(sp: Sprite): number {
    const spec = DEPTHS[sp.depth];
    return sp.size * 0.75 + spec.sway * 1.4 + spec.mouse + 4;
  }

  /** s sabitken, genişletilmiş dikdörtgene giriş/çıkış u değerleri */
  private bounds(sp: Sprite): boolean {
    const m = this.margin(sp);
    const { dx, dy, nx, ny } = this;
    const bx = sp.s * nx;
    const by = sp.s * ny;
    const uxa = (-m - bx) / dx;
    const uxb = (this.w + m - bx) / dx;
    const uya = (-m - by) / dy;
    const uyb = (this.h + m - by) / dy;
    sp.uIn = Math.max(Math.min(uxa, uxb), Math.min(uya, uyb));
    sp.uOut = Math.min(Math.max(uxa, uxb), Math.max(uya, uyb));
    return sp.uOut - sp.uIn > m;
  }

  /** Yeni şerit seç: yazı alanının izdüşümünü atla */
  private lane(sp: Sprite): void {
    const m = this.margin(sp);
    const { nx, ny } = this;
    const proj = (x: number, y: number): number => x * nx + y * ny;
    if (this.opt.entry === 'left') {
      // sol kenardan gir, sağ kenardan çık (alt kenardan çıkıp ortada kaybolmasın)
      const drop = (this.w + 2 * m) * (this.dy / this.dx);
      const yMax = Math.max(m + 1, this.h - m - drop);
      const y0 = rand(m, yMax);
      sp.s = proj(-m, y0);
      this.bounds(sp);
      return;
    }
    const sMin = proj(this.w + m, -m);
    const sMax = proj(-m, this.h + m);
    let spans: [number, number][] = [[sMin, sMax]];
    const ex = this.ex;
    if (ex) {
      const e = m * 0.8 + 14;
      const cMin = proj(ex.x1 + e, ex.y0 - e);
      const cMax = proj(ex.x0 - e, ex.y1 + e);
      const cut: [number, number][] = [
        [sMin, Math.min(sMax, cMin)],
        [Math.max(sMin, cMax), sMax],
      ];
      spans = cut.filter(([a, b]) => b - a > 1);
      if (!spans.length) spans = [[sMin, sMax]];
    }
    const total = spans.reduce((t, [a, b]) => t + (b - a), 0);
    for (let tries = 0; tries < 6; tries++) {
      let r = Math.random() * total;
      for (const [a, b] of spans) {
        if (r <= b - a) {
          sp.s = a + r;
          break;
        }
        r -= b - a;
      }
      if (this.bounds(sp)) return;
    }
  }

  setMouse(x: number, y: number): void {
    this.mouse.tx = x;
    this.mouse.ty = y;
  }

  /**
   * @param dt saniye
   * @param scrolled bu karede kaydırılan px (geri kaydırmada negatif)
   * @param wind rüzgâr gücü (1 = sakin esinti)
   * @param density 0–1 görevdeki kesim oranı
   */
  step(t: number, dt: number, scrolled: number, wind: number, density: number): void {
    const diag = Math.hypot(this.w, this.h);
    const lim = diag * 0.35;
    const mo = this.mouse;
    mo.x += (mo.tx - mo.x) * Math.min(1, dt * 4);
    mo.y += (mo.ty - mo.y) * Math.min(1, dt * 4);
    for (const d of [0, 1, 2] as Depth[]) {
      const layer = this.opt.layers[d];
      if (layer) {
        const k = DEPTHS[d].mouse;
        const tf = `translate3d(${(-mo.x * k).toFixed(1)}px, ${(-mo.y * k).toFixed(1)}px, 0)`;
        if (tf !== this.layerTf[d]) {
          this.layerTf[d] = tf;
          layer.style.transform = tf;
        }
      }
    }
    const breeze = 0.55 + 0.45 * wind;
    for (const sp of this.sprites) {
      const spec = DEPTHS[sp.depth];
      const active = sp.rank < density;
      if (sp.parked) {
        if (!active) continue;
        // göreve dön: ekran dışından, kademeli
        this.lane(sp);
        sp.u = sp.uIn - rand(0, diag * 0.14);
        sp.parked = false;
        sp.el.style.visibility = '';
      }
      let du = scrolled * spec.travel * wind + dt * spec.drift * breeze * this.scale;
      du = Math.max(-lim, Math.min(lim, du));
      sp.u += du;
      sp.rz += dt * sp.spin * breeze;
      if (sp.u > sp.uOut) {
        if (active) {
          this.lane(sp);
          sp.u = sp.uIn - rand(0, diag * 0.1);
        } else {
          sp.parked = true;
          sp.el.style.visibility = 'hidden';
          continue;
        }
      } else if (sp.u < sp.uIn - diag * 0.6) {
        // geri kaydırma: sağ alttan, ekran dışından geri gelir
        if (active) {
          this.lane(sp);
          sp.u = sp.uOut + rand(0, diag * 0.2);
        } else {
          sp.parked = true;
          sp.el.style.visibility = 'hidden';
          continue;
        }
      }
      const sw = spec.sway * (0.5 + 0.5 * wind) * (Math.sin(t * sp.w1 + sp.ph1) + 0.4 * Math.sin(t * sp.w2 + sp.ph2));
      const x = sp.s * this.nx + sp.u * this.dx + this.nx * sw - sp.size / 2;
      const y = sp.s * this.ny + sp.u * this.dy + this.ny * sw - sp.size / 2;
      const rz = sp.rz + 14 * Math.sin(t * sp.w2 + sp.ph3);
      const rx = (sp.flutter * Math.sin(t * sp.w3 + sp.ph1) * Math.PI) / 180;
      const ry = (sp.flutter * 0.6 * Math.cos(t * sp.w3 * 0.7 + sp.ph2) * Math.PI) / 180;
      // rotateX(rx) rotateY(ry) perspektifsiz izdüşümü: [[cos ry, 0], [sin rx·sin ry, cos rx]]
      const ma = Math.cos(ry).toFixed(3);
      const mb = (Math.sin(rx) * Math.sin(ry)).toFixed(3);
      const md = Math.cos(rx).toFixed(3);
      sp.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rz.toFixed(1)}deg) matrix(${ma}, ${mb}, 0, ${md}, 0, 0)`;
    }
  }

  destroy(): void {
    for (const sp of this.sprites) sp.el.remove();
    this.sprites.length = 0;
    for (const l of Object.values(this.opt.layers)) if (l) l.style.transform = '';
    this.layerTf = {};
  }
}

/** Yaprak:çiçek ≈ 3:1. Kaynak listesi boşsa diğerine düşer. */
export function spriteFor(i: number, src: SpriteSources): { src: string; blossom: boolean } {
  const wantB = i % 4 === 0;
  const pool = wantB ? (src.b.length ? src.b : src.p) : src.p.length ? src.p : src.b;
  const k = Math.floor(i / (wantB ? 4 : 1));
  // blossom = boy sınıfı (yaprak kesimi yoksa küçük boyda yine çiçek görseli kullanılır)
  return { src: pool[k % pool.length] ?? '', blossom: wantB };
}
