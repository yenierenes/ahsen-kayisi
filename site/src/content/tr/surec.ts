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
  heading: { no: '03', title: 'Bahçeden kutuya, sekiz adım.' },
  intro: 'Kayısı mart sonunda çiçek açar, temmuzda toplanır; kutuya girmeden önce sekiz durak geçer.',
  steps: [
    {
      id: 'cicek',
      title: 'Çiçek',
      when: 'Mart sonu – Nisan başı',
      copy: "Ağaçlar mart sonu ile nisan başı arasında tam çiçek açar. Don riski nisan ortasına kadar sürer; bu haftalar sezonun en kırılgan günleridir.",
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
      when: 'Temmuz başı – Ağustos ortası',
      copy: "Meyve %22–28 briks'e ulaşıp saman sarısı rengini aldığında, günün erken saatlerinde toplanır. Önce güneş gören tepe dallar, sonra orta ve alt dallar: hasat kademelidir.",
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
      when: 'Hasat günü · 8–10 saat',
      copy: 'Kükürtlü kuru kayısıda meyve kerevetlere dizilir, islim odasında yakılan kükürtün gazıyla rengini altın sarısında korur. Gün kurusu bu adımı atlar; meyve doğrudan güneşe serilir.',
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
      when: '3–4 gün · nem %40–50',
      copy: "Kayısı sergi yerinde, temiz örtülerin üzerine serilir. Nemi %40–50'ye inene kadar üç dört gün güneşte kalır.",
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
      when: 'Kurutmanın 3. günü',
      copy: "Yarı kuru meyvenin çekirdeği elle çıkarılır, kayısı bastırılarak yassılaştırılır ve şeklini bulur. Patiklenen meyve ikinci kez sergiye döner; 2–3 gün sonra nem %20–25'e iner.",
      photo: {
        base: '/media/foto/sergi-tepeden',
        ...WIDE,
        alt: 'Serili kayısı tavalarının arasında çalışan işçiler; tepeden görünüm.',
        position: '60% 50%',
      },
    },
    {
      id: 'secme',
      title: 'Yıkama & Seçme',
      when: 'Tesiste · nem dengeleme',
      copy: 'Meyve yıkanır, nemi dengelenir. Işıklı bantlarda yabancı madde ve kusurlu taneler ayıklanır; kutuya yalnızca standardı tutturan kayısı geçer.',
      photo: {
        base: '/media/foto/tesis-secim',
        ...TALL916,
        alt: 'Tesiste paslanmaz çelik bantta ilerleyen kuru kayısılar; iki yanda eldivenli ellerle tane tane ayıklanıyor.',
        position: '50% 50%',
      },
    },
    {
      id: 'kalibrasyon',
      title: 'Kalibrasyon',
      when: 'Tane/kg ölçüsüyle',
      copy: "Kayısı boylanır ve kiloda kaç tane girdiğine göre numaralara ayrılır: Jumbo'da kiloda en çok 80 tane, 8 numarada 221–240 tane. Aynı boydaki taneler aynı kutuya girer.",
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
      when: 'Sevkiyat öncesi',
      copy: 'Tartılıp paketlenen kolilerin tamamı metal dedektöründen geçer. Etikette firma, net ağırlık, lot ve menşe yazar; sevkiyata kadar serin ve kuru depoda bekler.',
      photo: {
        base: '/media/foto/paketleme',
        ...TALL,
        alt: 'Mavi eldivenli eller, paslanmaz çelik masada açık bir koliye dizilmiş kuru kayısıların üst katmanını düzeltiyor.',
        position: '50% 50%',
      },
    },
  ],
  cta: { label: 'Ürünleri keşfedin', href: '#urunler' },
};
