/**
 * magnetic.ts — imlece doğru çekilen öğeler (yalnız ince işaretçi + hareket açık).
 * <a class="btn" data-magnetic="0.35"><span data-magnetic-inner>Numune İste</span></a>
 * Değer: çekim gücü (0–1, varsayılan 0.3). İçteki [data-magnetic-inner] iki kat hareket eder.
 */
import { gsap, mm, MOTION, FINE, num, qsa } from './core';

export function initMagnetic(root: ParentNode = document): void {
  const els = qsa('[data-magnetic]', root);
  if (!els.length) return;
  mm.add(`${MOTION} and ${FINE}`, () => {
    const offs: (() => void)[] = [];
    els.forEach((el) => {
      const strength = num(el.dataset.magnetic, 0.3);
      const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
      const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      const ixTo = inner ? gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
      const iyTo = inner ? gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
      const move = (e: PointerEvent): void => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.6);
        iyTo?.(dy * strength * 0.6);
      };
      const leave = (): void => {
        gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.45)', overwrite: true });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.45)', overwrite: true });
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      offs.push(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
        gsap.set([el, inner].filter(Boolean), { clearProps: 'transform' });
      });
    });
    return () => offs.forEach((o) => o());
  });
}
