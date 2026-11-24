import type { SectionHeading, Link } from '../types';

/** Ürün kartındaki mono teknik satır. Yalnız araştırmayla desteklenen değerler. */
export interface Spec {
  k: string;
  v: string;
}

export interface Product {
  id: string;
  /** "01" */
  index: string;
  /** Serif ad; `em` italik ikinci satır */
  name: string;
  em: string;
  /** Kısa mono etiket (ör. "Kükürtlü") */
  tag: string;
  desc: string;
  image: { src: string; width: number; height: number; alt: string };
  specs: Spec[];
}

/** Resmî kalibre tablosundan bir satır (T.C. Ticaret Bakanlığı 2024 · AB PDO şartnamesi). */
export interface Grade {
  /** Boy numarası "0"…"8" */
  no: string;
  /** "Jumbo", "No.1"… */
  name: string;
  /** Tane / kg aralığı (gösterim) */
  perKg: string;
  /** Yaklaşık tane ağırlığı (gösterim) */
  grams: string;
  /** 100 g'daki tane (tane/kg ÷ 10, gösterim) */
  per100: string;
  /** Hesap için temsilî tane ağırlığı (g) — aralığın orta noktası; Jumbo için 75 tane/kg varsayımı */
  g: number;
}

export interface UrunlerContent {
  heading: SectionHeading;
  intro: string;
  scrollHint: string;
  sampleLink: string;
  products: Product[];
  end: { kicker: string; title: string; em: string; link: Link };
  note: string;
  kalibre: {
    label: string;
    title: string;
    em: string;
    rule: string;
    body: string;
    sliderLabel: string;
    /** Ekran okuyucu değeri: {name} {perKg} {grams} {per100} */
    valueText: string;
    jumboRing: string;
    perKgUnit: string;
    gramsUnit: string;
    per100Unit: string;
    clusterLabel: string;
    defaultIndex: number;
    grades: Grade[];
    source: string;
  };
}

const kesim = (ad: string, width: number, height: number, alt: string) => ({
  src: `/media/foto/urun-${ad}-kesim.webp`,
  width,
  height,
  alt,
});

export const urunler: UrunlerContent = {
  heading: { no: '04', title: 'Tek meyve, beş hâl.' },
  intro:
    'Aynı bahçeden, aynı güneşten. Kurutma, kesim ve ambalaj alıcının pazarına göre değişir; meyve aynı kalır.',
  scrollHint: 'Kaydırın',
  sampleLink: 'Numune iste',
  products: [
    {
      id: 'sari',
      index: '01',
      name: 'Sarı',
      em: 'kuru kayısı',
      tag: 'Kükürtlü',
      desc: 'Bütün ve çekirdeksiz; Malatya kayısısının ana ihracat ürünü.',
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
      index: '02',
      name: 'Gün',
      em: 'kurusu',
      tag: 'Doğal',
      desc: 'Kükürt eklenmeden kurur; rengi koyu kahveye döner.',
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
      index: '03',
      name: 'Organik',
      em: 'kayısı',
      tag: 'Kükürtsüz',
      desc: 'Organik mevzuat kuru meyvede kükürde izin vermez; renk doğal olarak koyulaşır.',
      image: kesim('organik', 992, 1400, 'Organik kuru kayısı taneleri'),
      specs: [
        { k: 'Form', v: 'Bütün' },
        { k: 'SO₂', v: 'Kükürtsüz' },
        { k: 'Renk', v: 'Doğal, koyu' },
      ],
    },
    {
      id: 'kup',
      index: '04',
      name: 'Küp',
      em: 'doğranmış',
      tag: 'Endüstriyel',
      desc: 'Müsli, bar ve fırın ürünleri için; pirinç unu kaplamalı kesim.',
      image: kesim('kup', 1015, 1400, 'Küp doğranmış kuru kayısı'),
      specs: [
        { k: 'Form', v: 'Küp doğranmış' },
        { k: 'Kaplama', v: 'Pirinç unu' },
        { k: 'Kullanım', v: 'Müsli · bar · fırıncılık' },
      ],
    },
    {
      id: 'cekirdek',
      index: '05',
      name: 'Kayısı',
      em: 'çekirdeği',
      tag: 'Tatlı · acı',
      desc: 'Tatlısı çerez ve gıda için, acısı yağ ve kozmetik sanayisi için ayrılır.',
      image: kesim('cekirdek', 957, 1325, 'Kayısı çekirdeği içi, badem benzeri'),
      specs: [
        { k: 'Tür', v: 'Tatlı · acı' },
        { k: 'Tatlı', v: 'Gıda, çerez' },
        { k: 'Acı', v: 'Yağ, kozmetik' },
      ],
    },
  ],
  end: {
    kicker: 'Spesifikasyonunuzu yazın',
    title: 'Numune',
    em: 'iste',
    link: { label: 'Numune iste', href: '#iletisim' },
  },
  note: 'Değerler sektör standartlarını gösterir; parti spesifikasyonu teklif aşamasında netleşir.',
  kalibre: {
    label: 'Kalibre',
    title: 'Bir kiloda',
    em: 'kaç tane?',
    rule: 'Numara küçüldükçe tane irileşir.',
    body: 'Kuru kayısı, bir kilogramdaki tane sayısına göre boylanır. Jumbo en iri, No.8 en ufak tanedir. Kaydırıcıyı oynatın, bir tanenin boyunu ve 100 gramı görün.',
    sliderLabel: 'Kalibre seçin',
    valueText: '{name}: kilogramda {perKg} tane, tane başına {grams}, 100 gramda {per100} tane',
    jumboRing: 'Jumbo boyu',
    perKgUnit: 'tane / kg',
    gramsUnit: 'tane başına',
    per100Unit: 'tane / 100 g',
    clusterLabel: '100 gramda',
    defaultIndex: 2,
    grades: [
      { no: '0', name: 'Jumbo', perKg: '≤ 80', grams: '≥ 12,5 g', per100: '≤ 8', g: 13.3 },
      { no: '1', name: 'No.1', perKg: '81–100', grams: '10,0–12,3 g', per100: '8–10', g: 11.05 },
      { no: '2', name: 'No.2', perKg: '101–120', grams: '8,3–9,9 g', per100: '10–12', g: 9.05 },
      { no: '3', name: 'No.3', perKg: '121–140', grams: '7,1–8,3 g', per100: '12–14', g: 7.69 },
      { no: '4', name: 'No.4', perKg: '141–160', grams: '6,3–7,1 g', per100: '14–16', g: 6.67 },
      { no: '5', name: 'No.5', perKg: '161–180', grams: '5,6–6,2 g', per100: '16–18', g: 5.88 },
      { no: '6', name: 'No.6', perKg: '181–200', grams: '5,0–5,5 g', per100: '18–20', g: 5.26 },
      { no: '7', name: 'No.7', perKg: '201–220', grams: '4,5–5,0 g', per100: '20–22', g: 4.76 },
      { no: '8', name: 'No.8', perKg: '221–240', grams: '≤ 4,5 g', per100: '22–24', g: 4.34 },
    ],
    source:
      'Kaynak: T.C. Ticaret Bakanlığı, Kuru Kayısı Kalite Kriterleri ve Sınıflandırma (2024) · AB Malatya Kayısısı PDO şartnamesi.',
  },
};
