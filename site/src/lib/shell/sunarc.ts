/**
 * Güneş yayı: sayfanın üstünde sığ bir yay; küçük güneş kaydırma ilerlemesiyle
 * soldan sağa yay boyunca yürür. Pasif gösterge (aria-hidden).
 */
import { ScrollTrigger } from '../motion/core';

export function initSunArc(): void {
  const arc = document.querySelector<HTMLElement>('[data-sunarc]');
  if (!arc) return;
  const sun = arc.querySelector<HTMLElement>('[data-sunarc-sun]');
  const trail = arc.querySelector<SVGPathElement>('[data-sunarc-trail]');
  // Yay: y(t) = (1-t)^2*y0 + 2(1-t)t*yc + t^2*y2 (SVG ile aynı, 0–1 birim)
  const Y0 = 0.92;
  const YC = -0.6;
  let w = arc.clientWidth;
  let h = arc.clientHeight;
  new ResizeObserver(() => {
    w = arc.clientWidth;
    h = arc.clientHeight;
    set(last);
  }).observe(arc);

  let last = 0;
  const set = (p: number): void => {
    last = p;
    const y = (1 - p) * (1 - p) * Y0 + 2 * (1 - p) * p * YC + p * p * Y0;
    if (sun) sun.style.transform = `translate3d(${(p * w).toFixed(1)}px, ${(y * h).toFixed(1)}px, 0)`;
    if (trail) trail.style.strokeDashoffset = (1 - p).toFixed(4);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => set(self.progress), onRefresh: (self) => set(self.progress) });
  set(0);
}
