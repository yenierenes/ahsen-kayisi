/**
 * Çiçek — "BAHAR" sahnesi (Rakamlar ile Süreç arasında, numarasız).
 * Çiçek açmış kayısı sırası boyunca kaydırmayla ilerleyen görüntü dizisi;
 * dört vuruş, her biri bir Fraunces satırı + bir kısa cümle.
 */

export interface CicekBeat {
  title: string;
  text: string;
}

export interface CicekContent {
  /** Mono etiket "BAHAR" + vuruş sayısı kadar nokta */
  label: string;
  /** Ekran okuyucu başlığı (görsel başlık vuruşların kendisi) */
  srTitle: string;
  /** dört vuruş, sırayla: çiçek · don · yaprak dökümü · hasada doğru */
  beats: CicekBeat[];
  sequence: {
    /** public/ altındaki klasör; içinde manifest.json bulunur */
    base: string;
    alt: string;
  };
  still: {
    /** -1200.webp / -2400.webp / -1600.avif ailesinin ortak yolu */
    base: string;
    width: number;
    height: number;
    widthLg: number;
    widthAvif: number;
    alt: string;
  };
  /** Sürüklenen kesimler (süs; alt metin yok). Derleme anında klasörde yoksa kullanılan tek çiçek */
  spriteFallback: { src: string; width: number; height: number };
}

export const cicek: CicekContent = {
  label: 'Bahar',
  srTitle: 'Bahar: çiçekten meyveye',
  beats: [
    {
      title: 'Mart sonunda bahçeler çiçek açar.',
      text: 'Malatya’da kayısı ağaçları bir iki hafta boyunca pembe beyaz çiçekle kaplanır.',
    },
    {
      title: 'En büyük korku dondur.',
      text: 'Çiçek açtıktan sonra gelen soğuk bir gece, o yılın meyvesini götürebilir. Don riski nisan ortasına kadar sürer.',
    },
    {
      title: 'Sonra yapraklar dökülür.',
      text: 'Taç yaprakları dökülen çiçeğin yerinde küçük, yeşil bir meyve kalır.',
    },
    {
      title: 'Hasada üç ay var.',
      text: 'Meyve bahar boyunca büyür, haziranda sararır. Toplama temmuz başında başlar.',
    },
  ],
  sequence: {
    base: '/seq/cicek/',
    alt: 'Şafakta çiçek açmış kayısı bahçesi; kamera iki ağaç sırasının arasından ilerliyor.',
  },
  still: {
    base: '/media/foto/cicek-safak',
    width: 1200,
    height: 670,
    widthLg: 2400,
    widthAvif: 1600,
    alt: 'Şafakta çiçek açmış kayısı bahçesi: iki sıra pembe beyaz ağaç, arkada karlı dağlar.',
  },
  spriteFallback: { src: '/media/kesim/cicek-500.webp', width: 477, height: 500 },
};
