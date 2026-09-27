/* =========================================================================
   ARTÍCULO: GRADIENT BOOSTING Y XGBOOST
   Cifras obtenidas con notebooks/gradient_boosting.py (scikit-learn 1.8.0,
   XGBoost 3.2.0, random_state = 42).
   ========================================================================= */
(() => {
const SCRATCH = `import numpy as np
from sklearn.tree import DecisionTreeRegressor

class GradientBoosting:
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=2):
        self.n, self.lr, self.depth = n_estimators, learning_rate, max_depth

    def fit(self, X, y):
        self.f0 = y.mean()                          # modelo inicial: la media
        pred = np.full(len(y), self.f0)
        self.arboles = []
        for _ in range(self.n):
            residuo = y - pred                      # = −gradiente de ½(y − f)²
            arbol = DecisionTreeRegressor(max_depth=self.depth).fit(X, residuo)
            pred += self.lr * arbol.predict(X)      # un paso pequeño en esa dirección
            self.arboles.append(arbol)
        return self

    def predict(self, X):
        return self.f0 + self.lr * sum(a.predict(X) for a in self.arboles)`;

const SK = `from sklearn.ensemble import GradientBoostingRegressor, HistGradientBoostingRegressor
import xgboost as xgb

gbr = GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, random_state=42)
hgb = HistGradientBoostingRegressor(max_iter=300, learning_rate=0.05, max_depth=3)   # rápido con datos grandes
xgbm = xgb.XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, subsample=0.8, reg_lambda=1.0)

for m in (gbr, hgb, xgbm):
    m.fit(X_tr, y_tr)`;

const ES = `m = GradientBoostingRegressor(n_estimators=2000, learning_rate=0.05, max_depth=2,
                              validation_fraction=0.2, n_iter_no_change=20, random_state=42)
m.fit(X_tr, y_tr)
print(m.n_estimators_)     # 170: se detiene solo cuando la validación deja de mejorar`;

const FR = `from sklearn.datasets import make_friedman1

# y = 10·sin(π·x₁·x₂) + 20·(x₃ − 0,5)² + 10·x₄ + 5·x₅ + ruido  (x₆…x₁₀ no influyen)
X, y = make_friedman1(n_samples=2000, noise=1.0, random_state=42)`;

const EX = `# Ejercicio: sobreajuste con learning_rate alto y cómo lo arregla el early stopping.
for lr in (0.05, 0.3, 1.0):
    m = GradientBoostingRegressor(n_estimators=2000, learning_rate=lr, max_depth=2,
                                  validation_fraction=0.2, n_iter_no_change=20, random_state=42)
    # ... entrena, imprime m.n_estimators_ y el RMSE en test. ¿Cuántos árboles usa cada uno?`;

ARTICLES.push({
  id:'gradient-boosting', area:'ml', areaName:'Machine Learning', title:'Gradient Boosting y XGBoost', lab:'tree', prefix:'gb-',
  kicker:'Machine Learning · Ensembles · Artículo completo',
  lede:'Árboles pequeños que se corrigen unos a otros siguiendo el gradiente de la pérdida: el algoritmo detrás de XGBoost y LightGBM, implementado desde cero y puesto a prueba con resultados reales.',
  teaser:'Boosting desde cero en 15 líneas, frente a scikit-learn y XGBoost: R² de 0,936 en un problema no lineal, y un caso real donde no supera a la regresión lineal.',
  meta:'Resultados obtenidos con scikit-learn 1.8.0 y XGBoost 3.2.0 · random_state = 42',
  sections: [
    { id:'que-es', t:'Qué es', plain:'boosting árboles secuencial residuos', html:() => `
      <p>El <b>gradient boosting</b> construye un modelo sumando muchos árboles de decisión pequeños, uno detrás de otro. Cada árbol nuevo se entrena para corregir los errores que todavía comete la suma de los anteriores. Jerome Friedman lo formuló en 2001 como un descenso de gradiente en el espacio de funciones.</p>
      <p>XGBoost, LightGBM, CatBoost y el <code>HistGradientBoosting</code> de scikit-learn son implementaciones de esta idea con optimizaciones de velocidad y regularización. Con datos tabulares, es la familia de modelos que más suele ganar.</p>` },
    { id:'intuicion', t:'Intuición', plain:'corregir errores golf pasos pequeños', html:() => `
      <p>Piensa en un golfista: el primer golpe deja la bola lejos del hoyo, y cada golpe siguiente se da desde donde quedó, apuntando a lo que falta. El primer «golpe» es predecir la media; cada árbol siguiente apunta al residuo que queda.</p>
      <p>La diferencia con <a href="#random-forest">Random Forest</a> es de fondo. El bosque entrena árboles grandes e independientes y los promedia para reducir la varianza. El boosting entrena árboles pequeños (poco profundos, con mucho sesgo) en serie para reducir el sesgo. Por eso cada árbol aporta solo una fracción de su predicción, la tasa de aprendizaje: pasos pequeños para no pasarse.</p>` },
    { id:'matematicas', t:'Fundamento matemático', plain:'descenso gradiente funcional pseudo residuos', html:() => `
      <p>Se busca una función F que minimice una pérdida L. En vez de mover pesos, se mueve la propia función, sumándole en cada paso algo que apunte en contra del gradiente:</p>
      <div class="math-block">${U.tex('F_0(x) = \\arg\\min_c \\sum_i L(y_i, c), \\qquad r_{im} = -\\left[\\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)}\\right]_{F = F_{m-1}}')}</div>
      <p>Esos ${U.tex('r_{im}', false)} son los <b>pseudo-residuos</b>. Se ajusta un árbol ${U.tex('h_m', false)} a ellos y se avanza un paso de tamaño η:</p>
      <div class="math-block">${U.tex('F_m(x) = F_{m-1}(x) + \\eta\\, h_m(x)')}</div>
      <p>Con la pérdida cuadrática ${U.tex('L = \\tfrac{1}{2}(y - F)^2', false)}, el gradiente negativo es exactamente ${U.tex('y - F', false)}: el residuo de toda la vida. Con otras pérdidas (log loss para clasificación, Huber para robustez) cambia solo esta fórmula.</p>
      <p>XGBoost añade un término de regularización a cada árbol y usa también la segunda derivada (aproximación de Newton):</p>
      <div class="math-block">${U.tex('\\Omega(h) = \\gamma T + \\tfrac{1}{2}\\lambda \\sum_{j=1}^{T} w_j^2, \\qquad w_j^* = -\\frac{\\sum_{i \\in I_j} g_i}{\\sum_{i \\in I_j} h_i + \\lambda}')}</div>
      <p>donde T es el número de hojas, ${U.tex('w_j', false)} el valor de cada hoja, y ${U.tex('g_i, h_i', false)} la primera y segunda derivada de la pérdida.</p>` },
    { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'pasos', html:() => `<ol class="steps-ol">
      <li>Empieza prediciendo una constante: la media (regresión) o el log-odds de la clase positiva (clasificación).</li>
      <li>Calcula, para cada ejemplo, el gradiente negativo de la pérdida respecto a la predicción actual.</li>
      <li>Entrena un árbol poco profundo (2 a 6 niveles) para predecir esos pseudo-residuos.</li>
      <li>Suma a la predicción la salida de ese árbol multiplicada por la tasa de aprendizaje.</li>
      <li>Repite hasta el número de árboles fijado o hasta que el error de validación deje de bajar.</li></ol>` },
    { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `<pre class="pseudo"><code>función GRADIENT_BOOSTING(X, y, M, η, profundidad):
    F ← media(y)
    árboles ← []
    para m ← 1 hasta M:
        r ← −∂L(y, F)/∂F            # con pérdida cuadrática: r = y − F
        h ← ÁRBOL_REGRESIÓN(X, r, profundidad)
        F ← F + η · h(X)
        añadir h a árboles
    devolver media(y), árboles

función PREDECIR(x):
    devolver F₀ + η · Σ h(x) para h en árboles</code></pre>` },
    { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy clase gradient boosting residuos', html:() => `${U.code(SCRATCH)}
      <p>Usa los árboles de regresión de scikit-learn como pieza base, pero el boosting en sí son esas 15 líneas. En el problema no lineal de la sección de evaluación obtiene un R² de 0,929, idéntico al de <code>GradientBoostingRegressor</code> con los mismos parámetros.</p>` },
    { id:'sklearn', t:'Implementación con Scikit-learn y XGBoost', plain:'gradientboostingregressor histgradientboosting xgboost', html:() => `${U.code(SK)}<p><code>HistGradientBoosting*</code> agrupa cada variable en hasta 255 intervalos antes de buscar cortes, lo que lo hace muchísimo más rápido con datos grandes; admite valores faltantes y variables categóricas de forma nativa, como LightGBM. XGBoost ofrece además entrenamiento en GPU y una regularización más fina.</p>` },
    { id:'dataset', t:'Datasets de ejemplo', plain:'diabetes friedman sintético no lineal', html:() => `
      <p>Se usan dos problemas de regresión para ver cuándo compensa el boosting y cuándo no:</p>
      <ul><li><b>Diabetes</b> (442 pacientes, 10 variables), el mismo del <a href="#linear-regression">artículo de regresión lineal</a>: pocos datos y una relación casi lineal.</li>
      <li><b>Friedman #1</b>, un problema sintético clásico (Friedman, 1991) con interacciones y curvas, 2.000 ejemplos y 10 variables de las que solo 5 influyen:</li></ul>${U.code(FR)}` },
    { id:'entrenamiento', t:'Entrenamiento', plain:'early stopping tasa aprendizaje sobreajuste', html:() => `
      <p>Más árboles siempre bajan el error de entrenamiento, pero no el de test. Con 300 árboles y η = 0,05 en Diabetes:</p>
      ${CH.line({ xs:['1', '10', '50', '100', '200', '300'], series:[{ name:'RMSE entrenamiento', pts:[[0, 76.2], [1, 65.2], [2, 50.8], [3, 45.8], [4, 41.5], [5, 38.1]] }, { name:'RMSE test', alt:true, pts:[[0, 71.9], [1, 63.1], [2, 53.2], [3, 52.4], [4, 52.9], [5, 53.5]] }], ymin:30, ymax:80, yticks:[30, 40, 50, 60, 70, 80], xlabel:'número de árboles (escala por posición)', aria:'Error según el número de árboles', marks:[{ i:3, t:'mínimo en test' }], caption:'Implementación desde cero. El error de test toca fondo hacia los 100 árboles (52,4) y luego sube despacio mientras el de entrenamiento sigue bajando: sobreajuste.' })}
      <p>La solución estándar es el <b>early stopping</b>: separar una parte de validación y parar cuando deja de mejorar.</p>${U.code(ES)}` },
    { id:'evaluacion', t:'Evaluación', plain:'comparación lineal random forest xgboost friedman diabetes', html:() => `
      <h4>Problema no lineal (Friedman #1, 500 test)</h4>
      ${CH.table(['Modelo', 'RMSE', 'R²', 'Tiempo de entrenamiento'], [['Regresión lineal', '2,475', '0,752', '&lt; 0,01 s'], ['Random Forest (300 árboles)', '1,855', '0,861', '1,8 s'], ['Boosting desde cero (500, η = 0,05, prof. 3)', '1,323', '0,929', '2,6 s'], ['GradientBoostingRegressor (mismos parámetros)', '1,324', '0,929', '2,5 s'], ['<b>XGBoost</b> (+ subsample 0,8)', '<b>1,259</b>', '<b>0,936</b>', '<b>0,27 s</b>']])}
      <h4>Problema casi lineal y con pocos datos (Diabetes, validación cruzada de 5)</h4>
      ${CH.table(['Modelo', 'R² medio', 'Desviación'], [['<b>Regresión lineal</b>', '<b>0,478</b>', '0,085'], ['XGBoost', '0,441', '0,084'], ['GradientBoostingRegressor', '0,436', '0,096'], ['Random Forest', '0,427', '0,095']])}
      <p>Las dos tablas cuentan la historia completa. Cuando hay interacciones y curvas, el boosting reduce el error a la mitad respecto al modelo lineal y supera al bosque. Cuando los datos son pocos y la relación es casi lineal, la regresión lineal gana. No existe un algoritmo mejor en todos los problemas; por eso se valida siempre contra una línea base.</p>` },
    { id:'metricas', t:'Métricas', plain:'rmse r2', html:() => `<p>Las mismas que en cualquier regresión (RMSE, MAE, R², ver el <a href="#linear-regression">artículo de regresión lineal</a>) o clasificación (log loss, ROC-AUC). La diferencia práctica es que el boosting optimiza directamente la pérdida que elijas, así que conviene que la pérdida de entrenamiento coincida con la métrica que te importa: <code>loss="absolute_error"</code> si mides MAE, <code>loss="huber"</code> si hay valores atípicos.</p>` },
    { id:'visualizacion', t:'Visualización', plain:'importancia variables tasa aprendizaje', html:() => `
      ${CH.line({ xs:['0,01', '0,05', '0,1', '0,3', '1,0'], series:[{ name:'RMSE entrenamiento', pts:[[0, 49.7], [1, 38.1], [2, 30.0], [3, 14.8], [4, 2.3]] }, { name:'RMSE test', alt:true, pts:[[0, 52.8], [1, 53.5], [2, 56.0], [3, 62.6], [4, 74.4]] }], ymin:0, ymax:80, yticks:[0, 20, 40, 60, 80], xlabel:'tasa de aprendizaje η con 300 árboles fijos', aria:'Efecto de la tasa de aprendizaje', caption:'Diabetes. Con η = 1 el modelo memoriza el entrenamiento (RMSE 2,3) y se desploma en test (74,4). Tasa pequeña + más árboles + early stopping es la receta estable.' })}
      ${CH.bars([['bmi · masa corporal', 0.368, true], ['s5 · log triglicéridos', 0.292, true], ['bp · tensión media', 0.108], ['s2 · LDL', 0.045], ['s3 · HDL', 0.043]], { fmt:v => v.toFixed(3), caption:'Importancia de las variables (reducción de impureza) en Diabetes. A diferencia de los coeficientes lineales, aquí colesterol total y LDL no aparecen inflados por la multicolinealidad.' })}` },
    { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul><li>Suele ser el modelo más preciso en datos tabulares.</li><li>Captura no linealidades e interacciones sin ingeniería de variables.</li><li>Flexible: cualquier pérdida diferenciable.</li><li>Las implementaciones modernas manejan valores faltantes y categóricas, y escalan a millones de filas.</li><li>No necesita escalar las variables.</li></ul>` },
    { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul><li>Más hiperparámetros que un Random Forest y más sensibles; sin early stopping sobreajusta.</li><li>Entrenamiento secuencial: cada árbol depende del anterior (se paraleliza dentro de cada árbol, no entre árboles).</li><li>Como todos los árboles, no extrapola fuera del rango de entrenamiento.</li><li>Con pocos datos o relaciones lineales puede ser peor que un modelo lineal, como se ha visto.</li></ul>` },
    { id:'hiperparametros', t:'Hiperparámetros', plain:'n_estimators learning_rate max_depth subsample reg_lambda', html:() => CH.table(['Parámetro', 'scikit-learn (GradientBoosting)', 'XGBoost 3.2', 'Efecto'], [
      ['<code>n_estimators</code>', '100', '100', 'Número de árboles. Fíjalo alto y usa early stopping.'],
      ['<code>learning_rate</code>', '0.1', '0.3', 'Tamaño de cada paso. Más bajo necesita más árboles pero generaliza mejor.'],
      ['<code>max_depth</code>', '3', '6', 'Profundidad de cada árbol; controla qué interacciones puede capturar.'],
      ['<code>subsample</code>', '1.0', '1.0', 'Fracción de filas por árbol (<i>stochastic boosting</i>). 0,5–0,8 reduce varianza.'],
      ['<code>reg_lambda</code> / <code>l2_regularization</code>', '— / 0.0 (Hist)', '1.0', 'Penalización L2 de los valores de las hojas.'],
      ['<code>min_samples_leaf</code> / <code>min_child_weight</code>', '1', '1', 'Tamaño mínimo de hoja; subirlo suaviza.'],
      ['<code>n_iter_no_change</code> / <code>early_stopping_rounds</code>', 'None', 'None', 'Activa el early stopping.']]) },
    { id:'casos-de-uso', t:'Casos de uso', plain:'casos uso', html:() => `<ul><li>Competiciones de Kaggle con datos tabulares.</li><li>Riesgo de crédito, fraude y scoring.</li><li>Ranking en buscadores y recomendadores (LambdaMART).</li><li>Previsión de demanda con variables de calendario y retardos.</li></ul>` },
    { id:'industria', t:'Aplicaciones industriales', plain:'industria mantenimiento energía telecom', html:() => `<ul><li><b>Mantenimiento predictivo:</b> probabilidad de fallo a partir de sensores. Ver el <a href="#project-mantenimiento">proyecto</a>.</li><li><b>Energía:</b> previsión de producción renovable y demanda.</li><li><b>Telecomunicaciones:</b> predicción de bajas y de incidencias en red.</li><li><b>Logística:</b> tiempos de entrega y roturas de stock.</li></ul>` },
    { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio early stopping', html:() => `<p>Comprueba cómo el early stopping compensa una tasa de aprendizaje demasiado alta: ¿cuántos árboles elige para cada η y cuál es el error final?</p>${U.code(EX, 'Plantilla')}` },
    { id:'codigo', t:'Código completo', plain:'código colab github', html:() => `<p>Todos los experimentos, incluidos los dos datasets y las comparaciones:</p>${CH.repo('gradient_boosting.py')}` },
    { id:'referencias', t:'Referencias y papers', plain:'referencias friedman freund schapire chen guestrin lightgbm', html:() => CH.refs([
      'J. H. Friedman (2001). «Greedy Function Approximation: A Gradient Boosting Machine». <i>The Annals of Statistics</i>, 29(5), 1189–1232.',
      'Y. Freund, R. E. Schapire (1997). «A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting». <i>Journal of Computer and System Sciences</i>, 55(1), 119–139.',
      'J. H. Friedman (1991). «Multivariate Adaptive Regression Splines». <i>The Annals of Statistics</i>, 19(1), 1–67. (Origen del problema Friedman #1).',
      'T. Chen, C. Guestrin (2016). «XGBoost: A Scalable Tree Boosting System». <i>Proceedings of KDD 2016</i>. <a href="#paper-xgboost-2016">Ficha en la biblioteca</a>.',
      'G. Ke et al. (2017). «LightGBM: A Highly Efficient Gradient Boosting Decision Tree». <i>NeurIPS 2017</i>.']) },
  ],
});
})();
