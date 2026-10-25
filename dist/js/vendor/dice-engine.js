"use strict";
/* ===== Motor de dados 3D (three.js + cannon.js) =====
 * Baseado em "dice" de Sarah Rosanna Busch (MIT), que vem do projeto de Anton Natarov (Teal).
 * Mudanças para a ficha:
 *  - uma única instância reaproveitada entre rolagens (contexto WebGL, shaders e texturas ficam em cache);
 *  - a mesa é o elemento onde o canvas está: paredes, câmera, tamanho dos dados, gravidade e força do arremesso
 *    saem do tamanho real da área (e da quantidade de dados), então nada voa para fora nem bate com força demais;
 *  - os resultados vêm da ficha (throwSet): a física só encena, e as faces são renomeadas para bater com o resultado;
 *  - passo de física fixo com acumulador (mesmo resultado em qualquer taxa de quadros, sem ficar lento em celular fraco);
 *  - geometrias e materiais em cache; sons por colisão (callback onhit); destacar / escurecer dados depois da rolagem.
 */
window.DICE = (function () {
    var that = {};
    var TAU = Math.PI * 2;
    function rnd() { return Math.random(); }
    function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

    var vars = {
        frame_rate: 1 / 60,
        TEX: 100,                     // escala de referência das texturas (fixa; só a geometria muda de tamanho)
        material_options: { specular: 0x050505, color: 0xd8d8d8, shininess: 8, shading: THREE.FlatShading },
        label_color: '#aaaaaa',       // números
        dice_color: '#202020',        // corpo dos dados
        tens_color: '#202020',        // corpo do dado das dezenas (d100)
        ambient_light_color: 0xa8a8a8,
        spot_light_color: 0xefefef,
        desk_color: 0x101010,
        desk_opacity: 0.32,
        stop_v: 4, stop_a: 3.5, stop_n: 3, max_time: 7, iters: 14,     // limites de "parou": velocidade linear (por S_REF), angular e passos seguidos
        G0: 9.8 * 800,                // gravidade de referência (para dados de raio S_REF)
        S_REF: 70
    };

    var CONSTS = {
        known_types: ['d4', 'd6', 'd8', 'd9', 'd10', 'd12', 'd20', 'd100'],
        dice_face_range: { 'd4': [1, 4], 'd6': [1, 6], 'd8': [1, 8], 'd9': [0, 9], 'd10': [0, 9],
            'd12': [1, 12], 'd20': [1, 20], 'd100': [0, 9] },
        dice_mass: { 'd4': 300, 'd6': 300, 'd8': 340, 'd9': 350, 'd10': 350, 'd12': 350, 'd20': 400, 'd100': 350 },
        dice_inertia: { 'd4': 5, 'd6': 13, 'd8': 10, 'd9': 9, 'd10': 9, 'd12': 8, 'd20': 6, 'd100': 9 },
        // margem do número em cada tipo (quanto maior, menor o número na face)
        label_margin: { 'd6': 0.9, 'd8': 1.4, 'd9': 1.0, 'd10': 1.0, 'd12': 1.0, 'd20': 1.2, 'd100': 1.5 },
        // quantos rótulos cada tipo precisa (índice 0 = face em branco, 1 = '0', 2 = '1'...)
        label_count: { 'd6': 8, 'd8': 10, 'd9': 11, 'd10': 11, 'd12': 14, 'd20': 22 },
        standart_d20_dice_face_labels: [' ', '0', '1', '2', '3', '4', '5', '6', '7', '8',
            '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
        standart_d100_dice_face_labels: [' ', '00', '10', '20', '30', '40', '50',
            '60', '70', '80', '90'],
        d4_labels: [
            [[], [0, 0, 0], [2, 4, 3], [1, 3, 4], [2, 1, 4], [1, 2, 3]],
            [[], [0, 0, 0], [2, 3, 4], [3, 1, 4], [2, 4, 1], [3, 2, 1]],
            [[], [0, 0, 0], [4, 3, 2], [3, 4, 1], [4, 2, 1], [3, 1, 2]],
            [[], [0, 0, 0], [4, 2, 3], [1, 4, 3], [4, 1, 2], [1, 3, 2]]
        ]
    };

    /* ---------- caches (compartilhados entre rolagens) ---------- */
    var mats = {};      // materiais (texturas) por tipo
    var variants = {};  // materiais "escurecido" / "destaque"
    var geos = {};      // geometrias por tipo, no tamanho atual
    var sgeos = {};     // geometrias com as faces renomeadas ("tipo|deslocamento")
    var geoScale = 0;

    function drop_geometries() {
        for (var k in geos) geos[k].dispose();
        for (var k2 in sgeos) sgeos[k2].dispose();
        geos = {}; sgeos = {};
    }
    function drop_materials() {
        function kill(ms) { ms.materials.forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); }
        for (var k in mats) kill(mats[k]);
        for (var k2 in variants) variants[k2].materials.forEach(function (m) { m.dispose(); });
        mats = {}; variants = {};
    }

    // cores: { body:'#rrggbb', num:'#rrggbb', tens:'#rrggbb' }
    that.tune = function (o) { for (var k in o) vars[k] = o[k]; };

    that.set_theme = function (t) {
        if (!t) return;
        if (t.body === vars.dice_color && t.num === vars.label_color && t.tens === vars.tens_color) return;
        vars.dice_color = t.body; vars.label_color = t.num; vars.tens_color = t.tens || t.body;
        drop_materials();
    };

    /* ---------- a mesa ---------- */

    // @param container elemento (com tamanho próprio) onde o canvas vai ficar
    that.dice_box = function (container) {
        this.dices = [];
        this.scene = new THREE.Scene();
        this.world = new CANNON.World();
        this.container = null;
        this.rolling = false;
        this.running = false;
        this.silent = false;
        this.onhit = null;
        this.S = 60; this.w = 100; this.h = 100; this.wall_x = 90; this.wall_y = 90;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // lança se não houver WebGL
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.setClearColor(0xffffff, 0);
        this.canvas = this.renderer.domElement;
        this.canvas.style.cssText = 'position:absolute;left:0;top:0;display:block';

        this.world.gravity.set(0, 0, -vars.G0);
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 16;

        this.scene.add(new THREE.AmbientLight(vars.ambient_light_color));

        this.dice_body_material = new CANNON.Material();
        var desk_body_material = new CANNON.Material();
        var barrier_body_material = new CANNON.Material();
        // (material A, material B, atrito, restituição)
        this.world.addContactMaterial(new CANNON.ContactMaterial(desk_body_material, this.dice_body_material, 0.01, 0.5));
        this.world.addContactMaterial(new CANNON.ContactMaterial(barrier_body_material, this.dice_body_material, 0.02, 0.5));
        this.world.addContactMaterial(new CANNON.ContactMaterial(this.dice_body_material, this.dice_body_material, 0, 0.5));

        this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material));
        // quatro paredes (normais apontando para dentro da mesa); as posições são ajustadas em update_walls()
        this.walls = [];
        var axes = [[1, 0, 0, Math.PI / 2], [1, 0, 0, -Math.PI / 2], [0, 1, 0, -Math.PI / 2], [0, 1, 0, Math.PI / 2]];
        for (var i = 0; i < 4; i++) {
            var b = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
            b.quaternion.setFromAxisAngle(new CANNON.Vec3(axes[i][0], axes[i][1], axes[i][2]), axes[i][3]);
            this.world.add(b);
            this.walls.push(b);
        }
        this.iteration = 0;
        this.acc = 0;
        this.last_time = 0;
        if (container) this.attach(container);
    };
    var P = that.dice_box.prototype;

    // põe o canvas dentro de um elemento e ajusta tudo ao tamanho dele. Devolve false se o elemento não tem tamanho.
    P.attach = function (container) {
        this.container = container;
        if (this.canvas.parentNode !== container) container.appendChild(this.canvas);
        return this.fit();
    };

    P.detach = function () {
        this.stop();
        if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
        this.container = null;
    };

    // recalcula câmera, luz, mesa e paredes (ao anexar e quando a área muda de tamanho)
    P.fit = function () {
        var c = this.container;
        if (!c) return false;
        var cw = c.clientWidth, ch = c.clientHeight;
        if (cw < 40 || ch < 40) return false;
        this.w = cw / 2; this.h = ch / 2;
        this.renderer.setSize(cw, ch);

        this.wh = this.h / Math.tan(10 * Math.PI / 180);
        if (this.camera) this.scene.remove(this.camera);
        this.camera = new THREE.PerspectiveCamera(20, cw / ch, 1, this.wh * 1.5);
        this.camera.position.z = this.wh;

        var mw = Math.max(this.w, this.h);
        if (this.light) this.scene.remove(this.light);
        this.light = new THREE.SpotLight(vars.spot_light_color, 1.0);
        this.light.position.set(-mw / 2, mw / 2, mw * 2);
        this.light.target.position.set(0, 0, 0);
        this.light.distance = mw * 5;
        this.light.castShadow = true;
        this.light.shadowCameraNear = mw / 10;
        this.light.shadowCameraFar = mw * 5;
        this.light.shadowCameraFov = 50;
        this.light.shadowBias = 0.001;
        this.light.shadowDarkness = 1.1;
        this.light.shadowMapWidth = 1024;
        this.light.shadowMapHeight = 1024;
        this.scene.add(this.light);

        if (this.desk) { this.scene.remove(this.desk); this.desk.geometry.dispose(); this.desk.material.dispose(); }
        this.desk = new THREE.Mesh(new THREE.PlaneGeometry(this.w * 2, this.h * 2, 1, 1),
            new THREE.MeshPhongMaterial({ color: vars.desk_color, opacity: vars.desk_opacity, transparent: true }));
        this.desk.receiveShadow = true;
        this.scene.add(this.desk);

        this.update_walls();
        // dados parados que ficaram fora da mesa nova voltam para dentro
        for (var i = 0; i < this.dices.length; i++) {
            var b = this.dices[i].body, m = this.S * 1.05;
            b.position.x = clamp(b.position.x, -this.wall_x + m, this.wall_x - m);
            b.position.y = clamp(b.position.y, -this.wall_y + m, this.wall_y - m);
            this.dices[i].position.copy(b.position);
        }
        this.render();
        return true;
    };

    // as paredes ficam um pouco para dentro da borda: a perspectiva "estufa" a parte de cima do dado
    P.update_walls = function () {
        var bulge = this.S * 2 / this.wh;                    // quanto o topo do dado aparece a mais, em proporção
        var mx = this.w * bulge + 3, my = this.h * bulge + 3;
        this.wall_x = Math.max(this.S * 2, this.w - mx);
        this.wall_y = Math.max(this.S * 2, this.h - my);
        this.walls[0].position.set(0, this.wall_y, 0);
        this.walls[1].position.set(0, -this.wall_y, 0);
        this.walls[2].position.set(this.wall_x, 0, 0);
        this.walls[3].position.set(-this.wall_x, 0, 0);
    };

    // tamanho dos dados e física de acordo com a mesa e a quantidade
    P.pick_scale = function (n) {
        var W = this.w * 2, H = this.h * 2;
        var base = clamp(Math.min(W, H) * 0.17, 22, 72);                          // raio máximo (px)
        var fit = Math.sqrt(0.2 * W * H / (Math.max(1, n) * Math.PI));            // dados ocupam no máximo ~20% da mesa
        this.S = Math.round(clamp(Math.min(base, fit), 16, 72));
        this.world.gravity.set(0, 0, -vars.G0 * this.S / vars.S_REF);             // mesma "velocidade" em qualquer tamanho
        this.update_walls();
        ensure_scale(this.S);
    };

    P.render = function () { if (this.camera) this.renderer.render(this.scene, this.camera); };

    /* ---------- jogada ---------- */

    // types: ['d20','d6',...]  values: resultados desejados (d100 = dezenas 0..90; d9 = 0..9)
    // done(resultados): chamado quando os dados param. Devolve false se já está rolando.
    P.throwSet = function (types, values, done) {
        if (this.rolling || !types.length) return false;
        this.rolling = true;
        this.done = done;
        this.pick_scale(types.length);
        this.world.solver.iterations = vars.iters;
        var vectors = this.make_vectors(types);
        var box = this;
        this.roll(vectors, values, function (res) {
            box.rolling = false;
            if (box.done) { var d = box.done; box.done = null; d(res); }
        });
        return true;
    };

    // posições iniciais (espalhadas, sem dados dentro uns dos outros), velocidade e giro
    P.make_vectors = function (types) {
        var n = types.length, S = this.S, wx = this.wall_x, hy = this.wall_y;
        var ang = rnd() * TAU, dx = Math.cos(ang), dy = Math.sin(ang);
        var ix = Math.max(S * 1.1, wx - 1.3 * S), iy = Math.max(S * 1.1, hy - 1.3 * S);   // onde o centro pode nascer
        var k = 1 / Math.max(Math.abs(dx), Math.abs(dy));
        var px = -dx * k * ix, py = -dy * k * iy;                                          // ponto de saída (lado oposto à direção)
        var chord = Math.hypot(2 * px, 2 * py);                                            // distância que dá para percorrer
        var perp = { x: -dy, y: dx };
        var zspan = S * (0.8 + 0.9 * Math.sqrt(n));
        var placed = [], vectors = [];
        for (var i = 0; i < n; i++) {
            var pos = null;
            for (var tries = 0; tries < 60; tries++) {
                var lat = (rnd() * 2 - 1) * Math.min(Math.max(ix, iy), S * (1.4 + 1.1 * Math.sqrt(n)));
                                var x = clamp(px + perp.x * lat, -ix, ix), y = clamp(py + perp.y * lat, -iy, iy);
                var z = S * 2.6 + rnd() * zspan;
                var ok = true;
                for (var j = 0; j < placed.length; j++) {
                    var q = placed[j];
                    if (Math.hypot(q.x - x, q.y - y, q.z - z) < S * 2.5) { ok = false; break; }
                }
                pos = { x: x, y: y, z: z };
                if (ok) break;
                if (tries > 40) zspan += S * 0.35;   // sem lugar: abre mais espaço na altura
            }
            placed.push(pos);
            var jit = (rnd() - 0.5) * 0.6;
            var vx = dx * Math.cos(jit) - dy * Math.sin(jit), vy = dx * Math.sin(jit) + dy * Math.cos(jit);
            var boost = chord * (1.5 + rnd() * 0.7);
            var inertia = CONSTS.dice_inertia[types[i]];
            vectors.push({
                set: types[i], pos: pos,
                velocity: { x: vx * boost, y: vy * boost, z: -10 * S / vars.S_REF },
                angle: { x: -(rnd() * vy * 5 + inertia * vy), y: rnd() * vx * 5 + inertia * vx, z: 0 },
                axis: { x: rnd(), y: rnd(), z: rnd(), a: rnd() }
            });
        }
        return vectors;
    };

    P.create_dice = function (type, pos, velocity, angle, axis) {
        var dice = make_mesh(type, this.S);
        dice.castShadow = true;
        dice.dice_type = type;
        dice.body = new CANNON.RigidBody(CONSTS.dice_mass[type], dice.geometry.cannon_shape, this.dice_body_material);
        dice.body.position.set(pos.x, pos.y, pos.z);
        dice.body.quaternion.setFromAxisAngle(new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * TAU);
        dice.body.angularVelocity.set(angle.x, angle.y, angle.z);
        dice.body.velocity.set(velocity.x, velocity.y, velocity.z);
        dice.body.linearDamping = 0.1;
        dice.body.angularDamping = 0.1;
        var box = this, S = this.S;
        dice.body.addEventListener('collide', function (e) {
            if (box.silent || !box.onhit) return;
            var vi = dice.body.velocity, vj = e.with.velocity, n = e.contact && e.contact.ni;
            if (!n) return;
            var vn = Math.abs((vi.x - vj.x) * n.x + (vi.y - vj.y) * n.y + (vi.z - vj.z) * n.z);
            var imp = vn / (S * 26);                       // 1 = queda de ~3 raios de altura
            var t = box.iteration;
            if (imp < 0.1 || t - (dice.last_hit || -99) < 4) return;
            dice.last_hit = t;
            box.onhit(clamp(imp, 0.1, 1), e.with.mass === 0);
        });
        this.scene.add(dice);
        this.dices.push(dice);
        this.world.add(dice.body);
    };

    // regras de parada: tudo (quase) parado por alguns passos, ou tempo máximo (10 s)
    P.check_if_throw_finished = function () {
        var res = true;
        var e = vars.stop_v * this.S / vars.S_REF + 1.5;
        var ea = vars.stop_a;
        if (this.iteration < vars.max_time / vars.frame_rate) {
            for (var i = 0; i < this.dices.length; ++i) {
                var dice = this.dices[i];
                if (dice.dice_stopped === true) continue;
                var a = dice.body.angularVelocity, v = dice.body.velocity;
                if (Math.abs(a.x) < ea && Math.abs(a.y) < ea && Math.abs(a.z) < ea &&
                    Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
                    if (dice.dice_stopped) {
                        if (this.iteration - dice.dice_stopped > vars.stop_n) {
                            dice.dice_stopped = true;
                            continue;
                        }
                    }
                    else dice.dice_stopped = this.iteration;
                    res = false;
                }
                else {
                    dice.dice_stopped = undefined;
                    res = false;
                }
            }
        }
        return res;
    };

    // dado parado encostado na parede/em outro dado: vira a face mais próxima do chão para baixo (ajuste de até ~50°).
    // Mexe só no estado final da física; devolve o que mudou para a animação.
    P.settle_flat = function () {
        var changes = [], down = new THREE.Vector3(0, 0, -1);
        for (var i = 0; i < this.dices.length; i++) {
            var d = this.dices[i], b = d.body;
            var q = new THREE.Quaternion(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
            var best = null, bd = -2;
            for (var f = 0; f < d.geometry.faces.length; f++) {
                var face = d.geometry.faces[f];
                if (face.materialIndex == 0) continue;
                var dt = face.normal.clone().applyQuaternion(q).dot(down);
                if (dt > bd) { bd = dt; best = face; }
            }
            if (!best) continue;
            var ang = Math.acos(clamp(bd, -1, 1));
            if (ang < 0.004 || ang > 0.9) continue;
            var n = best.normal.clone().applyQuaternion(q);
            var axis = new THREE.Vector3().crossVectors(n, down).normalize();
            var qc = new THREE.Quaternion().setFromAxisAngle(axis, ang);
            var q1 = qc.multiply(q);
            var ch = { dice: d, q0: q.clone(), z0: b.position.z };
            b.quaternion.set(q1.x, q1.y, q1.z, q1.w);
            if (b.position.z < this.S * 1.6) b.position.z = best.normal.dot(d.geometry.vertices[best.a]);   // encosta a face no chão
            ch.q1 = q1; ch.z1 = b.position.z;
            changes.push(ch);
        }
        return changes;
    };

    P.sync = function () {
        for (var i = 0; i < this.dices.length; i++) {
            var d = this.dices[i];
            d.position.copy(d.body.position);
            d.quaternion.copy(d.body.quaternion);
        }
    };

    P.__animate = function (threadid) {
        if (this.running !== threadid) return;
        var now = performance.now();
        var dt = Math.min((now - this.last_time) / 1000, 0.1);
        this.last_time = now;
        this.acc += dt;
        var fr = vars.frame_rate, steps = 0, finished = false;
        while (this.acc >= fr && steps < 6) {                // passo fixo: igual à simulação prévia
            this.acc -= fr; ++this.iteration; ++steps;
            this.world.step(fr);
            if (this.check_if_throw_finished()) { finished = true; break; }
        }
        if (steps >= 6) this.acc = 0;                        // aparelho lento: descarta o atraso em vez de acumular
        this.sync();
        this.render();
        if (finished) { this.finish(false); return; }
        var t = this;
        requestAnimationFrame(function () { t.__animate(threadid); });
    };

    P.finish = function (instant) {
        this.running = false;
        this.sync();
        var changes = this.settle_flat(), box = this;
        var values = get_dice_values(this.dices);
        function end() {
            box.sync();
            box.render();
            if (box.callback) { var cb = box.callback; box.callback = null; cb.call(box, values); }
        }
        if (instant || !changes.length) { end(); return; }
        // assenta devagar: o dado termina de tombar em ~0,2 s
        var t0 = performance.now(), dur = 220, q = new THREE.Quaternion();
        this.settling = true;
        (function step() {
            var k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 2);
            for (var i = 0; i < changes.length; i++) {
                var c = changes[i];
                THREE.Quaternion.slerp(c.q0, c.q1, q, e);
                c.dice.quaternion.copy(q);
                c.dice.position.z = c.z0 + (c.z1 - c.z0) * e;
            }
            box.render();
            if (k < 1) requestAnimationFrame(step); else { box.settling = false; end(); }
        })();
    };

    // termina já: roda o resto da simulação sem desenhar (o resultado é o mesmo)
    P.skip = function () {
        if (this.emulating) { this.want_skip = true; return; }
        if (!this.running) return;
        this.running = false;
        this.silent = true;
        while (!this.check_if_throw_finished()) { ++this.iteration; this.world.step(vars.frame_rate); }
        this.silent = false;
        this.finish(true);
    };

    P.stop = function () {
        this.token = (this.token || 0) + 1;
        this.emulating = false;
        this.silent = false;
        this.running = false;
        this.callback = null;
        this.rolling = false;
        this.done = null;
    };

    P.clear = function () {
        this.running = false;
        var dice;
        while ((dice = this.dices.pop())) {
            this.scene.remove(dice);
            if (dice.body) this.world.remove(dice.body);
        }
    };

    P.prepare_dices_for_roll = function (vectors) {
        this.clear();
        this.iteration = 0;
        for (var i = 0; i < vectors.length; i++) {
            this.create_dice(vectors[i].set, vectors[i].pos, vectors[i].velocity, vectors[i].angle, vectors[i].axis);
        }
    };

    P.roll = function (vectors, values, callback) {
        var box = this, token = this.token = (this.token || 0) + 1;
        this.callback = callback;
        this.want_skip = false;
        this.prepare_dices_for_roll(vectors);
        function launch(res) {
            box.prepare_dices_for_roll(vectors);
            if (res) for (var i = 0; i < res.length; i++) shift_dice_faces(box.dices[i], values[i], res[i]);
            box.acc = 0;
            box.last_time = performance.now();
            box.running = box.last_time;
            box.sync();
            if (box.want_skip) { box.skip(); return; }
            box.__animate(box.running);
        }
        if (!(values && values.length)) { launch(null); return; }
        // pré-simulação em fatias de ~10 ms para a tela não travar (com muitos dados pode levar alguns instantes)
        this.emulating = true;
        this.silent = true;
        (function slice() {
            if (box.token !== token) return;
            var t0 = performance.now();
            while (!box.check_if_throw_finished()) {
                ++box.iteration;
                box.world.step(vars.frame_rate);
                if (performance.now() - t0 > 10) { setTimeout(slice, 0); return; }
            }
            box.silent = false;
            box.emulating = false;
            box.settle_flat();
            launch(get_dice_values(box.dices));
        })();
    };

    // deixa só os dados de índice em "keep" em destaque; os outros ficam apagados
    P.highlight = function (keep) {
        for (var i = 0; i < this.dices.length; i++) {
            var d = this.dices[i], on = keep.indexOf(i) >= 0;
            d.material = variant(d.base_material || (d.base_material = d.material), on ? 'gold' : 'dim');
            d.castShadow = on;
        }
        this.render();
    };

    /* ---------- notação (ex.: "2d6+1d8+3") — usada só para validar fórmulas ---------- */
    that.parse_notation = function (notation) {
        var dr0 = /\s*(\d*)([a-z]+)(\d+)(\s*(\+|\-)\s*(\d+)){0,1}\s*(\+|$)/gi;
        var ret = { set: [], constant: 0, error: false }, res;
        while ((res = dr0.exec(notation))) {
            if (res[2] != 'd') { ret.error = true; continue; }
            var count = res[1] == '' ? 1 : parseInt(res[1], 10), type = 'd' + res[3];
            if (CONSTS.known_types.indexOf(type) == -1) { ret.error = true; continue; }
            while (count--) ret.set.push(type);
            if (res[5] && res[6]) ret.constant += (res[5] == '+' ? 1 : -1) * parseInt(res[6], 10);
        }
        return ret;
    };

    /* ---------- geometrias, materiais, malhas ---------- */

    function ensure_scale(S) {
        if (geoScale === S) return;
        drop_geometries();
        geoScale = S;
    }

    function geo_for(type) {
        var S = geoScale, key = type === 'd9' || type === 'd100' ? 'd10' : type;
        if (geos[key]) return geos[key];
        var g;
        switch (key) {
            case 'd4': g = create_d4_geometry(S * 1.2); break;
            case 'd6': g = create_d6_geometry(S * 1.1); break;
            case 'd8': g = create_d8_geometry(S); break;
            case 'd10': g = create_d10_geometry(S * 0.9); break;
            case 'd12': g = create_d12_geometry(S * 0.9); break;
            default: g = create_d20_geometry(S);
        }
        return geos[key] = g;
    }

    function material_for(type, d4variant) {
        if (type === 'd4') {
            var k4 = 'd4_' + (d4variant || 0);
            return mats[k4] || (mats[k4] = new THREE.MeshFaceMaterial(
                create_d4_materials(vars.TEX / 2, vars.TEX * 2, CONSTS.d4_labels[d4variant || 0])));
        }
        if (mats[type]) return mats[type];
        var labels = type === 'd100' ? CONSTS.standart_d100_dice_face_labels
            : CONSTS.standart_d20_dice_face_labels.slice(0, CONSTS.label_count[type]);
        return mats[type] = new THREE.MeshFaceMaterial(
            create_dice_materials(labels, vars.TEX / 2, CONSTS.label_margin[type], type === 'd100' ? vars.tens_color : vars.dice_color));
    }

    function make_mesh(type, S) {
        ensure_scale(S);
        var mesh = new THREE.Mesh(geo_for(type), material_for(type, 0));
        mesh.base_material = mesh.material;
        return mesh;
    }

    function variant(base, kind) {
        var key = base.uuid + kind;
        if (variants[key]) return variants[key];
        return variants[key] = new THREE.MeshFaceMaterial(base.materials.map(function (m) {
            var c = m.clone();
            if (kind === 'dim') { c.transparent = true; c.opacity = 0.28; }
            else { c.emissive = new THREE.Color(0x140e02); }
            return c;
        }));
    }

    function create_dice_materials(face_labels, size, margin, back) {
        function create_text_texture(text, color, back_color) {
            if (text == undefined) return null;
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + size * 2 * margin) * 2;
            canvas.width = canvas.height = ts;
            context.font = "bold " + ts / (1 + 2 * margin) + "px Arial, sans-serif";
            context.fillStyle = back_color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.lineJoin = 'round';
            context.lineWidth = ts / 14;
            context.strokeStyle = 'rgba(0,0,0,.75)';
            context.strokeText(text, canvas.width / 2, canvas.height / 2);
            context.fillStyle = color;
            context.fillText(text, canvas.width / 2, canvas.height / 2);
            if (text == '6' || text == '9') {
                context.strokeText('  .', canvas.width / 2, canvas.height / 2);
                context.fillText('  .', canvas.width / 2, canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < face_labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial(Object.assign({}, vars.material_options,
                { map: create_text_texture(face_labels[i], vars.label_color, back) })));
        return materials;
    }

    function create_d4_materials(size, margin, labels) {
        function create_d4_text(text, color, back_color) {
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            var ts = calc_texture_size(size + margin) * 2;
            canvas.width = canvas.height = ts;
            context.font = "bold " + (ts - margin) * 0.5 + "px Arial, sans-serif";
            context.fillStyle = back_color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = color;
            context.lineJoin = 'round';
            context.lineWidth = ts / 16;
            context.strokeStyle = 'rgba(0,0,0,.75)';
            for (var i in text) {
                context.strokeText(text[i], canvas.width / 2, canvas.height / 2 - ts * 0.3);
                context.fillText(text[i], canvas.width / 2, canvas.height / 2 - ts * 0.3);
                context.translate(canvas.width / 2, canvas.height / 2);
                context.rotate(Math.PI * 2 / 3);
                context.translate(-canvas.width / 2, -canvas.height / 2);
            }
            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return texture;
        }
        var materials = [];
        for (var i = 0; i < labels.length; ++i)
            materials.push(new THREE.MeshPhongMaterial(Object.assign({}, vars.material_options,
                { map: create_d4_text(labels[i], vars.label_color, vars.dice_color) })));
        return materials;
    }

    function create_d4_geometry(radius) {
        var vertices = [[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]];
        var faces = [[1, 0, 2, 1], [0, 1, 3, 2], [0, 3, 2, 3], [1, 2, 3, 4]];
        return create_geom(vertices, faces, radius, -0.1, Math.PI * 7 / 6, 0.96);
    }

    function create_d6_geometry(radius) {
        var vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
        var faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
            [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
        return create_geom(vertices, faces, radius, 0.1, Math.PI / 4, 0.96);
    }

    function create_d8_geometry(radius) {
        var vertices = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        var faces = [[0, 2, 4, 1], [0, 4, 3, 2], [0, 3, 5, 3], [0, 5, 2, 4], [1, 3, 4, 5],
            [1, 4, 2, 6], [1, 2, 5, 7], [1, 5, 3, 8]];
        return create_geom(vertices, faces, radius, 0, -Math.PI / 4 / 2, 0.965);
    }

    function create_d10_geometry(radius) {
        var a = Math.PI * 2 / 10, h = 0.105, v = -1;
        var vertices = [];
        for (var i = 0, b = 0; i < 10; ++i, b += a)
            vertices.push([Math.cos(b), Math.sin(b), h * (i % 2 ? 1 : -1)]);
        vertices.push([0, 0, -1]); vertices.push([0, 0, 1]);
        var faces = [[5, 7, 11, 0], [4, 2, 10, 1], [1, 3, 11, 2], [0, 8, 10, 3], [7, 9, 11, 4],
            [8, 6, 10, 5], [9, 1, 11, 6], [2, 0, 10, 7], [3, 5, 11, 8], [6, 4, 10, 9],
            [1, 0, 2, v], [1, 2, 3, v], [3, 2, 4, v], [3, 4, 5, v], [5, 4, 6, v],
            [5, 6, 7, v], [7, 6, 8, v], [7, 8, 9, v], [9, 8, 0, v], [9, 0, 1, v]];
        return create_geom(vertices, faces, radius, 0, Math.PI * 6 / 5, 0.945);
    }

    function create_d12_geometry(radius) {
        var p = (1 + Math.sqrt(5)) / 2, q = 1 / p;
        var vertices = [[0, q, p], [0, q, -p], [0, -q, p], [0, -q, -p], [p, 0, q],
            [p, 0, -q], [-p, 0, q], [-p, 0, -q], [q, p, 0], [q, -p, 0], [-q, p, 0],
            [-q, -p, 0], [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1],
            [-1, 1, -1], [-1, -1, 1], [-1, -1, -1]];
        var faces = [[2, 14, 4, 12, 0, 1], [15, 9, 11, 19, 3, 2], [16, 10, 17, 7, 6, 3], [6, 7, 19, 11, 18, 4],
            [6, 18, 2, 0, 16, 5], [18, 11, 9, 14, 2, 6], [1, 17, 10, 8, 13, 7], [1, 13, 5, 15, 3, 8],
            [13, 8, 12, 4, 5, 9], [5, 4, 14, 9, 15, 10], [0, 12, 8, 10, 16, 11], [3, 19, 7, 17, 1, 12]];
        return create_geom(vertices, faces, radius, 0.2, -Math.PI / 4 / 2, 0.968);
    }

    function create_d20_geometry(radius) {
        var t = (1 + Math.sqrt(5)) / 2;
        var vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
        var faces = [[0, 11, 5, 1], [0, 5, 1, 2], [0, 1, 7, 3], [0, 7, 10, 4], [0, 10, 11, 5],
            [1, 5, 9, 6], [5, 11, 4, 7], [11, 10, 2, 8], [10, 7, 6, 9], [7, 1, 8, 10],
            [3, 9, 4, 11], [3, 4, 2, 12], [3, 2, 6, 13], [3, 6, 8, 14], [3, 8, 9, 15],
            [4, 9, 5, 16], [2, 4, 11, 17], [6, 2, 10, 18], [8, 6, 7, 19], [9, 8, 1, 20]];
        return create_geom(vertices, faces, radius, -0.2, -Math.PI / 4 / 2, 0.955);
    }

    function create_shape(vertices, faces, radius) {
        var cv = new Array(vertices.length), cf = new Array(faces.length);
        for (var i = 0; i < vertices.length; ++i) {
            var v = vertices[i];
            cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
        }
        for (var i2 = 0; i2 < faces.length; ++i2) {
            cf[i2] = faces[i2].slice(0, faces[i2].length - 1);
        }
        return new CANNON.ConvexPolyhedron(cv, cf);
    }

    function make_geom(vertices, faces, radius, tab, af) {
        var geom = new THREE.Geometry();
        for (var i = 0; i < vertices.length; ++i) {
            var vertex = vertices[i].multiplyScalar(radius);
            vertex.index = geom.vertices.push(vertex) - 1;
        }
        for (var i2 = 0; i2 < faces.length; ++i2) {
            var ii = faces[i2], fl = ii.length - 1;
            var aa = Math.PI * 2 / fl;
            for (var j = 0; j < fl - 2; ++j) {
                geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
                    geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
                geom.faceVertexUvs[0].push([
                    new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
                    new THREE.Vector2((Math.cos(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(aa * (j + 1) + af) + 1 + tab) / 2 / (1 + tab)),
                    new THREE.Vector2((Math.cos(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab),
                        (Math.sin(aa * (j + 2) + af) + 1 + tab) / 2 / (1 + tab))]);
            }
        }
        geom.computeFaceNormals();
        geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
        return geom;
    }

    function chamfer_geom(vectors, faces, chamfer) {
        var chamfer_vectors = [], chamfer_faces = [], corner_faces = new Array(vectors.length);
        for (var i = 0; i < vectors.length; ++i) corner_faces[i] = [];
        for (var i2 = 0; i2 < faces.length; ++i2) {
            var ii = faces[i2], fl = ii.length - 1;
            var center_point = new THREE.Vector3();
            var face = new Array(fl);
            for (var j = 0; j < fl; ++j) {
                var vv = vectors[ii[j]].clone();
                center_point.add(vv);
                corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
            }
            center_point.divideScalar(fl);
            for (var j2 = 0; j2 < fl; ++j2) {
                var vv2 = chamfer_vectors[face[j2]];
                vv2.subVectors(vv2, center_point).multiplyScalar(chamfer).addVectors(vv2, center_point);
            }
            face.push(ii[fl]);
            chamfer_faces.push(face);
        }
        for (var i3 = 0; i3 < faces.length - 1; ++i3) {
            for (var j3 = i3 + 1; j3 < faces.length; ++j3) {
                var pairs = [], lastm = -1;
                for (var m = 0; m < faces[i3].length - 1; ++m) {
                    var n = faces[j3].indexOf(faces[i3][m]);
                    if (n >= 0 && n < faces[j3].length - 1) {
                        if (lastm >= 0 && m != lastm + 1) pairs.unshift([i3, m], [j3, n]);
                        else pairs.push([i3, m], [j3, n]);
                        lastm = m;
                    }
                }
                if (pairs.length != 4) continue;
                chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
                    chamfer_faces[pairs[1][0]][pairs[1][1]],
                    chamfer_faces[pairs[3][0]][pairs[3][1]],
                    chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
            }
        }
        for (var i4 = 0; i4 < corner_faces.length; ++i4) {
            var cf = corner_faces[i4], face2 = [cf[0]], count = cf.length - 1;
            while (count) {
                for (var m2 = faces.length; m2 < chamfer_faces.length; ++m2) {
                    var index = chamfer_faces[m2].indexOf(face2[face2.length - 1]);
                    if (index >= 0 && index < 4) {
                        if (--index == -1) index = 3;
                        var next_vertex = chamfer_faces[m2][index];
                        if (cf.indexOf(next_vertex) >= 0) {
                            face2.push(next_vertex);
                            break;
                        }
                    }
                }
                --count;
            }
            face2.push(-1);
            chamfer_faces.push(face2);
        }
        return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    function create_geom(vertices, faces, radius, tab, af, chamfer) {
        var vectors = new Array(vertices.length);
        for (var i = 0; i < vertices.length; ++i) {
            vectors[i] = (new THREE.Vector3).fromArray(vertices[i]).normalize();
        }
        var cg = chamfer_geom(vectors, faces, chamfer);
        var geom = make_geom(cg.vectors, cg.faces, radius, tab, af);
        geom.cannon_shape = create_shape(vectors, faces, radius);
        return geom;
    }

    function calc_texture_size(approx) {
        return Math.pow(2, Math.floor(Math.log(approx) / Math.log(2)));
    }

    /* ---------- leitura e correção das faces ---------- */

    // face voltada para cima depois da rolagem (no d4 é a face de baixo: o número fica nos vértices)
    function get_dice_value(dice) {
        var vector = new THREE.Vector3(0, 0, dice.dice_type == 'd4' ? -1 : 1);
        var closest_face, closest_angle = Math.PI * 2;
        for (var i = 0, l = dice.geometry.faces.length; i < l; ++i) {
            var face = dice.geometry.faces[i];
            if (face.materialIndex == 0) continue;
            var angle = face.normal.clone().applyQuaternion(dice.body.quaternion).angleTo(vector);
            if (angle < closest_angle) {
                closest_angle = angle;
                closest_face = face;
            }
        }
        var matindex = closest_face ? closest_face.materialIndex - 1 : -1;
        if (dice.dice_type == 'd100') matindex *= 10;
        if (dice.dice_type == 'd10' && matindex == 0) matindex = 10;
        return matindex;
    }

    function get_dice_values(dices) {
        var values = [];
        for (var i = 0, l = dices.length; i < l; i++) values.push(get_dice_value(dices[i]));
        return values;
    }

    // renomeia as faces para que a que ficou para cima mostre "value" (res = o que a física tinha dado)
    function shift_dice_faces(dice, value, res) {
        var r = CONSTS.dice_face_range[dice.dice_type];
        if (dice.dice_type == 'd100') { value = value / 10; res = res / 10; }
        if (dice.dice_type == 'd10' && value == 10) value = 0;
        if (!(value >= r[0] && value <= r[1]) || res < 0) return;
        var span = r[1] - r[0] + 1, num = value - res;
        num = ((num % span) + span) % span;
        if (num === 0) return;                                       // já está certo
        var key = dice.dice_type + '|' + num + '|' + geoScale;
        var base = dice.geometry, geom = sgeos[key];
        if (!geom) {
            geom = base.clone();
            for (var i = 0, l = geom.faces.length; i < l; ++i) {
                var matindex = geom.faces[i].materialIndex;
                if (matindex == 0) continue;
                matindex = r[0] + (((matindex - 1 + num) - r[0]) % span + span) % span;
                geom.faces[i].materialIndex = matindex + 1;
            }
            sgeos[key] = geom;
        }
        if (dice.dice_type == 'd4') {
            dice.material = material_for('d4', num);
            dice.base_material = dice.material;
        }
        dice.geometry = geom;
    }

    return that;
}());
