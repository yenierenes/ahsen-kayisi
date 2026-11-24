/**
 * Hero sahnesi — "Güneşin meyvesi."
 * Katmanlar (alttan üste): canvas hero (tam kare) → dev başlık → canvas hero-fg
 * (yalnız meyve, alfa) → güneş dolgusu → yazılar/arayüz.
 *
 * Tek scrub zaman çizelgesi (p = bölümün sabit kaydırma ilerlemesi):
 *   0–0.12   giriş durumu (preloader sonrası zamanla oynayan giriş ayrı)
 *   0.12–0.78 dizi kare 1 → N; başlık kelimeleri ayrılır ve söner; 3 alt yazı; GÜN 0 → 7
 *   0.78–1   kuru kayısı güneşe dönüşür: ölçeklenir, ekranı turuncuya boğar → Sergi
 */
import { gsap, ScrollTrigger, introGate, mm, MOTION, REDUCE, isTouch, isMobile, onMotionReady, getSequenceGroup } from '../motion';
import type { SequenceGroup } from '../motion/sequence';

interface FruitBox {
  /** kare boyutuna oranla meyve yarıçapları (0–1) */
  rx: number;
  ry: number;
}

/** Karenin küçük bir kopyasında parlak (turuncu) pikselleri tarayarak meyvenin kutusunu bul */
function measureFruit(img: HTMLImageElement): FruitBox | null {
  try {
    const W = 160;
    const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true });
    if (!x) return null;
    x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    let minX = W, minY = H, maxX = 0, maxY = 0, hits = 0;
    for (let y = 0; y < H; y++) {
      for (let i = 0; i < W; i++) {
        const k = (y * W + i) * 4;
        const r = d[k] ?? 0;
        const a = d[k + 3] ?? 255;
        if (r > 150 && a > 128) {
          hits++;
          if (i < minX) minX = i;
          if (i > maxX) maxX = i;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (hits < 20) return null;
    return { rx: (maxX - minX) / 2 / W, ry: (maxY - minY) / 2 / H };
  } catch {
    return null;
  }
}

function initHero(): void {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const q = <T extends Element = HTMLElement>(s: string): T | null => hero.querySelector<T>(s);
  const qa = (s: string): HTMLElement[] => Array.from(hero.querySelectorAll<HTMLElement>(s));

  const stage = q('[data-hero-stage]');
  const bgWrap = q('[data-hero-bg]');
  const fgWrap = q('[data-hero-fg]');
  const canvases = qa('[data-hero-canvas]');
  const fgCanvas = q('[data-hero-fg] canvas');
  const lines = qa('[data-hero-line]');
  const lineInners = qa('[data-hero-line-inner]');
  const ui = q('[data-hero-ui]');
  const introEls = qa('[data-hero-intro]');
  const hint = q('[data-hero-hint]');
  const captions = qa('[data-hero-caption]');
  const day = q('[data-hero-day]');
  const dayBar = q('[data-hero-daybar]');
  const glow = q('[data-hero-glow]');
  const sun = q('[data-hero-sun]');
  if (!stage || !bgWrap || !fgWrap || !fgCanvas || !ui || !sun || !glow) return;

  const group = getSequenceGroup('hero');
  const dayTotal = Number(day?.dataset.total ?? 7);

  // Arka plan rengi: dizinin boşluk rengiyle birebir
  hero.addEventListener('sequence:bg', (e) => {
    stage.style.setProperty('--void', (e as CustomEvent<string>).detail);
  });

  // Meyve ölçüsü → başlığın meyvenin arkasına "girme" miktarı ve güneş ölçeği
  let fresh: FruitBox = { rx: 0.14, ry: 0.27 };
  let dried: FruitBox = { rx: 0.15, ry: 0.26 };
  const layout = (): void => {
    const g = group?.primary?.geometry();
    if (!g || !g.w) return;
    stage.style.setProperty('--fruit-x', `${(g.x + g.w / 2).toFixed(1)}px`);
    stage.style.setProperty('--fruit-y', `${(g.y + g.h / 2).toFixed(1)}px`);
    stage.style.setProperty('--fruit-rx', `${(fresh.rx * g.w).toFixed(1)}px`);
    stage.style.setProperty('--fruit-ry', `${(fresh.ry * g.h).toFixed(1)}px`);
    stage.style.setProperty('--dried-r', `${(Math.min(dried.rx * g.w, dried.ry * g.h)).toFixed(1)}px`);
  };
  const sunScale = (): number => {
    const g = group?.primary?.geometry();
    if (!g) return 6;
    const r = Math.max(40, Math.min(dried.rx * g.w, dried.ry * g.h));
    const half = Math.hypot(stage.clientWidth, stage.clientHeight) / 2;
    return (half / r) * 1.25;
  };

  if (group) {
    void group.ready.then(() => {
      const p = group.primary;
      const f0 = p?.frames[0];
      if (f0) fresh = measureFruit(f0) ?? fresh;
      layout();
      // Başlık konumu meyve ölçüsüne bağlı: kelime kayma sınırları yeni düzenle yeniden hesaplansın
      ScrollTrigger.refresh();
      // Son kare yüklenince kuru meyveyi ölç
      const waitLast = (): void => {
        const last = p?.frames[p.count - 1];
        if (last) {
          dried = measureFruit(last) ?? dried;
          layout();
        } else window.setTimeout(waitLast, 250);
      };
      waitLast();
      group.setProgress(0);
    });
    new ResizeObserver(layout).observe(stage);
  }

  const setDay = (f: number): void => {
    const d = String(Math.round(f * dayTotal));
    if (day && day.textContent !== d) day.textContent = d;
    if (dayBar) dayBar.style.transform = `scaleX(${f.toFixed(4)})`;
  };

  mm.add({ motion: MOTION, reduce: REDUCE }, (ctx) => {
    if (ctx.conditions?.reduce) {
      group?.setProgress(0);
      return;
    }

    // --- Giriş (≈1,2 sn; preloader perdesi kalkınca, tek koreografi) ----------
    // Meyve (iki tuval birlikte, meyve merkezli) .92/0 → 1/1; başlık satırları
    // maskelerinden yükselir; en son göz başlığı + alt HUD.
    gsap.set(lineInners, { yPercent: 118 });
    gsap.set(introEls, { autoAlpha: 0, y: 12 });
    gsap.set(canvases, { scale: 0.92, autoAlpha: 0 });
    const intro = gsap.timeline({ paused: true });
    intro
      .to(canvases, { scale: 1, duration: 1.2, ease: 'expo.out' }, 0)
      .to(canvases, { autoAlpha: 1, duration: 0.55, ease: 'power2.out' }, 0)
      .to(lineInners, { yPercent: 0, duration: 0.95, ease: 'expo.out', stagger: 0.1 }, 0.12)
      .to(introEls, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 }, 0.62);
    void introGate.promise.then(() => intro.play());

    // --- Scrub sahnesi ------------------------------------------------------
    const proxy = { f: 0 };
    // Kelimeler meyveden uzaklaşır ama ekran kenarına ≥3vw mesafede kalır
    // (1280–1920 genişlikte "Güneşin"in G'si kesiliyordu). Ölçü dönüşümsüz kutudan.
    const drift = (el: HTMLElement | undefined, side: -1 | 1): number => {
      if (!el) return 0;
      const vw = window.innerWidth;
      const want = Math.min(vw * 0.05, 110);
      const r = el.getBoundingClientRect();
      const x = Number(gsap.getProperty(el, 'x')) || 0;
      const room = side < 0 ? r.left - x - vw * 0.03 : vw - vw * 0.03 - (r.right - x);
      return side * Math.max(0, Math.min(want, room));
    };
    gsap.set(captions, { autoAlpha: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: isTouch() ? 0.35 : true,
        invalidateOnRefresh: true,
      },
    });
    tl.to(hint, { autoAlpha: 0, duration: 0.04 }, 0.01)
      .to(
        proxy,
        {
          f: 1,
          duration: 0.66,
          onUpdate: () => {
            group?.setProgress(proxy.f);
            setDay(proxy.f);
          },
        },
        0.12,
      )
      .to(lines[0] ?? {}, { x: () => drift(lines[0], -1), autoAlpha: 0.32, duration: 0.5, ease: 'power1.inOut' }, 0.12)
      .to(lines[1] ?? {}, { x: () => drift(lines[1], 1), autoAlpha: 0.32, duration: 0.5, ease: 'power1.inOut' }, 0.12);

    // Alt yazılar: 01 dönüşümden önce, 02 sırasında, 03 sonra
    const slots: [number, number][] = [
      [0.15, 0.37],
      [0.42, 0.57],
      [0.62, 0.76],
    ];
    captions.forEach((cap, i) => {
      const [a, b] = slots[i] ?? [0, 0];
      const parts = cap.querySelectorAll('[data-cap-part]');
      const rule = cap.querySelector('[data-cap-rule]');
      tl.set(cap, { autoAlpha: 1 }, a)
        .fromTo(parts, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.05, stagger: 0.012, ease: 'power2.out' }, a)
        .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.07, ease: 'power2.inOut' }, a + 0.01)
        .to(parts, { autoAlpha: 0, y: -16, duration: 0.035, stagger: 0.006, ease: 'power1.in' }, b - 0.035)
        .to(rule, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.035 }, b - 0.035)
        .set(cap, { autoAlpha: 0 }, b);
    });

    // Güneş: kuru kayısı ölçeklenir, ekranı turuncuya boğar
    tl.to(lines, { autoAlpha: 0, duration: 0.05 }, 0.78)
      .to(ui, { autoAlpha: 0, duration: 0.04 }, 0.78)
      .fromTo(glow, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1.6, duration: 0.18, ease: 'power1.in' }, 0.8)
      .to([bgWrap, fgWrap], { scale: () => sunScale(), duration: 0.2, ease: 'power3.in' }, 0.8)
      .fromTo(fgCanvas, { filter: 'blur(0px)' }, { filter: 'blur(6px)', duration: 0.1, ease: 'power1.in' }, 0.88)
      .fromTo(sun, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.09, ease: 'power1.inOut' }, 0.9);

    return () => {
      intro.kill();
      group?.setProgress(0);
    };
  });

  // Mobilde başlık dizilimi CSS'te; burada yalnız ölçüleri güncel tut
  if (isMobile()) layout();
  if (group) bindGroup(group);
}

function bindGroup(group: SequenceGroup): void {
  // reduced-motion'da ilk kare çizilsin diye hazır olunca bir kez daha çiz
  void group.ready.then(() => group.render());
}

onMotionReady(initHero);
