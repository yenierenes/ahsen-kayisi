/**
 * counter.ts — görünür olunca sayan rakamlar, tr-TR biçimiyle (2.800 · 12,4).
 * HTML'e son değeri yaz (JS'siz/SEO doğru kalır):
 * <span data-counter="2800" data-counter-prefix="~" data-counter-suffix=" saat">~2.800 saat</span>
 * <span data-counter="12.4" data-counter-decimals="1">12,4</span>
 * data-counter-duration (sn, varsayılan 2). reduced-motion: değer olduğu gibi kalır.
 */
import { gsap, mm, MOTION, num, qsa } from './core';

export function formatTR(value: number, decimals = 0): string {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function initCounter(root: ParentNode = document): void {
  const els = qsa('[data-counter]', root);
  if (!els.length) return;
  mm.add(MOTION, () => {
    const originals = els.map((el) => el.textContent ?? '');
    els.forEach((el) => {
      const target = num(el.dataset.counter, 0);
      const dec = num(el.dataset.counterDecimals, 0);
      const pre = el.dataset.counterPrefix ?? '';
      const suf = el.dataset.counterSuffix ?? '';
      const o = { v: 0 };
      const write = (): void => {
        el.textContent = `${pre}${formatTR(o.v, dec)}${suf}`;
      };
      write();
      gsap.to(o, {
        v: target,
        duration: num(el.dataset.counterDuration, 2),
        ease: 'expo.out',
        onUpdate: write,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
    return () => els.forEach((el, i) => (el.textContent = originals[i] ?? ''));
  });
}
