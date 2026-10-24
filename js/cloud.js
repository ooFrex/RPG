/* Nuvem compartilhada (index.html e coc.html): um único cliente Supabase, salvamento com
   controle de conflito e indicador fixo de status da sincronização. */
window.Cloud = (function () {
  /* falha silenciosa de gravação/exclusão: ao menos fica no console (Util.warn, com limite de repetição) */
  const warn = (ctx, e) => { if (window.Util && Util.warn) Util.warn('cloud: ' + ctx, e); else { try { console.warn('[cloud: ' + ctx + ']', e && e.message || e); } catch (_) {} } };
  let client = null;
  try { if (window.parent !== window && window.parent.Cloud) client = window.parent.Cloud.client; } catch (e) {}
  if (!client && window.supabase) client = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_KEY);

  /* grava uma ficha. Com id + rev, só atualiza se a nuvem ainda estiver na versão aberta; senão lança {conflict:true}.
     force=true ignora a versão (sobrescreve de propósito). */
  async function saveSheet(o) {
    /* updated_at NÃO é enviado: quem carimba é o trigger do Postgres (supabase/updated_at_trigger.sql), com o relógio do servidor */
    const row = Object.assign({}, o.payload, { campaign: o.campaign });
    if (o.id) {
      let q = o.client.from(o.table).update(row).eq('id', o.id).eq('user_id', o.userId).eq('campaign', o.campaign);
      if (o.rev && !o.force) q = q.eq('updated_at', o.rev);
      const r = await q.select('id,updated_at');
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) { const e = new Error('conflict'); e.conflict = true; throw e; }
      if (o.rev && r.data[0].updated_at === o.rev) console.warn('updated_at não mudou após o UPDATE: aplique supabase/updated_at_trigger.sql, senão o controle de conflito não funciona.');
      return { id: r.data[0].id, rev: r.data[0].updated_at };
    }
    const r = await o.client.from(o.table).insert(Object.assign({}, row, { user_id: o.userId })).select('id,updated_at').single();
    if (r.error) throw r.error;
    return { id: r.data.id, rev: r.data.updated_at };
  }

  /* dados da conta vindos do Google (nome, foto, provedores) a partir do user do Supabase */
  function accountInfo(user) {
    const m = (user && user.user_metadata) || {};
    const ids = (user && user.identities) || [];
    const providers = ids.map(i => i.provider).concat((user && user.app_metadata && user.app_metadata.providers) || []);
    return {
      google: providers.indexOf('google') >= 0,
      name: (m.display_name || m.full_name || m.name || '').trim(),
      avatar: /^https:\/\//.test(m.avatar_url || m.picture || '') ? (m.avatar_url || m.picture) : ''
    };
  }

  /* erro devolvido pelo Supabase/Google na volta do login (?error_description=... ou #error_description=...).
     Lê uma vez, limpa o endereço e devolve o texto (ou ''). */
  function takeAuthError() {
    try {
      const u = new URL(location.href), h = new URLSearchParams(u.hash.replace(/^#/, ''));
      const code = u.searchParams.get('error_code') || h.get('error_code') || '';
      const desc = u.searchParams.get('error_description') || h.get('error_description') || '';
      const err = u.searchParams.get('error') || h.get('error') || '';
      if (!err && !desc) return '';
      ['error', 'error_code', 'error_description', 'error_uri'].forEach(k => u.searchParams.delete(k));
      history.replaceState(null, '', u.pathname + (u.searchParams.toString() ? '?' + u.searchParams : '') + (h.get('access_token') ? u.hash : ''));
      if (err === 'access_denied' && !desc.trim()) return 'Login com Google cancelado.';
      if (code === 'identity_already_exists') return 'Essa conta Google já está ligada a outro usuário.';
      return 'Não foi possível entrar com o Google: ' + (desc || err).replace(/\+/g, ' ');
    } catch (e) { return ''; }
  }

  /* login com Google: na OP navega a janela; dentro do iframe do CoC navega a página-mãe (o Google não abre em iframe).
     Antes de navegar, confere no Supabase se o provedor Google está ativo; se a navegação não acontecer, avisa em vez de ficar parado.
     Guarda onde o usuário estava (OP ou CoC) para reabrir no mesmo lugar depois do retorno. */
  async function signInGoogle() {
    if (!client) throw new Error('Cliente Supabase indisponível');
    if (location.protocol === 'file:') throw new Error('Abra a ficha por um servidor local ou HTTPS para entrar com o Google.');
    try {
      const cfg = await fetch(APP_CONFIG.SUPABASE_URL + '/auth/v1/settings', { headers: { apikey: APP_CONFIG.SUPABASE_KEY } }).then(r => r.ok ? r.json() : null);
      if (cfg && cfg.external && cfg.external.google === false) throw new Error('O login com Google ainda não está ativado no Supabase (Authentication → Sign In / Providers → Google).');
    } catch (e) { if (/não está ativado/.test(e.message)) throw e; }
    let w = window; try { if (window.top && window.top.location.origin === location.origin) w = window.top; } catch (e) {}
    try { sessionStorage.setItem('rpg-auth-return', w !== window || window.parent !== window ? 'coc' : 'op'); } catch (e) {}
    const r = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: w.location.origin + w.location.pathname, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } } });
    if (r.error) throw r.error;
    if (!r.data || !r.data.url) throw new Error('O Supabase não devolveu o endereço de login do Google.');
    w.location.assign(r.data.url);
    /* se a página ainda existe depois de alguns segundos, a navegação foi bloqueada */
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('o navegador não abriu a tela do Google. Tente de novo.')), 20000);
      addEventListener('pagehide', () => { clearTimeout(t); res(); }, { once: true });   // a página está saindo: não é erro
    });
  }

  /* destino guardado antes do login ('coc' ou null); lido uma vez */
  function takeReturnTarget() {
    try { const v = sessionStorage.getItem('rpg-auth-return'); sessionStorage.removeItem('rpg-auth-return'); return v; } catch (e) { return null; }
  }

  /* =====================================================================
     SINCRONIZAÇÃO DE TODOS OS PERSONAGENS COM A CONTA
     Cada personagem local (ficha aberta + guardados) tem um "vínculo" {id, rev, h, uid}:
       id  = linha em character_sheets · rev = updated_at da nuvem na última sincronização
       h   = hash do conteúdo na última sincronização (diz se mudou aqui) · uid = dono da conta.
     syncAll(): sobe os novos, envia os alterados, baixa os que mudaram em outro aparelho,
     baixa os que só existem na conta e remove os que foram excluídos em outro aparelho.
     Se mudou dos dois lados, mantém as duas versões (nunca perde ficha).
     ===================================================================== */
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  function bare(sheet) { const c = Object.assign({}, sheet); delete c.cl; return c; }
  function hashOf(sheet) {
    const t = stable(bare(sheet)); let h = 2166136261;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36) + ':' + t.length;
  }
  function withLock(name, fn) {
    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) return navigator.locks.request('rpg-sync-' + name, fn);
    return fn();
  }
  const clone = o => JSON.parse(JSON.stringify(o));

  /* exclusões feitas aqui que ainda precisam chegar na nuvem (funciona offline: fica na fila) */
  const DELQ = 'rpg-cloud-del-v1';
  function readQ() { try { const q = JSON.parse(localStorage.getItem(DELQ)); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  function writeQ(q) { try { localStorage.setItem(DELQ, JSON.stringify(q)); } catch (e) { warn('fila de exclusões: não gravou', e); } }
  async function flushDeletes(campaign, userId) {
    if (!client || !userId) return;
    let q = readQ();
    for (const it of q.filter(x => x.c === campaign && x.uid === userId)) {
      const r = await client.from(APP_CONFIG.CLOUD_TABLE).delete().eq('id', it.id).eq('user_id', userId).eq('campaign', campaign);
      if (!r.error) writeQ(readQ().filter(x => !(x.c === campaign && x.id === it.id)));
    }
  }
  /* chamada quando o usuário exclui um personagem aqui: apaga também da conta */
  function forget(campaign, link) {
    if (!link || !link.id || !link.uid) return;
    const q = readQ(); if (!q.some(x => x.c === campaign && x.id === link.id)) { q.push({ c: campaign, id: link.id, uid: link.uid }); writeQ(q); }
    if (!client) return;
    client.auth.getSession().then(r => { const u = r && r.data && r.data.session && r.data.session.user; if (u && u.id === link.uid) return flushDeletes(campaign, u.id); }).catch(() => {});
  }

  async function pushEntry(ad, e, opt) {
    opt = opt || {};
    const sheet = clone(bare(e.get())), lk = opt.asNew ? null : e.link;
    const payload = { name: ad.nameOf(sheet) || ad.defaultName, sheet };
    const base = { client, table: APP_CONFIG.CLOUD_TABLE, campaign: ad.campaign, userId: ad.userId, payload };
    let r;
    try { r = await saveSheet(Object.assign({}, base, { id: lk && lk.id, rev: lk && lk.rev, force: !!opt.force })); }
    catch (err) { if (err && err.conflict && opt.force && lk) r = await saveSheet(Object.assign({}, base, { id: null })); else throw err; }
    const link = { id: r.id, rev: r.rev, h: hashOf(sheet), uid: ad.userId };
    e.setLink(link); return link;
  }

  /* envia a ficha aberta (salvamento automático e botões manuais) */
  function pushLive(ad, opt) {
    return withLock(ad.campaign, async () => {
      const e = ad.liveEntry(); if (!e) return null;
      if (opt && opt.asNew) { e.setLink(null); }
      return pushEntry(ad, e, opt);
    });
  }

  async function fetchSheet(ad, id) {
    const r = await client.from(APP_CONFIG.CLOUD_TABLE).select('id,name,sheet,updated_at').eq('id', id).eq('user_id', ad.userId).eq('campaign', ad.campaign).single();
    if (r.error) throw r.error;
    if (!r.data.sheet || !ad.valid(r.data.sheet)) return null;
    return r.data;
  }

  function syncAll(ad) {
    return withLock(ad.campaign, async () => {
      const st = { up: 0, down: 0, conflict: 0, removed: 0, created: 0 };
      await flushDeletes(ad.campaign, ad.userId);
      let ents = ad.items();
      /* personagens deste aparelho que pertencem a OUTRA conta Google */
      const foreign = ents.filter(e => e.link && e.link.uid && e.link.uid !== ad.userId);
      if (foreign.length) {
        let ok = false; try { ok = sessionStorage.getItem('rpg-foreign-ok:' + ad.userId) === '1'; } catch (x) {}
        if (!ok) {
          if (typeof confirm === 'function' && !confirm('Este aparelho tem personagens ligados a outra conta. Enviar uma cópia deles para a conta atual? (Cancelar não envia nada.)')) return Object.assign(st, { aborted: true });
          try { sessionStorage.setItem('rpg-foreign-ok:' + ad.userId, '1'); } catch (x) {}
        }
        foreign.forEach(e => e.setLink(null));
        ents = ad.items();
      }
      const lr = await client.from(APP_CONFIG.CLOUD_TABLE).select('id,name,updated_at').eq('user_id', ad.userId).eq('campaign', ad.campaign);
      if (lr.error) throw lr.error;
      const rows = new Map(lr.data.map(r => [r.id, r])), seen = new Set();
      /* tudo o que já está ligado a um personagem local (no instante deste snapshot) nunca é baixado de novo como "só existe na conta",
         mesmo que o personagem seja aberto/excluído aqui enquanto a sincronização roda */
      for (const e of ents) { const l = e.link; if (l && l.id) seen.add(l.id); }
      for (const e of ents) {
        try {
          if (ad.prepare) await ad.prepare(e);
          const sheet = e.get(); if (!sheet || typeof sheet !== 'object' || !ad.valid(sheet)) continue;
          const lk = e.link, h = hashOf(sheet), row = lk && rows.get(lk.id);
          if (!lk) { await pushEntry(ad, e); st.up++; }
          else if (!row) {
            /* sumiu da conta: se aqui não mudou, foi excluído em outro aparelho */
            if (h === lk.h && !e.live) { e.remove(); st.removed++; continue; }
            e.setLink(null); await pushEntry(ad, e); st.up++;
          } else if (row.updated_at === lk.rev) {
            if (h !== lk.h) { await pushEntry(ad, e); st.up++; }
          } else if (h === lk.h) {
            const d = await fetchSheet(ad, row.id);
            if (d) { e.set(d.sheet); e.setLink({ id: row.id, rev: d.updated_at, h: hashOf(e.get()), uid: ad.userId }); st.down++; }
          } else {
            /* mudou dos dois lados: guarda a versão da nuvem como cópia e envia a daqui como nova */
            const d = await fetchSheet(ad, row.id);
            if (d) {
              const copy = ad.mark(clone(d.sheet), ' (da nuvem)');
              ad.create(copy, { id: row.id, rev: d.updated_at, h: hashOf(copy), uid: ad.userId });
              seen.add(row.id); e.setLink(null); await pushEntry(ad, e); st.conflict++; st.up++;
            }
          }
          if (e.link) seen.add(e.link.id);
        } catch (err) { if (err && err.conflict) { st.conflict++; } else throw err; }
      }
      /* só existem na conta: baixa como novos personagens neste aparelho */
      for (const r of lr.data) {
        if (seen.has(r.id)) continue;
        const d = await fetchSheet(ad, r.id);
        if (d) { ad.create(d.sheet, { id: r.id, rev: d.updated_at, h: hashOf(d.sheet), uid: ad.userId }); st.created++; }
      }
      return st;
    });
  }

  /* ---------- adaptador dos investigadores do CoC (guardados em localStorage) ---------- */
  function cocAdapter(o) {
    const IDX = 'coc-idx-v1', SLP = 'coc-slot-v1:', LK = 'coc-cloud-v1';
    const rd = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const idx = () => { const j = rd(IDX); return j && Array.isArray(j.list) ? j : { v: 1, list: [], cur: null }; };
    const links = () => rd(LK) || {};
    const setL = (id, l) => { const m = links(); if (l) m[id] = l; else delete m[id]; wr(LK, m); };
    const meta = (sheet, id) => ({ id, nome: (sheet.who && sheet.who.nome) || 'Investigador sem nome', ocup: (sheet.who && sheet.who.ocup) || '', t: Date.now() });
    function entry(id, live) {
      return {
        key: id, live: !!live,
        get link() { return links()[id] || null; },
        setLink(l) { setL(id, l); },
        get() { return live ? o.live.get() : rd(SLP + id); },
        set(sheet) {
          if (live) { o.live.set(sheet); return; }
          wr(SLP + id, sheet); const ix = idx(), i = ix.list.findIndex(x => x.id === id);
          if (i >= 0) { ix.list[i] = meta(sheet, id); wr(IDX, ix); }
        },
        remove() { try { localStorage.removeItem(SLP + id); } catch (e) { warn('remover ficha local do CoC', e); } const ix = idx(); ix.list = ix.list.filter(x => x.id !== id); wr(IDX, ix); setL(id, null); }
      };
    }
    return {
      campaign: 'coc', userId: o.userId, defaultName: 'Investigador sem nome',
      valid: s => !!s && typeof s === 'object' && s.app === 'coc',
      nameOf: s => ((s.who && s.who.nome) || '').trim(),
      mark(s, suf) { s.who = s.who || {}; s.who.nome = ((s.who.nome || 'Investigador sem nome') + suf).slice(0, 60); return s; },
      /* retrato antigo (imagem dentro da ficha) -> bucket account-avatars, como na OP */
      async prepare(e) {
        const sh = e.get(), av = sh && sh.who && sh.who.av;
        if (typeof av !== 'string' || av.indexOf('data:image/') !== 0) return;
        try {
          const blob = await (await fetch(av)).blob(), ext = /png/.test(blob.type) ? 'png' : /webp/.test(blob.type) ? 'webp' : 'jpg';
          const path = o.userId + '/coc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext;
          const up = await client.storage.from('account-avatars').upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' });
          if (up.error) return;
          sh.who.av = 'sb:' + path;
          if (e.live) { if (o.live && o.live.touch) o.live.touch(); } else e.set(sh);
        } catch (x) { warn('mover retrato do CoC para o bucket', x); }
      },
      items() {
        const ix = idx(); const out = [];
        ix.list.forEach(x => {
          if (!x || !x.id) return;
          const cur = x.id === ix.cur;
          if (cur && !o.live) return;
          out.push(entry(x.id, cur));
        });
        return out;
      },
      liveEntry() { if (!o.live) return null; const ix = idx(); return ix.cur ? entry(ix.cur, true) : null; },
      create(sheet, link) {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ix = idx();
        wr(SLP + id, sheet); ix.list.unshift(meta(sheet, id)); wr(IDX, ix); setL(id, link); if (o.onChange) o.onChange();
      }
    };
  }
  /* exclusão / troca de vínculo do CoC (usadas pelo menu e pela própria ficha) */
  function cocForget(slotId) {
    try {
      const m = JSON.parse(localStorage.getItem('coc-cloud-v1') || '{}'); const l = m[slotId]; if (!l) return;
      delete m[slotId]; localStorage.setItem('coc-cloud-v1', JSON.stringify(m)); forget('coc', l);
    } catch (e) { warn('cocForget: desvincular ficha', e); }
  }
  /* a ficha aberta passou a ser exatamente esta linha da nuvem (botão "Carregar"): remove cópias locais duplicadas */
  function cocRelink(slotId, link) {
    try {
      const m = JSON.parse(localStorage.getItem('coc-cloud-v1') || '{}');
      const ix = JSON.parse(localStorage.getItem('coc-idx-v1') || '{"list":[]}');
      Object.keys(m).forEach(k => { if (k !== slotId && m[k] && m[k].id === link.id) { delete m[k]; ix.list = ix.list.filter(x => x.id !== k); try { localStorage.removeItem('coc-slot-v1:' + k); } catch (e) { warn('cocRelink: remover cópia local', e); } } });
      m[slotId] = link; localStorage.setItem('coc-cloud-v1', JSON.stringify(m)); localStorage.setItem('coc-idx-v1', JSON.stringify(ix));
    } catch (e) { warn('cocRelink: regravar vínculos', e); }
  }


  /* =====================================================================
     SINCRONIZAÇÃO DOS SISTEMAS PRÓPRIOS (biblioteca) COM A CONTA — tabela user_systems (supabase/user_systems.sql)
     Cada sistema local guarda um vínculo em entry.cloud = {id, rev, h, uid} (mesma ideia dos personagens):
       id = linha em user_systems · rev = updated_at da nuvem na última sincronização · h = hash do conteúdo naquela hora.
     Mudou só aqui -> envia · mudou só lá -> baixa · mudou nos dois -> guarda as duas versões · sumiu da conta sem mudar aqui -> remove.
     ===================================================================== */
  const SYSQ = 'rpg-cloud-del-sys-v1', STBL = 'user_systems';
  function sysHash(en) { return hashOf({ nome: en.nome, v: en.v, mold: en.mold, img: en.img || null, src: en.src || null, sver: en.sver == null ? null : en.sver }); }
  function sysPack(en) {
    const entry = { nome: en.nome, v: en.v, t: en.t, mold: en.mold };
    if (en.img) entry.img = en.img; if (en.src) entry.src = en.src; if (en.sver != null) entry.sver = en.sver;
    return { name: String(en.nome || 'Sistema').slice(0, 80) || 'Sistema', entry };
  }
  function readSysQ() { try { const q = JSON.parse(localStorage.getItem(SYSQ)); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  function writeSysQ(q) { try { localStorage.setItem(SYSQ, JSON.stringify(q)); } catch (e) { warn('fila de exclusões de sistemas: não gravou', e); } }
  async function flushSysDeletes(userId) {
    if (!client || !userId) return;
    for (const it of readSysQ().filter(x => x.uid === userId)) {
      const r = await client.from(STBL).delete().eq('id', it.id).eq('user_id', userId);
      if (!r.error) writeSysQ(readSysQ().filter(x => x.id !== it.id));
    }
  }
  /* o usuário excluiu um sistema aqui: apaga também da conta (fica na fila se estiver offline) */
  function forgetSystem(link) {
    if (!link || !link.id || !link.uid) return;
    const q = readSysQ(); if (!q.some(x => x.id === link.id)) { q.push({ id: link.id, uid: link.uid }); writeSysQ(q); }
    if (!client) return;
    client.auth.getSession().then(r => { const u = r && r.data && r.data.session && r.data.session.user; if (u && u.id === link.uid) return flushSysDeletes(u.id); }).catch(() => {});
  }
  async function pushSys(ad, en, lk) {
    const p = sysPack(en), h = sysHash(en);
    if (JSON.stringify(p.entry).length > 390000) { const e = new Error('Sistema grande demais para a nuvem: ' + p.name); e.skip = true; throw e; }
    if (lk && lk.id) {
      const r = await client.from(STBL).update(p).eq('id', lk.id).eq('user_id', ad.userId).eq('updated_at', lk.rev).select('id,updated_at');
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) { const e = new Error('conflict'); e.conflict = true; throw e; }
      return { id: r.data[0].id, rev: r.data[0].updated_at, h, uid: ad.userId };
    }
    const r = await client.from(STBL).insert(Object.assign({}, p, { user_id: ad.userId })).select('id,updated_at').single();
    if (r.error) throw r.error;
    return { id: r.data.id, rev: r.data.updated_at, h, uid: ad.userId };
  }
  async function fetchSys(ad, id) {
    const r = await client.from(STBL).select('id,entry,updated_at').eq('id', id).eq('user_id', ad.userId).single();
    if (r.error) throw r.error;
    const c = ad.clean(r.data.entry); return c ? { entry: c, rev: r.data.updated_at } : null;
  }
  /* ad: { userId, read(), write(list), newId(), clean(entryDaNuvem) -> entrada limpa | null } */
  function syncSystems(ad) {
    return withLock('sistemas', async () => {
      const st = { up: 0, down: 0, removed: 0, created: 0, conflict: 0, aborted: false };
      await flushSysDeletes(ad.userId);
      const mut = fn => { const l = ad.read(); fn(l); ad.write(l); };
      const upd = (id, fn) => mut(l => { const x = l.find(y => y.id === id); if (x) fn(x); });
      let ents = ad.read();
      const foreign = ents.filter(e => e.cloud && e.cloud.uid && e.cloud.uid !== ad.userId);
      if (foreign.length) {
        let ok = false; try { ok = sessionStorage.getItem('rpg-foreign-sys-ok:' + ad.userId) === '1'; } catch (x) {}
        if (!ok) {
          if (typeof confirm === 'function' && !confirm('Este aparelho tem sistemas ligados a outra conta. Enviar uma cópia deles para a conta atual? (Cancelar não envia nada.)')) { st.aborted = true; return st; }
          try { sessionStorage.setItem('rpg-foreign-sys-ok:' + ad.userId, '1'); } catch (x) {}
        }
        mut(l => l.forEach(x => { if (x.cloud && x.cloud.uid !== ad.userId) delete x.cloud; }));
        ents = ad.read();
      }
      const lr = await client.from(STBL).select('id,updated_at').eq('user_id', ad.userId);
      if (lr.error) throw lr.error;
      const rows = new Map(lr.data.map(r => [r.id, r])), seen = new Set();
      ents.forEach(e => { if (e.cloud && e.cloud.id) seen.add(e.cloud.id); });
      for (const e of ents) {
        try {
          const lk = e.cloud, h = sysHash(e), row = lk && rows.get(lk.id);
          if (!lk) { const l = await pushSys(ad, e, null); upd(e.id, x => { x.cloud = l; }); st.up++; }
          else if (!row) {
            if (h === lk.h) { mut(l => { const i = l.findIndex(y => y.id === e.id); if (i >= 0) l.splice(i, 1); }); st.removed++; continue; }
            const l = await pushSys(ad, e, null); upd(e.id, x => { x.cloud = l; }); st.up++;
          } else if (row.updated_at === lk.rev) {
            if (h !== lk.h) { const l = await pushSys(ad, e, lk); upd(e.id, x => { x.cloud = l; }); st.up++; }
          } else if (h === lk.h) {
            const d = await fetchSys(ad, row.id);
            if (d) { upd(e.id, x => { Object.assign(x, d.entry); x.cloud = { id: row.id, rev: d.rev, h: sysHash(d.entry), uid: ad.userId }; }); st.down++; }
          } else {
            const d = await fetchSys(ad, row.id);
            if (d) {
              const copy = Object.assign({ id: ad.newId() }, d.entry, { nome: (d.entry.nome + ' (da nuvem)').slice(0, 40) });
              copy.cloud = { id: row.id, rev: d.rev, h: sysHash(copy), uid: ad.userId };
              mut(l => { l.push(copy); });
              const l = await pushSys(ad, e, null); upd(e.id, x => { x.cloud = l; }); st.conflict++; st.up++;
            }
          }
        } catch (err) {
          if (err && err.conflict) st.conflict++;
          else if (err && err.skip) warn('sistema não enviado', err);
          else throw err;
        }
      }
      for (const r of lr.data) {
        if (seen.has(r.id)) continue;
        const d = await fetchSys(ad, r.id);
        if (d) { const en = Object.assign({ id: ad.newId() }, d.entry); en.cloud = { id: r.id, rev: d.rev, h: sysHash(d.entry), uid: ad.userId }; mut(l => { l.push(en); }); st.created++; }
      }
      return st;
    });
  }

  /* indicador fixo: ● âmbar sincronizando · ● verde salvo · ● vermelho falhou · conflito */
  const ui = (function () {
    let el = null, state = '', fails = 0, t = null;
    const C = { pend: '#e0b04a', ok: '#7bd1a0', fail: '#e0776b', conf: '#e0776b' };
    function node() {
      if (el || !document.body) return el;
      el = document.createElement('div'); el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 4px);left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:6px;max-width:92vw;padding:3px 10px;border-radius:12px;font:600 .72rem/1.2 system-ui,sans-serif;background:rgba(0,0,0,.6);color:#ece9f3;pointer-events:none';
      document.body.appendChild(el); return el;
    }
    function paint(s, text, keep) {
      clearTimeout(t); const n = node(); if (!n) return; state = s;
      n.innerHTML = '<i style="flex:none;width:8px;height:8px;border-radius:50%;background:' + C[s] + '"></i><span></span>';
      n.lastChild.textContent = text; n.title = text;
      if (!keep) t = setTimeout(() => { if (el && el.lastChild) el.lastChild.hidden = true; }, 2500);
    }
    return {
      pending() { if (state !== 'pend') paint('pend', 'Sincronizando…', true); },
      ok() { fails = 0; paint('ok', 'Salvo na nuvem'); },
      conflict() { paint('conf', 'Conflito: a nuvem mudou. Sincronização pausada.', true); },
      fail(err) {
        fails++; console.warn('Nuvem:', err);
        paint('fail', fails >= 3 ? 'Nuvem falhou ' + fails + ' vezes: a ficha está salva só neste aparelho.' : 'Nuvem: não sincronizou.', true);
        if (fails === 3 && typeof window.swShow === 'function')
          window.swShow('Nuvem sem sincronizar', 'A ficha está salva só neste aparelho. Confira a conexão; tento de novo a cada alteração.');
      }
    };
  })();
  return { client, saveSheet, signInGoogle, accountInfo, takeAuthError, takeReturnTarget, hash: hashOf, syncAll, syncSystems, forgetSystem, pushLive, forget, cocAdapter, cocForget, cocRelink, ui };
})();
