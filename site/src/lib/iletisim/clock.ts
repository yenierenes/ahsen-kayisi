/**
 * "Malatya'da şu an" — Europe/Istanbul yerel saati (HH:MM), dakikada bir tazelenir.
 * Sekme gizliyken güncellenmez; geri gelince hemen tazelenir.
 */
function initClock(): void {
  const wrap = document.querySelector<HTMLElement>('[data-clock-wrap]');
  const out = wrap?.querySelector<HTMLElement>('[data-clock]');
  if (!wrap || !out) return;

  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: wrap.dataset.tz || 'Europe/Istanbul',
    });
  } catch {
    return; // saat dilimi desteklenmiyorsa yer tutucu kalır
  }

  const paint = (): void => {
    out.textContent = fmt.format(new Date());
  };
  paint();
  window.setInterval(() => {
    if (!document.hidden) paint();
  }, 15_000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) paint();
  });
}

initClock();
