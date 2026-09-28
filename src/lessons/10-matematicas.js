/* =========================================================================
   LECCIONES DE LA RUTA DE APRENDIZAJE
   Nivel 1 · Matemáticas. Enfoque: asimilar los conceptos básicos, con la
   intuición primero y ejemplos pequeños que se pueden hacer a mano.
   Todos los números se comprueban con notebooks/nivel1_matematicas.py.
   ========================================================================= */
const LESSONS = [];
(() => {
/* ---------- componentes propios de las lecciones ---------- */
const idea = t => `<p class="idea"><span class="eyebrow">La idea en una frase</span>${t}</p>`;
const enIA = t => `<p class="callout ia"><b>¿Dónde aparece en IA?</b> ${t}</p>`;
const ojo  = t => `<p class="callout warn"><b>Error típico:</b> ${t}</p>`;
const ex = (n, enunciado, solucion, pista) => `<details class="card exercise"><summary><span class="exn">Ejercicio ${n}</span>${enunciado}</summary>${pista ? `<p class="hintline"><b>Pista:</b> ${pista}</p>` : ''}<div class="sol"><span class="eyebrow">Solución</span>${solucion}</div></details>`;
const quiz = (id, qs) => `<div class="quiz" data-quiz="${id}"><ol>${qs.map((q, i) => `<li class="q" data-answer="${q.ok}">
    <p class="qt">${q.q}</p>
    <div class="opts" role="radiogroup">${q.o.map((o, j) => `<label><input type="radio" name="${id}-${i}" value="${j}"> <span>${o}</span></label>`).join('')}</div>
    <p class="fb" hidden>${q.why}</p></li>`).join('')}</ol>
  <div class="quiz-bar"><button type="button" class="btn primary" data-check>Comprobar respuestas</button><button type="button" class="btn" data-reset>Volver a empezar</button><p class="score" aria-live="polite"></p></div></div>`;
const checklist = (id, items) => `<ul class="checklist" data-checklist="${id}">${items.map((t, i) => `<li><label><input type="checkbox" data-item="${i}"> <span>${t}</span></label></li>`).join('')}</ul>
  <div class="level-done"><button type="button" class="btn primary" data-complete-level="${id.replace('nivel-', '')}">Marcar el nivel como completado</button><span class="note" data-level-status></span></div>`;

/* ---------- gráficos ---------- */
const arrowDefs = (cls, sz = 7) => cls.map(c => `<marker id="ah-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="${sz}" markerHeight="${sz}" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="${c}-f"/></marker>`).join('');

function vectorFig() {
  // u = (3, 1), v = (1, 2) y su suma
  const S = 46, ox = 60, oy = 230, P = (x, y) => [ox + x * S, oy - y * S];
  const arrow = (x, y, cls, label, lx = 6, ly = -6) => { const [a, b] = P(x, y); return `<line x1="${ox}" y1="${oy}" x2="${a}" y2="${b}" class="${cls}" marker-end="url(#ah-${cls})"/><text x="${a + lx}" y="${b + ly}" class="vl ${cls}-t">${label}</text>`; };
  let g = '';
  for (let i = 0; i <= 5; i++) { const [x] = P(i, 0); g += `<line x1="${x}" y1="${oy - 4.5 * S}" x2="${x}" y2="${oy}" class="gl"/><text x="${x}" y="${oy + 16}" text-anchor="middle" class="ax">${i}</text>`; }
  for (let j = 0; j <= 4; j++) { const [, y] = P(0, j); g += `<line x1="${ox}" y1="${y}" x2="${ox + 5 * S}" y2="${y}" class="gl"/><text x="${ox - 8}" y="${y + 4}" text-anchor="end" class="ax">${j}</text>`; }
  const [ux, uy] = P(3, 1), [sx, sy] = P(4, 3);
  g += `<line x1="${ux}" y1="${uy}" x2="${sx}" y2="${sy}" class="dash"/>`;
  g += arrow(3, 1, 'va', 'u = (3, 1)', 6, 16) + arrow(1, 2, 'vb', 'v = (1, 2)', -70, -6) + arrow(4, 3, 'vs', 'u + v = (4, 3)', 6, -4);
  return `<figure class="chart vecfig"><svg viewBox="0 0 330 260" role="img" aria-label="Vectores u, v y su suma en el plano"><defs>${arrowDefs(['va', 'vb', 'vs'])}</defs>${g}</svg>
    <figcaption>Un vector de dos números es una flecha. Sumar vectores es poner una flecha a continuación de la otra: (3, 1) + (1, 2) = (4, 3).</figcaption></figure>`;
}

// Mini-gráfico genérico de una curva y = f(x) con extras dibujados encima
function plot({ f, x0, x1, y0, y1, xt, yt, extra, label, cap }) {
  const W = 420, H = 260, pl = 34, pr = 12, pt = 12, pb = 26;
  const X = x => pl + (x - x0) / (x1 - x0) * (W - pl - pr), Y = y => pt + (y1 - y) / (y1 - y0) * (H - pt - pb);
  let g = '';
  for (const x of xt) g += `<line x1="${X(x)}" x2="${X(x)}" y1="${pt}" y2="${H - pb}" class="gl"/><text x="${X(x)}" y="${H - 8}" text-anchor="middle" class="ax">${x}</text>`;
  for (const y of yt) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(y)}" y2="${Y(y)}" class="gl"/><text x="${pl - 6}" y="${Y(y) + 4}" text-anchor="end" class="ax">${y}</text>`;
  const pts = []; for (let i = 0; i <= 120; i++) { const x = x0 + (x1 - x0) * i / 120, y = f(x); if (y >= y0 - 1 && y <= y1 + 1) pts.push(`${X(x).toFixed(1)},${Y(y).toFixed(1)}`); }
  g += `<polyline points="${pts.join(' ')}" class="curve"/>` + extra(X, Y);
  return `<figure class="chart mini"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}"><defs>${arrowDefs(['stp'], 4)}</defs>${g}</svg><figcaption>${cap}</figcaption></figure>`;
}
const tangentFig = () => plot({
  f: x => x * x, x0: 0, x1: 5, y0: 0, y1: 20, xt: [0, 1, 2, 3, 4, 5], yt: [0, 5, 10, 15, 20],
  label: 'Parábola y = x² con su recta tangente en x = 3',
  extra: (X, Y) => `<line x1="${X(1.6)}" y1="${Y(9 + 6 * (1.6 - 3))}" x2="${X(4.6)}" y2="${Y(9 + 6 * (4.6 - 3))}" class="tan"/>
    <line x1="${X(3)}" y1="${Y(9)}" x2="${X(4)}" y2="${Y(9)}" class="dash"/><line x1="${X(4)}" y1="${Y(9)}" x2="${X(4)}" y2="${Y(15)}" class="dash"/>
    <text x="${X(3.5)}" y="${Y(9) + 15}" text-anchor="middle" class="lbl">+1</text><text x="${X(4) + 6}" y="${Y(12)}" class="lbl">+6</text>
    <circle cx="${X(3)}" cy="${Y(9)}" r="4.5" class="minpt"/><text x="${X(3) - 8}" y="${Y(9) - 10}" text-anchor="end" class="lbl">(3, 9)</text>`,
  cap: 'La curva es y = x². La recta roja toca la curva en x = 3 y tiene pendiente 6: si avanzas 1 hacia la derecha, sube 6. Eso es la derivada en ese punto.' });
const stepsFig = () => {
  const W = [0, 0.6, 1.08, 1.464, 1.7712, 2.017], L = w => (w - 3) ** 2;
  return plot({
    f: L, x0: -0.5, x1: 6.5, y0: 0, y1: 12, xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 3, 6, 9, 12],
    label: 'Descenso de gradiente sobre la pérdida (w − 3)²',
    extra: (X, Y) => W.slice(0, -1).map((w, i) => `<line x1="${X(w)}" y1="${Y(L(w))}" x2="${X(W[i + 1])}" y2="${Y(L(W[i + 1]))}" class="stp" marker-end="url(#ah-stp)"/>`).join('')
      + W.map((w, i) => `<circle cx="${X(w)}" cy="${Y(L(w))}" r="4" class="stp-p"/>${i < 3 ? `<text x="${X(w) + 8}" y="${Y(L(w)) - 6}" class="lbl">paso ${i}</text>` : ''}`).join('')
      + `<circle cx="${X(3)}" cy="${Y(0)}" r="4.5" class="minpt"/><text x="${X(3) + 10}" y="${Y(0) - 8}" class="lbl">mínimo (w = 3)</text>`,
    cap: 'Empezamos en w = 0 con η = 0,1. Cada paso baja por la curva y es más corto que el anterior, porque cerca del fondo la pendiente es menor.' });
};
const TRAJ = {
  '0.1': [[0, 0], [0.6, -0.4], [1.08, -0.64], [1.464, -0.784], [1.771, -0.87], [2.017, -0.922], [2.214, -0.953], [2.371, -0.972], [2.497, -0.983], [2.597, -0.99], [2.678, -0.994], [2.742, -0.996], [2.794, -0.998], [2.835, -0.999], [2.868, -0.999], [2.894, -1], [2.916, -1], [2.932, -1], [2.946, -1], [2.957, -1], [2.965, -1], [2.972, -1], [2.978, -1], [2.982, -1], [2.986, -1], [2.989, -1], [2.991, -1], [2.993, -1], [2.994, -1], [2.995, -1], [3, -1]],
  '0.4': [[0, 0], [2.4, -1.6], [2.88, -0.64], [2.976, -1.216], [2.995, -0.87], [2.999, -1.078], [3, -0.953], [3, -1.028], [3, -0.983], [3, -1.01], [3, -0.994], [3, -1.004], [3, -0.998], [3, -1.001], [3, -1]],
  '0.55': [[0, 0], [3.3, -2.2], [2.97, 0.44], [3.003, -2.728], [3, 1.074], [3, -3.488]],
};
function gdFig() {
  const W = 560, H = 330, x0 = -0.6, x1 = 4.4, y0 = -4.2, y1 = 1.6, pl = 36, pr = 12, pt = 12, pb = 28;
  const X = x => pl + (x - x0) / (x1 - x0) * (W - pl - pr), Y = y => pt + (y1 - y) / (y1 - y0) * (H - pt - pb);
  let g = `<defs><clipPath id="gdclip"><rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}"/></clipPath></defs>`;
  for (let x = 0; x <= 4; x++) g += `<line x1="${X(x)}" x2="${X(x)}" y1="${pt}" y2="${H - pb}" class="gl"/><text x="${X(x)}" y="${H - 10}" text-anchor="middle" class="ax">${x}</text>`;
  for (let y = -4; y <= 1; y++) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(y)}" y2="${Y(y)}" class="gl"/><text x="${pl - 6}" y="${Y(y) + 4}" text-anchor="end" class="ax">${y}</text>`;
  g += '<g clip-path="url(#gdclip)">';
  for (const c of [0.5, 2, 4.5, 8, 12.5, 18]) g += `<ellipse cx="${X(3)}" cy="${Y(-1)}" rx="${Math.sqrt(c) / (x1 - x0) * (W - pl - pr)}" ry="${Math.sqrt(c / 2) / (y1 - y0) * (H - pt - pb)}" class="lvl"/>`;
  const path = (pts, cls) => `<polyline points="${pts.map(([a, b]) => `${X(a)},${Y(b)}`).join(' ')}" class="${cls}"/>` + pts.map(([a, b]) => `<circle cx="${X(a)}" cy="${Y(b)}" r="2.8" class="${cls}-p"/>`).join('');
  g += path(TRAJ['0.55'], 't3') + path(TRAJ['0.1'], 't1') + path(TRAJ['0.4'], 't2') + '</g>';
  g += `<circle cx="${X(3)}" cy="${Y(-1)}" r="4" class="minpt"/><text x="${X(3) + 8}" y="${Y(-1) - 8}" class="lbl">mínimo (3, −1)</text><text x="${X(0) + 6}" y="${Y(0) - 7}" class="lbl">inicio (0, 0)</text>`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trayectorias del descenso de gradiente con tres tasas de aprendizaje">${g}</svg>
    <div class="legend"><span><i class="k1"></i>η = 0,1 · 39 pasos</span><span><i class="k2"></i>η = 0,4 · 17 pasos</span><span><i class="k3"></i>η = 0,55 · se escapa</span></div>
    <figcaption>Vista desde arriba de un «valle» con dos parámetros: cada elipse une puntos con la misma pérdida, como las curvas de nivel de un mapa. Con η = 0,1 baja despacio pero seguro; con η = 0,4 llega antes dando zigzags; con η = 0,55 cada paso se pasa de largo más que el anterior.</figcaption></figure>`;
}

/* ---------- código ---------- */
const C_VEC = `import numpy as np

u = np.array([3, 1])
v = np.array([1, 2])

u + v          # array([4, 3])
2 * u          # array([6, 2])
u @ v          # 5  → producto escalar: 3·1 + 1·2

ana, luis, marta = np.array([5, 1]), np.array([4, 2]), np.array([1, 5])
ana @ luis     # 22 → gustos parecidos
ana @ marta    # 10 → gustos distintos`;
const C_MAT = `precios = np.array([[0.5, 1.0],    # tienda A: manzana, pan
                    [0.4, 1.2]])   # tienda B: manzana, pan
cesta = np.array([2, 3])           # 2 manzanas, 3 panes
precios @ cesta                    # array([4. , 4.4])  → la tienda A sale más barata`;
const C_DER = `f = lambda x: x**2
for h in (0.1, 0.01, 0.001):
    print(h, (f(3 + h) - f(3)) / h)   # 6.1 · 6.01 · 6.001 → se acerca a 6`;
const C_GD = `L  = lambda w: (w - 3)**2      # pérdida: mínima en w = 3
dL = lambda w: 2 * (w - 3)      # su derivada (la pendiente)

w, eta = 0.0, 0.1
for paso in range(6):
    print(paso, round(w, 4), round(L(w), 4))
    w = w - eta * dL(w)          # ¡esta línea es todo el aprendizaje!`;
const C_PROJ = `import numpy as np
import matplotlib.pyplot as plt

F    = lambda x, y: (x - 3)**2 + 2 * (y + 1)**2           # el valle
grad = lambda x, y: np.array([2 * (x - 3), 4 * (y + 1)])  # sus pendientes

def descenso(eta, x=0.0, y=0.0, max_pasos=200):
    tray = [(x, y)]
    for _ in range(max_pasos):
        gx, gy = grad(x, y)
        if np.hypot(gx, gy) < 1e-3:        # casi sin pendiente: hemos llegado
            break
        x, y = x - eta * gx, y - eta * gy  # un paso cuesta abajo
        tray.append((x, y))
    return np.array(tray)

xs, ys = np.meshgrid(np.linspace(-1, 5, 200), np.linspace(-4, 2, 200))
plt.contour(xs, ys, F(xs, ys), levels=15)
for eta in (0.1, 0.4):
    t = descenso(eta)
    plt.plot(t[:, 0], t[:, 1], "o-", ms=3, label=f"η = {eta} · {len(t) - 1} pasos")
plt.legend(); plt.gca().set_aspect("equal"); plt.show()`;

LESSONS.push({
  id:'lesson-1', level:1, title:'Nivel 1 · Matemáticas para IA', short:'Matemáticas', prefix:'m1-',
  kicker:'Ruta de aprendizaje · Nivel 1 de 10',
  lede:'Las cinco ideas matemáticas que hay detrás de cualquier modelo de IA, explicadas desde cero: primero la intuición, luego un ejemplo que puedes hacer a mano y, al final, dónde aparece en la IA real.',
  meta:'Unas 4–6 horas · Solo necesitas saber sumar, multiplicar y qué es una función · Código de todos los ejemplos en notebooks/nivel1_matematicas.py',
  sections: [
    { id:'objetivos', t:'Cómo usar esta lección', plain:'objetivos matemáticas mapa conceptos', html:() => `
      <p>No hace falta ser matemático para trabajar en IA. Hace falta <b>entender</b> cinco ideas, porque aparecen en todos los modelos. Esta lección no busca que memorices fórmulas, sino que puedas explicar cada idea con tus palabras.</p>
      ${CH.table(['Concepto', 'Pregunta que responde', 'En un modelo de IA'], [
        ['Vector', '¿Cómo convierto algo en números?', 'Cada dato: una fila de una tabla, una imagen, una palabra'],
        ['Matriz', '¿Cómo transformo esos números?', 'Cada capa de una red neuronal'],
        ['Derivada', 'Si cambio un poco la entrada, ¿cuánto cambia la salida?', 'Saber hacia dónde mover cada parámetro'],
        ['Gradiente y descenso', '¿Cómo encuentro el punto más bajo?', 'El entrenamiento: reducir el error paso a paso'],
        ['Probabilidad', '¿Cómo expreso que no estoy seguro?', 'Las predicciones: «gato, con un 94 %»']])}
      <p>Cada apartado sigue el mismo orden: <b>la idea en una frase</b>, un <b>ejemplo con números pequeños</b>, <b>dónde aparece en IA</b> y un trozo de código para comprobarlo. Hazlos con papel y lápiz: es la forma más rápida de que se queden.</p>` },

    { id:'vectores', t:'1 · Vectores', plain:'vector suma producto escalar similitud embeddings longitud', html:() => `
      ${idea('Un vector es una lista de números que describe algo.')}
      <p>Una vivienda de 90 m², con 3 habitaciones y a 2 km del centro, es el vector <b>(90, 3, 2)</b>. El orden importa: cada posición significa siempre lo mismo. Con dos números, un vector se puede dibujar como una flecha.</p>
      ${vectorFig()}
      <h4>Tres operaciones que debes saber hacer a mano</h4>
      <ul><li><b>Sumar</b>: posición a posición. (3, 1) + (1, 2) = (4, 3).</li>
      <li><b>Multiplicar por un número</b>: todas las posiciones. 2 · (3, 1) = (6, 2). La flecha se alarga el doble.</li>
      <li><b>Producto escalar</b>: multiplicar posición a posición y sumarlo todo. El resultado es un solo número.
        <div class="math-block">${U.tex('(3, 1) \\cdot (1, 2) = 3 \\cdot 1 + 1 \\cdot 2 = 5')}</div></li></ul>
      <h4>El producto escalar mide parecido</h4>
      <p>Puntuamos del 1 al 5 cuánto les gustan a tres personas las películas de (acción, romance): Ana (5, 1), Luis (4, 2), Marta (1, 5).</p>
      <div class="math-block">${U.tex('\\begin{gathered} \\text{Ana} \\cdot \\text{Luis} = 5\\cdot4 + 1\\cdot2 = 22 \\\\ \\text{Ana} \\cdot \\text{Marta} = 5\\cdot1 + 1\\cdot5 = 10 \\end{gathered}')}</div>
      <p>Ana y Luis tienen gustos parecidos y su producto escalar es mayor. Cuando dos vectores «apuntan hacia el mismo lado», el producto escalar es grande; si apuntan a lados distintos, es pequeño (o negativo).</p>
      ${enIA('Un recomendador compara tus gustos con los de otras personas justo así. En un LLM, cada palabra es un vector de miles de números (un <i>embedding</i>), y el mecanismo de atención del Transformer decide a qué palabras prestar atención calculando productos escalares.')}
      ${U.code(C_VEC)}` },

    { id:'matrices', t:'2 · Matrices', plain:'matriz multiplicación forma capa red tabla', html:() => `
      ${idea('Una matriz es una tabla de números que transforma un vector en otro.')}
      <p>Quieres comprar 2 manzanas y 3 panes: tu cesta es el vector (2, 3). Cada tienda tiene sus precios, y los ponemos en una tabla, una fila por tienda:</p>
      ${CH.table(['', 'Manzana', 'Pan'], [['Tienda A', '0,5 €', '1,0 €'], ['Tienda B', '0,4 €', '1,2 €']])}
      <p>¿Cuánto cuesta la cesta en cada tienda? Para cada fila, un producto escalar con la cesta:</p>
      <div class="math-block">${U.tex('\\begin{pmatrix} 0{,}5 & 1 \\\\ 0{,}4 & 1{,}2 \\end{pmatrix} \\begin{pmatrix} 2 \\\\ 3 \\end{pmatrix} = \\begin{pmatrix} 0{,}5\\cdot2 + 1\\cdot3 \\\\ 0{,}4\\cdot2 + 1{,}2\\cdot3 \\end{pmatrix} = \\begin{pmatrix} 4 \\\\ 4{,}4 \\end{pmatrix}')}</div>
      <p>Eso es multiplicar una matriz por un vector: <b>cada fila hace un producto escalar</b> con el vector, y cada resultado es un número de la salida.</p>
      <h4>La regla de las formas</h4>
      <p>Una matriz de m filas y n columnas se escribe (m × n). Solo se pueden multiplicar si los números de dentro coinciden, y el resultado se queda con los de fuera:</p>
      <div class="math-block">${U.tex('(m \\times \\underline{n}) \\cdot (\\underline{n} \\times p) = (m \\times p)')}</div>
      ${ojo('más de la mitad de los errores al programar redes neuronales son formas que no encajan. Antes de multiplicar, escribe las formas y comprueba que los números de dentro coinciden.')}
      ${enIA('una capa de una red neuronal es exactamente esto: una matriz de «pesos» que multiplica al vector de entrada. Aprender consiste en ajustar los números de esa matriz.')}
      ${U.code(C_MAT)}` },

    { id:'derivadas', t:'3 · Derivadas', plain:'derivada pendiente tangente cambio', html:() => `
      ${idea('La derivada dice cuánto cambia el resultado cuando cambias un poquito la entrada.')}
      <p>Piensa en el velocímetro de un coche: no te dice dónde estás, sino lo rápido que cambia tu posición <i>en este momento</i>. La derivada es el velocímetro de una función.</p>
      <p>Ejemplo con ${U.tex('f(x) = x^2', false)} en x = 3, donde f(3) = 9. Avanzamos un poquito, h, y miramos cuánto sube por cada unidad avanzada:</p>
      ${CH.table(['Paso h', 'f(3 + h)', 'Subida por unidad: (f(3 + h) − 9) / h'], [['0,1', '9,61', '6,1'], ['0,01', '9,0601', '6,01'], ['0,001', '9,006001', '6,001']])}
      <p>Cuanto más pequeño es el paso, más se acerca a <b>6</b>. Esa es la derivada en x = 3, y es la <b>pendiente</b> de la recta que toca la curva en ese punto:</p>
      ${tangentFig()}
      <p>No hace falta hacer esa tabla cada vez: hay reglas. La que más usarás es ${U.tex('x^n \\rightarrow n\\,x^{n-1}', false)}; por ejemplo, la derivada de ${U.tex('x^2', false)} es ${U.tex('2x', false)}, y en x = 3 vale 6.</p>
      <h4>Lo que de verdad importa: el signo</h4>
      <ul><li>Derivada <b>positiva</b>: si aumentas x, f sube. Para bajar, mueve x hacia la <b>izquierda</b>.</li>
      <li>Derivada <b>negativa</b>: si aumentas x, f baja. Para bajar, mueve x hacia la <b>derecha</b>.</li>
      <li>Derivada <b>cero</b>: estás en un punto llano, quizá el fondo del valle.</li></ul>
      ${enIA('f será el error del modelo y x uno de sus parámetros. La derivada le dice al modelo en qué sentido mover ese parámetro para equivocarse menos.')}
      ${U.code(C_DER)}
      <p class="callout">Mira cómo cambia la pendiente a lo largo de una curva en el <a href="#lab-sigmoid">laboratorio de la función sigmoide</a>.</p>` },

    { id:'cadena', t:'4 · Regla de la cadena', plain:'regla cadena composición backpropagation engranajes', html:() => `
      ${idea('Si una cosa depende de otra que a su vez depende de una tercera, los ritmos de cambio se multiplican.')}
      <p>Imagina tres engranajes. Si A gira 2 veces más rápido que B, y B gira 3 veces más rápido que C, entonces A gira 2 · 3 = <b>6</b> veces más rápido que C. Eso es la regla de la cadena.</p>
      <p>Ejemplo: ${U.tex('y = (2x + 1)^2', false)}. Hay dos pasos encadenados: primero ${U.tex('u = 2x + 1', false)}, después ${U.tex('y = u^2', false)}.</p>
      <ol><li>¿Cuánto cambia u cuando cambia x? ${U.tex('\\frac{du}{dx} = 2', false)}</li>
      <li>¿Cuánto cambia y cuando cambia u? ${U.tex('\\frac{dy}{du} = 2u', false)}. En x = 1, u = 3, así que vale 6.</li>
      <li>Se multiplican: ${U.tex('\\frac{dy}{dx} = 6 \\cdot 2 = 12', false)}.</li></ol>
      <p>Comprobación: si x pasa de 1 a 1,001, y pasa de 9 a 9,012. Ha subido 0,012 por un avance de 0,001: unas 12 veces más. ✓</p>
      ${enIA('una red neuronal es una cadena de capas. Para saber cómo afecta al error un peso de la primera capa, se multiplican los ritmos de cambio de todas las capas que hay detrás. Ese algoritmo se llama <b>backpropagation</b> y no es más que la regla de la cadena aplicada de la salida hacia la entrada.')}
      <p class="callout">Sigue los números de una red completa en el <a href="#lab-backprop">laboratorio de backpropagation paso a paso</a>.</p>` },

    { id:'gradientes', t:'5 · Gradiente', plain:'derivada parcial gradiente montaña dirección', html:() => `
      ${idea('El gradiente es una flecha que apunta hacia donde la función sube más rápido.')}
      <p>Un modelo no tiene un parámetro, tiene miles o millones. Cuando hay varias variables, se calcula una derivada por cada una, moviendo solo esa y dejando las demás quietas (<b>derivada parcial</b>). Juntas forman un vector: el <b>gradiente</b>, que se escribe ${U.tex('\\nabla f', false)}.</p>
      <p>Ejemplo: ${U.tex('f(x, y) = x^2 + y^2', false)} en el punto (1, 2).</p>
      <ul><li>Moviendo solo x, la y es una constante: ${U.tex('\\frac{\\partial f}{\\partial x} = 2x = 2', false)}.</li>
      <li>Moviendo solo y: ${U.tex('\\frac{\\partial f}{\\partial y} = 2y = 4', false)}.</li></ul>
      <div class="math-block">${U.tex('\\nabla f(1, 2) = (2,\\ 4)')}</div>
      <p>Imagina que estás en una montaña con niebla y solo notas la inclinación bajo tus pies. El gradiente es la flecha que apunta cuesta arriba, por el camino más empinado. Si quieres bajar, <b>camina en sentido contrario al gradiente</b>.</p>
      ${enIA('la «montaña» es el error del modelo y cada dirección es un parámetro. El gradiente dice, para cada peso a la vez, cuánto y en qué sentido cambiarlo.')}` },

    { id:'descenso', t:'6 · Descenso de gradiente', plain:'descenso gradiente tasa aprendizaje paso entrenar', html:() => `
      ${idea('Aprender es bajar la montaña del error dando pasos pequeños en contra del gradiente.')}
      <p>La receta completa cabe en una línea: <b>nuevo valor = valor actual − η × pendiente</b>.</p>
      <div class="math-block">${U.tex('w \\leftarrow w - \\eta\\, \\frac{dL}{dw}')}</div>
      <p>η (la letra griega «eta») es la <b>tasa de aprendizaje</b>: el tamaño del paso. Vamos a hacerlo a mano con la pérdida ${U.tex('L(w) = (w - 3)^2', false)}, cuyo mínimo está en w = 3. Su derivada es ${U.tex('2(w - 3)', false)}. Empezamos en w = 0 con η = 0,1:</p>
      ${CH.table(['Paso', 'w', 'Pérdida L(w)', 'Pendiente', 'Siguiente w = w − 0,1 · pendiente'], [
        ['0', '0', '9', '−6', '0 + 0,6 = 0,6'],
        ['1', '0,6', '5,76', '−4,8', '0,6 + 0,48 = 1,08'],
        ['2', '1,08', '3,69', '−3,84', '1,08 + 0,384 = 1,464'],
        ['3', '1,464', '2,36', '−3,07', '1,464 + 0,307 = 1,771'],
        ['4', '1,771', '1,51', '−2,46', '1,771 + 0,246 = 2,017']])}
      <p>Fíjate: la pendiente es negativa, así que restarla <b>suma</b> y w avanza hacia la derecha, hacia el 3. Y la pérdida baja en cada paso: 9 → 5,76 → 3,69 → 2,36 → 1,51.</p>
      ${stepsFig()}
      <h4>El tamaño del paso importa</h4>
      ${CH.table(['Tasa η', 'w tras 20 pasos (objetivo: 3)', 'Qué pasa'], [['0,01', '0,997', 'Pasos demasiado pequeños: avanza lentísimo'], ['0,1', '2,965', 'Bien: casi ha llegado'], ['1,1', '−112', 'Pasos demasiado grandes: se pasa de largo cada vez más y se escapa']])}
      ${ojo('si al entrenar un modelo el error sube o sale <code>nan</code>, lo primero que hay que probar es una tasa de aprendizaje más pequeña.')}
      ${U.code(C_GD)}
      <p class="callout">Experimenta con la tasa de aprendizaje y distintos terrenos en el <a href="#lab-gd">laboratorio de descenso de gradiente</a>.</p>` },

    { id:'probabilidad', t:'7 · Probabilidad', plain:'probabilidad media condicionada falsos positivos softmax', html:() => `
      ${idea('Una probabilidad es un número entre 0 y 1 que dice lo seguros que estamos de algo.')}
      <p>0 es «imposible», 1 es «seguro» y 0,5 es «tan probable como que no». Los modelos no dicen «es un gato»: dicen «gato, 0,94».</p>
      <h4>La media</h4>
      <p>Si tiras un dado muchas veces, ¿qué valor sale de media? ${U.tex('(1+2+3+4+5+6)/6 = 3{,}5', false)}. Aunque ninguna tirada da 3,5, la media de 10.000 tiradas simuladas sale 3,504. Cuanto más datos, más se acerca la media observada a la teórica: por eso los modelos necesitan muchos ejemplos.</p>
      <h4>Pensar con frecuencias: el caso de los falsos positivos</h4>
      <p>Una enfermedad afecta a 1 de cada 100 personas. Un test la detecta en el 99 % de los enfermos, pero también da positivo en el 5 % de los sanos. Si das positivo, ¿qué probabilidad hay de que estés enfermo? En vez de fórmulas, imagina <b>1.000 personas</b>:</p>
      ${CH.table(['', 'Personas', 'Dan positivo'], [['Enfermas (1 %)', '10', '≈ 10 (el 99 %)'], ['Sanas (99 %)', '990', '≈ 50 (el 5 %)'], ['Total', '1.000', '≈ 60']])}
      <p>De unos 60 positivos, solo 10 están enfermos: <b>alrededor del 17 %</b>, no el 99 %. Cuando algo es raro, hasta un buen detector da muchas falsas alarmas.</p>
      ${enIA('es la razón por la que la «exactitud» engaña cuando una clase es rara (fraude, averías, enfermedades). Lo verás en detalle al estudiar métricas de clasificación.')}
      <h4>Softmax: de puntuaciones a probabilidades</h4>
      <p>Un clasificador da puntuaciones sueltas, por ejemplo gato 2, perro 1, pájaro 0,1. Softmax las convierte en probabilidades: todas positivas y que suman 1, y la mayor puntuación se lleva la mayor probabilidad.</p>
      <div class="math-block">${U.tex('\\text{softmax}(2,\\ 1,\\ 0{,}1) = (0{,}66,\\ 0{,}24,\\ 0{,}10)')}</div>
      ${enIA('es la última capa de casi todos los clasificadores, y la que usa un LLM para elegir la siguiente palabra.')}` },

    { id:'ejercicios', t:'Ejercicios', plain:'ejercicios soluciones práctica', html:() => `
      <p>Hazlos con papel y lápiz antes de abrir la solución. Si te atascas, abre el ejercicio y lee solo la pista.</p>
      ${ex(1, 'Suma los vectores (2, 5) y (1, −1), y multiplica el resultado por 3.', '<p>(2 + 1, 5 − 1) = (3, 4). Por 3: <b>(9, 12)</b>.</p>', 'se opera posición a posición.')}
      ${ex(2, 'Calcula el producto escalar de (1, 2, 3) y (4, 0, −1).', '<p>1·4 + 2·0 + 3·(−1) = 4 + 0 − 3 = <b>1</b>.</p>', 'multiplica cada pareja y suma los tres resultados.')}
      ${ex(3, 'Pedro puntúa (acción, romance) con (1, 4). ¿Se parece más a Ana (5, 1) o a Marta (1, 5)?', '<p>Pedro · Ana = 5 + 4 = 9. Pedro · Marta = 1 + 20 = 21. Se parece más a <b>Marta</b>.</p>')}
      ${ex(4, 'Multiplica la matriz [[1, 2], [0, 1]] por el vector (3, 1).', '<p>Primera fila: 1·3 + 2·1 = 5. Segunda fila: 0·3 + 1·1 = 1. Resultado: <b>(5, 1)</b>.</p>', 'cada fila de la matriz hace un producto escalar con el vector.')}
      ${ex(5, '¿Se puede multiplicar una matriz (2 × 3) por otra (3 × 4)? ¿Y una (2 × 3) por una (2 × 3)? Si se puede, ¿qué forma tiene el resultado?', '<p>(2 × 3)·(3 × 4): sí, los de dentro coinciden (3) y el resultado es <b>(2 × 4)</b>. (2 × 3)·(2 × 3): <b>no</b>, porque 3 ≠ 2.</p>')}
      ${ex(6, '¿Cuál es la derivada de f(x) = x² en x = 5? Si estás en x = 5 y quieres que f baje, ¿hacia dónde mueves x?', '<p>f\'(x) = 2x, así que f\'(5) = <b>10</b>. Es positiva: si x aumenta, f sube. Para bajar, mueve x hacia la <b>izquierda</b> (hacia valores menores).</p>')}
      ${ex(7, 'Calcula el gradiente de f(x, y) = x² + 3xy en el punto (1, 2).', '<p>Moviendo solo x (y es constante): 2x + 3y = 2 + 6 = 8. Moviendo solo y (x es constante): 3x = 3. Gradiente: <b>(8, 3)</b>.</p>', 'en 3xy, si y está quieta, 3y es un número fijo que multiplica a x.')}
      ${ex(8, 'Haz dos pasos de descenso de gradiente con L(w) = (w − 3)², empezando en w = 0 y con η = 0,5. ¿Qué ha pasado?', '<p>Paso 1: pendiente 2·(0 − 3) = −6, w = 0 − 0,5·(−6) = 3. Paso 2: pendiente 2·(3 − 3) = 0, así que w se queda en 3. Con este η se llega al mínimo <b>en un solo paso</b>: en esta función concreta, el paso tiene justo el tamaño exacto.</p>')}` },

    { id:'proyecto', t:'Proyecto del nivel', plain:'proyecto descenso gradiente trayectoria matplotlib', html:() => `
      <p><b>Programa el descenso de gradiente con dos parámetros y dibuja el camino que sigue.</b> El «valle» es ${U.tex('F(x, y) = (x-3)^2 + 2(y+1)^2', false)}, con el fondo en (3, −1). Empieza en (0, 0) y para cuando la pendiente sea casi cero.</p>
      <p>Es lo mismo que la tabla del apartado 6, pero moviendo dos números a la vez: cada uno con su propia pendiente.</p>
      ${gdFig()}
      ${U.code(C_PROJ, 'Solución de referencia')}
      <p><b>Para ir más allá:</b> (1) cambia el punto de inicio y comprueba que siempre llega al mismo sitio; (2) busca probando la η más grande con la que todavía llega; (3) imprime la pérdida en cada paso y comprueba que siempre baja cuando η es pequeña.</p>` },

    { id:'test', t:'Test de autoevaluación', plain:'test preguntas autoevaluación', html:() => quiz('nivel-1', [
      { q:'¿Qué es un vector en machine learning?', o:['Una flecha que solo existe en física', 'Una lista ordenada de números que describe algo', 'Una tabla de números', 'Una fórmula'], ok:1, why:'Cualquier dato (una vivienda, una imagen, una palabra) se representa como una lista de números en un orden fijo.' },
      { q:'¿Cuánto vale el producto escalar de (2, 3) y (4, 1)?', o:['6', '11', '(8, 3)', '10'], ok:1, why:'2·4 + 3·1 = 8 + 3 = 11. El resultado es un solo número, no un vector.' },
      { q:'Dos vectores con un producto escalar grande y positivo…', o:['Son muy distintos', 'Apuntan hacia el mismo lado: se parecen', 'Son perpendiculares', 'Tienen la misma longitud'], ok:1, why:'Por eso se usa el producto escalar para medir el parecido entre gustos, documentos o palabras.' },
      { q:'Multiplicas una matriz (64 × 10) por otra (10 × 3). ¿Qué forma tiene el resultado?', o:['(10 × 10)', '(64 × 3)', '(3 × 64)', 'No se puede multiplicar'], ok:1, why:'Los números de dentro (10) coinciden y desaparecen; el resultado se queda con los de fuera: (64 × 3).' },
      { q:'La derivada de una función en un punto es negativa. Si aumentas un poco x…', o:['La función sube', 'La función baja', 'La función no cambia', 'No se puede saber'], ok:1, why:'Derivada negativa significa pendiente cuesta abajo hacia la derecha: al aumentar x, la función baja.' },
      { q:'Si A cambia 2 veces más rápido que B, y B 5 veces más rápido que C, ¿cuántas veces más rápido cambia A que C?', o:['7', '10', '2,5', '3'], ok:1, why:'Regla de la cadena: los ritmos de cambio se multiplican, 2 · 5 = 10.' },
      { q:'¿Hacia dónde se mueve el descenso de gradiente?', o:['Hacia donde apunta el gradiente', 'En sentido contrario al gradiente', 'Siempre hacia el origen', 'Al azar'], ok:1, why:'El gradiente apunta cuesta arriba; para reducir el error hay que ir en sentido contrario.' },
      { q:'Al entrenar, el error crece en cada paso hasta salir nan. ¿Qué es lo primero que pruebas?', o:['Una tasa de aprendizaje más grande', 'Una tasa de aprendizaje más pequeña', 'Más datos', 'Nada, es normal'], ok:1, why:'Con pasos demasiado grandes el algoritmo se pasa del mínimo cada vez más y se escapa.' },
      { q:'¿Qué garantiza softmax sobre sus salidas?', o:['Que sean números enteros', 'Que sean positivas y sumen 1', 'Que estén entre −1 y 1', 'Que sean todas iguales'], ok:1, why:'Convierte cualquier lista de puntuaciones en una distribución de probabilidad.' },
      { q:'Un test da positivo en el 99 % de los enfermos y en el 5 % de los sanos, y la enfermedad afecta a 1 de cada 100 personas. Si das positivo, tu probabilidad de estar enfermo es…', o:['99 %', '95 %', 'Alrededor del 50 %', 'Alrededor del 17 %'], ok:3, why:'De cada 1.000 personas, unas 10 enfermas dan positivo y unas 50 sanas también: 10 de 60 ≈ 17 %.' },
    ]) },

    { id:'criterios', t:'¿Has asimilado el nivel?', plain:'criterios completado checklist', html:() => `
      <p>Marca cada punto solo si puedes hacerlo <b>sin mirar la lección</b>. Una buena prueba: explicárselo en voz alta a alguien (o a ti mismo) en menos de un minuto. El progreso se guarda solo en este navegador.</p>
      ${checklist('nivel-1', [
        'Sé explicar qué es un vector y poner un ejemplo de un dato convertido en vector.',
        'Sé sumar vectores y calcular un producto escalar a mano, y sé qué significa que sea grande.',
        'Sé multiplicar una matriz pequeña por un vector y predecir la forma del resultado.',
        'Sé explicar qué es una derivada con la idea de pendiente, y qué me dice su signo.',
        'Sé explicar la regla de la cadena con el ejemplo de los engranajes.',
        'Sé explicar qué es el gradiente y por qué se camina en sentido contrario.',
        'He hecho a mano al menos dos pasos de descenso de gradiente.',
        'Sé qué pasa si la tasa de aprendizaje es demasiado pequeña o demasiado grande.',
        'Sé explicar el ejemplo de los falsos positivos con 1.000 personas.',
        'He sacado al menos 8 de 10 en el test.'])}
      <h4>Si quieres verlo explicado de otra forma</h4>
      ${CH.refs([
        '3Blue1Brown. <i>Essence of Linear Algebra</i> y <i>Essence of Calculus</i> (series de vídeos cortos, muy visuales; tienen subtítulos en español).',
        'Khan Academy en español: álgebra lineal (vectores y matrices) y cálculo diferencial (derivadas).',
        'M. P. Deisenroth, A. A. Faisal, C. S. Ong (2020). <i>Mathematics for Machine Learning</i>. Cambridge University Press. Gratis en la web de los autores; para cuando quieras profundizar.'])}
      <h4>Ejecuta el código de la lección</h4>
      <p>Todos los ejemplos, los ejercicios y el proyecto, listos para ejecutar y cambiar los números:</p>
      ${CH.repo('nivel1_matematicas.py')}
      <p class="next-level">Siguiente paso: <a href="#path">volver a la ruta y empezar el Nivel 2 · Python</a>.</p>` },
  ],
});
})();
