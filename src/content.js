/* =========================================================================
   ARTÍCULO: RANDOM FOREST (plantilla de 20 secciones)
   Todas las cifras proceden de ejecutar el código de esta página con
   scikit-learn 1.8.0 y NumPy 2.4 (random_state = 42).
   ========================================================================= */
const RF_SCRATCH = `import numpy as np

class Nodo:
    def __init__(self, feature=None, umbral=None, izq=None, der=None, valor=None):
        self.feature, self.umbral, self.izq, self.der, self.valor = feature, umbral, izq, der, valor

def gini(y):
    _, cuentas = np.unique(y, return_counts=True)
    p = cuentas / len(y)
    return 1.0 - np.sum(p ** 2)

class ArbolDecision:
    def __init__(self, max_depth=None, min_samples_split=2, max_features=None, rng=None):
        self.max_depth, self.min_samples_split = max_depth, min_samples_split
        self.max_features, self.rng = max_features, rng or np.random.default_rng()

    def fit(self, X, y):
        self.raiz = self._crecer(X, y, profundidad=0)
        return self

    def _crecer(self, X, y, profundidad):
        if (len(np.unique(y)) == 1 or len(y) < self.min_samples_split
                or (self.max_depth is not None and profundidad >= self.max_depth)):
            return Nodo(valor=np.bincount(y).argmax())
        n_feat = X.shape[1]
        k = self.max_features or n_feat
        candidatas = self.rng.choice(n_feat, k, replace=False)   # aleatoriedad por nodo
        mejor = (None, None, gini(y))
        for f in candidatas:
            for t in np.unique(X[:, f])[:-1]:
                izq = X[:, f] <= t
                g = (izq.sum() * gini(y[izq]) + (~izq).sum() * gini(y[~izq])) / len(y)
                if g < mejor[2]:
                    mejor = (f, t, g)
        f, t, _ = mejor
        if f is None:
            return Nodo(valor=np.bincount(y).argmax())
        izq = X[:, f] <= t
        return Nodo(f, t, self._crecer(X[izq], y[izq], profundidad + 1),
                    self._crecer(X[~izq], y[~izq], profundidad + 1))

    def _predecir_uno(self, x, nodo):
        while nodo.valor is None:
            nodo = nodo.izq if x[nodo.feature] <= nodo.umbral else nodo.der
        return nodo.valor

    def predict(self, X):
        return np.array([self._predecir_uno(x, self.raiz) for x in X])

class RandomForest:
    def __init__(self, n_estimators=100, max_depth=None, max_features="sqrt", seed=0):
        self.n_estimators, self.max_depth = n_estimators, max_depth
        self.max_features, self.rng = max_features, np.random.default_rng(seed)

    def fit(self, X, y):
        n, d = X.shape
        k = int(np.sqrt(d)) if self.max_features == "sqrt" else d
        self.arboles = []
        for _ in range(self.n_estimators):
            idx = self.rng.integers(0, n, n)                       # muestra bootstrap
            arbol = ArbolDecision(self.max_depth, max_features=k, rng=self.rng)
            self.arboles.append(arbol.fit(X[idx], y[idx]))
        return self

    def predict(self, X):
        votos = np.array([a.predict(X) for a in self.arboles])   # (n_arboles, n_muestras)
        return np.apply_along_axis(lambda v: np.bincount(v).argmax(), 0, votos)`;

const RF_DATA = `from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split

datos = load_breast_cancer()
X, y = datos.data, datos.target          # y: 0 = maligno, 1 = benigno
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.25, stratify=y, random_state=42)
print(X_tr.shape, X_te.shape)            # (426, 30) (143, 30)`;

const RF_TRAIN = `from sklearn.ensemble import RandomForestClassifier

modelo = RandomForestClassifier(
    n_estimators=300,
    oob_score=True,        # error out-of-bag gratis
    random_state=42,
    n_jobs=-1,
)
modelo.fit(X_tr, y_tr)
print(f"OOB: {modelo.oob_score_:.3f}")   # 0.962`;

const RF_EVAL = `from sklearn.model_selection import cross_val_score
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)

pred = modelo.predict(X_te)
prob = modelo.predict_proba(X_te)[:, 1]
print(accuracy_score(y_te, pred))        # 0.958
print(roc_auc_score(y_te, prob))         # 0.995
print(confusion_matrix(y_te, pred))      # [[49  4]
                                         #  [ 2 88]]
cv = cross_val_score(RandomForestClassifier(n_estimators=300, random_state=42), X, y, cv=5)
print(cv.mean(), cv.std())               # 0.961  0.025`;

const RF_SKLEARN = `from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

clf = RandomForestClassifier(n_estimators=300, max_features="sqrt", random_state=42)
clf.fit(X_tr, y_tr)
clf.predict(X_te)            # clases
clf.predict_proba(X_te)      # media de las probabilidades de los árboles
clf.feature_importances_     # importancia por reducción media de impureza

reg = RandomForestRegressor(n_estimators=300, max_features=1.0)   # para regresión`;

const RF_SCRATCH_USE = `from sklearn.metrics import accuracy_score

rf = RandomForest(n_estimators=25, max_depth=8, seed=0).fit(X_tr, y_tr)
print(accuracy_score(y_te, rf.predict(X_te)))   # 0.965 (unos 7 s: bucles en Python puro)`;

const RF_EXERCISE = `# Ejercicio: completa la función para calcular el error out-of-bag
# con la clase RandomForest implementada desde cero.
# Pista: guarda los índices bootstrap de cada árbol en fit().

def error_oob(bosque, X, y):
    votos = [[] for _ in range(len(X))]
    for arbol, idx in zip(bosque.arboles, bosque.indices):
        fuera = np.setdiff1d(np.arange(len(X)), idx)
        # ... predice con 'arbol' solo las muestras 'fuera' y guarda el voto
    # ... devuelve la proporción de aciertos con el voto mayoritario
    pass`;

const IMP = [['worst perimeter', 0.1457], ['worst area', 0.1441], ['worst concave points', 0.1146], ['mean concave points', 0.0983], ['worst radius', 0.0724], ['mean radius', 0.0607], ['mean perimeter', 0.0560], ['mean concavity', 0.0452]];
const NEST = [[1, 0.923], [5, 0.937], [10, 0.951], [25, 0.951], [50, 0.951], [100, 0.958], [200, 0.958], [300, 0.958]];

function nestChart() {
  const W = 560, H = 220, pl = 46, pr = 16, pt = 16, pb = 34, lo = 0.90, hi = 0.97;
  const X = i => pl + i / (NEST.length - 1) * (W - pl - pr), Y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
  let g = '';
  [0.90, 0.92, 0.94, 0.96].forEach(v => { g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" class="ax">${(v * 100).toFixed(0)} %</text>`; });
  NEST.forEach(([n], i) => { g += `<text x="${X(i)}" y="${H - pb + 16}" text-anchor="middle" class="ax">${n}</text>`; });
  g += `<text x="${(pl + W - pr) / 2}" y="${H - 4}" text-anchor="middle" class="ax">número de árboles (escala por posición)</text>`;
  g += `<polyline points="${NEST.map(([, v], i) => `${X(i)},${Y(v)}`).join(' ')}" class="ln"/>`;
  NEST.forEach(([n, v], i) => { g += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" class="pt"/>`; });
  g += `<text x="${X(0) + 8}" y="${Y(0.923) + 16}" class="lbl">1 árbol: 92,3 %</text><text x="${X(7)}" y="${Y(0.958) - 10}" text-anchor="end" class="lbl">300 árboles: 95,8 %</text>`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Acierto en test según el número de árboles">${g}</svg><figcaption>Acierto en test según el número de árboles (misma partición, random_state = 42). Más árboles nunca empeoran el modelo; a partir de ~100 se estabiliza.</figcaption></figure>`;
}
function impChart() {
  const mx = IMP[0][1];
  return `<figure class="chart"><div class="hbars">${IMP.map(([n, v]) => `<div class="hb"><span class="hbl">${n}</span><span class="hbt"><i style="width:${v / mx * 100}%"></i></span><span class="hbn">${v.toFixed(3)}</span></div>`).join('')}</div>
    <figcaption>Las 8 variables más importantes según la reducción media de impureza (<code>feature_importances_</code>). Las medidas «worst» (el peor valor de los núcleos de cada imagen) dominan. Esta importancia tiende a favorecer variables continuas o con muchos valores; <code>permutation_importance</code> es una alternativa más fiable.</figcaption></figure>`;
}

const RF_SECTIONS = [
  { id:'que-es', t:'Qué es', plain:'ensemble bagging árboles votación breiman 2001', html:() => `
    <p><b>Random Forest</b> es un método de <i>ensemble</i> para clasificación y regresión. Entrena muchos árboles de decisión, cada uno con una muestra aleatoria de los datos y con un subconjunto aleatorio de variables en cada división, y combina sus predicciones: por votación en clasificación y por media en regresión. Lo propuso Leo Breiman en 2001, a partir de su trabajo anterior sobre <i>bagging</i> (1996).</p>
    <p>Es uno de los algoritmos más usados con datos tabulares: funciona bien sin apenas ajustes, no necesita escalar las variables y da una estimación de su propio error sin reservar datos.</p>` },
  { id:'intuicion', t:'Intuición', plain:'sabiduría de la multitud varianza sesgo decorrelación', html:() => `
    <p>Un árbol de decisión profundo se aprende los datos casi de memoria: tiene poco sesgo pero mucha varianza, porque cambiar unos pocos puntos cambia el árbol entero. La idea del bosque es la de la «sabiduría de la multitud»: si muchos estimadores ruidosos cometen errores <b>distintos</b>, al promediarlos los errores se compensan.</p>
    <p>La clave está en que los errores sean distintos. Si todos los árboles vieran los mismos datos y las mismas variables serían casi idénticos y promediarlos no serviría de nada. Por eso se introduce aleatoriedad por dos vías: cada árbol ve una muestra bootstrap distinta, y en cada nodo solo puede elegir entre unas pocas variables al azar.</p>
    <p class="callout">Pruébalo en el <a href="#lab-tree">laboratorio del árbol de decisión</a>: con el dataset «Ruido», compara un árbol profundo con el botón «Ver Random Forest».</p>` },
  { id:'matematicas', t:'Fundamento matemático', plain:'bootstrap out of bag varianza correlación gini ganancia', html:() => `
    <h4>Por qué promediar reduce el error</h4>
    <p>Si promediamos B variables idénticamente distribuidas, cada una con varianza σ² y correlación ρ entre pares, la varianza de la media es:</p>
    <div class="math-block">${U.tex('\\operatorname{Var}\\!\\left(\\frac{1}{B}\\sum_{b=1}^{B} T_b(x)\\right) = \\rho\\,\\sigma^2 + \\frac{1-\\rho}{B}\\,\\sigma^2')}</div>
    <p>El segundo término desaparece al añadir árboles, pero el primero no: la única forma de bajarlo es reducir la correlación ρ entre árboles. Eso es exactamente lo que hace la selección aleatoria de variables.</p>
    <h4>Bootstrap y datos out-of-bag</h4>
    <p>Cada árbol se entrena con n muestras tomadas con reemplazo. La probabilidad de que una muestra concreta no salga nunca es:</p>
    <div class="math-block">${U.tex('\\left(1 - \\frac{1}{n}\\right)^{n} \\xrightarrow{\\,n\\to\\infty\\,} e^{-1} \\approx 0.368')}</div>
    <p>Así, cada árbol deja fuera en torno al 36,8 % de los datos. Evaluar cada punto solo con los árboles que no lo vieron da el <b>error out-of-bag</b>, una estimación del error de generalización sin necesidad de un conjunto de validación.</p>
    <h4>Criterio de división</h4>
    <p>Cada nodo busca, entre las m variables candidatas, el umbral que más reduce la impureza de Gini:</p>
    <div class="math-block">${U.tex('G(S) = 1 - \\sum_{k} p_k^2, \\qquad \\Delta G = G(S) - \\frac{|S_L|}{|S|}G(S_L) - \\frac{|S_R|}{|S|}G(S_R)')}</div>
    <h4>Predicción</h4>
    <div class="math-block">${U.tex('\\hat{y}_{\\text{clas}}(x) = \\operatorname{moda}\\{T_b(x)\\}_{b=1}^{B}, \\qquad \\hat{y}_{\\text{reg}}(x) = \\frac{1}{B}\\sum_{b=1}^{B} T_b(x)')}</div>
    <p>El valor habitual de m es ${U.tex('\\lfloor\\sqrt{p}\\rfloor', false)} en clasificación, con p el número de variables. scikit-learn, en lugar de contar votos, promedia las probabilidades de clase de los árboles.</p>` },
  { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'pasos bootstrap entrenar árbol votar', html:() => `
    <ol class="steps-ol">
      <li>Elige el número de árboles B y el número de variables candidatas por nodo m.</li>
      <li>Para cada árbol b = 1…B, toma una muestra bootstrap: n filas elegidas al azar con reemplazo.</li>
      <li>Haz crecer un árbol con esa muestra. En cada nodo, escoge m variables al azar y busca el mejor corte solo entre ellas.</li>
      <li>Deja crecer el árbol sin podar, hasta que las hojas sean puras o tengan el mínimo de muestras.</li>
      <li>Para predecir, pasa el nuevo punto por los B árboles y combina las respuestas: voto mayoritario o media.</li>
    </ol>` },
  { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `
    <pre class="pseudo"><code>función RANDOM_FOREST(D, B, m):
    bosque ← []
    para b ← 1 hasta B:
        D_b ← muestra_con_reemplazo(D, |D|)
        T_b ← CRECER_ÁRBOL(D_b, m)
        añadir T_b a bosque
    devolver bosque

función CRECER_ÁRBOL(D, m):
    si D es puro o demasiado pequeño:
        devolver HOJA(clase mayoritaria de D)
    F ← m variables elegidas al azar
    (f, t) ← argmax sobre f ∈ F y umbrales t de ΔGini(D, f, t)
    devolver NODO(f, t, CRECER_ÁRBOL(D[f ≤ t], m), CRECER_ÁRBOL(D[f > t], m))

función PREDECIR(bosque, x):
    devolver moda{ T(x) para T en bosque }</code></pre>` },
  { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy implementación clase nodo árbol gini', html:() => `
    <p>Una implementación completa y funcional en NumPy, pensada para leerse, no para ser rápida. Sigue el algoritmo tal cual: bootstrap, selección aleatoria de variables en cada nodo y voto mayoritario.</p>
    ${U.code(RF_SCRATCH, 'rf_desde_cero.py')}
    ${U.code(RF_SCRATCH_USE, 'Uso')}
    <p>Con 25 árboles de profundidad máxima 8 alcanza un 96,5 % de acierto en el mismo conjunto de test que el modelo de scikit-learn, aunque tarda unos 7 segundos por los bucles de Python frente a menos de uno en scikit-learn.</p>` },
  { id:'sklearn', t:'Implementación con Scikit-learn', plain:'sklearn randomforestclassifier regressor predict_proba', html:() => U.code(RF_SKLEARN, 'Python') },
  { id:'dataset', t:'Dataset de ejemplo', plain:'breast cancer wisconsin 569 30 variables', html:() => `
    <p>Se usa <a href="#datasets">Breast Cancer Wisconsin (Diagnostic)</a>, incluido en scikit-learn: 569 muestras de biopsias con 30 variables numéricas calculadas sobre imágenes de núcleos celulares (10 medidas, como el radio, la textura o la concavidad, cada una en tres versiones: media, error estándar y peor valor). Hay 212 casos malignos y 357 benignos.</p>
    ${U.code(RF_DATA, 'Python')}
    <p>La partición estratificada mantiene la proporción de clases en entrenamiento (426 muestras) y test (143).</p>` },
  { id:'entrenamiento', t:'Entrenamiento', plain:'fit oob_score n_estimators', html:() => `${U.code(RF_TRAIN, 'Python')}<p>El error out-of-bag da un 96,2 % de acierto sin haber tocado el conjunto de test, muy cerca de lo que luego se mide en test.</p>` },
  { id:'evaluacion', t:'Evaluación', plain:'validación cruzada test matriz confusión', html:() => `
    ${U.code(RF_EVAL, 'Python')}
    <div class="tbl"><table><thead><tr><th>Modelo</th><th>Acierto en test</th><th>Validación cruzada (5 particiones)</th></tr></thead><tbody>
      <tr><td>Un árbol de decisión</td><td>92,3 %</td><td>—</td></tr>
      <tr><td>Random Forest desde cero (25 árboles)</td><td>96,5 %</td><td>—</td></tr>
      <tr><td>Random Forest scikit-learn (300 árboles)</td><td><b>95,8 %</b></td><td>96,1 % ± 2,5</td></tr></tbody></table></div>
    <p>La desviación de la validación cruzada (±2,5 puntos) es mayor que la diferencia entre los dos bosques: con 143 muestras de test, esa diferencia no es significativa.</p>` },
  { id:'metricas', t:'Métricas', plain:'precision recall f1 roc auc accuracy', html:() => `
    <div class="math-block">${U.tex('\\text{Precisión} = \\frac{TP}{TP+FP}, \\quad \\text{Recall} = \\frac{TP}{TP+FN}, \\quad F_1 = \\frac{2\\cdot P\\cdot R}{P+R}')}</div>
    <div class="grid g2 tight">
      <div class="tbl"><table><thead><tr><th>Métrica (clase positiva: benigno)</th><th>Valor</th></tr></thead><tbody>
        <tr><td>Acierto</td><td>0,958</td></tr><tr><td>Precisión</td><td>0,957</td></tr><tr><td>Recall</td><td>0,978</td></tr><tr><td>F1</td><td>0,967</td></tr><tr><td>ROC-AUC</td><td>0,995</td></tr></tbody></table></div>
      <div class="tbl"><table class="cm"><thead><tr><th>Real \\ Predicho</th><th>Maligno</th><th>Benigno</th></tr></thead><tbody>
        <tr><th>Maligno</th><td class="ok">49</td><td class="bad">4</td></tr><tr><th>Benigno</th><td class="bad">2</td><td class="ok">88</td></tr></tbody></table></div>
    </div>
    <p>En diagnóstico, el error grave es no detectar un tumor maligno. El recall de la clase maligna es 49 / 53 = 92,5 %: 4 casos malignos se clasificaron como benignos. En un sistema real se bajaría el umbral de decisión para la clase maligna, aceptando más falsas alarmas a cambio de perder menos casos.</p>` },
  { id:'visualizacion', t:'Visualización', plain:'importancia variables gráfico número árboles', html:() => `${impChart()}${nestChart()}<p class="callout">Para ver cómo un árbol divide el espacio y cómo el bosque suaviza la frontera, abre el <a href="#lab-tree">laboratorio del árbol de decisión</a>.</p>` },
  { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul>
    <li>Muy buen rendimiento sin apenas ajustar hiperparámetros.</li>
    <li>No necesita escalar ni normalizar las variables, y maneja relaciones no lineales e interacciones.</li>
    <li>Robusto frente al sobreajuste al añadir árboles: más árboles nunca empeoran el error esperado.</li>
    <li>Error out-of-bag gratis y medidas de importancia de variables.</li>
    <li>Entrenamiento trivialmente paralelizable: cada árbol es independiente.</li></ul>` },
  { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul>
    <li>Menos interpretable que un solo árbol: 300 árboles no se pueden leer.</li>
    <li>No extrapola: en regresión nunca predice fuera del rango visto en entrenamiento.</li>
    <li>Modelos grandes en memoria y predicción más lenta que un modelo lineal.</li>
    <li>La importancia por impureza está sesgada hacia variables continuas o con muchas categorías.</li>
    <li>En datos tabulares, el gradient boosting bien ajustado suele superarlo.</li></ul>` },
  { id:'hiperparametros', t:'Hiperparámetros', plain:'n_estimators max_depth max_features min_samples_leaf class_weight', html:() => `
    <div class="tbl"><table><thead><tr><th>Parámetro (scikit-learn)</th><th>Por defecto</th><th>Efecto</th></tr></thead><tbody>
      <tr><td><code>n_estimators</code></td><td>100</td><td>Número de árboles. Más es mejor hasta que se estabiliza; solo cuesta tiempo.</td></tr>
      <tr><td><code>max_features</code></td><td>"sqrt"</td><td>Variables candidatas por nodo (m). Menos variables, árboles menos correlacionados.</td></tr>
      <tr><td><code>max_depth</code></td><td>None</td><td>Profundidad máxima. Sin límite, los árboles crecen hasta hojas puras.</td></tr>
      <tr><td><code>min_samples_leaf</code></td><td>1</td><td>Mínimo de muestras por hoja. Subirlo suaviza el modelo.</td></tr>
      <tr><td><code>min_samples_split</code></td><td>2</td><td>Mínimo de muestras para dividir un nodo.</td></tr>
      <tr><td><code>bootstrap</code></td><td>True</td><td>Usar muestras bootstrap. Con False, cada árbol ve todos los datos.</td></tr>
      <tr><td><code>max_samples</code></td><td>None</td><td>Tamaño de cada muestra bootstrap; útil con datasets grandes.</td></tr>
      <tr><td><code>class_weight</code></td><td>None</td><td>"balanced" compensa clases desbalanceadas.</td></tr>
      <tr><td><code>oob_score</code></td><td>False</td><td>Calcula el acierto out-of-bag al entrenar.</td></tr>
      <tr><td><code>criterion</code></td><td>"gini"</td><td>También "entropy" o "log_loss".</td></tr></tbody></table></div>` },
  { id:'casos-de-uso', t:'Casos de uso', plain:'casos de uso', html:() => `<ul>
    <li>Línea base sólida para cualquier problema tabular antes de probar modelos más complejos.</li>
    <li>Scoring de riesgo de crédito y detección de fraude.</li>
    <li>Diagnóstico médico a partir de mediciones clínicas.</li>
    <li>Selección de variables mediante su importancia.</li>
    <li>Imputación de valores faltantes (MissForest).</li></ul>` },
  { id:'industria', t:'Aplicaciones industriales', plain:'industria mantenimiento predictivo telecomunicaciones energía', html:() => `<ul>
    <li><b>Mantenimiento predictivo:</b> predecir fallos de máquina a partir de sensores de temperatura, par y desgaste. Ver el <a href="#project-mantenimiento">proyecto de mantenimiento predictivo</a>.</li>
    <li><b>Telecomunicaciones:</b> predicción de bajas de clientes y detección de anomalías en red.</li>
    <li><b>Energía:</b> previsión de demanda y detección de fallos en aerogeneradores.</li>
    <li><b>Control de calidad:</b> clasificar piezas defectuosas a partir de mediciones de proceso.</li></ul>` },
  { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio oob', html:() => `<p>Amplía la implementación desde cero para que calcule el error out-of-bag. Debes guardar los índices bootstrap de cada árbol y, para cada muestra, votar solo con los árboles que no la vieron. Comprueba que el resultado se acerca al 96,2 % que da scikit-learn.</p>${U.code(RF_EXERCISE, 'Plantilla')}` },
  { id:'codigo', t:'Código completo', plain:'código descargable script colab github', html:() => `<p>El script completo con todos los experimentos de esta página está en el repositorio y se puede ejecutar en Google Colab sin instalar nada:</p>${CH.repo('random_forest.py')}<p>O cópialo desde aquí:</p>${U.code(RF_SCRATCH + '\n\n' + RF_DATA + '\n\n' + RF_SCRATCH_USE + '\n\n' + RF_TRAIN + '\n\n' + RF_EVAL, 'random_forest_completo.py')}` },
  { id:'referencias', t:'Referencias y papers', plain:'referencias breiman ho hastie', html:() => `<ol class="refs">
    <li>L. Breiman (2001). «Random Forests». <i>Machine Learning</i>, 45(1), 5–32.</li>
    <li>L. Breiman (1996). «Bagging Predictors». <i>Machine Learning</i>, 24(2), 123–140.</li>
    <li>T. K. Ho (1995). «Random Decision Forests». <i>Proceedings of the 3rd International Conference on Document Analysis and Recognition</i>, 278–282.</li>
    <li>T. Hastie, R. Tibshirani, J. Friedman (2009). <i>The Elements of Statistical Learning</i>, 2.ª ed., capítulo 15. Springer.</li>
    <li>F. Pedregosa et al. (2011). «Scikit-learn: Machine Learning in Python». <i>JMLR</i>, 12, 2825–2830.</li></ol>` },
];

function articleLayout(crumbs, head, sections, prefix) {
  return crumbs + `<div class="article">
    <nav class="toc" aria-label="Contenido del artículo"><span class="toc-t">Contenido</span><ol>${sections.map((s, i) => `<li><a href="#${prefix}${s.id}" data-target="${prefix}${s.id}"><span>${String(i + 1).padStart(2, '0')}</span>${s.t}</a></li>`).join('')}</ol></nav>
    <article class="prose">${head}${sections.map((s, i) => `<section id="${prefix}${s.id}" class="sec"><h2><span class="n">${String(i + 1).padStart(2, '0')}</span>${s.t}</h2>${s.html()}</section>`).join('')}</article></div>`;
}
/* Registro de artículos: cada uno con la plantilla homogénea de secciones. */
const ARTICLES = [
  { id:'random-forest', area:'ml', areaName:'Machine Learning', title:'Random Forest', lab:'tree', prefix:'rf-', sections: RF_SECTIONS,
    kicker:'Machine Learning · Ensembles · Artículo completo',
    lede:'Cómo muchos árboles mediocres forman un modelo excelente: intuición, matemáticas, implementación desde cero, scikit-learn y resultados reales.',
    teaser:'De la intuición a la implementación desde cero en NumPy, con resultados reales sobre el dataset Breast Cancer Wisconsin: 95,8 % de acierto en test y 0,995 de ROC-AUC.',
    meta:'Resultados obtenidos con scikit-learn 1.8.0 y NumPy 2.4 · random_state = 42' },
];
function ARTICLE_PAGE(id) {
  const ar = ARTICLES.find(a => a.id === id);
  return articleLayout(C.crumbs([['Inicio', 'home'], [ar.areaName, ar.area], [ar.title]]),
    `<header class="page-head in-article"><span class="kicker">${ar.kicker}</span><h1>${ar.title}</h1>
     <p class="lede">${ar.lede}</p>
     <p class="meta">${ar.meta}${ar.lab ? ` · <a href="#lab-${ar.lab}">Laboratorio relacionado</a>` : ''}</p></header>`,
    ar.sections, ar.prefix);
}

/* =========================================================================
   PROYECTO: MANTENIMIENTO PREDICTIVO (plantilla de 10 etapas)
   ========================================================================= */
const PM_STAGES = [
  { t:'Problema', plain:'fallos máquina fresadora coste parada', html:() => `<p>Una parada no planificada de una máquina herramienta cuesta mucho más que una intervención programada. El objetivo es predecir si una operación de fresado terminará en fallo a partir de variables de proceso, para intervenir antes.</p>
    <p><b>Tipo de problema:</b> clasificación binaria muy desbalanceada. <b>Métrica principal:</b> recall de la clase «fallo» con una precisión mínima aceptable, y área bajo la curva precisión-recall (PR-AUC), más informativa que el acierto cuando los positivos son pocos.</p>` },
  { t:'Datos', plain:'ai4i 2020 uci 10000 sintético', html:() => `<p>Dataset <a href="#datasets">AI4I 2020 Predictive Maintenance</a> del UCI Machine Learning Repository: 10.000 registros sintéticos que reproducen datos industriales reales. Variables: tipo de producto (L, M, H según calidad), temperatura del aire y del proceso (K), velocidad de giro (rpm), par (Nm) y desgaste de la herramienta (min). La etiqueta <code>Machine failure</code> vale 1 cuando se produce alguno de los cinco modos de fallo (desgaste de herramienta, disipación de calor, potencia, sobreesfuerzo y aleatorio).</p>` },
  { t:'Exploración', plain:'desbalance distribuciones correlaciones', html:() => `<p>Qué mirar primero: la proporción de fallos (en torno al 3 %, así que un modelo que diga siempre «no falla» acertaría el 97 % y no serviría de nada), las distribuciones de cada variable por clase y las correlaciones. Temperatura del aire y del proceso están muy correlacionadas, y velocidad y par tienen una relación inversa.</p>
    ${U.code(`import pandas as pd\n\ndf = pd.read_csv("data/ai4i2020.csv")\nprint(df["Machine failure"].mean())            # proporción de fallos\nprint(df.groupby("Machine failure").mean(numeric_only=True))\ndf.hist(figsize=(12, 8))`, 'notebooks/01_exploracion.py')}` },
  { t:'Preprocesado', plain:'fuga de datos one-hot variables derivadas potencia', html:() => `<p><b>Evitar la fuga de información:</b> las columnas de los cinco modos de fallo (TWF, HDF, PWF, OSF, RNF) describen el propio fallo, así que se eliminan de las entradas, igual que los identificadores. El tipo de producto se codifica con one-hot. Se añaden variables con significado físico: potencia mecánica, diferencia de temperaturas y desgaste por par.</p>
    ${U.code(`import numpy as np\n\nX = df.drop(columns=["UDI", "Product ID", "Machine failure", "TWF", "HDF", "PWF", "OSF", "RNF"])\nX = pd.get_dummies(X, columns=["Type"])\nX["potencia_W"] = X["Torque [Nm]"] * X["Rotational speed [rpm]"] * 2 * np.pi / 60\nX["delta_T"] = X["Process temperature [K]"] - X["Air temperature [K]"]\nX["desgaste_par"] = X["Tool wear [min]"] * X["Torque [Nm]"]\ny = df["Machine failure"]`, 'src/features.py')}` },
  { t:'Modelo', plain:'random forest gradient boosting class weight', html:() => `<p>Línea base con regresión logística y, como modelo principal, un <a href="#random-forest">Random Forest</a> con <code>class_weight="balanced"</code> para compensar el desbalance. Como alternativa, gradient boosting (XGBoost o LightGBM), que suele rendir mejor en datos tabulares.</p>` },
  { t:'Entrenamiento', plain:'estratificado validación cruzada', html:() => `${U.code(`from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score\nfrom sklearn.ensemble import RandomForestClassifier\n\nX_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)\nmodelo = RandomForestClassifier(n_estimators=400, class_weight="balanced", random_state=42, n_jobs=-1)\ncv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)\nprint(cross_val_score(modelo, X_tr, y_tr, cv=cv, scoring="average_precision"))\nmodelo.fit(X_tr, y_tr)`, 'src/train.py')}` },
  { t:'Evaluación', plain:'pr auc matriz confusión recall', html:() => `<p>Se evalúa en el conjunto de test reservado con PR-AUC, recall y precisión de la clase «fallo» y la matriz de confusión. Además se compara con la línea base para comprobar que el modelo aporta algo.</p>
    ${U.code(`from sklearn.metrics import average_precision_score, classification_report\n\nprob = modelo.predict_proba(X_te)[:, 1]\nprint(average_precision_score(y_te, prob))\nprint(classification_report(y_te, prob > 0.5))`, 'src/evaluate.py')}` },
  { t:'Optimización', plain:'umbral coste búsqueda hiperparámetros', html:() => `<p>Dos palancas. La primera, los hiperparámetros, con búsqueda aleatoria y validación cruzada estratificada. La segunda, y la que más importa en negocio, el <b>umbral de decisión</b>: se elige el que minimiza el coste esperado, dado lo que cuesta una parada no detectada frente a una revisión innecesaria.</p>
    ${U.code(`coste_fn, coste_fp = 5000, 300          # € por fallo no detectado / por revisión innecesaria\numbrales = np.linspace(0.05, 0.95, 91)\ncoste = [coste_fn * ((prob < u) & (y_te == 1)).sum() + coste_fp * ((prob >= u) & (y_te == 0)).sum() for u in umbrales]\numbral = umbrales[int(np.argmin(coste))]`, 'src/threshold.py')}` },
  { t:'Despliegue', plain:'fastapi docker api validación', html:() => `<p>El modelo se sirve con una API FastAPI dentro de Docker. Pydantic valida cada entrada con rangos físicos plausibles, de modo que una lectura imposible devuelve un error 422 en lugar de una predicción sin sentido.</p>
    ${U.code(`from fastapi import FastAPI\nfrom pydantic import BaseModel, Field\nimport joblib\n\napp = FastAPI(title="Mantenimiento predictivo")\nmodelo = joblib.load("models/rf_ai4i.joblib")\n\nclass Lectura(BaseModel):\n    tipo: str = Field(pattern="^[LMH]$")\n    temp_aire_K: float = Field(ge=250, le=350)\n    temp_proceso_K: float = Field(ge=250, le=380)\n    rpm: float = Field(gt=0, le=5000)\n    par_Nm: float = Field(ge=0, le=150)\n    desgaste_min: float = Field(ge=0, le=400)\n\n@app.post("/predict")\ndef predecir(l: Lectura):\n    x = construir_features(l)          # mismas transformaciones que en entrenamiento\n    p = float(modelo.predict_proba(x)[0, 1])\n    return {"prob_fallo": p, "alerta": p >= UMBRAL}`, 'backend/app/main.py')}` },
  { t:'Resultados', plain:'resultados pendiente', html:() => `<div class="callout warn"><b>Pendiente de ejecución.</b> Este proyecto está documentado como plan técnico con su código, pero todavía no se ha ejecutado sobre el dataset. Cuando se ejecute, aquí aparecerán las métricas reales, la curva precisión-recall, el umbral elegido y el notebook completo. No se publican cifras que no se hayan obtenido.</div>` },
];
function PM_PAGE() {
  const secs = PM_STAGES.map(s => ({ ...s, id: U.slug(s.t) }));
  return articleLayout(C.crumbs([['Inicio', 'home'], ['Proyectos', 'projects'], ['Mantenimiento predictivo']]),
    `<header class="page-head in-article"><span class="kicker">Proyecto · Industria 4.0 · Plan detallado</span><h1>Mantenimiento predictivo en fresadoras</h1>
     <p class="lede">Predecir fallos de máquina con variables de proceso para programar el mantenimiento antes de la avería.</p>
     <ol class="pipeline">${secs.map((s, i) => `<li>${s.t}</li>`).join('')}</ol></header>`,
    secs, 'pm-');
}

/* =========================================================================
   ARQUITECTURA (página «Sobre el portal»)
   ========================================================================= */
const ARCH = `
<section class="prose wide">
  <h2>Qué es este prototipo</h2>
  <p>Una aplicación de una sola página, autocontenida, sin servidor: todo el contenido vive como datos estructurados y se renderiza en el navegador. Está organizada igual que la plataforma final (contenido separado de la presentación, un esquema de documento común para el buscador y laboratorios como módulos independientes), para que migrar sea mover piezas y no reescribirlas.</p>
  <h2>Stack de producción previsto</h2>
  <div class="tbl"><table><thead><tr><th>Capa</th><th>Tecnología</th><th>En este prototipo</th></tr></thead><tbody>
    <tr><td>Frontend</td><td>Next.js (App Router), React, TypeScript estricto, Tailwind CSS</td><td>HTML, CSS y JavaScript sin dependencias</td></tr>
    <tr><td>Contenido</td><td>MDX en <code>/content</code> con frontmatter tipado</td><td>Objetos JS en un único módulo de datos</td></tr>
    <tr><td>Matemáticas</td><td>KaTeX renderizado en servidor</td><td>KaTeX en el navegador, salida MathML</td></tr>
    <tr><td>Visualización</td><td>D3, Plotly y Recharts</td><td>Canvas y SVG a mano</td></tr>
    <tr><td>Backend</td><td>Python + FastAPI</td><td>—</td></tr>
    <tr><td>Datos</td><td>PostgreSQL + pgvector</td><td>—</td></tr>
    <tr><td>Búsqueda</td><td>Híbrida: texto completo + similitud de embeddings, preparada para RAG</td><td>Índice en memoria con el mismo esquema de documento</td></tr>
    <tr><td>Despliegue</td><td>Docker Compose (frontend, backend, db), CI con GitHub Actions</td><td>—</td></tr></tbody></table></div>
  <h2>Estructura del repositorio</h2>
  <pre class="tree"><code>/frontend        Next.js: app/, components/, lib/, labs/ (un módulo por laboratorio)
/backend         FastAPI: app/api, app/services, app/models, app/search (pgvector)
/content         MDX: machine-learning/, deep-learning/, mathematics/, llm/, papers/, projects/
/data            datasets de ejemplo y scripts de descarga
/notebooks       un notebook por artículo y por proyecto
/models          modelos entrenados versionados
/public          imágenes y recursos estáticos
/docs            arquitectura, decisiones (ADR), guía de contenido
/tests           unitarios (Vitest, pytest) y end-to-end (Playwright)
/docker          Dockerfiles y docker-compose.yml</code></pre>
  <h2>URLs semánticas</h2>
  <div class="tbl"><table><thead><tr><th>Prototipo</th><th>Producción</th></tr></thead><tbody>
    <tr><td><code>#random-forest</code></td><td><code>/machine-learning/random-forest</code></td></tr>
    <tr><td><code>#transformer</code></td><td><code>/llm/transformer-visualizer</code></td></tr>
    <tr><td><code>#lab-gd</code></td><td><code>/lab/gradient-descent</code></td></tr>
    <tr><td><code>#project-mantenimiento</code></td><td><code>/projects/predictive-maintenance</code></td></tr>
    <tr><td><code>#papers</code></td><td><code>/papers/attention-is-all-you-need</code> (una página por paper)</td></tr></tbody></table></div>
  <h2>Modelo de datos</h2>
  <p>Una entidad común <code>Document</code> (id, tipo, slug, título, resumen, cuerpo, área, nivel, etiquetas, fechas) de la que heredan Artículo, Algoritmo, Proyecto, Paper, Dataset y Laboratorio. Cada documento se trocea en fragmentos (<code>Chunk</code>) con su embedding en una columna <code>vector</code> de pgvector: esa misma tabla sirve para la búsqueda semántica y para el RAG. El buscador de este prototipo ya indexa documentos con los campos id, tipo, título, texto y ruta.</p>
  <h2>SEO, seguridad y calidad</h2>
  <ul>
    <li><b>SEO:</b> en producción, cada página con title, meta description, Open Graph, canonical, JSON-LD (Article, Dataset, ScholarlyArticle), sitemap.xml y robots.txt generados en el build.</li>
    <li><b>Seguridad:</b> validación con Pydantic en la API, rate limiting, cabeceras CSP y HSTS, secretos solo en variables de entorno del servidor y nunca claves de API en el frontend. En este prototipo, todo texto introducido por el usuario se escapa antes de mostrarse.</li>
    <li><b>Accesibilidad:</b> navegación completa por teclado, foco visible, modo claro y oscuro, respeto a <code>prefers-reduced-motion</code>.</li>
  </ul>
  <h2>Fases</h2>
  <ol>
    <li>Prototipo navegable con el contenido núcleo (esta versión).</li>
    <li>Migración a Next.js con el contenido en MDX y tests.</li>
    <li>Backend FastAPI, PostgreSQL y Docker Compose.</li>
    <li>Búsqueda semántica con pgvector y asistente RAG sobre el contenido del portal.</li>
    <li>Ampliación del contenido: un artículo completo por algoritmo y un laboratorio por concepto clave.</li>
  </ol>
</section>`;
