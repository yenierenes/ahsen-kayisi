/**
 * Çiçek sahnesi — "BAHAR".
 *
 * Tek scrub zaman çizelgesi (p = bölümün sabit kaydırma ilerlemesi; masaüstü 560lvh ≈ 4,6 ekran):
 *   0–0.90   dizi kare 1 → N, kesirli (komşu kareler karışır). Görüntü: soğuk, kırağılı şafak →
 *            güneş doğar (son üçte bir). Dizi yoksa foto yavaşça yaklaşır.
 *   vuruşlar eşit aralıklı, her biri ≈0.2 (≈0.9 ekran): giriş 0.045 · bekleme ≈0.11 · çıkış 0.04
 *     01 [0.015–0.210] çiçek açar          — çiçekli sıralar, seyrek yaprak
 *     02 [0.230–0.425] don korkusu         — kırağılı çimen, mavi ışık, seyrek yaprak
 *     03 [0.445–0.640] yapraklar dökülür   — rüzgâr esintisi: yoğun, hızlı yaprak yağmuru
 *     04 [0.660–0.875] hasada üç ay        — güneş doğuyor (dizinin son kısmı), yapraklar seyrelir
 *   0.875–0.99 tam ekran görüntü 24px köşeli çerçeveye daralır; arkada kemik zemin açılır,
 *             sayfa rengi en sonda kemiğe döner (data-sky-to-range), Süreç başlığına teslim.
 * Yapraklar (petals.ts) bölüm ekranda değilken ya da sekme gizliyken durur.
 */
import { gsap, ScrollTrigger, mm, MOTION, REDUCE, isTouch, isMobile, isFinePointer, onMotionReady, getSequenceGroup, getLenis, splitLines } from '../motion';
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

/** Vuruş aralıkları [giriş, çıkış] — yaprak eğrileri de bunlara göre */
const SLOTS: [number, number][] = [
  [0.015, 0.21],
  [0.23, 0.425],
  [0.445, 0.64],
  [0.66, 0.875],
];
/** Dizinin bittiği an (sonrası çıkış) */
const SEQ_END = 0.9;

// 01–02 seyrek; 03 boyunca esinti (yoğun + hızlı: yapraklar dökülür); 04 seyrelir
const DENSITY = curve([
  [0, 0.26],
  [0.42, 0.3],
  [0.465, 1],
  [0.62, 1],
  [0.68, 0.42],
  [0.86, 0.3],
  [1, 0.16],
]);
const WIND = curve([
  [0, 1],
  [0.42, 1.05],
  [0.47, 2.5],
  [0.61, 2.2],
  [0.68, 1],
  [1, 0.85],
]);

/** Rüzgâr açısı: sol üst → sağ alt */
const ANGLE = 28;

function initCicek(): void {
  const section = document.querySelector<HTMLElement>('[data-cicek]');
  if (!section) return;
  const q = <T extends Element = HTMLElement>(s: string): T | null => section.querySelector<T>(s);
  const qa = (s: string): HTMLElement[] => Array.from(section.querySelectorAll<HTMLElement>(s));

  const stage = q('[data-cicek-stage]');
  const media = q('[data-cicek-media]');
  const zoom = q('[data-cicek-zoom]');
  const still = q('[data-cicek-still]');
  const wash = q('[data-cicek-wash]');
  const under = q('[data-cicek-under]');
  const corners = qa('[data-cicek-corner]');
  const beatsList = q('[data-cicek-beats]');
  const beats = qa('[data-cicek-beat]');
  const fieldEl = q('[data-cicek-field]');
  const nearEl = q('[data-cicek-near]');
  const bridge = q('[data-cicek-bridge]');
  if (!stage || !media || !zoom || !beatsList || !fieldEl || !nearEl || !bridge) return;

  const group = getSequenceGroup('cicek');
  // Dizi yüklenemezse (manifest var ama kareler yok vb.) durağan fotoya dön
  if (group) {
    void group.ready.then(() => {
      if (!group.count) section.classList.add('is-nostream');
    });
  }

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

    // --- Yazılar: satır maskeleri -----------------------------------------------
    const splits = qa('[data-cicek-split]').map((el) => splitLines(el));

    // --- Scrub sahnesi ----------------------------------------------------------
    const seq = { f: 0 };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isTouch() ? 0.35 : true,
        invalidateOnRefresh: true,
      },
    });
    tl.to(seq, { f: 1, duration: SEQ_END, onUpdate: () => group?.setProgress(seq.f) }, 0);
    // Dizi yoksa (ya da gizliyse) fotoğraf kaçış noktasına doğru yavaşça yaklaşır
    if (still) tl.fromTo(still, { scale: 1 }, { scale: 1.16, duration: SEQ_END }, 0);

    gsap.set(beats, { autoAlpha: 0 });
    beats.forEach((beat, i) => {
      const [a, b] = SLOTS[i] ?? [0, 0];
      const label = beat.querySelector('[data-cicek-part]');
      const lines = splits.filter((s) => beat.contains(s.lines[0] ?? null)).flatMap((s) => s.lines);
      const parts = [label, ...lines].filter(Boolean) as Element[];
      tl.set(beat, { autoAlpha: 1 }, a)
        .fromTo(parts, { yPercent: 112 }, { yPercent: 0, duration: 0.045, stagger: 0.006, ease: 'power3.out' }, a)
        .to(parts, { yPercent: -112, duration: 0.03, stagger: 0.004, ease: 'power2.in' }, b - 0.04)
        .set(beat, { autoAlpha: 0 }, b);
    });

    // Çıkış: çerçeveye daralma (arkada kemik zemin), yapraklar köprüye devreder.
    // Kırpma DİKDÖRTGEN clip-path (hızlı yol); 24px köşeler kemik renkli dört köşe parçasıyla
    // verilir (yalnız transform). Yuvarlak clip-path her karede maske katmanı çizdiriyordu
    // (çıkışta 80–100 ms kareler).
    const X0 = 0.875;
    const R = 24;
    const box = { w: stage.clientWidth, h: stage.clientHeight };
    const insets = (): [number, number, number, number] => (isMobile() ? [0.15, 0.04, 0.21, 0.04] : [0.12, 0.06, 0.14, 0.06]);
    const exit = { e: 0 };
    let lastClip = '';
    const applyExit = (): void => {
      const e = exit.e;
      const [T, Rt, B, L] = insets();
      const clip = e <= 0 ? '' : `inset(${(T * e * 100).toFixed(3)}% ${(Rt * e * 100).toFixed(3)}% ${(B * e * 100).toFixed(3)}% ${(L * e * 100).toFixed(3)}%)`;
      if (clip !== lastClip) {
        lastClip = clip;
        media.style.clipPath = clip;
      }
      const { w, h } = box;
      const x0 = L * e * w;
      const x1 = w - Rt * e * w - R;
      const y0 = T * e * h;
      const y1 = h - B * e * h - R;
      const s = e.toFixed(3);
      const at: Record<string, [number, number]> = { tl: [x0, y0], tr: [x1, y0], bl: [x0, y1], br: [x1, y1] };
      for (const c of corners) {
        const [x, y] = at[c.dataset.c ?? 'tl'] ?? [0, 0];
        c.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s})`;
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
    tl.fromTo(exit, { e: 0 }, { e: 1, duration: 0.115, ease: 'power2.inOut', onUpdate: applyExit }, X0)
      .fromTo(zoom, { scale: 1 }, { scale: 0.9, duration: 0.115, ease: 'power2.inOut' }, X0)
      .to([fieldEl, nearEl], { autoAlpha: 0, duration: 0.06, ease: 'power1.in' }, 0.92)
      .set({}, {}, 1);
    const st = tl.scrollTrigger;
    const resetExit = (): void => {
      ScrollTrigger.removeEventListener('refresh', onExitRefresh);
      media.style.clipPath = '';
      for (const c of corners) c.style.transform = '';
    };

    if (!hasSprites) {
      return () => {
        resetExit();
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
    // (tick içindeki window.scrollY, o karede yazılmış biçemleri zorla hesaplatıyordu).
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
      resetExit();
      main.destroy();
      bridgeField.destroy();
      splits.forEach((s) => s.split.revert());
      group?.setProgress(0);
    };
  });
}

onMotionReady(initCicek);
