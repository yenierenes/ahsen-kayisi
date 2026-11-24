// GitHub Pages önizlemesi için dist/ sonrası işlem.
// Site kökten (/media, /seq) yol kullanıyor; Pages proje sitesi alt yoldan (/<repo>/) yayınlanır.
// Bu betik dist içindeki kök yolları taban yol ile öne ekler, noindex meta ekler ve .nojekyll yazar.
// Kullanım: node scripts/pages-postbuild.mjs /ahsen-kayisi
import fs from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || '').replace(/\/+$/, '');
if (!base.startsWith('/')) { console.error('taban yol gerekli, örn. /ahsen-kayisi'); process.exit(1); }
const dist = path.resolve('dist');
const re = /(?<![\w.\-/])\/(media|seq)\//g;
const reFav = /(?<![\w.\-/])\/favicon\.svg/g;
let files = 0, hits = 0;
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(html|js|mjs|css|json|webmanifest|xml|txt)$/i.test(e.name)) continue;
    if (p.includes(`${path.sep}seq${path.sep}`) || p.includes(`${path.sep}media${path.sep}`)) continue; // veri dosyaları göreli yol kullanır
    let s = fs.readFileSync(p, 'utf8');
    const before = s;
    s = s.replace(re, (m, d) => { hits++; return `${base}/${d}/`; });
    s = s.replace(reFav, () => { hits++; return `${base}/favicon.svg`; });
    s = s.replace(/(\.github\.io)\/(media|seq)\//g, (m, h, d) => { hits++; return `${h}${base}/${d}/`; }); // og:image gibi tam URL'ler
    if (e.name.endsWith('.html') && !/name=["']robots["']/i.test(s)) {
      s = s.replace(/<head([^>]*)>/i, `<head$1><meta name="robots" content="noindex,nofollow">`);
    }
    if (s !== before) { fs.writeFileSync(p, s); files++; }
  }
};
walk(dist);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');
console.log(JSON.stringify({ base, files, hits }));
