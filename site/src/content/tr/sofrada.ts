import type { Link } from '../types';

/** "Kutu açılınca." — kalibre aracının yerine gelen kullanım sahnesi.
 *  Kayısı burada ürün yığını olarak değil, gittiği yerde görünür: sofra, tezgâh, atölye. */

export interface SofraPhoto {
  /** -1200.webp / -2400.webp / -1600.avif ailesinin ortak yolu */
  base: string;
  width: number;
  height: number;
  widthLg: number;
  widthAvif: number;
  alt: string;
}

export interface SofraItem {
  id: string;
  /** Dev listede görünen ad */
  title: string;
  /** Tek cümlelik not */
  text: string;
  /** O kullanıma giden ürün ve boy */
  pick: string;
  photo: SofraPhoto;
}

export interface SofradaContent {
  /** Mono bölüm etiketi (numara yok) */
  label: string;
  title: string;
  lead: string;
  /** "pick" satırının önündeki mono etiket */
  pickLabel: string;
  items: SofraItem[];
  /** Boy numaralarının nasıl okunduğunu anlatan tek satır */
  footnote: string;
  cta: Link;
}

const WIDE = { width: 1200, height: 670, widthLg: 2400, widthAvif: 1600 } as const;

export const sofrada: SofradaContent = {
  label: 'Kullanım',
  title: 'Nerede kullanılır?',
  lead: 'Kayısının çeşidi ve boyu, kullanılacağı yere göre seçilir. En sık sorulan beş kullanım:',
  pickLabel: 'Önerimiz',
  items: [
    {
      id: 'kahvalti',
      title: 'Kahvaltı sofrası',
      text: 'Sofrada tek başına yenen kayısının iri ve etli olması istenir.',
      pick: 'Sarı kayısı · Jumbo – No.2',
      photo: {
        base: '/media/foto/sofra-kahvalti',
        ...WIDE,
        alt: 'Keten örtülü kahvaltı sofrası; ortadaki kâsede iri kuru kayısılar, bir el kâseye uzanıyor.',
      },
    },
    {
      id: 'pastane',
      title: 'Pastane tezgâhı',
      text: 'Tart ve pastaların üstünde bütün kayısı kullanılır.',
      pick: 'Sarı kayısı · No.3 – No.5',
      photo: {
        base: '/media/foto/sofra-pastane',
        ...WIDE,
        alt: 'Mermer tezgâhta küçük tartların üstüne kayısı yerleştiren pasta şefinin elleri.',
      },
    },
    {
      id: 'cikolata',
      title: 'Çikolata atölyesi',
      text: 'Çikolataya batırılacak kayısıların aynı boyda olması gerekir.',
      pick: 'Sarı kayısı · No.2 – No.4',
      photo: {
        base: '/media/foto/sofra-cikolata',
        ...WIDE,
        alt: 'Kuru kayısıyı yarısına kadar bitter çikolataya batıran parmaklar; arkada sıra sıra kuruyan kayısılar.',
      },
    },
    {
      id: 'musli',
      title: 'Müsli ve bar',
      text: 'Karışıma eşit dağılması için küp doğranmış kayısı tercih edilir.',
      pick: 'Küp doğranmış kayısı',
      photo: {
        base: '/media/foto/sofra-musli',
        ...WIDE,
        alt: 'Ahşap masada yulaflı, fındıklı ve küp kayısılı granola kâsesi; bir el süt döküyor.',
      },
    },
    {
      id: 'hediye',
      title: 'Hediye kutusu',
      text: 'Hediyelik kutulara en iri kayısılar dizilir.',
      pick: 'Jumbo sarı kayısı ve gün kurusu',
      photo: {
        base: '/media/foto/sofra-hediye',
        ...WIDE,
        alt: 'Sıra sıra sarı kayısı ve gün kurusu dizili koyu yeşil hediye kutusuna kurdele bağlayan eller.',
      },
    },
  ],
  footnote: 'Numara küçüldükçe tane irileşir: Jumbo’da kiloya en çok 80 tane girer, No.8’de 221–240.',
  cta: { label: 'Numune isteyin', href: '#iletisim' },
};
