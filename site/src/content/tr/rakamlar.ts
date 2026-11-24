import type { SectionHeading } from '../types';

export interface Figure {
  id: string;
  /** Ekranda görünen son değer (tr-TR biçimli): "8,4" · "2'de 1" · "~2.800" */
  value: string;
  /** Sayaç parametreleri; yoksa değer sayılmaz (örn. "2'de 1", "2017") */
  count?: { to: number; decimals?: number; prefix?: string; suffix?: string };
  /** Değerin yanındaki küçük italik birim */
  unit?: string;
  /** Yan defterde (ledger) görünen tek satırlık etiket */
  short: string;
  /** Tam cümle: bağlam */
  context: string;
  /** Kaynak (mono) */
  source: string;
  /** Kaynak yılı / dönemi (mono) */
  year: string;
}

export interface RakamlarContent {
  heading: SectionHeading;
  intro: string;
  figures: Figure[];
  /** Rakamların kime ait olduğunu açıklayan dipnot */
  note: string;
}

// Tüm rakamlar arastirma/02-malatya-kayisi.md §0 ve §8'deki güvenli ifadelerdir.
export const rakamlar: RakamlarContent = {
  heading: { no: '02', title: 'Rakamlarla Malatya' },
  intro: 'Bir bölgeyi en açık sayılar anlatır. Her rakamın kaynağı ve yılı altında yazılıdır.',
  figures: [
    {
      id: 'agac',
      value: '8,4',
      count: { to: 8.4, decimals: 1 },
      unit: 'milyon ağaç',
      short: 'kayısı ağacı',
      context: "Malatya'da 8,4 milyon kayısı ağacı var.",
      source: 'Malatya Ticaret Borsası',
      year: '2025',
    },
    {
      id: 'yari',
      value: "2'de 1",
      short: 'kuru kayısıdan biri',
      context: "Dünyadaki her iki kuru kayısıdan biri Malatya'dan gelir; iyi yılda üçte ikisi.",
      source: 'INC',
      year: 'son 5 sezon ortalaması',
    },
    {
      id: 'kilo',
      value: '3,5',
      count: { to: 3.5, decimals: 1 },
      unit: 'kg → 1 kg',
      short: '1 kg kuru kayısı için',
      context: '1 kilo kuru kayısı için 3,5 kilo taze meyve gerekir.',
      source: 'AB PDO şartnamesi',
      year: '2017',
    },
    {
      id: 'gunes',
      value: '~2.800',
      count: { to: 2800, prefix: '~' },
      unit: 'saat',
      short: 'yılda güneş',
      context: 'Yılda yaklaşık 2.800 saat güneş; temmuzda günde 12,4 saat.',
      source: 'MGM verisinden hesap',
      year: '1929–2025',
    },
    {
      id: 'ulke',
      value: '100+',
      count: { to: 100, suffix: '+' },
      unit: 'ülke',
      short: 'ülkenin sofrasında',
      context: "Malatya kayısısı 100'den fazla ülkenin sofrasında.",
      source: 'Malatya Ticaret Borsası',
      year: '2023/24',
    },
    {
      id: 'tescil',
      value: '2017',
      unit: 'AB tescili',
      short: 'AB tescilli menşe adı',
      context: "Malatya Kayısısı, AB'de Korunan Menşe Adı (PDO) olarak tescillidir.",
      source: 'Tüzük (AB) 2017/1220',
      year: '2017',
    },
  ],
  note: "Bu rakamlar Malatya havzasına aittir; Ahsen Kayısı'nın kendi üretim verisi değildir.",
};
