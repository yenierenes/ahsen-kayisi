export interface MetaContent {
  lang: string;
  dir: 'ltr' | 'rtl';
  title: string;
  description: string;
  ogImage: string;
  ogLocale: string;
}

export const meta: MetaContent = {
  lang: 'tr',
  dir: 'ltr',
  title: 'Ahsen Kayısı — Güneşin meyvesi',
  description:
    'Malatya’nın güneşinde kuruyan kayısı. Sarısı, gün kurusu, doğranmışı: Ahsen Kayısı’ndan sofranıza ve tezgâhınıza.',
  ogImage: '/seq/hero/f_0192.webp',
  ogLocale: 'tr_TR',
};
