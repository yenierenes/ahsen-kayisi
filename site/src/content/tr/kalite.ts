import type { SectionHeading } from '../types';

export interface KalitePromise {
  /** "01" — mono dizin */
  no: string;
  title: string;
  text: string;
}

export interface KaliteSpecRow {
  label: string;
  value: string;
  /** Dayanak: standart / şartname adı (mono, küçük) */
  basis: string;
}

export interface KaliteContent {
  heading: SectionHeading;
  lead: string;
  video: {
    src: string;
    srcMobile: string;
    /** Video dosyası yokken (public/media/video/ boşken) ya da yüklenemezken görünen fotoğraf; derleme anında algılanır */
    still: {
      avif: string;
      /** srcset dizesi: "<yol> 967w, <yol> 1856w" */
      webpSet: string;
      /** srcset yokken kullanılan tek kaynak */
      webp: string;
      width: number;
      height: number;
      alt: string;
      caption: string;
    };
    alt: string;
    toggle: { play: string; pause: string };
    caption: string;
  };
  promisesLabel: string;
  promises: KalitePromise[];
  /** Kayan şerit: yalnızca nesnel ürün standartları. Doğrulanmış firma sertifikası yok. */
  strip: { label: string; items: string[] };
  spec: {
    label: string;
    title: string;
    rows: KaliteSpecRow[];
    note: string;
    colBasis: string;
  };
}

export const kalite: KaliteContent = {
  heading: { no: '06', title: 'Her partide aynı söz.' },
  lead: 'Kalite bir kez söylenen söz değil, her kutuda yeniden verilen sözdür. Dört şeyi hiç gevşetmiyoruz.',
  video: {
    src: '/media/video/v-tesis.mp4',
    srcMobile: '/media/video/v-tesis-m.mp4',
    still: {
      avif: '/media/foto/urun-sari-1600.avif',
      webpSet: '/media/foto/urun-sari-1200.webp 967w, /media/foto/urun-sari-2400.webp 1856w',
      webp: '/media/foto/urun-sari-1200.webp',
      width: 967,
      height: 1200,
      alt: 'Koyu zeminde bir arada dizilmiş sarı kuru kayısı taneleri',
      caption: 'Sarı kayısı · Malatya',
    },
    alt: 'Tesisten görüntüler: kuru kayısıların seçilmesi ve paketlenmesi',
    toggle: { play: 'Videoyu oynat', pause: 'Videoyu durdur' },
    caption: 'Tesis · Malatya',
  },
  promisesLabel: 'Dört söz',
  promises: [
    {
      no: '01',
      title: 'İzlenebilirlik',
      text: 'Etikette firma adı ve adresi, parti (lot) numarası ve boy numarası yer alır. Her kutunun hangi partiden geldiği, etiketinden okunur.',
    },
    {
      no: '02',
      title: 'Laboratuvar analizi',
      text: 'Hammadde kabulde nem, SO₂, kalibre ve kusur ölçülür. Dört ölçüt, partiden partiye aynı yöntemle denetlenir.',
    },
    {
      no: '03',
      title: 'Pazara göre SO₂ ayarı',
      text: 'AB ve Türkiye en çok 2.000 mg/kg kabul eder; ABD gibi bazı pazarlar 3.000 ppm’e kadar talep edebilir. Parti, gideceği pazarın sınırına göre hazırlanır.',
    },
    {
      no: '04',
      title: 'Elle son seçim',
      text: 'Işıklı bant ve masalarda yabancı madde ile kusurlu taneler ayıklanır. Makine eler, son bakış yine insan gözünündür.',
    },
  ],
  strip: {
    label: 'Dayandığımız standartlar',
    items: [
      'Malatya Kayısısı · AB Korunan Menşe Adı · 2017',
      'UNECE DDP-15 · Ekstra, Sınıf I, Sınıf II',
      'TS 485 · Kuru Kayısı',
      'Tüzük (AB) 2017/1220',
      'Hacıhaliloğlu çeşidi',
      'Kalibre: Jumbo’dan No.8’e',
    ],
  },
  spec: {
    label: 'Teknik veri',
    title: 'Spesifikasyon özeti',
    colBasis: 'Dayanak',
    rows: [
      {
        label: 'Kalibre',
        value: 'Jumbo (80’e kadar) → No.8 (221–240) tane/kg. Numara küçüldükçe tane irileşir.',
        basis: 'AB şartnamesi · boy no 0–8',
      },
      {
        label: 'Sınıf',
        value: 'Ekstra · Sınıf I · Sınıf II',
        basis: 'UNECE DDP-15 · TS 485',
      },
      {
        label: 'SO₂ aralığı',
        value: 'AB, Türkiye, Codex: en çok 2.000 mg/kg · ABD: 3.000 ppm · Kanada: 2.500 ppm',
        basis: 'Pazara göre ayarlanır',
      },
      {
        label: 'Nem',
        value: 'En çok %25 (şartname aralığı %20–25)',
        basis: 'AB tescil şartnamesi',
      },
      {
        label: 'Ambalaj',
        value: 'Perakende paket ve 5 kg jumbo koli. Etikette firma, parti ve boy no.',
        basis: 'TS 485 etiket kuralları',
      },
      {
        label: 'Raf ömrü',
        value: 'Paketlemeden itibaren en az 12 ay, serin ve kuru ortamda. Soğuk depoda (+4 °C) daha uzun.',
        basis: 'İhracat spesifikasyonu',
      },
    ],
    note: 'Referans değerlerdir. Nihai spesifikasyon ürün, parti ve hedef pazara göre sipariş öncesinde yazılı olarak paylaşılır.',
  },
};
