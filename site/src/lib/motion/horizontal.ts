/**
 * horizontal.ts — sabitlenmiş yatay iz + kart parallax'ı + ilerleme göstergesi.
 *
 * <section data-horizontal data-pin>
 *   <div data-pin-stage>
 *     <div data-horizontal-track>
 *       <article data-horizontal-card><img data-card-parallax …></article> …
 *     </div>
 *     <span data-horizontal-progress>01 / 05</span>
 *     <span data-horizontal-bar></span>
 *   </div>
 * </section>
 * Masaüstü (ince işaretçi, ≥768px, hareket açık): dikey kaydırma yatay ize çevrilir;
 * bölüm yüksekliğini (--pin-len) iz genişliğinden JS hesaplar.
 * Dokunmatik / dar ekran / reduced-motion: .is-native → yerel yatay kaydırma + scroll-snap.
 */
import { gsap, ScrollTrigger, mm, MOTION, FINE, num, qsa } from './core';

const DESKTOP = `${MOTION} and ${FINE} and (min-width: 768px)`;

function readout(section: HTMLElement, p: number, count: number): void {
  section.style.setProperty('--h-progress', p.toFixed(4));
  const i = Math.min(count, Math.max(1, Math.round(p * (count - 1)) + 1));
  const label = `${String(i).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
  qsa('[data-horizontal-progress]', section).forEach((el) => {
    if (el.textContent !== label) el.textContent = label;
  });
}

export function initHorizontal(root: ParentNode = document): void {
  const sections = qsa('[data-horizontal]', root);
  if (!sections.length) return;

  mm.add({ desktop: DESKTOP, other: `not all and ${DESKTOP}` }, (ctx) => {
    const desktop = !!ctx.conditions?.desktop;
    const cleanups: (() => void)[] = [];
    sections.forEach((section) => {
      const stage = section.querySelector<HTMLElement>('[data-pin-stage]') ?? section;
      const track = section.querySelector<HTMLElement>('[data-horizontal-track]');
      if (!track) return;
      const cards = qsa('[data-horizontal-card]', track);
      const count = Math.max(1, cards.length);

      if (!desktop) {
        section.classList.add('is-native');
        const onScroll = (): void => {
          const max = track.scrollWidth - track.clientWidth;
          readout(section, max > 0 ? track.scrollLeft / max : 0, count);
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        cleanups.push(() => {
          track.removeEventListener('scroll', onScroll);
          section.classList.remove('is-native');
        });
        return;
      }

      const dist = (): number => Math.max(0, track.scrollWidth - stage.clientWidth);
      const setLen = (): void => section.style.setProperty('--pin-len', `${dist()}px`);
      setLen();
      ScrollTrigger.addEventListener('refreshInit', setLen);

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => readout(section, self.progress, count),
        },
      });
      cards.forEach((card) => {
        const inner = card.querySelector<HTMLElement>('[data-card-parallax]');
        if (!inner) return;
        const s = num(inner.dataset.cardParallax, 1);
        gsap.fromTo(
          inner,
          { xPercent: -7 * s },
          {
            xPercent: 7 * s,
            ease: 'none',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          },
        );
      });
      readout(section, 0, count);
      cleanups.push(() => {
        ScrollTrigger.removeEventListener('refreshInit', setLen);
        section.style.removeProperty('--pin-len');
      });
    });
    return () => cleanups.forEach((c) => c());
  });
}
