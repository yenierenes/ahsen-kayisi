/**
 * Rakamlar sahnesi.
 *
 * "pin" koşulu (≥1100px, ≥620px yüksek, hareket açık): tek sabit sahne. Üstte başlık,
 * ortada dev rakam, altta 01—06 ilerleme sırası + dipnot. Zaman çizelgesi, sabit
 * bölümün üst kenarı ekranın altına değdiği andan ("top bottom") sahnenin bitişine
 * ("bottom bottom") kadar kaydırmaya bağlıdır. Birim = UNIT_LVH ekran yüksekliği:
 *   0 → APPROACH        sahne aşağıdan gelir; 01 yolda belirir ve sayar
 *   her rakam           karakterler maskeden kademeli yükselir, sayaç pencerenin
 *                       ilk ~%35'inde biter, sonra rakam sabit durur; giden rakam
 *                       maskeden yukarı çıkar
 *   END                 06 sahnedeyken biter (sabitleme 06 görünürken çözülür)
 * Rakamların içi sergi alanı fotoğrafıyla doludur (background-clip: text); her
 * karakter görüntünün kendi konumuna düşen parçasını gösterir (--ox/--oy), görüntü
 * kaydırmayla sahnede akar (--bgx/--bgy).
 * Sayaçlar hedefin %70'inden hedefe sayar (son metinle aynı biçim) ve her zaman tam
 * son metinde durur; giden rakam tamamen kaybolmadan gelen başlamaz (kısa boş an).
 *
 * Diğer koşullar (dar/alçak ekran): durağan liste; satırlar görünürken sayar.
 * reduced-motion: hiçbir şey kurulmaz, HTML'deki son değerler olduğu gibi kalır.
 * CSS ve burası aynı medya sorgusunu paylaşır (Rakamlar.astro, <style>).
 */
import { gsap, ScrollTrigger, mm, formatTR, onMotionReady } from '../motion';

const MOTION_OK = '(prefers-reduced-motion: no-preference)';
const QUERIES = {
  pin: `(min-width: 1100px) and (min-height: 620px) and ${MOTION_OK}`,
  listNarrow: `(max-width: 1099.98px) and ${MOTION_OK}`,
  listShort: `(min-width: 1100px) and (max-height: 619.98px) and ${MOTION_OK}`,
};

/** Bir zaman birimi kaç lvh (Rakamlar.astro: --pin-len = (END − APPROACH) × UNIT_LVH) */
const UNIT_LVH = 80;
/** Yaklaşma: 100lvh / UNIT_LVH */
const APPROACH = 100 / UNIT_LVH;
/** 01'in sabit sahnede kalma süresi (birim) */
const FIRST_HOLD = 0.8;
/** Son rakam yerleştikten sonra sahnede kalma (birim) */
const TAIL = 0.42;
/** Sayaç hedefin bu oranından başlar */
const COUNT_FROM = 0.7;
/** Çıkış animasyonunun toplam süresi ve sonraki girişten önceki boş an (birim) */
const EXIT_LEN = 0.2;
const BEAT = 0.055;

interface Count {
  to: number;
  dec: number;
  pre: string;
  suf: string;
}

function readCount(el: HTMLElement): Count | null {
  if (el.dataset.to === undefined || el.dataset.to === '') return null;
  const to = Number.parseFloat(el.dataset.to);
  if (Number.isNaN(to)) return null;
  return { to, dec: Number.parseInt(el.dataset.dec ?? '0', 10), pre: el.dataset.pre ?? '', suf: el.dataset.suf ?? '' };
}

const fmt = (c: Count, v: number): string => `${c.pre}${formatTR(v, c.dec)}${c.suf}`;

interface BigFig {
  root: HTMLElement;
  v: HTMLElement;
  final: string;
  outers: HTMLElement[];
  chars: HTMLElement[];
  /** Sayaç rakam yuvaları (son metindeki rakam karakterleri, soldan sağa) */
  slots: HTMLElement[];
  count: { to: number; dec: number } | null;
  unit: HTMLElement | null;
  text: HTMLElement[];
}

/** Büyük rakamı karakter maskelerine böler */
function splitChars(v: HTMLElement): { outers: HTMLElement[]; chars: HTMLElement[]; slots: HTMLElement[] } {
  const final = (v.textContent ?? '').trim();
  v.textContent = '';
  const outers: HTMLElement[] = [];
  const chars: HTMLElement[] = [];
  const slots: HTMLElement[] = [];
  for (const ch of final) {
    const o = document.createElement('span');
    o.className = 'fig-ch';
    const i = document.createElement('span');
    i.className = 'fig-ch__i';
    i.textContent = ch === ' ' ? ' ' : ch;
    o.appendChild(i);
    v.appendChild(o);
    outers.push(o);
    chars.push(i);
    if (/\d/.test(ch)) slots.push(i);
  }
  return { outers, chars, slots };
}

/** Sayılabilir mi: son metin = önek + biçimli hedef + sonek (yıl ve "2'de 1" gibi metinler sayılmaz) */
function isCountable(final: string, c: Count): boolean {
  if (c.dec === 0 && c.to >= 1900 && c.to <= 2100) return false;
  const pre = /^\D*/.exec(final)?.[0] ?? '';
  const suf = /\D*$/.exec(final)?.[0] ?? '';
  return final === `${pre}${formatTR(c.to, c.dec)}${suf}`;
}

function initRakamlar(): void {
  const sec = document.querySelector<HTMLElement>('[data-rakamlar]');
  if (!sec) return;
  const pin = sec.querySelector<HTMLElement>('[data-rakamlar-pin]');
  const stage = sec.querySelector<HTMLElement>('[data-rakamlar-stage]');
  const bigs = Array.from(sec.querySelectorAll<HTMLElement>('[data-fig-big]'));
  const rows = Array.from(sec.querySelectorAll<HTMLElement>('[data-fig]'));
  const big = sec.querySelector<HTMLElement>('[data-rakamlar-big]');
  if (!pin || !stage || !bigs.length || bigs.length !== rows.length) return;

  mm.add(QUERIES, (ctx) => {
    const cond = ctx.conditions as Record<string, boolean> | undefined;

    /* ------------------------------------------------------------------ *
     * Sabit sahne
     * ------------------------------------------------------------------ */
    if (cond?.pin) {
      const figs: BigFig[] = bigs.map((root) => {
        const v = root.querySelector<HTMLElement>('[data-fig-bigv]')!;
        const final = (v.textContent ?? '').trim();
        const c = readCount(v);
        const { outers, chars, slots } = splitChars(v);
        return {
          root,
          v,
          final,
          outers,
          chars,
          slots,
          count: c && isCountable(final, c) ? { to: c.to, dec: c.dec } : null,
          unit: root.querySelector<HTMLElement>('[data-fig-unit]'),
          text: Array.from(root.querySelectorAll<HTMLElement>('[data-fig-bigtext]')),
        };
      });

      /** Sayaç: son metinle birebir aynı biçim (önek/sonek/ayraç); kısa metin sağa yaslanır, baştaki fazla karakterler gizlenir */
      const writeCount = (f: BigFig, value: number): void => {
        if (!f.count) return;
        const pre = /^\D*/.exec(f.final)?.[0] ?? '';
        const suf = /\D*$/.exec(f.final)?.[0] ?? '';
        const q = 10 ** f.count.dec;
        const text =
          value >= f.count.to ? f.final : `${pre}${formatTR(Math.round(value * q) / q, f.count.dec)}${suf}`;
        const off = f.chars.length - text.length;
        f.chars.forEach((ch, j) => {
          const k = j - off;
          if (k < 0) {
            ch.style.visibility = 'hidden';
          } else {
            ch.style.visibility = '';
            ch.textContent = text[k] ?? '';
          }
        });
      };

      /**
       * 1) Sığdırma: rakam satırı sahne genişliğini aşarsa yazı boyu küçülür (--fit).
       * 2) Her karakterin satır içindeki konumu (--ox/--oy) → doku karakterler
       *    arasında kesintisiz görünür.
       */
      const place = (): void => {
        const avail = big?.clientWidth ?? 0;
        figs.forEach((f) => {
          const line = f.v.parentElement as HTMLElement;
          f.root.style.setProperty('--fit', '1');
          const w = line.scrollWidth;
          if (avail > 0 && w > avail) f.root.style.setProperty('--fit', (avail / w).toFixed(4));
          f.outers.forEach((o) => {
            o.style.setProperty('--ox', `${o.offsetLeft}px`);
            o.style.setProperty('--oy', `${o.offsetTop}px`);
          });
        });
      };
      place();
      ScrollTrigger.addEventListener('refresh', place);
      void document.fonts?.ready.then(place);

      const total = figs.length;
      // Giriş/çıkış zamanları
      const enter: number[] = [];
      const exit: number[] = [];
      figs.forEach((_, i) => {
        enter.push(i === 0 ? APPROACH * 0.5 : exit[i - 1]! + EXIT_LEN + BEAT);
        exit.push(i === 0 ? APPROACH + FIRST_HOLD : enter[i]! + 0.745);
      });
      const END = enter[total - 1]! + 0.4 + TAIL;
      exit[total - 1] = END;
      // Sabitleme uzunluğu çizelgeden türetilir (CSS'teki --pin-len yalnız ilk yerleşim için)
      pin.style.setProperty('--pin-len', `${((END - APPROACH) * UNIT_LVH).toFixed(1)}lvh`);

      let active = -1;
      const setActive = (i: number): void => {
        if (i === active) return;
        active = i;
        rows.forEach((r, j) => r.classList.toggle('is-active', j === i));
      };

      const tl: gsap.core.Timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const t = tl.time();
          let i = 0;
          while (i < total - 1 && t >= enter[i + 1]!) i++;
          setActive(i);
        },
      });

      // Doku: tüm sahne boyunca yavaşça akar
      tl.fromTo(stage, { '--bgx': '-4vw', '--bgy': '-26vw' }, { '--bgx': '-44vw', '--bgy': '-40vw', duration: END }, 0);

      figs.forEach((f, i) => {
        const tIn = enter[i]!;
        const bar = rows[i]!.querySelector<HTMLElement>('[data-fig-bar]');

        tl.fromTo(f.root, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, tIn);
        tl.fromTo(
          f.chars,
          { yPercent: 135 },
          { yPercent: 0, duration: 0.26, stagger: 0.03, ease: 'power3.out' },
          tIn,
        );
        if (f.unit) {
          tl.fromTo(f.unit, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'power2.out' }, tIn + 0.12);
        }
        tl.fromTo(
          f.text,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.22, stagger: 0.05, ease: 'power2.out' },
          tIn + 0.1,
        );

        // Sayaç: pencerenin başında biter, tam son metne oturur
        if (f.count) {
          const c = f.count;
          const o = { v: c.to * COUNT_FROM };
          writeCount(f, c.to * COUNT_FROM);
          tl.fromTo(
            o,
            { v: c.to * COUNT_FROM },
            {
              v: c.to,
              duration: 0.3,
              ease: 'power2.out',
              onUpdate: () => writeCount(f, o.v),
              onComplete: () => writeCount(f, c.to),
            },
            tIn + 0.02,
          );
        }

        if (bar) {
          tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: Math.max(0.01, exit[i]! - tIn) }, tIn);
        }

        // Çıkış (son rakam sahnede kalır)
        if (i < total - 1) {
          const tOut = exit[i]!;
          const n = f.chars.length;
          const cd = 0.12;
          const st = n > 1 ? (EXIT_LEN - cd) / (n - 1) : 0;
          tl.to(f.chars, { yPercent: -135, duration: cd, stagger: st, ease: 'power2.in' }, tOut);
          tl.to([...(f.unit ? [f.unit] : []), ...f.text], { autoAlpha: 0, y: -24, duration: 0.12, ease: 'power2.in' }, tOut);
          tl.to(f.root, { autoAlpha: 0, duration: 0.001 }, tOut + EXIT_LEN);
        }
      });
      tl.to({}, { duration: 0.001 }, END);
      setActive(0);

      return () => {
        ScrollTrigger.removeEventListener('refresh', place);
        pin.style.removeProperty('--pin-len');
        figs.forEach((f) => {
          f.v.textContent = f.final;
          f.root.style.removeProperty('--fit');
        });
        rows.forEach((r) => r.classList.remove('is-active'));
      };
    }

    /* ------------------------------------------------------------------ *
     * Durağan liste: satır görününce sayar
     * ------------------------------------------------------------------ */
    const items = rows
      .map((row) => {
        const v = row.querySelector<HTMLElement>('[data-fig-v]');
        const count = v ? readCount(v) : null;
        return v && count ? { v, count, final: v.textContent ?? '' } : null;
      })
      .filter((x): x is { v: HTMLElement; count: Count; final: string } => x !== null);

    items.forEach(({ v, count, final }) => {
      const o = { v: 0 };
      v.textContent = fmt(count, 0);
      gsap.to(o, {
        v: count.to,
        duration: 1.4,
        ease: 'expo.out',
        onUpdate: () => void (v.textContent = fmt(count, o.v)),
        onComplete: () => void (v.textContent = final),
        scrollTrigger: { trigger: v, start: 'top 88%', once: true },
      });
    });

    return () => {
      items.forEach(({ v, final }) => void (v.textContent = final));
    };
  });
}

onMotionReady(initRakamlar);
