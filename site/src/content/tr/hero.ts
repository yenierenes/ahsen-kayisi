export interface HeroCaption {
  index: string;
  title: string;
  text: string;
}

export interface HeroContent {
  eyebrow: string;
  /** İki satır: ikinci satır yumuşak italik basılır */
  titleLines: [string, string];
  captions: [HeroCaption, HeroCaption, HeroCaption];
  dayLabel: string;
  dayTotal: number;
  scrollHint: string;
  skip: { label: string; href: string };
  sequence: {
    /** public/ altındaki klasörler; içinde manifest.json bulunur */
    base: string;
    fg: string;
    /** reduced-motion ve no-JS için durağan kareler */
    firstFrame: string;
    lastFrame: string;
    alt: string;
    lastAlt: string;
  };
}

export const hero: HeroContent = {
  eyebrow: 'MALATYA · 38.35° K, 38.31° D · 950 m',
  titleLines: ['Güneşin', 'meyvesi.'],
  captions: [
    {
      index: '01',
      title: 'Dalında bekler.',
      text: 'Meyve dalında tam olgunlaşmadan toplanmaz.',
    },
    {
      index: '02',
      title: 'Güneşe serilir.',
      text: 'Hasattan sonra beş ila yedi gün açık havada, güneşte kurur.',
    },
    {
      index: '03',
      title: 'Özü kalır.',
      text: 'Üç buçuk kilo taze kayısıdan bir kilo kuru kayısı çıkar.',
    },
  ],
  dayLabel: 'GÜN',
  dayTotal: 7,
  scrollHint: 'Kaydır',
  skip: { label: 'Ürünlere geç', href: '#urunler' },
  sequence: {
    base: '/seq/hero/',
    fg: '/seq/hero-fg/',
    firstFrame: '/seq/hero/f_0001.webp',
    lastFrame: '/seq/hero/f_0192.webp',
    alt: 'Karanlık bir boşlukta asılı duran taze, turuncu bir kayısı.',
    lastAlt: 'Güneşte kurumuş, altın renkli bir kuru kayısı.',
  },
};
