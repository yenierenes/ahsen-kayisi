import type { Link, SectionHeading } from '../types';

export interface FooterContent {
  heading: SectionHeading;
  /** Dev alt bilgi yazısı (görsel; ekran okuyucudan gizlenir) */
  wordmark: string;
  tagline: string;
  /** Müşterinin rozet logosu (240×115) */
  logo: { src: string; alt: string; width: number; height: number };
  sectionsLabel: string;
  sections: Link[];
  contactLabel: string;
  languagesLabel: string;
  /** Doğrulanmış sosyal hesap yok; liste boş kalır ve sütun çizilmez. */
  socialLabel: string;
  social: Link[];
  /** {year} derleme anında ve tarayıcıda güncel yılla değiştirilir */
  copyright: string;
  place: string;
  toTop: { label: string };
}

export const footer: FooterContent = {
  heading: { no: '', title: 'AHSEN' },
  wordmark: 'AHSEN',
  tagline: 'Malatya’dan, güneşte kurutulmuş kayısı. Her partide aynı özenle.',
  logo: { src: '/media/marka/ahsen-logo.png', alt: 'Ahsen Kayısı logosu', width: 240, height: 115 },
  sectionsLabel: 'Bölümler',
  sections: [
    { label: 'Hakkımızda', href: '#hakkimizda' },
    { label: 'Rakamlar', href: '#rakamlar' },
    { label: 'Süreç', href: '#surec' },
    { label: 'Ürünler', href: '#urunler' },
    { label: 'Dünya', href: '#dunya' },
    { label: 'Kalite', href: '#kalite' },
    { label: 'İletişim', href: '#iletisim' },
  ],
  contactLabel: 'İletişim',
  languagesLabel: 'Dil',
  socialLabel: 'Sosyal',
  social: [],
  copyright: '© {year} Ahsen Kayısı. Tüm hakları saklıdır.',
  place: 'Malatya, Türkiye · 38.35° K, 38.31° D',
  toTop: { label: 'Başa dön' },
};
