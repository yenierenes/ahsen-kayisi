/**
 * stage.ts — "Kutu açılınca." (#sofrada)
 *
 * Masaüstü (≥1024px, hareket açık): sabit sahne. Kaydırma ilerlemesi etkin kalemi seçer
 * (doğruluk kaynağı). Etkin kalem değişince yeni fotoğraf, başlığın yanındaki güneş noktasından
 * büyüyen bir daireyle (clip-path: circle) açılır. Geçiş zamana bağlıdır (~1 s, expo) ve her zaman
 * tamamlanır; araya yeni bir değişim girerse yarım kalan açılım ya tabana alınır (≥%40) ya da
 * gizlenir — ekranda hiçbir zaman iki yarım fotoğraf kalmaz. Sahneye girerken ilk fotoğraf aynı
 * daireyle kaydırmaya bağlı (scrub) açılır.
 * Fare (ince işaretçi) ya da klavye odağı bir başlığı etkinleştirir; kullanıcı yeniden kaydırınca
 * kaydırma konumu geri gelir. Tıklama o kalemin kaydırma konumuna götürür. ↑/↓ başlıklar arasında gezer.
 *
 * Dar ekran (hareket açık): her kartın fotoğrafı görünüme girerken aynı güneş dairesiyle (scrub) açılır.
 * reduced-motion / JS yok: CSS kart dizisi; bu betik hiçbir şey kurmaz (mm MOTION).
 */
import { gsap, ScrollTrigger, mm, MOTION, FINE, onMotionReady, scrollToTarget, getLenis } from '@/lib/motion';

const DESK = `${MOTION} and (min-width: 1024px)`;
const NARROW = `${MOTION} and (max-width: 1023.98px)`;
const HIDDEN = 'circle(0px at 0px 0px)';

interface Item {
  li: HTMLElement;
  media: HTMLElement;
  frame: HTMLElement;
  img: HTMLImageElement | null;
  name: HTMLAnchorElement;
  sun: HTMLElement;
  detail: HTMLElement;
}

interface Geo {
  x: number;
  y: number;
  R: number;
}

function collect(root: HTMLElement): Item[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-sofra-item]'))
    .map((li) => ({
      li,
      media: li.querySelector<HTMLElement>('[data-sofra-media]'),
      frame: li.querySelector<HTMLElement>('[data-sofra-frame]'),
      img: li.querySelector<HTMLImageElement>('img'),
      name: li.querySelector<HTMLAnchorElement>('[data-sofra-name]'),
      sun: li.querySelector<HTMLElement>('[data-sofra-sun]'),
      detail: li.querySelector<HTMLElement>('[data-sofra-detail]'),
    }))
    .filter((x): x is Item => !!(x.media && x.frame && x.name && x.sun && x.detail));
}

/** Görsel yüklenip çözülene kadar (en çok 600 ms) bekle */
function imgReady(img: HTMLImageElement | null): Promise<void> {
  if (!img) return Promise.resolve();
  const decode = (): Promise<void> => img.decode().catch(() => undefined);
  const loaded =
    img.complete && img.naturalWidth > 0
      ? decode()
      : new Promise<void>((res) => {
          img.addEventListener('load', () => void decode().then(() => res()), { once: true });
          img.addEventListener('error', () => res(), { once: true });
        });
  return Promise.race([loaded, new Promise<void>((r) => window.setTimeout(r, 600))]);
}

const circle = (r: number, g: Geo): string =>
  `circle(${Math.max(0, r).toFixed(1)}px at ${g.x.toFixed(1)}px ${g.y.toFixed(1)}px)`;

function farthest(x: number, y: number, w: number, h: number): number {
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 4;
}

/* ------------------------------------------------------------------------ */
function desktop(root: HTMLElement, pin: HTMLElement, stage: HTMLElement, items: Item[]): () => void {
  const n = items.length;
  const list = root.querySelector<HTMLElement>('[data-sofra-list]');
  const halo = root.querySelector<HTMLElement>('[data-sofra-halo]');
  const fine = window.matchMedia(FINE);
  const enterEase = gsap.parseEase('power2.inOut');

  let active = 0;
  let base = 0;
  let incoming = -1;
  let token = 0;
  let reveal: gsap.core.Tween | null = null;
  let enter = 1;
  let geo0: Geo | null = null;
  let manualY: number | null = null;
  let lockTo = -1;
  let lockTimer = 0;
  let lastScroll = 0;
  let warm = false;

  /** Sahne ~1,5 ekran yaklaşınca beş fotoğrafın hepsi yüklenir ve çözülür: açılım ağı beklemez */
  function warmUp(): void {
    if (warm) return;
    warm = true;
    setClasses();
    items.forEach((it) => {
      if (!it.img) return;
      it.img.loading = 'eager';
      void imgReady(it.img);
    });
  }

  /** Güneş noktasının sahnedeki son (dönüşümsüz) konumu: li konumsuz ve dönüşümsüz kalır */
  function origin(i: number): Geo {
    const it = items[i]!;
    const s = stage.getBoundingClientRect();
    const sun = it.sun.getBoundingClientRect();
    const h = it.name.getBoundingClientRect();
    const li = it.li.getBoundingClientRect();
    const x = sun.left + sun.width / 2 - s.left;
    const y = li.top + (sun.top + sun.height / 2 - h.top) - s.top;
    return { x, y, R: farthest(x, y, s.width, s.height) };
  }

  function setClasses(): void {
    items.forEach((it, i) => {
      it.li.classList.toggle('is-active', i === active);
      it.li.classList.toggle('is-after', i > active);
      it.li.classList.toggle('is-base', i === base);
      it.li.classList.toggle('is-in', i === incoming);
      it.li.classList.toggle('is-near', warm || Math.abs(i - active) <= 1 || i === base || i === incoming);
      if (i === active) it.name.setAttribute('aria-current', 'true');
      else it.name.removeAttribute('aria-current');
    });
    list?.style.setProperty('--push', `${items[active]!.detail.offsetHeight}px`);
  }

  function paint(): void {
    items.forEach((it, i) => {
      if (i === incoming) return;
      const m = it.media;
      if (i === base) {
        m.style.zIndex = '1';
        if (enter >= 1) m.style.clipPath = 'none';
        else {
          geo0 ??= origin(i);
          m.style.clipPath = circle(geo0.R * enterEase(enter), geo0);
        }
      } else {
        m.style.zIndex = '0';
        m.style.clipPath = HIDDEN;
      }
    });
  }

  function hideHalo(): void {
    if (!halo) return;
    gsap.killTweensOf(halo);
    gsap.set(halo, { opacity: 0 });
  }

  function go(i: number): void {
    if (i === active || i < 0 || i >= n) return;
    active = i;
    if (reveal) {
      const p = reveal.progress();
      reveal.kill();
      reveal = null;
      if (incoming >= 0 && p >= 0.4) base = incoming;
      incoming = -1;
      hideHalo();
    }
    const my = ++token;
    if (i === base) {
      setClasses();
      paint();
      return;
    }
    incoming = i;
    const it = items[i]!;
    it.media.style.zIndex = '2';
    it.media.style.clipPath = HIDDEN;
    setClasses();
    paint();

    void imgReady(it.img).then(() => {
      if (my !== token) return;
      const g = origin(i);
      const st = { r: 0 };
      gsap.fromTo(it.frame, { scale: 1.12 }, { scale: 1, duration: 1.9, ease: 'expo.out', overwrite: true });
      if (halo) {
        gsap.set(halo, { x: g.x - g.R, y: g.y - g.R, width: g.R * 2, height: g.R * 2 });
        gsap.fromTo(
          halo,
          { scale: 0.001, opacity: 1 },
          { scale: 1, opacity: 0, duration: 0.8, ease: 'expo.inOut', overwrite: true },
        );
      }
      reveal = gsap.to(st, {
        r: g.R,
        duration: 0.8,
        ease: 'expo.inOut',
        onUpdate: () => {
          it.media.style.clipPath = circle(st.r, g);
        },
        onComplete: () => {
          reveal = null;
          base = i;
          incoming = -1;
          setClasses();
          paint();
        },
      });
    });
  }

  const indexAt = (p: number): number => Math.min(n - 1, Math.max(0, Math.floor(p * n)));

  /** Lenis'in varış noktası: yumuşak kaydırmanın kuyruğunu beklemeden hedef kalemi seç */
  function targetProgress(self: ScrollTrigger): number {
    const t = getLenis()?.targetScroll;
    if (typeof t !== 'number' || !Number.isFinite(t)) return self.progress;
    const span = self.end - self.start;
    return span > 0 ? Math.min(1, Math.max(0, (t - self.start) / span)) : self.progress;
  }

  function onScroll(self: ScrollTrigger): void {
    lastScroll = performance.now();
    const i = indexAt(targetProgress(self));
    if (lockTo >= 0) {
      if (i === lockTo) lockTo = -1;
      return;
    }
    if (manualY !== null) {
      if (Math.abs(window.scrollY - manualY) < 40) return;
      manualY = null;
    }
    go(i);
  }

  const main = ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => onScroll(self),
    onRefresh: (self) => {
      geo0 = null;
      setClasses();
      onScroll(self);
    },
  });

  // Giriş: ilk fotoğraf güneş noktasından, kaydırmaya bağlı açılır (geri kaydırınca kapanır)
  const preload = ScrollTrigger.create({
    trigger: pin,
    start: 'top bottom+=150%',
    end: 'bottom top-=150%',
    onEnter: warmUp,
    onEnterBack: warmUp,
    onRefresh: (self) => {
      if (self.isActive) warmUp();
    },
  });

  const entry = ScrollTrigger.create({
    trigger: pin,
    start: 'top 80%',
    end: 'top top',
    onUpdate: (self) => {
      enter = self.progress;
      paint();
    },
    onRefresh: (self) => {
      geo0 = null;
      enter = self.progress;
      paint();
    },
  });

  // Etkileşim
  const offs: (() => void)[] = [];
  const on = <K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ): void => {
    el.addEventListener(type, fn as EventListener);
    offs.push(() => el.removeEventListener(type, fn as EventListener));
  };

  items.forEach((it, i) => {
    on(it.name, 'pointermove', (e) => {
      if (!fine.matches || e.pointerType !== 'mouse') return;
      if (!e.movementX && !e.movementY) return; // kaydırırken altından geçen başlık sayılmaz
      if (performance.now() - lastScroll < 250 || i === active) return;
      manualY = window.scrollY;
      go(i);
    });
    on(it.name, 'focus', () => {
      if (i === active) return;
      manualY = window.scrollY;
      go(i);
    });
    on(it.name, 'click', (e) => {
      e.preventDefault();
      const top = pin.getBoundingClientRect().top + window.scrollY;
      const y = top + ((i + 0.5) / n) * Math.max(0, pin.offsetHeight - window.innerHeight);
      manualY = null;
      lockTo = i;
      window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(() => (lockTo = -1), 2200);
      go(i);
      scrollToTarget(y);
    });
    on(it.name, 'keydown', (e) => {
      const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      const next = items[i + d];
      if (!next) return;
      e.preventDefault();
      next.name.focus({ preventScroll: true });
    });
  });

  const onResize = (): void => list?.style.setProperty('--push', `${items[active]!.detail.offsetHeight}px`);
  window.addEventListener('resize', onResize);

  setClasses();
  paint();

  return () => {
    token++;
    reveal?.kill();
    main.kill();
    entry.kill();
    preload.kill();
    hideHalo();
    window.clearTimeout(lockTimer);
    window.removeEventListener('resize', onResize);
    offs.forEach((f) => f());
    list?.style.removeProperty('--push');
    items.forEach((it, i) => {
      it.media.style.removeProperty('clip-path');
      it.media.style.removeProperty('z-index');
      gsap.set(it.frame, { clearProps: 'transform' });
      it.name.removeAttribute('aria-current');
      it.li.classList.toggle('is-active', i === 0);
      it.li.classList.toggle('is-base', i === 0);
      it.li.classList.toggle('is-near', i <= 1);
      it.li.classList.toggle('is-after', i > 0);
      it.li.classList.remove('is-in');
    });
    if (halo) gsap.set(halo, { clearProps: 'all' });
  };
}

/* ------------------------------------------------------------------------ */
function narrow(items: Item[]): () => void {
  const ease = gsap.parseEase('power2.inOut');
  const triggers = items.map((it) => {
    const m = it.media;
    let g: Geo = { x: 0, y: 0, R: 0 };
    let v = 0;
    const measure = (): void => {
      const r = m.getBoundingClientRect();
      const s = it.sun.getBoundingClientRect();
      const x = s.left + s.width / 2 - r.left;
      const y = s.top + s.height / 2 - r.top;
      g = { x, y, R: farthest(x, y, r.width, r.height) };
    };
    const apply = (): void => {
      m.style.clipPath = v >= 1 ? 'none' : circle(g.R * ease(v), g);
    };
    measure();
    apply();
    const st = ScrollTrigger.create({
      trigger: m,
      start: 'top 92%',
      end: 'top 30%',
      onUpdate: (self) => {
        v = self.progress;
        apply();
      },
      onRefresh: (self) => {
        measure();
        v = self.progress;
        apply();
      },
    });
    const drift = gsap.fromTo(
      it.frame,
      { scale: 1.14 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
    return { st, drift, m, f: it.frame };
  });
  return () =>
    triggers.forEach(({ st, drift, m, f }) => {
      st.kill();
      drift.scrollTrigger?.kill();
      drift.kill();
      m.style.removeProperty('clip-path');
      gsap.set(f, { clearProps: 'transform' });
    });
}

/* ------------------------------------------------------------------------ */
function init(root: HTMLElement): void {
  const pin = root.querySelector<HTMLElement>('[data-sofra-pin]');
  const stage = root.querySelector<HTMLElement>('[data-pin-stage]');
  const items = collect(root);
  if (!pin || !stage || !items.length) return;

  onMotionReady(() => {
    mm.add(DESK, () => desktop(root, pin, stage, items));
    mm.add(NARROW, () => narrow(items));
  });
}

document.querySelectorAll<HTMLElement>('[data-sofra]').forEach(init);
