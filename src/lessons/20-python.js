/* =========================================================================
   Nivel 2 · Python para IA. Mismo enfoque que el nivel 1: la idea primero,
   ejemplos cortos que se pueden escribir a mano y el porqué en IA.
   Todos los resultados salen de notebooks/nivel2_python.py.
   ========================================================================= */
(() => {
const { idea, enIA, ojo, ex, quiz, checklist } = LX;
const out = t => `<pre class="out"><span class="eyebrow">Salida</span>${t}</pre>`;

const C_VAR = `precio = 12.5          # float: número con decimales
unidades = 3           # int: número entero
producto = "vino"      # str: texto
en_oferta = True       # bool: verdadero o falso

total = precio * unidades
print(f"{unidades} × {producto} = {total} €")`;
const C_OPS = `7 / 2     # 3.5  división normal
7 // 2    # 3    división entera
7 % 2     # 1    resto
2 ** 3    # 8    potencia`;
const C_LIST = `notas = [7, 5, 9, 6]

len(notas)      # 4    cuántos elementos
sum(notas)      # 27
notas[0]        # 7    ¡el primero es el 0!
notas[-1]       # 6    el último
notas[1:3]      # [5, 9]  del 1 al 3, sin incluir el 3

notas.append(8)                  # añade al final
sum(notas) / len(notas)          # 7.0  la media`;
const C_DICT = `vino = {"alcohol": 9.4, "acidez": 0.70, "calidad": 5}

vino["alcohol"]        # 9.4
vino["calidad"] = 6    # cambiar un valor
vino.keys()            # los nombres: alcohol, acidez, calidad`;
const C_IF = `def etiqueta(calidad):
    if calidad >= 7:
        return "bueno"
    elif calidad >= 5:
        return "normal"
    else:
        return "malo"

for c in [4, 5, 7]:
    print(c, "→", etiqueta(c))`;
const C_COMP = `[n ** 2 for n in range(5)]         # [0, 1, 4, 9, 16]
[n for n in notas if n >= 6]       # [7, 9, 6, 8]  solo las aprobadas`;
const C_FUN = `def media(valores):
    return sum(valores) / len(valores)

def precio_final(precio, descuento=0.0):     # descuento tiene valor por defecto
    return precio * (1 - descuento)

media([7, 5, 9, 6, 8])       # 7.0
precio_final(20)             # 20.0
precio_final(20, 0.25)       # 15.0`;
const C_NP = `import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0])

x * 2          # [2. 4. 6. 8.]     ¡sin bucle!
x + 10         # [11. 12. 13. 14.]
x ** 2         # [1. 4. 9. 16.]
x.mean()       # 2.5
x.max()        # 4.0

x > 2          # [False False True True]
x[x > 2]       # [3. 4.]   filtrar con una condición

u, v = np.array([3, 1]), np.array([1, 2])
u @ v          # 5   el producto escalar del nivel 1`;
const C_SPEED = `datos = list(range(1_000_000))
arr = np.arange(1_000_000, dtype=float)

# Con un bucle de Python
total = 0
for d in datos:
    total += d * d

# Con NumPy: una sola línea
total = (arr * arr).sum()`;
const C_PD = `import pandas as pd

df = pd.read_csv("ventas.csv")

df.shape                  # (6, 3): 6 filas y 3 columnas
df.head()                 # las primeras filas
df["ventas"]              # una columna
df.isna().sum()           # cuántos nulos hay en cada columna → ventas: 2`;
const C_CLEAN = `df["ventas"].mean()                  # 88.75  (Pandas ignora los nulos)

df.dropna()                          # opción A: quitar filas con nulos → quedan 4
mediana = df["ventas"].median()      # 87.5
df = df.fillna({"ventas": mediana})  # opción B: rellenarlos con la mediana`;
const C_GROUP = `df.groupby("tienda")["ventas"].sum()
# Centro    207.5
# Playa     175.0
# Puerto    147.5

df[df["ventas"] > 90]      # filtrar filas: solo las que venden más de 90`;
const C_PLT = `import matplotlib.pyplot as plt

plt.hist(vinos["alcohol"], bins=20)        # histograma: cómo se reparten los valores
plt.title("Grado de alcohol de los vinos")
plt.xlabel("alcohol (%)"); plt.ylabel("número de vinos")
plt.show()

plt.scatter(vinos["alcohol"], vinos["quality"], s=8)   # dispersión: relación entre dos columnas
plt.xlabel("alcohol (%)"); plt.ylabel("calidad")
plt.show()`;
const C_PROJ = `import pandas as pd
import matplotlib.pyplot as plt

URL = "https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/data/winequality-red.csv"
vinos = pd.read_csv(URL, sep=";")          # ¡este CSV separa con punto y coma!

# 1. Primer vistazo
print(vinos.shape)                          # (1599, 12)
print(vinos.head())
print(vinos.isna().sum().sum())             # 0 nulos
print(vinos.duplicated().sum())             # 240 filas repetidas

# 2. ¿Cómo se reparte la calidad?
print(vinos["quality"].value_counts().sort_index())

# 3. ¿Qué tienen en común los vinos buenos?
print(vinos.groupby("quality")["alcohol"].mean().round(2))
print(vinos.corr()["quality"].sort_values().round(3))

# 4. Gráficos
fig, ax = plt.subplots(1, 3, figsize=(15, 4))
vinos["quality"].value_counts().sort_index().plot.bar(ax=ax[0], title="Vinos por calidad")
vinos.boxplot(column="alcohol", by="quality", ax=ax[1])
ax[2].scatter(vinos["alcohol"], vinos["volatile acidity"], c=vinos["quality"], s=8)
ax[2].set_xlabel("alcohol (%)"); ax[2].set_ylabel("acidez volátil")
plt.tight_layout(); plt.show()`;

LESSONS.push({
  id:'lesson-2', slug:'python', level:2, title:'Nivel 2 · Python para IA', short:'Python', prefix:'p2-',
  time:'PT6H', teaches:'Variables, listas, diccionarios, condiciones, bucles, funciones, NumPy, Pandas y Matplotlib',
  kicker:'Ruta de aprendizaje · Nivel 2 de 10',
  lede:'El Python justo para empezar a trabajar con datos: las piezas básicas del lenguaje, NumPy para hacer cuentas con muchos números a la vez, Pandas para manejar tablas y Matplotlib para dibujarlas. Termina con tu primer análisis de datos reales.',
  meta:'Unas 5–7 horas · No hace falta instalar nada: todo funciona en Google Colab · Código de todos los ejemplos en notebooks/nivel2_python.py',
  sections: [
    { id:'objetivos', t:'Cómo usar esta lección', plain:'objetivos python colab empezar', html:() => `
      <p>Python es el idioma de la IA: casi todas las librerías de machine learning (scikit-learn, PyTorch, TensorFlow) se usan desde Python. No necesitas dominarlo entero; necesitas <b>soltura con unas pocas piezas</b> y cuatro herramientas.</p>
      ${CH.table(['Pieza', 'Para qué sirve', 'En un proyecto de IA'], [
        ['Variables y tipos', 'Guardar un dato con un nombre', 'Parámetros, rutas de archivos, resultados'],
        ['Listas y diccionarios', 'Guardar muchos datos juntos', 'Configuraciones, resultados de varios experimentos'],
        ['Condiciones, bucles y funciones', 'Decidir, repetir y reutilizar', 'Limpiar datos, entrenar varias veces, evaluar'],
        ['NumPy', 'Hacer cuentas con muchos números a la vez', 'Los datos de cualquier modelo son arrays de NumPy'],
        ['Pandas', 'Manejar tablas', 'Cargar, limpiar y explorar los datos'],
        ['Matplotlib', 'Dibujar gráficos', 'Entender los datos y los resultados']])}
      <h4>Antes de empezar: abre Google Colab</h4>
      <p><a href="https://colab.research.google.com" target="_blank" rel="noopener">Google Colab</a> es un cuaderno de Python en el navegador, gratis y sin instalar nada. Escribes código en una <b>celda</b>, pulsas <kbd>Mayús</kbd> + <kbd>Intro</kbd> y ves el resultado debajo. El botón «Abrir en Google Colab» del final de la lección carga todos los ejemplos.</p>
      <p>El método es el del nivel 1: <b>la idea en una frase</b>, un ejemplo corto y dónde aparece en IA. Con una diferencia: aquí se aprende <b>escribiendo</b>. Teclea los ejemplos en vez de copiarlos, cambia los números y mira qué pasa. Equivocarse y leer el error es parte del aprendizaje.</p>` },

    { id:'variables', t:'1 · Variables y tipos', plain:'variables tipos int float str bool print f-string operaciones', html:() => `
      ${idea('Una variable es un nombre que apunta a un dato.')}
      <p>Con <code>=</code> guardas un valor bajo un nombre para usarlo después. Cada dato tiene un <b>tipo</b>, y los cuatro básicos son estos:</p>
      ${U.code(C_VAR)}
      ${out('3 × vino = 37.5 €')}
      <p>La <code>f</code> delante de las comillas (una <b>f-string</b>) permite meter variables dentro del texto entre llaves. Es la forma más cómoda de mostrar resultados.</p>
      <h4>Operaciones con números</h4>
      ${U.code(C_OPS)}
      ${ojo('en Python los decimales se escriben con <b>punto</b>, no con coma: <code>12.5</code>, nunca <code>12,5</code>. Con coma, Python entiende dos números distintos.')}
      ${enIA('la tasa de aprendizaje del nivel 1 se guarda así: <code>eta = 0.1</code>. Los hiperparámetros de un modelo son, sencillamente, variables.')}` },

    { id:'colecciones', t:'2 · Listas y diccionarios', plain:'lista diccionario índice slicing append len sum', html:() => `
      ${idea('Una lista guarda datos en orden; un diccionario los guarda con nombre.')}
      <h4>Listas: una fila de cajas numeradas</h4>
      ${U.code(C_LIST)}
      ${ojo('los índices empiezan en <b>0</b>, no en 1. El primer elemento es <code>notas[0]</code>. Y en <code>notas[1:3]</code> el 3 no se incluye.')}
      <h4>Diccionarios: cajas con etiqueta</h4>
      <p>En vez de por posición, cada valor se busca por su nombre (su <b>clave</b>). Es perfecto para describir una cosa con varias propiedades:</p>
      ${U.code(C_DICT)}
      ${enIA('una lista de resultados de cada época de entrenamiento, o un diccionario con la configuración del modelo: <code>{"capas": 3, "eta": 0.01}</code>.')}` },

    { id:'control', t:'3 · Condiciones y bucles', plain:'if elif else for range bucle comprensión listas indentación', html:() => `
      ${idea('<code>if</code> decide qué hacer; <code>for</code> repite lo mismo para cada elemento.')}
      ${U.code(C_IF)}
      ${out('4 → malo\n5 → normal\n7 → bueno')}
      <p>Fíjate en los <b>dos puntos</b> al final de cada <code>if</code>, <code>elif</code>, <code>else</code> y <code>for</code>, y en que lo de dentro va <b>desplazado a la derecha</b> (4 espacios). En Python esa sangría no es estética: es lo que dice qué líneas están dentro del bloque.</p>
      ${ojo('mezclar la sangría o olvidar los dos puntos da <code>IndentationError</code> o <code>SyntaxError</code>. Otro clásico: usar <code>=</code> (guardar) en vez de <code>==</code> (comparar) dentro de un <code>if</code>.')}
      <h4>Atajo muy usado: listas por comprensión</h4>
      <p>Crear una lista nueva a partir de otra en una línea. Se lee casi como en español: «n al cuadrado para cada n en…».</p>
      ${U.code(C_COMP)}
      ${enIA('entrenar un modelo es un bucle: <code>for epoca in range(100):</code> calcula el error, calcula el gradiente, da un paso. Es el bucle del descenso de gradiente del nivel 1.')}` },

    { id:'funciones', t:'4 · Funciones', plain:'funciones def return parámetros valor por defecto', html:() => `
      ${idea('Una función es una receta con nombre: recibe datos, hace algo y devuelve un resultado.')}
      ${U.code(C_FUN)}
      <p><code>def</code> crea la función, entre paréntesis van sus <b>parámetros</b> y <code>return</code> dice qué devuelve. Si un parámetro tiene valor por defecto (<code>descuento=0.0</code>) puedes no pasarlo.</p>
      ${ojo('olvidar el <code>return</code>. La función se ejecuta, pero devuelve <code>None</code> y el error aparece más adelante, lejos de donde está el fallo.')}
      <p><b>Regla práctica:</b> si copias el mismo código dos veces, conviértelo en una función.</p>
      ${enIA('en scikit-learn todo son funciones y métodos con parámetros por defecto: <code>RandomForestClassifier(n_estimators=100)</code>. Leer su documentación es leer la lista de parámetros.')}` },

    { id:'numpy', t:'5 · NumPy: cuentas con muchos números a la vez', plain:'numpy array vectorización máscara booleana velocidad', html:() => `
      ${idea('Un array de NumPy es una lista de números con la que puedes operar entera, sin bucles.')}
      <p>Con una lista normal, multiplicar todo por 2 exige un bucle. Con NumPy basta con <code>x * 2</code>: la operación se aplica a cada elemento. A esto se le llama <b>vectorizar</b>, y es la razón por la que los vectores del nivel 1 se programan tan fácil.</p>
      ${U.code(C_NP)}
      <p>La línea <code>x[x > 2]</code> es muy útil: la condición crea una lista de <code>True</code>/<code>False</code> (una <b>máscara</b>) y con ella te quedas solo con los elementos que la cumplen.</p>
      <h4>¿Por qué no usar bucles? Por velocidad</h4>
      <p>Sumar los cuadrados de un millón de números de las dos formas:</p>
      ${U.code(C_SPEED)}
      ${CH.bars([['Bucle de Python', 27], ['NumPy', 1.6, true]], { fmt: v => String(v).replace('.', ',') + ' ms', caption: 'Tiempo medido en nuestra prueba (el mejor de 5 intentos). NumPy fue unas 16 veces más rápido; la cifra exacta cambia según el ordenador, pero la diferencia siempre es grande.' })}
      ${enIA('un lote de 32 imágenes de 28 × 28 píxeles es un array de forma (32, 784), y una capa de red neuronal es <code>X @ W</code>. PyTorch y TensorFlow funcionan con la misma idea y casi la misma sintaxis que NumPy.')}` },

    { id:'pandas', t:'6 · Pandas: tablas', plain:'pandas dataframe read_csv head shape isna dropna fillna groupby filtrar', html:() => `
      ${idea('Un DataFrame de Pandas es una hoja de cálculo que manejas con código.')}
      <p>Imagina este archivo <code>ventas.csv</code>, con dos huecos (datos que faltan):</p>
      ${CH.table(['tienda', 'mes', 'ventas'], [['Centro', 'ene', '120'], ['Centro', 'feb', '<i>vacío</i>'], ['Playa', 'ene', '80'], ['Playa', 'feb', '95'], ['Puerto', 'ene', '<i>vacío</i>'], ['Puerto', 'feb', '60']])}
      <h4>Paso 1 · Cargar y mirar</h4>
      ${U.code(C_PD)}
      <p>Las casillas vacías aparecen como <code>NaN</code> («no es un número»). <b>Siempre</b> hay que buscarlas antes de hacer nada más.</p>
      <h4>Paso 2 · Limpiar los nulos</h4>
      ${U.code(C_CLEAN)}
      <p>¿Quitar o rellenar? Si faltan pocas filas, quitarlas es lo más sencillo. Si son muchas, perderías demasiados datos, y es mejor rellenar con un valor razonable, como la mediana.</p>
      <h4>Paso 3 · Agrupar y filtrar</h4>
      <p><code>groupby</code> es la herramienta estrella: «para cada tienda, suma sus ventas». Es como una tabla dinámica de Excel en una línea.</p>
      ${U.code(C_GROUP)}
      ${ojo('un CSV no siempre separa con comas. Si al cargarlo te sale una sola columna con todo junto, prueba <code>pd.read_csv(archivo, sep=";")</code>. Te pasará en el proyecto.')}
      ${enIA('el 80 % del trabajo real en machine learning es esto: cargar, limpiar y entender los datos antes de entrenar nada. Un modelo entrenado con datos sucios da resultados sucios.')}` },

    { id:'matplotlib', t:'7 · Matplotlib: gráficos', plain:'matplotlib gráfico histograma dispersión barras título ejes', html:() => `
      ${idea('Un gráfico te enseña en un segundo lo que una tabla esconde.')}
      <p>Con tres tipos de gráfico cubres casi todo al empezar:</p>
      ${CH.table(['Gráfico', 'Pregunta que responde', 'Código'], [
        ['Histograma', '¿Cómo se reparten los valores de una columna?', '<code>plt.hist(col)</code>'],
        ['Dispersión', '¿Hay relación entre dos columnas?', '<code>plt.scatter(x, y)</code>'],
        ['Barras', '¿Cuánto hay de cada categoría?', '<code>plt.bar(nombres, valores)</code>']])}
      ${U.code(C_PLT)}
      ${ojo('un gráfico sin título ni nombres en los ejes no sirve para nada una semana después. Ponlos siempre.')}
      ${enIA('la curva de aprendizaje (el error en cada época) es un gráfico de líneas, y con ella se detecta el sobreajuste. Lo verás en el <a href="#lab-overfit">laboratorio de sobreajuste</a>.')}` },

    { id:'ejercicios', t:'Ejercicios', plain:'ejercicios soluciones práctica python', html:() => `
      <p>Escríbelos en Colab antes de abrir la solución. Si algo da error, lee el mensaje: casi siempre dice la línea y el motivo.</p>
      ${ex(1, '¿Qué muestra <code>print(f"{2 + 3} manzanas")</code>? ¿Y <code>10 // 3</code> y <code>10 % 3</code>?', '<p><code>5 manzanas</code>. <code>10 // 3</code> es <b>3</b> (división entera) y <code>10 % 3</code> es <b>1</b> (el resto).</p>')}
      ${ex(2, 'Con <code>edades = [23, 35, 18, 42, 29]</code>, obtén el primer y el último elemento, los tres primeros y la media.', '<p><code>edades[0]</code> → 23, <code>edades[-1]</code> → 29, <code>edades[:3]</code> → [23, 35, 18], <code>sum(edades) / len(edades)</code> → <b>29.4</b>.</p>', 'la media es la suma entre el número de elementos.')}
      ${ex(3, 'Escribe una función <code>es_par(n)</code> que devuelva <code>True</code> si n es par. Úsala para quedarte solo con los pares de <code>range(10)</code>.', '<pre><code>def es_par(n):\n    return n % 2 == 0\n\n[n for n in range(10) if es_par(n)]   # [0, 2, 4, 6, 8]</code></pre>', 'un número es par si el resto de dividir entre 2 es 0.')}
      ${ex(4, 'Con NumPy y sin bucles: dado <code>t = np.array([12, 18, 25, 31, 9])</code> (temperaturas en °C), pásalas a Fahrenheit (F = C · 1,8 + 32) y quédate con las mayores de 20 °C.', '<pre><code>t * 1.8 + 32     # [53.6 64.4 77.  87.8 48.2]\nt[t > 20]        # [25 31]</code></pre>')}
      ${ex(5, '<b>El ejercicio del nivel.</b> Carga el <code>ventas.csv</code> de la lección, cuenta los nulos, rellénalos con la mediana y calcula las ventas totales por tienda.', '<p><code>df.isna().sum()</code> da 2 nulos en <code>ventas</code>. La mediana es 87,5. Tras <code>fillna</code>, <code>df.groupby("tienda")["ventas"].sum()</code> da Centro <b>207,5</b>, Playa <b>175</b> y Puerto <b>147,5</b>.</p>', 'si no tienes el archivo, créalo en Colab con el código del cuaderno de la lección.')}
      ${ex(6, 'Este código da error. ¿Por qué? <pre><code>def doble(x)\n    return x * 2</code></pre>', '<p>Faltan los <b>dos puntos</b> después de <code>def doble(x)</code>. Python responde <code>SyntaxError: expected \':\'</code>.</p>')}` },

    { id:'proyecto', t:'Proyecto: tu primer análisis de datos reales', plain:'proyecto wine quality análisis exploratorio vino calidad alcohol correlación', html:() => `
      <p>Vas a explorar <a href="#datasets">Wine Quality</a>: 1.599 vinos tintos portugueses con 11 medidas químicas cada uno y una nota de calidad del 0 al 10 que pusieron catadores expertos. La pregunta: <b>¿qué tienen en común los vinos buenos?</b></p>
      ${U.code(C_PROJ, 'Solución de referencia')}
      <h4>Lo que deberías encontrar</h4>
      <p><b>1. Los datos están limpios, pero no del todo.</b> Hay 1.599 filas y 12 columnas, sin nulos. Sin embargo, 240 filas están repetidas: conviene saberlo, porque inflan algunos resultados.</p>
      <p><b>2. La calidad está muy concentrada.</b> Casi todos los vinos son de 5 o 6. Los excelentes (7 u 8) son solo 217, un 13,6 %.</p>
      ${CH.bars([['Calidad 3', 10], ['Calidad 4', 53], ['Calidad 5', 681, true], ['Calidad 6', 638, true], ['Calidad 7', 199], ['Calidad 8', 18]], { fmt: v => v.toLocaleString('es-ES'), caption: 'Número de vinos de cada calidad. Si algún día entrenas un modelo con estos datos, esta desigualdad importará: le costará aprender los extremos.' })}
      <p><b>3. Más alcohol, mejor nota.</b> La media de alcohol sube casi siempre con la calidad: 9,90 % en los de calidad 5, 10,63 % en los de 6, 11,47 % en los de 7 y 12,09 % en los de 8.</p>
      <p><b>4. Las dos pistas más fuertes.</b> La <b>correlación</b> es un número entre −1 y 1 que dice si dos columnas suben juntas (positiva) o una sube cuando la otra baja (negativa):</p>
      ${CH.bars([['alcohol', 0.476, true], ['sulfatos', 0.251], ['ácido cítrico', 0.226], ['azúcar residual', 0.014], ['densidad', -0.175], ['dióxido de azufre total', -0.185], ['acidez volátil', -0.391, true]], { fmt: v => (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2).replace('.', ','), max: 0.5, caption: 'Correlación de algunas medidas químicas con la calidad. El alcohol va a favor y la acidez volátil (el sabor avinagrado) en contra.' })}
      ${ojo('correlación no es causa. Que los vinos buenos tengan más alcohol no significa que añadir alcohol mejore un vino. Lo verás en el <a href="#lesson-3">nivel 3</a>.')}
      <p><b>Para ir más allá:</b> (1) quita los duplicados con <code>vinos.drop_duplicates()</code> y comprueba si cambian las conclusiones; (2) haz lo mismo con los vinos blancos (<code>winequality-white.csv</code>); (3) escribe en tres frases, para alguien que no sabe de datos, qué has descubierto.</p>` },

    { id:'test', t:'Test de autoevaluación', plain:'test preguntas autoevaluación python', html:() => quiz('nivel-2', [
      { q:'¿Qué tipo de dato es <code>3.0</code>?', o:['int', 'float', 'str', 'bool'], ok:1, why:'Tiene parte decimal (aunque sea 0), así que es un float.' },
      { q:'Con <code>notas = [7, 5, 9, 6]</code>, ¿qué da <code>notas[1]</code>?', o:['7', '5', '9', 'Error'], ok:1, why:'Los índices empiezan en 0: notas[0] es 7 y notas[1] es 5.' },
      { q:'¿Cuándo es mejor un diccionario que una lista?', o:['Cuando los datos son todos números', 'Cuando quieres buscar cada valor por su nombre', 'Nunca, son iguales', 'Cuando hay más de 100 datos'], ok:1, why:'Un diccionario asocia cada valor a una clave: vino["alcohol"] se entiende mejor que vino[0].' },
      { q:'¿Qué indica en Python qué líneas están dentro de un <code>if</code> o un <code>for</code>?', o:['Las llaves { }', 'La sangría (espacios al principio de la línea)', 'Los paréntesis', 'Un punto y coma al final'], ok:1, why:'En Python la sangría forma parte de la sintaxis; por eso un espacio de más o de menos puede dar error.' },
      { q:'Una función no tiene <code>return</code>. ¿Qué devuelve?', o:['0', 'Un error', 'None', 'El último valor calculado'], ok:2, why:'Sin return, la función devuelve None, y el fallo suele aparecer más adelante.' },
      { q:'Con <code>x = np.array([1, 2, 3])</code>, ¿qué da <code>x * 2</code>?', o:['[1, 2, 3, 1, 2, 3]', '[2, 4, 6]', '12', 'Error'], ok:1, why:'NumPy aplica la operación a cada elemento. (Con una lista normal, [1, 2, 3] * 2 repetiría la lista, que es la primera opción).' },
      { q:'¿Por qué se usa NumPy en vez de bucles para operar con muchos números?', o:['Porque el código queda más largo', 'Porque es mucho más rápido y más corto', 'Porque los bucles no funcionan con decimales', 'Por costumbre'], ok:1, why:'Las operaciones de NumPy se ejecutan en código compilado: en la prueba de la lección, unas 16 veces más rápido.' },
      { q:'¿Qué hace <code>df.isna().sum()</code>?', o:['Borra los nulos', 'Cuenta los valores nulos de cada columna', 'Suma todas las columnas', 'Rellena los nulos con 0'], ok:1, why:'isna() marca con True cada hueco y sum() cuenta cuántos True hay por columna.' },
      { q:'Quieres la media de ventas de cada tienda. ¿Qué usas?', o:['df.mean()', 'df.groupby("tienda")["ventas"].mean()', 'df["tienda"].mean()', 'df.sort_values("tienda")'], ok:1, why:'groupby separa la tabla por tienda y luego calcula la media de ventas en cada grupo.' },
      { q:'Cargas un CSV y te sale una sola columna con todo el texto junto. ¿Qué es lo más probable?', o:['El archivo está vacío', 'El separador no es la coma: prueba sep=";"', 'Faltan datos', 'Hay que instalar otra librería'], ok:1, why:'Muchos CSV europeos, como el de Wine Quality, separan con punto y coma.' },
    ]) },

    { id:'criterios', t:'¿Has asimilado el nivel?', plain:'criterios completado checklist python', html:() => `
      <p>Marca cada punto solo si puedes hacerlo <b>sin mirar la lección</b> (buscar en Google la sintaxis exacta sí vale: los profesionales lo hacen a diario). El progreso se guarda solo en este navegador.</p>
      ${checklist('nivel-2', [
        'Sé crear variables de los cuatro tipos básicos y mostrarlas con una f-string.',
        'Sé acceder a elementos de una lista por su posición (empezando en 0) y a los de un diccionario por su clave.',
        'Sé escribir un if/elif/else y un bucle for, con la sangría correcta.',
        'Sé escribir una función con parámetros y return.',
        'Sé operar con un array de NumPy sin bucles y filtrarlo con una condición.',
        'Sé cargar un CSV con Pandas, contar los nulos y decidir si quitarlos o rellenarlos.',
        'Sé usar groupby para calcular un total o una media por grupo.',
        'Sé hacer un histograma y un gráfico de dispersión con título y ejes.',
        'He terminado el análisis de Wine Quality y sé explicar qué he encontrado.',
        'He sacado al menos 8 de 10 en el test.'])}
      <h4>Para practicar más</h4>
      ${CH.refs([
        'Documentación oficial de Python en español: <i>El tutorial de Python</i> (docs.python.org/es), capítulos 3 a 5.',
        'Pandas: <i>10 minutes to pandas</i>, la guía rápida oficial.',
        'J. VanderPlas (2023). <i>Python Data Science Handbook</i>, 2.ª ed. O\'Reilly. Gratis en la web del autor; capítulos de NumPy, Pandas y Matplotlib.',
        'P. Cortez et al. (2009). Modeling wine preferences by data mining from physicochemical properties. <i>Decision Support Systems</i>, 47(4). Origen del dataset Wine Quality (UCI, licencia CC BY 4.0).'])}
      <h4>Ejecuta el código de la lección</h4>
      <p>Todos los ejemplos, los ejercicios y el proyecto, con los datos incluidos:</p>
      ${CH.repo('nivel2_python.py')}
      <p class="next-level">Anterior: <a href="#lesson-1">Nivel 1 · Matemáticas</a> · Siguiente: <a href="#lesson-3">Nivel 3 · Estadística</a> · <a href="#path">Volver a la ruta</a></p>` },
  ],
});
})();
