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
  /* ---- perfil por link (?amigo=CÓDIGO): supabase/friend_profile.sql ---- */
  const CODE = /^[A-Z0-9]{8}$/, REL = ['self', 'friends', 'pending_out', 'pending_in', 'none'];
  const clean = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const link = c => location.origin + location.pathname.replace(/[^/]*$/, '') + '?amigo=' + clean(c);
  /* devolve o código do endereço da página (e limpa o endereço); só aceita 8 letras/números */
  function takeFromUrl() {
    try {
      const u = new URL(location.href); if (!u.searchParams.has('amigo')) return null;
      const c = clean(u.searchParams.get('amigo')); u.searchParams.delete('amigo');
      history.replaceState(null, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams : '') + u.hash);
      return CODE.test(c) ? c : null;
    } catch (e) { return null; }
  }
  const failP = e => (e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function|schema cache/i.test(String(e.message || ''))))
    ? new Error('Perfis por link ainda não foram ativados neste servidor (rode supabase/friend_profile.sql).') : fail(e);
  async function profile(c) {
    c = clean(c); if (!CODE.test(c)) return null;
    const r = await need().rpc('profile_by_code', { p_code: c }); if (r.error) throw failP(r.error);
    const d = Array.isArray(r.data) ? r.data[0] : null; if (!d) return null;
    return { code: c, relation: REL.indexOf(d.relation) >= 0 ? d.relation : 'none', fid: typeof d.friendship_id === 'string' ? d.friendship_id : null,
      name: txt(d.display_name, 60) || 'Agente', avatar: PATH.test(d.avatar_path || '') ? d.avatar_path : '', banner: PATH.test(d.banner_path || '') ? d.banner_path : '',
      bio: txt(d.bio, 200), accent: ACC.test(d.accent || '') ? d.accent : '', items: Math.max(0, Math.min(99999, +d.items || 0)), details: !!d.details };
  }
  async function itemsByCode(c) {
    c = clean(c); if (!CODE.test(c)) return [];
    const r = await need().rpc('profile_items_by_code', { p_code: c }); if (r.error) throw failP(r.error);
    return (Array.isArray(r.data) ? r.data : []).slice(0, 24).map(x => ({ id: txt(x.id, 20), kind: x.kind === 'sistema' ? 'sistema' : 'personagem', campaign: txt(x.campaign, 8), title: txt(x.title, 80), thumb: x.thumb, copies: +x.copies || 0 }));
  }
  return { code, list, request, requestByItem, respond, remove, items, link, takeFromUrl, profile, itemsByCode };
})();
