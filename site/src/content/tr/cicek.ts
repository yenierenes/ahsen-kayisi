/**
 * Çiçek — "BAHAR" sahnesi (Rakamlar ile Süreç arasında, numarasız).
 * Çiçek açmış kayısı sırası boyunca kaydırmayla ilerleyen görüntü dizisi;
 * üç vuruş, her biri bir Fraunces satırı + bir kısa cümle.
 */

export interface CicekBeat {
  title: string;
  text: string;
}

export interface CicekContent {
  /** Mono etiket: "BAHAR · 01 / 03" */
  label: string;
  /** Ekran okuyucu başlığı (görsel başlık vuruşların kendisi) */
  srTitle: string;
  beats: [CicekBeat, CicekBeat, CicekBeat];
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
      title: 'Her şey beyaz başlar.',
      text: 'Mart sonunda Malatya ovası bir haftalığına çiçek açar.',
    },
    {
      title: 'Bir gece don, bir yıl kayıp.',
      text: 'Çiçek dona yakalanırsa o dalda meyve olmaz. Nisan ortasına kadar herkes göğe bakar.',
    },
    {
      title: 'Yüz gün sonra aynı dal turuncu.',
      text: 'Çiçekten hasada aşağı yukarı yüz gün var. Temmuzda toplamaya çıkılır.',
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
