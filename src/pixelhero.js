/* =========================================================================
   PIXEL HERO — animación en pixel art de la portada
   Lienzo nativo de 200×150 px escalado con image-rendering: pixelated.
   El fondo (HERO_BG) es una imagen estática; aquí se dibuja lo que se mueve:
   un dato que sube por el Transformer, la palabra generada, las barras del
   softmax, el mapa de atención, los vectores, el robot, las estrellas y el suelo.
   Se pausa fuera de pantalla y respeta prefers-reduced-motion.
   ========================================================================= */
const PixelHero = (() => {
  const W = 200, H = 150, FPS = 12, CYCLE = 48;
  const K = { bg0:'#070a18', bg1:'#0d1230', bg2:'#161d45', dk:'#0a0d1c', txt:'#f4f6ff', star:'#ffffff', star2:'#8fa8ff',
    att:'#ff8a3d', attd:'#b3531a', attl:'#ffc28f', emb:'#3dd68c', embd:'#1c8a52', embl:'#b0f5d2',
    sm:'#b07cff', sml:'#dcc6ff', cy:'#3de0ff', cyd:'#1a7f99', red:'#ff4d6d', redd:'#6e1f33', nrml:'#fff0a8', metal:'#c3cbe0' };
  const G = { C:['.##','#..','#..','#..','.##'], O:['.#.','#.#','#.#','#.#','.#.'], M:['#...#','##.##','#.#.#','#...#','#...#'],
    E:['###','#..','##.','#..','###'], B:['##.','#.#','##.','#.#','##.'], L:['#..','#..','#..','#..','###'],
    S:['.##','#..','.#.','..#','##.'], A:['.#.','#.#','###','#.#','#.#'], R:['##.','#.#','##.','#.#','#.#'] };
  const WORDS = ['COME', 'BEBE', 'LEE', 'SALE', 'CORRE'];
  // capas de la torre: [y, alto] (x = 76, ancho = 48), de arriba abajo
  const LAYERS = [[53, 8], [64, 8], [77, 8], [88, 11], [102, 8], [113, 13], [131, 8]];
  const CIRCUIT = [[33, 88], [52, 88], [52, 95], [67, 95]];

  let ctx, bg, floorMask = [], skyPts = [], raf = 0, last = 0, frame = 0, running = false, io = null, canvasEl = null;

  const rnd = seed => { seed = Math.abs(Math.floor(seed)) % 2147483646 + 1; return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; };
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const textW = s => [...s].reduce((a, ch) => a + G[ch][0].length + 1, -1);
  function text(x, y, s, c) {
    ctx.fillStyle = c;
    for (const ch of s) { const g = G[ch]; g.forEach((row, j) => [...row].forEach((p, i) => { if (p === '#') ctx.fillRect(x + i, y + j, 1, 1); })); x += g[0].length + 1; }
  }
  function prepare() {
    // píxeles del suelo (para dibujar sus líneas sin pisar la torre) y huecos del cielo (para las estrellas)
    r(0, 0, W, H, K.bg0); ctx.drawImage(bg, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data, hex = i => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
    floorMask = [];
    for (let y = 129; y < H; y++) for (let x = 0; x < W; x++) { const c = hex((y * W + x) * 4); if (c === K.bg2 || c === K.cyd) floorMask.push([x, y]); }
    const rr = rnd(99); skyPts = [];
    while (skyPts.length < 16) { const x = 2 + Math.floor(rr() * (W - 4)), y = 2 + Math.floor(rr() * 92), i = (y * W + x) * 4;
      if ([K.bg0, K.bg1].includes(hex(i)) && [K.bg0, K.bg1].includes(hex(i + 4)) && [K.bg0, K.bg1].includes(hex(i + W * 4))) skyPts.push([x, y, rr() * 6.28]); }
  }
  function draw(f) {
    const cyc = Math.floor(f / CYCLE), t = f % CYCLE, R = rnd(1000 + cyc * 7919);
    ctx.drawImage(bg, 0, 0);

    // suelo retro que avanza
    const ph = (f % 12) / 12;
    const rows = new Set(); for (let k = 0; k < 7; k++) { const d = Math.round(Math.pow(k + ph, 2) * 0.55); if (d > 0 && d < 22) rows.add(129 + d - 1); }
    ctx.fillStyle = K.cyd; for (const [x, y] of floorMask) if (rows.has(y)) ctx.fillRect(x, y, 1, 1);

    // estrellas que parpadean
    for (const [x, y, p] of skyPts) { const v = Math.sin(f * 0.35 + p);
      if (v > 0.55) { r(x, y, 1, 1, K.star); if (v > 0.85) { r(x - 1, y, 1, 1, K.star2); r(x + 1, y, 1, 1, K.star2); r(x, y - 1, 1, 1, K.star2); r(x, y + 1, 1, 1, K.star2); } }
      else if (v > 0.1) r(x, y, 1, 1, K.star2); }

    // codificación posicional: onda que se desplaza
    for (let x = 44; x < 66; x++) r(x, Math.round(135 + 3 * Math.sin((x - 44) / 3.2 - f * 0.35)), 1, 1, K.emb);

    // pulso que sube por la torre y enciende cada capa
    const yP = t <= 33 ? 146 - (t / 33) * 110 : -99;
    LAYERS.forEach(([y, h], i) => { if (yP >= y - 1 && yP <= y + h) {
      ctx.strokeStyle = K.txt; ctx.lineWidth = 1; ctx.strokeRect(75.5, y - 1.5, 49, h + 2);
      r(74, y + Math.floor(h / 2), 1, 1, K.txt); r(125, y + Math.floor(h / 2), 1, 1, K.txt);
      if (i === 2 || i === 4) { const [a, b] = i === 2 ? [101, 81] : [128, 106]; ctx.fillStyle = K.nrml; ctx.fillRect(124, a, 4, 1); ctx.fillRect(128, b, 1, a - b + 1); ctx.fillRect(124, b, 4, 1); }
    } });
    if (yP > 0 && !LAYERS.some(([y, h]) => yP >= y - 1 && yP <= y + h)) { const y = Math.round(yP); r(99, y, 3, 2, K.txt); r(100, y + 2, 1, 2, K.cy); r(100, y + 4, 1, 1, K.cyd); }

    // barras del softmax: se vacían y vuelven a crecer con la nueva distribución
    const vals = Array.from({ length: 8 }, () => 1 + Math.floor(R() * 6)); const top = Math.floor(R() * 8); vals[top] = 10;
    const Rp = rnd(1000 + (cyc - 1) * 7919), prev = Array.from({ length: 8 }, () => 1 + Math.floor(Rp() * 6)); const ptop = Math.floor(Rp() * 8); prev[ptop] = 10;
    const grow = t < 8 ? 1 - t / 8 : t < 26 ? 0 : Math.min(1, (t - 26) / 8);
    const show = t < 8 ? prev : vals, best = t < 8 ? ptop : top;
    show.forEach((v, i) => { const h = Math.max(t >= 8 && t < 26 ? 1 : 0, Math.round(v * grow)); if (h) r(82 + i * 5, 48 - h, 3, h, i === best && grow > 0.9 ? K.sml : K.sm); });

    // palabra generada
    const wi = (t < 34 ? cyc - 1 : cyc), word = WORDS[((wi % WORDS.length) + WORDS.length) % WORDS.length];
    r(88, 28, 23, 7, K.sm); text(87 + Math.floor((25 - textW(word)) / 2), 29, word, K.dk);
    if (t >= 34 && t < 42) { const s = t - 34; [[84, 26], [114, 28], [86, 36], [113, 35], [99, 24]].forEach(([x, y], i) => { if ((s + i) % 3 === 0) { r(x, y, 1, 1, K.txt); r(x - 1, y, 1, 1, K.sml); r(x + 1, y, 1, 1, K.sml); } }); }

    // mapa de atención con máscara causal; la última fila se ilumina al pasar el pulso por la atención
    const inAtt = yP >= 112 && yP <= 126, Ra = rnd(5000 + cyc * 131);
    for (let i = 0; i < 6; i++) for (let j = 0; j <= i; j++) {
      let v = Ra() * 0.55 + (j === i - 1 ? 0.45 : 0) + (j === i ? 0.15 : 0);
      v += 0.08 * Math.sin(f * 0.5 + i * 1.3 + j);
      if (i === 5 && inAtt) v += 0.35;
      r(150 + j * 6, 52 + i * 6, 5, 5, v > 0.9 ? K.attl : v > 0.55 ? K.att : v > 0.28 ? K.attd : K.bg2);
    }
    if (inAtt) { ctx.strokeStyle = K.attl; ctx.strokeRect(148.5, 81.5, 37, 7); r(146, 88 + ((f * 2) % 30), 1, 2, K.attl); }

    // vectores de embedding que titilan
    const Rv = rnd(777);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) { const v = Rv() + 0.35 * Math.sin(f * 0.4 + i * 0.9 + j * 1.7); r(170 + i * 4, 98 + j * 4, 3, 3, v > 0.85 ? K.embl : v > 0.45 ? K.emb : K.embd); }

    // circuito robot → torre
    const segs = []; for (let k = 0; k < CIRCUIT.length - 1; k++) { const [a, b] = CIRCUIT[k], [c, d] = CIRCUIT[k + 1]; const n = Math.max(Math.abs(c - a), Math.abs(d - b)); for (let s = 0; s < n; s++) segs.push([a + (c - a) * s / n, b + (d - b) * s / n]); }
    for (let k = 0; k < 3; k++) { const p = segs[(f * 3 - k * 2 + segs.length * 10) % segs.length]; r(Math.round(p[0]), Math.round(p[1]), 1, 1, k ? K.cy : K.txt); }

    // robot: antena y ojos (parpadeo y mirada)
    const on = Math.floor(f / 6) % 2 === 0; r(21, 39, 4, 3, on ? K.red : K.redd); if (on) r(22, 39, 1, 1, K.txt);
    const blink = f % 40 >= 38, look = Math.round(Math.sin(f * 0.12));
    for (const ex of [15, 27]) {
      r(ex, 59, 4, 4, K.dk);
      if (blink) r(ex, 61, 4, 1, K.cy);
      else { r(ex, 59, 4, 4, K.cy); r(ex + 1 + look, 59, 1, 1, K.txt); r(ex + 2 + look, 59, 1, 1, K.txt); }
    }
  }
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 1000 / FPS) return;
    last = now; frame++; draw(frame);
  }
  function start() { if (running || !ctx) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function mount(canvas, src) {
    unmount(); if (!canvas) return;
    canvasEl = canvas; ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    bg = new Image();
    bg.onload = () => {
      prepare();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      frame = 40; draw(frame);                       // fotograma completo en reposo
      if (reduce) return;
      io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && !document.hidden ? start() : stop()));
      io.observe(canvas);
    };
    bg.onerror = () => console.warn('PixelHero: no se pudo cargar el fondo');
    bg.src = src;
  }
  function unmount() { stop(); if (io) io.disconnect(); io = null; canvasEl = null; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (canvasEl && io) { const r = canvasEl.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) start(); } });
  return { mount, unmount };
})();
