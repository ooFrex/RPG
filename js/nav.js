/* Navegação de "site de verdade": botão voltar do aparelho/navegador e puxar para recarregar.
   - Voltar: enquanto houver menu, modal, ficha do CoC etc. aberto, existe UMA entrada extra no histórico.
     Ao voltar, fecha a camada de cima (o mesmo que Esc) em vez de sair do site. Sem camada aberta, voltar sai normalmente.
   - Puxar para recarregar: no topo da tela, puxe para baixo e solte. Salva a ficha antes de recarregar.
   Usado por index.html (OP) e coc.html (dentro do iframe só o "puxar", o voltar fica com a página-mãe). */
(function () {
  'use strict';
  const inFrame = window.parent !== window;
  const hooks = () => window.NavHooks || {};
  const reduce = () => matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------------- VOLTAR ---------------- */
  const LAYERS = '.modal,#home,#camp,#wiz,#mSl,#rov,#cw,#sysEd,#sedAsk,#cocView';
  let armed = false, ignore = 0, syncT = 0;

  const shown = el => !el.hidden && !el.classList.contains('out') && !(el.parentElement && el.parentElement.closest('[hidden]'));
  /* o menu inicial sem ficha aberta é a "raiz": voltar ali sai do site, então ele não conta como camada */
  const layers = () => Array.from(document.querySelectorAll(LAYERS)).filter(e => shown(e) && !(e.id === 'home' && hooks().homeRoot && hooks().homeRoot()));
  const sig = () => layers().map(e => e.id || e.className).join('|');

  function sync() {
    clearTimeout(syncT);
    const n = layers().length;
    if (n > 0 && !armed) {
      try { history.pushState({ rpgNav: 1 }, ''); armed = true; } catch (e) {}
    } else if (n === 0 && armed) {
      armed = false; ignore++;
      try { history.back(); } catch (e) { ignore--; }
      /* se o navegador não devolver o popstate, não deixa o contador preso */
      setTimeout(() => { if (ignore > 0) ignore--; }, 600);
    }
  }
  const later = (ms) => { clearTimeout(syncT); syncT = setTimeout(sync, ms == null ? 40 : ms); };

  function closeTop() {
    const before = sig();
    const h = hooks(), top = h.top && h.top();
    if (top && top.id === 'cocView') {
      /* primeiro fecha o que estiver aberto dentro da ficha do CoC; senão volta para o menu */
      let handled = false;
      try { const w = document.getElementById('cocFrame').contentWindow; handled = !!(w && typeof w.cocBack === 'function' && w.cocBack()); } catch (e) {}
      if (!handled && h.closeCoc) h.closeCoc();
      return true;
    }
    const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true });
    document.dispatchEvent(ev);
    return ev.defaultPrevented || sig() !== before;
  }

  if (!inFrame) {
    addEventListener('popstate', () => {
      if (ignore > 0) { ignore--; return; }
      if (!armed) return;           /* nada nosso aberto: deixa o navegador seguir */
      armed = false;                /* a entrada extra foi consumida pelo voltar */
      closeTop();
      /* camadas que fecham com animação ainda aparecem abertas: reabre a entrada já, e ela some quando fecharem */
      if (layers().length) { try { history.pushState({ rpgNav: 1 }, ''); armed = true; } catch (e) {} }
      later(60);
    });
    new MutationObserver(() => later(40)).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    addEventListener('load', () => later(0));
    /* depois de recarregar com a entrada extra ainda no histórico, ela vira uma entrada comum */
    try { if (history.state && history.state.rpgNav) history.replaceState(null, ''); } catch (e) {}
    /* voltou da tela do Google pelo botão voltar (página restaurada da memória): recarrega limpo para não ficar "abrindo o login…" */
    addEventListener('pageshow', e => { if (e.persisted) { try { if (sessionStorage.getItem('rpg-auth-return')) { sessionStorage.removeItem('rpg-auth-return'); location.reload(); } } catch (x) {} } });
  }

  /* ---------------- PUXAR PARA RECARREGAR ---------------- */
  const css = document.createElement('style');
  css.textContent =
    'html,body{overscroll-behavior-y:contain}' +
    '#ptr{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 6px);width:40px;height:40px;margin-left:-20px;border-radius:50%;z-index:2147483000;display:grid;place-items:center;pointer-events:none;opacity:0;' +
    'background:var(--panel,#1b1b1f);color:var(--tx,#fff);border:1px solid var(--line,rgba(255,255,255,.25));box-shadow:0 4px 16px rgba(0,0,0,.45);font:700 20px/1 system-ui,sans-serif;will-change:transform,opacity}' +
    '#ptr.go svg{animation:ptrspin .8s linear infinite}' +
    '@keyframes ptrspin{to{transform:rotate(360deg)}}' +
    '@media (prefers-reduced-motion:reduce){#ptr.go svg{animation:none}}';
  document.head.appendChild(css);
  const ind = document.createElement('div');
  ind.id = 'ptr'; ind.setAttribute('aria-hidden', 'true');
  ind.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>';
  document.body.appendChild(ind);

  const NOPTR = 'input,textarea,select,canvas,iframe,[contenteditable],[data-noptr],.bk-grip,.hex,#rov,#sysEd,#cw,#wiz,#camp,.modal,.mbox';
  const THRESH = 70, MAXPULL = 120;
  let st = null, busy = false;

  /* a área rolável sob o dedo precisa estar no topo */
  function atTop(el) {
    for (; el && el !== document.documentElement; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el.scrollTop > 0) return false;
    }
    const se = document.scrollingElement;
    return !se || se.scrollTop <= 0;
  }
  const draw = d => {
    const p = Math.min(1, d / THRESH);
    ind.style.opacity = String(Math.min(1, p * 1.2));
    ind.style.transform = 'translateY(' + Math.round(Math.min(d, MAXPULL) * 0.55) + 'px) rotate(' + Math.round(p * 270) + 'deg)';
  };
  const hide = () => {
    ind.style.transition = reduce() ? 'none' : 'transform .2s, opacity .2s';
    ind.style.opacity = '0'; ind.style.transform = 'translateY(0)';
    setTimeout(() => { ind.style.transition = ''; }, 220);
  };

  addEventListener('touchstart', e => {
    st = null;
    if (busy || e.touches.length !== 1 || !matchMedia('(pointer:coarse)').matches) return;
    const tg = e.target;
    if (!tg || !tg.closest || tg.closest(NOPTR) || !atTop(tg)) return;
    st = { x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0, on: false };
  }, { passive: true });

  addEventListener('touchmove', e => {
    if (!st || busy) return;
    const t = e.touches[0], dx = t.clientX - st.x, dy = t.clientY - st.y;
    if (!st.on) {
      if (dy < -6 || Math.abs(dx) > Math.abs(dy)) { st = null; return; }   /* rolando para baixo ou deslizando de lado */
      if (dy < 12) return;
      st.on = true;
    }
    st.d = dy;
    if (e.cancelable) e.preventDefault();
    draw(dy);
  }, { passive: false });

  const end = () => {
    if (!st) return;
    const go = st.on && st.d >= THRESH; st = null;
    if (go) refresh(); else hide();
  };
  addEventListener('touchend', end, { passive: true });
  addEventListener('touchcancel', () => { if (st) { st = null; hide(); } }, { passive: true });

  function refresh() {
    if (busy) return; busy = true;
    ind.classList.add('go'); ind.style.opacity = '1'; ind.style.transform = 'translateY(' + Math.round(THRESH * 0.55) + 'px)';
    /* salva o que estiver pendente antes de recarregar */
    try { const h = hooks(); if (h.flush) h.flush(); } catch (e) {}
    try { if (typeof window.cocFlush === 'function') window.cocFlush(); } catch (e) {}
    const reload = () => { try { location.reload(); } catch (e) { busy = false; hide(); } };
    if (armed && !inFrame) {
      /* desfaz a entrada extra do histórico antes, para o voltar não ficar "dobrado" depois do recarregamento */
      armed = false; ignore++;
      let done = false; const go = () => { if (!done) { done = true; reload(); } };
      addEventListener('popstate', go, { once: true });
      try { history.back(); } catch (e) { go(); }
      setTimeout(go, 350);
    } else setTimeout(reload, 120);
  }

  window.Nav = { refresh, sync };
})();
