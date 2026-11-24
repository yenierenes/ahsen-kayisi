/** Ortak içerik tipleri. Bölüme özel tipler kendi içerik dosyasında tanımlanır. */

/** Numaralı bölüm başlığı: "03 — Bahçeden kutuya, sekiz adım." */
export interface SectionHeading {
  /** "03" gibi iki haneli numara; numarasız bölümde boş string */
  no: string;
  title: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface Media {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}
