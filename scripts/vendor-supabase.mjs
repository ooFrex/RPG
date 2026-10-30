// Copia o supabase-js (versão FIXA em package.json) de node_modules para js/vendor/supabase.js.
// Assim o site não depende do jsDelivr (o index.html/coc.html procuram esse arquivo primeiro).
// Uso:  npm install && npm run vendor      (o "npm run build" já chama este script)
// Publique js/vendor/supabase.js junto com o site (é commitado no repositório).
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SRC = 'node_modules/@supabase/supabase-js/dist/umd/supabase.js';
const OUT = 'js/vendor/supabase.js';
if (!existsSync(SRC)) {
  console.error('Não achei ' + SRC + '. Rode "npm install" antes.');
  process.exit(1);
}
const want = JSON.parse(readFileSync('package.json', 'utf8')).devDependencies['@supabase/supabase-js'];
const have = JSON.parse(readFileSync('node_modules/@supabase/supabase-js/package.json', 'utf8')).version;
if (want !== have) { console.error('Versão instalada (' + have + ') difere da fixada (' + want + '). Rode "npm install".'); process.exit(1); }
mkdirSync('js/vendor', { recursive: true });
copyFileSync(SRC, OUT);
const buf = readFileSync(OUT);
if (!buf.length) { console.error('Arquivo vazio.'); process.exit(1); }
const sri = 'sha384-' + createHash('sha384').update(buf).digest('base64');
writeFileSync(OUT + '.sha384', sri + '\n');
console.log('OK: ' + OUT + ' (' + buf.length + ' bytes, supabase-js ' + have + ')');
console.log(sri);
