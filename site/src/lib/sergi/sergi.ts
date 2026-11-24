/**
 * Sergi sahnesi — Hero'nun eşleşme kesmesinin hedefi.
 * Bölüm, hero'nun son ekranının altına -100lvh ile biner; üst kenarı ekranın
 * tepesine değene kadar görünmez (.is-under). O anda hero tamamen güneş
 * turuncusudur ve Sergi'nin perdesi de aynı turuncu: kesme görünmez.
 *
 * Scrub (bölümün sabit aralığı):
 *   0–0.14   turuncu perde erir, drone videosu ortaya çıkar (1.15 → 1)
 *   ~0.14    başlık satırları açılır (reveal.ts, data-reveal-start="14%")
 *   0.26–0.4 üç mono çip
 *   0.58–0.92 video karesi editoryal ızgaradaki 24px köşeli çerçeveye küçülür;
 *            sayfa rengi daylight.ts ile golden → cream akar
 */
import { gsap, ScrollTrigger, mm, MOTION, isTouch, onMotionReady } from '../motion';

function initSergi(): void {
  const sec = document.querySelector<HTMLElement>('[data-sergi]');
  if (!sec) return;
  const q = (s: string): HTMLElement | null => sec.querySelector<HTMLElement>(s);
  const stage = q('[data-pin-stage]');
  const media = q('[data-sergi-media]');
  // Video ya da (video dosyası yokken) durağan kare <picture>
  const video = q('[data-sergi-motion]');
  const veil = q('[data-sergi-veil]');
  const scrim = q('[data-sergi-scrim]');
  const copy = q('[data-sergi-copy]');
  const chips = Array.from(sec.querySelectorAll<HTMLElement>('[data-sergi-chip]'));
  const target = q('[data-sergi-target]');
  const caption = q('[data-sergi-caption]');
  const toggle = q('[data-sergi-toggle]');
  if (!stage || !media || !veil || !target) return;

  // Durağan karenin push-in döngüsü yalnız görünürken çalışır
  if (q('[data-sergi-still]')) {
    new IntersectionObserver((entries) => {
      for (const e of entries) sec.classList.toggle('is-inview', e.isIntersecting);
    }).observe(media);
  }

  mm.add(MOTION, () => {
    sec.classList.add('is-under');
    const under = ScrollTrigger.create({
      trigger: sec,
      start: 'top top',
      end: 'max',
      onEnter: () => sec.classList.remove('is-under'),
      onLeaveBack: () => sec.classList.add('is-under'),
      onRefresh: (self) => sec.classList.toggle('is-under', self.scroll() < self.start),
    });

    const inset = (): string => {
      const s = stage.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const top = t.top - s.top;
      const left = t.left - s.left;
      return `inset(${top.toFixed(1)}px ${(s.width - left - t.width).toFixed(1)}px ${(s.height - top - t.height).toFixed(1)}px ${left.toFixed(1)}px round 24px)`;
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isTouch() ? 0.35 : true,
        invalidateOnRefresh: true,
      },
    });
    tl.fromTo(veil, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.14, ease: 'power1.in' }, 0);
    if (video) tl.fromTo(video, { scale: 1.15 }, { scale: 1, duration: 0.3, ease: 'power2.out' }, 0);
    if (scrim) tl.fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.08);
    if (chips.length) tl.fromTo(chips, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.03, ease: 'power2.out' }, 0.26);
    if (copy) tl.to(copy, { autoAlpha: 0, y: -30, duration: 0.07, ease: 'power1.in' }, 0.58);
    if (toggle) tl.to(toggle, { autoAlpha: 0, duration: 0.05 }, 0.58);
    tl.fromTo(
      media,
      { clipPath: 'inset(0px 0px 0px 0px round 0px)' },
      { clipPath: () => inset(), duration: 0.32, ease: 'power3.inOut' },
      0.6,
    );
    if (scrim) tl.to(scrim, { autoAlpha: 0, duration: 0.2 }, 0.66);
    if (caption) tl.fromTo(caption, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.84);

    return () => {
      under.kill();
      sec.classList.remove('is-under');
    };
  });
}

onMotionReady(initSergi);
