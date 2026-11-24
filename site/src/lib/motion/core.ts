/**
 * Motion çekirdeği: GSAP kaydı, ortam sorguları, küçük yardımcılar, kapılar.
 * Tüm motion modülleri buradan içe aktarır (tek GSAP örneği).
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'expo.out', duration: 1 });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };

/** gsap.matchMedia koşulları — her modül hareketini bunların içinde kurar */
export const MOTION = '(prefers-reduced-motion: no-preference)';
export const REDUCE = '(prefers-reduced-motion: reduce)';
export const FINE = '(hover: hover) and (pointer: fine)';
export const MOBILE = '(max-width: 767.98px)';

const mqReduce = window.matchMedia(REDUCE);
const mqFine = window.matchMedia(FINE);
const mqMobile = window.matchMedia(MOBILE);

export const prefersReduced = (): boolean => mqReduce.matches;
export const isFinePointer = (): boolean => mqFine.matches;
export const isTouch = (): boolean => !mqFine.matches;
export const isMobile = (): boolean => mqMobile.matches;

/** Tek paylaşılan matchMedia bağlamı: sorgu değişince içindekiler otomatik geri alınır */
export const mm = gsap.matchMedia();

/** <html> sınıfları: .motion-ok / .reduce (ilk değer <head> içindeki satır içi betikten gelir) */
export function syncMotionClass(): void {
  const html = document.documentElement;
  html.classList.toggle('motion-ok', !mqReduce.matches);
  html.classList.toggle('reduce', mqReduce.matches);
}
mqReduce.addEventListener('change', syncMotionClass);

export function qsa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(sel));
}

export function num(v: string | null | undefined, fallback: number): number {
  const n = Number.parseFloat(v ?? '');
  return Number.isFinite(n) ? n : fallback;
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms = 150): (...a: A) => void {
  let t = 0;
  return (...a: A) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  };
}

/**
 * Sabitlenmiş (sticky) bir bölüm içindeki ilerleme noktasını ScrollTrigger
 * konumuna çevirir. "35%" → bölümün sabit kaldığı kaydırma aralığının %35'i.
 * Diğer her değer olduğu gibi döner ("top 80%" gibi).
 */
export function stickyPos(trigger: HTMLElement, value: string): string | (() => string) {
  const m = /^(-?[\d.]+)%$/.exec(value.trim());
  if (!m) return value;
  const f = Number.parseFloat(m[1] ?? '0') / 100;
  return () => `top+=${Math.round(f * Math.max(0, trigger.offsetHeight - window.innerHeight))} top`;
}

/** Bir kez açılan kapı (Promise + bayrak) */
export interface Gate {
  readonly open: boolean;
  promise: Promise<void>;
  resolve: () => void;
}
function createGate(): Gate {
  let r!: () => void;
  let open = false;
  const promise = new Promise<void>((res) => (r = res));
  return {
    get open() {
      return open;
    },
    promise,
    resolve: () => {
      if (open) return;
      open = true;
      r();
    },
  };
}

/** initMotion() bitti: modüller kuruldu, bölüm betikleri kendi sahnelerini kurabilir */
export const motionReady = createGate();
/** Preloader perdesi kalkmaya başladı: hero girişi oynayabilir */
export const introGate = createGate();

export function onMotionReady(fn: () => void): void {
  void motionReady.promise.then(fn);
}

export function emit<T>(name: string, detail: T): void {
  window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}
