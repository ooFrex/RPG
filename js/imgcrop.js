/* Enquadrar imagem antes de confirmar (usado por index.html e coc.html).
   ImgCrop.pick(file, {w,h,round,contain,title,hint,ok}) -> Promise<canvas|null>
     Abre uma janela onde a pessoa arrasta (mover), usa a roda / pinça / controle (zoom) e confirma.
     w×h = tamanho final em pixels (também define a proporção do quadro). round = guia circular (a saída continua quadrada).
     contain = a imagem pode ficar menor que o quadro (logos); o fundo fica transparente.
     Devolve o canvas já recortado (null se cancelou). Erros de arquivo viram Error com mensagem em português.
   ImgCrop.chooser({title, presets:[{id,url,label}], canReset, resetLabel}) -> Promise<{file}|{preset}|{reset:true}|null>
   ImgCrop.toBlob(canvas, type, q) -> Promise<Blob> */
window.ImgCrop = (function () {
  'use strict';
  const TYPES = /^image\/(jpeg|png|webp)$/, MAXB = 8 * 1024 * 1024;
  let styled = false;
  function css() {
    if (styled) return; styled = true;
    const s = document.createElement('style');
    s.textContent = `
.ic-m{position:fixed;inset:0;z-index:600;display:grid;place-items:center;padding:14px;background:rgba(4,3,8,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:var(--ui,system-ui,sans-serif);color:var(--tx,#ece9f3)}
.ic-b{width:min(560px,100%);max-height:calc(100dvh - 28px);overflow:auto;display:grid;gap:14px;padding:18px;border:1px solid var(--ln2,rgba(255,255,255,.24));border-radius:16px;background:#14111d;background:color-mix(in oklab,var(--tint,#8a7db0) 25%,#000);box-shadow:0 30px 80px rgba(0,0,0,.65)}
.ic-b h2{margin:0;font-size:1.15rem;font-weight:800;letter-spacing:.04em}
.ic-b p{margin:0;color:var(--mu,#9c96ab);font-size:.88rem;line-height:1.4}
.ic-st{display:grid;place-items:center;border-radius:12px;background:rgba(0,0,0,.35);padding:4px;overflow:hidden}
.ic-cv{display:block;max-width:100%;touch-action:none;cursor:grab;border-radius:8px;outline:none}
.ic-cv:active{cursor:grabbing}.ic-cv:focus-visible{outline:2px solid var(--gold,#e0b04a);outline-offset:2px}
.ic-ct{display:flex;align-items:center;gap:10px}
.ic-ct input[type=range]{flex:1;min-width:0;accent-color:var(--kr,var(--teal,#e60049))}
.ic-ib{flex:none;width:38px;height:38px;border-radius:10px;border:1px solid var(--ln2,rgba(255,255,255,.24));background:rgba(255,255,255,.06);color:inherit;font-size:1.2rem;line-height:1;cursor:pointer}
.ic-ib:hover{background:rgba(255,255,255,.14)}
.ic-ac{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
.ic-btn{min-height:42px;padding:8px 18px;border-radius:10px;border:1px solid var(--ln2,rgba(255,255,255,.24));background:rgba(255,255,255,.07);color:inherit;font:inherit;font-weight:700;font-size:.82rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
.ic-btn:hover{background:rgba(255,255,255,.14)}
.ic-btn.pri{background:var(--kr,var(--teal,#e60049));border-color:var(--kr,var(--teal,#e60049));color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.ic-btn.pri:hover{filter:brightness(1.12)}
.ic-btn:focus-visible,.ic-ib:focus-visible,.ic-pr:focus-visible{outline:2px solid var(--gold,#e0b04a);outline-offset:2px}
.ic-hint{text-align:center}
.ic-up{display:grid;place-items:center;gap:4px;min-height:92px;padding:14px;border:1.5px dashed var(--ln2,rgba(255,255,255,.3));border-radius:12px;background:rgba(0,0,0,.2);color:inherit;font:inherit;cursor:pointer;text-align:center}
.ic-up:hover{border-color:var(--kr,var(--teal,#e60049));background:rgba(255,255,255,.05)}
.ic-up b{font-size:1rem}.ic-up small{color:var(--mu,#9c96ab)}
.ic-h3{margin:0;font-size:.72rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--kr,var(--teal,#e60049))}
.ic-gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
.ic-pr{display:grid;gap:6px;padding:6px;border:1px solid var(--ln2,rgba(255,255,255,.2));border-radius:12px;background:rgba(0,0,0,.25);color:inherit;font:inherit;cursor:pointer;text-align:center;transition:border-color .15s,transform .15s}
.ic-pr:hover{border-color:var(--kr,var(--teal,#e60049));transform:translateY(-2px)}
.ic-pr i{display:block;height:64px;border-radius:8px;background:#0b0912 center/cover no-repeat}
.ic-pr.logo i{background-size:contain;background-origin:content-box;padding:8px}
.ic-pr span{font-size:.76rem;font-weight:700}
@media(max-width:520px){.ic-b{padding:14px}.ic-ac .ic-btn{flex:1}}`;
    document.head.appendChild(s);
  }
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
  const btn = (t, c, f) => { const b = el('button', 'ic-btn ' + (c || ''), t); b.type = 'button'; b.onclick = f; return b; };

  function shell(title) {
    css();
    const m = el('div', 'ic-m'), b = el('div', 'ic-b');
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', title);
    b.append(el('h2', null, title)); m.append(b);
    const prev = document.activeElement;
    const close = () => { m.remove(); document.removeEventListener('keydown', key, true); try { prev && prev.focus && prev.focus(); } catch (e) {} };
    let onEsc = null;
    function key(e) {
      if (!m.isConnected) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onEsc && onEsc(); return; }
      if (e.key === 'Tab') {
        const f = [...m.querySelectorAll('button,input,canvas[tabindex]')].filter(x => !x.disabled && x.offsetParent !== null && x.type !== 'file');
        if (!f.length) return; const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    }
    document.addEventListener('keydown', key, true);
    document.body.append(m);
    return { m, b, close, esc: f => { onEsc = f; } };
  }

  function check(file) {
    if (!file || !TYPES.test(file.type)) return 'Escolha uma imagem JPG, PNG ou WebP.';
    if (file.size > MAXB) return 'A imagem deve ter menos de 8 MB.';
    return '';
  }
  function load(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('O arquivo não é uma imagem válida.')); };
      img.src = url;
    });
  }
  const toBlob = (cv, type, q) => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('Não foi possível processar a imagem.')), type || 'image/jpeg', q));

  async function pick(file, o) {
    o = o || {};
    const err = check(file); if (err) throw new Error(err);
    const img = await load(file), iw = img.naturalWidth, ih = img.naturalHeight;
    if (!iw || !ih) throw new Error('O arquivo não é uma imagem válida.');
    const W = Math.max(16, o.w | 0 || 256), H = Math.max(16, o.h | 0 || 256);
    return new Promise(resolve => {
      const ui = shell(o.title || 'Enquadrar imagem');
      const hint = el('p', 'ic-hint', o.hint || 'Arraste para mover. Use a roda do mouse, a pinça ou o controle para ampliar.');
      const st = el('div', 'ic-st'), cv = el('canvas', 'ic-cv');
      cv.tabIndex = 0; cv.setAttribute('aria-label', 'Área de enquadramento. Setas movem, mais e menos ampliam, Enter confirma.');
      st.append(cv);
      const maxW = Math.min(500, Math.max(220, innerWidth - 80)), maxH = Math.max(180, Math.min(innerHeight * 0.46, 420));
      const k = Math.min(maxW / W, maxH / H), fw = Math.round(W * k), fh = Math.round(H * k), pad = 26, dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = (fw + pad * 2) * dpr; cv.height = (fh + pad * 2) * dpr; cv.style.width = (fw + pad * 2) + 'px'; cv.style.height = (fh + pad * 2) + 'px';
      const ctx = cv.getContext('2d');
      const cover = Math.max(fw / iw, fh / ih), fit = Math.min(fw / iw, fh / ih);
      const base = o.contain ? fit : cover, zmin = o.contain ? 0.35 : 1, zmax = o.contain ? 5 : 6;
      let z = 1, cx = iw / 2, cy = ih / 2;
      const clamp = () => {
        z = Math.min(zmax, Math.max(zmin, z)); const s = base * z;
        if (o.contain) { cx = Math.min(iw, Math.max(0, cx)); cy = Math.min(ih, Math.max(0, cy)); }
        else { const hx = fw / (2 * s), hy = fh / (2 * s); cx = Math.min(iw - hx, Math.max(hx, cx)); cy = Math.min(ih - hy, Math.max(hy, cy)); }
      };
      const range = el('input'); range.type = 'range'; range.min = 0; range.max = 1000; range.setAttribute('aria-label', 'Zoom');
      const syncRange = () => { range.value = Math.round(1000 * Math.log(z / zmin) / Math.log(zmax / zmin)); };
      function draw() {
        clamp(); const s = base * z;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, fw + pad * 2, fh + pad * 2);
        const put = () => { ctx.save(); ctx.translate(pad + fw / 2, pad + fh / 2); ctx.scale(s, s); ctx.translate(-cx, -cy); ctx.drawImage(img, 0, 0); ctx.restore(); };
        ctx.globalAlpha = 0.28; put(); ctx.globalAlpha = 1;
        ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, fw, fh); ctx.clip();
        if (o.contain) { const q = 10; for (let y = 0; y < fh; y += q) for (let x = 0; x < fw; x += q) { ctx.fillStyle = ((x + y) / q) % 2 ? '#2a2733' : '#1f1c28'; ctx.fillRect(pad + x, pad + y, q, q); } }
        else { ctx.fillStyle = '#0b0912'; ctx.fillRect(pad, pad, fw, fh); }
        put();
        if (o.round) { ctx.beginPath(); ctx.rect(pad, pad, fw, fh); ctx.arc(pad + fw / 2, pad + fh / 2, Math.min(fw, fh) / 2, 0, Math.PI * 2, true); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fill('evenodd'); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(pad + .5, pad + .5, fw - 1, fh - 1);
        if (o.round) { ctx.beginPath(); ctx.arc(pad + fw / 2, pad + fh / 2, Math.min(fw, fh) / 2, 0, Math.PI * 2); ctx.stroke(); }
        syncRange();
      }
      const zoomBy = f => { z *= f; draw(); };
      range.oninput = () => { z = zmin * Math.pow(zmax / zmin, range.value / 1000); draw(); };
      const minus = el('button', 'ic-ib', '−'), plus = el('button', 'ic-ib', '+'); minus.type = plus.type = 'button';
      minus.setAttribute('aria-label', 'Diminuir'); plus.setAttribute('aria-label', 'Ampliar');
      minus.onclick = () => zoomBy(1 / 1.2); plus.onclick = () => zoomBy(1.2);
      const ct = el('div', 'ic-ct'); ct.append(minus, range, plus);
      // arrastar e pinça
      const ptr = new Map(); let pinch = 0;
      cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } };
      cv.onpointermove = e => {
        const p = ptr.get(e.pointerId); if (!p) return;
        const nx = e.clientX, ny = e.clientY;
        if (ptr.size === 1) { const rr = cv.getBoundingClientRect().width / (fw + pad * 2), s = base * z * rr; cx -= (nx - p.x) / s; cy -= (ny - p.y) / s; p.x = nx; p.y = ny; draw(); }
        else { p.x = nx; p.y = ny; const [a, b] = [...ptr.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) { z *= d / pinch; draw(); } pinch = d; }
      };
      const up = e => { ptr.delete(e.pointerId); pinch = 0; };
      cv.onpointerup = up; cv.onpointercancel = up;
      cv.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
      cv.onkeydown = e => {
        const s = base * z, st1 = 12 / s; let h = true;
        if (e.key === 'ArrowLeft') cx -= st1; else if (e.key === 'ArrowRight') cx += st1; else if (e.key === 'ArrowUp') cy -= st1; else if (e.key === 'ArrowDown') cy += st1;
        else if (e.key === '+' || e.key === '=') z *= 1.1; else if (e.key === '-') z /= 1.1; else if (e.key === 'Enter') { e.preventDefault(); done(); return; } else h = false;
        if (h) { e.preventDefault(); draw(); }
      };
      const center = () => { z = 1; cx = iw / 2; cy = ih / 2; draw(); };
      const finish = v => { ui.close(); resolve(v); };
      function done() {
        clamp(); const out = document.createElement('canvas'); out.width = W; out.height = H; const c = out.getContext('2d'), r = W / fw, s = base * z * r;
        c.imageSmoothingQuality = 'high';
        if (!o.contain) { c.fillStyle = '#0b0912'; c.fillRect(0, 0, W, H); }
        c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-cx, -cy);
        // reduz em etapas quando a imagem é muito maior que o resultado (fica mais nítido)
        let src = img; const ratio = s;
        if (ratio < 0.5) { let w = iw, h = ih, f = ratio; src = img; while (f < 0.5) { const n = document.createElement('canvas'); w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2)); n.width = w; n.height = h; n.getContext('2d').drawImage(src, 0, 0, w, h); src = n; f *= 2; }
          c.setTransform(1, 0, 0, 1, 0, 0); c.translate(W / 2, H / 2); const sc2 = ratio * (iw / src.width); c.scale(sc2, sc2); c.translate(-cx * src.width / iw, -cy * src.height / ih); }
        c.drawImage(src, 0, 0);
        finish(out);
      }
      ui.esc(() => finish(null));
      const ac = el('div', 'ic-ac');
      ac.append(btn('Centralizar', '', center), btn('Cancelar', '', () => finish(null)), btn(o.ok || 'Usar imagem', 'pri', done));
      ui.b.append(hint, st, ct, ac);
      draw(); setTimeout(() => { try { cv.focus({ preventScroll: true }); } catch (e) {} }, 30);
    });
  }

  /* escolher: enviar do aparelho ou usar um padrão do site */
  function chooser(o) {
    o = o || {};
    return new Promise(resolve => {
      const ui = shell(o.title || 'Escolher imagem'), fin = v => { ui.close(); resolve(v); };
      const inp = el('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp'; inp.hidden = true;
      inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) fin({ file: f }); };
      const up = el('button', 'ic-up'); up.type = 'button'; up.append(el('b', null, 'Enviar uma imagem'), el('small', null, 'JPG, PNG ou WebP · você enquadra na próxima etapa'));
      up.onclick = () => inp.click();
      ui.b.append(up, inp);
      if (o.presets && o.presets.length) {
        ui.b.append(el('h3', 'ic-h3', 'Padrões do site'));
        const g = el('div', 'ic-gr');
        o.presets.forEach(p => { const b = el('button', 'ic-pr' + (o.logo ? ' logo' : '')); b.type = 'button'; const i = el('i'); i.style.backgroundImage = 'url("' + p.url + '")'; b.append(i, el('span', null, p.label)); b.onclick = () => fin({ preset: p.id }); g.append(b); });
        ui.b.append(g);
      }
      const ac = el('div', 'ic-ac');
      if (o.canReset) ac.append(btn(o.resetLabel || 'Voltar ao padrão', '', () => fin({ reset: true })));
      ac.append(btn('Cancelar', '', () => fin(null))); ui.b.append(ac);
      ui.esc(() => fin(null)); setTimeout(() => { try { up.focus({ preventScroll: true }); } catch (e) {} }, 30);
    });
  }
  return { pick, chooser, toBlob, check };
})();
