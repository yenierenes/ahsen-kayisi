/**
 * rail.ts — Ürünler yatay izi: kart yığınlarına kaydırmaya bağlı "canlılık".
 * <section data-rail> … <div data-rail-float><img></div> …
 * Her kart ekranı geçerken yığını birkaç derece döner ve hafifçe salınır (yalnız transform).
 * Kaynak: kartın ekrandaki yatay konumu (getBoundingClientRect) → hem sabit iz (GSAP x) hem
 * dokunmatik yerel kaydırma için aynı formül. Yalnız bölüm görünürken ve konum değiştiğinde yazar.
 * reduced-motion: kurulmaz (mm MOTION), geri alma otomatik.
 */
import { mm, MOTION, onMotionReady } from '@/lib/motion';

function initRail(section: HTMLElement): void {
  const track = section.querySelector<HTMLElement>('[data-horizontal-track]');
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-rail-float]'))
    .map((el) => ({ el, card: el.closest<HTMLElement>('[data-horizontal-card]') }))
    .filter((x): x is { el: HTMLElement; card: HTMLElement } => !!x.card);
  if (!track || !items.length) return;

  onMotionReady(() =>
    mm.add(MOTION, () => {
      let raf = 0;
      let key = '';
      const frame = (): void => {
        raf = requestAnimationFrame(frame);
        const W = window.innerWidth;
        const k = `${window.scrollY}|${track.scrollLeft}|${W}`;
        if (k === key) return;
        key = k;
        for (const { el, card } of items) {
          const r = card.getBoundingClientRect();
          // −1 = kart ortası sol kenarda, 0 = ekran ortası, 1 = sağ kenarda
          const p = Math.max(-1.3, Math.min(1.3, ((r.left + r.width / 2) / W) * 2 - 1));
          const rot = p * -6;
          const y = p * p * 5 - 2;
          const x = p * -3;
          el.style.transform = `translate3d(${x.toFixed(2)}%, ${y.toFixed(2)}%, 0) rotate(${rot.toFixed(2)}deg)`;
        }
      };
      const io = new IntersectionObserver(
        (entries) => {
          const on = entries.some((e) => e.isIntersecting);
          cancelAnimationFrame(raf);
          if (on) {
            key = '';
            raf = requestAnimationFrame(frame);
          }
        },
        { rootMargin: '10% 0px' },
      );
      io.observe(section);
      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        items.forEach(({ el }) => el.style.removeProperty('transform'));
      };
    }),
  );
}

document.querySelectorAll<HTMLElement>('[data-rail]').forEach(initRail);
