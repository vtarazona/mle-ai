/* =========================================================================
   ARTÍCULO: REGRESIÓN LOGÍSTICA
   Cifras obtenidas con notebooks/logistic_regression.py (scikit-learn 1.8.0,
   random_state = 42, misma partición que el artículo de Random Forest).
   ========================================================================= */
(() => {
const SCRATCH = `import numpy as np
from sklearn.preprocessing import StandardScaler

sc = StandardScaler().fit(X_tr)
Xs, Xts = sc.transform(X_tr), sc.transform(X_te)

sigmoide = lambda z: 1 / (1 + np.exp(-z))
w, b, eta, lam = np.zeros(X.shape[1]), 0.0, 0.1, 0.01

for it in range(3000):
    p = sigmoide(Xs @ w + b)                       # probabilidad de la clase 1
    grad_w = Xs.T @ (p - y_tr) / len(y_tr) + lam * w   # gradiente de la entropía cruzada + L2
    grad_b = (p - y_tr).mean()
    w -= eta * grad_w
    b -= eta * grad_b

prob_test = sigmoide(Xts @ w + b)
pred_test = (prob_test >= 0.5).astype(int)`;

const SK = `from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

modelo = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000))
modelo.fit(X_tr, y_tr)
modelo.predict_proba(X_te)[:, 1]   # probabilidad de «benigno»
modelo[-1].coef_                    # un peso por variable (en unidades estandarizadas)`;

const EVAL = `from sklearn.metrics import accuracy_score, roc_auc_score, log_loss, confusion_matrix
from sklearn.model_selection import cross_val_score

prob = modelo.predict_proba(X_te)[:, 1]
print(accuracy_score(y_te, prob >= 0.5))     # 0.986
print(roc_auc_score(y_te, prob))             # 0.998
print(log_loss(y_te, prob))                  # 0.068
print(confusion_matrix(y_te, prob >= 0.5))   # [[52  1]
                                             #  [ 1 89]]`;

const THR = `prob_maligno = 1 - modelo.predict_proba(X_te)[:, 1]
for umbral in (0.5, 0.3, 0.1):
    alerta = prob_maligno >= umbral
    print(umbral, (alerta & (y_te == 0)).sum(), (alerta & (y_te == 1)).sum())`;

const EX = `# Ejercicio: la curva precisión-recall de la clase maligna.
from sklearn.metrics import precision_recall_curve
prec, rec, umbrales = precision_recall_curve(y_te == 0, 1 - modelo.predict_proba(X_te)[:, 1])
# 1) Dibuja rec frente a prec.
# 2) Encuentra el umbral más alto que da recall = 1 y cuenta sus falsas alarmas.`;

ARTICLES.push({
  id:'logistic-regression', area:'ml', areaName:'Machine Learning', title:'Regresión logística', lab:'sigmoid', prefix:'lg-',
  kicker:'Machine Learning · Clasificación · Artículo completo',
  lede:'El clasificador lineal por excelencia: la sigmoide, la entropía cruzada, cómo se entrena por descenso de gradiente y por qué el umbral de decisión es una decisión de negocio.',
  teaser:'Desde cero en NumPy y con scikit-learn sobre Breast Cancer Wisconsin: 98,6 % de acierto y 0,998 de ROC-AUC, por encima del Random Forest en los mismos datos.',
  meta:'Resultados obtenidos con scikit-learn 1.8.0 · misma partición que el artículo de Random Forest · random_state = 42',
  sections: [
    { id:'que-es', t:'Qué es', plain:'clasificación binaria probabilidad sigmoide', html:() => `
      <p>La <b>regresión logística</b> es un modelo de clasificación, a pesar de su nombre. Calcula una suma ponderada de las variables, como la regresión lineal, y la pasa por la función <b>sigmoide</b>, que la convierte en una probabilidad entre 0 y 1. Si la probabilidad supera un umbral (normalmente 0,5), predice la clase positiva.</p>
      <p>Es el punto de partida de cualquier problema de clasificación y, además, cada neurona con activación sigmoide de una red es exactamente una regresión logística.</p>` },
    { id:'intuicion', t:'Intuición', plain:'frontera lineal probabilidad calibrada', html:() => `
      <p>El modelo traza una frontera recta (un hiperplano) que separa las dos clases. Los puntos lejos de la frontera reciben probabilidades cercanas a 0 o a 1; los que están cerca, alrededor de 0,5. Así no solo dice «maligno» o «benigno», sino con cuánta seguridad.</p>
      <p>Cada peso indica cuánto cambian las <i>odds</i> (probabilidad a favor frente a en contra) cuando la variable sube una unidad: multiplicarlas por ${U.tex('e^{w_j}', false)}.</p>
      <p class="callout">Juega con la sigmoide en el <a href="#lab-sigmoid">laboratorio de la función sigmoide</a>, y mira en el de <a href="#lab-boundary">frontera de decisión</a> cómo una red sin capas ocultas (que es una regresión logística) solo sabe trazar rectas.</p>` },
    { id:'matematicas', t:'Fundamento matemático', plain:'sigmoide log odds entropía cruzada gradiente', html:() => `
      <div class="math-block">${U.tex('p(y=1\\mid x) = \\sigma(w^{\\top}x + b) = \\frac{1}{1 + e^{-(w^{\\top}x + b)}}, \\qquad \\log\\frac{p}{1-p} = w^{\\top}x + b')}</div>
      <p>Los pesos se eligen maximizando la verosimilitud de los datos, que equivale a minimizar la <b>entropía cruzada</b> (log loss):</p>
      <div class="math-block">${U.tex('L(w) = -\\frac{1}{n}\\sum_{i=1}^{n}\\big[y_i \\log p_i + (1-y_i)\\log(1-p_i)\\big] + \\frac{\\lambda}{2}\\lVert w\\rVert^2')}</div>
      <p>Su gradiente tiene una forma sorprendentemente limpia, igual que la de la regresión lineal pero con p en lugar de la predicción:</p>
      <div class="math-block">${U.tex('\\nabla_w L = \\frac{1}{n} X^{\\top}(p - y) + \\lambda w')}</div>
      <p>No existe una fórmula cerrada como la ecuación normal, pero la pérdida es convexa: el descenso de gradiente (o métodos de segundo orden como L-BFGS, el que usa scikit-learn por defecto) llega siempre al mismo mínimo global.</p>` },
    { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'pasos', html:() => `<ol class="steps-ol">
      <li>Estandariza las variables: el optimizador converge mucho mejor y la regularización trata a todas por igual.</li>
      <li>Inicializa los pesos a cero.</li>
      <li>Calcula la probabilidad de cada ejemplo con la sigmoide.</li>
      <li>Calcula el gradiente ${U.tex('X^{\\top}(p-y)/n', false)} y actualiza los pesos en sentido contrario.</li>
      <li>Repite hasta que la pérdida deje de bajar.</li>
      <li>Elige el umbral de decisión según el coste de cada tipo de error.</li></ol>` },
    { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `<pre class="pseudo"><code>función AJUSTAR(X, y, η, λ, iteraciones):
    w ← 0 ; b ← 0
    repetir iteraciones veces:
        p ← σ(X·w + b)
        w ← w − η · ( Xᵀ(p − y)/n + λ·w )
        b ← b − η · media(p − y)
    devolver w, b

función PREDECIR(w, b, x, umbral):
    devolver 1 si σ(w·x + b) ≥ umbral, si no 0</code></pre>` },
    { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy sigmoide gradiente', html:() => `${U.code(SCRATCH)}
      ${CH.line({ xs:['0', '10', '100', '1000', '3000'], series:[{ name:'log loss', pts:[[0, 0.6931], [1, 0.2395], [2, 0.1032], [3, 0.072], [4, 0.0706]] }], ymin:0, ymax:0.7, yticks:[0, 0.2, 0.4, 0.6], yfmt:v => v.toFixed(1), xlabel:'iteración (escala por posición)', aria:'Pérdida durante el entrenamiento', caption:'La pérdida empieza en ln 2 = 0,693 (probabilidad 0,5 para todo el mundo, porque los pesos son cero) y baja a 0,071.' })}
      <p>Esta implementación consigue un 98,6 % de acierto y un ROC-AUC de 0,9975 en test, prácticamente lo mismo que scikit-learn.</p>` },
    { id:'sklearn', t:'Implementación con Scikit-learn', plain:'logisticregression pipeline standardscaler', html:() => `${U.code(SK)}<p>Sin <code>StandardScaler</code>, el optimizador no converge en 100 iteraciones con estos datos y scikit-learn avisa con un <code>ConvergenceWarning</code>: las variables van desde centésimas (como <i>mean fractal dimension</i>) hasta más de 4.000 (<i>worst area</i>). En scikit-learn 1.8 el parámetro <code>penalty</code> está obsoleto: la regularización se controla con <code>C</code> (inversa de λ) y <code>l1_ratio</code>.</p>` },
    { id:'dataset', t:'Dataset de ejemplo', plain:'breast cancer wisconsin', html:() => `<p>El mismo que en el <a href="#random-forest">artículo de Random Forest</a>: <a href="#datasets">Breast Cancer Wisconsin (Diagnostic)</a>, 569 biopsias con 30 variables numéricas (212 malignas, 357 benignas), y la misma partición estratificada 75/25 con <code>random_state=42</code>. Así los resultados de los dos modelos son directamente comparables.</p>` },
    { id:'entrenamiento', t:'Entrenamiento', plain:'lbfgs convergencia', html:() => `<p>Con variables estandarizadas, L-BFGS converge en milisegundos. La regularización por defecto (C = 1) ya funciona bien aquí; en otros problemas conviene buscar C con <code>LogisticRegressionCV</code>.</p>` },
    { id:'evaluacion', t:'Evaluación', plain:'acierto auc validación cruzada comparación random forest', html:() => `${U.code(EVAL)}
      ${CH.table(['Modelo (misma partición)', 'Acierto en test', 'ROC-AUC', 'Validación cruzada (5)'], [['Árbol de decisión', '92,3 %', '—', '—'], ['Random Forest, 300 árboles', '95,8 %', '0,995', '96,1 % ± 2,5'], ['<b>Regresión logística</b>', '<b>98,6 %</b>', '<b>0,998</b>', '<b>98,1 % ± 0,7</b>']])}
      <p>El modelo lineal gana al bosque en estos datos. No es una rareza: las 30 variables ya son medidas bien elegidas de los núcleos celulares y la frontera entre clases es casi lineal. Un modelo más flexible no aporta nada y añade varianza. Por eso siempre hay que probar primero el modelo sencillo.</p>` },
    { id:'metricas', t:'Métricas', plain:'log loss roc auc umbral recall', html:() => `
      <div class="math-block">${U.tex('\\text{log loss} = -\\frac{1}{n}\\sum [y\\log p + (1-y)\\log(1-p)], \\qquad \\text{AUC} = P(p_{+} > p_{-})')}</div>
      <p>El ROC-AUC es la probabilidad de que un caso positivo elegido al azar reciba más probabilidad que uno negativo: 0,998 significa que el modelo ordena casi perfectamente. El log loss mide además si las probabilidades son fiables, no solo si el orden es bueno.</p>
      <h4>El umbral es una decisión, no un dato</h4>${U.code(THR)}
      ${CH.table(['Umbral de alerta (prob. de maligno)', 'Malignos detectados', 'Falsas alarmas'], [['0,5', '52 de 53', '1'], ['0,3', '52 de 53', '6'], ['0,1', '<b>53 de 53</b>', '11']])}
      <p>Con el umbral por defecto se escapa un tumor maligno. Bajando el umbral al 10 % se detectan los 53, a cambio de 11 falsas alarmas entre 90 casos benignos. Qué umbral elegir depende del coste de cada error, y eso lo decide el problema, no el modelo.</p>` },
    { id:'visualizacion', t:'Visualización', plain:'coeficientes regularización c', html:() => `
      ${CH.bars([['worst texture', -1.25], ['radius error', -1.07], ['worst symmetry', -0.96], ['worst concave points', -0.94], ['area error', -0.94], ['worst area', -0.93]], { fmt:v => '−' + Math.abs(v).toFixed(2), caption:'Los 6 coeficientes de mayor magnitud (variables estandarizadas). Todos son negativos: valores altos empujan hacia «maligno» (clase 0).' })}
      ${CH.line({ xs:['0,001', '0,01', '0,1', '1', '10', '100'], series:[{ name:'acierto en test', pts:[[0, 0.9161], [1, 0.9371], [2, 0.979], [3, 0.986], [4, 0.972], [5, 0.9441]] }], ymin:0.9, ymax:1, yticks:[0.9, 0.93, 0.96, 0.99], yfmt:v => (v * 100).toFixed(0) + ' %', xlabel:'C = 1/λ (menos regularización hacia la derecha)', aria:'Acierto según C', marks:[{ i:3, t:'C = 1' }], caption:'Acierto en test según la regularización. Con C muy pequeño el modelo está demasiado restringido; con C muy grande sobreajusta. El óptimo cae en el valor por defecto.' })}` },
    { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul><li>Da probabilidades, normalmente bien calibradas.</li><li>Rápida, estable y con un único óptimo.</li><li>Interpretable mediante los coeficientes y los <i>odds ratios</i>.</li><li>Funciona muy bien con muchas variables y pocos datos si se regulariza.</li><li>Se extiende a varias clases con softmax (regresión logística multinomial).</li></ul>` },
    { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul><li>Frontera lineal: no captura interacciones ni relaciones curvas sin ingeniería de variables.</li><li>Sensible a variables en escalas muy distintas (hay que estandarizar).</li><li>Con clases perfectamente separables, sin regularización los pesos crecen sin límite.</li><li>Los coeficientes pierden interpretabilidad con variables muy correlacionadas.</li></ul>` },
    { id:'hiperparametros', t:'Hiperparámetros', plain:'c l1_ratio solver max_iter class_weight', html:() => CH.hp([
      ['C', '1.0', 'Inversa de la fuerza de regularización. Menor C, pesos más pequeños.'],
      ['l1_ratio', '0.0', '0 = L2 (Ridge), 1 = L1 (Lasso); valores intermedios, Elastic Net (con solver saga).'],
      ['solver', '"lbfgs"', 'Método de optimización. "saga" admite L1 y datasets grandes.'],
      ['max_iter', '100', 'Iteraciones máximas del optimizador. Súbelo si aparece ConvergenceWarning.'],
      ['class_weight', 'None', '"balanced" compensa clases desbalanceadas.'],
      ['penalty', '"deprecated"', 'Obsoleto desde scikit-learn 1.8: usa C y l1_ratio.']]) },
    { id:'casos-de-uso', t:'Casos de uso', plain:'casos uso', html:() => `<ul><li>Scoring de crédito y de riesgo, donde se exige explicar cada decisión.</li><li>Diagnóstico médico con variables clínicas.</li><li>Predicción de clics o conversiones en publicidad.</li><li>Clasificación de texto con variables TF-IDF (spam, sentimiento).</li><li>Línea base para cualquier clasificador.</li></ul>` },
    { id:'industria', t:'Aplicaciones industriales', plain:'industria churn telecom fraude', html:() => `<ul><li><b>Telecomunicaciones:</b> probabilidad de baja de cada cliente para priorizar retenciones.</li><li><b>Banca:</b> modelos de riesgo regulados, que deben ser explicables.</li><li><b>Industria:</b> probabilidad de pieza defectuosa a partir de parámetros de proceso, con el umbral fijado por el coste de inspección.</li><li><b>Seguridad:</b> primera capa de detección de fraude o intrusiones.</li></ul>` },
    { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio curva precisión recall', html:() => `<p>Dibuja la curva precisión-recall de la clase maligna y encuentra el umbral más alto que detecta los 53 casos. Compara sus falsas alarmas con las del Random Forest en el mismo punto.</p>${U.code(EX, 'Plantilla')}` },
    { id:'codigo', t:'Código completo', plain:'código colab github', html:() => `<p>Todos los experimentos de esta página, listos para ejecutar:</p>${CH.repo('logistic_regression.py')}` },
    { id:'referencias', t:'Referencias y papers', plain:'referencias cox berkson hosmer street wolberg', html:() => CH.refs([
      'J. Berkson (1944). «Application of the Logistic Function to Bio-Assay». <i>Journal of the American Statistical Association</i>, 39(227), 357–365.',
      'D. R. Cox (1958). «The Regression Analysis of Binary Sequences». <i>Journal of the Royal Statistical Society, Series B</i>, 20(2), 215–242.',
      'W. N. Street, W. H. Wolberg, O. L. Mangasarian (1993). «Nuclear feature extraction for breast tumor diagnosis». <i>Proc. SPIE 1905, Biomedical Image Processing and Biomedical Visualization</i>. (Origen del dataset).',
      'D. W. Hosmer, S. Lemeshow, R. X. Sturdivant (2013). <i>Applied Logistic Regression</i>, 3.ª ed. Wiley.',
      'T. Hastie, R. Tibshirani, J. Friedman (2009). <i>The Elements of Statistical Learning</i>, 2.ª ed., capítulo 4. Springer.']) },
  ],
});
})();
