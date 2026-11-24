import type { SectionHeading } from '../types';

export interface IletisimOption {
  value: string;
  label: string;
}

export interface IletisimField {
  id: string;
  name: string;
  label: string;
  optional?: boolean;
  autocomplete?: string;
  /** Boşken gösterilen hata */
  required?: string;
  /** Biçim hatası (yalnız e-posta) */
  invalid?: string;
}

export interface IletisimContent {
  heading: SectionHeading;
  /** h2 yalnız metin; vurgulu ikinci satır CSS ile italik */
  eyebrow: string;
  lead: string;
  form: {
    label: string;
    fields: {
      name: IletisimField;
      company: IletisimField;
      country: IletisimField;
      email: IletisimField;
      message: IletisimField & { placeholder: string };
    };
    products: { legend: string; hint: string; options: IletisimOption[] };
    caliber: { id: string; name: string; label: string; options: IletisimOption[] };
    optionalLabel: string;
    submit: string;
    note: string;
    summaryError: string;
  };
  success: {
    title: string;
    /** {email} gönderenin adresiyle değiştirilir */
    text: string;
    /** Prototip uyarısı: form henüz hiçbir yere gönderilmiyor (mono, küçük) */
    prototype: string;
    again: string;
  };
  contact: {
    label: string;
    address: { label: string; lines: string[] };
    phone: { label: string; value: string; href: string };
    email: { label: string; value: string; href: string };
  };
  clock: { label: string; timeZone: string; zone: string; placeholder: string };
}

export const iletisim: IletisimContent = {
  heading: { no: '', title: 'Numuneniz yola çıksın.' },
  eyebrow: 'Numune talebi',
  lead: 'Hangi ürünle ilgilendiğinizi, hangi kalibreyi aradığınızı ve nereye göndereceğimizi yazın. Gerisini birlikte netleştirelim.',
  form: {
    label: 'Numune talep formu',
    fields: {
      name: {
        id: 'f-ad',
        name: 'ad',
        label: 'Ad Soyad',
        autocomplete: 'name',
        required: 'Adınızı ve soyadınızı yazın.',
      },
      company: {
        id: 'f-firma',
        name: 'firma',
        label: 'Firma',
        optional: true,
        autocomplete: 'organization',
      },
      country: {
        id: 'f-ulke',
        name: 'ulke',
        label: 'Ülke',
        autocomplete: 'country-name',
        required: 'Numunenin gideceği ülkeyi yazın.',
      },
      email: {
        id: 'f-eposta',
        name: 'eposta',
        label: 'E-posta',
        autocomplete: 'email',
        required: 'E-posta adresinizi yazın.',
        invalid: 'Geçerli bir e-posta adresi yazın, örneğin ad@firma.com.',
      },
      message: {
        id: 'f-mesaj',
        name: 'mesaj',
        label: 'Mesajınız',
        optional: true,
        placeholder: 'Miktar, ambalaj, hedef pazar ya da sormak istedikleriniz.',
      },
    },
    products: {
      legend: 'İlgilendiğiniz ürünler',
      hint: 'Birden fazla seçebilirsiniz.',
      options: [
        { value: 'sari', label: 'Sarı kayısı' },
        { value: 'gun-kurusu', label: 'Gün kurusu' },
        { value: 'kup', label: 'Küp doğranmış' },
        { value: 'organik', label: 'Organik' },
        { value: 'cekirdek', label: 'Kayısı çekirdeği' },
      ],
    },
    caliber: {
      id: 'f-kalibre',
      name: 'kalibre',
      label: 'Kalibre',
      options: [
        { value: '', label: 'Henüz karar vermedim' },
        { value: '0', label: 'Jumbo · 80’e kadar tane/kg' },
        { value: '1', label: 'No.1 · 81–100' },
        { value: '2', label: 'No.2 · 101–120' },
        { value: '3', label: 'No.3 · 121–140' },
        { value: '4', label: 'No.4 · 141–160' },
        { value: '5', label: 'No.5 · 161–180' },
        { value: '6', label: 'No.6 · 181–200' },
        { value: '7', label: 'No.7 · 201–220' },
        { value: '8', label: 'No.8 · 221–240' },
      ],
    },
    optionalLabel: 'isteğe bağlı',
    submit: 'Numune talep et',
    note: 'Ad, ülke ve e-posta zorunludur.',
    summaryError: 'Lütfen işaretli alanları gözden geçirin.',
  },
  success: {
    title: 'Talebiniz bize ulaştı.',
    text: 'Numune talebinizi inceleyip {email} adresine döneceğiz.',
    prototype: 'Prototip — form henüz bir adrese bağlı değil.',
    again: 'Yeni bir talep yaz',
  },
  contact: {
    label: 'Doğrudan ulaşın',
    address: {
      label: 'Adres',
      lines: ['Yeni Hamam Mah. Cezmi Kartay No: 16/B', 'Battalgazi / Malatya'],
    },
    phone: { label: 'Telefon', value: '+90 538 731 87 00', href: 'tel:+905387318700' },
    email: { label: 'E-posta', value: 'mail@ahsenkayisi.com', href: 'mailto:mail@ahsenkayisi.com' },
  },
  clock: {
    label: 'Malatya’da şu an',
    timeZone: 'Europe/Istanbul',
    zone: 'UTC+3',
    placeholder: '--:--',
  },
};
