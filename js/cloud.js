/* Nuvem compartilhada (index.html e coc.html): um único cliente Supabase, salvamento com
   controle de conflito e indicador fixo de status da sincronização. */
window.Cloud = (function () {
  let client = null;
  try { if (window.parent !== window && window.parent.Cloud) client = window.parent.Cloud.client; } catch (e) {}
  if (!client && window.supabase) client = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_KEY);

  /* grava uma ficha. Com id + rev, só atualiza se a nuvem ainda estiver na versão aberta; senão lança {conflict:true}.
     force=true ignora a versão (sobrescreve de propósito). */
  async function saveSheet(o) {
    const row = Object.assign({}, o.payload, { campaign: o.campaign, updated_at: new Date().toISOString() });
    if (o.id) {
      let q = o.client.from(o.table).update(row).eq('id', o.id).eq('user_id', o.userId).eq('campaign', o.campaign);
      if (o.rev && !o.force) q = q.eq('updated_at', o.rev);
      const r = await q.select('id,updated_at');
      if (r.error) throw r.error;
      if (!r.data || !r.data.length) { const e = new Error('conflict'); e.conflict = true; throw e; }
      return { id: r.data[0].id, rev: r.data[0].updated_at };
    }
    const r = await o.client.from(o.table).insert(Object.assign({}, row, { user_id: o.userId })).select('id,updated_at').single();
    if (r.error) throw r.error;
    return { id: r.data.id, rev: r.data.updated_at };
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
  return { client, saveSheet, ui };
})();
