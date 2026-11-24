import type { Link, SectionHeading } from '../types';

/** Manifesto paragrafının parçaları: düz metin ya da vurgulu (italik) bölüm */
export type StatementPart = string | { em: string };

export interface ManifestoNote {
  label: string;
  value: string;
}

export interface ManifestoFloat {
  /** Saydam kesim görseli (500px genişlik) */
  src: string;
  width: number;
  height: number;
}

export interface ManifestoContent {
  heading: SectionHeading;
  /** Kaydırdıkça renkle dolan ana paragraf (3–4 cümle) */
  statement: StatementPart[];
  /** Mono yan notlar */
  notes: ManifestoNote[];
  /** Yüzen kesimler: 5 kuru kayısı (süs; alt metin yok). Çiçekler "BAHAR" sahnesinde sürüklenir. */
  floats: ManifestoFloat[];
  portrait: {
    /** -1200.webp / -2400.webp / -1600.avif ailesinin ortak yolu */
    base: string;
    width: number;
    height: number;
    widthLg: number;
    widthAvif: number;
    alt: string;
    caption: string;
    /** object-position: dikey kadrajda işçilerin kalması için */
    position: string;
  };
  cta: Link;
}

export const manifesto: ManifestoContent = {
  heading: { no: '', title: 'Ahsen' },
  statement: [
    'Malatya’da kayısıyı herkes kurutur. Biz seçeriz: hangi bahçe, hangi dal, hangi gün. İyisini ayırır, gerisini kutuya koymayız. Ahsen’de kural kısa: ',
    { em: 'önce kalite.' },
    ' Kutuyu açan, bunu sormadan anlar.',
  ],
  notes: [
    { label: 'Yer', value: 'Battalgazi, Malatya' },
    { label: 'Kural', value: 'Önce kalite' },
    { label: 'Hasat', value: 'Temmuz başı – ağustos ortası' },
  ],
  floats: [
    { src: '/media/kesim/kuru-3-500.webp', width: 473, height: 500 },
    { src: '/media/kesim/kuru-1-500.webp', width: 453, height: 500 },
    { src: '/media/kesim/kuru-5-500.webp', width: 423, height: 500 },
    { src: '/media/kesim/kuru-2-500.webp', width: 483, height: 500 },
    { src: '/media/kesim/kuru-4-500.webp', width: 460, height: 500 },
  ],
  portrait: {
    base: '/media/foto/sergi-tepeden',
    width: 1200,
    height: 670,
    widthLg: 2400,
    widthAvif: 1600,
    alt: 'Malatya’da sergi alanlarında, serili kayısı tavalarının arasında çalışan işçiler; tepeden görünüm.',
    caption: 'Sergi yeri, temmuz',
    position: '60% 50%',
  },
  cta: { label: 'Kayısı nasıl kurur?', href: '#surec' },
};
