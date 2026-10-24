/* Amizades: pedidos por código, aceitar/recusar, lista e publicações dos amigos.
   Só fala com o Supabase (funções de supabase/friends.sql). Quem desenha as telas é o op.js.
   O que chega daqui é DADO DE TERCEIROS: o op.js sempre escreve com textContent. */
window.Friends = (function () {
  'use strict';
  const client = () => (window.Cloud && Cloud.client) || null;
  const need = () => { const c = client(); if (!c) throw new Error('Sem conexão com o servidor.'); return c; };
  const fail = e => {
    const m = String((e && e.message) || '');
    if (e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function|schema cache/i.test(m)))
      return new Error('Amizades ainda não foram ativadas neste servidor (rode supabase/friends.sql).');
    return new Error(m || 'Erro de conexão. Confira a internet.');
  };
  const call = async (fn, args) => { const r = await need().rpc(fn, args || {}); if (r.error) throw fail(r.error); return r.data; };
  const txt = (v, n) => String(v == null ? '' : v).slice(0, n);
  const PATH = /^[0-9a-f-]{36}\/profile\/[\w.-]{1,80}$/i, ACC = /^#[0-9a-fA-F]{6}$/;

  async function code() { const c = await call('my_friend_code'); return /^[A-Z0-9]{8}$/.test(c) ? c : ''; }
  async function list() {
    const d = await call('friend_list');
    return (Array.isArray(d) ? d : []).filter(r => r && typeof r.id === 'string').slice(0, 300).map(r => ({
      id: r.id, status: r.status === 'accepted' ? 'accepted' : 'pending', incoming: !!r.incoming,
      name: txt(r.display_name, 60) || 'Agente', avatar: PATH.test(r.avatar_path || '') ? r.avatar_path : '',
      banner: PATH.test(r.banner_path || '') ? r.banner_path : '', bio: txt(r.bio, 200), accent: ACC.test(r.accent || '') ? r.accent : '',
      items: Math.max(0, Math.min(99999, +r.items || 0)), since: r.since || null }));
  }
  const request = c => call('friend_request', { p_code: c });
  const requestByItem = id => call('friend_request_by_item', { p_id: id });
  const respond = (id, ok) => call('friend_respond', { p_id: id, p_accept: !!ok });
  const remove = id => call('friend_remove', { p_id: id });
  async function items(fid) {
    const d = await call('friend_items', { p_fid: fid });
    return (Array.isArray(d) ? d : []).slice(0, 24).map(r => ({ id: txt(r.id, 20), kind: r.kind === 'sistema' ? 'sistema' : 'personagem', campaign: txt(r.campaign, 8), title: txt(r.title, 80), thumb: r.thumb, copies: +r.copies || 0 }));
  }
  return { code, list, request, requestByItem, respond, remove, items };
})();
