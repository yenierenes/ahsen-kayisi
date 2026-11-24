/**
 * smooth.ts — Lenis + GSAP ticker + ScrollTrigger senkronu, çapa kaydırma,
 * stop/start API. reduced-motion'da Lenis hiç kurulmaz (yerel kaydırma).
 */
import Lenis from 'lenis';
import { gsap, ScrollTrigger, mm, MOTION } from './core';

let lenis: Lenis | null = null;
let locks = 0;

export function initSmooth(): void {
  mm.add(MOTION, () => {
    const l = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      anchors: false,
    });
    lenis = l;
    l.on('scroll', ScrollTrigger.update);
    const tick = (time: number): void => l.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (locks > 0) l.stop();
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      lenis = null;
    };
  });
  document.addEventListener('click', onAnchorClick);
}

function onAnchorClick(e: MouseEvent): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href') ?? '';
  if (hash.length < 2) return;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target) return;
  e.preventDefault();
  scrollToTarget(target);
  history.replaceState(null, '', hash);
  // Klavye/ekran okuyucu odağı hedefe taşınır
  if (!target.matches('a,button,input,select,textarea,[tabindex]')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/** Hedefe kaydır: Lenis varsa yumuşak, yoksa anında */
export function scrollToTarget(target: HTMLElement | number, opts: { immediate?: boolean; offset?: number } = {}): void {
  if (lenis) {
    lenis.scrollTo(target, {
      offset: opts.offset ?? 0,
      immediate: opts.immediate ?? false,
      duration: 1.6,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      force: true,
    });
    return;
  }
  const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  window.scrollTo({ top: y, behavior: 'instant' });
}

/** Kaydırmayı kilitle (preloader, menü). İç içe çağrılar sayılır. */
export function stopScroll(): void {
  locks += 1;
  lenis?.stop();
  document.documentElement.classList.add('is-locked');
}
export function startScroll(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  lenis?.start();
  document.documentElement.classList.remove('is-locked');
}

export const getLenis = (): Lenis | null => lenis;
/** px/kare cinsinden anlık kaydırma hızı (Lenis yoksa 0) */
export const getVelocity = (): number => lenis?.velocity ?? 0;
