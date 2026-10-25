// Gera a pasta dist/ com JS e CSS minificados (menos bytes para o celular baixar e analisar).
// Uso:  npm install && npm run build   →  publique o CONTEÚDO de dist/ (em vez da raiz do projeto).
// Os arquivos-fonte continuam legíveis na raiz; dist/ é só o resultado e pode ser regerado a qualquer hora.
import { build } from 'esbuild';
import { cpSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'dist';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1) tudo o que é estático vai junto (HTML, imagens, som, vendor já minificado)
for (const f of ['index.html', 'coc.html', 'termos.html', 'privacidade.html', 'img', 'assets']) {
  if (existsSync(f)) cpSync(f, join(OUT, f), { recursive: true });
}
mkdirSync(join(OUT, 'js/vendor'), { recursive: true });
if (existsSync('js/vendor')) cpSync('js/vendor', join(OUT, 'js/vendor'), { recursive: true });

// 2) JS próprio (sem bundle: cada arquivo continua sendo um <script> do HTML) e CSS
const js = readdirSync('js').filter(f => f.endsWith('.js'));
await build({
  entryPoints: js.map(f => join('js', f)), outdir: join(OUT, 'js'),
  minify: true, legalComments: 'none', target: 'es2020', charset: 'utf8', logLevel: 'warning'
});
await build({
  entryPoints: readdirSync('css').filter(f => f.endsWith('.css')).map(f => join('css', f)), outdir: join(OUT, 'css'),
  minify: true, legalComments: 'none', charset: 'utf8', logLevel: 'warning'
});

// 3) relatório de tamanhos
const size = d => readdirSync(d).filter(f => statSync(join(d, f)).isFile()).reduce((s, f) => s + statSync(join(d, f)).size, 0);
console.log('js  :', (size('js') / 1024).toFixed(0), 'KB →', (size(join(OUT, 'js')) / 1024).toFixed(0), 'KB');
console.log('css :', (size('css') / 1024).toFixed(0), 'KB →', (size(join(OUT, 'css')) / 1024).toFixed(0), 'KB');
