/**
 * Numune formu — yalnız ön yüz.
 * Satır içi doğrulama (blur'da başlar, sonra her tuşta güncellenir), ilk hatalı
 * alana odak, gönderimde ağ çağrısı olmadan başarı durumu.
 *
 * TODO(entegrasyon): sunucu uç noktası bağlandığında `submitSample()` içindeki
 * `payload` gönderilmeli (fetch POST + hata durumu). Şu an hiçbir veri ayrılmaz.
 */

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function initForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-sample-form]');
  if (!form) return;
  const success = document.querySelector<HTMLElement>('[data-success]');
  const summary = form.querySelector<HTMLElement>('[data-form-summary]');
  const controls = Array.from(form.querySelectorAll<Control>('input[required], textarea[required], select[required]'));
  const touched = new WeakSet<Control>();

  const messageFor = (el: Control): string => {
    const value = el.value.trim();
    if (el.required && value === '') return el.dataset.msgRequired ?? '';
    if (el instanceof HTMLInputElement && el.type === 'email' && value !== '' && !EMAIL.test(value)) {
      return el.dataset.msgInvalid ?? el.dataset.msgRequired ?? '';
    }
    return '';
  };

  const paint = (el: Control): boolean => {
    const msg = messageFor(el);
    const field = el.closest<HTMLElement>('[data-field]');
    const out = document.getElementById(`${el.id}-msg`);
    field?.classList.toggle('is-invalid', msg !== '');
    if (out) out.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    return msg === '';
  };

  controls.forEach((el) => {
    el.addEventListener('blur', () => {
      touched.add(el);
      paint(el);
    });
    el.addEventListener('input', () => {
      if (touched.has(el)) paint(el);
      if (summary?.textContent) summary.textContent = '';
    });
  });

  const clearAll = (): void => {
    controls.forEach((el) => {
      field(el)?.classList.remove('is-invalid');
      el.removeAttribute('aria-invalid');
      const out = document.getElementById(`${el.id}-msg`);
      if (out) out.textContent = '';
    });
    if (summary) summary.textContent = '';
  };
  const field = (el: Control): HTMLElement | null => el.closest<HTMLElement>('[data-field]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    controls.forEach((el) => touched.add(el));
    const invalid = controls.filter((el) => !paint(el));
    if (invalid.length) {
      if (summary) summary.textContent = form.dataset.summaryError ?? '';
      invalid[0]?.focus();
      return;
    }
    submitSample(form, success);
  });

  const again = success?.querySelector<HTMLButtonElement>('[data-success-again]');
  again?.addEventListener('click', () => {
    form.reset();
    clearAll();
    controls.forEach((el) => touched.delete(el));
    if (success) success.hidden = true;
    form.hidden = false;
    form.querySelector<HTMLElement>('input')?.focus();
  });
}

function submitSample(form: HTMLFormElement, success: HTMLElement | null): void {
  // Henüz hiçbir yere gönderilmez (bkz. dosya başı TODO).
  const data = new FormData(form);
  const payload = {
    ad: String(data.get('ad') ?? ''),
    firma: String(data.get('firma') ?? ''),
    ulke: String(data.get('ulke') ?? ''),
    eposta: String(data.get('eposta') ?? ''),
    urunler: data.getAll('urun').map(String),
    kalibre: String(data.get('kalibre') ?? ''),
    mesaj: String(data.get('mesaj') ?? ''),
  };
  if (!success) return;

  const text = success.querySelector<HTMLElement>('[data-success-text]');
  if (text) text.textContent = (form.dataset.successText ?? '').replace('{email}', payload.eposta);
  form.hidden = true;
  success.hidden = false;
  success.querySelector<HTMLElement>('[data-success-title]')?.focus({ preventScroll: false });
}

initForm();
