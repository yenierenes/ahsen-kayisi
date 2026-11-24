/**
 * video.ts — tembel kaynak + yalnız görünürken oynatma.
 * <video id="v1" data-video data-src="/media/video/x.mp4" data-src-mobile="/media/video/x-m.mp4"
 *        poster="/media/video/x.jpg" muted playsinline loop preload="none"></video>
 * <button data-video-toggle="#v1" data-label-play="Videoyu oynat" data-label-pause="Videoyu durdur">…</button>
 * Kaynak ekrana bir ekran yaklaşınca atanır (768px altında mobil kaynak).
 * reduced-motion: otomatik oynatma yok, poster görünür; düğme ile oynatılabilir.
 */
import { isMobile, prefersReduced, qsa } from './core';

export function initVideo(root: ParentNode = document): void {
  const videos = qsa<HTMLVideoElement>('video[data-video]', root);
  if (!videos.length) return;

  const load = (v: HTMLVideoElement): void => {
    if (v.dataset.loaded) return;
    v.dataset.loaded = '1';
    const src = (isMobile() && v.dataset.srcMobile) || v.dataset.src;
    if (!src) return;
    v.src = src;
    v.load();
  };
  const play = (v: HTMLVideoElement): void => {
    if (v.dataset.userPaused || prefersReduced()) return;
    load(v);
    void v.play().catch(() => v.classList.add('is-blocked'));
  };

  const near = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && load(e.target as HTMLVideoElement)),
    { rootMargin: '100% 0px' },
  );
  const seen = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        v.dataset.visible = e.isIntersecting ? '1' : '';
        if (e.isIntersecting) play(v);
        else v.pause();
      }),
    { threshold: 0.15 },
  );
  videos.forEach((v) => {
    v.muted = true;
    v.addEventListener('error', () => v.classList.add('is-error'), true);
    v.addEventListener('playing', () => v.classList.add('is-playing'));
    near.observe(v);
    seen.observe(v);
  });

  qsa<HTMLButtonElement>('[data-video-toggle]', root).forEach((btn) => {
    const v = document.querySelector<HTMLVideoElement>(btn.dataset.videoToggle ?? '');
    if (!v) return;
    const sync = (): void => {
      const playing = !v.paused;
      btn.setAttribute('aria-pressed', String(!playing));
      const label = playing ? btn.dataset.labelPause : btn.dataset.labelPlay;
      if (label) {
        const t = btn.querySelector('[data-video-label]') ?? btn;
        t.textContent = label;
      }
    };
    btn.addEventListener('click', () => {
      if (v.paused) {
        delete v.dataset.userPaused;
        load(v);
        void v.play().catch(() => undefined);
      } else {
        v.dataset.userPaused = '1';
        v.pause();
      }
    });
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    sync();
  });
}
