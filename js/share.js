/* Biblioteca online: publicar sistemas e personagens e abrir por link (?b=código).
   Só fala com o Supabase (tabela shared_items + funções get_shared / register_copy / report_shared,
   ver supabase/shared_items.sql). Não conhece a interface: quem desenha as telas é o op.js.
   O que chega daqui é DADO DE TERCEIROS: o op.js passa tudo por normalize()/cleanMold() antes de usar. */
window.Share = (function () {
  'use strict';
  const MAP = 'rpg-share-v1';              // { 'sys:ID' | 'op:ID' | 'coc:ID': código } — o que já publiquei daqui
  const MAX_BYTES = 300000;                 // o banco recusa acima de 400 kB; deixa folga
  const CODE = /^[a-z0-9]{10}$/;
  const client = () => (window.Cloud && Cloud.client) || null;

  const readMap = () => { try { const m = JSON.parse(localStorage.getItem(MAP)); return m && typeof m === 'object' ? m : {}; } catch (e) { return {}; } };
  const writeMap = m => { try { localStorage.setItem(MAP, JSON.stringify(m)); } catch (e) { if (window.Util) Util.warn('share: vínculo de publicação', e); } };
  const linked = key => { const c = readMap()[key]; return typeof c === 'string' && CODE.test(c) ? c : null; };
  const setLinked = (key, code) => { const m = readMap(); if (code) m[key] = code; else delete m[key]; writeMap(m); };

  /* endereço compartilhável: mesma página, ?b=código */
  const link = code => location.origin + location.pathname.replace(/[^/]*$/, '') + '?b=' + code;
  /* aceita o link inteiro, "?b=código" ou só o código */
  function parse(text) {
    const t = String(text || '').trim(); if (!t) return null;
    const m = t.match(/[?&#]b=([a-z0-9]{10})\b/i) || t.match(/^([a-z0-9]{10})$/i);
    return m ? m[1].toLowerCase() : null;
  }
  /* código vindo do endereço da página (e limpa o endereço) */
  function takeFromUrl() {
    try {
      const u = new URL(location.href), c = parse('?b=' + (u.searchParams.get('b') || ''));
      if (!u.searchParams.has('b')) return null;
      u.searchParams.delete('b');
      history.replaceState(null, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams : '') + u.hash);
      return c;
    } catch (e) { return null; }
  }

  const need = () => { const c = client(); if (!c) throw new Error('Sem conexão com o servidor.'); return c; };
  const fail = e => { const m = (e && e.message) || ''; return new Error(/limite de 60/.test(m) ? 'Você já tem 60 itens publicados. Despublique algum antes.' : /muitas publica/.test(m) ? 'Muitas publicações seguidas. Tente de novo daqui a pouco.' : /login/.test(m) ? 'Entre com sua conta Google para fazer isso.' : m || 'Não deu certo. Tente de novo.'); };

  /* publica (ou atualiza, se este item local já foi publicado). args: {key, kind, campaign, title, summary, author, payload} */
  async function publish(a) {
    const c = need();
    const size = JSON.stringify(a.payload).length;
    if (size > MAX_BYTES) throw new Error('Esse item é grande demais para publicar (' + Math.round(size / 1000) + ' kB).');
    const row = { title: String(a.title || '').trim().slice(0, 80), summary: String(a.summary || '').trim().slice(0, 300) || null, author_name: String(a.author || '').trim().slice(0, 40) || null, payload: a.payload };
    if (!row.title) throw new Error('Dê um nome ao item.');
    const prev = a.key && linked(a.key);
    if (prev) {
      const r = await c.from('shared_items').update(row).eq('id', prev).select('id,version');
      if (r.error) throw fail(r.error);
      if (r.data && r.data.length) return { code: prev, version: r.data[0].version, updated: true };
      setLinked(a.key, null); // foi despublicado em outro lugar: publica de novo
    }
    const r = await c.from('shared_items').insert(Object.assign({ kind: a.kind, campaign: a.campaign }, row)).select('id,version').single();
    if (r.error) throw fail(r.error);
    if (a.key) setLinked(a.key, r.data.id);
    return { code: r.data.id, version: r.data.version, updated: false };
  }

  async function get(code) {
    if (!CODE.test(code || '')) return null;
    const r = await need().rpc('get_shared', { p_id: code });
    if (r.error) throw fail(r.error);
    return r.data && r.data[0] ? r.data[0] : null;
  }
  /* catálogo (só o que você marcou como public no banco). Sem o conteúdo: ele vem ao abrir. */
  async function listPublic(o) {
    o = o || {};
    let q = need().from('shared_items').select('id,kind,campaign,title,summary,author_name,version,copies,created_at').eq('visibility', 'public').eq('status', 'ok').order('copies', { ascending: false }).order('created_at', { ascending: false }).limit(60);
    if (o.campaign) q = q.eq('campaign', o.campaign);
    if (o.kind) q = q.eq('kind', o.kind);
    const r = await q; if (r.error) throw fail(r.error);
    return r.data || [];
  }
  async function listMine(userId) {
    const r = await need().from('shared_items').select('id,kind,campaign,title,version,copies,visibility,status,updated_at').eq('owner_id', userId).order('updated_at', { ascending: false }).limit(100);
    if (r.error) throw fail(r.error);
    return r.data || [];
  }
  async function remove(code) {
    const r = await need().from('shared_items').delete().eq('id', code).select('id');
    if (r.error) throw fail(r.error);
    const m = readMap(); Object.keys(m).forEach(k => { if (m[k] === code) delete m[k]; }); writeMap(m);
  }
  async function registerCopy(code) { try { await need().rpc('register_copy', { p_id: code }); } catch (e) { /* contagem é cosmética */ } }
  async function report(code, reason) { const r = await need().rpc('report_shared', { p_id: code, p_reason: reason || null }); if (r.error) throw fail(r.error); }

  return { link, parse, takeFromUrl, linked, publish, get, listPublic, listMine, remove, registerCopy, report, MAX_BYTES };
})();
