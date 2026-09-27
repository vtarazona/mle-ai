/* =========================================================================
   ARTÍCULO: TRANSFORMERS
   Cifras obtenidas con notebooks/transformer.py (NumPy 2.4, PyTorch 2.14,
   CPU, torch.manual_seed(42)).
   ========================================================================= */
(() => {
const NP = `import numpy as np

def self_attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(K.shape[1])                          # puntuaciones escaladas
    S = np.where(np.tril(np.ones_like(S)) == 1, S, -np.inf)    # máscara causal
    A = np.exp(S - S.max(1, keepdims=True))
    A /= A.sum(1, keepdims=True)                               # softmax por filas
    return A @ V, A

# Coincide con torch.nn.functional.scaled_dot_product_attention(..., is_causal=True)`;

const BLOCK = `import torch, torch.nn as nn

class Bloque(nn.Module):
    def __init__(s):
        super().__init__()
        s.ln1, s.ln2 = nn.LayerNorm(D), nn.LayerNorm(D)
        s.attn = nn.MultiheadAttention(D, H, dropout=0.2, batch_first=True)
        s.ffn = nn.Sequential(nn.Linear(D, 4 * D), nn.GELU(), nn.Linear(4 * D, D), nn.Dropout(0.2))
        s.register_buffer("mask", torch.triu(torch.ones(T, T, dtype=torch.bool), 1))

    def forward(s, x):
        t = x.shape[1]
        h = s.ln1(x)
        x = x + s.attn(h, h, h, attn_mask=s.mask[:t, :t], need_weights=False)[0]   # residual
        return x + s.ffn(s.ln2(x))                                                 # residual

class MiniGPT(nn.Module):
    def __init__(s):
        super().__init__()
        s.tok, s.pos = nn.Embedding(V, D), nn.Embedding(T, D)    # tokens + posiciones aprendidas
        s.bloques = nn.Sequential(*[Bloque() for _ in range(L)])
        s.ln, s.head = nn.LayerNorm(D), nn.Linear(D, V, bias=False)

    def forward(s, idx):
        x = s.tok(idx) + s.pos(torch.arange(idx.shape[1]))
        return s.head(s.ln(s.bloques(x)))                       # logits: [B, T, V]`;

const TRAIN = `opt = torch.optim.AdamW(modelo.parameters(), lr=2e-3, weight_decay=0.1)
mejor = float("inf")
for paso in range(1, 1201):
    x, y = lote(entrenamiento)                   # y es x desplazado una posición
    perdida = F.cross_entropy(modelo(x).view(-1, V), y.view(-1))
    opt.zero_grad(); perdida.backward(); opt.step()
    if paso % 100 == 0:
        v = perdida_validacion()
        if v < mejor:                            # early stopping: guarda el mejor modelo
            mejor, estado = v, copia_de(modelo.state_dict())`;

const GEN = `@torch.no_grad()
def generar(modelo, idx, n, temperatura=0.8):
    for _ in range(n):
        logits = modelo(idx[:, -T:])[:, -1] / temperatura
        siguiente = torch.multinomial(F.softmax(logits, -1), 1)
        idx = torch.cat([idx, siguiente], 1)
    return idx`;

const PARAMS = `vocab, ctx, d, capas = 50257, 1024, 768, 12        # GPT-2 small
por_capa = (2*d                    # LayerNorm 1
            + d*3*d + 3*d          # proyección Q, K, V
            + d*d + d              # proyección de salida de la atención
            + 2*d                  # LayerNorm 2
            + d*4*d + 4*d          # FFN: expansión
            + 4*d*d + d)           # FFN: compresión
total = vocab*d + ctx*d + capas*por_capa + 2*d
print(por_capa, total)             # 7087872  124439808`;

const EX = `# Ejercicio: mide el efecto del número de cabezas y de la codificación posicional.
# 1) Entrena con H = 1, 2, 4 y 8 (D = 96 se reparte entre las cabezas) y compara la mejor pérdida de validación.
# 2) Elimina s.pos del forward (sin información de posición). ¿Qué pasa con la pérdida? ¿Y con el texto generado?`;

ARTICLES.push({
  id:'transformers', area:'dl', areaName:'Deep Learning', title:'Transformers', lab:'attn', prefix:'tf-',
  kicker:'Deep Learning · Transformers · Artículo completo',
  lede:'La arquitectura de los modelos de lenguaje: self-attention, multi-head, codificación posicional y bloques residuales, desde NumPy hasta un mini-GPT entrenado con el texto de este portal.',
  teaser:'Self-attention en NumPy verificada contra PyTorch, un mini-GPT de 248.064 parámetros entrenado en CPU y el recuento exacto de los 124.439.808 parámetros de GPT-2 small.',
  meta:'Resultados obtenidos con NumPy 2.4 y PyTorch 2.14 en CPU · torch.manual_seed(42)',
  sections: [
    { id:'que-es', t:'Qué es', plain:'transformer atención arquitectura llm gpt bert', html:() => `
      <p>El <b>Transformer</b> es una arquitectura de red neuronal para secuencias presentada en 2017 en «Attention Is All You Need». Sustituye la recurrencia de las RNN por <b>atención</b>: cada elemento de la secuencia mira directamente a todos los demás y decide cuánto le importa cada uno. Así se procesa toda la secuencia en paralelo.</p>
      <p>Es la base de BERT, GPT, Claude, Llama y de los modelos de visión y audio más recientes. Un LLM es, en esencia, una pila de bloques Transformer entrenada para predecir el siguiente token.</p>` },
    { id:'intuicion', t:'Intuición', plain:'query key value búsqueda', html:() => `
      <p>En la frase «el gato no cruzó la calle porque estaba cansado», para entender «cansado» hay que saber que se refiere al gato. La atención lo resuelve como una búsqueda: cada palabra lanza una <b>pregunta</b> (Query), cada palabra ofrece una <b>etiqueta</b> (Key) y un <b>contenido</b> (Value). Donde la pregunta encaja con la etiqueta, se toma más contenido.</p>
      <p>Varias <b>cabezas</b> hacen búsquedas distintas en paralelo (una puede seguir la sintaxis, otra la posición, otra las referencias), y las capas se apilan para construir representaciones cada vez más abstractas.</p>
      <p class="callout">Sigue las cuentas en el <a href="#lab-attn">visualizador de atención</a> y recorre las 13 etapas de un modelo completo en el <a href="#transformer">Transformer Visualizer</a>.</p>` },
    { id:'matematicas', t:'Fundamento matemático', plain:'scaled dot product attention multi head layernorm residual', html:() => `
      <h4>Atención de producto escalar escalado</h4>
      <div class="math-block">${U.tex('\\text{Attention}(Q, K, V) = \\text{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}} + M\\right) V, \\qquad Q = XW_Q,\\ K = XW_K,\\ V = XW_V')}</div>
      <p>M es la máscara causal (−∞ por encima de la diagonal) en los modelos que generan texto. Dividir por ${U.tex('\\sqrt{d_k}', false)} evita que los productos escalares crezcan con la dimensión y saturen el softmax.</p>
      <h4>Multi-head</h4>
      <div class="math-block">${U.tex('\\text{MultiHead}(X) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)\\,W_O')}</div>
      <h4>Bloque (variante pre-norm, la de GPT-2 en adelante)</h4>
      <div class="math-block">${U.tex('X\' = X + \\text{MultiHead}(\\text{LN}(X)), \\qquad Y = X\' + \\text{FFN}(\\text{LN}(X\'))')}</div>
      <p>El coste de la atención es ${U.tex('O(T^2 \\cdot d)', false)} en la longitud T de la secuencia: duplicar el contexto cuadruplica el cálculo de la atención. Por eso el tamaño de contexto es un recurso caro.</p>` },
    { id:'paso-a-paso', t:'Algoritmo paso a paso', plain:'tokenizar embedding posición bloques logits', html:() => `<ol class="steps-ol">
      <li>Tokeniza el texto y convierte cada token en un vector (embedding).</li>
      <li>Suma a cada vector información de su posición.</li>
      <li>Pasa la secuencia por N bloques: atención multi-cabeza y red feed-forward, cada una con normalización y conexión residual.</li>
      <li>Proyecta el vector de cada posición sobre el vocabulario para obtener logits.</li>
      <li>Entrena con entropía cruzada para que cada posición prediga el token siguiente.</li>
      <li>Para generar: elige un token de la distribución, añádelo y repite.</li></ol>` },
    { id:'pseudocodigo', t:'Pseudocódigo', plain:'pseudocódigo', html:() => `<pre class="pseudo"><code>función TRANSFORMER(ids):
    X ← Embedding(ids) + Posición(0 … T−1)
    para cada bloque:
        H ← LayerNorm(X)
        X ← X + Concat(ATENCIÓN(H·W_Qᵢ, H·W_Kᵢ, H·W_Vᵢ) para cada cabeza i)·W_O
        X ← X + FFN(LayerNorm(X))
    devolver LayerNorm(X)·W_vocab          # logits

función ATENCIÓN(Q, K, V):
    S ← Q·Kᵀ / √d_k ;  S[j > i] ← −∞
    devolver softmax(S)·V</code></pre>` },
    { id:'desde-cero', t:'Implementación desde cero en Python', plain:'numpy self attention', html:() => `${U.code(NP)}
      <p>Con una secuencia de 4 elementos y d = 8, cada fila de la matriz de atención suma 1, la parte por encima de la diagonal es exactamente 0, y la salida coincide con <code>scaled_dot_product_attention</code> de PyTorch (comprobado con <code>np.allclose</code>).</p>` },
    { id:'sklearn', t:'Implementación con PyTorch: un mini-GPT', plain:'pytorch multiheadattention minigpt', html:() => `${U.code(BLOCK, 'PyTorch')}<p>Es la misma estructura que GPT-2 a escala mínima: 2 bloques, d<sub>model</sub> = 96, 4 cabezas, contexto de 64 caracteres y 248.064 parámetros. Para modelos reales se usan las clases de Hugging Face <code>transformers</code>.</p>` },
    { id:'dataset', t:'Dataset de ejemplo', plain:'corpus texto portal caracteres', html:() => `<p>El modelo se entrena con el propio texto de este portal: las definiciones de los temas, las descripciones de laboratorios y proyectos y los párrafos de los artículos, un total de 19.612 caracteres en castellano con un vocabulario de 94 caracteres distintos. El 90 % se usa para entrenar y el 10 % final para validar. Es un corpus minúsculo (GPT-3 se entrenó con cientos de miles de millones de tokens), elegido a propósito para que se vea lo que ocurre cuando faltan datos.</p>` },
    { id:'entrenamiento', t:'Entrenamiento', plain:'adamw early stopping pérdida validación sobreajuste', html:() => `${U.code(TRAIN)}
      ${CH.line({ xs:['1', '100', '200', '300', '400', '500', '600', '700', '800', '900', '1000', '1100', '1200'], series:[
        { name:'pérdida de entrenamiento', pts:[[0, 4.689], [1, 2.345], [2, 2.266], [3, 2.146], [4, 1.957], [5, 1.736], [6, 1.648], [7, 1.487], [8, 1.351], [9, 1.206], [10, 1.13], [11, 1.101], [12, 0.943]] },
        { name:'pérdida de validación', alt:true, pts:[[0, 4.36], [1, 2.583], [2, 2.466], [3, 2.323], [4, 2.287], [5, 2.19], [6, 2.114], [7, 2.154], [8, 2.152], [9, 2.201], [10, 2.326], [11, 2.277], [12, 2.354]] }],
        ymin:0, ymax:5, yticks:[0, 1, 2, 3, 4, 5], xlabel:'paso de entrenamiento', aria:'Pérdida durante el entrenamiento del mini-GPT', marks:[{ i:6, t:'mejor modelo' }],
        caption:'La validación toca fondo en el paso 600 (2,114) y después sube mientras el entrenamiento sigue bajando hasta 0,943: el modelo empieza a memorizar. El early stopping se queda con los pesos del paso 600. Entrenamiento completo: 100 segundos en CPU.' })}
      <p>Una primera prueba con un modelo mayor (3 bloques, d = 128, 632.960 parámetros, sin dropout) sobre un corpus sin limpiar de 26.490 caracteres lo mostró de forma extrema: la validación llegó a su mínimo (2,81) en el paso 250 y acabó en 5,13 al paso 2.000, con la pérdida de entrenamiento en 0,22. Demasiados parámetros para tan pocos datos.</p>` },
    { id:'evaluacion', t:'Evaluación', plain:'generación texto muestra', html:() => `${U.code(GEN)}
      <p>Texto generado a partir de «El modelo » con temperatura 0,8, tal cual lo produjo el modelo:</p>
      <blockquote class="sample">El modelo con dista. / Elos pícioner y el de suprobusta de con error un con en allos emprendizar decer la conticación de contrones de la pantacionos proproductos sobre paci</blockquote>
      <p>Con 20.000 caracteres ha aprendido la ortografía del castellano, palabras frecuentes («con», «de», «error», «sobre»), terminaciones como «-ación» y la puntuación, pero no significado. Es el primer peldaño de lo que hace un LLM: la misma arquitectura, con miles de veces más parámetros y millones de veces más texto, produce frases coherentes.</p>` },
    { id:'metricas', t:'Métricas', plain:'entropía cruzada perplejidad', html:() => `
      <div class="math-block">${U.tex('\\text{perplejidad} = e^{\\,L}, \\qquad L = -\\frac{1}{N}\\sum_{t} \\log p(x_t \\mid x_{<t})')}</div>
      <p>Un modelo que no sabe nada reparte la probabilidad por igual entre los 94 caracteres: pérdida ${U.tex('\\ln 94 = 4{,}54', false)}, perplejidad 94. Al empezar, el modelo mide 4,70, cerca de ese valor teórico. El mejor modelo llega a 2,114 en validación, una perplejidad de 8,3: en cada posición duda, en promedio, como si eligiera entre unos 8 caracteres en lugar de 94.</p>` },
    { id:'visualizacion', t:'Visualización', plain:'parámetros gpt-2 embeddings capas', html:() => `
      ${U.code(PARAMS, 'Recuento de parámetros de GPT-2 small')}
      ${CH.bars([['12 bloques Transformer', 85054464, true], ['Embeddings de tokens (50.257 × 768)', 38597376], ['Embeddings de posición (1.024 × 768)', 786432], ['LayerNorm final', 1536]], { fmt:v => (v / 1e6).toFixed(1) + ' M', caption:'Dónde están los 124.439.808 parámetros de GPT-2 small. Cada bloque tiene 7.087.872, de los que dos tercios están en la red feed-forward.' })}` },
    { id:'ventajas', t:'Ventajas', plain:'ventajas', html:() => `<ul><li>Procesa toda la secuencia en paralelo: entrenamiento mucho más rápido que las RNN en GPU.</li><li>Conecta directamente elementos lejanos de la secuencia.</li><li>Escala de forma predecible: más datos, parámetros y cálculo dan mejores modelos.</li><li>Sirve para texto, imágenes (ViT), audio, código, proteínas y combinaciones multimodales.</li></ul>` },
    { id:'limitaciones', t:'Limitaciones', plain:'limitaciones', html:() => `<ul><li>Coste cuadrático de la atención con la longitud del contexto.</li><li>Necesita enormes cantidades de datos y cálculo para dar lo mejor.</li><li>Sin información de posición no distingue el orden: hay que añadirla.</li><li>Los modelos grandes son caros de servir y difíciles de interpretar.</li></ul>` },
    { id:'hiperparametros', t:'Hiperparámetros', plain:'d_model capas cabezas contexto dropout', html:() => CH.table(['Parámetro', 'Mini-GPT (este artículo)', 'GPT-2 small', 'Efecto'], [
      ['<code>d_model</code>', '96', '768', 'Dimensión de los vectores de cada token.'],
      ['<code>n_layers</code>', '2', '12', 'Número de bloques apilados.'],
      ['<code>n_heads</code>', '4', '12', 'Cabezas de atención; d_model se reparte entre ellas.'],
      ['<code>d_ff</code>', '384', '3.072', 'Ancho de la red feed-forward (normalmente 4 · d_model).'],
      ['<code>context</code>', '64 caracteres', '1.024 tokens', 'Longitud máxima de la secuencia.'],
      ['<code>vocab</code>', '94 caracteres', '50.257 tokens BPE', 'Tamaño del vocabulario.'],
      ['<code>dropout</code>', '0.2', '0.1', 'Regularización durante el entrenamiento.'],
      ['<code>lr</code> / <code>weight_decay</code>', '2e-3 / 0.1', '—', 'Optimizador AdamW.']]) },
    { id:'casos-de-uso', t:'Casos de uso', plain:'casos uso', html:() => `<ul><li>Modelos de lenguaje y asistentes conversacionales.</li><li>Traducción automática y resumen.</li><li>Búsqueda semántica y RAG con embeddings (BERT y derivados).</li><li>Visión (ViT), voz (Whisper) y generación de código.</li></ul>` },
    { id:'industria', t:'Aplicaciones industriales', plain:'industria documentación agentes series temporales', html:() => `<ul><li><b>Asistentes sobre documentación técnica</b> con RAG: manuales, normativa, históricos de incidencias.</li><li><b>Clasificación y extracción</b> de información de tickets, correos y partes de trabajo.</li><li><b>Series temporales:</b> modelos fundacionales de previsión basados en Transformers.</li><li><b>Agentes</b> que consultan sistemas internos y ejecutan tareas.</li></ul>` },
    { id:'ejercicio', t:'Ejercicio práctico', plain:'ejercicio cabezas posición', html:() => `<p>Varía el número de cabezas y elimina la codificación posicional para ver qué aporta cada pieza.</p>${U.code(EX, 'Plantilla')}` },
    { id:'codigo', t:'Código completo', plain:'código colab github', html:() => `<p>La atención en NumPy, el mini-GPT completo con su entrenamiento y generación, y el recuento de GPT-2:</p>${CH.repo('transformer.py')}<p>El entrenamiento tarda unos 2 minutos en CPU; en Colab con GPU, segundos.</p>` },
    { id:'referencias', t:'Referencias y papers', plain:'referencias vaswani bahdanau radford devlin layer norm', html:() => CH.refs([
      'A. Vaswani et al. (2017). «Attention Is All You Need». <i>NeurIPS 2017</i>. <a href="#paper-attention-2017">Ficha en la biblioteca</a>.',
      'D. Bahdanau, K. Cho, Y. Bengio (2015). «Neural Machine Translation by Jointly Learning to Align and Translate». <i>ICLR 2015</i>.',
      'J. L. Ba, J. R. Kiros, G. E. Hinton (2016). «Layer Normalization». arXiv:1607.06450.',
      'A. Radford, J. Wu, R. Child, D. Luan, D. Amodei, I. Sutskever (2019). «Language Models are Unsupervised Multitask Learners». Informe técnico de OpenAI (GPT-2).',
      'J. Devlin, M.-W. Chang, K. Lee, K. Toutanova (2019). «BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding». <i>NAACL 2019</i>. <a href="#paper-bert-2019">Ficha en la biblioteca</a>.',
      'A. Karpathy. <i>nanoGPT</i> (repositorio de código). github.com/karpathy/nanoGPT.']) },
  ],
});
})();
