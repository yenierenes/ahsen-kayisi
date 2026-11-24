/**
 * cursor.ts — küçük güneş noktası imleç (yalnız ince işaretçi, dokunmatikte kapalı).
 * Markup Base.astro'da: <div class="cursor" data-cursor-el>…</div>
 * Hedefler:
 *   <a data-cursor>…</a>                 nokta büyür
 *   <section data-cursor="Kaydır">…</section>   büyür ve etiket gösterir
 * Bağlantı ve düğmelerde nokta hafifçe büyür.
 */
import { gsap, mm, FINE, prefersReduced } from './core';

export function initCursor(): void {
  const el = document.querySelector<HTMLElement>('[data-cursor-el]');
  if (!el) return;
  const label = el.querySelector<HTMLElement>('[data-cursor-label]');
  const html = document.documentElement;

  mm.add(FINE, () => {
    html.classList.add('has-cursor');
    const d = prefersReduced() ? 0 : 0.35;
    const xTo = gsap.quickTo(el, 'x', { duration: d, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: d, ease: 'power3.out' });
    let shown = false;
    let current: Element | null = null;

    const move = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      if (!shown) {
        gsap.set(el, { x: e.clientX, y: e.clientY });
        el.classList.add('is-visible');
        shown = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e: PointerEvent): void => {
      const t = e.target as Element | null;
      const target = t?.closest('[data-cursor]') ?? null;
      const link = t?.closest('a,button,[role="button"],label,summary') ?? null;
      el.classList.toggle('is-link', !!link && !target);
      if (target === current) return;
      current = target;
      const text = target?.getAttribute('data-cursor') ?? '';
      el.classList.toggle('is-active', !!target);
      el.classList.toggle('has-label', !!text);
      if (label) label.textContent = text;
    };
    const hide = (): void => {
      el.classList.remove('is-visible');
      shown = false;
    };
    const down = (): void => el.classList.add('is-down');
    const up = (): void => el.classList.remove('is-down');

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      html.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      el.classList.remove('is-visible', 'is-active', 'has-label', 'is-link');
    };
  });
}
