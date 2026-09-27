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
const LAB = Object.fromEntries(LABS.map(l => [l.id, l]));
const AREA = Object.fromEntries(AREAS.map(a => [a.id, a]));
const AREA_TAG = { ml:'Machine Learning', dl:'Deep Learning', math:'Matemáticas', llm:'LLM', prog:'Programación', mlops:'MLOps', research:'Investigación' };

/* =========================================================================
   COMPONENTES
   ========================================================================= */
const C = {
  labCard: l => `<article class="card lab-card">
      <span class="tag t-${l.area}">${AREA_TAG[l.area]}</span>
      <h3><a href="#lab-${l.id}">${l.t}</a></h3>
      <p>${l.d}</p>
      <div class="card-actions"><a class="btn sm primary" href="#lab-${l.id}">Abrir laboratorio</a><a class="btn sm ghost" href="${l.url}" target="_blank" rel="noopener">Pestaña nueva ↗</a></div>
    </article>`,
  topicCard: (tp, area) => {
    const links = [];
    if (tp.art) links.push(`<a class="pill p-art" href="#${tp.art}">Artículo completo</a>`);
    if (tp.lab) links.push(`<a class="pill p-lab" href="#lab-${tp.lab}">Laboratorio</a>`);
    if (tp.route === 'transformer') links.push(`<a class="pill p-lab" href="#transformer">Visualizador</a>`);
    if (tp.route === 'papers') links.push(`<a class="pill p-art" href="#papers">Biblioteca</a>`);
    if (!links.length) links.push(`<span class="pill p-soon">Artículo en preparación</span>`);
    return `<article class="card topic" id="t-${U.slug(tp.t)}"><h3>${tp.t}</h3><p>${tp.d}</p><div class="pills">${links.join('')}</div></article>`;
  },
  paperCard: p => `<details class="card paper" id="p-${p.id}">
      <summary><span class="py">${p.y}</span><span class="pt"><b>${p.t}</b><small>${p.a} · <i>${p.v}</i></small></span><span class="tag t-research">${p.area}</span></summary>
      <dl class="kv">
        <dt>Problema</dt><dd>${p.p}</dd>
        <dt>Aportación</dt><dd>${p.c}</dd>
        <dt>Arquitectura</dt><dd>${p.arch}</dd>
        <dt>Relevancia</dt><dd>${p.r}</dd>
        <dt>Implementación</dt><dd><code>${U.esc(p.impl)}</code>${p.lab ? ` · <a href="#lab-${p.lab}">laboratorio relacionado</a>` : ''}</dd>
      </dl></details>`,
  pageHead: (kicker, title, lede, extra = '') => `<header class="page-head"><span class="kicker">${kicker}</span><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}${extra}</header>`,
  crumbs: items => `<nav class="crumbs" aria-label="Migas de pan">${items.map(([t, h]) => h ? `<a href="#${h}">${t}</a>` : `<span>${t}</span>`).join('<span class="sep">/</span>')}</nav>`,
};

/* =========================================================================
   PÁGINAS
   ========================================================================= */
const STACK = [
  { t:'Matemáticas', r:'math', m:() => `${AREA.math.topics.length} temas` },
  { t:'Programación', r:'prog', m:() => `${AREA.prog.topics.length} temas` },
  { t:'Machine Learning', r:'ml', m:() => `${AREA.ml.topics.length} temas · 4 labs` },
  { t:'Deep Learning', r:'dl', m:() => `${AREA.dl.topics.length} temas · 3 labs` },
  { t:'Transformers', r:'transformer', m:() => 'visualizador de 13 etapas' },
  { t:'LLM', r:'llm', m:() => `${AREA.llm.topics.length} temas · 1 lab` },
  { t:'Agentes', r:'path', m:() => 'nivel 9 de la ruta' },
  { t:'Investigación', r:'papers', m:() => `${PAPERS.length} papers` },
];

const PAGES = {
  home() {
    const recent = [...PAPERS].sort((a, b) => b.y - a.y).slice(0, 4);
    return `
    <section class="hero">
      <div class="hero-copy">
        <span class="kicker">Portal de ingeniería · Aprendizaje automático</span>
        <h1>Machine Learning Engineering <span>&amp;</span> Artificial Intelligence</h1>
        <p class="lede">Teoría rigurosa, código que se ejecuta y simulaciones que se pueden tocar. Desde el álgebra lineal hasta cómo un Transformer elige la siguiente palabra.</p>
        <div class="cta"><a class="btn primary" href="#path">Empezar la ruta</a><a class="btn" href="#lab">Abrir el laboratorio</a><a class="btn ghost" href="#transformer">Transformer Visualizer →</a></div>
        <dl class="stats"><div><dt>Laboratorios</dt><dd>${LABS.length}</dd></div><div><dt>Temas</dt><dd>${AREAS.reduce((a, x) => a + x.topics.length, 0)}</dd></div><div><dt>Papers</dt><dd>${PAPERS.length}</dd></div><div><dt>Niveles</dt><dd>${PATH.length}</dd></div></dl>
      </div>
      <figure class="hero-art">
        <img src="${HERO_IMG}" width="200" height="150" alt="Ilustración en pixel art de un Transformer: las palabras «el gato» entran por abajo, pasan por embedding, atención, add &amp; norm y feed forward, y sale la palabra «come». A la izquierda, un robot conectado; a la derecha, un mapa de atención." decoding="async" fetchpriority="high">
        <figcaption><span>fig. 1</span> Un bloque Transformer: de «el gato» a «come»</figcaption>
      </figure>
    </section>

    <nav class="kmap" aria-label="Mapa del conocimiento">
      <div class="kmap-head"><span class="kicker">Mapa del conocimiento</span><span class="kmap-note">Cada capa se apoya en la anterior</span></div>
      <ol>${STACK.map((s, i) => `<li><a href="#${s.r}"><span class="lv">L${i + 1}</span><b>${s.t}</b><small>${s.m()}</small></a></li>`).join('')}</ol>
    </nav>

    <section class="band">
      <div class="band-head"><h2>Laboratorios</h2><a href="#lab">Ver todos →</a></div>
      <div class="grid g3">${LABS.slice(0, 6).map(C.labCard).join('')}</div>
    </section>

    <section class="band two">
      <div>
        <div class="band-head"><h2>Últimos artículos</h2></div>
        <a class="card feature" href="#random-forest">
          <span class="tag t-ml">Machine Learning · artículo completo</span>
          <h3>Random Forest</h3>
          <p>De la intuición a la implementación desde cero en NumPy, con resultados reales sobre el dataset Breast Cancer Wisconsin: 95,8 % de acierto en test y 0,995 de ROC-AUC.</p>
          <span class="more">Leer artículo →</span>
        </a>
        <a class="card feature" href="#transformer">
          <span class="tag t-llm">LLM · guía interactiva</span>
          <h3>Un Transformer, etapa a etapa</h3>
          <p>Del texto al token generado en 13 etapas, con tensores, ecuaciones y el código PyTorch equivalente.</p>
          <span class="more">Abrir el visualizador →</span>
        </a>
      </div>
      <div>
        <div class="band-head"><h2>Algoritmos destacados</h2></div>
        <ul class="algo-list">
          <li><a href="#random-forest"><b>Random Forest</b><span>Ensembles · artículo + laboratorio</span></a></li>
          <li><a href="#lab-kmeans"><b>K-means</b><span>Clustering · laboratorio</span></a></li>
          <li><a href="#lab-gd"><b>Descenso de gradiente</b><span>Optimización · laboratorio</span></a></li>
          <li><a href="#lab-backprop"><b>Backpropagation</b><span>Deep learning · laboratorio</span></a></li>
          <li><a href="#lab-attn"><b>Self-attention</b><span>Transformers · laboratorio</span></a></li>
          <li><a href="#lab-reg"><b>Lasso y Ridge</b><span>Regularización · laboratorio</span></a></li>
        </ul>
      </div>
    </section>

    <section class="band">
      <div class="band-head"><h2>Ruta de aprendizaje</h2><a href="#path">Ver la ruta →</a></div>
      <ol class="path-strip">${PATH.map(l => `<li><a href="#path"><span>${String(l.n).padStart(2, '0')}</span>${l.t}</a></li>`).join('')}</ol>
    </section>

    <section class="band two">
      <div>
        <div class="band-head"><h2>Proyectos</h2><a href="#projects">Ver todos →</a></div>
        <a class="card feature" href="#project-mantenimiento"><span class="tag t-mlops">${PROJECTS[0].area} · ${PROJECTS[0].status}</span><h3>${PROJECTS[0].t}</h3><p>${PROJECTS[0].d}</p><span class="more">Ver el proyecto →</span></a>
      </div>
      <div>
        <div class="band-head"><h2>Papers</h2><a href="#papers">Biblioteca →</a></div>
        <ul class="algo-list">${recent.map(p => `<li><a href="#papers" data-paper="${p.id}"><b>${p.t}</b><span>${p.a.split(',')[0]}${p.a.includes(',') || p.a.includes('et al') ? ' et al.' : ''} · ${p.y}</span></a></li>`).join('')}</ul>
      </div>
    </section>`;
  },

  area(id) {
    const a = AREA[id]; const labs = LABS.filter(l => l.area === id || a.topics.some(t => t.lab === l.id));
    const nl = new Set(labs.map(l => l.id)).size;
    return C.crumbs([['Inicio', 'home'], [a.t]]) + C.pageHead(a.kicker, a.t, a.d, `<p class="meta">${a.topics.length} temas · ${nl} laboratorios relacionados · ${a.topics.filter(t => t.art).length} artículos completos</p>`) +
      (labs.length ? `<section class="band tight"><h2 class="h2s">Laboratorios de esta área</h2><div class="chips-row">${[...new Map(labs.map(l => [l.id, l])).values()].map(l => `<a class="chip-link" href="#lab-${l.id}">${l.t}</a>`).join('')}</div></section>` : '') +
      `<section class="grid g3 topics">${a.topics.map(t => C.topicCard(t, a)).join('')}</section>`;
  },

  lab() {
    return C.crumbs([['Inicio', 'home'], ['Laboratorio']]) + C.pageHead('Laboratorio interactivo', 'Experimenta con los algoritmos', 'Nueve simulaciones que calculan todo en tu navegador. Cambia parámetros y mira el efecto al instante: tasa de aprendizaje, profundidad, regularización, número de grupos, capas de una red o cabezas de atención.') +
      `<div class="grid g3">${LABS.map(C.labCard).join('')}</div>
      <aside class="card note-card"><h3>Transformer Visualizer</h3><p>El recorrido completo de un Transformer, de texto a token generado, con tensores y código PyTorch en cada etapa.</p><a class="btn sm primary" href="#transformer">Abrir el visualizador</a></aside>`;
  },

  labDetail(id) {
    const l = LAB[id]; if (!l) return PAGES.notFound();
    return C.crumbs([['Inicio', 'home'], ['Laboratorio', 'lab'], [l.t]]) +
      `<header class="lab-head"><div><span class="tag t-${l.area}">${AREA_TAG[l.area]}</span><h1>${l.t}</h1><p>${l.d}</p></div>
       <div class="lab-actions"><a class="btn" href="${l.url}" target="_blank" rel="noopener">Abrir en pestaña nueva ↗</a></div></header>
       <div class="lab-frame" id="lab-frame"><p class="loading">Cargando laboratorio…</p></div>
       <nav class="lab-nav">${(() => { const i = LABS.indexOf(l); const p = LABS[(i + LABS.length - 1) % LABS.length], n = LABS[(i + 1) % LABS.length];
         return `<a class="card" href="#lab-${p.id}"><small>← Anterior</small><b>${p.t}</b></a><a class="card right" href="#lab-${n.id}"><small>Siguiente →</small><b>${n.t}</b></a>`; })()}</nav>`;
  },

  transformer() {
    return C.crumbs([['Inicio', 'home'], ['LLM', 'llm'], ['Transformer Visualizer']]) + C.pageHead('LLM · Transformer Visualizer', 'Del texto al siguiente token',
      'Un Transformer decoder real de una capa (d<sub>model</sub> = 8, 2 cabezas, d<sub>ff</sub> = 16) que se ejecuta en tu navegador. Escribe una frase y recorre las 13 etapas: en cada una verás la forma de los tensores, la ecuación, los números y el código PyTorch equivalente.',
      `<p class="honest">Los pesos son aleatorios con semilla fija: el modelo no está entrenado, así que la palabra que predice no tiene sentido. Las operaciones, las formas y los números sí son los que calcularía un modelo real con estos pesos.</p>`) +
      `<div id="tv-root" class="tv"></div>`;
  },

  path() {
    const done = U.store.get('mlai.path', {});
    const pct = Math.round(PATH.filter(l => done[l.n]).length / PATH.length * 100);
    return C.crumbs([['Inicio', 'home'], ['Ruta de aprendizaje']]) + C.pageHead('Ruta de aprendizaje', 'De las matemáticas a la investigación',
      'Diez niveles en orden. Cada uno tiene teoría, un ejercicio, un proyecto y un criterio claro para saber si lo has completado. Marca los niveles terminados: el progreso se guarda solo en este navegador.',
      `<div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span><b>${pct} % completado</b></div>`) +
      `<ol class="timeline">${PATH.map(l => `<li class="${done[l.n] ? 'is-done' : ''}">
        <div class="tl-n">${String(l.n).padStart(2, '0')}</div>
        <article class="card tl-card">
          <header><h3>Nivel ${l.n} · ${l.t}</h3><label class="chk" for="lv-${l.n}"><input type="checkbox" id="lv-${l.n}" data-level="${l.n}" ${done[l.n] ? 'checked' : ''}> Completado</label></header>
          <dl class="kv">
            <dt>Teoría</dt><dd>${l.th}</dd>
            <dt>Ejercicio</dt><dd>${l.ex}</dd>
            <dt>Proyecto</dt><dd>${l.pr}</dd>
            <dt>Está completo cuando…</dt><dd>${l.ok}</dd>
          </dl>
          ${(l.labs.length || l.route) ? `<div class="pills">${l.labs.map(id => `<a class="pill p-lab" href="#lab-${id}">${LAB[id].t}</a>`).join('')}${l.route === 'transformer' ? '<a class="pill p-lab" href="#transformer">Transformer Visualizer</a>' : ''}${l.route === 'papers' ? '<a class="pill p-art" href="#papers">Biblioteca de papers</a>' : ''}</div>` : ''}
        </article></li>`).join('')}</ol>`;
  },

  papers() {
    const areas = [...new Set(PAPERS.map(p => p.area))];
    return C.crumbs([['Inicio', 'home'], ['Investigación', 'research'], ['Papers']]) + C.pageHead('Investigación · Biblioteca', 'Papers fundamentales',
      `${PAPERS.length} trabajos que definieron el campo, ordenados por año. Cada ficha resume el problema, la aportación, la arquitectura y dónde está implementado hoy. Solo se incluyen referencias reales y verificables.`) +
      `<div class="filters" role="group" aria-label="Filtrar por área"><button type="button" class="on" data-f="">Todos</button>${areas.map(a => `<button type="button" data-f="${U.esc(a)}">${a}</button>`).join('')}</div>
       <div class="paper-list" id="paper-list">${[...PAPERS].sort((a, b) => a.y - b.y).map(C.paperCard).join('')}</div>`;
  },

  datasets() {
    return C.crumbs([['Inicio', 'home'], ['Datasets']]) + C.pageHead('Datos', 'Datasets de referencia', 'Conjuntos de datos públicos y conocidos para practicar cada tipo de problema, con su tamaño, variables y los modelos que suelen funcionar mejor.') +
      `<div class="grid g2">${DATASETS.map(d => `<article class="card ds" id="d-${d.id}"><h3>${d.t}</h3><p class="src">${d.src}</p>
        <dl class="kv"><dt>Registros</dt><dd>${d.n}</dd><dt>Variables</dt><dd>${d.vars}</dd><dt>Tipos</dt><dd>${d.types}</dd><dt>Problema</dt><dd>${d.task}</dd><dt>Modelos</dt><dd>${d.models}</dd>${d.ex ? `<dt>Ejemplo</dt><dd><code>${U.esc(d.ex)}</code></dd>` : ''}</dl>
        ${d.art ? `<a class="pill p-art" href="#${d.art}">Usado en el artículo de Random Forest</a>` : ''}${d.proj ? `<a class="pill p-art" href="#project-${d.proj}">Usado en un proyecto</a>` : ''}</article>`).join('')}</div>`;
  },

  projects() {
    return C.crumbs([['Inicio', 'home'], ['Proyectos']]) + C.pageHead('Portfolio', 'Proyectos', 'Cada proyecto sigue el mismo recorrido: problema, datos, exploración, preprocesado, modelo, entrenamiento, evaluación, optimización, despliegue y resultados. Solo se publican resultados cuando el proyecto se ha ejecutado de verdad.') +
      `<div class="grid g3">${PROJECTS.map(p => `<article class="card proj ${p.status === 'Planificado' ? 'planned' : ''}"><span class="tag t-mlops">${p.area}</span><h3>${p.id === 'mantenimiento' ? `<a href="#project-mantenimiento">${p.t}</a>` : p.t}</h3><p>${p.d}</p><span class="status">${p.status}</span></article>`).join('')}</div>`;
  },

  about() {
    return C.crumbs([['Inicio', 'home'], ['Arquitectura']]) + C.pageHead('Sobre el portal', 'Arquitectura y hoja de ruta', 'Esta versión es un prototipo navegable autocontenido. Así se corresponde con la plataforma de producción prevista.') + ARCH;
  },

  notFound() { return C.pageHead('Error 404', 'Página no encontrada', 'Esa dirección no existe. Vuelve al <a href="#home">inicio</a> o usa el buscador.'); },
};

/* =========================================================================
   BÚSQUEDA
   Índice en memoria con el mismo esquema de documento que usará la API:
   { id, type, title, text, route }. Sustituir search() por una llamada a
   /api/search (pgvector) no cambia la interfaz.
   ========================================================================= */
const INDEX = [];
function buildIndex() {
  AREAS.forEach(a => {
    INDEX.push({ type:'Área', title:a.t, text:a.d, route:a.id });
    a.topics.forEach(t => INDEX.push({ type:'Tema', title:t.t, text:`${t.d} ${a.t}`, route:a.id, anchor:'t-' + U.slug(t.t) }));
  });
  LABS.forEach(l => INDEX.push({ type:'Laboratorio', title:l.t, text:`${l.d} ${l.tags.join(' ')}`, route:'lab-' + l.id }));
  PAPERS.forEach(p => INDEX.push({ type:'Paper', title:p.t, text:`${p.a} ${p.y} ${p.area} ${p.c} ${p.impl}`, route:'papers', anchor:'p-' + p.id }));
  DATASETS.forEach(d => INDEX.push({ type:'Dataset', title:d.t, text:`${d.task} ${d.vars} ${d.models}`, route:'datasets', anchor:'d-' + d.id }));
  PROJECTS.forEach(p => INDEX.push({ type:'Proyecto', title:p.t, text:`${p.d} ${p.area}`, route:p.id === 'mantenimiento' ? 'project-mantenimiento' : 'projects' }));
  PATH.forEach(l => INDEX.push({ type:'Ruta', title:`Nivel ${l.n} · ${l.t}`, text:`${l.th} ${l.ex} ${l.pr}`, route:'path' }));
  RF_SECTIONS.forEach(s => INDEX.push({ type:'Artículo', title:`Random Forest · ${s.t}`, text:s.plain || '', route:'random-forest', anchor:'rf-' + s.id }));
  INDEX.push({ type:'Visualizador', title:'Transformer Visualizer', text:'tokenización embeddings positional encoding qkv attention softmax multi-head feed forward logits probabilidades pytorch', route:'transformer' });
  PM_STAGES.forEach(s => INDEX.push({ type:'Proyecto', title:`Mantenimiento predictivo · ${s.t}`, text:s.plain || '', route:'project-mantenimiento', anchor:'pm-' + U.slug(s.t) }));
  INDEX.forEach((d, i) => { d.id = i; d._t = U.norm(d.title); d._x = U.norm(d.text); });
}
function search(q) {
  const terms = U.norm(q).split(/\s+/).filter(t => t.length > 1);
  if (!terms.length) return [];
  const out = [];
  for (const d of INDEX) {
    let sc = 0, all = true;
    for (const t of terms) {
      const inT = d._t.includes(t), inX = d._x.includes(t);
      if (!inT && !inX) { all = false; break; }
      sc += inT ? (d._t.startsWith(t) || d._t.includes(' ' + t) ? 8 : 5) : 1;
    }
    if (all) out.push([sc + (d.type === 'Laboratorio' || d.type === 'Artículo' ? 1 : 0), d]);
  }
  return out.sort((a, b) => b[0] - a[0]).slice(0, 10).map(x => x[1]);
}
function openSearch() {
  const dlg = document.getElementById('search'); dlg.hidden = false;
  const inp = document.getElementById('search-input'); inp.value = ''; renderResults(''); inp.focus();
  document.body.classList.add('noscroll');
}
function closeSearch() { document.getElementById('search').hidden = true; document.body.classList.remove('noscroll'); }
let selIdx = 0, lastRes = [];
function renderResults(q) {
  const box = document.getElementById('search-results');
  lastRes = search(q); selIdx = 0;
  if (!q.trim()) { box.innerHTML = `<p class="hint">Busca conceptos, algoritmos, laboratorios, papers, datasets o proyectos. Por ejemplo: <i>gini</i>, <i>softmax</i>, <i>lora</i>, <i>adam</i>.</p>`; return; }
  if (!lastRes.length) { box.innerHTML = `<p class="hint">Sin resultados para «${U.esc(q)}». Prueba con otra palabra o sin tildes.</p>`; return; }
  box.innerHTML = `<ul role="listbox">${lastRes.map((d, i) => `<li role="option" aria-selected="${i === selIdx}" data-i="${i}" class="${i === selIdx ? 'on' : ''}"><span class="rt">${d.type}</span><b>${U.esc(d.title)}</b><small>${U.esc(d.text.slice(0, 110))}${d.text.length > 110 ? '…' : ''}</small></li>`).join('')}</ul>`;
}
function goResult(d) { closeSearch(); pendingAnchor = d.anchor || null; if (location.hash === '#' + d.route) route(); else location.hash = d.route; }

/* =========================================================================
   ROUTER (hash con un solo token: #ml, #lab-gd, #random-forest…)
   ========================================================================= */
let pendingAnchor = null, labTimer = null;
function route() {
  clearInterval(labTimer);
  const h = (location.hash || '#home').slice(1) || 'home';
  const app = document.getElementById('app');
  let html, after = null, title = 'MLE·AI';
  if (h === 'home') { html = PAGES.home(); }
  else if (AREA[h]) { html = PAGES.area(h); title = AREA[h].t; }
  else if (h === 'lab') { html = PAGES.lab(); title = 'Laboratorio'; }
  else if (h.startsWith('lab-')) { const id = h.slice(4); html = PAGES.labDetail(id); title = LAB[id]?.t || 'Laboratorio'; after = () => mountLab(id); }
  else if (h === 'transformer') { html = PAGES.transformer(); title = 'Transformer Visualizer'; after = () => TVUI.render(document.getElementById('tv-root')); }
  else if (h === 'random-forest') { html = RF_PAGE(); title = 'Random Forest'; after = mountArticle; }
  else if (h === 'project-mantenimiento') { html = PM_PAGE(); title = 'Mantenimiento predictivo'; after = mountArticle; }
  else if (PAGES[h] && !['area', 'labDetail', 'notFound'].includes(h)) { html = PAGES[h](); title = { path:'Ruta de aprendizaje', papers:'Papers', datasets:'Datasets', projects:'Proyectos', about:'Arquitectura' }[h] || title; }
  else { html = PAGES.notFound(); title = 'No encontrado'; }
  app.innerHTML = html;
  document.title = title === 'MLE·AI' ? 'MLE·AI — Machine Learning Engineering' : `${title} · MLE·AI`;
  document.querySelectorAll('[data-nav]').forEach(a => { const n = a.dataset.nav; a.classList.toggle('on', h === n || (n === 'lab' && h.startsWith('lab')) || (n === 'topics' && !!AREA[h])); });
  closeMenus();
  U.wireCopy(app);
  if (after) after();
  wirePage(h);
  if (pendingAnchor) { const el = document.getElementById(pendingAnchor); pendingAnchor = null; if (el) { if (el.tagName === 'DETAILS') el.open = true; el.scrollIntoView({ block:'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); return; } }
  window.scrollTo(0, 0);
}
function wirePage(h) {
  if (h === 'path') document.querySelectorAll('[data-level]').forEach(c => c.onchange = () => { const d = U.store.get('mlai.path', {}); d[c.dataset.level] = c.checked; U.store.set('mlai.path', d); const y = scrollY; route(); scrollTo(0, y); });
  if (h === 'papers') document.querySelectorAll('.filters button').forEach(b => b.onclick = () => {
    document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.paper').forEach(p => { const pp = PAPERS.find(x => 'p-' + x.id === p.id); p.hidden = !!b.dataset.f && pp.area !== b.dataset.f; });
  });
  document.querySelectorAll('[data-paper]').forEach(a => a.onclick = () => { pendingAnchor = 'p-' + a.dataset.paper; });
}
function mountArticle() {
  const links = [...document.querySelectorAll('.toc a')];
  if (!links.length) return;
  const map = new Map(links.map(a => [a.dataset.target, a]));
  links.forEach(a => a.onclick = e => { e.preventDefault(); const el = document.getElementById(a.dataset.target); if (el) el.scrollIntoView({ block:'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
  const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); } }), { rootMargin:'-20% 0px -70% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
}
const labCache = {};
async function mountLab(id) {
  const l = LAB[id], box = document.getElementById('lab-frame'); if (!l || !box) return;
  try {
    const html = labCache[id] || (labCache[id] = await fetch(l.file).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }));
    if (location.hash !== '#lab-' + id) return;
    const theme = document.documentElement.dataset.theme;
    const fr = document.createElement('iframe');
    fr.title = l.t; fr.loading = 'eager';
    fr.srcdoc = `<!doctype html><html lang="es"${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}</style></head><body>${html}</body></html>`;
    box.innerHTML = ''; box.appendChild(fr);
    const fit = () => { try { const d = fr.contentDocument; if (d && d.body) { const hgt = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight); if (hgt > 50) fr.style.height = hgt + 'px'; } } catch (e) { fr.style.height = '85vh'; clearInterval(labTimer); } };
    fr.onload = fit; labTimer = setInterval(fit, 700);
  } catch (e) {
    console.error('No se pudo cargar el laboratorio', id, e);
    box.innerHTML = `<div class="card err"><h3>No se ha podido cargar el laboratorio aquí</h3><p>Puedes abrirlo como página independiente.</p><a class="btn primary" href="${l.url}" target="_blank" rel="noopener">Abrir «${l.t}» ↗</a></div>`;
  }
}

/* =========================================================================
   CABECERA, MENÚS Y TEMA
   ========================================================================= */
function closeMenus() { document.getElementById('mega').hidden = true; document.getElementById('topics-btn').setAttribute('aria-expanded', 'false'); document.body.classList.remove('drawer-open'); document.getElementById('menu-btn').setAttribute('aria-expanded', 'false'); }
function initShell() {
  document.getElementById('mega-inner').innerHTML = AREAS.map(a => `<a href="#${a.id}" class="mega-item"><b>${a.t}</b><small>${a.topics.length} temas · ${a.kicker}</small></a>`).join('') +
    `<a href="#transformer" class="mega-item hl"><b>Transformer Visualizer</b><small>13 etapas interactivas</small></a>`;
  document.getElementById('drawer-topics').innerHTML = AREAS.map(a => `<a href="#${a.id}">${a.t}</a>`).join('');
  const tb = document.getElementById('topics-btn');
  tb.onclick = e => { e.stopPropagation(); const m = document.getElementById('mega'); m.hidden = !m.hidden; tb.setAttribute('aria-expanded', String(!m.hidden)); };
  document.addEventListener('click', e => { if (!e.target.closest('#mega') && !e.target.closest('#topics-btn')) { document.getElementById('mega').hidden = true; tb.setAttribute('aria-expanded', 'false'); } });
  const mb = document.getElementById('menu-btn');
  mb.onclick = () => { const o = document.body.classList.toggle('drawer-open'); mb.setAttribute('aria-expanded', String(o)); };
  document.querySelectorAll('[data-open-search]').forEach(b => b.onclick = openSearch);
  const inp = document.getElementById('search-input');
  inp.oninput = () => renderResults(inp.value);
  inp.onkeydown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!lastRes.length) return; selIdx = (selIdx + (e.key === 'ArrowDown' ? 1 : -1) + lastRes.length) % lastRes.length;
      document.querySelectorAll('#search-results li').forEach((li, i) => { li.classList.toggle('on', i === selIdx); li.setAttribute('aria-selected', String(i === selIdx)); if (i === selIdx) li.scrollIntoView({ block:'nearest' }); }); }
    if (e.key === 'Enter' && lastRes[selIdx]) goResult(lastRes[selIdx]);
    if (e.key === 'Escape') closeSearch();
  };
  document.getElementById('search-results').onclick = e => { const li = e.target.closest('li[data-i]'); if (li) goResult(lastRes[+li.dataset.i]); };
  document.getElementById('search').onclick = e => { if (e.target.id === 'search') closeSearch(); };
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { closeMenus(); if (!document.getElementById('search').hidden) closeSearch(); }
  });
  // tema
  const saved = U.store.get('mlai.theme', null);
  if (saved) document.documentElement.dataset.theme = saved;
  const tbtn = document.getElementById('theme-btn');
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => { tbtn.setAttribute('aria-label', isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); tbtn.textContent = isDark() ? '☀' : '☾'; };
  tbtn.onclick = () => { const next = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = next; U.store.set('mlai.theme', next); label();
    const fr = document.querySelector('#lab-frame iframe'); try { if (fr) fr.contentDocument.documentElement.dataset.theme = next; } catch (e) { /* sin acceso */ } };
  label();
}

window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => { buildIndex(); initShell(); route(); });
