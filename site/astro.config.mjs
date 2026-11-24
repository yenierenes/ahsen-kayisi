// @ts-check
import { defineConfig } from 'astro/config';

// Statik çıktı, UI framework yok. Motion kütüphanesi src/lib/motion altında vanilla TS.
export default defineConfig({
  output: 'static',
  site: 'https://ahsenkayisi.example', // DOĞRULANMADI: gerçek alan adı gelince değiştir
  server: { port: 4321, host: true },
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { target: 'es2022' },
  },
});
