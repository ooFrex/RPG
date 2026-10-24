// Cloudflare Worker (OPCIONAL): prévia do link com o nome e a imagem do item (WhatsApp, Discord, etc.).
// O GitHub Pages é estático e não consegue isso sozinho. Variáveis do Worker: SUPABASE_URL, SUPABASE_KEY (chave publishable) e APP_URL (ex.: https://oofrex.github.io/RPG/).
// Depois de publicar, coloque o endereço do Worker em SHARE_PREVIEW_URL no js/config.js.
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export default { async fetch(req, env) {
  const u = new URL(req.url), code = (u.searchParams.get('b') || '').toLowerCase(), app = env.APP_URL;
  if (!/^[a-z0-9]{10}$/.test(code)) return Response.redirect(app, 302);
  const r = await fetch(env.SUPABASE_URL + '/rest/v1/rpc/get_shared', { method: 'POST', headers: { apikey: env.SUPABASE_KEY, Authorization: 'Bearer ' + env.SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_id: code }) });
  const it = r.ok ? (await r.json())[0] : null; if (!it) return Response.redirect(app, 302);
  if (u.searchParams.has('img')) {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(it.thumb || ''); if (!m) return Response.redirect(app + 'img/opw.jpg', 302);
    return new Response(Uint8Array.from(atob(m[1]), c => c.charCodeAt(0)), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
  }
  const go = app + '?b=' + code, t = esc(it.title), d = esc((it.summary || (it.kind === 'sistema' ? 'Sistema' : 'Personagem') + ' para RPG. Abra para ver e adicionar à sua biblioteca.').slice(0, 200));
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${t}</title><meta property="og:type" content="website"><meta property="og:title" content="${t}"><meta property="og:description" content="${d}"><meta property="og:image" content="${u.origin}${u.pathname}?b=${code}&amp;img=1"><meta name="twitter:card" content="summary"><meta http-equiv="refresh" content="0;url=${go}"></head><body><a href="${go}">Abrir ${t}</a></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
} };
