"""Convierte los scripts de notebooks/*.py en cuadernos .ipynb (para abrirlos en Google Colab).
Cada bloque que empieza por un comentario «# --- título ---» se convierte en una celda con su título en Markdown."""
import json, re, sys, pathlib
ART = {'linear_regression': 'machine-learning/linear-regression', 'logistic_regression': 'machine-learning/logistic-regression',
       'gradient_boosting': 'machine-learning/gradient-boosting', 'neural_networks': 'deep-learning/neural-networks',
       'transformer': 'deep-learning/transformers', 'random_forest': 'machine-learning/random-forest',
       'nivel1_matematicas': 'learning-path/mathematics', 'nivel2_python': 'learning-path/python'}
PIP = {'gradient_boosting': '%pip install -q xgboost'}
def md(t): return {'cell_type': 'markdown', 'metadata': {}, 'source': t}
def code(t): return {'cell_type': 'code', 'metadata': {}, 'execution_count': None, 'outputs': [], 'source': t.strip('\n')}
for py in sorted(p for p in pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'notebooks').glob('*.py') if not p.stem.startswith('tv_')):
    src = py.read_text()
    doc = re.match(r'\s*"""(.*?)"""', src, re.S); title = doc.group(1).strip() if doc else py.stem
    body = src[doc.end():] if doc else src
    cells = [md(f'# {title}\n\nCódigo del artículo [MLE·AI](https://mle-ai.vercel.app/{ART.get(py.stem, "")}). Ejecuta las celdas en orden; todas las cifras del artículo salen de aquí.')]
    if py.stem in PIP: cells.append(code(PIP[py.stem]))
    for part in re.split(r'\n(?=# --- )', body):
        m = re.match(r'# --- (.*?) ---\n', part)
        if m: cells.append(md(f'## {m.group(1)}')); part = part[m.end():]
        if part.strip(): cells.append(code(part))
    nb = {'nbformat': 4, 'nbformat_minor': 5, 'metadata': {'kernelspec': {'name': 'python3', 'display_name': 'Python 3'}, 'language_info': {'name': 'python'}}, 'cells': cells}
    for c in nb['cells']:
        c['source'] = [l for l in c['source'].splitlines(keepends=True)]
    py.with_suffix('.ipynb').write_text(json.dumps(nb, ensure_ascii=False, indent=1))
    print(py.with_suffix('.ipynb').name, len(cells), 'celdas')
