/* =========================================================================
   TRANSFORMER VISUALIZER
   Un Transformer decoder de 1 capa, d_model = 8, 2 cabezas, d_ff = 16,
   implementado en JS puro. Sus 832 pesos se entrenaron con PyTorch sobre
   30.000 frases sintéticas (notebooks/tv_train.py) y se cargan desde
   src/tv-weights.js: el modelo completa frases de su pequeño vocabulario.
   ========================================================================= */
const TV = (() => {
  const VOCAB = ['[PAD]','[UNK]','el','la','un','una','gato','perro','niña','niño','sol','luna',
    'come','bebe','duerme','corre','lee','sale','brilla','pescado','leche','agua','libro','casa',
    'jardín','parque','noche','mañana','grande','pequeño','rápido','en','por','de','y','.',','];
  const D = 8, H = 2, DK = 4, DFF = 16, MAXT = 10;


  // Pesos entrenados (ver notebooks/tv_train.py)
  const { E, WQ, WK, WV, WO, W1, B1, W2, B2 } = TV_WEIGHTS;

  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((acc, v, k) => acc + v * B[k][j], 0)));
  const T  = A => A[0].map((_, j) => A.map(r => r[j]));
  const add = (A, B) => A.map((r, i) => r.map((v, j) => v + B[i][j]));
  const softmaxRow = r => { const m = Math.max(...r.filter(v => v !== -Infinity)); const e = r.map(v => v === -Infinity ? 0 : Math.exp(v - m)); const z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
  const layerNorm = X => X.map(r => { const mu = r.reduce((a, b) => a + b, 0) / r.length; const va = r.reduce((a, b) => a + (b - mu) ** 2, 0) / r.length; return r.map(v => (v - mu) / Math.sqrt(va + 1e-5)); });

  function tokenize(text) {
    const clean = String(text).toLowerCase().normalize('NFC').replace(/[^a-záéíóúüñ.,\s]/g, ' ').replace(/([.,])/g, ' $1 ');
    let toks = clean.split(/\s+/).filter(Boolean);
    const truncated = toks.length > MAXT;
    toks = toks.slice(0, MAXT);
    return { toks, ids: toks.map(t => { const i = VOCAB.indexOf(t); return i < 0 ? 1 : i; }), truncated };
  }
  function posEnc(Tn) {
    return Array.from({ length: Tn }, (_, p) => Array.from({ length: D }, (_, i) => {
      const k = i - (i % 2); const ang = p / Math.pow(10000, k / D); return i % 2 === 0 ? Math.sin(ang) : Math.cos(ang);
    }));
  }
  function run(text, temp = 1) {
    const tk = tokenize(text);
    if (!tk.toks.length) return null;
    const n = tk.ids.length;
    const X = tk.ids.map(id => E[id].slice());
    const PE = posEnc(n);
    const X0 = add(X, PE);
    const heads = [0, 1].map(h => {
      const Q = mm(X0, WQ[h]), K = mm(X0, WK[h]), V = mm(X0, WV[h]);
      const S = Q.map((q, i) => K.map((k, j) => j > i ? -Infinity : q.reduce((a, v, d) => a + v * k[d], 0) / Math.sqrt(DK)));
      const A = S.map(softmaxRow);
      const O = mm(A, V);
      return { Q, K, V, S, A, O };
    });
    const concat = heads[0].O.map((r, i) => r.concat(heads[1].O[i]));
    const MH = mm(concat, WO);
    const R1 = layerNorm(add(X0, MH));
    const Hid = mm(R1, W1).map(r => r.map((v, j) => Math.max(0, v + B1[j])));
    const F = mm(Hid, W2).map(r => r.map((v, j) => v + B2[j]));
    const R2 = layerNorm(add(R1, F));
    const last = R2[n - 1];
    const logits = E.map(e => e.reduce((a, v, d) => a + v * last[d], 0)); // pesos atados: logits = h · Eᵀ
    const probs = softmaxRow(logits.map(v => v / temp));
    let best = 2; probs.forEach((p, i) => { if (i > 1 && p > probs[best]) best = i; }); // nunca [PAD]/[UNK]
    return { ...tk, n, X, PE, X0, heads, concat, MH, R1, Hid, F, R2, logits, probs, next: best, temp };
  }
  return { VOCAB, D, H, DK, DFF, MAXT, run, tokenize };
})();

/* ---------- UI del visualizador ---------- */
const TVUI = (() => {
  const STAGES = [
    { id:'text', t:'Texto', short:'Texto' },
    { id:'tok', t:'Tokenización', short:'Tokens' },
    { id:'ids', t:'Token IDs', short:'IDs' },
    { id:'emb', t:'Embeddings', short:'Embeddings' },
    { id:'pe', t:'Positional Encoding', short:'Posición' },
    { id:'qkv', t:'Q, K y V', short:'Q/K/V' },
    { id:'scores', t:'Attention scores', short:'Scores' },
    { id:'softmax', t:'Softmax', short:'Softmax' },
    { id:'mha', t:'Multi-Head Attention', short:'Multi-head' },
    { id:'ffn', t:'Feed Forward Network', short:'FFN' },
    { id:'logits', t:'Logits', short:'Logits' },
    { id:'probs', t:'Probabilidades', short:'Probabilidades' },
    { id:'gen', t:'Token generado', short:'Token' },
  ];
  let text = 'el gato come', stage = 0, head = 0, temp = 1, R = null, msg = '';

  const f2 = v => v === -Infinity ? '−∞' : (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
  function cellStyle(v, max) {
    if (v === -Infinity) return 'background:var(--soft);color:var(--muted)';
    const a = Math.min(1, Math.abs(v) / (max || 1));
    const c = v >= 0 ? 'var(--pos)' : 'var(--neg)';
    return `background:color-mix(in srgb, ${c} ${Math.round(a * 70)}%, var(--surface));${a > 0.6 ? 'color:#fff' : ''}`;
  }
  function matrix(M, rows, cols, { title = '', max = null, shape = '' } = {}) {
    const fin = M.flat().filter(v => v !== -Infinity);
    const mx = max ?? Math.max(1e-9, ...fin.map(Math.abs));
    return `<figure class="mx"><figcaption><b>${title}</b>${shape ? ` <span class="shape">${shape}</span>` : ''}</figcaption>
      <div class="mx-scroll"><table class="mxt"><thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${M.map((r, i) => `<tr><th>${rows[i]}</th>${r.map(v => `<td style="${cellStyle(v, mx)}">${f2(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
  }
  function barsTop(vals, k, fmt, title) {
    const idx = vals.map((v, i) => [v, i]).filter(([, i]) => i > 1).sort((a, b) => b[0] - a[0]).slice(0, k);
    const mx = Math.max(...idx.map(([v]) => Math.abs(v)), 1e-9);
    return `<figure class="mx"><figcaption><b>${title}</b></figcaption><div class="topbars">${idx.map(([v, i]) =>
      `<div class="tb"><span class="tbw">${U.esc(TV.VOCAB[i])}</span><span class="tbt"><i style="width:${Math.max(1, Math.abs(v) / mx * 100)}%;background:${v >= 0 ? 'var(--pos)' : 'var(--neg)'}"></i></span><span class="tbn">${fmt(v)}</span></div>`).join('')}</div></figure>`;
  }
  const dims = n => Array.from({ length: n }, (_, i) => 'd' + i);
  const tokLabels = () => R.toks.map((t, i) => `${i}·${U.esc(t)}`);

  function stageContent(id) {
    const n = R.n, tl = tokLabels(), hd = R.heads[head];
    switch (id) {
      case 'text': return {
        shape: 'cadena de texto',
        tex: '\\text{texto} \\;\\rightarrow\\; \\text{siguiente token}',
        why: 'El modelo recibe un texto y su única tarea es predecir cuál es el siguiente token. Generar un párrafo entero es repetir ese paso una y otra vez, añadiendo cada token elegido al final.',
        viz: `<div class="chips big">${R.toks.map(t => `<span class="chip">${U.esc(t)}</span>`).join('')}<span class="chip ghost">?</span></div>`,
        code: `texto = "${text}"\n# objetivo: P(siguiente token | texto)` };
      case 'tok': return {
        shape: `${n} tokens`,
        tex: '\\text{"el gato come"} \\rightarrow [\\,\\text{el},\\ \\text{gato},\\ \\text{come}\\,]',
        why: 'El texto se parte en unidades llamadas tokens. Aquí se usa una palabra por token para que se lea fácil; los LLM reales usan subpalabras (BPE), de forma que «jardinería» podría ser «jardin» + «ería», y cualquier palabra, aunque sea nueva, se puede representar.',
        viz: `<div class="chips big">${R.toks.map(t => `<span class="chip">${U.esc(t)}</span>`).join('')}</div>`,
        code: `from transformers import AutoTokenizer\ntok = AutoTokenizer.from_pretrained("gpt2")\ntok.tokenize("${text}")   # subpalabras BPE` };
      case 'ids': return {
        shape: `ids: [${n}]  ·  vocabulario: ${TV.VOCAB.length}`,
        tex: '\\text{token} \\mapsto \\text{id} \\in \\{0, \\dots, |V|-1\\}',
        why: 'Cada token se sustituye por su posición en el vocabulario. Las palabras que no están en él se convierten en [UNK]. Este vocabulario de juguete tiene ' + TV.VOCAB.length + ' entradas; el de un LLM real, entre 30.000 y más de 200.000.',
        viz: `<div class="chips big">${R.toks.map((t, i) => `<span class="chip id"><small>${U.esc(t)}</small>${R.ids[i]}${R.ids[i] === 1 ? ' <em>[UNK]</em>' : ''}</span>`).join('')}</div>
          <details class="vocab"><summary>Ver vocabulario completo</summary><div class="chips">${TV.VOCAB.map((w, i) => `<span class="chip sm">${i} · ${U.esc(w)}</span>`).join('')}</div></details>`,
        code: `ids = tok("${text}", return_tensors="pt").input_ids   # tensor de forma [1, T]` };
      case 'emb': return {
        shape: `X: [${n}, ${TV.D}]`,
        tex: 'X = E[\\text{ids}], \\qquad E \\in \\mathbb{R}^{|V| \\times d_{model}}',
        why: 'Cada id selecciona una fila de la matriz de embeddings E: un vector de ' + TV.D + ' números que representa el token. Durante el entrenamiento estos vectores se ajustan para que tokens con usos parecidos queden cerca. En GPT-3 cada vector tiene 12.288 dimensiones.',
        viz: matrix(R.X, tl, dims(TV.D), { title: 'Embeddings de cada token', shape: `[${n}, ${TV.D}]` }),
        code: `emb = nn.Embedding(num_embeddings=${TV.VOCAB.length}, embedding_dim=${TV.D})\nX = emb(ids)            # [1, ${n}, ${TV.D}]` };
      case 'pe': return {
        shape: `PE: [${n}, ${TV.D}]  ·  X + PE: [${n}, ${TV.D}]`,
        tex: 'PE_{(p,2i)} = \\sin\\!\\left(\\frac{p}{10000^{2i/d}}\\right),\\quad PE_{(p,2i+1)} = \\cos\\!\\left(\\frac{p}{10000^{2i/d}}\\right)',
        why: 'La atención trata la secuencia como un conjunto: sin más información, «el gato come» y «come el gato» serían iguales. Por eso se suma a cada embedding un vector que depende de su posición. Esta es la codificación sinusoidal del Transformer original; muchos modelos actuales usan RoPE, que rota Q y K según la posición.',
        viz: matrix(R.PE, tl, dims(TV.D), { title: 'Codificación posicional', shape: `[${n}, ${TV.D}]`, max: 1 }) + matrix(R.X0, tl, dims(TV.D), { title: 'Entrada al bloque: X + PE', shape: `[${n}, ${TV.D}]` }),
        code: `pos = torch.arange(T).unsqueeze(1)\ndiv = 10000 ** (torch.arange(0, d, 2) / d)\npe = torch.zeros(T, d)\npe[:, 0::2] = torch.sin(pos / div)\npe[:, 1::2] = torch.cos(pos / div)\nx = X + pe` };
      case 'qkv': return {
        shape: `Q, K, V: [${n}, ${TV.DK}] por cabeza  ·  W: [${TV.D}, ${TV.DK}]`,
        tex: 'Q = XW_Q,\\quad K = XW_K,\\quad V = XW_V',
        why: 'Tres proyecciones lineales de cada token. La Query es lo que el token busca, la Key es lo que ofrece a los demás y el Value es la información que transmitirá si alguien le presta atención. Cada cabeza tiene sus propias matrices.',
        viz: headPicker() + `<div class="mx-row">${matrix(hd.Q, tl, dims(TV.DK), { title: 'Q', shape: `[${n}, ${TV.DK}]` })}${matrix(hd.K, tl, dims(TV.DK), { title: 'K', shape: `[${n}, ${TV.DK}]` })}${matrix(hd.V, tl, dims(TV.DK), { title: 'V', shape: `[${n}, ${TV.DK}]` })}</div>`,
        code: `W_q = nn.Linear(${TV.D}, ${TV.DK}, bias=False)   # una por cabeza\nq, k, v = W_q(x), W_k(x), W_v(x)          # [1, ${n}, ${TV.DK}]` };
      case 'scores': return {
        shape: `S: [${n}, ${n}] por cabeza`,
        tex: 'S = \\frac{QK^{\\top}}{\\sqrt{d_k}} + M, \\qquad M_{ij} = \\begin{cases} 0 & j \\le i \\\\ -\\infty & j > i \\end{cases}',
        why: 'Cada Query se compara con todas las Keys mediante un producto escalar: cuanto más alineados, mayor la puntuación. Se divide por √d_k para que los valores no crezcan con la dimensión. La máscara causal pone −∞ en el futuro: al generar texto, un token solo puede mirar a los anteriores.',
        viz: headPicker() + matrix(hd.S, tl, R.toks.map(U.esc), { title: 'Puntuaciones (fila = token que pregunta)', shape: `[${n}, ${n}]` }),
        code: `scores = q @ k.transpose(-2, -1) / math.sqrt(${TV.DK})\nmask = torch.triu(torch.ones(T, T, dtype=torch.bool), 1)\nscores = scores.masked_fill(mask, float("-inf"))` };
      case 'softmax': return {
        shape: `A: [${n}, ${n}]  ·  cada fila suma 1`,
        tex: 'A_{ij} = \\frac{e^{S_{ij}}}{\\sum_{k} e^{S_{ik}}}, \\qquad O = AV',
        why: 'El softmax convierte cada fila de puntuaciones en pesos positivos que suman 1. Las posiciones enmascaradas (−∞) reciben exactamente 0. Después, cada token calcula una media ponderada de los Values: O = A·V.',
        viz: headPicker() + `<div class="mx-row">${matrix(hd.A, tl, R.toks.map(U.esc), { title: 'Pesos de atención A', shape: `[${n}, ${n}]`, max: 1 })}${matrix(hd.O, tl, dims(TV.DK), { title: 'Salida de la cabeza O = A·V', shape: `[${n}, ${TV.DK}]` })}</div>`,
        code: `attn = scores.softmax(dim=-1)   # [1, ${n}, ${n}]\nout = attn @ v                    # [1, ${n}, ${TV.DK}]\n# equivalente: F.scaled_dot_product_attention(q, k, v, is_causal=True)` };
      case 'mha': return {
        shape: `concat: [${n}, ${TV.H}·${TV.DK}=${TV.D}]  ·  W_O: [${TV.D}, ${TV.D}]  ·  salida: [${n}, ${TV.D}]`,
        tex: '\\text{MHA}(X) = \\text{Concat}(O_1, \\dots, O_h)\\,W_O, \\qquad X_1 = \\text{LayerNorm}(X + \\text{MHA}(X))',
        why: 'Cada cabeza atiende a patrones distintos en su propio subespacio. Sus salidas se concatenan y se mezclan con W_O. El resultado se suma a la entrada (conexión residual, la idea de ResNet) y se normaliza con LayerNorm, lo que estabiliza el entrenamiento de redes profundas.',
        viz: `<div class="mx-row">${matrix(R.concat, tl, [...dims(TV.DK).map(d => 'h1·' + d), ...dims(TV.DK).map(d => 'h2·' + d)], { title: 'Concat(O₁, O₂)', shape: `[${n}, ${TV.D}]` })}${matrix(R.R1, tl, dims(TV.D), { title: 'LayerNorm(X + MHA)', shape: `[${n}, ${TV.D}]` })}</div>`,
        code: `mha = nn.MultiheadAttention(embed_dim=${TV.D}, num_heads=${TV.H}, batch_first=True)\na, _ = mha(x, x, x, attn_mask=mask)\nx = nn.LayerNorm(${TV.D})(x + a)` };
      case 'ffn': return {
        shape: `oculta: [${n}, ${TV.DFF}]  ·  salida: [${n}, ${TV.D}]`,
        tex: '\\text{FFN}(x) = \\max(0,\\, xW_1 + b_1)\\,W_2 + b_2, \\qquad X_2 = \\text{LayerNorm}(X_1 + \\text{FFN}(X_1))',
        why: 'Después de mezclar información entre tokens, cada token pasa por su cuenta por una pequeña red de dos capas que se expande (normalmente a 4·d_model) y vuelve a comprimir. Se cree que buena parte del «conocimiento» de un LLM vive en estas capas. De nuevo, conexión residual y LayerNorm.',
        viz: `<div class="mx-row">${matrix(R.Hid, tl, dims(TV.DFF), { title: 'Capa oculta (ReLU)', shape: `[${n}, ${TV.DFF}]` })}${matrix(R.R2, tl, dims(TV.D), { title: 'Salida del bloque', shape: `[${n}, ${TV.D}]` })}</div>`,
        code: `ffn = nn.Sequential(nn.Linear(${TV.D}, ${TV.DFF}), nn.ReLU(), nn.Linear(${TV.DFF}, ${TV.D}))\nx = nn.LayerNorm(${TV.D})(x + ffn(x))\n# un LLM real apila decenas de estos bloques` };
      case 'logits': return {
        shape: `h último: [${TV.D}]  ·  logits: [${TV.VOCAB.length}]`,
        tex: '\\text{logits} = h_{T}\\, E^{\\top} \\in \\mathbb{R}^{|V|}',
        why: 'Solo importa el vector del último token, que ha acumulado el contexto de todos los anteriores. Se compara con el embedding de cada palabra del vocabulario (aquí se reutiliza la matriz E, lo que se llama weight tying), y sale una puntuación por palabra.',
        viz: barsTop(R.logits, 12, v => f2(v), `Los 12 logits más altos (de ${TV.VOCAB.length})`),
        code: `lm_head = nn.Linear(${TV.D}, ${TV.VOCAB.length}, bias=False)\nlm_head.weight = emb.weight          # weight tying\nlogits = lm_head(x[:, -1, :])      # [1, ${TV.VOCAB.length}]` };
      case 'probs': return {
        shape: `p: [${TV.VOCAB.length}]  ·  Σ p = 1`,
        tex: 'p_i = \\frac{e^{z_i / \\tau}}{\\sum_j e^{z_j / \\tau}}',
        why: 'El softmax convierte los logits en una distribución de probabilidad. La temperatura τ la controla: con τ < 1 se concentra en las opciones más probables (respuestas más predecibles); con τ > 1 se aplana (más variedad y más errores).',
        viz: `<label class="temp" for="tv-temp">Temperatura τ <output>${temp.toFixed(2)}</output><input type="range" id="tv-temp" min="0.2" max="2.5" step="0.05" value="${temp}"></label>` + barsTop(R.probs, 10, v => (v * 100).toFixed(1) + ' %', 'Las 10 palabras más probables'),
        code: `probs = (logits / temperatura).softmax(dim=-1)\nsiguiente = torch.multinomial(probs, 1)   # muestreo\n# o voraz: probs.argmax(-1)` };
      case 'gen': return {
        shape: `nuevo id: ${R.next}`,
        tex: '\\hat{y} = \\arg\\max_i\\, p_i',
        why: 'Se elige el token más probable (decodificación voraz) o se muestrea de la distribución. Se añade al texto y todo el proceso empieza de nuevo para el siguiente token. Este modelo, con solo 832 parámetros, aprendió de 30.000 frases sintéticas qué suele venir después dentro de su mundo de 37 palabras; un LLM hace lo mismo con cientos de miles de millones de parámetros y buena parte del texto de internet.',
        viz: `<div class="chips big">${R.toks.map(t => `<span class="chip">${U.esc(t)}</span>`).join('')}<span class="chip new">${U.esc(TV.VOCAB[R.next])}</span></div>
          <p class="note">Probabilidad: ${(R.probs[R.next] * 100).toFixed(1)} %</p>
          ${R.toks[R.toks.length - 1] === '.'
            ? `<p class="note"><b>La frase ya está terminada.</b> Este modelo se entrenó con frases sueltas, así que después de un punto no sabe continuar: lo que ves arriba es una suposición sin fundamento. Escribe otro comienzo en el cuadro de texto.</p>`
            : `<button class="btn primary" id="tv-append" type="button">${TV.VOCAB[R.next] === '.' ? 'Añadir «.» y terminar la frase' : `Añadir «${U.esc(TV.VOCAB[R.next])}» y volver a empezar`}</button>`}`,
        code: `for _ in range(20):\n    logits = modelo(ids)[:, -1, :]\n    nuevo = logits.argmax(-1, keepdim=True)\n    ids = torch.cat([ids, nuevo], dim=1)` };
    }
  }
  function headPicker() {
    return `<div class="seg sm" role="group" aria-label="Cabeza de atención">${[0, 1].map(h => `<button type="button" data-head="${h}" class="${h === head ? 'on' : ''}">Cabeza ${h + 1}</button>`).join('')}</div>`;
  }
  function render(root) {
    R = TV.run(text, temp);
    if (!R) { text = 'el gato come'; R = TV.run(text, temp); }
    const st = STAGES[stage], c = stageContent(st.id);
    root.innerHTML = `
      <div class="tv-input">
        <label for="tv-text">Texto de entrada</label>
        <div class="tv-row"><input id="tv-text" type="text" maxlength="80" value="${U.esc(text)}" autocomplete="off" spellcheck="false">
        <button class="btn" id="tv-run" type="button">Procesar</button></div>
        <p class="note">${msg ? `<b>${U.esc(msg)}</b> ` : ''}Vocabulario de ${TV.VOCAB.length} palabras (máximo ${TV.MAXT} tokens). Prueba: «la niña lee un», «el sol sale por la», «el perro bebe» o «la luna brilla por la».</p>
      </div>
      <ol class="tv-steps" aria-label="Etapas">${STAGES.map((s, i) => `<li><button type="button" data-stage="${i}" class="${i === stage ? 'on' : ''} ${i < stage ? 'done' : ''}" aria-current="${i === stage}"><span>${String(i + 1).padStart(2, '0')}</span>${s.short}</button></li>`).join('')}</ol>
      <div class="tv-panel">
        <div class="tv-head">
          <div><span class="eyebrow">Etapa ${stage + 1} de ${STAGES.length}</span><h2>${st.t}</h2></div>
          <span class="shape big">${c.shape}</span>
        </div>
        <div class="tv-grid">
          <div class="tv-explain">
            <div class="math-block">${U.tex(c.tex)}</div>
            <p>${c.why}</p>
            <div class="code"><div class="lab">PyTorch equivalente<button type="button" data-copy>Copiar</button></div><pre><code>${U.hlPy(c.code)}</code></pre></div>
          </div>
          <div class="tv-viz">${c.viz}</div>
        </div>
        <div class="tv-nav"><button class="btn" id="tv-prev" type="button" ${stage === 0 ? 'disabled' : ''}>← Anterior</button><button class="btn primary" id="tv-next" type="button" ${stage === STAGES.length - 1 ? 'disabled' : ''}>Siguiente →</button></div>
      </div>`;
    const inp = root.querySelector('#tv-text');
    const submit = () => { const v = inp.value.trim(); if (!v) { msg = 'Escribe al menos una palabra.'; render(root); return; }
      const tk = TV.tokenize(v); if (!tk.toks.length) { msg = 'No se ha reconocido ningún token.'; render(root); return; }
      text = tk.toks.join(' ').replace(/ ([.,])/g, '$1'); msg = tk.truncated ? `Se han usado solo los primeros ${TV.MAXT} tokens.` : (tk.ids.includes(1) ? 'Hay palabras fuera del vocabulario: se tratan como [UNK].' : ''); render(root); };
    root.querySelector('#tv-run').onclick = submit;
    inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
    root.querySelectorAll('[data-stage]').forEach(b => b.onclick = () => { stage = +b.dataset.stage; render(root); });
    root.querySelectorAll('[data-head]').forEach(b => b.onclick = () => { head = +b.dataset.head; render(root); });
    const pv = root.querySelector('#tv-prev'), nx = root.querySelector('#tv-next');
    pv.onclick = () => { stage = Math.max(0, stage - 1); render(root); };
    nx.onclick = () => { stage = Math.min(STAGES.length - 1, stage + 1); render(root); };
    const tr = root.querySelector('#tv-temp'); if (tr) tr.oninput = e => { temp = +e.target.value; render(root); root.querySelector('#tv-temp').focus(); };
    const ap = root.querySelector('#tv-append'); if (ap) ap.onclick = () => {
      const tk = TV.tokenize(text + ' ' + TV.VOCAB[R.next]);
      if (tk.truncated) { msg = `El texto ya tiene ${TV.MAXT} tokens: bórralo o acórtalo para seguir generando.`; }
      else { text = tk.toks.join(' ').replace(/ ([.,])/g, '$1'); msg = ''; stage = 0; }
      render(root); };
    const ol = root.querySelector('.tv-steps'), on = ol && ol.querySelector('button.on');
    if (ol && on) ol.scrollLeft = on.parentElement.offsetLeft - ol.clientWidth / 2 + on.offsetWidth / 2;
    U.wireCopy(root);
  }
  return { render };
})();
