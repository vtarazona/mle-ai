/* =========================================================================
   Nivel 3 · Estadística para IA. Enfoque de conceptos básicos: la idea,
   un ejemplo pequeño, dónde aparece en IA y cómo comprobarlo con código.
   Todas las cifras salen de notebooks/nivel3_estadistica.py.
   ========================================================================= */
(() => {
const { idea, enIA, ojo, ex, quiz, checklist } = LX;

/* ---------- gráficos ---------- */
function normalFig() {
  const W = 560, H = 250, pl = 20, pr = 20, pt = 16, pb = 40, x0 = -3.6, x1 = 3.6;
  const X = z => pl + (z - x0) / (x1 - x0) * (W - pl - pr), f = z => Math.exp(-z * z / 2), Y = y => H - pb - y * (H - pt - pb);
  const area = (a, b) => { let d = `M ${X(a)} ${Y(0)}`; for (let i = 0; i <= 60; i++) { const z = a + (b - a) * i / 60; d += ` L ${X(z).toFixed(1)} ${Y(f(z)).toFixed(1)}`; } return d + ` L ${X(b)} ${Y(0)} Z`; };
  let g = `<path d="${area(-3, 3)}" class="band3"/><path d="${area(-2, 2)}" class="band2"/><path d="${area(-1, 1)}" class="band1"/>`;
  let d = ''; for (let i = 0; i <= 120; i++) { const z = x0 + (x1 - x0) * i / 120; d += `${i ? 'L' : 'M'} ${X(z).toFixed(1)} ${Y(f(z)).toFixed(1)} `; }
  g += `<path d="${d}" class="curve"/><line x1="${pl}" x2="${W - pr}" y1="${Y(0)}" y2="${Y(0)}" class="gl"/>`;
  [-3, -2, -1, 0, 1, 2, 3].forEach(k => { g += `<text x="${X(k)}" y="${H - pb + 16}" text-anchor="middle" class="ax">${170 + 8 * k}</text>`; });
  g += `<text x="${X(0)}" y="${Y(0.45)}" text-anchor="middle" class="lbl">68 %</text><text x="${X(1.5)}" y="${Y(0.07)}" text-anchor="middle" class="lbl sm">+13,5 %</text><text x="${X(-1.5)}" y="${Y(0.07)}" text-anchor="middle" class="lbl sm">+13,5 %</text>`;
  g += `<text x="${(pl + W - pr) / 2}" y="${H - 6}" text-anchor="middle" class="ax">altura (cm) · media 170, desviación típica 8</text>`;
  return `<figure class="chart mini"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Distribución normal con las bandas del 68, 95 y 99,7 %">${g}</svg>
    <div class="legend"><span><i class="kb1"></i>±1 desviación: 68 %</span><span><i class="kb2"></i>±2: 95 %</span><span><i class="kb3"></i>±3: 99,7 %</span></div>
    <figcaption>Alturas de adultos: media 170 cm, desviación típica 8 cm. El 68 % mide entre 162 y 178; el 95 %, entre 154 y 186. En una simulación de 100.000 personas salen 68,2 %, 95,4 % y 99,7 %.</figcaption></figure>`;
}
const HIST = {
  1: [18.2, 14.9, 12.1, 9.8, 8.3, 6.6, 5.4, 4.6, 3.7, 3.0, 2.5, 2.0, 1.6, 1.3, 1.1, 0.9, 0.8, 0.6, 0.5, 0.4],
  5: [0.3, 4.9, 13.2, 18.7, 18.9, 15.7, 11.2, 7.3, 4.3, 2.5, 1.4, 0.7, 0.4, 0.2, 0.1, 0.1, 0, 0, 0, 0],
  30: [0, 0, 0.6, 12.5, 39.3, 33.9, 11.5, 1.9, 0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
function tclFig() {
  const panel = (n, title) => {
    const W = 200, H = 150, pl = 8, pr = 8, pt = 10, pb = 24, bw = (W - pl - pr) / 20, mx = n === 30 ? 40 : 20;
    let g = HIST[n].map((v, i) => `<rect x="${(pl + i * bw + 0.8).toFixed(1)}" y="${(H - pb - v / mx * (H - pt - pb)).toFixed(1)}" width="${(bw - 1.6).toFixed(1)}" height="${(v / mx * (H - pt - pb)).toFixed(1)}" class="bar${n === 30 ? ' hl' : ''}"/>`).join('');
    g += `<line x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}" class="gl"/>` + [0, 10, 20, 30, 40].map(m => `<text x="${pl + m / 2 * bw}" y="${H - 8}" text-anchor="middle" class="ax">${m}</text>`).join('');
    g += `<line x1="${pl + 5 * bw}" x2="${pl + 5 * bw}" y1="${pt}" y2="${H - pb}" class="mk"/>`;
    return `<div><p class="panel-t">${title}</p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${g}</svg></div>`;
  };
  return `<figure class="chart"><div class="panels">${panel(1, '1 cliente')}${panel(5, 'Media de 5 clientes')}${panel(30, 'Media de 30 clientes')}</div>
    <figcaption>Tiempos de espera en minutos (media real 10, línea discontinua), repitiendo el experimento 100.000 veces. Un cliente suelto sigue una distribución muy torcida: casi todos esperan poco y unos pocos, muchísimo. Pero la <b>media</b> de 30 clientes ya tiene forma de campana, centrada en 10 y mucho más estrecha.</figcaption></figure>`;
}
function corrFig() {
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const r = (xs, ys) => { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0, syy = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };
  const mk = f => { const xs = [], ys = []; for (let i = 0; i < 60; i++) { const x = gauss(); xs.push(x); ys.push(f(x)); } return [xs, ys]; };
  const sets = [['Positiva fuerte', mk(x => x + 0.45 * gauss())], ['Casi nula', mk(() => gauss())], ['Negativa fuerte', mk(x => -x + 0.45 * gauss())], ['Relación en curva', (() => { const xs = Array.from({ length: 60 }, (_, i) => -2 + 4 * i / 59); return [xs, xs.map(x => x * x + 0.25 * gauss())]; })()]];
  const panel = ([title, [xs, ys]]) => {
    const W = 150, H = 130, p = 10, mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
    const g = xs.map((x, i) => `<circle cx="${(p + (x - mnx) / (mxx - mnx) * (W - 2 * p)).toFixed(1)}" cy="${(H - p - (ys[i] - mny) / (mxy - mny) * (H - 2 * p)).toFixed(1)}" r="2.6" class="pt"/>`).join('');
    const rv = r(xs, ys);
    return `<div><p class="panel-t">${title}<br><b>r = ${(rv < 0 ? '−' : '') + Math.abs(rv).toFixed(2).replace('.', ',')}</b></p><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" class="frame"/>${g}</svg></div>`;
  };
  return `<figure class="chart"><div class="panels four">${sets.map(panel).join('')}</div>
    <figcaption>La correlación (r) mide si los puntos se agrupan alrededor de una <b>línea recta</b>. El último caso es la trampa: hay una relación clarísima, pero no es recta, y r sale casi 0.</figcaption></figure>`;
}
function boxFig() {
  const W = 560, H = 136, X = v => 30 + v / 12 * (W - 60), y = 52;
  const q1 = 2.56, med = 3.53, q3 = 4.74, lo = 0.5, hi = 8.01;
  let g = [0, 2, 4, 6, 8, 10, 12].map(v => `<line x1="${X(v)}" x2="${X(v)}" y1="20" y2="94" class="gl"/><text x="${X(v)}" y="122" text-anchor="middle" class="ax">${v}</text>`).join('');
  g += `<line x1="${X(lo)}" x2="${X(q1)}" y1="${y}" y2="${y}" class="whisk"/><line x1="${X(q3)}" x2="${X(hi)}" y1="${y}" y2="${y}" class="whisk"/>`;
  g += `<line x1="${X(lo)}" x2="${X(lo)}" y1="${y - 10}" y2="${y + 10}" class="whisk"/><line x1="${X(hi)}" x2="${X(hi)}" y1="${y - 10}" y2="${y + 10}" class="whisk"/>`;
  g += `<rect x="${X(q1)}" y="${y - 18}" width="${X(q3) - X(q1)}" height="36" class="box"/><line x1="${X(med)}" x2="${X(med)}" y1="${y - 18}" y2="${y + 18}" class="medline"/>`;
  for (const v of [8.3, 8.6, 9.0, 9.4, 9.9, 10.5, 11.2, 12.0]) g += `<circle cx="${X(v)}" cy="${y}" r="3.2" class="outl"/>`;
  g += `<text x="${X(q1)}" y="${y + 34}" text-anchor="middle" class="lbl sm">Q1 = 2,56</text><text x="${X(med)}" y="${y - 24}" text-anchor="middle" class="lbl sm">mediana 3,53</text><text x="${X(q3)}" y="${y + 34}" text-anchor="middle" class="lbl sm">Q3 = 4,74</text><text x="${X(hi)}" y="${y - 24}" text-anchor="middle" class="lbl sm">límite 8,01</text><text x="${X(10.2)}" y="${y + 34}" text-anchor="middle" class="lbl sm">outliers (681, hasta 15)</text>`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama de caja de los ingresos medianos">${g}</svg>
    <figcaption>Diagrama de caja de los ingresos medianos por barrio en California Housing (en decenas de miles de dólares). La caja va de Q1 a Q3 y contiene la mitad central de los barrios; la raya es la mediana. Los puntos sueltos son los que pasan de Q3 + 1,5 × IQR. Solo se dibujan unos pocos, a modo de ejemplo.</figcaption></figure>`;
}

/* ---------- código ---------- */
const C_CENTRO = `import numpy as np

sueldos = np.array([1800, 2000, 2100, 2300, 2500])
sueldos.mean(), np.median(sueldos)        # (2140.0, 2100.0)

con_millonario = np.append(sueldos, 50_000)
con_millonario.mean()                     # 10116.7  ← se dispara
np.median(con_millonario)                 # 2200.0   ← casi no cambia`;
const C_DISP = `clase_a = np.array([5, 5, 5, 5, 5, 5])
clase_b = np.array([0, 2, 5, 5, 8, 10])

clase_a.mean(), clase_a.std()     # (5.0, 0.0)
clase_b.mean(), clase_b.std()     # (5.0, 3.37)  misma media, mucha más dispersión`;
const C_TCL = `rng = np.random.default_rng(42)
espera = rng.exponential(scale=10, size=(100_000, 30))   # 100 000 repeticiones de 30 clientes

for n in (1, 5, 30):
    medias = espera[:, :n].mean(axis=1)
    print(n, medias.mean().round(2), medias.std().round(2))
# 1   9.97  9.96
# 5   9.98  4.46
# 30  9.99  1.82    ← la dispersión baja como 10 / √n`;
const C_IC = `muestra = rng.normal(170, 8, 50)                        # alturas de 50 personas
media = muestra.mean()                                  # 168.7
error = muestra.std(ddof=1) / np.sqrt(len(muestra))     # 1.17  error estándar
media - 1.96 * error, media + 1.96 * error              # (166.4, 171.0)`;
const C_CORR = `horas = np.array([1, 2, 3, 4, 5, 6])      # horas de estudio
nota  = np.array([3, 4, 6, 5, 8, 9])      # nota del examen
np.corrcoef(horas, nota)[0, 1]            # 0.946

# Con Pandas, todas las parejas de columnas a la vez:
df.corr()`;
const C_P = `from scipy import stats

stats.binomtest(60, 100, p=0.5).pvalue    # 0.057  → podría ser suerte
stats.binomtest(70, 100, p=0.5).pvalue    # 0.00008 → casi seguro que está trucada`;
const C_PROJ = `import pandas as pd

URL = "https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/data/california_housing.csv"
casas = pd.read_csv(URL)                           # 20 640 barrios de California (censo de 1990)

# 1. Centro, dispersión y forma
v = casas["median_house_value"]
v.mean(), v.median(), v.skew()                     # 206 856 · 179 700 · 0.98 (cola a la derecha)
(v == v.max()).sum()                               # 965 barrios con el valor exacto 500 001: ¡un tope!

# 2. Correlaciones con el valor de la vivienda
casas["habitaciones_por_hogar"] = casas["total_rooms"] / casas["households"]
casas.drop(columns="ocean_proximity").corr()["median_house_value"].sort_values()

# 3. Outliers con la regla del rango intercuartílico
col = casas["habitaciones_por_hogar"]
q1, q3 = col.quantile([0.25, 0.75]); iqr = q3 - q1
fuera = (col < q1 - 1.5 * iqr) | (col > q3 + 1.5 * iqr)
fuera.sum(), col.max()                             # 511 barrios · máximo 141.9 habitaciones por hogar

# 4. Una variable de texto: la cercanía al océano
casas.groupby("ocean_proximity")["median_house_value"].median().sort_values()`;

LESSONS.push({
  id:'lesson-3', slug:'statistics', level:3, title:'Nivel 3 · Estadística para IA', short:'Estadística', prefix:'e3-',
  time:'PT6H', teaches:'Media y mediana, dispersión, distribución normal, teorema central del límite, intervalos de confianza, correlación y causalidad, contraste de hipótesis y Bayes',
  kicker:'Ruta de aprendizaje · Nivel 3 de 10',
  lede:'Cómo resumir unos datos con pocos números, cuánto fiarte de una muestra y cómo no dejarte engañar por una correlación. Es la estadística que necesitas para entender tus datos antes de entrenar un modelo, y sus resultados después.',
  meta:'Unas 5–7 horas · Requisitos: niveles 1 y 2 (sumar, medias y un poco de Pandas) · Código de todos los ejemplos en notebooks/nivel3_estadistica.py',
  sections: [
    { id:'objetivos', t:'Cómo usar esta lección', plain:'objetivos estadística', html:() => `
      <p>Un modelo de IA aprende de <b>datos</b>, y los datos siempre traen trampas: valores extremos, muestras pequeñas, casualidades que parecen patrones. La estadística es la caja de herramientas para verlas. Siete preguntas guían la lección:</p>
      ${CH.table(['Concepto', 'Pregunta que responde', 'En un proyecto de IA'], [
        ['Media y mediana', '¿Cuál es el valor típico?', 'Resumir cada columna; rellenar nulos'],
        ['Desviación típica y cuartiles', '¿Cuánto varían los datos?', 'Normalizar variables; detectar outliers'],
        ['Distribución normal', '¿Qué forma tienen los datos?', 'Inicializar pesos; detectar anomalías'],
        ['Teorema central del límite', '¿Por qué las medias son tan fiables?', 'Por qué funciona entrenar con lotes'],
        ['Intervalo de confianza', '¿Cuánto me fío de un resultado?', '«92 % ± 2 % de acierto»'],
        ['Correlación', '¿Van juntas dos variables?', 'Elegir variables; no confundir con causa'],
        ['Contraste de hipótesis y Bayes', '¿Es real o es suerte? ¿Cómo actualizo lo que creo?', 'Tests A/B; filtros de spam']])}
      <p>Mismo método que en los niveles anteriores: <b>la idea en una frase</b>, un ejemplo pequeño, <b>dónde aparece en IA</b> y código para comprobarlo. Muchos conceptos se entienden mejor <b>simulando</b> que con fórmulas, y con NumPy simular es muy fácil: aprovéchalo.</p>` },

    { id:'centro', t:'1 · Media, mediana y moda', plain:'media mediana moda valor típico outlier robusto', html:() => `
      ${idea('La media reparte el total a partes iguales; la mediana es el valor del medio. Si hay valores extremos, fíate de la mediana.')}
      <p>Cinco personas cobran 1.800, 2.000, 2.100, 2.300 y 2.500 € al mes. La <b>media</b> es la suma entre cinco: 2.140 €. La <b>mediana</b> es el valor que queda en el centro al ordenarlos: 2.100 €. Se parecen.</p>
      <p>Ahora entra en el grupo alguien que gana 50.000 €:</p>
      ${CH.table(['', 'Media', 'Mediana'], [['5 personas', '2.140 €', '2.100 €'], ['+ 1 millonario', '<b>10.117 €</b>', '<b>2.200 €</b>']])}
      <p>La media se ha multiplicado por cinco y ya no describe a nadie del grupo. La mediana apenas se mueve: es <b>robusta</b> frente a valores extremos. Por eso las estadísticas de salarios o de precios de viviendas usan la mediana.</p>
      <p>La <b>moda</b> es el valor que más se repite. Es la única de las tres que sirve para datos que no son números: la talla más vendida o el color más elegido.</p>
      ${U.code(C_CENTRO)}
      ${enIA('en el nivel 2 rellenaste nulos con la mediana precisamente por esto: si la columna tiene valores extremos, la media daría un relleno poco realista.')}` },

    { id:'dispersion', t:'2 · Dispersión: desviación típica y cuartiles', plain:'dispersión varianza desviación típica cuartiles rango intercuartílico iqr', html:() => `
      ${idea('La desviación típica dice cuánto se alejan los datos de la media, en las mismas unidades que los datos.')}
      <p>Dos clases sacan de media un 5 en un examen. En la A, todos sacan exactamente un 5. En la B, las notas son 0, 2, 5, 5, 8 y 10. La media es igual, pero son clases muy distintas: a la media le falta información sobre la <b>dispersión</b>.</p>
      <h4>Cómo se calcula, paso a paso</h4>
      <p>Con los datos 2, 4, 4, 4, 5, 5, 7, 9 (media 5):</p>
      <ol><li>Resta la media a cada dato: −3, −1, −1, −1, 0, 0, 2, 4.</li>
      <li>Eleva al cuadrado (para que los negativos no anulen a los positivos) y haz la media: (9 + 1 + 1 + 1 + 0 + 0 + 4 + 16) / 8 = 4. Esa es la <b>varianza</b>.</li>
      <li>Haz la raíz cuadrada para volver a las unidades originales: √4 = <b>2</b>. Esa es la <b>desviación típica</b>.</li></ol>
      ${U.code(C_DISP)}
      <h4>Los cuartiles: la versión robusta</h4>
      <p>Ordena los datos y pártelos en cuatro trozos iguales. <b>Q1</b> deja por debajo el 25 %, la mediana el 50 % y <b>Q3</b> el 75 %. La distancia <b>Q3 − Q1</b> se llama <b>rango intercuartílico</b> (IQR) y mide la anchura de la mitad central de los datos. Igual que la mediana, no le afectan los valores extremos.</p>
      ${boxFig()}
      <p>El dibujo es un <b>diagrama de caja</b>, y con él se aplica la regla más usada para detectar valores atípicos (<b>outliers</b>): es sospechoso todo lo que queda más allá de <b>1,5 × IQR</b> por encima de Q3 o por debajo de Q1.</p>
      ${ojo('un outlier no siempre es un error. Puede ser un fallo de medida (una persona de 3 metros) o un caso real y valioso (el barrio más rico). Antes de borrarlo, averigua qué es.')}
      ${enIA('muchos modelos (las redes neuronales, la regresión con regularización, K-means) funcionan mal si una columna va de 0 a 1 y otra de 0 a 100.000. Por eso se <b>estandarizan</b>: a cada valor se le resta la media y se divide por la desviación típica. Es lo que hace <code>StandardScaler</code> de scikit-learn.')}` },

    { id:'normal', t:'3 · La distribución normal', plain:'distribución normal campana gauss 68 95 99.7 histograma asimetría', html:() => `
      ${idea('Muchas medidas se reparten en forma de campana: casi todo cerca de la media y cada vez menos hacia los extremos.')}
      <p>La <b>distribución</b> de unos datos es cómo se reparten sus valores, lo que dibuja un histograma. La más famosa es la <b>normal</b> (o campana de Gauss). Solo necesitas dos números para describirla, la media y la desviación típica, y cumple una regla muy práctica:</p>
      ${normalFig()}
      <p><b>Regla 68-95-99,7:</b> el 68 % de los datos queda a menos de una desviación típica de la media; el 95 %, a menos de dos, y el 99,7 %, a menos de tres. Así, alguien de 194 cm está a 3 desviaciones de la media: es muy raro, más o menos 1 de cada 740 personas por arriba.</p>
      <p>No todo es normal. Los ingresos, los precios o los tiempos de espera tienen una <b>cola larga</b> hacia un lado (distribución <b>asimétrica</b>): muchos valores pequeños y unos pocos enormes. En esos casos la media queda por encima de la mediana. Lo verás en el proyecto.</p>
      ${enIA('los pesos de una red neuronal se inicializan con números aleatorios de una normal, y un sistema de detección de anomalías puede marcar como sospechoso todo lo que esté a más de 3 desviaciones típicas de lo habitual.')}` },

    { id:'tcl', t:'4 · Muestras y teorema central del límite', plain:'muestra población teorema central límite medias exponencial simulación', html:() => `
      ${idea('Aunque los datos tengan una forma rara, la media de muchos de ellos se comporta como una campana, y es más precisa cuantos más datos promedias.')}
      <p>Casi nunca tenemos todos los datos (la <b>población</b>), sino una parte (una <b>muestra</b>). La pregunta clave es: ¿cuánto se parece la media de la muestra a la media real? El <b>teorema central del límite</b> da la respuesta, y se ve mejor simulando.</p>
      <p>En una ventanilla, el tiempo de espera de cada cliente sigue una distribución muy asimétrica (exponencial) con media 10 minutos. Tomamos 1, 5 o 30 clientes, calculamos su espera media y repetimos 100.000 veces:</p>
      ${tclFig()}
      ${CH.table(['Clientes promediados (n)', 'Media de las medias', 'Dispersión de las medias', 'Teoría: 10 / √n'], [['1', '9,97', '9,96', '10,00'], ['5', '9,98', '4,46', '4,47'], ['30', '9,99', '1,82', '1,83']])}
      <p>Tres lecciones: (1) la media de las muestras acierta en promedio (10); (2) su forma se vuelve de campana aunque los datos no lo sean; y (3) su dispersión se reduce como <b>1/√n</b>. Ojo: para ser el doble de preciso necesitas <b>cuatro</b> veces más datos, no el doble.</p>
      ${U.code(C_TCL)}
      ${enIA('en el entrenamiento con <i>mini-lotes</i> (SGD), el gradiente de un lote de 32 ejemplos es una media, así que es una estimación razonable del gradiente de todos los datos. Por eso funciona entrenar con lotes en vez de con todo el dataset a la vez.')}` },

    { id:'intervalos', t:'5 · Intervalos de confianza', plain:'intervalo confianza 95 error estándar margen', html:() => `
      ${idea('Un resultado sacado de una muestra siempre debe ir con su margen de error.')}
      <p>Mides la altura de 50 personas y la media sale 168,7 cm. ¿La media de toda la población es exactamente 168,7? Seguro que no. Por el teorema central del límite sabemos lo que varía una media: su dispersión, llamada <b>error estándar</b>, es la desviación típica de la muestra dividida por √n. Aquí sale 1,17 cm.</p>
      <div class="math-block">${U.tex('\\text{IC}_{95\\%} = \\text{media} \\pm 1{,}96 \\times \\text{error estándar} = 168{,}7 \\pm 2{,}3 = [166{,}4,\\ 171{,}0]')}</div>
      <p>El 1,96 sale de la regla de la normal (el 95 % queda a menos de unas 2 desviaciones). <b>Cómo se interpreta:</b> si repitiéramos el experimento muchas veces, el 95 % de los intervalos calculados así contendría la media real. En la simulación del cuaderno, con una media real de 170, lo hicieron 9.440 de 10.000 (94,4 %).</p>
      ${U.code(C_IC)}
      ${ojo('un intervalo muy ancho no es un fallo del cálculo: te está avisando de que tienes pocos datos para la conclusión que quieres sacar.')}
      ${enIA('decir «mi modelo acierta el 92 %» sin más es incompleto. Si lo evaluaste con 100 ejemplos, el margen ronda ±5 puntos, y otro modelo con un 90 % podría ser igual de bueno. La validación cruzada de los niveles siguientes sirve, en parte, para medir esa variación.')}` },

    { id:'correlacion', t:'6 · Correlación y causalidad', plain:'correlación pearson causalidad espuria variable oculta', html:() => `
      ${idea('La correlación mide si dos variables suben y bajan juntas, pero no dice por qué.')}
      <p>El <b>coeficiente de correlación</b> (r) va de −1 a 1. Si vale +1, los puntos forman una recta que sube; si vale −1, una recta que baja; cerca de 0, no hay relación en línea recta.</p>
      ${corrFig()}
      <p>Ejemplo: horas de estudio (1 a 6) frente a la nota de seis alumnos (3, 4, 6, 5, 8, 9): r = 0,946, una relación muy fuerte.</p>
      ${U.code(C_CORR)}
      <h4>Correlación no es causalidad</h4>
      <p>En verano se venden más helados y hay más ahogamientos: su correlación es alta. ¿Los helados provocan ahogamientos? No. Hay una <b>tercera variable oculta</b>, el calor, que hace subir las dos. Antes de decir que A causa B, pregúntate:</p>
      <ul><li>¿Hay una tercera variable que mueva a las dos?</li><li>¿Podría ser al revés, que B cause A?</li><li>¿Podría ser casualidad? Con muchas variables, algunas correlaciones salen por puro azar.</li></ul>
      <p>La única forma segura de demostrar una causa es un <b>experimento</b>: cambiar A a propósito, al azar, y medir B. Es lo que hace un test A/B.</p>
      ${enIA('un modelo aprende correlaciones, no causas. Si en los datos de entrenamiento las fotos de lobos tienen nieve de fondo, el modelo puede aprender a detectar la nieve. Entender las correlaciones de tus datos es la primera defensa contra ese tipo de errores.')}` },

    { id:'contraste', t:'7 · ¿Es real o es suerte? Contraste de hipótesis', plain:'contraste hipótesis p-valor significativo moneda test ab', html:() => `
      ${idea('Un p-valor responde a esta pregunta: si todo fuera pura casualidad, ¿cuán raro sería lo que he visto?')}
      <p>Lanzas una moneda 100 veces y salen 60 caras. ¿Está trucada? El razonamiento tiene tres pasos:</p>
      <ol><li><b>Suponemos lo aburrido</b> (la <i>hipótesis nula</i>): la moneda es justa.</li>
      <li><b>Calculamos lo raro</b> que sería el resultado si eso fuera cierto: la probabilidad de un resultado igual de alejado de 50 o más. Ese número es el <b>p-valor</b>.</li>
      <li><b>Decidimos</b>: si el p-valor es muy pequeño (por convenio, menos de 0,05), la explicación «es casualidad» deja de ser creíble.</li></ol>
      ${CH.table(['Caras de 100', 'p-valor', 'Conclusión'], [['60', '0,057', 'Podría ser suerte: pasa en 1 de cada 18 monedas justas'], ['70', '0,00008', 'Casi imposible con una moneda justa: está trucada']])}
      ${U.code(C_P)}
      ${ojo('un p-valor mayor que 0,05 <b>no demuestra</b> que la moneda sea justa: solo dice que con estos datos no se puede descartar. Y un p-valor pequeño no dice que el efecto sea grande ni importante.')}
      ${enIA('un test A/B compara dos versiones de un modelo (o de una web) con usuarios reales. Si la nueva mejora del 10 % al 11 %, el contraste de hipótesis dice si esa mejora es real o si podría ser ruido.')}` },

    { id:'bayes', t:'8 · Bayes: actualizar lo que crees', plain:'bayes probabilidad previa posterior spam actualizar', html:() => `
      ${idea('Bayes es la regla para cambiar de opinión con pruebas: combina lo que creías antes con lo que acabas de ver.')}
      <p>El 30 % de tus correos es spam. La palabra «gratis» aparece en el 40 % de los correos de spam, pero solo en el 5 % de los normales. Te llega un correo con «gratis». ¿Qué probabilidad hay de que sea spam? Como en el nivel 1, lo más claro es contar con <b>1.000 correos</b>:</p>
      ${CH.table(['', 'Correos', 'Con «gratis»'], [['Spam (30 %)', '300', '120 (el 40 %)'], ['Normales (70 %)', '700', '35 (el 5 %)'], ['Total', '1.000', '155']])}
      <p>De los 155 correos con «gratis», 120 son spam: <b>120 / 155 ≈ 77 %</b>. Antes de leer el correo creías un 30 % (la probabilidad <b>previa</b>); después de ver la palabra, un 77 % (la <b>posterior</b>). Cada palabra nueva es otra prueba que vuelve a actualizar la probabilidad.</p>
      <div class="math-block">${U.tex('P(\\text{spam} \\mid \\text{gratis}) = \\frac{P(\\text{gratis} \\mid \\text{spam}) \\cdot P(\\text{spam})}{P(\\text{gratis})} = \\frac{0{,}40 \\cdot 0{,}30}{0{,}155} \\approx 0{,}77')}</div>
      ${enIA('así funcionan los filtros de spam clásicos (Naive Bayes), y es la misma idea que en el nivel 1 con los falsos positivos. En general, un modelo que devuelve probabilidades está diciendo «con lo que he visto, esto es lo que creo».')}` },

    { id:'ejercicios', t:'Ejercicios', plain:'ejercicios soluciones estadística', html:() => `
      <p>Primero en papel, luego compruébalos en Colab con NumPy.</p>
      ${ex(1, 'Las notas de un grupo son 4, 6, 6, 7, 9 y 10. Calcula la media, la mediana y la moda. Si la última nota fuera 100 (un error al teclear), ¿cuál de las tres cambia?', '<p>Media 42 / 6 = <b>7</b>; mediana (6 + 7) / 2 = <b>6,5</b>; moda <b>6</b>. Con el 100, la media sube a 132 / 6 = 22; la mediana y la moda <b>no cambian</b>.</p>', 'con un número par de datos, la mediana es la media de los dos centrales.')}
      ${ex(2, 'Calcula la desviación típica de 2, 4, 4, 4, 5, 5, 7, 9 sin mirar la lección.', '<p>Media 5. Diferencias: −3, −1, −1, −1, 0, 0, 2, 4. Cuadrados: 9, 1, 1, 1, 0, 0, 4, 16; su media es 32 / 8 = 4 (la varianza). Raíz: <b>2</b>.</p>')}
      ${ex(3, 'Las alturas siguen una normal de media 170 cm y desviación típica 8 cm. ¿Entre qué dos valores está el 95 % de la gente? ¿Es raro medir 150 cm?', '<p>Media ± 2 desviaciones: entre <b>154 y 186 cm</b>. 150 cm está a 2,5 desviaciones por debajo: poco frecuente (menos del 1 % de la gente mide eso o menos), pero no imposible.</p>')}
      ${ex(4, '<b>El ejercicio del nivel.</b> Simula el teorema central del límite: toma 10.000 muestras de tamaño 1, 5 y 30 de una exponencial de media 10, calcula sus medias y dibuja los histogramas. ¿Qué forma tienen? ¿Cuánto vale su desviación típica?', '<pre><code>rng = np.random.default_rng(0)\nfor n in (1, 5, 30):\n    medias = rng.exponential(10, (10_000, n)).mean(axis=1)\n    plt.hist(medias, bins=50, alpha=0.5, label=f"n = {n}")\n    print(n, medias.std().round(2))\nplt.legend(); plt.show()</code></pre><p>La forma pasa de muy torcida a campana, y la desviación típica se acerca a 10/√n: unos 10, 4,5 y 1,8.</p>')}
      ${ex(5, 'Una encuesta a 400 personas da una media de 6,2 horas de sueño con desviación típica 1,2. Calcula el intervalo de confianza del 95 %.', '<p>Error estándar = 1,2 / √400 = 1,2 / 20 = 0,06. Intervalo: 6,2 ± 1,96 × 0,06 = 6,2 ± 0,12 → <b>[6,08, 6,32]</b> horas.</p>')}
      ${ex(6, 'Un estudio encuentra que los niños que duermen con la luz encendida tienen más miopía. ¿Significa que la luz causa miopía? Propón una explicación alternativa.', '<p>No necesariamente. Una variable oculta posible: los padres miopes (la miopía es en parte hereditaria) quizá dejan más la luz encendida porque ven peor. Un estudio posterior encontró precisamente esa explicación.</p>')}
      ${ex(7, 'Una nueva versión de una web consigue un 5,4 % de compras frente al 5,0 % de la antigua, y el test da un p-valor de 0,30. ¿Qué concluyes?', '<p>Que <b>no hay pruebas suficientes</b> de que la nueva sea mejor: una diferencia así sale por azar con bastante frecuencia (un 30 % de las veces). Tampoco demuestra que sean iguales; harían falta más datos.</p>')}` },

    { id:'proyecto', t:'Proyecto: correlaciones y outliers en California Housing', plain:'proyecto california housing correlación outliers tope asimetría', html:() => `
      <p><a href="#datasets">California Housing</a> recoge 20.640 barrios de California del censo de 1990: ingresos medianos, edad de las casas, habitaciones, población, situación y el <b>valor mediano de la vivienda</b>. Tu misión: describir los datos como haría un estadístico antes de que nadie entrene un modelo con ellos.</p>
      ${U.code(C_PROJ, 'Solución de referencia')}
      <h4>Lo que deberías encontrar</h4>
      <p><b>1. Una distribución con cola a la derecha.</b> El valor medio es 206.856 $ y la mediana, 179.700 $: la media queda por encima, como pasa siempre que hay unos pocos valores muy altos.</p>
      <p><b>2. Dos «muros» artificiales.</b> 965 barrios tienen un valor exacto de 500.001 $ y 1.273 tienen una edad de 52 años, el máximo. No son casas reales con ese valor exacto: al recoger los datos se <b>recortó</b> todo lo que pasaba de ese tope. Un modelo entrenado con ellos nunca predecirá más de 500.001 $, aunque la casa valga un millón.</p>
      <p><b>3. Los ingresos lo dominan todo.</b></p>
      ${CH.bars([['ingresos medianos', 0.688, true], ['habitaciones por hogar', 0.152], ['habitaciones totales', 0.134], ['edad de la vivienda', 0.106], ['población', -0.025], ['longitud', -0.046], ['latitud', -0.144]], { fmt: v => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2).replace('.', ','), max: 0.7, caption: 'Correlación de cada variable con el valor mediano de la vivienda. Solo los ingresos tienen una relación fuerte. La latitud negativa indica que hacia el norte, de media, las casas valen algo menos, pero eso no es una causa: refleja dónde están las grandes ciudades y la costa.' })}
      <p><b>4. Outliers que son errores… o no.</b> Con la regla de 1,5 × IQR salen 511 barrios con demasiadas habitaciones por hogar; el máximo es 141,9, lo que no es una casa normal. Seguramente son zonas de segundas residencias o de hoteles, con muchas habitaciones y pocos residentes fijos. En los ingresos, los 681 outliers (por encima de 8,01) son barrios ricos reales: no se deben borrar.</p>
      <p><b>5. Una variable de texto que importa mucho.</b> La mediana del valor es 108.500 $ en el interior (<code>INLAND</code>) frente a unos 215.000–234.000 $ cerca del océano o de la bahía.</p>
      ${CH.bars([['Interior', 108500], ['A menos de 1 h del océano', 214850], ['Cerca del océano', 229450], ['Cerca de la bahía', 233800, true]], { fmt: v => v.toLocaleString('es-ES') + ' $', caption: 'Valor mediano de la vivienda según la cercanía al océano. Hay además 5 barrios en una isla, demasiado pocos para sacar conclusiones.' })}
      <p><b>Para ir más allá:</b> (1) repite la correlación entre ingresos y valor sin los barrios del tope: baja de 0,688 a 0,643, porque el recorte distorsiona la relación; (2) dibuja un mapa con <code>plt.scatter(casas.longitude, casas.latitude, c=casas.median_house_value, s=2)</code> y comprueba dónde están las casas caras; (3) cuenta cuántos nulos hay (207, todos en <code>total_bedrooms</code>) y decide cómo rellenarlos.</p>` },

    { id:'test', t:'Test de autoevaluación', plain:'test preguntas autoevaluación estadística', html:() => quiz('nivel-3', [
      { q:'En un barrio, la mayoría gana unos 25.000 € al año y unos pocos, millones. ¿Qué describe mejor al vecino típico?', o:['La media', 'La mediana', 'El máximo', 'La suma'], ok:1, why:'Los pocos valores enormes arrastran la media hacia arriba; la mediana no se ve afectada.' },
      { q:'Dos grupos tienen la misma media, pero uno tiene una desviación típica mucho mayor. Significa que…', o:['Sus datos son más altos', 'Sus datos están más dispersos', 'Tiene más datos', 'Tiene más errores'], ok:1, why:'La desviación típica mide cuánto se alejan los datos de la media.' },
      { q:'En una normal de media 100 y desviación típica 15, ¿qué porcentaje de los datos queda entre 70 y 130?', o:['68 %', 'Alrededor del 95 %', '99,7 %', '50 %'], ok:1, why:'70 y 130 están a 2 desviaciones típicas de la media: ahí cabe el 95 %.' },
      { q:'Según la regla del IQR, un valor es sospechoso de ser outlier si…', o:['Es mayor que la media', 'Queda más allá de 1,5 × IQR por encima de Q3 o por debajo de Q1', 'Es el máximo', 'Aparece una sola vez'], ok:1, why:'Es la regla que dibuja los puntos sueltos de un diagrama de caja.' },
      { q:'¿Qué dice el teorema central del límite?', o:['Que todos los datos son normales', 'Que la media de muchos datos se distribuye como una campana, aunque los datos no lo hagan', 'Que la media siempre es igual a la mediana', 'Que con 30 datos no hay error'], ok:1, why:'Por eso las medias (y los gradientes de un lote) son estimaciones fiables.' },
      { q:'Para reducir a la mitad el error estándar de una media, necesitas…', o:['El doble de datos', 'Cuatro veces más datos', 'La mitad de datos', 'Lo mismo'], ok:1, why:'El error estándar baja como 1/√n: con 4n datos, se divide por √4 = 2.' },
      { q:'¿Qué significa un intervalo de confianza del 95 %?', o:['Que el 95 % de los datos está dentro', 'Que el método acierta con la media real el 95 % de las veces que se usa', 'Que el resultado es correcto al 95 %', 'Que hay un 5 % de datos erróneos'], ok:1, why:'Si repites el experimento muchas veces, el 95 % de los intervalos así calculados contiene el valor real.' },
      { q:'Dos variables tienen r = 0. ¿Qué puedes afirmar?', o:['Que no tienen ninguna relación', 'Que no tienen relación en línea recta; podría haber una curva', 'Que una causa la otra', 'Que son iguales'], ok:1, why:'La correlación de Pearson solo mide relaciones lineales: y = x² puede dar r = 0.' },
      { q:'Las ciudades con más bomberos tienen más incendios. ¿Cuál es la explicación más probable?', o:['Los bomberos provocan incendios', 'Una tercera variable: las ciudades grandes tienen más de las dos cosas', 'Es un error de los datos', 'Los incendios crean bomberos'], ok:1, why:'El tamaño de la ciudad es una variable oculta que aumenta a la vez bomberos e incendios.' },
      { q:'Un test A/B da un p-valor de 0,40. ¿Qué concluyes?', o:['La versión nueva es peor', 'Las dos versiones son exactamente iguales', 'No hay pruebas suficientes de que haya diferencia', 'La versión nueva es mejor al 40 %'], ok:2, why:'Un p-valor alto solo dice que la diferencia observada podría ser azar; no demuestra que sean iguales.' },
    ]) },

    { id:'criterios', t:'¿Has asimilado el nivel?', plain:'criterios completado checklist estadística', html:() => `
      <p>Marca cada punto solo si puedes hacerlo <b>sin mirar la lección</b>. El progreso se guarda solo en este navegador.</p>
      ${checklist('nivel-3', [
        'Sé calcular media, mediana y moda, y explicar cuándo usar la mediana.',
        'Sé calcular una desviación típica a mano y explicar qué significa.',
        'Sé detectar outliers con la regla del IQR y leer un diagrama de caja.',
        'Sé aplicar la regla 68-95-99,7 de la distribución normal.',
        'Sé explicar el teorema central del límite con la simulación de la exponencial.',
        'Sé calcular e interpretar un intervalo de confianza del 95 %.',
        'Sé explicar con un ejemplo por qué correlación no es causalidad.',
        'Sé explicar qué es un p-valor y qué no dice.',
        'He terminado el proyecto de California Housing y sé explicar el problema del tope de 500.001 $.',
        'He sacado al menos 8 de 10 en el test.'])}
      <h4>Para verlo explicado de otra forma</h4>
      ${CH.refs([
        'StatQuest (J. Starmer). Vídeos cortos sobre desviación típica, teorema central del límite, p-valores e intervalos de confianza.',
        'D. Spiegelhalter (2019). <i>The Art of Statistics</i>. Pelican (traducido al español como <i>El arte de la estadística</i>). Estadística sin fórmulas, con ejemplos reales.',
        'P. Bruce, A. Bruce, P. Gedeck (2020). <i>Practical Statistics for Data Scientists</i>, 2.ª ed. O\'Reilly. Capítulos 1 a 3.',
        'R. K. Pace, R. Barry (1997). Sparse spatial autoregressions. <i>Statistics &amp; Probability Letters</i>, 33(3). Origen del dataset California Housing.'])}
      <h4>Ejecuta el código de la lección</h4>
      <p>Todos los ejemplos, las simulaciones y el proyecto, con los datos incluidos:</p>
      ${CH.repo('nivel3_estadistica.py')}
      <p class="next-level">Anterior: <a href="#lesson-2">Nivel 2 · Python</a> · Siguiente: <a href="#path">Nivel 4 · Machine Learning</a> (en preparación) · <a href="#path">Volver a la ruta</a></p>` },
  ],
});
})();
