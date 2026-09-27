# MLE·AI — Machine Learning Engineering & Artificial Intelligence

Portal educativo de Machine Learning e IA: temario de 7 áreas, 9 laboratorios interactivos,
Transformer Visualizer, artículo completo de Random Forest, ruta de aprendizaje en 10 niveles,
biblioteca de papers, datasets y buscador.

## Estructura

```
index.html      Portal completo (HTML + CSS + JS, sin dependencias de build)
labs/           Los 9 laboratorios, cada uno como página independiente
src/            Fuentes del portal: data.js (contenido), app.js (router, búsqueda, páginas),
                tv.js (Transformer Visualizer), content.js (artículos), shell.html (maqueta y estilos)
vercel.json     Cabeceras de seguridad (CSP, nosniff, frame-ancestors…)
robots.txt
```

## Ejecutar en local

No necesita instalación. Desde la carpeta del proyecto:

```bash
python -m http.server 8000
# abre http://localhost:8000
```

## Despliegue

Conectado a Vercel: cada `git push` a `main` publica una nueva versión automáticamente.
No hay comando de build; Vercel sirve los archivos estáticos tal cual.

## Hoja de ruta

1. Prototipo navegable autocontenido (esta versión).
2. Migración a Next.js + TypeScript con el contenido en MDX y URLs semánticas
   (`/machine-learning/random-forest`).
3. Backend FastAPI + PostgreSQL + Docker Compose.
4. Búsqueda semántica con pgvector y asistente RAG sobre el contenido.

Las cifras del artículo de Random Forest se obtuvieron ejecutando el código con scikit-learn 1.8.0.
