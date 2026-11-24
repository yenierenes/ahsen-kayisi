import type { SectionHeading } from '../types';

export interface Market {
  name: string;
  /** ISO 3166-1 alfa-2 */
  code: string;
  /** Rota ucu (ülke merkezi ya da başlıca ticaret merkezi), derece */
  lat: number;
  lon: number;
  /** Türkiye kuru kayısı ihracatındaki pay (2025, değer) — gösterim */
  share: string;
  /** Pay, 0–100 (rota çizgisi uzunluğu için) */
  shareValue: number;
}

export interface DunyaContent {
  heading: SectionHeading;
  lead: string;
  origin: { name: string; lat: number; lon: number; label: string };
  stat: { value: string; suffix: string; unit: string; caption: string };
  list: {
    title: string;
    /** Liste, Ahsen'in değil Türkiye'nin pazarlarıdır — açıkça söylenir. */
    note: string;
    hint: string;
    source: string;
  };
  globe: { label: string; drag: string; fallbackAlt: string };
  markets: Market[];
}

export const dunya: DunyaContent = {
  heading: { no: '', title: 'Malatya’dan dünyaya' },
  lead: 'Malatya kayısısı 100’den fazla ülkeye ihraç ediliyor. Listede Türkiye’nin en çok kuru kayısı sattığı on ülke var.',
  origin: { name: 'Malatya', lat: 38.35, lon: 38.31, label: 'Malatya · 38.35° K, 38.31° D' },
  stat: {
    value: '100',
    suffix: "'den fazla",
    unit: 'ülke',
    caption: 'Malatya kayısısının gittiği ülke sayısı. Kaynak: Malatya Ticaret Borsası.',
  },
  list: {
    title: 'En çok kayısı alan on ülke',
    note: 'Türkiye’nin kuru kayısı ihracatının %69’u bu on ülkeye gider.',
    hint: 'Bir ülkenin üzerine geldiğinizde rota haritada görünür.',
    source: 'Kaynak: T.C. Ticaret Bakanlığı, 2025 ihracat değeri.',
  },
  globe: {
    label: "Malatya'dan başlıca kuru kayısı pazarlarına uzanan rotaları gösteren dönen küre",
    drag: 'Çevirin',
    fallbackAlt: "Malatya merkezli noktalı dünya haritası ve başlıca pazarlara rotalar",
  },
  markets: [
    { name: 'ABD', code: 'US', lat: 39.0, lon: -95.0, share: '%24,7', shareValue: 24.7 },
    { name: 'Fransa', code: 'FR', lat: 46.6, lon: 2.4, share: '%10,0', shareValue: 10.0 },
    { name: 'Almanya', code: 'DE', lat: 51.1, lon: 10.4, share: '%8,1', shareValue: 8.1 },
    { name: 'Birleşik Krallık', code: 'GB', lat: 52.5, lon: -1.5, share: '%5,0', shareValue: 5.0 },
    { name: 'Brezilya', code: 'BR', lat: -14.2, lon: -51.9, share: '%4,7', shareValue: 4.7 },
    { name: 'Avustralya', code: 'AU', lat: -25.3, lon: 133.8, share: '%4,6', shareValue: 4.6 },
    { name: 'Hollanda', code: 'NL', lat: 52.2, lon: 5.3, share: '%3,7', shareValue: 3.7 },
    { name: 'Kanada', code: 'CA', lat: 45.4, lon: -75.7, share: '%3,2', shareValue: 3.2 },
    { name: 'Cezayir', code: 'DZ', lat: 36.7, lon: 3.1, share: '%2,6', shareValue: 2.6 },
    { name: 'Rusya', code: 'RU', lat: 55.8, lon: 37.6, share: '%2,4', shareValue: 2.4 },
  ],
};
