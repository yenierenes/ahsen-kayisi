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
  heading: { no: '', title: 'Tek meyve, beş hâl.' },
  intro:
    'Ağaç aynı, güneş aynı. Değişen, sizin onunla ne yapacağınız.',
  scrollHint: 'Kaydırın',
  sampleLink: 'Numune iste',
  products: [
    {
      id: 'sari',
      name: 'Sarı',
      em: 'kuru kayısı',
      tag: 'Kükürtlü',
      desc: 'Herkesin bildiği kayısı. Parlak, yumuşak, altın sarısı.',
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
      desc: 'Kükürt görmez, rengini güneşe bırakır. Koyu renkli, karamel tadında.',
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
      desc: 'Organik tarımda kükürt yok. Kayısı kendi renginde kurur.',
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
      tag: 'Üretime',
      desc: 'Müsliye, bara, keke girecek kayısı. Yapışmasın diye pirinç ununa bulanır.',
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
      desc: 'İçinden badem gibi bir iç çıkar. Tatlısı çerezdir, acısı yağa gider.',
      image: kesim('cekirdek', 957, 1325, 'Kayısı çekirdeği içi, badem benzeri'),
      specs: [
        { k: 'Tür', v: 'Tatlı · acı' },
        { k: 'Tatlı', v: 'Gıda, çerez' },
        { k: 'Acı', v: 'Yağ, kozmetik' },
      ],
    },
  ],
  end: {
    kicker: 'Karar vermenin en kolay yolu',
    title: 'Tadına',
    em: 'bakın',
    link: { label: 'Numune iste', href: '#iletisim' },
  },
  note: 'Değerler sektörün genel ölçüleridir. Sizin partinizin değerleri teklifte yazar.',
};
