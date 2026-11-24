/**
 * Üst gezinme: aşağı kaydırınca gizlenir, yukarıda geri gelir; mobil menü;
 * dil seçici dışarı tıklayınca kapanır.
 */
import { ScrollTrigger } from '../motion/core';
import { startScroll, stopScroll } from '../motion/smooth';

export function initNav(): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!nav) return;

  let hidden = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      const hide = y > 120 && self.direction === 1 && !nav.classList.contains('is-menu-open');
      if (hide !== hidden) {
        hidden = hide;
        nav.classList.toggle('is-hidden', hide);
      }
      nav.classList.toggle('is-scrolled', y > 8);
    },
  });
  // Klavye odağı gezinmeye girerse görünür kalsın
  nav.addEventListener('focusin', () => {
    hidden = false;
    nav.classList.remove('is-hidden');
  });

  const toggle = nav.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.getElementById(toggle?.getAttribute('aria-controls') ?? '');
  if (toggle && menu) {
    const label = toggle.querySelector('[data-menu-label]');
    const set = (open: boolean): void => {
      if (open === nav.classList.contains('is-menu-open')) return;
      nav.classList.toggle('is-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      menu.toggleAttribute('inert', !open);
      if (label) label.textContent = open ? (toggle.dataset.labelClose ?? '') : (toggle.dataset.labelOpen ?? '');
      if (open) {
        stopScroll();
        menu.querySelector<HTMLElement>('a')?.focus();
      } else {
        startScroll();
      }
    };
    toggle.addEventListener('click', () => set(!nav.classList.contains('is-menu-open')));
    // Odak tuzağı: menü açıkken Tab yalnız gezinme çubuğu + menü bağlantıları arasında döner
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || !nav.classList.contains('is-menu-open')) return;
      const items = Array.from(nav.querySelectorAll<HTMLElement>('a[href], button, summary')).filter(
        (el) => !el.closest('[inert]') && el.getClientRects().length > 0,
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !nav.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !nav.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    });
    menu.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) set(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-menu-open')) {
        set(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && set(false));
  }

  const lang = nav.querySelector<HTMLDetailsElement>('[data-lang]');
  if (lang) {
    document.addEventListener('click', (e) => {
      if (lang.open && !lang.contains(e.target as Node)) lang.open = false;
    });
    lang.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        lang.open = false;
        lang.querySelector('summary')?.focus();
      }
    });
  }
}
