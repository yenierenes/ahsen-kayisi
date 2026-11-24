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
  intro: 'Arada bir bahar, bir yaz ve çok el emeği var.',
  steps: [
    {
      id: 'cicek',
      title: 'Çiçek',
      when: 'Mart sonu',
      copy: 'Ağaç önce çiçeğe durur. Nisan ortasına kadar don korkusu bitmez; o yılın kayısısı bu üç haftada belli olur.',
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
      copy: 'Meyve saman sarısına dönünce, sabah serinliğinde toplanır. Ağaç bir günde boşalmaz: önce güneşi gören tepe dallar, sonra aşağısı.',
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
      copy: 'Sarı kayısının sırrı burada. Meyve kerevetlere dizilir, islim odasında sekiz on saat kükürt dumanında bekler; rengi altın sarısı kalır. Gün kurusu bu odaya hiç girmez.',
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
      copy: 'Kayısı yere, temiz örtülerin üstüne tek kat serilir. Gerisi güneşin işi.',
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
      copy: 'Yarı kuruyan meyvenin çekirdeği parmakla itilip çıkarılır, kayısı avuçta yassılır. Bildiğiniz o şekil makineden değil, elden çıkar. Sonra iki üç gün daha güneş.',
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
      copy: 'Kayısı yıkanır, bantta tane tane gözden geçer. Lekeli, yarık, küçük kalan ayrılır.',
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
      copy: 'Kayısı iriliğine göre numara alır: kiloya seksen taneden az giriyorsa jumbo, iki yüz yirmiden çok giriyorsa sekiz numara. Numara küçüldükçe tane büyür.',
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
      copy: 'Tartılır, kolilenir, etiketine parti numarası yazılır: hangi kayısı hangi günden, belli olsun. Sonrası serin depo ve yol.',
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
