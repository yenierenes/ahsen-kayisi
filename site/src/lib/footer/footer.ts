/**
 * Footer betikleri:
 *  1. dev "AHSEN" yazısını kapsayıcı genişliğine tam oturtur (yazı tipi yüklenince ve yeniden boyutlanınca)
 *  2. ufuk görünür olunca harfleri yükseltir (.is-in; CSS geçişi, yalnız hareket açıkken)
 *  3. "Başa dön" düğmesi ve telif yılı
 */
import { scrollToTarget } from '../motion';

/** Taban çizgisinin ilk harf kutusunun üstünden uzaklığı (em). Sıfır boyutlu bir işaretçi taban çizgisine oturtulup DOM'dan ölçülür. */
function baselineEm(word: HTMLElement): number | null {
  const char = word.querySelector<HTMLElement>('.footer__char');
  if (!char) return null;
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;inline-size:0;block-size:0;vertical-align:baseline';
  char.appendChild(probe);
  const base = (probe.getBoundingClientRect().top - char.getBoundingClientRect().top) / parseFloat(getComputedStyle(word).fontSize);
  probe.remove();
  return base > 0.55 && base < 0.95 ? base : null;
}

function fitWordmark(): void {
  const horizon = document.querySelector<HTMLElement>('[data-footer-horizon]');
  const word = horizon?.querySelector<HTMLElement>('[data-footer-word]');
  const inner = word?.querySelector<HTMLElement>('[data-footer-word-inner]');
  if (!horizon || !word || !inner) return;

  const fit = (): void => {
    const cs = getComputedStyle(horizon);
    const avail = horizon.clientWidth - parseFloat(cs.paddingInlineStart) - parseFloat(cs.paddingInlineEnd);
    if (avail <= 0) return;
    const probe = 100;
    word.style.fontSize = `${probe}px`;
    // transform'dan etkilenmeyen ölçü
    const w = inner.offsetWidth;
    if (w > 0) word.style.fontSize = `${((probe * avail) / w).toFixed(2)}px`;
    // Kutu yüksekliği = taban çizgisi: harfler sayfa tabanında bütün görünür
    const base = baselineEm(word);
    if (base) word.style.setProperty('--word-h', `${base.toFixed(3)}em`);
  };

  fit();
  void document.fonts?.ready.then(fit);
  let last = horizon.clientWidth;
  new ResizeObserver(() => {
    if (horizon.clientWidth !== last) {
      last = horizon.clientWidth;
      fit();
    }
  }).observe(horizon);

  const io = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) {
        horizon.classList.add('is-in');
        io.disconnect();
      }
    },
    { threshold: 0.2 },
  );
  io.observe(horizon);
}

function initFooter(): void {
  fitWordmark();

  document.querySelector<HTMLButtonElement>('[data-to-top]')?.addEventListener('click', () => scrollToTarget(0));

  // Telif yılı: statik çıktı eskimiş olabilir
  const year = document.querySelector<HTMLElement>('[data-copyright]');
  if (year?.dataset.template) {
    year.textContent = year.dataset.template.replace('{year}', String(new Date().getFullYear()));
  }
}

initFooter();
