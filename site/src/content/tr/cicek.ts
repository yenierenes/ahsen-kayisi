/**
 * Çiçek — "BAHAR" sahnesi (Rakamlar ile Süreç arasında, numarasız).
 * Dört vuruş, dört çekim: her vuruşun kendi kısa, döngülü videosu gerçek zamanlı oynar;
 * kaydırma çekimi değiştirir. Her vuruş bir Fraunces satırı + bir kısa cümle.
 */

export interface CicekShot {
  /** public/ altındaki ortak yol: `<base>.mp4` (1280×720), `<base>-m.mp4` (854×480), `<base>.jpg` (poster, ilk kare).
   *  Derleme anında dosya yoksa 1. çekime, o da yoksa `still` fotoğrafına düşülür. */
  base: string;
  alt: string;
  /** Yazı örtüsünün ek gücü 0–1 (koyu/karışık çekimde krem ışık güçlenir) */
  wash: number;
}

export interface CicekBeat {
  title: string;
  text: string;
  shot: CicekShot;
}

export interface CicekContent {
  /** Mono etiket "BAHAR" + vuruş sayısı kadar nokta */
  label: string;
  /** Ekran okuyucu başlığı (görsel başlık vuruşların kendisi) */
  srTitle: string;
  /** dört vuruş, sırayla: çiçek · don · yaprak dökümü · hasada doğru */
  beats: CicekBeat[];
  still: {
    /** Hiç video yoksa kullanılan durağan foto. -1200.webp / -2400.webp / -1600.avif ailesinin ortak yolu */
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
      shot: {
        base: '/media/video/bahar-1',
        alt: 'Şafakta çiçek açmış kayısı bahçesi; kamera iki ağaç sırasının arasından yavaşça ilerliyor.',
        wash: 0.25,
      },
    },
    {
      title: 'En büyük korku dondur.',
      text: 'Çiçek açtıktan sonra gelen soğuk bir gece, o yılın meyvesini götürebilir. Don riski nisan ortasına kadar sürer.',
      shot: {
        base: '/media/video/bahar-2',
        alt: 'Şafak öncesi mavi ışıkta kenarlarını kırağı tutmuş kayısı çiçekleri, yakın plan.',
        wash: 1,
      },
    },
    {
      title: 'Sonra yapraklar dökülür.',
      text: 'Taç yaprakları dökülen çiçeğin yerinde küçük, yeşil bir meyve kalır.',
      shot: {
        base: '/media/video/bahar-3',
        alt: 'Arkadan vuran ışıkta kayısı dalları; taç yaprakları kadrajın içinden süzülüp düşüyor.',
        wash: 0.55,
      },
    },
    {
      title: 'Hasada üç ay var.',
      text: 'Meyve bahar boyunca büyür, haziranda sararır. Toplama temmuz başında başlar.',
      shot: {
        base: '/media/video/bahar-4',
        alt: 'Yapraklar arasında küçük, yeşil, ham kayısılar; arkada sıcak bir güneş parlaması.',
        wash: 0.6,
      },
    },
  ],
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
