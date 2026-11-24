/**
 * Preloader: kayısı silüeti alttan üste dolar; mono % sayacı hero dizisinin
 * gerçek anahtar kare yüklemesine bağlıdır (iki dizide kare 1 + her 8. kare).
 * Kare 1 çizilmeden açılmaz (en geç HARD_MS), sonra perde yukarı açılır ve hero'ya devreder.
 * reduced-motion / JS yok: preloader hiç görünmez.
 */
import { gsap, introGate, prefersReduced } from '../motion/core';
import { startScroll, stopScroll, scrollToTarget } from '../motion/smooth';
import type { SequenceProgress } from '../motion/sequence';

/** Anahtar kareler bu süreyi aşarsa kare 1 çizildiyse yine de açıl */
const SOFT_MS = 3200;
/** Ağ çok yavaşsa her koşulda açıl */
const HARD_MS = 7000;
const MIN_MS = 700;

export function initPreloader(group = 'hero'): void {
  const el = document.querySelector<HTMLElement>('[data-preloader]');
  const html = document.documentElement;
  if (!el || prefersReduced()) {
    el?.remove();
    html.classList.add('is-loaded');
    introGate.resolve();
    return;
  }
  const count = el.querySelector<HTMLElement>('[data-preloader-count]');
  stopScroll();
  scrollToTarget(0, { immediate: true });

  const t0 = performance.now();
  let real = 0;
  let first = false;
  const shown = { v: 0 };
  let leaving = false;

  const onProgress = (e: Event): void => {
    const d = (e as CustomEvent<SequenceProgress>).detail;
    if (d.group !== group) return;
    real = Math.max(real, d.critical);
    first = first || d.first || d.critical >= 1;
  };
  window.addEventListener('sequence:progress', onProgress);

  const write = (): void => {
    const p = Math.round(shown.v * 100);
    el.style.setProperty('--p', shown.v.toFixed(4));
    if (count) count.textContent = String(p).padStart(2, '0');
  };

  const tick = (): void => {
    const elapsed = performance.now() - t0;
    // Sayaç gerçek anahtar kare ilerlemesini izler (kare 1 + her 8. kare, iki dizi).
    // Kaçış: SOFT_MS sonrası kare 1 hazırsa, HARD_MS sonrası her durumda açıl.
    const escape = elapsed >= HARD_MS || (elapsed >= SOFT_MS && first);
    const target = escape ? 1 : Math.min(real, elapsed / MIN_MS);
    shown.v += (target - shown.v) * (escape ? 0.2 : 0.14);
    if (target >= 1 && shown.v > 0.995) shown.v = 1;
    write();
    if (shown.v >= 1 && !leaving) leave();
  };
  gsap.ticker.add(tick);

  const leave = (): void => {
    leaving = true;
    gsap.ticker.remove(tick);
    window.removeEventListener('sequence:progress', onProgress);
    const tl = gsap.timeline({
      onComplete: () => {
        el.remove();
        html.classList.add('is-loaded');
      },
    });
    tl.to(el.querySelector('[data-preloader-inner]'), { yPercent: -30, autoAlpha: 0, duration: 0.7, ease: 'power3.in' }, 0.1)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.35)
      .add(() => {
        introGate.resolve();
        startScroll();
      }, 0.7);
  };
}
