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
    'Ahsen Kayısı, Malatya’da güneşte kurutulan kayısıyı seçer, paketler ve yurt içine, yurt dışına gönderir. Sarı kayısı, gün kurusu, organik, küp doğranmış kayısı ve kayısı çekirdeği.',
  ogImage: '/seq/hero/f_0192.webp',
  ogLocale: 'tr_TR',
};
