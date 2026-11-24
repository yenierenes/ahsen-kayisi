/**
 * parallax.ts — kaydırma ve fare parallax'ı.
 * <img data-speed="0.25">   kaydırırken ekran yüksekliğinin %25'i kadar yol alır (eksi: ters)
 * <img data-mouse="18">     fareye göre en fazla 18px kayar (yüzen kesim görseller)
 * İkisi aynı öğede birlikte kullanılabilir: kaydırma "transform", fare "translate" yazar.
 */
import { gsap, mm, MOTION, FINE, num, qsa } from './core';

export function initParallax(root: ParentNode = document): void {
  const speeds = qsa('[data-speed]', root);
  const mice = qsa('[data-mouse]', root);
  if (!speeds.length && !mice.length) return;

  mm.add(MOTION, () => {
    speeds.forEach((el) => {
      const s = num(el.dataset.speed, 0.2);
      gsap.fromTo(
        el,
        { y: () => window.innerHeight * s * 0.5 },
        {
          y: () => -window.innerHeight * s * 0.5,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
        },
      );
    });
  });

  if (!mice.length) return;
  mm.add(`${MOTION} and ${FINE}`, () => {
    const state = mice.map((el) => ({ el, amt: num(el.dataset.mouse, 16), x: 0, y: 0, tx: 0, ty: 0 }));
    const move = (e: PointerEvent): void => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      state.forEach((s) => {
        s.tx = nx * s.amt * 2;
        s.ty = ny * s.amt * 2;
      });
    };
    const tick = (): void => {
      state.forEach((s) => {
        s.x += (s.tx - s.x) * 0.08;
        s.y += (s.ty - s.y) * 0.08;
        s.el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    gsap.ticker.add(tick);
    return () => {
      window.removeEventListener('pointermove', move);
      gsap.ticker.remove(tick);
      state.forEach((s) => (s.el.style.translate = ''));
    };
  });
}
