// Dil haritası. Yeni dil: src/content/<kod>/ klasörünü tr/ ile aynı yapıda kur
// (tipleri ../tr/<bölüm> dosyalarından içe aktar) ve aşağıya ekle.
import { tr } from './tr';

export type SiteContent = typeof tr;

export const content = {
  tr,
} satisfies Record<string, SiteContent>;

export type Locale = keyof typeof content;
export const defaultLocale: Locale = 'tr';

export function getContent(locale: Locale = defaultLocale): SiteContent {
  return content[locale];
}
