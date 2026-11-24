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
  heading: { no: '', title: 'Tadına bakmadan olmaz.' },
  eyebrow: 'Numune',
  lead: 'Ne aradığınızı yazın: hangi ürün, hangi boy, hangi ülke. Bir kutu kayısı gönderelim, gerisini kayısı anlatsın.',
  form: {
    label: 'Numune talep formu',
    fields: {
      name: {
        id: 'f-ad',
        name: 'ad',
        label: 'Ad Soyad',
        autocomplete: 'name',
        required: 'Adınızı yazar mısınız?',
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
        required: 'Numune hangi ülkeye gidecek?',
      },
      email: {
        id: 'f-eposta',
        name: 'eposta',
        label: 'E-posta',
        autocomplete: 'email',
        required: 'Size dönebilmemiz için e-posta lazım.',
        invalid: 'Bu adres eksik görünüyor. Örnek: ad@firma.com',
      },
      message: {
        id: 'f-mesaj',
        name: 'mesaj',
        label: 'Notunuz',
        optional: true,
        placeholder: 'Ne kadar, hangi ambalajda, nereye? Aklınıza ne geliyorsa.',
      },
    },
    products: {
      legend: 'Hangisi?',
      hint: 'Birkaçını birden seçebilirsiniz.',
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
      label: 'Boy',
      options: [
        { value: '', label: 'Siz önerin' },
        { value: '0', label: 'Jumbo · kiloda en çok 80 tane' },
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
    submit: 'Numune iste',
    note: 'Ad, ülke ve e-posta yeter.',
    summaryError: 'İşaretli alanlara bir daha bakar mısınız?',
  },
  success: {
    title: 'Aldık.',
    text: 'Talebinize bakıp {email} adresine yazacağız.',
    prototype: 'Prototip — form henüz bir adrese bağlı değil.',
    again: 'Bir talep daha',
  },
  contact: {
    label: 'Ya da doğrudan',
    address: {
      label: 'Adres',
      lines: ['Yeni Hamam Mah. Cezmi Kartay No: 16/B', 'Battalgazi / Malatya'],
    },
    phone: { label: 'Telefon', value: '+90 538 731 87 00', href: 'tel:+905387318700' },
    email: { label: 'E-posta', value: 'mail@ahsenkayisi.com', href: 'mailto:mail@ahsenkayisi.com' },
  },
  clock: {
    label: 'Malatya’da saat',
    timeZone: 'Europe/Istanbul',
    zone: 'UTC+3',
    placeholder: '--:--',
  },
};
