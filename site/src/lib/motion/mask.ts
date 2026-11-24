/**
 * mask.ts — kaydırmayla genişleyen dairesel clip-path açılımı.
 *
 * <section data-mask data-pin style="--pin-len:150lvh">
 *   <div data-pin-stage>
 *     <div data-mask-reveal data-mask-from="6" data-mask-origin="50% 60%">
 *       <video …></video>
 *     </div>
 *   </div>
 * </section>
 * data-pin yoksa açılım "top 80%" → "center center" arasında olur.
 * data-mask-start / data-mask-end ile ezilebilir ("35%" = sabit aralığın %35'i).
 * İçteki [data-mask-media] 1.2 → 1 ölçeklenir.
 */
import { gsap, mm, MOTION, num, qsa, stickyPos } from './core';

export function initMask(root: ParentNode = document): void {
  const hosts = qsa('[data-mask]', root);
  if (!hosts.length) return;
  mm.add(MOTION, () => {
    hosts.forEach((host) => {
      const reveal = host.querySelector<HTMLElement>('[data-mask-reveal]');
      if (!reveal) return;
      const pinned = host.hasAttribute('data-pin');
      const from = num(reveal.dataset.maskFrom, 0);
      const origin = reveal.dataset.maskOrigin ?? '50% 50%';
      const st = {
        trigger: host,
        start: stickyPos(host, host.dataset.maskStart ?? (pinned ? '0%' : 'top 80%')),
        end: stickyPos(host, host.dataset.maskEnd ?? (pinned ? '85%' : 'center center')),
        scrub: true,
        invalidateOnRefresh: true,
      };
      gsap.fromTo(
        reveal,
        { clipPath: `circle(${from}% at ${origin})` },
        { clipPath: `circle(75% at ${origin})`, ease: 'power2.inOut', scrollTrigger: st },
      );
      const media = reveal.querySelector('[data-mask-media]');
      if (media) gsap.fromTo(media, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { ...st } });
    });
  });
}
