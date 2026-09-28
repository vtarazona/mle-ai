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
  paperCard: p => `<details class="card paper" id="p-${p.id}" data-area="${U.esc(p.area)}">
      <summary><span class="py">${p.y}</span><span class="pt"><b>${p.t}</b><small>${p.a} · <i>${p.v}</i></small></span><span class="tag t-research">${p.area}</span></summary>
      <dl class="kv">
        <dt>Problema</dt><dd>${p.p}</dd>
        <dt>Aportación</dt><dd>${p.c}</dd>
        <dt>Arquitectura</dt><dd>${p.arch}</dd>
        <dt>Relevancia</dt><dd>${p.r}</dd>
        <dt>Implementación</dt><dd><code>${U.esc(p.impl)}</code>${p.lab ? ` · <a href="#lab-${p.lab}">laboratorio relacionado</a>` : ''}</dd>
      </dl><p class="paper-more"><a href="#paper-${p.id}">Ficha completa →</a></p></details>`,
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
        <canvas id="hero-canvas" data-bg="/img/transformer-bg.png" width="200" height="150" role="img" aria-label="Animación en pixel art de un Transformer: un dato sube desde las palabras «el gato» por embedding, atención, add &amp; norm y feed forward hasta generar la siguiente palabra. A la izquierda, un robot conectado; a la derecha, un mapa de atención que se ilumina."></canvas>
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
        ${[...ARTICLES].reverse().slice(0, 3).map(ar => `<a class="card feature" href="#${ar.id}">
          <span class="tag t-${ar.area}">${ar.areaName} · artículo completo</span>
          <h3>${ar.title}</h3>
          <p>${ar.teaser}</p>
          <span class="more">Leer artículo →</span>
        </a>`).join('')}
      </div>
      <div>
        <div class="band-head"><h2>Algoritmos destacados</h2></div>
        <ul class="algo-list">
          ${ARTICLES.map(ar => `<li><a href="#${ar.id}"><b>${ar.title}</b><span>${ar.areaName} · artículo${ar.lab ? ' + laboratorio' : ''}</span></a></li>`).join('')}
          <li><a href="#lab-kmeans"><b>K-means</b><span>Clustering · laboratorio</span></a></li>
          <li><a href="#transformer"><b>Transformer Visualizer</b><span>LLM · 13 etapas interactivas</span></a></li>
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
        <ul class="algo-list">${recent.map(p => `<li><a href="#paper-${p.id}"><b>${p.t}</b><span>${p.a.split(',')[0]}${p.a.includes(',') || p.a.includes('et al') ? ' et al.' : ''} · ${p.y}</span></a></li>`).join('')}</ul>
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
    return C.crumbs([['Inicio', 'home'], ['Laboratorio']]) + C.pageHead('Laboratorio interactivo', 'Experimenta con los algoritmos', 'Diez laboratorios que se ejecutan en tu navegador. Nueve simulaciones en las que cambias parámetros y ves el efecto al instante (tasa de aprendizaje, profundidad, regularización, número de grupos, capas de una red o cabezas de atención) y un laboratorio de Python con retos corregidos automáticamente.') +
      `<div class="grid g3">${LABS.map(C.labCard).join('')}</div>
      <aside class="card note-card"><h3>Transformer Visualizer</h3><p>El recorrido completo de un Transformer, de texto a token generado, con tensores y código PyTorch en cada etapa.</p><a class="btn sm primary" href="#transformer">Abrir el visualizador</a></aside>`;
  },

  labDetail(id) {
    const l = LAB[id]; if (!l) return PAGES.notFound();
    return C.crumbs([['Inicio', 'home'], ['Laboratorio', 'lab'], [l.t]]) +
      `<header class="lab-head"><div><span class="tag t-${l.area}">${AREA_TAG[l.area]}</span><h1>${l.t}</h1><p>${l.d}</p></div>
       <div class="lab-actions"><a class="btn" href="${l.url}" target="_blank" rel="noopener">Abrir en pestaña nueva ↗</a></div></header>
       <div class="lab-frame" id="lab-frame" data-file="/${l.file}" data-title="${U.esc(l.t)}"><p class="loading">Cargando laboratorio… Si no se carga, <a href="/${l.file}">ábrelo aquí</a>.</p></div>
       <nav class="lab-nav">${(() => { const i = LABS.indexOf(l); const p = LABS[(i + LABS.length - 1) % LABS.length], n = LABS[(i + 1) % LABS.length];
         return `<a class="card" href="#lab-${p.id}"><small>← Anterior</small><b>${p.t}</b></a><a class="card right" href="#lab-${n.id}"><small>Siguiente →</small><b>${n.t}</b></a>`; })()}</nav>`;
  },

  transformer() {
    return C.crumbs([['Inicio', 'home'], ['LLM', 'llm'], ['Transformer Visualizer']]) + C.pageHead('LLM · Transformer Visualizer', 'Del texto al siguiente token',
      'Un Transformer decoder real y entrenado, de una capa (d<sub>model</sub> = 8, 2 cabezas, d<sub>ff</sub> = 16), que se ejecuta en tu navegador. Escribe una frase y recorre las 13 etapas: en cada una verás la forma de los tensores, la ecuación, los números y el código PyTorch equivalente.',
      `<p class="honest">Es un modelo diminuto pero entrenado de verdad: sus 832 parámetros se ajustaron con PyTorch sobre 30.000 frases sintéticas con estas 37 palabras. Por eso completa «el gato come» con «pescado» o «el sol sale por la» con «mañana», pero no sabe nada fuera de su pequeño mundo. Las operaciones, las formas y los números son los mismos que en un modelo grande.</p>`) +
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
          ${l.lesson ? `<p class="tl-lesson"><a class="btn primary" href="#${l.lesson}">Abrir la lección del nivel ${l.n} →</a></p>` : ''}
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
        ${(d.arts || []).map(id => { const ar = ARTICLES.find(x => x.id === id); return ar ? `<a class="pill p-art" href="#${id}">Artículo: ${ar.title}</a>` : ''; }).join('')}${d.proj ? `<a class="pill p-art" href="#project-${d.proj}">Usado en un proyecto</a>` : ''}</article>`).join('')}</div>`;
  },

  projects() {
    return C.crumbs([['Inicio', 'home'], ['Proyectos']]) + C.pageHead('Portfolio', 'Proyectos', 'Cada proyecto sigue el mismo recorrido: problema, datos, exploración, preprocesado, modelo, entrenamiento, evaluación, optimización, despliegue y resultados. Solo se publican resultados cuando el proyecto se ha ejecutado de verdad.') +
      `<div class="grid g3">${PROJECTS.map(p => `<article class="card proj ${p.status === 'Planificado' ? 'planned' : ''}"><span class="tag t-mlops">${p.area}</span><h3>${p.route ? `<a href="#${p.route}">${p.t}</a>` : p.t}</h3><p>${p.d}</p><span class="status">${p.status}</span></article>`).join('')}</div>`;
  },

  paper(id) {
    const p = PAPERS.find(x => x.id === id); if (!p) return PAGES.notFound();
    const related = PAPERS.filter(x => x.area === p.area && x.id !== p.id);
    return C.crumbs([['Inicio', 'home'], ['Investigación', 'research'], ['Papers', 'papers'], [String(p.y)]]) +
      `<header class="page-head"><span class="kicker">Paper · ${p.area} · ${p.y}</span><h1>${p.t}</h1><p class="lede">${p.a}</p><p class="meta"><i>${p.v}</i></p></header>
      <article class="prose paper-page">
        <h2>Problema que aborda</h2><p>${p.p}</p>
        <h2>Aportación principal</h2><p>${p.c}</p>
        <h2>Arquitectura</h2><p>${p.arch}</p>
        <h2>Relevancia histórica</h2><p>${p.r}</p>
        <h2>Implementaciones</h2><p><code>${U.esc(p.impl)}</code></p>
        ${p.lab ? `<p class="callout">Experimenta con la idea en el <a href="#lab-${p.lab}">laboratorio relacionado</a>.</p>` : ''}
        ${(p.arts || []).length ? `<p>${p.arts.map(id => { const ar = ARTICLES.find(x => x.id === id); return ar ? `<a class="pill p-art" href="#${id}">Artículo: ${ar.title}</a>` : ''; }).join(' ')}</p>` : ''}
        <h2>Referencia</h2><p class="ref">${p.a} (${p.y}). «${p.t}». <i>${p.v}</i>.</p>
        ${related.length ? `<h2>Otros papers de ${p.area}</h2><ul>${related.map(r => `<li><a href="#paper-${r.id}">${r.t}</a> (${r.y})</li>`).join('')}</ul>` : ''}
        <p><a href="#papers">← Volver a la biblioteca</a></p>
      </article>`;
  },

  article(id) { return ARTICLE_PAGE(id); },

  about() {
    return C.crumbs([['Inicio', 'home'], ['Arquitectura']]) + C.pageHead('Sobre el portal', 'Arquitectura y hoja de ruta', 'Esta versión es un prototipo navegable autocontenido. Así se corresponde con la plataforma de producción prevista.') + ARCH;
  },

  notFound() { return C.pageHead('Error 404', 'Página no encontrada', 'Esa dirección no existe. Vuelve al <a href="#home">inicio</a> o usa el buscador.'); },
};


/* Búsqueda: documentos { type, title, text, route, anchor }. Mismo esquema que usará /api/search con pgvector. */

/* Índice de búsqueda: lo genera el build y el navegador lo descarga como JSON. */
const INDEX = [];
function buildIndex() {
  AREAS.forEach(a => {
    INDEX.push({ type:'Área', title:a.t, text:a.d, route:a.id });
    a.topics.forEach(t => INDEX.push({ type:'Tema', title:t.t, text:`${t.d} ${a.t}`, route:a.id, anchor:'t-' + U.slug(t.t) }));
  });
  LABS.forEach(l => INDEX.push({ type:'Laboratorio', title:l.t, text:`${l.d} ${l.tags.join(' ')}`, route:'lab-' + l.id }));
  PAPERS.forEach(p => INDEX.push({ type:'Paper', title:p.t, text:`${p.a} ${p.y} ${p.area} ${p.c} ${p.impl}`, route:'paper-' + p.id }));
  DATASETS.forEach(d => INDEX.push({ type:'Dataset', title:d.t, text:`${d.task} ${d.vars} ${d.models}`, route:'datasets', anchor:'d-' + d.id }));
  PROJECTS.forEach(p => INDEX.push({ type:'Proyecto', title:p.t, text:`${p.d} ${p.area}`, route:p.id === 'mantenimiento' ? 'project-mantenimiento' : 'projects' }));
  PATH.forEach(l => INDEX.push({ type:'Ruta', title:`Nivel ${l.n} · ${l.t}`, text:`${l.th} ${l.ex} ${l.pr}`, route:'path' }));
  ARTICLES.forEach(ar => { INDEX.push({ type:'Artículo', title:ar.title, text:`${ar.lede} ${ar.areaName}`, route:ar.id });
    ar.sections.forEach(s => INDEX.push({ type:'Artículo', title:`${ar.title} · ${s.t}`, text:s.plain || '', route:ar.id, anchor:ar.prefix + s.id })); });
  LESSONS.forEach(le => { INDEX.push({ type:'Lección', title:le.title, text:`${le.lede} ruta de aprendizaje`, route:le.id });
    le.sections.forEach(s => INDEX.push({ type:'Lección', title:`${le.title} · ${s.t}`, text:s.plain || '', route:le.id, anchor:le.prefix + s.id })); });
  INDEX.push({ type:'Visualizador', title:'Transformer Visualizer', text:'tokenización embeddings positional encoding qkv attention softmax multi-head feed forward logits probabilidades pytorch', route:'transformer' });
  ANOM_STAGES.forEach(s => INDEX.push({ type:'Proyecto', title:`Anomalías en tráfico de red · ${s.t}`, text:s.plain || '', route:'project-anomalias', anchor:'an-' + s.id }));
  CHURN_STAGES.forEach(s => INDEX.push({ type:'Proyecto', title:`Predicción de bajas · ${s.t}`, text:s.plain || '', route:'project-churn', anchor:'ch-' + s.id }));
  PM_STAGES.forEach(s => INDEX.push({ type:'Proyecto', title:`Mantenimiento predictivo · ${s.t}`, text:s.plain || '', route:'project-mantenimiento', anchor:'pm-' + U.slug(s.t) }));
  INDEX.forEach((d, i) => { d.id = i; d._t = U.norm(d.title); d._x = U.norm(d.text); });
}
