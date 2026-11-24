import type { SectionHeading, Link } from '../types';

/** Ürün kartındaki mono teknik satır. Yalnız araştırmayla desteklenen değerler. */
export interface Spec {
  k: string;
  v: string;
}

export interface Product {
  id: string;
  /** Serif ad; `em` italik ikinci satır */
  name: string;
  em: string;
  /** Kısa mono etiket (ör. "Kükürtlü") */
  tag: string;
  desc: string;
  image: { src: string; width: number; height: number; alt: string };
  specs: Spec[];
}

export interface UrunlerContent {
  heading: SectionHeading;
  intro: string;
  scrollHint: string;
  sampleLink: string;
  products: Product[];
  end: { kicker: string; title: string; em: string; link: Link };
  note: string;
}

const kesim = (ad: string, width: number, height: number, alt: string) => ({
  src: `/media/foto/urun-${ad}-kesim.webp`,
  width,
  height,
  alt,
});

export const urunler: UrunlerContent = {
  heading: { no: '', title: 'Ürünlerimiz' },
  intro:
    'Hepsi Malatya kayısısından. Kükürtlü ya da kükürtsüz, bütün ya da doğranmış olarak hazırlıyoruz.',
  scrollHint: 'Kaydırın',
  sampleLink: 'Numune iste',
  products: [
    {
      id: 'sari',
      name: 'Sarı',
      em: 'kuru kayısı',
      tag: 'Kükürtlü',
      desc: 'Kükürtle işlem gördüğü için rengi altın sarısı kalır. En çok bilinen kuru kayısıdır.',
      image: kesim('sari', 1091, 1400, 'Sarı kuru kayısı, koyu zeminde'),
      specs: [
        { k: 'Form', v: 'Bütün, çekirdeksiz' },
        { k: 'SO₂', v: '≤ 2.000 mg/kg (AB, TR)' },
        { k: 'Kalibre', v: 'Jumbo – No.8' },
        { k: 'Ambalaj', v: '12,5 kg · 5 kg koli' },
      ],
    },
    {
      id: 'gun-kurusu',
      name: 'Gün',
      em: 'kurusu',
      tag: 'Doğal',
      desc: 'Kükürt kullanılmadan, yalnızca güneşte kurutulur. Rengi koyu kahverengidir.',
      image: kesim('gun-kurusu', 1036, 1400, 'Gün kurusu kayısı, koyu kahverengi taneler'),
      specs: [
        { k: 'Form', v: 'Bütün' },
        { k: 'SO₂', v: 'Kükürtsüz' },
        { k: 'Renk', v: 'Koyu kahverengi' },
        { k: 'Ambalaj', v: '12,5 kg · 5 kg koli' },
      ],
    },
    {
      id: 'organik',
      name: 'Organik',
      em: 'kayısı',
      tag: 'Kükürtsüz',
      desc: 'Organik tarım kurallarına göre yetiştirilir ve kükürtsüz kurutulur.',
      image: kesim('organik', 992, 1400, 'Organik kuru kayısı taneleri'),
      specs: [
        { k: 'Form', v: 'Bütün' },
        { k: 'SO₂', v: 'Kükürtsüz' },
        { k: 'Renk', v: 'Doğal, koyu' },
      ],
    },
    {
      id: 'kup',
      name: 'Küp',
      em: 'doğranmış',
      tag: 'Doğranmış',
      desc: 'Küp şeklinde doğranmış kayısı. Müsli, bar ve kek gibi ürünlerde kullanılır.',
      image: kesim('kup', 1015, 1400, 'Küp doğranmış kuru kayısı'),
      specs: [
        { k: 'Form', v: 'Küp doğranmış' },
        { k: 'Kaplama', v: 'Pirinç unu' },
        { k: 'Kullanım', v: 'Müsli · bar · fırıncılık' },
      ],
    },
    {
      id: 'cekirdek',
      name: 'Kayısı',
      em: 'çekirdeği',
      tag: 'Tatlı · acı',
      desc: 'Kayısı çekirdeğinin içi. Tatlı olanı çerez olarak yenir, acı olanı yağ üretiminde kullanılır.',
      image: kesim('cekirdek', 957, 1325, 'Kayısı çekirdeği içi, badem benzeri'),
      specs: [
        { k: 'Tür', v: 'Tatlı · acı' },
        { k: 'Tatlı', v: 'Gıda, çerez' },
        { k: 'Acı', v: 'Yağ, kozmetik' },
      ],
    },
  ],
  end: {
    kicker: 'Denemek isterseniz',
    title: 'Numune',
    em: 'isteyin',
    link: { label: 'Numune iste', href: '#iletisim' },
  },
  note: 'Bu değerler genel sektör ölçüleridir. Kesin değerler teklifte belirtilir.',
};
