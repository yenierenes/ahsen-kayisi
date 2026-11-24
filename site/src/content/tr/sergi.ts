export interface SergiContent {
  title: string;
  chips: [string, string, string];
  caption: string;
  video: {
    src: string;
    srcMobile: string;
    poster: string;
    alt: string;
  };
  /** Video dosyaları yoksa gösterilen durağan kare ("drone push-in" döngüsüyle) */
  still: {
    avif: string;
    webp: string;
    webpLarge: string;
    alt: string;
  };
  toggle: { pause: string; play: string };
}

export const sergi: SergiContent = {
  title: 'Temmuzda toprak turuncuya döner.',
  chips: ['Günde 12 saat güneş', 'Ayda 4 mm yağmur', 'Rakım 950 metre'],
  caption: 'Malatya’da temmuz ayı. Toplanan kayısı sergi yerine serilir ve güneşte kurumaya bırakılır.',
  video: {
    src: '/media/video/v-sergi-drone.mp4',
    srcMobile: '/media/video/v-sergi-drone-m.mp4',
    poster: '/media/video/v-sergi-drone.jpg',
    alt: 'Altın saatte, turuncu kayısılarla kaplı sergi alanlarının üzerinden süzülen drone görüntüsü.',
  },
  still: {
    avif: '/media/foto/sergi-drone-1600.avif',
    webp: '/media/foto/sergi-drone-1200.webp',
    webpLarge: '/media/foto/sergi-drone-2400.webp',
    alt: 'Altın saatte, turuncu kayısılarla kaplı sergi alanlarının havadan görünümü.',
  },
  toggle: { pause: 'Videoyu durdur', play: 'Videoyu oynat' },
};
