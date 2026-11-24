/**
 * Çiçek sahnesi — "BAHAR".
 *
 * Tek scrub zaman çizelgesi (p = bölümün sabit kaydırma ilerlemesi):
 *   0–0.92   dizi kare 1 → N (kamera ağaç sırasında ilerler; dizi yoksa foto yavaşça yaklaşır)
 *   vuruşlar 01 [0.02–0.30] · 02 [0.35–0.58] · 03 [0.63–0.83] — satırlar maskeden girer/çıkar
 *   0.85–0.98 tam ekran görüntü 24px köşeli çerçeveye daralır; sayfa rengi kemiğe akar
 *             (data-sky-to="bone"), Süreç başlığına teslim.
 * Yapraklar (petals.ts): yoğunluk ve rüzgâr hikâyeyi izler — 01 seyrek, 02 bir esinti
 * (yoğun ve hızlı), 03 seyrelir. Bölüm ekranda değilken ya da sekme gizliyken durur.
 */
import { gsap, ScrollTrigger, mm, MOTION, REDUCE, isTouch, isMobile, isFinePointer, onMotionReady, getSequenceGroup, splitLines } from '../motion';
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

const DENSITY = curve([
  [0, 0.3],
  [0.29, 0.34],
  [0.36, 1],
  [0.56, 1],
  [0.64, 0.5],
  [0.84, 0.32],
  [1, 0.16],
]);
const WIND = curve([
  [0, 1],
  [0.3, 1.05],
  [0.37, 2.4],
  [0.54, 2.1],
  [0.63, 1],
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
    tl.to(seq, { f: 1, duration: 0.92, onUpdate: () => group?.setProgress(seq.f) }, 0);
    // Dizi yoksa (ya da gizliyse) fotoğraf kaçış noktasına doğru yavaşça yaklaşır
    if (still) tl.fromTo(still, { scale: 1 }, { scale: 1.16, duration: 0.92 }, 0);

    const slots: [number, number][] = [
      [0.02, 0.3],
      [0.35, 0.58],
      [0.63, 0.83],
    ];
    gsap.set(beats, { autoAlpha: 0 });
    beats.forEach((beat, i) => {
      const [a, b] = slots[i] ?? [0, 0];
      const label = beat.querySelector('[data-cicek-part]');
      const lines = splits.filter((s) => beat.contains(s.lines[0] ?? null)).flatMap((s) => s.lines);
      const parts = [label, ...lines].filter(Boolean) as Element[];
      tl.set(beat, { autoAlpha: 1 }, a)
        .fromTo(parts, { yPercent: 112 }, { yPercent: 0, duration: 0.06, stagger: 0.008, ease: 'power3.out' }, a)
        .to(parts, { yPercent: -112, duration: 0.04, stagger: 0.005, ease: 'power2.in' }, b - 0.05)
        .set(beat, { autoAlpha: 0 }, b);
    });

    // Çıkış: çerçeveye daralma, yapraklar köprüye devreder
    const frameInset = (): string => (isMobile() ? 'inset(15% 4% 21% 4% round 24px)' : 'inset(12% 6% 14% 6% round 24px)');
    if (wash) tl.to(wash, { autoAlpha: 0, duration: 0.05 }, 0.82);
    tl.fromTo(
      media,
      { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
      { clipPath: () => frameInset(), duration: 0.13, ease: 'power2.inOut' },
      0.85,
    )
      .fromTo(zoom, { scale: 1 }, { scale: 0.9, duration: 0.13, ease: 'power2.inOut' }, 0.85)
      .to([fieldEl, nearEl], { autoAlpha: 0, duration: 0.08, ease: 'power1.in' }, 0.9)
      .set({}, {}, 1);
    const st = tl.scrollTrigger;

    if (!hasSprites) {
      return () => splits.forEach((s) => s.split.revert());
    }

    // --- Yaprak sistemi -----------------------------------------------------------
    const mobile = isMobile();
    const counts: Record<Depth, number> = mobile ? { 0: 4, 1: 4, 2: 2 } : { 0: 11, 1: 8, 2: 5 };
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
    let lastY = window.scrollY;
    const tick = (time: number, deltaMs: number): void => {
      const dt = Math.min(0.05, deltaMs / 1000);
      const y = window.scrollY;
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
        lastY = window.scrollY;
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
      if (fine) window.removeEventListener('pointermove', onMove);
      ScrollTrigger.removeEventListener('refresh', remeasure);
      main.destroy();
      bridgeField.destroy();
      splits.forEach((s) => s.split.revert());
      group?.setProgress(0);
    };
  });
}

onMotionReady(initCicek);
