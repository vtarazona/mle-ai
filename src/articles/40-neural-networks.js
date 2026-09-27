/* =========================================================================
   ARTÍCULO: REDES NEURONALES (MLP)
   Cifras obtenidas con notebooks/neural_networks.py (NumPy 2.4, PyTorch 2.14,
   scikit-learn 1.8.0, random_state = 42).
   ========================================================================= */
(() => {
const SCRATCH = `import numpy as np

class MLP:
    """64 → 64 (ReLU) → 10 (softmax), entropía cruzada, SGD por mini-lotes."""
    def __init__(self, d_in, d_h, d_out, seed=0):
        r = np.random.default_rng(seed)
        self.W1 = r.normal(0, np.sqrt(2 / d_in), (d_in, d_h)); self.b1 = np.zeros(d_h)    # inicialización de He
        self.W2 = r.normal(0, np.sqrt(1 / d_h), (d_h, d_out)); self.b2 = np.zeros(d_out)

    def forward(self, X):
        self.X = X
        self.Z1 = X @ self.W1 + self.b1
        self.A1 = np.maximum(0, self.Z1)                       # ReLU
        Z2 = self.A1 @ self.W2 + self.b2
        Z2 -= Z2.max(1, keepdims=True)                         # softmax numéricamente estable
        E = np.exp(Z2); self.P = E / E.sum(1, keepdims=True)
        return self.P

    def backward(self, y, lr):
        n = len(y)
        dZ2 = self.P.copy(); dZ2[np.arange(n), y] -= 1; dZ2 /= n    # softmax + entropía cruzada: p − y
        dW2, db2 = self.A1.T @ dZ2, dZ2.sum(0)
        dZ1 = (dZ2 @ self.W2.T) * (self.Z1 > 0)                    # regla de la cadena · ReLU'
        dW1, db1 = self.X.T @ dZ1, dZ1.sum(0)
        for p, g in ((self.W1, dW1), (self.b1, db1), (self.W2, dW2), (self.b2, db2)):
            p -= lr * g`;

const LOOP = `red = MLP(64, 64, 10)
rng = np.random.default_rng(1)
for epoca in range(60):
    idx = rng.permutation(len(X_tr))
    for i in range(0, len(idx), 32):                 # mini-lotes de 32
        lote = idx[i:i + 32]
        red.forward(X_tr[lote])
        red.backward(y_tr[lote], lr=0.1)

pred = red.forward(X_te).argmax(1)                   # 97,3 % de acierto`;

const CHECK = `# Comprobación del gradiente: derivada analítica frente a diferencias finitas
eps = 1e-5
red.W1[10, 3] += eps;     red.forward(xb); l_mas = red.loss(yb)
red.W1[10, 3] -= 2 * eps; red.forward(xb); l_menos = red.loss(yb)
numerico = (l_mas - l_menos) / (2 * eps)
# analítico: −0.0503071992   numérico: −0.0503071992`;

const TORCH = `import torch, torch.nn as nn

modelo = nn.Sequential(nn.Linear(64, 64), nn.ReLU(), nn.Linear(64, 10))   # 4.810 parámetros
opt = torch.optim.Adam(modelo.parameters(), lr=1e-3)
perdida = nn.CrossEntropyLoss()                     # incluye el softmax

for epoca in range(60):
    for xb, yb in lotes(X_tr, y_tr, 32):
        opt.zero_grad()
        L = perdida(modelo(xb), yb)                  # pasada hacia delante
        L.backward()                                 # backpropagation automática
        opt.step()`;

const SK = `from sklearn.neural_network import MLPClassifier

mlp = MLPClassifier(hidden_layer_sizes=(64,), max_iter=500, random_state=42).fit(X_tr, y_tr)
mlp.score(X_te, y_te)                               # 0.982`;

const DATA = `from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

X, y = load_digits(return_X_y=True)    # 1.797 imágenes de 8×8, píxeles de 0 a 16
X = X / 16.0                           # escalar a [0, 1]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)`;

const EX = `# Ejercicio: añade una segunda capa oculta y dropout en PyTorch.
modelo = nn.Sequential(
    nn.Linear(64, 128), nn.ReLU(), nn.Dropout(0.2),
    nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.2),
    nn.Linear(64, 10))
# ... entrena igual y compara el acierto. Recuerda modelo.eval() antes de evaluar.`;

ARTICLES.push({
  id:'neural-networks', area:'dl', areaName:'Deep Learning', title:'Redes neuronales', lab:'backprop', prefix:'nn-',
  kicker:'Deep Learning · Perceptrón multicapa · Artículo completo',
  lede:'Qué es una red neuronal, cómo aprende con backpropagation y cómo se implementa: desde cero en NumPy, con PyTorch y con scikit-learn, reconociendo dígitos escritos a mano.',
  teaser:'Un perceptrón multicapa escrito a mano en NumPy reconoce dígitos con un 97,3 % de acierto; su gradiente coincide con el numérico en 10 decimales.',
  meta:'Resultados obtenidos con NumPy 2.4, PyTorch 2.14 y scikit-learn 1.8.0 · random_state = 42',
  sections: [
    { id:'que-es', t:'Qué es', plain:'red neuronal capas neuronas mlp perceptrón', html:() => `
      <p>Una <b>red neuronal</b> es una composición de capas: cada capa hace una transformación lineal (multiplica por una matriz de pesos y suma un sesgo) seguida de una función no lineal (la <b>activación</b>). El <b>perceptrón multicapa</b> (MLP) es la forma más básica, con capas totalmente conectadas.</p>
      <p>Las redes convolucionales, recurrentes y los Transformers son variaciones de la misma idea con conexiones pensadas para imágenes, secuencias o texto. Todas se entrenan igual: descenso de gradiente con gradientes calculados por <b>backpropagation</b>.</p>` },
    { id:'intuicion', t:'Intuición', plain:'capas características jerarquía no linealidad', html:() => `
      <p>Cada neurona de la primera capa aprende a detectar un patrón sencillo, como un trazo en cierta zona de la imagen. La capa siguiente combina esos patrones en otros más complejos. Sin la activación no lineal, apilar capas no serviría de nada: una composición de funciones lineales sigue siendo lineal.</p>
      <p>Con una sola capa oculta suficientemente ancha, una red puede aproximar cualquier función continua en un dominio acotado (teorema de aproximación universal). Más capas permiten hacerlo con muchas menos neuronas.</p>
      <p class="callout">Mira qué dibuja cada neurona en el <a href="#lab-boundary">laboratorio de frontera de decisión</a>, y sigue los números de una iteración completa en el de <a href="#lab-backprop">backpropagation paso a paso</a>.</p>` },
    { id:'matematicas', t:'Fundamento matemático', plain:'forward backward regla cadena softmax entropía cruzada', html:() => `
      <h4>Pasada hacia delante</h4>
      <div class="math-block">${U.tex('z^{(1)} = W_1 x + b_1, \\quad a^{(1)} = \\text{ReLU}(z^{(1)}), \\quad z^{(2)} = W_2 a^{(1)} + b_2, \\quad p = \\text{softmax}(z^{(2)})')}</div>
      <h4>Pérdida</h4>
      <div class="math-block">${U.tex('L = -\\log p_{y}, \\qquad \\text{softmax}(z)_k = \\frac{e^{z_k}}{\\sum_j e^{z_j}}')}</div>
      <h4>Backpropagation</h4>
      <p>La regla de la cadena, aplicada de la salida hacia la entrada. La combinación de softmax y entropía cruzada tiene un gradiente muy simple:</p>
      <div class="math-block">${U.tex('\\delta^{(2)} = p - \\text{onehot}(y), \\qquad \\frac{\\partial L}{\\partial W_2} = \\delta^{(2)} a^{(1)\\top}')}</div>
      <div class="math-block">${U.tex('\\delta^{(1)} = \\big(W_2^{\\top}\\delta^{(2)}\\big) \\odot \\mathbb{1}[z^{(1)} > 0], \\qquad \\frac{\\partial L}{\\partial W_1} = \\delta^{(1)} x^{\\top}')}</div>
      <p>Con esos gradientes, cada peso se actualiza como en cualquier descenso de gradiente: ${U.tex('W \\leftarrow W - \\eta\\, \\partial L/\\partial W', false)}.</p>` },
    { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'pasos época mini lote', html:() => `<ol class="steps-ol">
      <li>Inicializa los pesos con valores aleatorios pequeños (inicialización de He para ReLU); los sesgos a cero.</li>
      <li>Baraja los datos y pártelos en mini-lotes.</li>
      <li>Para cada lote: pasada hacia delante, cálculo de la pérdida, backpropagation y actualización de pesos.</li>
      <li>Al terminar cada época (una pasada por todos los datos), mide el error en validación.</li>
      <li>Para cuando la validación deja de mejorar.</li></ol>` },
    { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `<pre class="pseudo"><code>inicializar W₁, b₁, W₂, b₂
para cada época:
    para cada lote (X, y):
        Z₁ ← X·W₁ + b₁ ;  A₁ ← ReLU(Z₁)
        P  ← softmax(A₁·W₂ + b₂)
        δ₂ ← (P − onehot(y)) / n
        δ₁ ← (δ₂·W₂ᵀ) ⊙ [Z₁ > 0]
        W₂ ← W₂ − η·A₁ᵀ·δ₂ ;  b₂ ← b₂ − η·Σδ₂
        W₁ ← W₁ − η·Xᵀ·δ₁  ;  b₁ ← b₁ − η·Σδ₁</code></pre>` },
    { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy mlp backward forward comprobación gradiente', html:() => `${U.code(SCRATCH)}${U.code(LOOP, 'Entrenamiento')}
      <p>La forma estándar de saber si un backpropagation escrito a mano es correcto es compararlo con la derivada numérica (diferencias finitas). Aquí coinciden en 10 cifras decimales:</p>${U.code(CHECK, 'Comprobación')}` },
    { id:'sklearn', t:'Implementación con PyTorch y Scikit-learn', plain:'pytorch nn sequential adam mlpclassifier', html:() => `${U.code(TORCH, 'PyTorch')}${U.code(SK, 'scikit-learn')}<p>PyTorch calcula los gradientes automáticamente (<i>autograd</i>): escribes solo la pasada hacia delante. scikit-learn es cómodo para redes pequeñas, pero no usa GPU ni permite arquitecturas a medida.</p>` },
    { id:'dataset', t:'Dataset de ejemplo', plain:'digits 8x8 1797 imágenes', html:() => `<p>El dataset <b>Digits</b> de scikit-learn es una copia del conjunto de test de «Optical Recognition of Handwritten Digits» del repositorio UCI: 1.797 imágenes de dígitos escritos a mano, reducidas a 8×8 píxeles con 17 niveles de gris (0 a 16), y unas 180 imágenes por dígito. Cada imagen se convierte en un vector de 64 números.</p>${U.code(DATA)}` },
    { id:'entrenamiento', t:'Entrenamiento', plain:'épocas pérdida curva aprendizaje', html:() => `
      ${CH.line({ xs:['1', '5', '10', '30', '60'], series:[{ name:'acierto en test', pts:[[0, 0.6733], [1, 0.8978], [2, 0.8844], [3, 0.9667], [4, 0.9733]] }], ymin:0.6, ymax:1, yticks:[0.6, 0.7, 0.8, 0.9, 1], yfmt:v => (v * 100).toFixed(0) + ' %', xlabel:'época (escala por posición)', aria:'Acierto durante el entrenamiento', caption:'Red NumPy, SGD con η = 0,1. Tras la primera época ya acierta el 67 %; en la 10 hay un pequeño retroceso típico de SGD, y a las 60 épocas llega al 97,3 %. La pérdida de entrenamiento pasa de 1,40 a 0,031.' })}
      <p>Todo el entrenamiento en NumPy tarda unos 0,3 segundos en un procesador normal: con redes y datos pequeños no hace falta GPU.</p>` },
    { id:'evaluacion', t:'Evaluación', plain:'comparación acierto logística pytorch sklearn', html:() => `
      ${CH.table(['Modelo (mismos datos de test, 450 imágenes)', 'Acierto'], [['Regresión logística multinomial', '96,2 %'], ['MLP desde cero en NumPy (64 ocultas, SGD)', '97,3 %'], ['MLP en PyTorch (64 ocultas, Adam)', '97,6 %'], ['<b>MLPClassifier de scikit-learn</b> (64 ocultas)', '<b>98,2 %</b>']])}
      <p>Una red con una capa oculta mejora a la regresión logística, pero no por mucho: con imágenes de 8×8, los dígitos ya son casi separables linealmente. La ventaja de las redes crece con el tamaño y la complejidad de los datos; en MNIST (28×28) o en fotos, la distancia es enorme.</p>` },
    { id:'metricas', t:'Métricas', plain:'confusión errores', html:() => `<p>En clasificación multiclase se usan el acierto, la matriz de confusión y la precisión y recall por clase. Los 12 errores de la red NumPy en test se concentran en pocos pares:</p>
      ${CH.table(['Dígito real', 'Predicho como', 'Veces'], [['8', '1', '4'], ['0', '4', '2'], ['1', '8', '2'], ['5', '9', '1'], ['6', '8', '1'], ['7', '4', '1'], ['8', '7', '1']])}
      <p>El 8 confundido con el 1 es el error más frecuente: a 8×8 píxeles, un 8 estrecho y un 1 con base se parecen mucho.</p>` },
    { id:'visualizacion', t:'Visualización', plain:'neuronas ocultas capacidad', html:() => `
      ${CH.line({ xs:['4', '8', '16', '64', '256'], series:[{ name:'acierto en test', pts:[[0, 0.92], [1, 0.9578], [2, 0.9733], [3, 0.9822], [4, 0.9867]] }], ymin:0.9, ymax:1, yticks:[0.9, 0.93, 0.96, 0.99], yfmt:v => (v * 100).toFixed(0) + ' %', xlabel:'neuronas en la capa oculta (scikit-learn)', aria:'Acierto según el tamaño de la capa oculta', caption:'Con solo 4 neuronas ocultas ya acierta el 92 %; con 256, el 98,7 %. Los rendimientos decrecen: pasar de 64 a 256 neuronas multiplica los parámetros por 4 y mejora medio punto.' })}` },
    { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul><li>Aprenden las características directamente de datos brutos (píxeles, audio, texto).</li><li>Escalan con los datos: más datos y más capacidad siguen mejorando donde otros modelos se estancan.</li><li>Arquitecturas especializadas para cada tipo de dato.</li><li>Ecosistema maduro (PyTorch, JAX, TensorFlow) y aceleración en GPU.</li><li>Aprendizaje por transferencia: reutilizar modelos preentrenados.</li></ul>` },
    { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul><li>Necesitan muchos datos para brillar; con datos tabulares pequeños, el gradient boosting suele ganar.</li><li>Muchos hiperparámetros y entrenamiento sensible a la inicialización y a la tasa de aprendizaje.</li><li>Difíciles de interpretar.</li><li>Coste computacional alto en modelos grandes.</li></ul>` },
    { id:'hiperparametros', t:'Hiperparámetros', plain:'capas neuronas tasa aprendizaje batch alpha', html:() => CH.hp([
      ['hidden_layer_sizes', '(100,)', 'Número de capas ocultas y neuronas en cada una.'],
      ['activation', '"relu"', 'Función de activación de las capas ocultas.'],
      ['solver', '"adam"', 'Optimizador: adam, sgd o lbfgs (este último, bueno para datasets pequeños).'],
      ['learning_rate_init', '0.001', 'Tasa de aprendizaje inicial.'],
      ['batch_size', '"auto" = min(200, n)', 'Tamaño del mini-lote.'],
      ['alpha', '0.0001', 'Regularización L2 de los pesos.'],
      ['max_iter', '200', 'Épocas máximas.'],
      ['early_stopping', 'False', 'Reserva un 10 % para validación y para cuando no mejora.']]) + '<p>Valores por defecto de <code>MLPClassifier</code> en scikit-learn 1.8. En PyTorch no hay valores por defecto de arquitectura: se definen en el código.</p>' },
    { id:'casos-de-uso', t:'Casos de uso', plain:'casos uso', html:() => `<ul><li>Visión artificial: clasificación, detección y segmentación de imágenes.</li><li>Voz y audio: reconocimiento y síntesis.</li><li>Lenguaje: traducción, resumen, asistentes (Transformers).</li><li>Sistemas de recomendación con embeddings.</li></ul>` },
    { id:'industria', t:'Aplicaciones industriales', plain:'industria inspección visual sensores', html:() => `<ul><li><b>Inspección visual</b> de defectos en líneas de producción.</li><li><b>Series temporales de sensores</b> para detectar anomalías en maquinaria.</li><li><b>Telecomunicaciones:</b> clasificación de tráfico y optimización de redes radio.</li><li><b>Lectura automática</b> de contadores, matrículas y documentos (OCR).</li></ul>` },
    { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio dropout segunda capa', html:() => `<p>Añade una segunda capa oculta y dropout a la red de PyTorch y compara el acierto. ¿Mejora con tan pocos datos, o empeora?</p>${U.code(EX, 'Plantilla')}` },
    { id:'codigo', t:'Código completo', plain:'código colab github', html:() => `<p>Las tres implementaciones y todos los experimentos de esta página:</p>${CH.repo('neural_networks.py')}` },
    { id:'referencias', t:'Referencias y papers', plain:'referencias rosenblatt rumelhart hornik he goodfellow', html:() => CH.refs([
      'F. Rosenblatt (1958). «The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain». <i>Psychological Review</i>, 65(6), 386–408.',
      'D. E. Rumelhart, G. E. Hinton, R. J. Williams (1986). «Learning representations by back-propagating errors». <i>Nature</i>, 323, 533–536. <a href="#paper-backprop-1986">Ficha en la biblioteca</a>.',
      'K. Hornik, M. Stinchcombe, H. White (1989). «Multilayer feedforward networks are universal approximators». <i>Neural Networks</i>, 2(5), 359–366.',
      'K. He, X. Zhang, S. Ren, J. Sun (2015). «Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification». <i>ICCV 2015</i>. (Inicialización de He).',
      'D. P. Kingma, J. Ba (2015). «Adam: A Method for Stochastic Optimization». <i>ICLR 2015</i>. <a href="#paper-adam-2015">Ficha en la biblioteca</a>.',
      'I. Goodfellow, Y. Bengio, A. Courville (2016). <i>Deep Learning</i>. MIT Press.']) },
  ],
});
})();
