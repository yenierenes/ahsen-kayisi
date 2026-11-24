import type { Link, SectionHeading } from '../types';

/** -1200.webp / -2400.webp / -1600.avif ailesinden bir fotoğraf */
export interface SurecPhoto {
  base: string;
  width: number;
  height: number;
  widthLg: number;
  widthAvif: number;
  alt: string;
  /** object-position */
  position?: string;
}

export interface SurecStep {
  id: string;
  title: string;
  /** Mono etiket: ay / süre / an */
  when: string;
  /** İki cümle, doğru ticari terimlerle */
  copy: string;
  photo: SurecPhoto;
}

export interface SurecContent {
  heading: SectionHeading;
  intro: string;
  steps: SurecStep[];
  cta: Link;
}

const WIDE = { width: 1200, height: 670, widthLg: 2400, widthAvif: 1600 } as const;
const TALL916 = { width: 670, height: 1200, widthLg: 1340, widthAvif: 893 } as const;
const TALL = { width: 967, height: 1200, widthLg: 1856, widthAvif: 1289 } as const;

// Adımlar arastirma/02-malatya-kayisi.md §2.4 (takvim) ve §5 (süreç) ile uyumludur.
export const surec: SurecContent = {
  heading: { no: '', title: 'Daldan kutuya.' },
  intro: 'Kayısının çiçekten koliye girene kadar geçtiği sekiz aşama.',
  steps: [
    {
      id: 'cicek',
      title: 'Çiçek',
      when: 'Mart sonu',
      copy: 'Kayısı ağaçları mart sonunda çiçek açar. Nisan ortasına kadar don riski vardır; çiçek donarsa o yıl meyve olmaz.',
      photo: {
        base: '/media/foto/cicek-safak',
        ...WIDE,
        alt: 'Şafakta, çiçek açmış kayısı ağaçlarından oluşan bahçe sırası; ardında karlı dağlar.',
        position: '50% 60%',
      },
    },
    {
      id: 'hasat',
      title: 'Hasat',
      when: 'Temmuz',
      copy: 'Meyve temmuzda, rengi saman sarısına döndüğünde toplanır. Hasat sabah erken saatte yapılır ve ağacın üst dallarından başlar.',
      photo: {
        base: '/media/foto/hasat-eller',
        ...TALL,
        alt: 'Bir çiftçinin nasırlı elleri, kayısı bahçesinde olgun kayısıları tahta bir kasaya yerleştiriyor.',
        position: '50% 50%',
      },
    },
    {
      id: 'islim',
      title: 'İslim',
      when: 'Hasat günü',
      copy: 'Sarı kayısı için meyve kerevetlere dizilir ve islim odasında sekiz on saat kükürt dumanında bekletilir. Kükürt, kayısının sarı rengini korur. Gün kurusu kayısıya bu işlem uygulanmaz.',
      photo: {
        base: '/media/foto/islim',
        ...TALL,
        alt: 'Tuğla duvarlı küçük bir islim odasında, kapı aralığından giren ışıkta kerevetlere dizilmiş taze kayısılar ve ince bir duman.',
        position: '50% 50%',
      },
    },
    {
      id: 'sergi',
      title: 'Sergi',
      when: 'Üç dört gün',
      copy: 'Kayısı sergi yerinde örtülerin üzerine tek kat serilir ve üç dört gün güneşte bekler.',
      photo: {
        base: '/media/foto/sergi-drone',
        ...WIDE,
        alt: 'Malatya’da kayısı serilen sergi alanları, drone görünümü.',
        position: '40% 50%',
      },
    },
    {
      id: 'patik',
      title: 'Patik',
      when: 'Üçüncü gün',
      copy: 'Yarı kuruyan kayısının çekirdeği elle çıkarılır ve meyveye yassı şekli verilir. Bu işe patik denir. Kayısı sonra iki üç gün daha güneşte kalır.',
      photo: {
        base: '/media/foto/sergi-tepeden',
        ...WIDE,
        alt: 'Serili kayısı tavalarının arasında çalışan işçiler; tepeden görünüm.',
        position: '60% 50%',
      },
    },
    {
      id: 'secme',
      title: 'Yıkama, seçme',
      when: 'Tesiste',
      copy: 'Kuruyan kayısı tesiste yıkanır. Bant üzerinde tek tek kontrol edilir; lekeli ve yarık taneler ayrılır.',
      photo: {
        base: '/media/foto/tesis-secim',
        ...TALL916,
        alt: 'Tesiste paslanmaz çelik bantta ilerleyen kuru kayısılar; iki yanda eldivenli ellerle tane tane ayıklanıyor.',
        position: '50% 50%',
      },
    },
    {
      id: 'kalibrasyon',
      title: 'Boylama',
      when: 'Kiloda tane hesabı',
      copy: 'Kayısı iriliğine göre sınıflara ayrılır. Ölçü, bir kiloya giren tane sayısıdır: jumboda en çok 80, sekiz numarada 221–240 tane.',
      photo: {
        base: '/media/foto/urun-sari',
        ...TALL,
        alt: 'Sarı kuru kayısı, düz çekim.',
        position: '50% 50%',
      },
    },
    {
      id: 'paketleme',
      title: 'Paketleme',
      when: 'Yola çıkmadan',
      copy: 'Kayısı tartılır ve kolilenir. Her koliye parti numarası yazılır; sevkiyata kadar serin depoda tutulur.',
      photo: {
        base: '/media/foto/paketleme',
        ...TALL,
        alt: 'Mavi eldivenli eller, paslanmaz çelik masada açık bir koliye dizilmiş kuru kayısıların üst katmanını düzeltiyor.',
        position: '50% 50%',
      },
    },
  ],
  cta: { label: 'Ürünlere bakın', href: '#urunler' },
};
