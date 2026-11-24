/**
 * Manifesto sahnesi.
 *  - Yüzen kesimler: data-speed / data-mouse (parallax.ts) yer değiştirir; burada
 *    ek olarak kaydırma boyunca hafifçe döndürülür. CSS "rotate" taban açıyı,
 *    GSAP "rotation" (transform) kaydırma açısını taşır; ikisi toplanır.
 *  - Dikey fotoğraf: çerçeve yukarıdan aşağı açılır (clip-path), görsel yerine oturur.
 * Paragraf dolumu reveal.ts'in data-fill'inden gelir.
 */
import { gsap, mm, MOTION, onMotionReady } from '../motion';

function initManifesto(): void {
  const sec = document.querySelector<HTMLElement>('[data-manifesto]');
  if (!sec) return;
  const floats = Array.from(sec.querySelectorAll<HTMLElement>('[data-float]'));
  const frame = sec.querySelector<HTMLElement>('[data-manifesto-frame]');
  const img = frame?.querySelector<HTMLElement>('img') ?? null;

  mm.add(MOTION, () => {
    floats.forEach((el) => {
      const spin = Number.parseFloat(el.dataset.spin ?? '10');
      gsap.fromTo(
        el,
        { rotation: -spin / 2 },
        {
          rotation: spin / 2,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    });

    if (frame) {
      const trigger = { trigger: frame, start: 'top 85%', once: true };
      gsap.fromTo(
        frame,
        { clipPath: 'inset(0% 0% 100% 0% round 24px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 0.9, ease: 'power3.inOut', scrollTrigger: trigger },
      );
      if (img) {
        gsap.fromTo(img, { scale: 1.22 }, { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: trigger });
      }
    }
  });
}

onMotionReady(initManifesto);
