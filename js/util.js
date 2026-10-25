/* Utilitários comuns à Ordem Paranormal e ao CoC (antes copiados em op.js e coc.js). */
window.Util = (function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = n => (n >= 0 ? '+' : '−') + Math.abs(n);
  const cloudError = err => err && err.message ? err.message : 'Erro de conexão. Confira a internet e a configuração do Supabase.';
  /* registra falha que antes era engolida em catch{} (gravar/sincronizar/excluir). No máx. 1 aviso por contexto a cada 30 s. */
  const _w = {};
  const warn = (ctx, e) => { const t = Date.now(); if (_w[ctx] && t - _w[ctx] < 30000) return; _w[ctx] = t; try { console.warn('[' + ctx + ']', e && e.message ? e.message : e); } catch (_) {} };
  /* Confirmação própria (no lugar do confirm() do navegador, que destoa do visual e pode ser bloqueado).
     Devolve uma Promise<boolean>. Reaproveita .modal/.mbox/.btn de cada página. Esc, fundo e Cancelar = false. */
  const ask = (msg, o = {}) => new Promise(res => {
    const prev = document.activeElement, m = document.createElement('div');
    m.className = 'modal'; m.style.zIndex = '400';
    m.innerHTML = '<div class="mbox" role="alertdialog" aria-modal="true" aria-labelledby="uqT" aria-describedby="uqM" style="width:min(420px,100%)">' +
      '<h2 id="uqT" style="margin:0">' + esc(o.title || 'Confirmar') + '</h2>' +
      '<p id="uqM" style="margin:0;line-height:1.45">' + esc(msg) + '</p>' +
      '<div class="rowb" style="justify-content:flex-end"><button class="btn" type="button" data-r="0">' + esc(o.cancel || 'Cancelar') + '</button>' +
      '<button class="btn pri" type="button" data-r="1">' + esc(o.ok || 'Continuar') + '</button></div></div>';
    let done = false;
    const end = v => { if (done) return; done = true; document.removeEventListener('keydown', key, true); m.remove(); try { prev && prev.focus && prev.focus(); } catch (_) {} res(v); };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); end(false); }
      else if (e.key === 'Tab') { const b = $$('button', m), i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? b.length - 1 : 1)) % b.length].focus(); }
    };
    m.addEventListener('click', e => { if (e.target === m) end(false); else { const b = e.target.closest('button[data-r]'); if (b) end(b.dataset.r === '1'); } });
    document.addEventListener('keydown', key, true);
    document.body.appendChild(m);
    $('button[data-r="0"]', m).focus();
  });
  /* imagens (antes copiadas em op.js e coc.js) */
  const blobToDataUrl = blob => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
  const imageFileToSquareJpeg = (file, size, quality) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { try { const side = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement('canvas'); c.width = c.height = size; c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size); c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve(b) : reject(new Error('Não foi possível processar a imagem.')); }, 'image/jpeg', quality); } catch (e) { URL.revokeObjectURL(url); reject(e); } };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('O arquivo não é uma imagem válida.')); };
    img.src = url;
  });
  return { $, $$, wait, rnd, clamp, esc, fmt, cloudError, warn, ask, blobToDataUrl, imageFileToSquareJpeg };
})();
