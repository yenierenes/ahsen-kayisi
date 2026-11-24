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
  heading: { no: '', title: 'Aynı kayısı, her seferinde.' },
  lead: 'İyi kayısı göndermek kolay. Zor olan, aynısını bir daha göndermek.',
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
    caption: 'Seçme bandı',
  },
  promisesLabel: 'Nasıl tutturuyoruz',
  promises: [
    {
      no: '01',
      title: 'Parti numarası',
      text: 'Her kolinin üstünde bir numara var. O numara, kayısının hangi gün hangi partiden çıktığını söyler. Bir sorun olursa geriye doğru yürürüz.',
    },
    {
      no: '02',
      title: 'Önce ölçü',
      text: 'Kayısı içeri girerken nemi, kükürdü ve boyu ölçülür. Tutmayan parti, tutana karışmaz.',
    },
    {
      no: '03',
      title: 'Ülkesine göre kükürt',
      text: 'Avrupa en çok 2.000 mg/kg kabul eder, Amerika 3.000’e kadar ister. Kayısı, gideceği ülkenin sınırına göre hazırlanır.',
    },
    {
      no: '04',
      title: 'Son bakış insanın',
      text: 'Makine iriyi ufaktan ayırır. Lekeyi, yarığı, rengi dönmüşü göz ayırır.',
    },
  ],
  strip: {
    label: 'Uyduğumuz ölçüler',
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
    label: 'Teknik',
    title: 'Kısaca şartname',
    colBasis: 'Dayanak',
    rows: [
      {
        label: 'Kalibre',
        value: 'Jumbo’da kiloya en çok 80 tane girer, No.8’de 221–240. Numara küçüldükçe tane irileşir.',
        basis: 'AB şartnamesi · boy no 0–8',
      },
      {
        label: 'Sınıf',
        value: 'Ekstra · Sınıf I · Sınıf II',
        basis: 'UNECE DDP-15 · TS 485',
      },
      {
        label: 'Kükürt (SO₂)',
        value: 'AB ve Türkiye: en çok 2.000 mg/kg · ABD: 3.000 ppm · Kanada: 2.500 ppm',
        basis: 'Ülkesine göre ayarlanır',
      },
      {
        label: 'Nem',
        value: 'En çok %25',
        basis: 'AB tescil şartnamesi',
      },
      {
        label: 'Ambalaj',
        value: 'Perakende paket ve 5 kg koli. Etikette firma, parti ve boy numarası.',
        basis: 'TS 485 etiket kuralları',
      },
      {
        label: 'Raf ömrü',
        value: 'Serin ve kuru yerde en az 12 ay. Soğuk depoda daha uzun.',
        basis: 'İhracat spesifikasyonu',
      },
    ],
    note: 'Bunlar genel değerler. Sizin partinizin şartnamesi siparişten önce yazılı gelir.',
  },
};
