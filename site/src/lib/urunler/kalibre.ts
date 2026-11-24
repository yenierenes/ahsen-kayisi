/**
 * kalibre.ts — "Bir kiloda kaç tane?" etkileşimi.
 * <div data-kalibre data-grades='[…]' data-value-text="{name}…"> + <input type="range" data-k-range>
 * Seçilen boyda: merkezdeki tane göreli boyuna ölçeklenir (çap ∝ kütlenin küpkökü),
 * 100 g kümesindeki tane sayısı değişir, mono rakamlar güncellenir.
 * Durum CSS değişkenleriyle taşınır (--s ölçek, --p ilerleme); hareket CSS geçişlerinde.
 */
import type { Grade } from '@/content/tr/urunler';

const reduce = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scaleOf = (g: number, gMax: number): number => Math.cbrt(g / gMax);
export const countPer100 = (g: number): number => Math.round(100 / g);

function init(root: HTMLElement): void {
  let grades: Grade[];
  try {
    grades = JSON.parse(root.dataset.grades ?? '[]');
  } catch {
    return;
  }
  const range = root.querySelector<HTMLInputElement>('[data-k-range]');
  const first = grades[0];
  if (!range || !first) return;
  const gMax = first.g;
  const tpl = root.dataset.valueText ?? '{name}';
  const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-k-dot]'));
  const ticks = Array.from(root.querySelectorAll<HTMLElement>('[data-k-tick]'));
  const fields = {
    name: Array.from(root.querySelectorAll<HTMLElement>('[data-k-name]')),
    perKg: Array.from(root.querySelectorAll<HTMLElement>('[data-k-perkg]')),
    grams: Array.from(root.querySelectorAll<HTMLElement>('[data-k-grams]')),
    per100: Array.from(root.querySelectorAll<HTMLElement>('[data-k-per100]')),
  };
  let current = Number(range.value);
  let count = countPer100(grades[current]?.g ?? gMax);

  let lastSwap = 0;
  const swap = (el: HTMLElement, text: string, dir: number, quick: boolean): void => {
    if (el.textContent === text) return;
    el.textContent = text;
    if (reduce() || typeof el.animate !== 'function') return;
    // hızlı ardışık değişimde (sürükleme, tanıtım) rakam görünür kalsın: kısa ve yarı saydamdan
    el.animate(
      [
        { transform: `translateY(${dir * (quick ? 0.2 : 0.45)}em)`, opacity: quick ? 0.55 : 0.1 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      { duration: quick ? 220 : 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  };

  const set = (i: number): void => {
    const g = grades[i];
    if (!g) return;
    const dir = i >= current ? 1 : -1;
    current = i;
    root.style.setProperty('--s', scaleOf(g.g, gMax).toFixed(4));
    root.style.setProperty('--p', (i / (grades.length - 1)).toFixed(4));
    root.style.setProperty('--k', String(i));

    const n = countPer100(g.g);
    const from = count;
    dots.forEach((d, j) => {
      const on = j < n;
      // değişen taneler sırayla: eklenirken öne doğru, çıkarken geriye doğru
      const order = n > from ? j - from : from - 1 - j;
      d.style.setProperty('--d', `${Math.max(0, order) * 26}ms`);
      d.classList.toggle('is-on', on);
    });
    count = n;

    const now = performance.now();
    const quick = now - lastSwap < 300;
    lastSwap = now;
    fields.name.forEach((el) => swap(el, g.name, dir, quick));
    fields.perKg.forEach((el) => swap(el, g.perKg, dir, quick));
    fields.grams.forEach((el) => swap(el, g.grams, dir, quick));
    fields.per100.forEach((el) => swap(el, g.per100, dir, quick));
    ticks.forEach((t, k) => t.classList.toggle('is-active', k === i));
    range.setAttribute(
      'aria-valuetext',
      tpl.replace('{name}', g.name).replace('{perKg}', g.perKg).replace('{grams}', g.grams).replace('{per100}', g.per100),
    );
  };

  /* --- ilk görünüşte tek seferlik tanıtım: Jumbo → No.6 → No.2 (~1,6 sn) ---
     Amaç: bunun etkileşimli olduğunu göstermek. reduced-motion'da yok; herhangi bir
     kullanıcı girdisinde anında durur ve o anki değerde kalır. */
  let timers: number[] = [];
  let touched = false;
  const stopDemo = (): void => {
    touched = true;
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
  };
  const demo = (): void => {
    if (touched || reduce()) return;
    const steps: [number, number][] = [
      [0, 0],
      [1, 380],
      [2, 460],
      [3, 540],
      [4, 620],
      [5, 700],
      [6, 780],
      [5, 1100],
      [4, 1210],
      [3, 1320],
      [2, 1430],
    ];
    timers = steps.map(([idx, at]) =>
      window.setTimeout(() => {
        if (touched) return;
        range.value = String(idx);
        set(idx);
      }, at),
    );
  };
  (['pointerdown', 'keydown', 'touchstart', 'focusin'] as const).forEach((ev) =>
    root.addEventListener(ev, stopDemo, { passive: true }),
  );
  const stage = root.querySelector<HTMLElement>('.kalibre__stage') ?? range;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        window.setTimeout(demo, 250);
      },
      { threshold: 0.75 },
    );
    io.observe(stage);
  }

  range.addEventListener('input', () => {
    stopDemo();
    set(Number(range.value));
  });
  ticks.forEach((t) =>
    t.addEventListener('click', () => {
      stopDemo();
      range.value = t.dataset.kTick ?? '0';
      set(Number(range.value));
      range.focus({ preventScroll: true });
    }),
  );
  root.classList.add('is-ready');
  set(current);
}

document.querySelectorAll<HTMLElement>('[data-kalibre]').forEach(init);
