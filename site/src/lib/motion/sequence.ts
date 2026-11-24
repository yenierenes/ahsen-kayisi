/**
 * sequence.ts — canvas görüntü dizisi oynatıcı.
 *
 * <canvas data-sequence="/seq/hero/" data-sequence-group="hero"
 *         data-fit="cover" data-fit-portrait="contain" data-zoom-portrait="2"
 *         data-bg="auto" data-sequence-eager></canvas>
 *
 * - manifest.json okur; 768px altında manifest.mobile setini kullanır.
 * - Kaba → ince yükleme (grup düzeyinde, tüm üyeler aynı indeksi birlikte ister):
 *   kare 1 → anahtar kareler (her 8. + son; yüksek öncelik, preloader bunu bekler) →
 *   arka planda adım 4 → 2 → 1 (requestIdleCallback, fetchpriority=low, 2'li havuz).
 *   saveData / ≤3g: adım 2'de durur. İlerleme window'a "sequence:progress" olayıyla yayınlanır.
 * - DPR ≤ 2, cover/contain(+zoom) çizim, en yakın yüklü kareye düşme.
 * - Aynı data-sequence-group içindeki canvas'lar aynı kareyi çizer (hero + hero-fg).
 * - data-alpha: kareler saydam (clearRect). data-sequence-fallback="mirror":
 *   manifest yoksa grubun ilk üyesinin karelerini kullanır ve .is-fallback alır.
 * - data-scrub="#bolum": ilerlemeyi o bölümün sabit aralığına bağlar (isteğe bağlı).
 */
import { ScrollTrigger, emit, introGate, isMobile, mm, MOTION, num, prefersReduced, qsa } from './core';

export interface SequenceManifest {
  count: number;
  width: number;
  height: number;
  prefix: string;
  pad: number;
  ext: string;
  mobile?: { dir: string; count: number; width: number; height: number };
}

interface FrameSet {
  base: string;
  count: number;
  width: number;
  height: number;
  prefix: string;
  pad: number;
  ext: string;
}

export interface SequenceProgress {
  group: string;
  loaded: number;
  /** bu bağlantıda yüklenecek toplam kare (tüm üyeler; veri tasarrufunda adım 2) */
  total: number;
  /** anahtar kareler (kare 1 + her 8. kare + son kare, TÜM üyelerde) yüklendikçe 0 → 1 (preloader bunu bekler) */
  critical: number;
  /** kare 1 tüm üyelerde yüklendi ve çizildi */
  first: boolean;
  /** şu an doldurulan adım: 8 (anahtar) → 4 → 2 → 1; 0 = bitti */
  stride: number;
  done: boolean;
}

/** Kaba → ince yükleme planı. Her aşama bir öncekinin ara karelerini doldurur. */
export function loadPlan(n: number, staticOnly: boolean, finest = 1): { stride: number; frames: number[] }[] {
  if (n <= 0) return [];
  if (staticOnly) return [{ stride: 8, frames: n > 1 ? [0, n - 1] : [0] }];
  const seen = new Set<number>();
  const take = (list: number[]): number[] => list.filter((i) => i >= 0 && i < n && !seen.has(i) && (seen.add(i), true));
  const key: number[] = [0];
  for (let i = 8; i < n; i += 8) key.push(i);
  key.push(n - 1);
  const plan = [{ stride: 8, frames: take(key) }];
  for (const stride of [4, 2, 1]) {
    if (stride < finest) break;
    const list: number[] = [];
    for (let i = 0; i < n; i += stride) list.push(i);
    const frames = take(list);
    if (frames.length) plan.push({ stride, frames });
  }
  return plan;
}

/** Veri tasarrufu veya ≤3g bağlantıda en ince adım 2 (kare sayısının yarısı) */
export function finestStride(): number {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!c) return 1;
  if (c.saveData) return 2;
  return /^(slow-2g|2g|3g)$/.test(c.effectiveType ?? '') ? 2 : 1;
}

const idle = (): Promise<void> =>
  new Promise((r) => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => r(), { timeout: 600 });
    else setTimeout(r, 32);
  });

async function pool<T>(list: T[], size: number, job: (item: T) => Promise<void>, stop: () => boolean): Promise<void> {
  let k = 0;
  const worker = async (): Promise<void> => {
    while (k < list.length && !stop()) {
      const item = list[k++] as T;
      await job(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, list.length) }, worker));
}

export interface FitGeometry {
  /** CSS px cinsinden çizilen karenin kutusu */
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
}

const MAX_BACKING = 2560;

export class Sequence {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly src: string;
  frames: (HTMLImageElement | null)[] = [];
  set: FrameSet | null = null;
  failed = false;
  mirrored = false;
  source: Sequence | null = null;
  bg: string | null = null;
  loadedCount = 0;
  private cssW = 0;
  private cssH = 0;
  private lastDrawn = -1;
  private readonly alpha: boolean;
  private aborted = false;
  onLoad: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.alpha = canvas.hasAttribute('data-alpha');
    const ctx = canvas.getContext('2d', { alpha: this.alpha });
    if (!ctx) throw new Error('canvas 2d yok');
    this.ctx = ctx;
    this.src = (canvas.dataset.sequence ?? '').replace(/\/?$/, '/');
    const bg = canvas.dataset.bg;
    if (bg && bg !== 'auto') this.bg = bg;
  }

  get count(): number {
    return this.set?.count ?? 0;
  }

  frameUrl(i: number): string {
    const s = this.set;
    if (!s) return '';
    return `${s.base}${s.prefix}${String(i + 1).padStart(s.pad, '0')}.${s.ext}`;
  }

  async loadManifest(): Promise<boolean> {
    try {
      const res = await fetch(`${this.src}manifest.json`, { cache: 'force-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const m = (await res.json()) as SequenceManifest;
      const mob = isMobile() && m.mobile;
      this.set = mob
        ? { base: `${this.src}${m.mobile!.dir.replace(/\/?$/, '/')}`, count: m.mobile!.count, width: m.mobile!.width, height: m.mobile!.height, prefix: m.prefix, pad: m.pad, ext: m.ext }
        : { base: this.src, count: m.count, width: m.width, height: m.height, prefix: m.prefix, pad: m.pad, ext: m.ext };
      this.frames = new Array<HTMLImageElement | null>(this.set.count).fill(null);
      return true;
    } catch {
      this.failed = true;
      return false;
    }
  }

  /** Bu üyenin kareleri yerine başka bir üyenin karelerini kullan */
  mirror(other: Sequence): void {
    this.mirrored = true;
    this.failed = false;
    this.source = other;
    this.set = other.set;
    this.frames = other.frames;
    this.canvas.classList.add('is-fallback');
  }

  /** Tek kare yükle (aynı kare iki kez istenmez). priority: fetchpriority ipucu */
  loadFrame(i: number, priority: 'high' | 'low' | 'auto' = 'auto'): Promise<void> {
    return new Promise((resolve) => {
      if (this.aborted || this.frames[i] || i < 0 || i >= this.count) return resolve();
      const img = new Image();
      img.decoding = 'async';
      img.fetchPriority = priority;
      img.src = this.frameUrl(i);
      const done = (ok: boolean): void => {
        if (ok && !this.aborted) {
          this.frames[i] = img;
          this.loadedCount += 1;
          if (i === 0 && this.canvas.dataset.bg === 'auto') this.sampleBg(img);
          this.onLoad?.();
        }
        resolve();
      };
      img.decode().then(
        () => done(true),
        () => done(img.complete && img.naturalWidth > 0),
      );
    });
  }

  private sampleBg(img: HTMLImageElement): void {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 1;
      const x = c.getContext('2d');
      if (!x) return;
      x.drawImage(img, 3, 3, 1, 1, 0, 0, 1, 1);
      const d = x.getImageData(0, 0, 1, 1).data;
      this.bg = `rgb(${d[0]}, ${d[1]}, ${d[2]})`;
      this.canvas.style.setProperty('--seq-bg', this.bg);
      this.canvas.dispatchEvent(new CustomEvent('sequence:bg', { bubbles: true, detail: this.bg }));
    } catch {
      /* çapraz köken vb. — yok say */
    }
  }

  /** data-fit / data-zoom; dikey ekranda data-fit-portrait / data-zoom-portrait önceliklidir */
  fitMode(): { fit: string; zoom: number } {
    const d = this.canvas.dataset;
    const portrait = window.innerWidth < window.innerHeight;
    return {
      fit: (portrait ? d.fitPortrait : undefined) ?? d.fit ?? 'cover',
      zoom: num(portrait ? (d.zoomPortrait ?? d.zoom) : d.zoom, 1),
    };
  }

  /** Çizilecek karenin CSS px kutusu (hero bu bilgiyle meyveyi konumlar) */
  geometry(): FitGeometry {
    const s = this.set;
    const W = this.cssW || this.canvas.clientWidth;
    const H = this.cssH || this.canvas.clientHeight;
    if (!s || !W || !H) return { x: 0, y: 0, w: W, h: H, scale: 1 };
    const { fit, zoom } = this.fitMode();
    const cover = Math.max(W / s.width, H / s.height);
    const contain = Math.min(W / s.width, H / s.height);
    const scale = fit === 'contain' ? Math.min(cover, contain * zoom) : cover * zoom;
    const w = s.width * scale;
    const h = s.height * scale;
    return { x: (W - w) / 2, y: (H - h) / 2, w, h, scale };
  }

  resize(): void {
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    if (!W || !H) return;
    this.cssW = W;
    this.cssH = H;
    const g = this.geometry();
    // Kaynak çözünürlüğünü 1.25 katından fazla aşan arka tampon boşa piksel demektir
    let dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, 1.25 / g.scale));
    if (W * dpr > MAX_BACKING) dpr = MAX_BACKING / W;
    const bw = Math.round(W * dpr);
    const bh = Math.round(H * dpr);
    if (this.canvas.width !== bw || this.canvas.height !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.ctx.imageSmoothingQuality = 'high';
    }
    const last = this.lastDrawn;
    this.lastDrawn = -1;
    if (last >= 0) this.draw(last);
  }

  has(i: number): boolean {
    return !!this.frames[i];
  }

  draw(i: number): void {
    const img = this.frames[i];
    if (!img || i === this.lastDrawn || !this.cssW) return;
    const { width: bw, height: bh } = this.canvas;
    const k = bw / this.cssW;
    const g = this.geometry();
    const ctx = this.ctx;
    if (this.alpha && !this.mirrored) {
      ctx.clearRect(0, 0, bw, bh);
    } else {
      ctx.fillStyle = this.bg ?? this.source?.bg ?? '#140b07';
      ctx.fillRect(0, 0, bw, bh);
    }
    ctx.drawImage(img, g.x * k, g.y * k, g.w * k, g.h * k);
    if (!this.alpha || this.mirrored) this.feather(g, k);
    this.lastDrawn = i;
  }

  /** Kare tuvali kaplamıyorsa (contain) kenarlarını zemin rengine erit: dikiş görünmesin */
  private feather(g: FitGeometry, k: number): void {
    if (g.x <= 0.5 && g.y <= 0.5) return;
    const ctx = this.ctx;
    const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(this.bg ?? this.source?.bg ?? '20,11,7');
    const rgb = m ? `${m[1]},${m[2]},${m[3]}` : '20,11,7';
    const solid = `rgba(${rgb},1)`;
    const clear = `rgba(${rgb},0)`;
    const x = g.x * k;
    const y = g.y * k;
    const w = g.w * k;
    const h = g.h * k;
    const f = Math.min(w, h) * 0.22;
    const band = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number): void => {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, solid);
      grad.addColorStop(1, clear);
      ctx.fillStyle = grad;
      ctx.fillRect(rx, ry, rw, rh);
    };
    if (g.y > 0.5) {
      band(0, y, 0, y + f, x, y, w, f);
      band(0, y + h, 0, y + h - f, x, y + h - f, w, f);
    }
    if (g.x > 0.5) {
      band(x, 0, x + f, 0, x, y, f, h);
      band(x + w, 0, x + w - f, 0, x + w - f, y, f, h);
    }
  }

  destroy(): void {
    this.aborted = true;
  }
}

/** Aynı ilerlemeye bağlı canvas grubu — kare-tam eşleşme */
export class SequenceGroup {
  readonly id: string;
  readonly members: Sequence[] = [];
  progress = 0;
  private index = 0;
  private raf = 0;
  ready: Promise<void>;
  private resolveReady!: () => void;

  constructor(id: string) {
    this.id = id;
    this.ready = new Promise((r) => (this.resolveReady = r));
  }

  get count(): number {
    const live = this.members.filter((m) => !m.failed && m.count > 0);
    return live.length ? Math.min(...live.map((m) => m.count)) : 0;
  }

  get primary(): Sequence | undefined {
    return this.members.find((m) => !m.failed && !m.mirrored) ?? this.members[0];
  }

  /** startGroup doldurur: anahtar kare sayısı / tamamlanan anahtar kare indeksi */
  criticalTotal = 0;
  criticalLoaded = 0;
  plannedFrames = 0;
  stride = 8;
  first = false;
  settled = false;

  stats(): SequenceProgress {
    const live = this.members.filter((m) => !m.failed && !m.mirrored);
    const loaded = live.reduce((a, m) => a + m.loadedCount, 0);
    const total = this.plannedFrames * live.length;
    // Hiç dizi yoksa (manifest yok) preloader beklemesin
    const critical = this.settled && !live.length ? 1 : this.criticalTotal ? this.criticalLoaded / this.criticalTotal : 0;
    return { group: this.id, loaded, total, critical, first: this.first, stride: this.stride, done: this.settled };
  }

  report(): void {
    emit<SequenceProgress>('sequence:progress', this.stats());
  }

  markReady(): void {
    this.resolveReady();
  }

  /** 0–1 ilerleme → kare. Aynı kare ise çizim yapılmaz. */
  setProgress(p: number): void {
    this.progress = Math.min(1, Math.max(0, p));
    const n = this.count;
    if (!n) return;
    this.index = Math.round(this.progress * (n - 1));
    this.render();
  }

  /** Bir sonraki karede yeniden çiz (yeni kare yüklendiğinde) */
  invalidate(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  /** Tüm üyelerde yüklü en yakın kareyi bul ve çiz */
  render(): void {
    const n = this.count;
    if (!n) return;
    const live = this.members.filter((m) => !m.failed);
    const ok = (i: number): boolean => i >= 0 && i < n && live.every((m) => m.has(i));
    let target = -1;
    for (let d = 0; d < n; d++) {
      if (ok(this.index - d)) {
        target = this.index - d;
        break;
      }
      if (ok(this.index + d)) {
        target = this.index + d;
        break;
      }
    }
    if (target < 0) return;
    for (const m of live) m.draw(target);
  }

  resize(): void {
    for (const m of this.members) if (!m.failed) m.resize();
    this.render();
  }

  stopLoading: () => void = () => undefined;

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.stopLoading();
    this.members.forEach((m) => m.destroy());
  }
}

const groups = new Map<string, SequenceGroup>();
let anon = 0;

export function getSequenceGroup(id: string): SequenceGroup | undefined {
  return groups.get(id);
}

async function startGroup(group: SequenceGroup): Promise<void> {
  const staticOnly = prefersReduced();
  const results = await Promise.all(group.members.map((m) => m.loadManifest()));
  const base = group.members.find((_m, i) => results[i]);
  for (const m of group.members) {
    if (m.failed && m.canvas.dataset.sequenceFallback === 'mirror' && base) m.mirror(base);
    if (m.failed) m.canvas.hidden = true;
  }
  group.resize();
  const loaders = group.members.filter((m) => !m.failed && !m.mirrored);
  let stopped = false;
  group.stopLoading = () => (stopped = true);
  const stop = (): boolean => stopped;
  // Aynı kare TÜM üyelerde birlikte istenir: taban ve meyve maskesi hiçbir an ayrışmaz
  const loadIndex = (i: number, pri: 'high' | 'low' | 'auto'): Promise<void> =>
    Promise.all(loaders.map((m) => m.loadFrame(i, pri))).then(() => undefined);
  for (const m of loaders) m.onLoad = () => group.invalidate();

  const plan = loadPlan(group.count, staticOnly, finestStride());
  group.plannedFrames = plan.reduce((a, p) => a + p.frames.length, 0);
  const [key, ...rest] = plan;
  group.criticalTotal = key?.frames.length ?? 0;
  group.report();

  if (key && loaders.length) {
    // 1) kare 1 (iki tuval) — çizilmeden preloader kalkmaz
    const [f0 = 0, ...keys] = key.frames;
    await loadIndex(f0, 'high');
    group.criticalLoaded = 1;
    group.first = true;
    group.render();
    group.markReady();
    group.report();
    // 2) anahtar kareler (her 8. + son)
    await pool(keys, 4, async (i) => {
      await loadIndex(i, 'high');
      group.criticalLoaded += 1;
      group.report();
    }, stop);
    // 3) preloader kalktıktan sonra arka planda 4 → 2 → 1; boşta, düşük öncelik, 2'li havuz
    if (rest.length) await introGate.promise;
    for (const phase of rest) {
      if (stopped) break;
      group.stride = phase.stride;
      group.report();
      await pool(phase.frames, 2, async (i) => {
        await idle();
        await loadIndex(i, 'low');
      }, stop);
    }
  }
  group.stride = 0;
  group.settled = true;
  group.report();
  group.markReady();
}

export function initSequences(root: ParentNode = document): void {
  const canvases = qsa<HTMLCanvasElement>('canvas[data-sequence]', root);
  if (!canvases.length) return;
  for (const c of canvases) {
    const id = c.dataset.sequenceGroup ?? `seq-${anon++}`;
    let g = groups.get(id);
    if (!g) {
      g = new SequenceGroup(id);
      groups.set(id, g);
    }
    g.members.push(new Sequence(c));
  }

  const ro = new ResizeObserver(() => groups.forEach((g) => g.resize()));
  groups.forEach((g) => {
    g.members.forEach((m) => ro.observe(m.canvas));
    const first = g.members[0]?.canvas;
    if (!first) return;
    const eager = g.members.some((m) => m.canvas.hasAttribute('data-sequence-eager'));
    if (eager) {
      void startGroup(g);
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            void startGroup(g);
          }
        },
        { rootMargin: '200% 0px' },
      );
      io.observe(first);
    }

    // İsteğe bağlı otomatik scrub
    const scrubSel = first.dataset.scrub;
    const trigger = scrubSel ? document.querySelector<HTMLElement>(scrubSel) : null;
    if (trigger) {
      mm.add(MOTION, () => {
        const st = ScrollTrigger.create({
          trigger,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => g.setProgress(self.progress),
        });
        return () => st.kill();
      });
    }
  });
}
