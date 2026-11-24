/**
 * Motion kütüphanesi giriş noktası. Base.astro bir kez initMotion() çağırır;
 * tüm data-* API'leri sayfadaki öğelerden otomatik kurulur.
 * Bölüme özel sahneler: onMotionReady(() => …) içinde kurulur.
 */
import { ScrollTrigger, debounce, motionReady, syncMotionClass } from './core';
import { initSmooth } from './smooth';
import { initDaylight } from './daylight';
import { initSequences } from './sequence';
import { initReveal } from './reveal';
import { initMask } from './mask';
import { initHorizontal } from './horizontal';
import { initMagnetic } from './magnetic';
import { initCounter } from './counter';
import { initMarquee } from './marquee';
import { initParallax } from './parallax';
import { initVideo } from './video';
import { initCursor } from './cursor';

export * from './core';
export { scrollToTarget, stopScroll, startScroll, getLenis, getVelocity } from './smooth';
export { getSequenceGroup } from './sequence';
export { splitLines } from './reveal';
export { formatTR } from './counter';

let started = false;

export function initMotion(): void {
  if (started) return;
  started = true;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  syncMotionClass();
  initSmooth();
  initSequences();
  initDaylight();
  initMask();
  initHorizontal();
  initParallax();
  initCounter();
  initMarquee();
  initMagnetic();
  initVideo();
  initCursor();
  initReveal();
  motionReady.resolve();

  // Fontlar ve görseller yerleşince ölçüleri tazele
  const refresh = debounce(() => ScrollTrigger.refresh(), 120);
  void document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });
}
