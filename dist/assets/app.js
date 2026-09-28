/* =========================================================================
   UTILIDADES
   ========================================================================= */
const U = {
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])),
  norm: s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  slug: s => U.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  tex(src, display = true) {
    try { if (window.katex) return katex.renderToString(src, { output: 'mathml', displayMode: display, throwOnError: false }); } catch (e) { console.warn('KaTeX', e); }
    return `<code class="tex-fallback">${U.esc(src)}</code>`;
  },
  hlPy(code) {
    const re = /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(def|class|return|for|in|if|else|elif|import|from|as|while|None|True|False|and|or|not|lambda|with|self|async|await|raise|try|except)\b|\b(\d+(?:\.\d+)?)\b/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += U.esc(code.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
      out += `<span class="${cls}">${U.esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + U.esc(code.slice(last));
  },
  code(src, label = 'Python') {
    return `<div class="code"><div class="lab">${label}<button type="button" data-copy>Copiar</button></div><pre><code>${U.hlPy(src)}</code></pre></div>`;
  },
  wireCopy(root) {
    root.querySelectorAll('[data-copy]').forEach(btn => {
      if (btn.dataset.wired) return; btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        const pre = btn.closest('.code').querySelector('pre');
        const ok = () => { btn.textContent = 'Copiado'; setTimeout(() => btn.textContent = 'Copiar', 1500); };
        const fb = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Seleccionado · Ctrl+C'; };
        try { navigator.clipboard.writeText(pre.innerText).then(ok, fb); } catch (e) { fb(); }
      });
    });
  },
  store: {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } },
  },
};

;
/* Pesos entrenados por notebooks/tv_train.py. No editar a mano. */
const TV_WEIGHTS = {"E":[[-0.279,0.277,-0.0761,-1.0365,-0.1232,-0.0021,-0.1854,-1.1358],[0.3778,0.8901,0.4008,-0.3269,0.4557,0.5675,0.4475,-0.4061],[-1.5375,-1.579,1.0474,0.3641,0.8887,-0.5671,-2.4283,2.0759],[0.2217,-0.9669,-0.3128,0.0283,2.5468,3.9554,-0.808,-0.5318],[1.711,-1.3872,0.2675,-0.4652,-0.8085,-0.4767,-2.0276,2.6377],[1.9879,-1.7105,-0.2919,-1.9419,0.5904,0.7281,-0.6912,-0.2854],[-0.8111,1.8704,1.2891,1.5327,-1.2147,-0.9989,1.7301,-1.2775],[-0.3983,1.6295,1.5521,1.5561,-1.316,-1.0062,1.9929,-1.1647],[-0.8794,2.3306,0.8497,0.6363,-2.4595,2.86,-0.6416,0.2915],[-2.2153,1.4329,1.2103,-0.7248,-3.105,0.3785,1.4524,0.478],[-0.7682,2.2596,0.1317,-1.4604,-2.4936,-2.0514,0.7167,-0.1892],[-0.6706,3.2018,-1.104,0.0413,-1.0857,0.6326,-1.4376,0.1625],[1.0569,-2.0607,1.101,0.7983,-2.3103,-0.5084,-0.1142,-0.8025],[1.3122,-2.2863,1.0586,0.7084,-0.8056,-0.7668,0.3653,-1.4293],[0.084,-2.4171,1.8505,0.2252,-0.8981,-1.5826,0.2987,-0.2081],[-1.1486,-2.5106,2.3257,-0.0894,0.3343,-0.8459,1.4852,0.9638],[-0.6291,-2.4021,-0.0584,1.6191,-1.1294,1.0857,1.7751,-1.5536],[0.8027,1.118,-0.9334,-0.3206,2.0647,-2.6688,-1.4615,0.0264],[0.2784,1.455,-1.1537,1.7011,1.8112,-1.579,-1.803,-0.8749],[0.4835,1.8619,-2.5598,-0.0035,-2.1315,-1.0856,0.0514,1.8875],[2.9307,0.8346,-1.3697,0.2144,-1.2409,-1.7737,0.4748,0.7302],[2.8345,-0.0737,-1.1307,0.9914,-0.8288,-2.5573,0.5167,0.5329],[-1.9565,3.6108,-1.5101,0.0158,0.0917,-0.4721,2.7143,0.2911],[-1.371,1.6725,1.4551,1.1851,0.0706,0.4283,-2.5721,-1.6802],[-1.5128,2.4097,1.7768,-0.1434,2.6707,-1.0866,0.6837,-0.9875],[-1.677,2.2085,1.6702,-0.1512,2.3908,-1.4641,0.464,-1.1175],[1.4352,-0.2801,0.6607,1.7014,-1.234,1.9117,-1.9955,-1.9739],[2.7053,1.3861,-1.0584,0.4456,-1.3276,0.5356,-2.172,-1.312],[0.7753,-1.9753,0.3265,0.0684,-0.1015,-1.9255,2.2909,-1.2918],[0.9301,-1.7186,0.2093,0.09,0.0598,-1.7587,2.1203,-1.1815],[-1.9275,0.4299,-0.0951,-1.2477,0.8941,-0.4136,1.961,2.5769],[-0.8261,-1.3501,-1.2191,-0.0691,1.8883,2.0319,2.9551,1.3267],[-0.417,-1.3193,-2.8248,-0.5632,2.6332,0.357,1.6571,0.1647],[1.7625,0.4064,-0.3168,-1.6417,-0.7916,-0.9605,3.0034,1.6929],[-1.5025,-1.1725,-1.808,1.3147,-3.1314,2.4283,0.6809,0.4165],[-2.5448,-1.0962,-2.4829,0.9734,2.5231,-2.3178,2.5775,-1.19],[0.5496,0.7302,-0.2369,-3.1103,-1.7061,1.9593,0.3991,1.2377]],"WQ":[[[-0.6565,-0.8036,0.8149,-0.3815],[0.0087,-0.1427,0.3736,-0.2756],[0.5738,0.3965,0.2891,-0.3259],[0.0998,-0.0744,-1.0725,-0.8545],[0.4888,0.3716,-0.1587,-0.2186],[-0.5842,-0.4796,0.2187,0.1667],[-0.3174,-0.1579,-0.0054,-0.4349],[1.0915,0.6983,-0.1168,-0.925]],[[-0.7921,-0.7467,-1.0229,-0.3871],[-0.0061,-0.101,0.572,-0.9473],[-0.4044,-0.5297,-1.7874,-1.2649],[0.2896,-0.3196,-0.0597,-0.7879],[0.396,-0.3842,0.1801,1.0785],[-0.5455,0.417,0.4271,0.3935],[0.1497,-0.0668,0.5859,-1.009],[0.5871,1.8041,-0.7105,-0.3384]]],"WK":[[[-0.3003,1.1713,0.6188,0.6367],[-0.4508,0.2011,-0.7563,-0.7603],[-0.7968,-0.283,-1.2793,-1.18],[1.1059,-0.331,-0.5381,0.7656],[0.1219,-0.4201,0.6204,1.2485],[-0.1672,0.4816,-0.0585,0.56],[-0.2229,-0.1098,0.4782,0.1085],[-0.535,0.7197,-0.2163,-0.8212]],[[-0.4559,-0.9518,-0.4658,0.9113],[-0.3858,0.2088,0.252,-0.4751],[-0.398,1.2514,-0.3012,0.1333],[-0.3902,0.0564,-0.1881,-1.4579],[0.8431,-0.0308,1.137,0.5491],[-0.0468,0.4414,0.4442,0.5519],[-1.1066,-0.2584,0.7015,0.4073],[0.1789,0.5083,-0.4681,-0.6334]]],"WV":[[[-0.2373,0.5451,0.5406,0.6121],[0.2987,0.2038,0.2386,1.4115],[0.0411,-0.4802,-0.2041,-0.3349],[0.151,-0.9723,0.6005,-0.2389],[-0.5292,0.1145,-0.3487,0.2951],[-0.4261,-0.7003,-0.1412,-0.2314],[-0.8023,-0.9812,0.6658,0.678],[0.2403,0.277,-0.2277,0.3244]],[[0.4057,0.64,0.183,-0.4234],[0.0355,0.8868,-0.4384,0.6331],[0.3482,0.2627,0.5774,0.1334],[-0.0663,-0.6446,0.1564,-0.6618],[0.5316,0.5474,0.6376,0.5304],[0.6814,-0.1048,0.0674,0.053],[0.1697,0.4963,0.1521,-0.207],[0.1451,-0.0478,-1.0085,-0.5452]]],"WO":[[-0.8217,0.1894,-0.904,-0.108,0.0825,-0.7559,0.1716,-0.345],[0.7952,0.1272,-0.4701,-0.486,-0.0478,-0.2556,-0.1801,0.3478],[-0.1281,-0.1686,0.3548,-0.0935,0.7289,-0.078,0.7859,-0.0959],[-0.1196,-0.0456,-0.1246,-0.4894,0.523,0.5917,0.6722,0.4758],[-0.4444,0.4239,-0.1892,0.036,0.0039,0.3159,0.205,0.3362],[-0.243,-0.1258,0.4227,-0.0767,-0.0283,-0.1651,0.448,-0.0135],[1.1135,-0.4046,-0.2119,-0.0286,0.2228,0.3684,-0.1966,-0.2964],[0.1586,0.0554,0.5898,-0.1929,0.1358,-0.057,0.3381,0.163]],"W1":[[-0.4723,1.3503,0.0619,0.9122,-0.3099,0.388,0.5745,-0.8646,0.0055,0.3708,-0.4811,-0.1937,0.131,0.3501,0.8895,-0.645],[0.7947,1.1537,-0.2736,-0.1046,0.4849,1.1612,0.3458,0.5362,0.9276,-0.8826,-1.1401,-0.4666,0.3129,-0.4694,-0.1926,-0.1453],[-0.3808,-0.6759,-0.6113,0.5074,-0.0334,-0.2436,-0.7237,0.4549,-0.0143,-0.3453,-0.1459,0.5567,-0.6351,0.3614,-0.298,-0.2811],[-1.0249,0.2966,0.8503,-0.9591,0.6899,-1.8359,0.1773,-0.0268,0.6976,0.3123,0.1888,0.0367,-0.0453,0.2921,-1.5877,-0.1917],[-0.6916,-0.7304,-0.0651,-0.3542,0.0199,-0.7405,-0.2419,-0.2863,0.1193,-0.1091,-0.5644,0.2771,-0.1243,-1.3405,-0.3115,-0.1878],[0.6036,0.0615,-0.2262,-0.0688,-1.3842,0.0348,0.3071,0.1946,-0.0193,0.0513,0.7617,-0.5443,1.0607,0.4926,0.1481,-0.2238],[0.1454,-0.2187,-0.2821,0.8278,0.0515,0.2675,-0.0052,0.1578,0.9576,-1.0081,-0.7868,-1.2276,0.9391,0.0296,-0.578,0.8564],[0.433,-0.684,-0.242,0.0693,0.3661,0.3638,-1.0039,1.0869,-0.8982,0.7508,-0.6445,0.9497,-1.5793,0.425,0.3802,0.2083]],"B1":[-0.1157,-0.1268,-0.3071,-0.2247,0.2313,-0.5753,0.062,-0.2134,0.4048,-0.0703,-0.6559,-0.2154,0.1306,-0.2339,-0.0496,-0.2368],"W2":[[0.4668,-0.9351,0.4438,0.9944,-0.3821,0.1286,0.2857,-0.7199],[-0.1066,-0.5679,1.0303,-1.4265,-0.1327,0.1162,0.6189,0.732],[-0.2057,-0.2385,-0.8509,0.0764,0.204,0.2765,0.6673,0.3716],[0.6535,-0.8568,0.7411,-0.9518,-0.1984,-0.2664,-0.5257,1.1328],[-0.54,-0.0455,-0.071,0.3438,-0.1917,-0.1518,0.722,-0.8992],[-0.086,1.045,-0.0361,0.0761,0.7992,-0.24,-0.964,0.6423],[1.2338,0.2869,0.2744,-1.3162,0.1892,-0.7691,0.2697,0.4397],[0.0642,0.3512,-0.138,-0.6751,0.6329,-0.4677,0.0805,0.3154],[1.1501,-0.7669,-0.3265,0.0069,-0.1347,0.1529,0.1287,0.4756],[-0.0698,0.5649,-0.2266,-0.2735,-0.8299,0.6613,0.4089,0.4367],[0.3812,0.1818,-0.822,-0.1356,-0.0988,-0.5012,-0.2442,-0.082],[0.939,0.0951,1.3524,0.2592,-0.3323,-0.4886,-0.0576,-0.7546],[-0.1535,0.6336,1.2447,0.4102,-0.1622,-0.4995,-0.4882,-0.0775],[-1.9307,0.1413,0.2893,0.0752,0.5957,0.0926,-0.3741,0.2357],[1.505,-0.5316,-0.4675,0.1208,0.1498,0.3397,0.1556,-0.7875],[0.388,0.0401,-0.1584,-0.3144,0.123,0.5157,-0.6288,0.2588]],"B2":[-0.4199,0.179,-0.1096,-0.0702,0.1369,0.3872,0.0537,0.0323],"meta":{"frases":30000,"val_loss":0.737,"params":832}};

;
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

;
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

;
/* =========================================================================
   CLIENTE — se carga en todas las páginas (ya prerenderizadas en el build).
   Solo añade interactividad: menús, tema, buscador, copiar código y el
   montaje de los componentes vivos de cada página (portada animada,
   laboratorio, Transformer Visualizer, índice del artículo, progreso de la ruta).
   ========================================================================= */
(() => {
  const $ = id => document.getElementById(id);
  const page = document.body.dataset.page || '';

  /* ---------- enlaces antiguos con # (versión de una sola página) ---------- */
  const OLD = window.__OLD_ROUTES || {};
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    const h = location.hash.slice(1);
    if (h && OLD[h]) { location.replace(OLD[h]); return; }
  }

  /* ---------- tema ---------- */
  const tbtn = $('theme-btn');
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => { tbtn.setAttribute('aria-label', isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); tbtn.textContent = isDark() ? '☀' : '☾'; };
  tbtn.onclick = () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; U.store.set('mlai.theme', next); label();
    const fr = document.querySelector('#lab-frame iframe'); try { if (fr) fr.contentDocument.documentElement.dataset.theme = next; } catch (e) { /* sin acceso */ }
  };
  label();

  /* ---------- menús ---------- */
  const tb = $('topics-btn'), mega = $('mega'), mb = $('menu-btn');
  const closeMenus = () => { mega.hidden = true; tb.setAttribute('aria-expanded', 'false'); document.body.classList.remove('drawer-open'); mb.setAttribute('aria-expanded', 'false'); };
  tb.onclick = e => { e.stopPropagation(); mega.hidden = !mega.hidden; tb.setAttribute('aria-expanded', String(!mega.hidden)); };
  document.addEventListener('click', e => { if (!e.target.closest('#mega') && !e.target.closest('#topics-btn')) { mega.hidden = true; tb.setAttribute('aria-expanded', 'false'); } });
  mb.onclick = () => { const o = document.body.classList.toggle('drawer-open'); mb.setAttribute('aria-expanded', String(o)); };

  /* ---------- buscador (índice JSON que genera el build) ---------- */
  let INDEX = null, selIdx = 0, lastRes = [];
  const loadIndex = async () => {
    if (INDEX) return INDEX;
    try { INDEX = await fetch('/assets/search-index.json').then(r => r.json()); INDEX.forEach(d => { d._t = U.norm(d.title); d._x = U.norm(d.text); }); }
    catch (e) { console.error('Buscador: no se pudo cargar el índice', e); INDEX = []; }
    return INDEX;
  };
  function search(q) {
    const terms = U.norm(q).split(/\s+/).filter(t => t.length > 1);
    if (!terms.length || !INDEX) return [];
    const out = [];
    for (const d of INDEX) {
      let sc = 0, all = true;
      for (const t of terms) { const inT = d._t.includes(t), inX = d._x.includes(t); if (!inT && !inX) { all = false; break; }
        sc += inT ? (d._t.startsWith(t) || d._t.includes(' ' + t) ? 8 : 5) : 1; }
      if (all) out.push([sc + (d.type === 'Laboratorio' || d.type === 'Artículo' ? 1 : 0), d]);
    }
    return out.sort((a, b) => b[0] - a[0]).slice(0, 10).map(x => x[1]);
  }
  function renderResults(q) {
    const box = $('search-results');
    lastRes = search(q); selIdx = 0;
    if (!q.trim()) { box.innerHTML = `<p class="hint">Busca conceptos, algoritmos, laboratorios, papers, datasets o proyectos. Por ejemplo: <i>gini</i>, <i>softmax</i>, <i>lora</i>, <i>regresión logística</i>.</p>`; return; }
    if (!INDEX) { box.innerHTML = '<p class="hint">Cargando índice…</p>'; return; }
    if (!lastRes.length) { box.innerHTML = `<p class="hint">Sin resultados para «${U.esc(q)}». Prueba con otra palabra o sin tildes.</p>`; return; }
    box.innerHTML = `<ul role="listbox">${lastRes.map((d, i) => `<li role="option" aria-selected="${i === selIdx}" data-i="${i}" class="${i === selIdx ? 'on' : ''}"><a href="${U.esc(d.url)}" tabindex="-1"><span class="rt">${d.type}</span><b>${U.esc(d.title)}</b><small>${U.esc(d.text.slice(0, 110))}${d.text.length > 110 ? '…' : ''}</small></a></li>`).join('')}</ul>`;
  }
  const openSearch = async () => { $('search').hidden = false; const inp = $('search-input'); inp.value = ''; renderResults(''); inp.focus(); document.body.classList.add('noscroll'); await loadIndex(); if (inp.value) renderResults(inp.value); };
  const closeSearch = () => { $('search').hidden = true; document.body.classList.remove('noscroll'); };
  document.querySelectorAll('[data-open-search]').forEach(b => b.onclick = openSearch);
  const inp = $('search-input');
  inp.oninput = () => renderResults(inp.value);
  inp.onkeydown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!lastRes.length) return; selIdx = (selIdx + (e.key === 'ArrowDown' ? 1 : -1) + lastRes.length) % lastRes.length;
      document.querySelectorAll('#search-results li').forEach((li, i) => { li.classList.toggle('on', i === selIdx); li.setAttribute('aria-selected', String(i === selIdx)); if (i === selIdx) li.scrollIntoView({ block:'nearest' }); }); }
    if (e.key === 'Enter' && lastRes[selIdx]) location.href = lastRes[selIdx].url;
    if (e.key === 'Escape') closeSearch();
  };
  $('search').onclick = e => { if (e.target.id === 'search') closeSearch(); };
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { closeMenus(); if (!$('search').hidden) closeSearch(); }
  });

  /* ---------- copiar código ---------- */
  U.wireCopy(document);

  /* ---------- componentes de cada página ---------- */
  if (page === 'home') { const cv = $('hero-canvas'); if (cv && typeof PixelHero !== 'undefined') PixelHero.mount(cv, cv.dataset.bg); }

  if (page === 'lab') {
    const box = $('lab-frame'), file = box.dataset.file;
    const fr = document.createElement('iframe'); fr.title = box.dataset.title; fr.src = file + (location.hash.startsWith('#reto-') ? location.hash : '');
    box.innerHTML = ''; box.appendChild(fr);
    const fit = () => { try { const d = fr.contentDocument; if (d && d.body) { const t = document.documentElement.dataset.theme; if (t) d.documentElement.dataset.theme = t; const h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight); if (h > 50) fr.style.height = h + 'px'; } } catch (e) { fr.style.height = '85vh'; clearInterval(timer); } };
    fr.onload = fit; const timer = setInterval(fit, 700);
  }

  if (page === 'transformer' && typeof TVUI !== 'undefined') TVUI.render($('tv-root'));

  if (page === 'article') {
    const links = [...document.querySelectorAll('.article .toc a')];
    const map = new Map(links.map(a => [a.dataset.target, a]));
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); } }), { rootMargin:'-20% 0px -70% 0px' });
    map.forEach((_, id) => { const el = $(id); if (el) obs.observe(el); });
  }

  // lecciones: test de autoevaluación
  document.querySelectorAll('[data-quiz]').forEach(qz => {
    const qs = [...qz.querySelectorAll('li.q')], score = qz.querySelector('.score');
    qz.querySelector('[data-check]').onclick = () => {
      let ok = 0, blank = 0;
      qs.forEach(q => {
        const sel = q.querySelector('input:checked'), fb = q.querySelector('.fb');
        q.classList.remove('right', 'wrong');
        if (!sel) { blank++; fb.hidden = true; return; }
        const right = sel.value === q.dataset.answer; ok += right;
        q.classList.add(right ? 'right' : 'wrong'); fb.hidden = false;
      });
      score.textContent = `${ok} de ${qs.length} correctas` + (blank ? ` · ${blank} sin contestar` : '') +
        (ok === qs.length ? ' · ¡Perfecto!' : ok >= qs.length * 0.8 ? ' · ¡Superado!' : ' · Repasa los apartados de las preguntas falladas y vuelve a intentarlo.');
      U.store.set('mlai.quiz.' + qz.dataset.quiz, Math.max(ok, U.store.get('mlai.quiz.' + qz.dataset.quiz, 0)));
    };
    qz.querySelector('[data-reset]').onclick = () => {
      qs.forEach(q => { q.classList.remove('right', 'wrong'); q.querySelector('.fb').hidden = true; q.querySelectorAll('input').forEach(i => i.checked = false); });
      score.textContent = '';
    };
  });
  // lecciones: lista de comprobación y botón de nivel completado
  document.querySelectorAll('[data-checklist]').forEach(cl => {
    const key = 'mlai.check.' + cl.dataset.checklist, boxes = [...cl.querySelectorAll('input[data-item]')];
    const saved = U.store.get(key, {}); boxes.forEach(b => { b.checked = !!saved[b.dataset.item]; b.onchange = () => { const d = U.store.get(key, {}); d[b.dataset.item] = b.checked; U.store.set(key, d); }; });
  });
  document.querySelectorAll('[data-complete-level]').forEach(btn => {
    const n = btn.dataset.completeLevel, status = btn.parentElement.querySelector('[data-level-status]');
    const paint = () => { const done = !!U.store.get('mlai.path', {})[n]; btn.textContent = done ? 'Nivel completado ✓ (desmarcar)' : 'Marcar el nivel como completado'; btn.classList.toggle('primary', !done); status.textContent = done ? 'Aparece como completado en la ruta de aprendizaje.' : ''; };
    btn.onclick = () => { const d = U.store.get('mlai.path', {}); d[n] = !d[n]; U.store.set('mlai.path', d); paint(); };
    paint();
  });

  // calculadora de riesgo de baja (proyecto de churn)
  document.querySelectorAll('[data-churn-calc]').forEach(box => {
    let M; try { M = JSON.parse(box.dataset.churnCalc); } catch (e) { return; }
    const f = k => box.querySelector(`[data-k="${k}"]`);
    const calc = () => {
      const v = {}; box.querySelectorAll('[data-k]').forEach(el => { v[el.dataset.k] = el.type === 'range' ? +el.value : el.value; });
      const sinInternet = v.InternetService === 'No';
      ['TechSupport', 'OnlineSecurity'].forEach(k => { f(k).disabled = sinInternet; if (sinInternet) v[k] = 'No internet service'; });
      let z = M.intercept;
      for (const [k, p] of Object.entries(M.num)) z += p.w * (v[k] - p.mean) / p.std;
      for (const [k, w] of Object.entries(M.cat)) z += w[v[k]] || 0;
      const pr = 1 / (1 + Math.exp(-z));
      box.querySelectorAll('[data-out]').forEach(o => { o.textContent = v[o.dataset.out]; });
      box.querySelector('[data-p]').textContent = Math.round(pr * 100) + ' %';
      const bar = box.querySelector('[data-bar]'); bar.style.width = (pr * 100).toFixed(1) + '%'; bar.className = pr >= 0.25 ? 'hi' : '';
      box.querySelector('[data-verdict]').textContent = pr >= 0.25 ? 'Por encima del umbral de 0,25: entraría en la campaña de retención.' : 'Por debajo del umbral de 0,25: no se contactaría.';
    };
    box.addEventListener('input', calc); calc();
  });

  if (page === 'path') {
    const boxes = [...document.querySelectorAll('[data-level]')], bar = document.querySelector('.progress');
    const paint = () => {
      const d = U.store.get('mlai.path', {}); let n = 0;
      boxes.forEach(c => { c.checked = !!d[c.dataset.level]; c.closest('li').classList.toggle('is-done', c.checked); n += c.checked; });
      const pct = Math.round(n / boxes.length * 100);
      bar.setAttribute('aria-valuenow', pct); bar.querySelector('span').style.width = pct + '%'; bar.querySelector('b').textContent = pct + ' % completado';
    };
    boxes.forEach(c => c.onchange = () => { const d = U.store.get('mlai.path', {}); d[c.dataset.level] = c.checked; U.store.set('mlai.path', d); paint(); });
    paint();
  }

  if (page === 'papers') {
    document.querySelectorAll('.filters button').forEach(b => b.onclick = () => {
      document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b));
      document.querySelectorAll('.paper').forEach(p => { p.hidden = !!b.dataset.f && p.dataset.area !== b.dataset.f; });
    });
  }

  // destacar el elemento al que apunta un ancla (#t-random-forest, #p-…)
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }
})();
