/* ===== DiceFx: dados 3D com física (three.js + cannon.js + motor "dice", MIT). Os resultados vêm da ficha; aqui só se encena. =====
 * Nada disso roda até a primeira rolagem 3D: as bibliotecas ficam em <script type="text/plain"> e só são executadas sob demanda.
 * API: can(items) · mount(host, items) -> { roll(), skip(), pick(indices), destroy(), rolling }
 * item padrão {s, v} (s = faces, v = resultado 1..s) · item bruto {t:'d100', v:0..90} (dezenas) ou {t:'d9', v:0..9} (unidade)
 */
window.DiceFx = (function () {
  const SIDES = [4, 6, 8, 10, 12, 20, 100], MAXDICE = 20;
  let box = null, gl = null, AC = null, buf = null, slices = [], sfxTried = false;

  function glOk() {
    if (gl !== null) return gl;
    try { const c = document.createElement('canvas'); gl = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { gl = false; }
    return gl;
  }
  const okStd = x => SIDES.indexOf(x.s) >= 0 && Number.isInteger(x.v) && x.v >= 1 && x.v <= x.s;
  const okRaw = x => (x.t === 'd100' && x.v >= 0 && x.v <= 90 && x.v % 10 === 0) || (x.t === 'd9' && Number.isInteger(x.v) && x.v >= 0 && x.v <= 9);
  function expand(items) {
    const out = [];
    items.forEach((it, k) => {
      if (it.t) out.push({ t: it.t, v: it.v, item: k });
      else if (it.s === 100) { const v = it.v % 100; out.push({ t: 'd100', v: Math.floor(v / 10) * 10, item: k }, { t: 'd9', v: v % 10, item: k }); }
      else out.push({ t: 'd' + it.s, v: it.v, item: k });
    });
    return out;
  }
  function can(items) {
    if (!items || !items.length || !glOk()) return false;
    if (!items.every(x => x.t ? okRaw(x) : okStd(x))) return false;
    return expand(items).length <= MAXDICE;
  }

  /* ---- cores: seguem o tema/acento da ficha ---- */
  function theme() {
    const cs = getComputedStyle(document.documentElement);
    const pk = (ns, d) => { for (const n of ns) { const m = /^#([0-9a-f]{6})$/i.exec(cs.getPropertyValue(n).trim()); if (m) return [0, 2, 4].map(i => parseInt(m[1].substr(i, 2), 16)); } return d; };
    const css = c => 'rgb(' + c.join(',') + ')';
    // CoC não define --pur: usa --teal/--brass e a mesma conta de cores dos dados leves antigos (visual preservado)
    if (!/^#[0-9a-f]{6}$/i.test(cs.getPropertyValue('--pur').trim()) && /^#[0-9a-f]{6}$/i.test(cs.getPropertyValue('--teal').trim())) {
      const a = pk(['--teal'], [63, 184, 156]), g = pk(['--brass', '--gold'], [210, 174, 94]);
      return { body: css(a.map(x => Math.round(x * .55 + 14))), num: css(g.map(x => Math.round(x * .35 + 165))), tens: css(g.map(x => Math.round(x * .3 + 22))) };
    }
    const a = pk(['--pur'], [148, 64, 207]), g = pk(['--gold'], [224, 176, 74]);
    return { body: css(a.map(x => Math.round(x * .4 + 10))), num: css(g.map(x => Math.round(x * .15 + 214))), tens: css(g.map(x => Math.round(x * .3 + 22))) };
  }

  /* ---- som: o chocalho do projeto, cortado em pedacinhos, um por batida (volume pela força) ---- */
  const sndOff = () => { try { return localStorage.getItem('op-ficha-snd') === '0'; } catch (e) { return false; } };
  function sfxInit() {
    if (sfxTried) { if (AC && AC.state === 'suspended') AC.resume(); return; }
    sfxTried = true;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      const done = b => {
        buf = b;
        const d = b.getChannelData(0), win = Math.floor(b.sampleRate * .08), hop = Math.floor(b.sampleRate * .04), rms = [];
        for (let o = 0; o + win < d.length; o += hop) { let s = 0; for (let i = o; i < o + win; i++) s += d[i] * d[i]; rms.push([o / b.sampleRate, Math.sqrt(s / win)]); }
        const mx = Math.max(0, ...rms.map(x => x[1]));
        slices = rms.filter(x => x[1] > mx * .3 && x[0] + .2 < b.duration).map(x => x[0]);
      };
      fetch('assets/dice.mp3').then(r => r.arrayBuffer())
        .then(ab => AC.decodeAudioData(ab, done, () => {}))
        .catch(() => {});
    } catch (e) { AC = null; }
  }
  let voices = 0;
  function hit(vol) {
    if (!AC || sndOff() || voices > 8) return;
    try {
      if (AC.state === 'suspended') AC.resume();
      const t = AC.currentTime, g = AC.createGain();
      g.connect(AC.destination);
      voices++;
      if (buf && slices.length) {
        const s = AC.createBufferSource(), len = .09 + Math.random() * .08;
        s.buffer = buf;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(Math.min(1, vol * .9), t + .004); g.gain.exponentialRampToValueAtTime(.001, t + len);
        s.connect(g); s.onended = () => { voices--; g.disconnect(); };
        s.start(t, slices[Math.floor(Math.random() * slices.length)], len + .02);
      } else {   // sem o arquivo: estalo sintético
        const n = Math.floor(AC.sampleRate * .06), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
        const s = AC.createBufferSource(), f = AC.createBiquadFilter();
        s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1400 + Math.random() * 1600; f.Q.value = 1.2; g.gain.value = vol * .5;
        s.connect(f); f.connect(g); s.onended = () => { voices--; g.disconnect(); }; s.start(t);
      }
    } catch (e) { voices = Math.max(0, voices - 1); }
  }

  /* ---- bibliotecas sob demanda ---- */
  function load(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }
  async function boot() {
    if (!box) {
      if (!window.THREE) await load('js/vendor/three.min.js');
      if (!window.CANNON) await load('js/vendor/cannon.min.js');
      if (!window.DICE) await load('js/vendor/dice-engine.js');
      box = new DICE.dice_box();                   // lança se o WebGL falhar
      box.onhit = v => hit(v);
    }
    DICE.set_theme(theme());
    return box;
  }

  function mount(host, items) {
    const spec = expand(items), types = spec.map(x => x.t), values = spec.map(x => x.v);
    let ro = null, pendingFit = false, gone = false, settle = null;
    const api = {
      get rolling() { return !!(box && box.rolling); },
      async roll() {
        const b = await boot();
        if (gone) return;
        if (!b.attach(host)) throw new Error('mesa sem tamanho');
        sfxInit();
        if (window.ResizeObserver) {
          ro = new ResizeObserver(() => { if (gone) return; if (b.rolling) pendingFit = true; else b.fit(); });
          ro.observe(host);
        }
        return new Promise((res, rej) => {
          settle = res;
          const ok = b.throwSet(types, values, () => { if (pendingFit && !gone) { pendingFit = false; b.fit(); } res(); });
          if (!ok) rej(new Error('os dados já estão rolando'));
        });
      },
      skip() { if (box && box.rolling) box.skip(); },
      // mantém em destaque só os itens indicados (índices dos itens originais); os outros dados ficam apagados
      pick(idx) {
        if (!box) return;
        const keep = []; spec.forEach((x, i) => { if (idx.indexOf(x.item) >= 0) keep.push(i); });
        if (keep.length && keep.length < spec.length) box.highlight(keep);
      },
      destroy() {
        gone = true;
        if (ro) { ro.disconnect(); ro = null; }
        if (box) { box.stop(); box.clear(); box.detach(); }
        if (settle) { settle(); settle = null; }
      }
    };
    return api;
  }
  return { can, mount };
})();

