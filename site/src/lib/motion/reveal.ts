/**
 * reveal.ts — SplitText maskeli açılımlar ve kaydırmayla dolan metin.
 *
 * <h2 data-reveal="lines">…</h2>            satır satır maskeden yükselir
 * <p data-reveal="words" data-reveal-delay="0.2">…</p>
 * <span data-reveal="chars">…</span>
 *   data-reveal-trigger="#bolum"  data-reveal-start="35%"  (sabit bölüm içi: bölüm ilerlemesinin %35'i)
 *   data-reveal-start="top 80%"   (normal ScrollTrigger konumu; varsayılan "top 88%")
 *   Sabit bölüm içindeyse geri kaydırınca tersine döner; değilse bir kez oynar.
 * <p data-fill>…</p>                        kelimeler soluk başlar, kaydırdıkça dolar
 *   data-fill-start="top 80%" data-fill-end="bottom 45%"
 */
import { gsap, SplitText, mm, MOTION, REDUCE, num, qsa, stickyPos } from './core';

type RevealType = 'lines' | 'words' | 'chars';

const CLASSES = { linesClass: 'split-line', wordsClass: 'split-word', charsClass: 'split-char' };

export function initReveal(root: ParentNode = document): void {
  const reveals = qsa('[data-reveal]', root);
  const fills = qsa('[data-fill]', root);
  if (!reveals.length && !fills.length) return;

  mm.add({ motion: MOTION, reduce: REDUCE }, (ctx) => {
    if (ctx.conditions?.reduce) {
      reveals.forEach((el) => el.classList.add('is-split'));
      return;
    }
    const splits: SplitText[] = [];
    reveals.forEach((el) => splits.push(revealEl(el)));
    fills.forEach((el) => splits.push(fillEl(el)));
    return () => splits.forEach((s) => s.revert());
  });
}

function revealEl(el: HTMLElement): SplitText {
  const type = (el.dataset.reveal || 'lines') as RevealType;
  const triggerSel = el.dataset.revealTrigger;
  const trigger = (triggerSel && document.querySelector<HTMLElement>(triggerSel)) || el;
  const pinned = trigger !== el;
  const start = stickyPos(trigger, el.dataset.revealStart ?? (pinned ? '0%' : 'top 88%'));
  const delay = num(el.dataset.revealDelay, 0);

  const cfg =
    type === 'chars'
      ? { type: 'words,chars', mask: 'chars' as const }
      : type === 'words'
        ? { type: 'lines,words', mask: 'words' as const }
        : { type: 'lines', mask: 'lines' as const };

  return SplitText.create(el, {
    ...cfg,
    ...CLASSES,
    autoSplit: true,
    onSplit(self: SplitText) {
      el.classList.add('is-split');
      const targets = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines;
      return gsap.from(targets, {
        yPercent: 118,
        duration: type === 'chars' ? 0.9 : 1.15,
        ease: 'expo.out',
        delay,
        stagger: type === 'chars' ? 0.018 : type === 'words' ? 0.045 : 0.1,
        scrollTrigger: {
          trigger,
          start,
          toggleActions: pinned ? 'play none none reverse' : 'play none none none',
          once: !pinned,
          invalidateOnRefresh: true,
        },
      });
    },
  });
}

function fillEl(el: HTMLElement): SplitText {
  return SplitText.create(el, {
    type: 'words',
    wordsClass: 'split-word',
    autoSplit: true,
    onSplit(self: SplitText) {
      return gsap.to(self.words, {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: el.dataset.fillStart ?? 'top 80%',
          end: el.dataset.fillEnd ?? 'bottom 45%',
          scrub: true,
        },
      });
    },
  });
}

/**
 * Programatik kullanım (hero/sergi gibi sahneler için): duraklatılmış satır
 * açılımı döner. tl.play() ile oynat.
 */
export function splitLines(el: HTMLElement): { split: SplitText; lines: Element[] } {
  const split = SplitText.create(el, { type: 'lines', mask: 'lines', ...CLASSES });
  el.classList.add('is-split');
  return { split, lines: split.lines };
}
