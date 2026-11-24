import type { Link } from '../types';

export interface NavLanguage {
  code: string;
  label: string;
  active?: boolean;
  soon?: boolean;
}

export interface NavContent {
  skipLink: string;
  /** gezinmedeki tipografik işaret (küçük harf Fraunces + güneş noktası) */
  wordmark: string;
  /** işaretin erişilebilir adı */
  brandLabel: string;
  /** rozet logo (footer'da kullanılır; gezinmede artık yok) */
  logo: { src: string; alt: string; width: number; height: number };
  homeLabel: string;
  links: Link[];
  cta: Link;
  languages: NavLanguage[];
  languageLabel: string;
  soonLabel: string;
  menu: { open: string; close: string };
  preloader: { label: string };
  cursor: { scroll: string; view: string };
}

export const nav: NavContent = {
  skipLink: 'İçeriğe geç',
  wordmark: 'ahsen',
  brandLabel: 'Ahsen Kayısı',
  logo: { src: '/media/marka/ahsen-logo.png', alt: 'Ahsen Kayısı', width: 240, height: 115 },
  homeLabel: 'Ahsen Kayısı — ana sayfa',
  links: [
    { label: 'Hakkımızda', href: '#hakkimizda' },
    { label: 'Süreç', href: '#surec' },
    { label: 'Ürünler', href: '#urunler' },
    { label: 'Dünya', href: '#dunya' },
    { label: 'Kalite', href: '#kalite' },
  ],
  cta: { label: 'Numune İste', href: '#iletisim' },
  languages: [
    { code: 'TR', label: 'Türkçe', active: true },
    { code: 'EN', label: 'English', soon: true },
    { code: 'DE', label: 'Deutsch', soon: true },
    { code: 'FR', label: 'Français', soon: true },
    { code: 'RU', label: 'Русский', soon: true },
    { code: 'AR', label: 'العربية', soon: true },
  ],
  languageLabel: 'Dil',
  soonLabel: 'yakında',
  menu: { open: 'Menü', close: 'Kapat' },
  preloader: { label: 'Yükleniyor' },
  cursor: { scroll: 'Kaydır', view: 'İncele' },
};
