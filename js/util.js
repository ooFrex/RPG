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
  return { $, $$, wait, rnd, clamp, esc, fmt, cloudError };
})();
