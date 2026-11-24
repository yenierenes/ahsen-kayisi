/**
 * Çiçek sahnesi — "BAHAR".
 *
 * Dört vuruş, dört çekim. Görüntü kaydırmaya BAĞLI DEĞİL: her çekim kendi kısa, döngülü videosudur ve
 * gerçek zamanlı oynar (kaydırma dursa da görüntü canlı). Kaydırma yalnız hangi çekimin görüneceğini,
 * çekimin yavaş yaklaşmasını (1.00→1.07), yazıyı ve yaprak rüzgârını sürer.
 *
 * Scrub zaman çizelgesi (p = bölümün sabit kaydırma ilerlemesi; masaüstü 420lvh ≈ 4,2 ekran):
 *   vuruşlar ≈0.2 (≈0.9 ekran) aralıklı: giriş 0.04 · bekleme · çıkış 0.03
 *     01 [0.012–0.205] çiçek açar          — geniş şafak çekimi, seyrek yaprak
 *     02 [0.228–0.430] don korkusu         — kırağılı çiçek yakın planı, seyrek yaprak
 *     03 [0.452–0.655] yapraklar dökülür   — arkadan ışık + düşen yapraklar: rüzgâr esintisi
 *     04 [0.678–0.870] hasada üç ay        — ham yeşil kayısılar, yapraklar seyrelir
 *   CUTS: yazı aralarının ortası → çekim değişir. Geçiş ZAMANA bağlı (≈0.7 s çapraz karışım + hafif
 *   ölçek oturması); geri dönüş / iki vuruş atlama doğrudan doğru çekime gider, yarım katman kalmaz.
 *   Gelen video sınırdan PRE önce oynamaya başlar (ilk kare takılması yok); görünmeyen video durur.
 *   0.885–1 tam ekran görüntü 24px köşeli çerçeveye daralır; arkada kemik zemin açılır,
 *           sayfa rengi en sonda kemiğe döner (data-sky-to-range), Süreç başlığına teslim.
 * Yükleme: poster sayfayla; 1. klip bölüm ~2 ekran yaklaşınca; N+1. klip N. vuruş etkinleşince
 *   (N. klip kesintisiz oynayacak kadar indikten sonra).
 * Dar/dikey ekran ya da saveData: -m kaynak. Otomatik oynatma reddedilirse poster + yavaş yaklaşma.
 * Yapraklar (petals.ts) bölüm ekranda değilken ya da sekme gizliyken durur.
 */
import { gsap, ScrollTrigger, mm, MOTION, REDUCE, isTouch, isMobile, isFinePointer, onMotionReady, getLenis, splitLines } from '../motion';
import { Field, spriteFor, type Depth, type SpriteSources } from './petals';

/** [p, değer] noktaları arasında yumuşak geçiş */
function curve(pts: [number, number][]): (p: number) => number {
  return (p: number): number => {
    const first = pts[0] ?? [0, 0];
    if (p <= first[0]) return first[1];
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i] ?? first;
      const [x0, y0] = pts[i - 1] ?? first;
      if (p <= x1) {
        const t = (p - x0) / Math.max(1e-6, x1 - x0);
        return y0 + (y1 - y0) * t * t * (3 - 2 * t);
      }
    }
    return (pts[pts.length - 1] ?? first)[1];
  };
}

/** Vuruş (yazı) aralıkları [giriş, çıkış] */
const SLOTS: [number, number][] = [
  [0.012, 0.205],
  [0.228, 0.43],
  [0.452, 0.655],
  [0.678, 0.87],
];
/** Çıkışın (çerçeveye daralma) başladığı an */
const X0 = 0.885;
/** Çekim sınırları: iki yazı arasının ortası */
const CUTS: number[] = SLOTS.slice(1).map(([a], i) => ((SLOTS[i]?.[1] ?? a) + a) / 2);
/** Gelen video sınırdan bu kadar önce (≈0.3 ekran) oynamaya başlar; geri yönde de aynı */
const PRE = 0.07;
/** Film geçişi (s) */
const DISSOLVE = 0.7;
/** Bir çekim boyunca yavaş yaklaşma */
const PUSH = 0.07;

// 01–02 seyrek; 03 boyunca esinti (yoğun + hızlı: yapraklar dökülür); 04 seyrelir
const DENSITY = curve([
  [0, 0.26],
  [0.43, 0.3],
  [0.47, 1],
  [0.64, 1],
  [0.7, 0.42],
  [0.87, 0.3],
  [1, 0.16],
]);
const WIND = curve([
  [0, 1],
  [0.43, 1.05],
  [0.48, 2.5],
  [0.63, 2.2],
  [0.7, 1],
  [1, 0.85],
]);

/** Rüzgâr açısı: sol üst → sağ alt */
const ANGLE = 28;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const beatAt = (p: number): number => CUTS.filter((c) => p >= c).length;

interface Shot {
  el: HTMLElement;
  settle: HTMLElement | null;
  poster: HTMLImageElement | null;
  video: HTMLVideoElement | null;
  alt: string;
  wash: number;
  loaded: boolean;
  scale: string;
  /** opaklık (stil okumadan izlenir: karede getComputedStyle yok) */
  o: number;
}
interface Run {
  layer: number;
  a: number;
  b: number;
}

function initCicek(): void {
  const section = document.querySelector<HTMLElement>('[data-cicek]');
  if (!section) return;
  const q = <T extends Element = HTMLElement>(s: string): T | null => section.querySelector<T>(s);
  const qa = (s: string): HTMLElement[] => Array.from(section.querySelectorAll<HTMLElement>(s));

  const stage = q('[data-cicek-stage]');
  const media = q('[data-cicek-media]');
  const zoom = q('[data-cicek-zoom]');
  const shotsEl = q('[data-cicek-shots]');
  const wash = q('[data-cicek-wash]');
  const boost = q('[data-cicek-boost]');
  const under = q('[data-cicek-under]');
  const corners = qa('[data-cicek-corner]');
  const beatsList = q('[data-cicek-beats]');
  const beats = qa('[data-cicek-beat]');
  const fieldEl = q('[data-cicek-field]');
  const nearEl = q('[data-cicek-near]');
  const bridge = q('[data-cicek-bridge]');
  if (!stage || !media || !zoom || !shotsEl || !beatsList || !fieldEl || !nearEl || !bridge) return;

  // --- Çekim haritası (derleme anında: vuruş → katman, katman → örtü gücü) ---------
  let map: { beat: number[]; wash: number[] } = { beat: [], wash: [] };
  try {
    map = JSON.parse(shotsEl.dataset.map ?? '{}') as typeof map;
  } catch {
    /* tek katman */
  }
  const shots: Shot[] = qa('[data-cicek-shot]').map((el, i) => ({
    el,
    settle: el.querySelector<HTMLElement>('[data-cicek-settle]'),
    poster: el.querySelector<HTMLImageElement>('.cicek__poster'),
    video: el.querySelector<HTMLVideoElement>('video[data-cicek-video]'),
    alt: el.dataset.alt ?? '',
    wash: map.wash?.[i] ?? 0,
    loaded: false,
    scale: '',
    o: i === 0 ? 1 : 0,
  }));
  if (!shots.length) return;
  const layerOf = (beat: number): number => Math.min(shots.length - 1, Math.max(0, map.beat?.[beat] ?? 0));
  // ardışık aynı katmanlı vuruşlar tek "koşu": geçiş yalnız koşu sınırında, yaklaşma koşu boyunca sürer
  const runs: Run[] = [];
  const beatRun: number[] = [];
  for (let i = 0; i < SLOTS.length; i++) {
    const a = i === 0 ? 0 : (CUTS[i - 1] ?? 0);
    const b = i === SLOTS.length - 1 ? X0 : (CUTS[i] ?? X0);
    const L = layerOf(i);
    const last = runs[runs.length - 1];
    if (last && last.layer === L) last.b = b;
    else runs.push({ layer: L, a, b });
    beatRun.push(runs.length - 1);
  }
  const runAt = (p: number): number => beatRun[beatAt(p)] ?? 0;

  let sources: SpriteSources = { b: [], p: [] };
  try {
    sources = JSON.parse(fieldEl.dataset.sprites ?? '{}') as SpriteSources;
  } catch {
    /* boş kalır */
  }
  sources.b ??= [];
  sources.p ??= [];
  const hasSprites = sources.b.length + sources.p.length > 0;

  const layer = (host: HTMLElement, d: Depth): HTMLElement | undefined =>
    host.querySelector<HTMLElement>(`.cicek__layer[data-depth="${d}"]`) ?? undefined;

  mm.add({ motion: MOTION, reduce: REDUCE }, (ctx) => {
    if (ctx.conditions?.reduce) return;

    // --- Video yönetimi ----------------------------------------------------------
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    // dar/dikey ekran, veri tasarrufu ya da tarayıcının yavaş saydığı bağlantı (2g/3g): 854×480 kaynak.
    // (downlink tahmini güvenilmez: hızlı bağlantıda da ~1,6 bildirilebiliyor → kullanılmaz)
    const slowNet = (): boolean => /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? '');
    const small = (): boolean =>
      isMobile() || window.matchMedia('(orientation: portrait)').matches || !!nav.connection?.saveData || slowNet();
    let near = false;
    let inView = false;
    let blocked = false;
    let curP = 0;
    let curRun = -1;
    let target = -1;
    let wantKey = '';

    const load = (sh: Shot | undefined): void => {
      const v = sh?.video;
      if (!sh || !v || sh.loaded) return;
      sh.loaded = true;
      const src = (small() && v.dataset.srcM) || v.dataset.src;
      if (!src) return;
      v.preload = 'auto';
      v.src = src;
      v.load();
    };
    /** Sıradaki klip, etkin klip kesintisiz oynayacak kadar indikten sonra (yavaş ağda bant paylaşılmaz) */
    const loadNext = (cur: Shot | undefined, next: Shot | undefined): void => {
      if (!next || next.loaded) return;
      const v = cur?.video;
      if (!v || !cur?.loaded || v.readyState >= 4) load(next);
      else v.addEventListener('canplaythrough', () => load(next), { once: true });
    };
    const play = (sh: Shot): void => {
      const v = sh.video;
      if (!v || blocked) return;
      load(sh);
      v.muted = true;
      const pr = v.play();
      if (pr)
        pr.catch((e: unknown) => {
          // pause() ile kesilen oynatma (AbortError) normal; yalnız tarayıcı reddi poster moduna düşürür
          if ((e as { name?: string } | null)?.name === 'NotAllowedError') {
            blocked = true;
            section.classList.add('is-noautoplay');
            reconcile(true);
          }
        });
    };
    const onPlaying = (e: Event): void => (e.currentTarget as HTMLVideoElement).classList.add('is-live');
    for (const sh of shots) {
      if (!sh.video) continue;
      sh.video.muted = true;
      sh.video.addEventListener('playing', onPlaying);
    }
    const opacityOf = (i: number): number => shots[i]?.o ?? 0;
    const paint = (sh: Shot): void => {
      sh.el.style.opacity = sh.o.toFixed(4);
    };
    /** opaklık tween'i: vekil nesne (sh.o) üzerinde, stil yalnız yazılır */
    const fade = (list: Shot[], to: number, duration: number, onComplete?: () => void): void => {
      list.forEach((sh, k) =>
        gsap.to(sh, { o: to, duration, ease: 'power1.inOut', overwrite: true, onUpdate: () => paint(sh), onComplete: k === 0 ? onComplete : undefined }),
      );
    };
    const setO = (sh: Shot, o: number): void => {
      gsap.killTweensOf(sh);
      sh.o = o;
      paint(sh);
    };

    /** Oynaması gerekenler: hedef + hâlâ görünen (geçişteki) + sınıra PRE kadar yakın komşu */
    function reconcile(force = false): void {
      const want = new Set<number>();
      if (inView && !document.hidden && !blocked) {
        if (target >= 0) want.add(target);
        for (let i = 0; i < shots.length; i++) if (opacityOf(i) > 0.001) want.add(i);
        CUTS.forEach((c, i) => {
          if (Math.abs(curP - c) < PRE) {
            want.add(layerOf(i));
            want.add(layerOf(i + 1));
          }
        });
      }
      const key = [...want].sort().join(',');
      if (!force && key === wantKey) return;
      wantKey = key;
      shots.forEach((sh, i) => {
        const v = sh.video;
        if (!v) return;
        if (want.has(i)) {
          if (v.paused) play(sh);
        } else if (!v.paused) v.pause();
      });
    }

    const order: number[] = shots.map((_, i) => i); // alttan üste
    const applyZ = (): void => order.forEach((L, z) => (shots[L] ? (shots[L].el.style.zIndex = String(z + 1)) : undefined));
    const settled = (): void => {
      shots.forEach((sh, i) => {
        if (i !== target) setO(sh, 0);
      });
      reconcile(true);
    };
    /** Zamana bağlı film geçişi. Hedef zaten tam görünüyorsa üstündekiler söner; değilse hedef üste alınıp belirir. */
    const show = (L: number, instant: boolean): void => {
      if (L === target) return;
      target = L;
      gsap.killTweensOf(shots);
      const sh = shots[L];
      if (!sh) return;
      shotsEl.setAttribute('aria-label', sh.alt);
      if (boost) gsap.to(boost, { opacity: sh.wash, duration: instant ? 0 : DISSOLVE, ease: 'power1.inOut', overwrite: true });
      if (instant) {
        shots.forEach((s, i) => setO(s, i === L ? 1 : 0));
        settled();
        return;
      }
      const opNow = shots.map((_, i) => opacityOf(i));
      if ((opNow[L] ?? 0) >= 0.999) {
        const above = order.slice(order.indexOf(L) + 1).filter((i) => (opNow[i] ?? 0) > 0.001);
        if (!above.length) {
          settled();
          return;
        }
        const top = Math.max(...above.map((i) => opNow[i] ?? 0));
        fade(above.map((i) => shots[i]).filter(Boolean) as Shot[], 0, DISSOLVE * top, settled);
        return;
      }
      order.splice(order.indexOf(L), 1);
      order.push(L);
      applyZ();
      if (sh.settle) gsap.fromTo(sh.settle, { scale: 1.035 }, { scale: 1, duration: DISSOLVE * 1.5, ease: 'power2.out', overwrite: true });
      fade([sh], 1, DISSOLVE * (1 - (opNow[L] ?? 0)), settled);
      reconcile(true);
    };

    /** Kaydırma ilerlemesi: çekim seçimi + yavaş yaklaşma + yükleme sırası */
    const onProgress = (p: number): void => {
      curP = p;
      const r = runAt(p);
      if (r !== curRun) {
        const first = curRun < 0;
        curRun = r;
        const run = runs[r];
        if (run) {
          if (near) load(shots[run.layer]);
          // N+1. klip N. vuruş etkinleşince (sahne ekrandayken)
          if (inView) loadNext(shots[run.layer], shots[runs[r + 1]?.layer ?? -1]);
          show(run.layer, first);
        }
      }
      // her katman kendi koşusunun (p'ye en yakın) yerel ilerlemesiyle yaklaşır
      const dist = shots.map(() => Infinity);
      const sc = shots.map(() => 1);
      for (const run of runs) {
        const d = p < run.a ? run.a - p : p > run.b ? p - run.b : 0;
        if (d < (dist[run.layer] ?? Infinity)) {
          dist[run.layer] = d;
          sc[run.layer] = 1 + PUSH * clamp01((p - run.a) / Math.max(1e-6, run.b - run.a));
        }
      }
      shots.forEach((sh, i) => {
        const t = `scale(${(sc[i] ?? 1).toFixed(4)})`;
        if (t !== sh.scale) {
          sh.scale = t;
          sh.el.style.transform = t;
        }
      });
      reconcile();
    };

    const nearIO = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || near) return;
        near = true;
        const cur = shots[runs[Math.max(0, curRun)]?.layer ?? 0];
        load(cur);
        // diğer posterler etkin klip oynamaya başlayınca (ya da en geç 4 s sonra) yüklenir: geçişte boş kare
        // yok, ama yavaş ağda ilk klibin bandını paylaşmazlar
        let postersOn = false;
        const posters = (): void => {
          if (postersOn) return;
          postersOn = true;
          for (const sh of shots) if (sh.poster) sh.poster.loading = 'eager';
        };
        cur?.video?.addEventListener('playing', posters, { once: true });
        window.setTimeout(posters, cur?.video ? 4000 : 0);
      },
      { rootMargin: '200% 0px' },
    );
    const viewIO = new IntersectionObserver((entries) => {
      for (const e of entries) inView = e.isIntersecting;
      if (inView) {
        const cur = shots[runs[Math.max(0, curRun)]?.layer ?? 0];
        load(cur);
        loadNext(cur, shots[runs[Math.max(0, curRun) + 1]?.layer ?? -1]);
      }
      reconcile(true);
    });
    nearIO.observe(section);
    viewIO.observe(section);
    const onVis = (): void => reconcile(true);
    document.addEventListener('visibilitychange', onVis);

    // --- Yazılar: satır maskeleri -----------------------------------------------
    const splits = qa('[data-cicek-split]').map((el) => splitLines(el));

    // --- Scrub sahnesi ----------------------------------------------------------
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isTouch() ? 0.35 : true,
        invalidateOnRefresh: true,
        onUpdate: (self) => onProgress(self.progress),
        onRefresh: (self) => onProgress(self.progress),
      },
    });

    gsap.set(beats, { autoAlpha: 0 });
    beats.forEach((beat, i) => {
      const [a, b] = SLOTS[i] ?? [0, 0];
      const label = beat.querySelector('[data-cicek-part]');
      const lines = splits.filter((s) => beat.contains(s.lines[0] ?? null)).flatMap((s) => s.lines);
      const parts = [label, ...lines].filter(Boolean) as Element[];
      tl.set(beat, { autoAlpha: 1 }, a)
        .fromTo(parts, { yPercent: 112 }, { yPercent: 0, duration: 0.04, stagger: 0.006, ease: 'power3.out' }, a)
        .to(parts, { yPercent: -112, duration: 0.03, stagger: 0.004, ease: 'power2.in' }, b - 0.035)
        .set(beat, { autoAlpha: 0 }, b);
    });

    // Çıkış: çerçeveye daralma (arkada kemik zemin), yapraklar köprüye devreder.
    // Kırpma DİKDÖRTGEN clip-path (hızlı yol); 24px köşeler kemik renkli dört köşe parçasıyla
    // verilir (yalnız transform). Yuvarlak clip-path her karede maske katmanı çizdiriyordu.
    const R = 24;
    const box = { w: stage.clientWidth, h: stage.clientHeight };
    const insets = (): [number, number, number, number] => (isMobile() ? [0.15, 0.04, 0.21, 0.04] : [0.12, 0.06, 0.14, 0.06]);
    const exit = { e: 0 };
    let lastClip = '';
    const applyExit = (): void => {
      const e = exit.e;
      const [T, Rt, B, L] = insets();
      const { w, h } = box;
      // tam piksele yuvarlanır: kırpma kenarı ile köşe parçası aynı pikselde biter (kenarda kıl çizgi yok)
      const it = Math.round(T * e * h);
      const ir = Math.round(Rt * e * w);
      const ib = Math.round(B * e * h);
      const il = Math.round(L * e * w);
      const clip = e <= 0 ? '' : `inset(${it}px ${ir}px ${ib}px ${il}px)`;
      if (clip !== lastClip) {
        lastClip = clip;
        media.style.clipPath = clip;
      }
      const x0 = il;
      const x1 = w - ir - R;
      const y0 = it;
      const y1 = h - ib - R;
      const s = e.toFixed(3);
      const at: Record<string, [number, number]> = { tl: [x0, y0], tr: [x1, y0], bl: [x0, y1], br: [x1, y1] };
      for (const c of corners) {
        const [x, y] = at[c.dataset.c ?? 'tl'] ?? [0, 0];
        c.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
      }
    };
    const onExitRefresh = (): void => {
      box.w = stage.clientWidth;
      box.h = stage.clientHeight;
      applyExit();
    };
    ScrollTrigger.addEventListener('refresh', onExitRefresh);
    if (wash) tl.to(wash, { autoAlpha: 0, duration: 0.04 }, X0 - 0.005);
    if (under) tl.fromTo(under, { opacity: 0 }, { opacity: 1, duration: 0.03, ease: 'power1.out' }, X0);
    tl.fromTo(exit, { e: 0 }, { e: 1, duration: 0.1, ease: 'power2.inOut', onUpdate: applyExit }, X0)
      .fromTo(zoom, { scale: 1 }, { scale: 0.9, duration: 0.1, ease: 'power2.inOut' }, X0)
      .to([fieldEl, nearEl], { autoAlpha: 0, duration: 0.06, ease: 'power1.in' }, 0.93)
      .set({}, {}, 1);
    const st = tl.scrollTrigger;
    onProgress(st?.progress ?? 0);

    const resetAll = (): void => {
      ScrollTrigger.removeEventListener('refresh', onExitRefresh);
      media.style.clipPath = '';
      for (const c of corners) c.style.transform = '';
      nearIO.disconnect();
      viewIO.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      for (const sh of shots) {
        sh.video?.pause();
        sh.video?.removeEventListener('playing', onPlaying);
        gsap.killTweensOf([sh, sh.settle]);
        sh.el.style.transform = '';
        sh.el.style.zIndex = '';
        sh.scale = '';
        sh.el.style.opacity = '';
        if (sh.settle) gsap.set(sh.settle, { clearProps: 'transform' });
      }
      if (boost) gsap.set(boost, { clearProps: 'opacity' });
    };

    if (!hasSprites) {
      return () => {
        resetAll();
        splits.forEach((s) => s.split.revert());
      };
    }

    // --- Yaprak sistemi -----------------------------------------------------------
    const mobile = isMobile();
    const counts: Record<Depth, number> = mobile ? { 0: 5, 1: 5, 2: 2 } : { 0: 14, 1: 10, 2: 6 };
    const bridgeCount = mobile ? 2 : 4;

    const exclude = (): { x0: number; y0: number; x1: number; y1: number } => {
      const s = stage.getBoundingClientRect();
      const r = beatsList.getBoundingClientRect();
      return { x0: r.left - s.left, y0: r.top - s.top, x1: r.right - s.left, y1: r.bottom - s.top };
    };
    const main = new Field({
      angle: ANGLE,
      entry: 'any',
      box: stage,
      layers: { 0: layer(fieldEl, 0), 1: layer(fieldEl, 1), 2: layer(nearEl, 2) },
      exclude,
      soften: 1.6,
    });
    let n = 0;
    for (const d of [0, 1, 2] as Depth[]) {
      const c = counts[d];
      // her derinlikte sıralar eşit dağılır: yoğunluk düşünce her katman orantılı seyrelir
      const ranks = Array.from({ length: c }, (_, j) => (j + Math.random()) / c).sort(() => Math.random() - 0.5);
      for (let j = 0; j < c; j++) {
        const { src, blossom } = spriteFor(n++, sources);
        main.add(src, d, blossom, ranks[j] ?? 0.5);
      }
    }

    const bridgeField = new Field({ angle: ANGLE, entry: 'left', box: bridge, layers: { 1: bridge, 2: bridge } });
    const petalsOnly: SpriteSources = { b: sources.p.length ? sources.p : sources.b, p: sources.p };
    for (let j = 0; j < bridgeCount; j++) {
      const { src } = spriteFor(j * 4 + 1, petalsOnly);
      bridgeField.add(src, j === bridgeCount - 1 ? 2 : 1, false, 0);
    }

    // Görünürlük: yalnız ekrandayken ve sekme görünürken çalış
    let mainOn = false;
    let bridgeOn = false;
    let running = false;
    // Kaydırma konumu Lenis'ten (sayı) ya da scroll olayında okunur: karede DOM okuması yok
    let curY = window.scrollY;
    const onScroll = (): void => {
      curY = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const scrollPos = (): number => getLenis()?.scroll ?? curY;
    let lastY = curY;
    const tick = (time: number, deltaMs: number): void => {
      const dt = Math.min(0.05, deltaMs / 1000);
      const y = scrollPos();
      const dy = y - lastY;
      lastY = y;
      const p = st?.progress ?? 0;
      if (mainOn) main.step(time, dt, dy, WIND(p), DENSITY(p));
      if (bridgeOn) bridgeField.step(time, dt, dy * 0.6, 1, 1);
    };
    const sync = (): void => {
      const want = (mainOn || bridgeOn) && !document.hidden;
      if (want === running) return;
      running = want;
      if (want) {
        lastY = scrollPos();
        gsap.ticker.add(tick);
      } else gsap.ticker.remove(tick);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === section) mainOn = e.isIntersecting;
        if (e.target === bridge) bridgeOn = e.isIntersecting;
      }
      sync();
    });
    io.observe(section);
    io.observe(bridge);
    document.addEventListener('visibilitychange', sync);

    // Masaüstü: hafif fare parallaksı (yakın katman en çok)
    const onMove = (e: PointerEvent): void => {
      main.setMouse((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const fine = isFinePointer();
    if (fine) window.addEventListener('pointermove', onMove, { passive: true });

    const remeasure = (): void => {
      main.measure();
      bridgeField.measure();
    };
    ScrollTrigger.addEventListener('refresh', remeasure);
    void document.fonts?.ready.then(remeasure);

    return () => {
      gsap.ticker.remove(tick);
      running = false;
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('scroll', onScroll);
      if (fine) window.removeEventListener('pointermove', onMove);
      ScrollTrigger.removeEventListener('refresh', remeasure);
      resetAll();
      main.destroy();
      bridgeField.destroy();
      splits.forEach((s) => s.split.revert());
    };
  });
}

onMotionReady(initCicek);
