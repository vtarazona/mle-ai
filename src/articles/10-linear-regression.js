/* =========================================================================
   ARTÍCULO: REGRESIÓN LINEAL
   Cifras obtenidas con notebooks/linear_regression.py (scikit-learn 1.8.0,
   NumPy 2.4, random_state = 42).
   ========================================================================= */
(() => {
const NE = `import numpy as np

# Añadimos una columna de unos para el término independiente (sesgo)
Xb = np.c_[np.ones(len(X_tr)), X_tr]

# Ecuación normal: (XᵀX) w = Xᵀy  → se resuelve el sistema, no se invierte la matriz
w = np.linalg.solve(Xb.T @ Xb, Xb.T @ y_tr)

pred = np.c_[np.ones(len(X_te)), X_te] @ w`;

const GD = `from sklearn.preprocessing import StandardScaler

sc = StandardScaler().fit(X_tr)                 # el descenso de gradiente necesita escalas parecidas
Xs, Xts = sc.transform(X_tr), sc.transform(X_te)

w, b, eta = np.zeros(X.shape[1]), 0.0, 0.1
for paso in range(2000):
    error = Xs @ w + b - y_tr
    w -= eta * 2 * Xs.T @ error / len(y_tr)     # ∂MSE/∂w
    b -= eta * 2 * error.mean()                 # ∂MSE/∂b

pred_gd = Xts @ w + b`;

const SK = `from sklearn.linear_model import LinearRegression

modelo = LinearRegression().fit(X_tr, y_tr)
modelo.coef_         # un peso por variable
modelo.intercept_    # término independiente
modelo.predict(X_te)`;

const DATA = `from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split

X, y = load_diabetes(return_X_y=True)          # 442 pacientes, 10 variables
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)`;

const EVAL = `from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import cross_val_score

pred = modelo.predict(X_te)
print(mean_squared_error(y_te, pred) ** 0.5)   # RMSE  53.85
print(mean_absolute_error(y_te, pred))         # MAE   42.79
print(r2_score(y_te, pred))                    # R²    0.453
print(cross_val_score(LinearRegression(), X, y, cv=5, scoring="r2").mean())   # 0.482`;

const EX = `# Ejercicio: añade términos cuadráticos y de interacción y compara el R² en test.
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from sklearn.linear_model import Ridge

for grado in (1, 2, 3):
    m = make_pipeline(PolynomialFeatures(grado), Ridge(alpha=0.1)).fit(X_tr, y_tr)
    # ... imprime m.score(X_tr, y_tr) y m.score(X_te, y_te). ¿A partir de qué grado sobreajusta?`;

ARTICLES.push({
  id:'linear-regression', area:'ml', areaName:'Machine Learning', title:'Regresión lineal', lab:'overfit', prefix:'lr-',
  kicker:'Machine Learning · Regresión · Artículo completo',
  lede:'El modelo más sencillo y más usado para predecir un número: mínimos cuadrados, ecuación normal, descenso de gradiente y cómo leer sus coeficientes, con resultados reales.',
  teaser:'Ecuación normal y descenso de gradiente desde cero, comparados con scikit-learn sobre el dataset Diabetes: R² de 0,45 en test y por qué los coeficientes pueden engañar.',
  meta:'Resultados obtenidos con scikit-learn 1.8.0 y NumPy 2.4 · random_state = 42',
  sections: [
    { id:'que-es', t:'Qué es', plain:'regresión lineal mínimos cuadrados predecir número', html:() => `
      <p>La <b>regresión lineal</b> predice un valor numérico como una suma ponderada de las variables de entrada más un término independiente. Aprender el modelo es encontrar los pesos que hacen que esa suma se parezca lo más posible a los valores reales, normalmente minimizando el error cuadrático medio (<i>mínimos cuadrados</i>, un método que publicó Legendre en 1805 y que Gauss usaba desde antes).</p>
      <p>Es la línea base de cualquier problema de regresión: rápida, interpretable y, sorprendentemente a menudo, difícil de superar cuando hay pocos datos.</p>` },
    { id:'intuicion', t:'Intuición', plain:'recta nube de puntos pendiente', html:() => `
      <p>Con una sola variable, es trazar la recta que mejor atraviesa una nube de puntos: la que hace más pequeña la suma de las distancias verticales al cuadrado. Elevar al cuadrado castiga mucho los errores grandes y hace que el problema tenga una solución única y cerrada.</p>
      <p>Con varias variables la recta se convierte en un hiperplano, y cada peso responde a la pregunta: «si esta variable sube una unidad y las demás no cambian, ¿cuánto cambia la predicción?».</p>
      <p class="callout">En el <a href="#lab-overfit">laboratorio de sobreajuste</a>, el grado 1 es exactamente una regresión lineal. Sube el grado para ver qué pasa al darle más flexibilidad.</p>` },
    { id:'matematicas', t:'Fundamento matemático', plain:'ecuación normal mse gradiente', html:() => `
      <p>El modelo y la función de pérdida:</p>
      <div class="math-block">${U.tex('\\hat{y} = w_0 + \\sum_{j=1}^{p} w_j x_j = X w, \\qquad \\text{MSE}(w) = \\frac{1}{n}\\lVert y - Xw \\rVert^2')}</div>
      <p>Como la pérdida es una parábola en w (convexa), su mínimo está donde el gradiente es cero. Eso da la <b>ecuación normal</b>:</p>
      <div class="math-block">${U.tex('\\nabla_w \\text{MSE} = -\\frac{2}{n} X^{\\top}(y - Xw) = 0 \\;\\Longrightarrow\\; X^{\\top}X\\,w = X^{\\top}y')}</div>
      <p>Si hay muchas variables o muchos datos, resolver ese sistema es caro y se usa el <b>descenso de gradiente</b>, que da pasos en contra del gradiente:</p>
      <div class="math-block">${U.tex('w \\leftarrow w - \\eta \\cdot \\frac{2}{n} X^{\\top}(Xw - y)')}</div>
      <p>Añadir un castigo ${U.tex('\\lambda \\lVert w \\rVert^2', false)} a la pérdida da la <b>regresión Ridge</b>, cuya solución es ${U.tex('(X^{\\top}X + \\lambda I)^{-1}X^{\\top}y', false)}: más estable cuando las variables están correlacionadas.</p>` },
    { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'pasos', html:() => `<ol class="steps-ol">
      <li>Reúne las variables en una matriz X (n filas, p columnas) y añade una columna de unos para el término independiente.</li>
      <li>Si vas a usar descenso de gradiente, estandariza las variables (media 0, desviación 1).</li>
      <li>Calcula los pesos: con la ecuación normal (resolviendo el sistema) o iterando el descenso de gradiente.</li>
      <li>Predice multiplicando las nuevas filas por los pesos.</li>
      <li>Evalúa en datos no vistos con RMSE, MAE y R², y revisa los residuos.</li></ol>` },
    { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `<pre class="pseudo"><code>función AJUSTAR_ECUACIÓN_NORMAL(X, y):
    X ← [1 | X]                     # columna de unos
    resolver (XᵀX) w = Xᵀy
    devolver w

función AJUSTAR_GRADIENTE(X, y, η, pasos):
    w ← 0 ; b ← 0
    repetir pasos veces:
        e ← X·w + b − y
        w ← w − η · (2/n) · Xᵀe
        b ← b − η · (2/n) · Σe
    devolver w, b

función PREDECIR(w, x):
    devolver w₀ + Σ wⱼ·xⱼ</code></pre>` },
    { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy ecuación normal descenso gradiente', html:() => `
      <h4>Con la ecuación normal</h4>${U.code(NE)}
      <h4>Con descenso de gradiente</h4>${U.code(GD)}
      <p>Las dos llegan al mismo sitio. La ecuación normal da exactamente las mismas predicciones que scikit-learn (RMSE 53,85 en test). El descenso de gradiente, tras 2.000 pasos, también da un RMSE de 53,85 y difiere de scikit-learn en menos de 0,3 unidades en cualquier predicción.</p>
      ${CH.line({ xs:['0', '10', '50', '100', '500', '2000'], series:[{ name:'MSE en entrenamiento', pts:[[0, 29711.3], [1, 3188.8], [2, 2894.7], [3, 2890.3], [4, 2873.5], [5, 2868.6]] }],
        ymin:0, ymax:30000, yticks:[0, 10000, 20000, 30000], yfmt:v => (v / 1000) + ' k', xlabel:'paso del descenso de gradiente (escala por posición)', aria:'Error de entrenamiento durante el descenso de gradiente',
        caption:'El error cae de 29.711 a 3.189 en solo 10 pasos y después afina despacio hasta 2.869: la forma típica del descenso de gradiente en un problema convexo.' })}` },
    { id:'sklearn', t:'Implementación con Scikit-learn', plain:'linearregression sklearn', html:() => `${U.code(SK)}<p><code>LinearRegression</code> resuelve mínimos cuadrados con una descomposición numérica estable, sin necesidad de escalar las variables. Para regularizar, <code>Ridge</code>, <code>Lasso</code> y <code>ElasticNet</code> tienen la misma interfaz.</p>` },
    { id:'dataset', t:'Dataset de ejemplo', plain:'diabetes 442 pacientes 10 variables', html:() => `
      <p>Se usa el dataset <b>Diabetes</b> incluido en scikit-learn, publicado por Efron, Hastie, Johnstone y Tibshirani (2004): 442 pacientes con 10 variables medidas al inicio (edad, sexo, índice de masa corporal, tensión arterial media y seis análisis de sangre, <code>s1</code> a <code>s6</code>). El objetivo es una medida cuantitativa de la progresión de la enfermedad un año después, entre 25 y 346 (media 152,1).</p>
      <p>En la versión de scikit-learn las variables vienen ya centradas y escaladas, por eso los coeficientes no están en unidades físicas.</p>${U.code(DATA)}` },
    { id:'entrenamiento', t:'Entrenamiento', plain:'fit', html:() => `<p>Con 353 filas de entrenamiento y 10 variables, <code>fit</code> tarda milisegundos. No hay hiperparámetros que ajustar en la versión básica; en Ridge o Lasso, la fuerza de la regularización se elige con validación cruzada (<code>RidgeCV</code>, <code>LassoCV</code>).</p>` },
    { id:'evaluacion', t:'Evaluación', plain:'rmse r2 validación cruzada línea base', html:() => `${U.code(EVAL)}
      ${CH.table(['Modelo', 'RMSE en test', 'R² en test'], [['Predecir siempre la media', '73,22', '0'], ['Solo el índice de masa corporal', '—', '0,233'], ['Regresión lineal (10 variables)', '<b>53,85</b>', '<b>0,453</b>'], ['Ridge, λ = 0,1', '—', '0,461']])}
      <p>El modelo reduce el error un 26 % respecto a predecir la media. Su R² en entrenamiento es 0,528 y en test 0,453: la diferencia es pequeña, así que no hay sobreajuste importante. La validación cruzada de 5 particiones da un R² de 0,482 ± 0,049, más fiable que una sola partición.</p>` },
    { id:'metricas', t:'Métricas', plain:'rmse mae r2 fórmulas', html:() => `
      <div class="math-block">${U.tex('\\text{RMSE} = \\sqrt{\\tfrac{1}{n}\\sum (y_i-\\hat{y}_i)^2}, \\quad \\text{MAE} = \\tfrac{1}{n}\\sum |y_i-\\hat{y}_i|, \\quad R^2 = 1 - \\frac{\\sum (y_i-\\hat{y}_i)^2}{\\sum (y_i-\\bar{y})^2}')}</div>
      <p>El RMSE está en las mismas unidades que el objetivo y castiga más los errores grandes; el MAE es más robusto frente a valores extremos. El R² es la fracción de la varianza explicada: 0 equivale a predecir la media y 1 a acertar siempre. Un R² de 0,45 significa que el modelo explica algo menos de la mitad de la variación entre pacientes, lo esperable con 10 medidas clínicas para un fenómeno tan complejo.</p>` },
    { id:'visualizacion', t:'Visualización', plain:'coeficientes multicolinealidad', html:() => `
      ${CH.bars([['s1 · colesterol total', -931.5], ['s5 · log triglicéridos', 736.2, true], ['bmi · masa corporal', 542.4, true], ['s2 · LDL', 518.1], ['bp · tensión media', 347.7], ['s4 · colesterol/HDL', 275.3], ['sex', -242.0], ['s3 · HDL', 163.4], ['s6 · glucosa', 48.7], ['age', 37.9]], { fmt: v => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(0), caption:'Coeficientes del modelo (en valor absoluto; el signo va a la derecha). Destacadas: las dos variables que más importan según el gradient boosting del artículo siguiente.' })}
      <p>Cuidado al leerlos: <code>s1</code> (colesterol total) tiene el coeficiente más grande y negativo, y <code>s2</code> (LDL) uno grande y positivo. No significa que el colesterol proteja: las dos variables están muy correlacionadas y el modelo compensa una con la otra. Es la <b>multicolinealidad</b>. Ridge reduce este efecto repartiendo el peso entre variables correlacionadas.</p>` },
    { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul><li>Muy rápida de entrenar y de ejecutar, incluso con millones de filas.</li><li>Interpretable: cada peso tiene un significado directo (con las precauciones de arriba).</li><li>Solución única y exacta; no depende de semillas aleatorias.</li><li>Con pocos datos suele generalizar mejor que modelos más complejos.</li><li>Base teórica muy estudiada: intervalos de confianza, contrastes, diagnóstico de residuos.</li></ul>` },
    { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul><li>Solo captura relaciones lineales, salvo que añadas tú las transformaciones (cuadrados, interacciones, logaritmos).</li><li>Sensible a valores atípicos, porque el error se eleva al cuadrado.</li><li>Los coeficientes se vuelven inestables con variables muy correlacionadas.</li><li>Puede predecir valores imposibles (negativos, fuera de rango).</li></ul>` },
    { id:'hiperparametros', t:'Hiperparámetros', plain:'fit_intercept positive alpha', html:() => CH.hp([
      ['fit_intercept', 'True', 'Aprende el término independiente w₀. Casi siempre debe quedarse activado.'],
      ['positive', 'False', 'Obliga a que todos los pesos sean ≥ 0 (útil si el signo tiene que ser positivo por el problema).'],
      ['alpha (Ridge / Lasso)', '1.0', 'Fuerza de la regularización. Con Ridge en este dataset, α = 0,1 da el mejor R² en test (0,461); α = 10 lo hunde a 0,161.'],
      ['l1_ratio (ElasticNet)', '0.5', 'Mezcla entre L1 (Lasso) y L2 (Ridge).']]) + `<p>Sobre L1 y L2, ver el <a href="#lab-reg">laboratorio Lasso contra Ridge</a>.</p>` },
    { id:'casos-de-uso', t:'Casos de uso', plain:'casos de uso', html:() => `<ul><li>Línea base obligatoria antes de probar cualquier modelo de regresión.</li><li>Precios (vivienda, seguros) cuando la interpretabilidad importa.</li><li>Estimar el efecto de una variable controlando por otras (econometría, estudios clínicos).</li><li>Previsión de demanda simple con variables de calendario.</li></ul>` },
    { id:'industria', t:'Aplicaciones industriales', plain:'industria calibración sensores energía', html:() => `<ul><li><b>Calibración de sensores:</b> relacionar la lectura bruta con el valor real.</li><li><b>Energía:</b> consumo en función de temperatura, hora y día de la semana.</li><li><b>Telecomunicaciones:</b> estimar tráfico o latencia a partir de la carga de la red.</li><li><b>Procesos industriales:</b> modelos de sustitución (<i>soft sensors</i>) que estiman una variable cara de medir a partir de otras baratas.</li></ul>` },
    { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio polinómico', html:() => `<p>Añade términos polinómicos y compara el rendimiento en entrenamiento y test. Busca el grado a partir del cual el modelo empieza a sobreajustar y comprueba si subir α en Ridge lo compensa.</p>${U.code(EX, 'Plantilla')}` },
    { id:'codigo', t:'Código completo', plain:'código descargable colab github', html:() => `<p>El script completo con todos los experimentos de esta página está en el repositorio y se puede ejecutar en Google Colab sin instalar nada.</p>${CH.repo('linear_regression.py')}` },
    { id:'referencias', t:'Referencias y papers', plain:'referencias legendre gauss efron hoerl', html:() => CH.refs([
      'A.-M. Legendre (1805). <i>Nouvelles méthodes pour la détermination des orbites des comètes</i>. París: Firmin Didot. (Primera publicación del método de mínimos cuadrados).',
      'C. F. Gauss (1809). <i>Theoria motus corporum coelestium in sectionibus conicis solem ambientium</i>. Hamburgo: Perthes et Besser.',
      'A. E. Hoerl, R. W. Kennard (1970). «Ridge Regression: Biased Estimation for Nonorthogonal Problems». <i>Technometrics</i>, 12(1), 55–67.',
      'B. Efron, T. Hastie, I. Johnstone, R. Tibshirani (2004). «Least Angle Regression». <i>The Annals of Statistics</i>, 32(2), 407–499. (Origen del dataset Diabetes).',
      'T. Hastie, R. Tibshirani, J. Friedman (2009). <i>The Elements of Statistical Learning</i>, 2.ª ed., capítulo 3. Springer.']) },
  ],
});
})();
