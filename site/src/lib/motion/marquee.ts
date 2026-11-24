/**
 * marquee.ts — kaydırma hızına tepki veren sonsuz şerit.
 * <div data-marquee="60" aria-hidden="true">          60 px/sn; eksi değer ters yön
 *   <div data-marquee-track>
 *     <span data-marquee-item>Malatya</span><span data-marquee-item>·</span> …
 *   </div>
 * </div>
 * data-marquee-react="direction" → aşağı/yukarı kaydırmaya göre yön değiştirir.
 * Ekran dışındayken durur. reduced-motion: durağan.
 */
import { gsap, mm, MOTION, num, qsa } from './core';
import { getVelocity } from './smooth';

export function initMarquee(root: ParentNode = document): void {
  const hosts = qsa('[data-marquee]', root);
  if (!hosts.length) return;
  mm.add(MOTION, () => {
    const offs: (() => void)[] = [];
    hosts.forEach((host) => {
      const track = host.querySelector<HTMLElement>('[data-marquee-track]');
      if (!track) return;
      const clones: HTMLElement[] = [];
      const fill = (): void => {
        clones.forEach((c) => c.remove());
        clones.length = 0;
        const need = Math.ceil((host.clientWidth * 2) / Math.max(1, track.offsetWidth)) + 1;
        for (let i = 0; i < need; i++) {
          const c = track.cloneNode(true) as HTMLElement;
          c.setAttribute('aria-hidden', 'true');
          host.appendChild(c);
          clones.push(c);
        }
      };
      fill();
      const tracks = (): HTMLElement[] => [track, ...clones];
      const base = num(host.dataset.marquee, 50);
      const react = host.dataset.marqueeReact === 'direction';
      let x = 0;
      let dir = 1;
      let visible = false;
      const io = new IntersectionObserver(([e]) => (visible = !!e?.isIntersecting));
      io.observe(host);
      const tick = (_t: number, dt: number): void => {
        if (!visible) return;
        const v = getVelocity();
        if (react && Math.abs(v) > 0.5) dir = v > 0 ? 1 : -1;
        const boost = 1 + Math.min(6, Math.abs(v) * 0.25);
        x -= ((base * dt) / 1000) * boost * dir;
        const w = track.offsetWidth;
        if (w > 0) x = gsap.utils.wrap(-w, 0, x);
        const tx = `translate3d(${x}px,0,0)`;
        tracks().forEach((t) => (t.style.transform = tx));
      };
      gsap.ticker.add(tick);
      const onResize = (): void => fill();
      window.addEventListener('resize', onResize);
      offs.push(() => {
        gsap.ticker.remove(tick);
        io.disconnect();
        window.removeEventListener('resize', onResize);
        clones.forEach((c) => c.remove());
        track.style.transform = '';
      });
    });
    return () => offs.forEach((o) => o());
  });
}
