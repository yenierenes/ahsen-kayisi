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
    "Malatya'dan, güneşte kurutulmuş kayısı. Ahsen Kayısı; bahçeden kutuya her partide aynı özenle üretir ve dünyaya gönderir.",
  ogImage: '/seq/hero/f_0192.webp',
  ogLocale: 'tr_TR',
};
