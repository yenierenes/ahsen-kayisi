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
  heading: { no: '', title: 'Malatya, sayıyla.' },
  intro: 'Övünmek ayıp, saymak serbest. Her rakamın kaynağı altında yazar.',
  figures: [
    {
      id: 'agac',
      value: '8,4',
      count: { to: 8.4, decimals: 1 },
      unit: 'milyon ağaç',
      short: 'kayısı ağacı',
      context: 'Malatya’da insandan çok kayısı ağacı var. Kişi başına on taneden fazla düşer.',
      source: 'Malatya Ticaret Borsası',
      year: '2025',
    },
    {
      id: 'yari',
      value: "2'de 1",
      short: 'dünyadaki pay',
      context: 'Dünyanın yediği her iki kuru kayısıdan biri bu ovadan çıkar. İyi yılda üçte ikisi.',
      source: 'INC',
      year: 'son 5 sezon ortalaması',
    },
    {
      id: 'kilo',
      value: '3,5',
      count: { to: 3.5, decimals: 1 },
      unit: 'kg → 1 kg',
      short: 'meyveden kuruya',
      context: 'Üç buçuk kilo meyve güneşe girer, bir kilo kayısı çıkar.',
      source: 'AB PDO şartnamesi',
      year: '2017',
    },
    {
      id: 'gunes',
      value: '~2.800',
      count: { to: 2800, prefix: '~' },
      unit: 'saat',
      short: 'yıllık güneş',
      context: 'Yılda 2.800 saat güneş. Temmuzda günde on iki saatten fazla.',
      source: 'MGM verisinden hesap',
      year: '1929–2025',
    },
    {
      id: 'ulke',
      value: '100+',
      count: { to: 100, suffix: '+' },
      unit: 'ülke',
      short: 'ihracat pazarı',
      context: 'Yüzden fazla ülkede kahvaltıya aynı kayısı çıkar.',
      source: 'Malatya Ticaret Borsası',
      year: '2023/24',
    },
    {
      id: 'tescil',
      value: '2017',
      unit: 'AB tescili',
      short: 'menşe tescili',
      context: '“Malatya Kayısısı” adı Avrupa’da tescilli. Başka yerde kuruyan bu adı kullanamaz.',
      source: 'Tüzük (AB) 2017/1220',
      year: '2017',
    },
  ],
  note: 'Rakamlar Malatya’nın, Ahsen’in değil. Biz bu ovanın bir parçasıyız.',
};
