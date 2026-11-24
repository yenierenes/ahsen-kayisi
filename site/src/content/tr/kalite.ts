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
  heading: { no: '', title: 'Her siparişte aynı kalite' },
  lead: 'Bir müşterinin ikinci siparişinde de aynı kayısıyı bulması gerekir. Bunun için dört şeye dikkat ediyoruz.',
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
  promisesLabel: 'Dikkat ettiğimiz dört şey',
  promises: [
    {
      no: '01',
      title: 'Parti numarası',
      text: 'Her koliye bir parti numarası yazılır. Bu numara sayesinde kayısının hangi gün işlendiği sonradan bulunabilir.',
    },
    {
      no: '02',
      title: 'Giriş kontrolü',
      text: 'Kayısı tesise girerken nemi, kükürt oranı ve boyu ölçülür. Ölçüleri tutmayan parti diğerlerine karıştırılmaz.',
    },
    {
      no: '03',
      title: 'Ülkeye göre kükürt',
      text: 'Kükürt sınırı ülkeden ülkeye değişir. Avrupa Birliği’nde sınır 2.000 mg/kg, ABD’de 3.000 ppm’dir. Kayısı gideceği ülkeye göre hazırlanır.',
    },
    {
      no: '04',
      title: 'Elle son kontrol',
      text: 'Makineden geçen kayısı son olarak elle kontrol edilir. Lekeli, yarık ya da rengi bozuk taneler bu aşamada ayrılır.',
    },
  ],
  strip: {
    label: 'Esas aldığımız standartlar',
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
    title: 'Teknik bilgiler',
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
        basis: 'Ülkeye göre ayarlanır',
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
    note: 'Bunlar genel değerlerdir. Siparişinize ait şartname, sipariş öncesinde yazılı olarak gönderilir.',
  },
};
