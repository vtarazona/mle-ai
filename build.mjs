/**
 * Generador del sitio estático de MLE·AI.
 *
 *   npm install && npm run prerender   →  dist/
 *
 * Ejecuta las mismas plantillas que usa el portal (src/pages.js, src/content.js,
 * src/articles/*.js) en Node, renderiza las fórmulas con KaTeX a MathML y escribe
 * una página HTML real por cada URL, con su title, description, canonical,
 * Open Graph y JSON-LD. El navegador solo carga /assets/app.js para la parte
 * interactiva.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const katex = require('katex');
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://mle-ai.vercel.app';
// Código de verificación de Google Search Console (etiqueta HTML). Vacío = sin etiqueta.
const GOOGLE_SITE_VERIFICATION = 'lJoSxDvlrlGykHqKigsgqx-qXLGJBBRWoETnGGeEP_M';
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

/* ---------- 1. Cargar el contenido en un contexto aislado ---------- */
const articleFiles = fs.existsSync(path.join(SRC, 'articles'))
  ? fs.readdirSync(path.join(SRC, 'articles')).filter(f => f.endsWith('.js')).sort().map(f => 'articles/' + f) : [];
const lessonFiles = fs.existsSync(path.join(SRC, 'lessons'))
  ? fs.readdirSync(path.join(SRC, 'lessons')).filter(f => f.endsWith('.js')).sort().map(f => 'lessons/' + f) : [];
const projectFiles = fs.existsSync(path.join(SRC, 'projects'))
  ? fs.readdirSync(path.join(SRC, 'projects')).filter(f => f.endsWith('.js')).sort().map(f => 'projects/' + f) : [];
const code = ['utils.js', 'data.js', 'pages.js', 'content.js', ...articleFiles, ...lessonFiles, ...projectFiles].map(read).join('\n;\n') +
  '\n;globalThis.__X = { U, C, PAGES, LABS, LAB, AREAS, AREA, PAPERS, DATASETS, PROJECTS, PATH, ARTICLES, LESSONS, PM_STAGES, INDEX, buildIndex };';
const ctx = vm.createContext({
  console, katex, window: { katex },
  document: { addEventListener() {} }, matchMedia: () => ({ matches: false }),
});
vm.runInContext(code, ctx, { filename: 'contenido.js' });
const X = ctx.__X;
const { U, PAGES, LABS, AREAS, PAPERS, ARTICLES, LESSONS } = X;

/* ---------- 2. Mapa de rutas (token interno → URL semántica) ---------- */
const AREA_SLUG = { ml:'machine-learning', dl:'deep-learning', math:'mathematics', prog:'programming', llm:'llm', mlops:'mlops', research:'research' };
const LAB_SLUG = { gd:'gradient-descent', overfit:'overfitting', reg:'lasso-ridge', tree:'decision-tree', kmeans:'k-means', sigmoid:'sigmoid', boundary:'decision-boundary', backprop:'backpropagation', attn:'attention', python:'python' };
const paperSlug = p => U.slug(p.t).slice(0, 80).replace(/-$/, '');
const ROUTES = {
  home:'/', lab:'/lab', transformer:'/llm/transformer-visualizer', path:'/learning-path', papers:'/papers',
  datasets:'/datasets', projects:'/projects', 'project-mantenimiento':'/projects/predictive-maintenance', 'project-churn':'/projects/customer-churn', 'project-anomalias':'/projects/network-anomaly-detection', about:'/about',
};
for (const [k, v] of Object.entries(AREA_SLUG)) ROUTES[k] = '/' + v;
for (const l of LABS) { ROUTES['lab-' + l.id] = '/lab/' + LAB_SLUG[l.id]; l.url = '/' + l.file; }
for (const a of ARTICLES) ROUTES[a.id] = `/${AREA_SLUG[a.area]}/${a.id}`;
for (const le of LESSONS) ROUTES[le.id] = '/learning-path/' + le.slug;
for (const p of PAPERS) ROUTES['paper-' + p.id] = '/papers/' + paperSlug(p);

const link = html => html.replace(/href="#([A-Za-z0-9_-]+)"/g, (m, t) => ROUTES[t] ? `href="${ROUTES[t]}"` : m);

/* ---------- 3. Lista de páginas ---------- */
const crumbLD = items => ({ '@context':'https://schema.org', '@type':'BreadcrumbList',
  itemListElement: items.map(([name, r], i) => ({ '@type':'ListItem', position: i + 1, name, item: SITE + (ROUTES[r] === '/' ? '' : ROUTES[r]) })) });
const org = { '@type':'Organization', name:'MLE·AI', url: SITE };
const trim = (s, n = 158) => { s = String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; };

const pages = [];
const add = (route, o) => pages.push({ route, url: ROUTES[route], ...o });

add('home', { page:'home', html: PAGES.home(), title:'MLE·AI — Machine Learning Engineering & Artificial Intelligence',
  desc:'Portal de Machine Learning e IA: teoría rigurosa, laboratorios interactivos, Transformer Visualizer, artículos con código real, ruta de aprendizaje, papers y datasets.',
  ld:[{ '@context':'https://schema.org', '@type':'WebSite', name:'MLE·AI', url: SITE + '/', inLanguage:'es', description:'Portal de Machine Learning Engineering e Inteligencia Artificial' }] });
for (const a of AREAS) add(a.id, { page:'area', html: PAGES.area(a.id), title: a.t, desc: `${a.d} ${a.topics.length} temas con definiciones, laboratorios y artículos.`, ld:[crumbLD([['Inicio', 'home'], [a.t, a.id]])] });
add('lab', { page:'labs', html: PAGES.lab(), title:'Laboratorio interactivo', desc:'Diez laboratorios interactivos: descenso de gradiente, sobreajuste, Lasso y Ridge, árboles, K-means, sigmoide, redes neuronales, backpropagation, atención y retos de Python que se ejecutan en el navegador.', ld:[crumbLD([['Inicio', 'home'], ['Laboratorio', 'lab']])] });
for (const l of LABS) add('lab-' + l.id, { page:'lab', html: PAGES.labDetail(l.id), title: `${l.t} · Laboratorio`, desc: l.d, ld:[crumbLD([['Inicio', 'home'], ['Laboratorio', 'lab'], [l.t, 'lab-' + l.id]])] });
add('transformer', { page:'transformer', html: PAGES.transformer(), title:'Transformer Visualizer', katex: true,
  desc:'Recorre un Transformer real etapa a etapa: tokenización, embeddings, codificación posicional, Q/K/V, atención, softmax, multi-head, feed forward, logits y el token generado, con código PyTorch.',
  ld:[crumbLD([['Inicio', 'home'], ['LLM', 'llm'], ['Transformer Visualizer', 'transformer']])] });
for (const a of ARTICLES) add(a.id, { page:'article', html: PAGES.article(a.id), title: a.title, desc: trim(a.lede),
  ld:[{ '@context':'https://schema.org', '@type':'TechArticle', headline: a.title, description: trim(a.lede), inLanguage:'es', url: SITE + ROUTES[a.id], author: org, publisher: org, about: a.areaName },
      crumbLD([['Inicio', 'home'], [a.areaName, a.area], [a.title, a.id]])] });
add('path', { page:'path', html: PAGES.path(), title:'Ruta de aprendizaje', desc:'Ruta de aprendizaje de IA en 10 niveles, de las matemáticas a la investigación, con teoría, ejercicios, proyectos y criterios de superación.', ld:[crumbLD([['Inicio', 'home'], ['Ruta de aprendizaje', 'path']])] });
for (const le of LESSONS) add(le.id, { page:'article', html: vm.runInContext(`LESSON_PAGE(${JSON.stringify(le.id)})`, ctx), title: le.title, desc: trim(le.lede),
  ld:[{ '@context':'https://schema.org', '@type':'LearningResource', name: le.title, headline: le.title, description: trim(le.lede), inLanguage:'es', url: SITE + ROUTES[le.id],
        learningResourceType:'Lección', educationalLevel:'Principiante', timeRequired: le.time, teaches: le.teaches, author: org, publisher: org },
      crumbLD([['Inicio', 'home'], ['Ruta de aprendizaje', 'path'], [le.title, le.id]])] });
add('papers', { page:'papers', html: PAGES.papers(), title:'Papers fundamentales', desc:`Biblioteca de ${PAPERS.length} papers fundamentales de la IA: backpropagation, LSTM, AlexNet, ResNet, Attention Is All You Need, BERT, GPT-3, LoRA y RAG.`, ld:[crumbLD([['Inicio', 'home'], ['Investigación', 'research'], ['Papers', 'papers']])] });
for (const p of PAPERS) add('paper-' + p.id, { page:'paper', html: PAGES.paper(p.id), title: `${p.t} (${p.y})`, desc: trim(`${p.c} ${p.a}, ${p.y}.`),
  ld:[{ '@context':'https://schema.org', '@type':'ScholarlyArticle', name: p.t, headline: p.t, datePublished: String(p.y), author: p.a.replace(/ et al\.?/, '').split(',').map(n => ({ '@type':'Person', name: n.trim() })), isPartOf: p.v, inLanguage:'en' },
      crumbLD([['Inicio', 'home'], ['Papers', 'papers'], [p.t, 'paper-' + p.id]])] });
add('datasets', { page:'datasets', html: PAGES.datasets(), title:'Datasets de referencia', desc:'Datasets públicos para practicar machine learning: Iris, Breast Cancer, California Housing, AI4I 2020, MNIST, CIFAR-10, Wine Quality e IMDB.', ld:[crumbLD([['Inicio', 'home'], ['Datasets', 'datasets']])] });
add('projects', { page:'projects', html: PAGES.projects(), title:'Proyectos', desc:'Proyectos de machine learning de principio a fin: problema, datos, modelo, evaluación y despliegue.', ld:[crumbLD([['Inicio', 'home'], ['Proyectos', 'projects']])] });
add('project-mantenimiento', { page:'article', html: vm.runInContext('PM_PAGE()', ctx), title:'Mantenimiento predictivo en fresadoras', desc:'Proyecto de mantenimiento predictivo con el dataset AI4I 2020: exploración, preprocesado sin fugas de datos, Random Forest, umbral por coste y API con FastAPI.', ld:[crumbLD([['Inicio', 'home'], ['Proyectos', 'projects'], ['Mantenimiento predictivo', 'project-mantenimiento']])] });
add('project-churn', { page:'article', html: vm.runInContext('CHURN_PAGE()', ctx), title:'Predicción de bajas de clientes (churn)', desc:'Proyecto completo de churn en telecomunicaciones con IBM Telco: exploración, Pipeline de scikit-learn, regresión logística frente a XGBoost, umbral por coste-beneficio, calculadora de riesgo y API FastAPI.',
  ld:[{ '@context':'https://schema.org', '@type':'TechArticle', headline:'Predicción de bajas de clientes (churn)', inLanguage:'es', url: SITE + '/projects/customer-churn', author: org, publisher: org, about:'Machine Learning' },
      crumbLD([['Inicio', 'home'], ['Proyectos', 'projects'], ['Predicción de bajas', 'project-churn']])] });
add('project-anomalias', { page:'article', html: vm.runInContext('ANOM_PAGE()', ctx), title:'Detección de anomalías en tráfico de red', desc:'Proyecto completo con NSL-KDD: Isolation Forest y autoencoder entrenados solo con tráfico normal, evaluación con presupuesto de falsas alarmas, ataques nuevos frente a supervisado y explicación de alertas.',
  ld:[{ '@context':'https://schema.org', '@type':'TechArticle', headline:'Detección de anomalías en tráfico de red', inLanguage:'es', url: SITE + '/projects/network-anomaly-detection', author: org, publisher: org, about:'Machine Learning' },
      crumbLD([['Inicio', 'home'], ['Proyectos', 'projects'], ['Anomalías en tráfico de red', 'project-anomalias']])] });
add('about', { page:'about', html: PAGES.about(), title:'Arquitectura y hoja de ruta', desc:'Cómo está construido MLE·AI y hacia dónde evoluciona: Next.js, FastAPI, PostgreSQL con pgvector y búsqueda semántica.', ld:[crumbLD([['Inicio', 'home'], ['Arquitectura', 'about']])] });
pages.push({ route:'404', url:'/404', page:'404', html: PAGES.notFound(), title:'Página no encontrada', desc:'Esta dirección no existe en MLE·AI.', ld:[], noindex:true });

/* ---------- 4. Recursos compartidos ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const css = read('style.css');
const appJs = ['utils.js', 'tv-weights.js', 'tv.js', 'pixelhero.js', 'client.js'].map(read).join('\n;\n');
fs.writeFileSync(path.join(OUT, 'assets/style.css'), css);
fs.writeFileSync(path.join(OUT, 'assets/app.js'), appJs);
const V = { css: hash(css), js: hash(appJs) };
fs.cpSync(path.join(SRC, 'labs'), path.join(OUT, 'labs'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'img'));
for (const f of ['transformer-bg.png', 'transformer-pixelart.png', 'og-image.png']) fs.copyFileSync(path.join(SRC, 'img', f), path.join(OUT, 'img', f));

// índice de búsqueda con URLs finales
X.buildIndex();
const index = X.INDEX.map(d => ({ type: d.type, title: d.title, text: trim(d.text, 300), url: (ROUTES[d.route] || '/') + (d.anchor ? '#' + d.anchor : '') }));
fs.writeFileSync(path.join(OUT, 'assets/search-index.json'), JSON.stringify(index));

/* ---------- 5. Plantilla ---------- */
const layout = read('layout.html')
  .replace('{{MEGA}}', AREAS.map(a => `<a href="#${a.id}" class="mega-item"><b>${a.t}</b><small>${a.topics.length} temas · ${a.kicker}</small></a>`).join('') +
    `<a href="#transformer" class="mega-item hl"><b>Transformer Visualizer</b><small>13 etapas interactivas</small></a>`)
  .replace('{{DRAWER}}', AREAS.map(a => `<a href="#${a.id}">${a.t}</a>`).join(''));
const NAV = { area:'topics', article:'topics', labs:'lab', lab:'lab', transformer:'transformer', path:'path', papers:'papers', paper:'papers', datasets:'datasets', projects:'projects' };
const OLD = Object.fromEntries(Object.entries(ROUTES).filter(([k]) => k !== 'home'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function render(pg) {
  const canonical = SITE + (pg.url === '/' ? '/' : pg.url);
  const title = pg.route === 'home' ? pg.title : `${pg.title} · MLE·AI`;
  let body = layout.replace('{{MAIN}}', pg.html);
  const navKey = pg.route.startsWith('lesson-') ? 'path' : NAV[pg.page] || (pg.route.startsWith('project-') ? 'projects' : '');
  if (navKey) body = body.replace(`data-nav="${navKey}"`, `data-nav="${navKey}" class="on"`);
  body = link(body);
  const head = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(pg.desc)}">
${pg.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${canonical}">`}
<meta name="theme-color" content="#0E1621">
${pg.route === 'home' && GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}">\n` : ''}
<meta property="og:type" content="${pg.page === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="MLE·AI">
<meta property="og:title" content="${esc(pg.title)}">
<meta property="og:description" content="${esc(pg.desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="es_ES">
<meta property="og:image" content="${SITE}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/img/og-image.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230E1621'/%3E%3Ctext x='16' y='21' font-family='monospace' font-size='11' font-weight='700' fill='%236E9BFF' text-anchor='middle'%3EML%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/assets/style.css?v=${V.css}">
${pg.page === 'home' ? '<link rel="preload" as="image" href="/img/transformer-bg.png">\n' : ''}<script>try{var t=JSON.parse(localStorage.getItem('mlai.theme'));if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
${pg.ld.map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body data-page="${pg.page}">
`;
  const tail = `
${pg.route === 'home' ? `<script>window.__OLD_ROUTES=${JSON.stringify(OLD)}</script>\n` : ''}${pg.katex ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js" defer></script>\n' : ''}<script src="/assets/app.js?v=${V.js}" defer></script>
<script defer src="/_vercel/insights/script.js"></script>
<script defer src="/_vercel/speed-insights/script.js"></script>
</body>
</html>
`;
  return head + body + tail;
}

/* ---------- 6. Escribir ---------- */
const broken = new Set();
for (const pg of pages) {
  const html = render(pg);
  for (const m of html.matchAll(/href="#([A-Za-z0-9_-]+)"/g)) if (!html.includes(`id="${m[1]}"`)) broken.add(`${pg.url} → #${m[1]}`);
  // Si otras páginas cuelgan de esta URL (/machine-learning/…), se escribe como carpeta/index.html
  const isDir = pages.some(o => o !== pg && o.url.startsWith(pg.url + '/'));
  const file = pg.url === '/' ? 'index.html' : pg.url.slice(1) + (isDir ? '/index.html' : '.html');
  fs.mkdirSync(path.dirname(path.join(OUT, file)), { recursive: true });
  fs.writeFileSync(path.join(OUT, file), html);
}

fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter(p => !p.noindex).map(p => `  <url><loc>${SITE}${p.url === '/' ? '/' : p.url}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`${pages.length} páginas · ${index.length} entradas de búsqueda · app.js ${(appJs.length / 1024).toFixed(0)} KB · style.css ${(css.length / 1024).toFixed(0)} KB`);
if (broken.size) { console.log('Anclas internas sin destino:'); broken.forEach(b => console.log('  ' + b)); }
