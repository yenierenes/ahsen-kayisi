/**
 * daylight.ts — sayfa rengi gün gibi akar.
 *
 * Her <section data-sky="cream"> tokens.css'teki --sky-bg/fg/accent/muted/focus/grain
 * değerlerini taşır. Bir bölümün üst kenarı ekranın %65 → %25 bandından geçerken
 * <html> üzerindeki --bg/--fg/--accent/--muted/--focus/--grain bir öncekinden
 * bu bölüme karışır.
 *
 * Bölüm içi ikinci durak (sabit bölümler için):
 *   <section data-sky="golden" data-sky-to="cream" data-sky-to-range="0.62 0.9">
 *   → bölümün sabit kaydırma aralığının %62–%90'ında golden → cream.
 *
 * Kontrast kuralı (rapor F7): zemin akarken metin rengi yalnızca geçişin
 * ortasında (%35–%65) döner; gövde metni bu banda oturtulmamalı — bölüm
 * üst boşluğu (--section-y) bu bandı metinsiz tutar.
 */
import { ScrollTrigger, mm, MOTION, REDUCE, qsa } from './core';

interface Sky {
  name: string;
  bg: RGB;
  fg: RGB;
  accent: RGB;
  muted: RGB;
  focus: RGB;
  grain: number;
}
type RGB = [number, number, number];

interface Segment {
  from: Sky;
  to: Sky;
  st: ScrollTrigger;
}

const html = document.documentElement;

function hex(v: string): RGB {
  const s = v.trim().replace('#', '');
  const f = s.length === 3 ? s.replace(/./g, (c) => c + c) : s;
  const n = Number.parseInt(f.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
}

/** data-sky adını, gerçek bölüm dışında bir test elemanıyla çöz */
function readSky(name: string, host: HTMLElement): Sky {
  const probe = document.createElement('div');
  probe.dataset.sky = name;
  probe.style.display = 'none';
  host.appendChild(probe);
  const cs = getComputedStyle(probe);
  const sky: Sky = {
    name,
    bg: hex(cs.getPropertyValue('--sky-bg')),
    fg: hex(cs.getPropertyValue('--sky-fg')),
    accent: hex(cs.getPropertyValue('--sky-accent')),
    muted: hex(cs.getPropertyValue('--sky-muted')),
    focus: hex(cs.getPropertyValue('--sky-focus')),
    grain: Number.parseFloat(cs.getPropertyValue('--sky-grain')) || 0.1,
  };
  probe.remove();
  return sky;
}

const mix = (a: RGB, b: RGB, t: number): string =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);

let lastKey = '';
function apply(from: Sky, to: Sky, p: number): void {
  const key = `${from.name}>${to.name}:${p.toFixed(3)}`;
  if (key === lastKey) return;
  lastKey = key;
  const t = smooth(clamp01(p));
  // Metin renkleri yalnız geçişin ortasında döner (ölü bantta metin olmaz)
  const tt = smooth(clamp01((p - 0.35) / 0.3));
  const s = html.style;
  s.setProperty('--bg', mix(from.bg, to.bg, t));
  s.setProperty('--fg', mix(from.fg, to.fg, tt));
  s.setProperty('--accent', mix(from.accent, to.accent, tt));
  s.setProperty('--muted', mix(from.muted, to.muted, tt));
  s.setProperty('--focus', mix(from.focus, to.focus, tt));
  s.setProperty('--grain', (from.grain + (to.grain - from.grain) * t).toFixed(3));
  const current = p < 0.5 ? from.name : to.name;
  if (html.dataset.sky !== current) html.dataset.sky = current;
}

export function initDaylight(root: ParentNode = document): void {
  const sections = qsa('[data-sky]', root).filter((el) => el.tagName !== 'HTML');
  const first = sections[0];
  if (!first) return;
  const host = document.body;
  const cache = new Map<string, Sky>();
  const sky = (n: string): Sky => {
    let s = cache.get(n);
    if (!s) {
      s = readSky(n, host);
      cache.set(n, s);
    }
    return s;
  };
  const firstSky = sky(first.dataset.sky ?? 'void');

  mm.add({ motion: MOTION, reduce: REDUCE }, () => {
    const segments: Segment[] = [];
    const update = (): void => {
      let from = firstSky;
      let to = firstSky;
      let p = 1;
      for (const seg of segments) {
        if (seg.st.progress > 0) {
          from = seg.from;
          to = seg.to;
          p = seg.st.progress;
        }
      }
      apply(from, to, p);
    };

    let prev = firstSky;
    sections.forEach((el, i) => {
      const own = sky(el.dataset.sky ?? prev.name);
      if (i > 0) {
        segments.push({
          from: prev,
          to: own,
          st: ScrollTrigger.create({ trigger: el, start: 'top 65%', end: 'top 25%', onUpdate: update, onRefresh: update }),
        });
      }
      prev = own;
      const toName = el.dataset.skyTo;
      if (toName) {
        const to = sky(toName);
        const [a = 0.6, b = 0.9] = (el.dataset.skyToRange ?? '').split(/\s+/).map(Number.parseFloat).filter(Number.isFinite);
        // Sabit bölümde: sabit kaydırma aralığı. Kısa bölümde: bölüm boyunun %60'ı.
        const span = (): number => Math.max(el.offsetHeight - window.innerHeight, el.offsetHeight * 0.6, 1);
        const range = (f: number) => () => `top+=${Math.round(f * span())} top`;
        segments.push({
          from: own,
          to,
          st: ScrollTrigger.create({ trigger: el, start: range(a), end: range(b), onUpdate: update, onRefresh: update }),
        });
        prev = to;
      }
    });
    update();
    return () => segments.forEach((s) => s.st.kill());
  });
}
