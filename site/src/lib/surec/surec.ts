/**
 * Süreç davranışı.
 *  1. Aktif adım: IntersectionObserver ile ince bir şeritte (geniş ekranda ekranın ortası,
 *     dar ekranda sabit çerçevenin altı) hangi adım varsa o aktiftir. Çerçevedeki
 *     katman clip-path perdesiyle değişir (CSS geçişi; reduced-motion'da anında).
 *     Bu kısım reduced-motion'da da çalışır: yalnız hareket kalkar.
 *  2. Ray: ilerleme çizgisi ve güneş noktası, şerit çizgisinin ilk ile son işaret
 *     arasındaki konumunu izler (ScrollTrigger; yalnız hareket açıkken).
 *     reduced-motion'da nokta aktif adımın işaretine atlar.
 */
import { gsap, ScrollTrigger, mm, MOTION, onMotionReady } from '../motion';

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

/** el'in, kök öğeye göre dönüşümden bağımsız (yerleşim) konumu */
function layoutPos(el: HTMLElement, root: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

function initSurec(): void {
  const sec = document.querySelector<HTMLElement>('[data-surec]');
  if (!sec) return;
  const layers = Array.from(sec.querySelectorAll<HTMLElement>('[data-surec-layer]'));
  const steps = Array.from(sec.querySelectorAll<HTMLElement>('[data-surec-step]'));
  const marks = Array.from(sec.querySelectorAll<HTMLElement>('[data-surec-mark]'));
  const list = sec.querySelector<HTMLElement>('[data-surec-list]');
  const fill = sec.querySelector<HTMLElement>('[data-surec-fill]');
  const sun = sec.querySelector<HTMLElement>('[data-surec-sun]');
  const tagNo = sec.querySelector<HTMLElement>('[data-surec-no]');
  const tagName = sec.querySelector<HTMLElement>('[data-surec-name]');
  if (!list || !fill || !sun || !layers.length || layers.length !== steps.length || marks.length !== steps.length) return;

  const mqWide = window.matchMedia('(min-width: 1100px)');
  let cur = 0;
  let smooth = false; // true: ray kaydırmayla sürekli akar; false: aktif adıma atlar

  /* --- Ray ölçüsü ve çizimi -------------------------------------------------- */
  const measure = (): { ys: number[]; top: number; h: number } => {
    const ys = marks.map((m) => layoutPos(m, list).y + m.offsetHeight / 2);
    const top = ys[0] ?? 0;
    const h = Math.max(1, (ys[ys.length - 1] ?? 0) - top);
    list.style.setProperty('--rail-top', `${top}px`);
    list.style.setProperty('--rail-h', `${h}px`);
    return { ys, top, h };
  };
  const draw = (p: number, h: number): void => {
    fill.style.transform = `scaleY(${p.toFixed(4)})`;
    sun.style.transform = `translate3d(0, ${(p * h).toFixed(1)}px, 0)`;
  };
  const placeDiscrete = (): void => {
    if (smooth) return;
    const m = measure();
    draw(((m.ys[cur] ?? m.top) - m.top) / m.h, m.h);
  };

  /* --- Aktif adım ------------------------------------------------------------ */
  const setActive = (next: number): void => {
    if (next === cur) return;
    const dir = next > cur ? 1 : -1;
    const from = layers[cur]!;
    const to = layers[next]!;

    layers.forEach((l) => l.classList.remove('is-prev'));
    // Perde yönü: aşağı inerken alttan yukarı, yukarı çıkarken üstten aşağı açılır
    to.style.transition = 'none';
    to.style.clipPath = dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
    void to.offsetWidth;
    to.style.transition = '';
    to.style.clipPath = '';
    from.classList.remove('is-on');
    from.classList.add('is-prev');
    to.classList.add('is-on');

    layers.forEach((l, i) => (i === next ? l.removeAttribute('aria-hidden') : l.setAttribute('aria-hidden', 'true')));
    steps.forEach((s, i) => s.classList.toggle('is-active', i === next));
    if (tagNo) tagNo.textContent = String(next + 1).padStart(2, '0');
    if (tagName) tagName.textContent = steps[next]?.dataset.title ?? '';

    cur = next;
    placeDiscrete();
  };

  let io: IntersectionObserver | null = null;
  const observe = (): void => {
    io?.disconnect();
    // Şerit: geniş ekranda %48–52; dar ekranda sabit çerçevenin altında (~%64–69)
    const margin = mqWide.matches ? '-48% 0px -48% 0px' : '-64% 0px -31% 0px';
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(steps.indexOf(e.target as HTMLElement));
        });
      },
      { rootMargin: margin, threshold: 0 },
    );
    steps.forEach((s) => io!.observe(s));
  };
  observe();
  mqWide.addEventListener('change', observe);

  window.addEventListener('resize', placeDiscrete, { passive: true });
  placeDiscrete();

  /* --- Ray: kaydırmayla sürekli ilerleme (yalnız hareket açıkken) ---------------- */
  mm.add(MOTION, () => {
    smooth = true;
    let m = measure();
    const update = (): void => {
      const lineY = window.innerHeight * (mqWide.matches ? 0.5 : 0.675);
      const p = clamp((lineY - (list.getBoundingClientRect().top + m.top)) / m.h, 0, 1);
      draw(p, m.h);
    };
    const st = ScrollTrigger.create({
      trigger: list,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: update,
      onRefresh: () => {
        m = measure();
        update();
      },
    });
    update();
    return () => {
      st.kill();
      smooth = false;
      placeDiscrete();
    };
  });

  /* --- Geniş ekran: çerçeve yapışma noktasına gelirken yukarıdan aşağı açılır ----
   * Görünen dilim her an ekranın içinde kalır: giriş bölümünde yarım kesilmiş bir
   * çerçeve görünmez, bir pencere açılır. İçteki görsel aynı sürede yerine oturur. */
  const frame = sec.querySelector<HTMLElement>('[data-surec-frame]');
  const media = sec.querySelector<HTMLElement>('[data-surec-media]');
  if (frame && media) {
    mm.add(`(min-width: 1100px) and ${MOTION}`, () => {
      const top = (): number => Number.parseFloat(getComputedStyle(media).top) || 0;
      const tw = gsap.fromTo(
        frame,
        { clipPath: 'inset(0% 0% 100% 0% round 24px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 24px)',
          ease: 'none',
          scrollTrigger: {
            // Yapışkan öğenin kendisi değil, aynı üst kenardan başlayan ızgara ölçülür
            trigger: media.parentElement ?? media,
            start: 'top bottom',
            end: () => `top ${top()}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
      return () => {
        tw.scrollTrigger?.kill();
        tw.kill();
        gsap.set(frame, { clearProps: 'clipPath' });
      };
    });
  }
}

onMotionReady(initSurec);
