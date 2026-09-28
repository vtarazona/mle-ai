# MLE·AI — Machine Learning Engineering & Artificial Intelligence

Portal educativo de Machine Learning e IA: https://mle-ai.vercel.app

- **6 artículos completos** (Random Forest, regresión lineal, regresión logística, gradient boosting, redes neuronales, Transformers) con la plantilla de 20 secciones y cifras obtenidas ejecutando el código.
- **9 laboratorios interactivos** y un **Transformer Visualizer** de 13 etapas.
- Temario de 7 áreas, ruta de aprendizaje en 10 niveles, 17 papers con ficha propia, datasets y buscador.

## Estructura

```
build.mjs            Generador del sitio estático (Node): una página HTML real por URL
src/
  utils.js           Utilidades compartidas (escape, KaTeX, resaltado de código)
  data.js            Contenido estructurado: áreas, temas, laboratorios, papers, datasets, ruta
  pages.js           Plantillas de página (portada, áreas, laboratorios, papers…)
  content.js         Artículo de Random Forest, proyecto y página de arquitectura
  articles/          Un archivo por artículo + 00-charts.js (gráficos SVG)
  client.js          JavaScript del navegador: menús, tema, buscador, montaje de componentes
  tv.js              Transformer Visualizer (un Transformer real de 1 capa en JS)
  tv-weights.js      Sus pesos entrenados (los genera notebooks/tv_train.py)
  pixelhero.js       Animación pixel art de la portada
  layout.html        Cabecera, menús, buscador y pie comunes
  style.css          Estilos (modo claro y oscuro)
  labs/              Los 9 laboratorios, páginas independientes
  img/               Ilustraciones y og-image
notebooks/           Scripts (.py) y cuadernos (.ipynb) de cada artículo; se abren en Google Colab
scripts/             serve.py (servidor local con URLs limpias) y py2nb.py (.py → .ipynb)
dist/                Sitio generado: es lo que publica Vercel
vercel.json          outputDirectory, cleanUrls y cabeceras de seguridad y caché
```

## Desarrollo

```bash
npm install                    # instala KaTeX (las fórmulas se renderizan a MathML en el build)
npm run prerender              # genera dist/
python3 scripts/serve.py dist 8000   # http://localhost:8000
```

Tras cambiar un notebook: `python3 scripts/py2nb.py notebooks` regenera los `.ipynb`.

Para reentrenar el Transformer Visualizer: `python3 notebooks/tv_train.py` (PyTorch, ~1 min en CPU) reescribe `src/tv-weights.js`.

## SEO

Cada página tiene URL semántica (`/machine-learning/random-forest`, `/papers/attention-is-all-you-need`),
`title`, `meta description`, `canonical`, Open Graph y JSON-LD (TechArticle, ScholarlyArticle, BreadcrumbList).
El build genera `sitemap.xml` y `robots.txt`. Los enlaces antiguos con `#` redirigen a su URL nueva.

## Despliegue

Vercel publica `dist/` en cada `git push` a `main` (no hay build en Vercel: `dist/` se genera en local y se sube).

## Hoja de ruta

1. ~~Prototipo navegable~~ → ~~páginas estáticas indexables~~ (esta versión).
2. Más artículos con la misma plantilla y nuevos laboratorios (regresión lineal interactiva, embeddings).
3. Backend FastAPI + PostgreSQL con pgvector.
4. Asistente «Pregúntale al portal» (RAG) con la API de Claude.
