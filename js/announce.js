/* Aviso em pop-up no canto da tela (só aparece com o menu aberto). Texto vem de public.announcements.
   Tudo entra por textContent; link só https; imagem só do bucket ficha-assets. Teste sem banco: ?anuncio=demo */
(function () {
  'use strict';
  const KEY = 'ann:dismissed', host = document.getElementById('mSl');
  if (!host) return;
  const demo = /[?&]anuncio=demo\b/.test(location.search);
  let list = null, card = null, busy = false;
  const seen = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const mark = id => { if (id === 'demo') return; try { localStorage.setItem(KEY, JSON.stringify(seen().concat(id).slice(-50))); } catch (e) {} };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  async function load() {
    if (demo) return [{ id: 'demo', title: 'Novidade na ficha', body: 'Agora dá para salvar suas fichas na nuvem e continuar em outro aparelho.' }];
    const c = window.Cloud && Cloud.client; if (!c) return [];
    const r = await c.from('announcements').select('id,title,body,image_path,cta_label,cta_url').order('starts_at', { ascending: false }).limit(5);
    return r.error ? [] : (r.data || []);
  }
  function hide() { if (card) { card.remove(); card = null; } }
  function close(a) { mark(a.id); hide(); }
  function build(a) {
    const n = el('aside', 'ann'); n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite');
    if (a.image_path && /^[A-Za-z0-9_./-]+$/.test(a.image_path) && a.image_path.indexOf('..') < 0) {
      const im = el('img', 'ann-img'); im.alt = ''; im.src = APP_CONFIG.ASSET_BASE + a.image_path; im.onerror = () => { im.remove(); n.classList.remove('has-img'); };
      n.classList.add('has-img'); n.appendChild(im);
    }
    const x = el('button', 'ann-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar aviso'); x.onclick = () => close(a);
    n.append(el('strong', 'ann-t', a.title), el('p', 'ann-b', a.body), x);
    if (a.cta_label && /^https:\/\//.test(a.cta_url || '')) {
      const l = el('a', 'ann-cta', a.cta_label); l.href = a.cta_url; l.target = '_blank'; l.rel = 'noopener noreferrer'; l.onclick = () => close(a); n.appendChild(l);
    }
    return n;
  }
  async function maybe() {
    if (busy || card || host.hidden) return; busy = true;
    try {
      if (list === null) list = await load();
      await new Promise(r => setTimeout(r, 1200));
      if (host.hidden || card) return;
      const a = list.find(x => seen().indexOf(x.id) < 0);
      if (a) { card = build(a); document.body.appendChild(card); }
    } catch (e) { console.warn('Aviso:', e); } finally { busy = false; }
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && card) hide(); });
  new MutationObserver(() => { if (host.hidden) hide(); else maybe(); }).observe(host, { attributes: true, attributeFilter: ['hidden'] });
  maybe();
})();
