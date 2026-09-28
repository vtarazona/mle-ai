/* =========================================================================
   PROYECTO: PREDICCIÓN DE BAJAS DE CLIENTES (CHURN) EN TELECOMUNICACIONES
   Todas las cifras salen de notebooks/churn_telco.py (scikit-learn 1.8,
   XGBoost 3.2, random_state = 42). La API está en notebooks/api/churn_api.py.
   ========================================================================= */
const CHURN_CALC = {"intercept":-0.81155,"auc":0.835,"num":{"tenure":{"mean":32.4851,"std":24.5666,"w":-0.71041},"MonthlyCharges":{"mean":64.93,"std":30.1354,"w":0.39055}},"cat":{"Contract":{"Month-to-month":0.46692,"One year":-0.29404,"Two year":-0.97301},"InternetService":{"DSL":-0.47057,"Fiber optic":0.08268,"No":-0.41223},"PaymentMethod":{"Bank transfer (automatic)":-0.32576,"Credit card (automatic)":-0.35475,"Electronic check":0.14126,"Mailed check":-0.26087},"TechSupport":{"No":0.01835,"No internet service":-0.41223,"Yes":-0.40624},"OnlineSecurity":{"No":0.07128,"No internet service":-0.41223,"Yes":-0.45918}}};
const CHURN_STAGES = (() => {
const pct = v => String(v).replace('.', ',') + ' %';
const k$ = v => (v / 1000).toFixed(1).replace('.', ',') + ' k$';
const CURVA = [[0.05, 45491], [0.10, 48906], [0.15, 50812], [0.20, 51252], [0.25, 51954], [0.30, 50752], [0.35, 48868], [0.40, 46976], [0.45, 45111], [0.50, 43841], [0.55, 36890], [0.60, 32443], [0.65, 25933], [0.70, 15743], [0.75, 6694], [0.80, 3053], [0.85, 292]];
const cm = (tn, fp, fn, tp) => CH.table(['', 'Predice «se queda»', 'Predice «se va»'], [['<b>Se quedó</b>', `${tn} ✓`, `${fp} (falsa alarma)`], ['<b>Se fue</b>', `${fn} (baja no detectada)`, `${tp} ✓`]]);
const sel = (id, label, opts) => `<label class="cc-f"><span>${label}</span><select data-k="${id}">${opts.map(([v, t, s]) => `<option value="${v}"${s ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`;
return [
  { t:'Problema', id:'problema', plain:'churn bajas clientes operadora retención coste', html:() => `
    <p>Una operadora de telecomunicaciones pierde cada mes una parte de sus clientes (<i>churn</i>). Conseguir un cliente nuevo cuesta bastante más que conservar uno, así que el equipo de retención quiere <b>llamar a tiempo a quienes están a punto de irse</b> con una oferta. Pero llamar a todos es caro, y llamar al azar no sirve.</p>
    <p><b>Objetivo:</b> dar a cada cliente una <b>probabilidad de baja</b> y decidir a quién contactar para que la campaña gane el máximo dinero posible.</p>
    ${CH.table(['Pregunta', 'Respuesta en este proyecto'], [
      ['Tipo de problema', 'Clasificación binaria (se va / se queda) con clases desbalanceadas: 26,5 % de bajas'],
      ['Métrica técnica', 'ROC-AUC (ordenar bien por riesgo) y PR-AUC (calidad al buscar la clase minoritaria)'],
      ['Métrica de negocio', 'Beneficio de la campaña de retención, según un umbral de decisión'],
      ['Restricción', 'El equipo comercial tiene que entender por qué el modelo marca a un cliente']])}` },

  { t:'Datos', id:'datos', plain:'ibm telco customer churn dataset 7043 clientes variables', html:() => `
    <p>Dataset <b>IBM Telco Customer Churn</b>: 7.043 clientes de una operadora ficticia de California, publicado por IBM como ejemplo (licencia Apache 2.0). Cada fila es un cliente con 19 variables y la etiqueta <code>Churn</code> (si se dio de baja en el último mes).</p>
    ${CH.table(['Grupo', 'Variables'], [
      ['Perfil', 'Género, mayor de 65 años, pareja, personas a cargo'],
      ['Contrato', 'Antigüedad en meses (<code>tenure</code>), tipo de contrato, factura electrónica, método de pago'],
      ['Servicios', 'Teléfono, varias líneas, tipo de internet (DSL o fibra), seguridad, copia de seguridad, protección de dispositivos, soporte técnico, TV y películas en streaming'],
      ['Facturación', 'Cuota mensual y total facturado']])}
    <p><b>Primer problema de calidad:</b> <code>TotalCharges</code> se carga como texto porque 11 clientes lo tienen en blanco. Los 11 tienen antigüedad 0: son altas recientes que aún no han recibido ninguna factura. Se rellena con 0, que es su valor real, en vez de borrar las filas o usar la mediana.</p>
    ${U.code(`df = pd.read_csv("data/telco_churn.csv")\ndf.shape                                                  # (7043, 21)\n(df["TotalCharges"].str.strip() == "").sum()              # 11, todos con tenure = 0\ndf["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0.0)\ndf["Churn"] = (df["Churn"] == "Yes").astype(int)\ndf["Churn"].mean()                                        # 0.265`, 'notebooks/churn_telco.py')}` },

  { t:'Exploración', id:'exploracion', plain:'exploración contrato antigüedad fibra pago electrónico tasa bajas', html:() => `
    <p>Antes de entrenar nada: ¿qué clientes se van más? La tasa global es del 26,5 %, pero cambia muchísimo según el grupo.</p>
    ${CH.bars([['Mes a mes', 42.7, true], ['Un año', 11.3], ['Dos años', 2.8]], { fmt: pct, max: 55, caption: 'Tasa de bajas por tipo de contrato. Sin permanencia, casi la mitad se va. Es la señal más clara del dataset.' })}
    ${CH.bars([['0–6 meses', 52.9, true], ['7–12 meses', 35.9], ['13–24 meses', 28.7], ['25–48 meses', 20.4], ['49–72 meses', 9.5]], { fmt: pct, max: 55, caption: 'Tasa de bajas por antigüedad. Los primeros meses son críticos: más de la mitad de los clientes de 0 a 6 meses se va.' })}
    ${CH.table(['Variable', 'Grupo con más bajas', 'Grupo con menos bajas'], [
      ['Internet', 'Fibra óptica: 41,9 %', 'Sin internet: 7,4 %'],
      ['Método de pago', 'Cheque electrónico: 45,3 %', 'Tarjeta automática: 15,2 %'],
      ['Soporte técnico', 'Sin soporte: 41,6 %', 'Con soporte: 15,2 %'],
      ['Edad', 'Mayores de 65: 41,7 %', 'Resto: 23,6 %'],
      ['Factura', 'Electrónica: 33,6 %', 'En papel: 16,3 %']])}
    <p>Dos avisos para las etapas siguientes: <code>tenure</code> y <code>TotalCharges</code> están muy correlacionadas (r = 0,83), porque el total es aproximadamente la cuota por los meses; y la fibra tiene más bajas, pero también es más cara. Muchas variables cuentan la misma historia, y eso complicará leer los coeficientes del modelo.</p>
    ${enIAlink()}` },

  { t:'Preprocesado', id:'preprocesado', plain:'preprocesado pipeline columntransformer onehot escalado estratificado fuga datos', html:() => `
    <ul><li><b>División estratificada 80/20</b> antes de mirar nada más: 5.634 clientes para entrenar y 1.409 para el test final, ambos con un 26,5 % de bajas. El test se guarda bajo llave hasta el final.</li>
    <li><b>Numéricas</b> (antigüedad, cuota, total): estandarizadas.</li>
    <li><b>Categóricas</b> (16 columnas): <i>one-hot</i>; las de sí/no se quedan en una sola columna. En total, 40 columnas.</li>
    <li>Todo dentro de un <b>Pipeline</b>: el escalado y la codificación se aprenden solo con los datos de entrenamiento de cada pliegue, sin fugas de información del test.</li></ul>
    ${U.code(`num = ["tenure", "MonthlyCharges", "TotalCharges"]\ncat = [c for c in X.columns if c not in num]\nX_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)\n\nprep = ColumnTransformer([\n    ("num", StandardScaler(), num),\n    ("cat", OneHotEncoder(handle_unknown="ignore", drop="if_binary"), cat),\n])`, 'notebooks/churn_telco.py')}` },

  { t:'Modelos candidatos', id:'modelos', plain:'modelos regresión logística random forest xgboost validación cruzada línea base', html:() => `
    <p>Cuatro candidatos, de menos a más complejo, comparados con <b>validación cruzada estratificada de 5 pliegues</b> sobre el conjunto de entrenamiento. La línea base siempre predice «se queda» y sirve para saber de dónde partimos.</p>
    ${CH.table(['Modelo', 'ROC-AUC (5 pliegues)', 'PR-AUC'], [
      ['Línea base', '0,500', '0,265'],
      ['<b>Regresión logística</b>', '<b>0,846 ± 0,013</b>', '<b>0,662</b>'],
      ['Random Forest (400 árboles)', '0,844 ± 0,010', '0,658'],
      ['XGBoost (300 árboles, profundidad 4)', '0,844 ± 0,009', '0,660']])}
    <p><b>Resultado importante:</b> los tres modelos reales empatan. La diferencia entre ellos (0,002) es mucho menor que lo que varía cada uno de un pliegue a otro (±0,01). En datos tabulares pequeños y con relaciones casi lineales, un modelo sencillo suele bastar. Los artículos de <a href="#logistic-regression">regresión logística</a>, <a href="#random-forest">Random Forest</a> y <a href="#gradient-boosting">gradient boosting</a> explican cada uno.</p>` },

  { t:'Optimización', id:'optimizacion', plain:'optimización hiperparámetros gridsearch regularización c xgboost', html:() => `
    <p>Búsqueda en rejilla con la misma validación cruzada:</p>
    ${CH.table(['Modelo', 'Hiperparámetros probados', 'Mejores', 'ROC-AUC'], [
      ['Regresión logística', 'C ∈ {0,01; 0,03; 0,1; 0,3; 1; 3}', 'C = 3 (poca regularización)', '0,846'],
      ['XGBoost', 'árboles {200, 400} · tasa {0,02; 0,05} · profundidad {2, 3, 4}', '400 árboles, tasa 0,02, profundidad 2', '0,850']])}
    <p>Afinar XGBoost gana 0,006 de AUC, y el ganador usa árboles de profundidad 2, casi lineales: otra pista de que el problema no necesita un modelo muy complejo.</p>` },

  { t:'Evaluación en test', id:'evaluacion', plain:'evaluación test matriz confusión precisión recall roc pr lift deciles', html:() => `
    <p>El conjunto de test se usa <b>una sola vez</b>, con los dos finalistas:</p>
    ${CH.table(['Modelo', 'ROC-AUC', 'PR-AUC', 'Precisión (umbral 0,5)', 'Recall (umbral 0,5)'], [['Regresión logística', '0,842', '0,631', '66,1 %', '56,4 %'], ['XGBoost', '0,845', '0,662', '66,2 %', '51,3 %']])}
    <p>Rinden prácticamente igual. Nos quedamos con la <b>regresión logística</b>: da probabilidades bien calibradas (Brier 0,138), se explica fácilmente al equipo comercial y se despliega en unos pocos kilobytes.</p>
    <h4>¿Sirve para ordenar a los clientes?</h4>
    ${CH.bars([['Decil 1 (más riesgo)', 73.8, true], ['Decil 2', 58.2, true], ['Decil 3', 40.4], ['Decil 4', 34.0], ['Decil 5', 24.8], ['Decil 6', 16.4], ['Decil 7', 11.3], ['Decil 8', 3.5], ['Decil 9', 1.4], ['Decil 10', 1.4]], { fmt: pct, max: 80, caption: 'Clientes de test ordenados por probabilidad de baja y partidos en 10 grupos. En el 10 % de más riesgo se va el 73,8 %; en el de menos, el 1,4 %.' })}
    <p>El 20 % de clientes con más riesgo contiene casi <b>la mitad de todas las bajas</b> (49,7 %). Esa capacidad de ordenar es lo que mide el ROC-AUC y lo que hace útil al modelo.</p>
    <h4>Con el umbral por defecto (0,5)</h4>
    ${cm(927, 108, 163, 211)}
    <p>Se escapan 163 de las 374 bajas del test. ¿Es el umbral correcto? Depende de lo que cueste cada error.</p>` },

  { t:'Umbral de negocio', id:'umbral', plain:'umbral decisión coste beneficio campaña retención curva', html:() => `
    <p>El 0,5 es arbitrario. El umbral correcto sale de <b>comparar costes</b>. Con estos supuestos (cámbialos por los de tu empresa en el cuaderno):</p>
    <ul><li>Contactar a un cliente con una oferta cuesta <b>50 $</b>.</li><li>De los clientes que iban a irse, la oferta retiene al <b>30 %</b>.</li><li>Un cliente retenido conserva <b>12 meses</b> de su cuota.</li></ul>
    <p>Llamar a quien no se iba a ir cuesta 50 $; no llamar a quien se va cuesta, de media, un 30 % de un año de cuota. Los dos errores no valen lo mismo, y la curva de beneficio lo refleja:</p>
    ${CH.line({ series: [{ name: 'Beneficio', pts: CURVA.map(([u, b], i) => [i, b / 1000]) }], xs: CURVA.map(([u]) => String(u.toFixed(2)).replace('.', ',')), ymin: 0, ymax: 60, yticks: [0, 20, 40, 60], yfmt: v => v + ' k$', xlabel: 'umbral de probabilidad para contactar', marks: [{ i: 4, t: 'óptimo 0,25' }, { i: 9, t: '0,5' }], aria: 'Beneficio de la campaña según el umbral', caption: 'Beneficio de la campaña sobre los 1.409 clientes de test según el umbral. El óptimo se eligió con predicciones de validación cruzada del entrenamiento (no con el test), y en test también es el mejor.' })}
    ${CH.table(['Estrategia', 'Clientes contactados', 'Bajas alcanzadas', 'Beneficio'], [['No hacer nada', '0', '0', '0 $'], ['Contactar a todos', '1.409', '374', '27.524 $'], ['Modelo, umbral 0,5', '319', '211', '43.841 $'], ['<b>Modelo, umbral 0,25</b>', '<b>610</b>', '<b>304</b>', '<b>51.954 $</b>']])}
    ${cm(729, 306, 70, 304)}
    <p>Con el umbral 0,25 se detecta el <b>81,3 %</b> de las bajas, a cambio de que la mitad de las llamadas sean a clientes que no se iban a ir (precisión 49,8 %). Con estos costes compensa: el beneficio es un 18 % mayor que con 0,5 y casi el doble que llamando a todos.</p>
    <p class="callout warn"><b>Ojo:</b> el 30 % de éxito es un supuesto. Antes de lanzar la campaña a gran escala hay que medirlo con un experimento: ofrecer la promoción a un grupo al azar de clientes de riesgo y compararlo con otro grupo al que no se le ofrece (un test A/B, como en el <a href="#lesson-3">nivel 3 de estadística</a>).</p>` },

  { t:'Interpretación', id:'interpretacion', plain:'interpretación importancia permutación coeficientes colinealidad', html:() => `
    <p>¿Qué pesa más en la predicción? La <b>importancia por permutación</b> desordena una variable cada vez y mide cuánto empeora el ROC-AUC en test:</p>
    ${CH.bars([['Antigüedad', 0.1756, true], ['Cuota mensual', 0.0852], ['Tipo de internet', 0.0782], ['Tipo de contrato', 0.0343], ['Total facturado', 0.0158], ['Películas en streaming', 0.0108], ['TV en streaming', 0.0103]], { fmt: v => '−' + v.toFixed(3).replace('.', ','), caption: 'Caída del ROC-AUC al desordenar cada variable. La antigüedad es, con diferencia, la más informativa.' })}
    <p class="callout warn"><b>Cuidado al leer los coeficientes.</b> En el modelo completo, la cuota mensual tiene un coeficiente negativo (−1,32), como si pagar más retuviera. No es así: la cuota es casi la suma de los servicios contratados, que también están en el modelo, y la fibra sola ya suma +0,90. Cuando las variables se solapan (<b>colinealidad</b>), los coeficientes se reparten el efecto de formas poco intuitivas. La importancia por permutación y la exploración de la etapa 3 son más fiables para explicar el modelo.</p>
    <p><b>Traducción para el equipo comercial:</b> el riesgo se concentra en clientes nuevos, sin permanencia, con fibra, sin servicios de seguridad o soporte y que pagan con cheque electrónico. Acciones posibles: ofrecer permanencia con descuento en los primeros meses, incluir soporte técnico en la oferta y facilitar el paso a domiciliación.</p>` },

  { t:'Calculadora de riesgo', id:'calculadora', plain:'calculadora riesgo probabilidad baja interactiva', html:() => `
    <p>Prueba un <b>modelo simplificado</b> con 7 variables clave (ROC-AUC en test ${String(CHURN_CALC.auc).replace('.', ',')}, frente a 0,842 del completo). Se calcula en tu navegador con los coeficientes del modelo entrenado.</p>
    <div class="churn-calc card" data-churn-calc='${JSON.stringify(CHURN_CALC)}'>
      <div class="cc-grid">
        ${sel('Contract', 'Contrato', [['Month-to-month', 'Mes a mes', 1], ['One year', 'Un año'], ['Two year', 'Dos años']])}
        <label class="cc-f"><span>Antigüedad: <b data-out="tenure">3</b> meses</span><input type="range" min="0" max="72" value="3" data-k="tenure"></label>
        ${sel('InternetService', 'Internet', [['Fiber optic', 'Fibra óptica', 1], ['DSL', 'DSL'], ['No', 'Sin internet']])}
        <label class="cc-f"><span>Cuota mensual: <b data-out="MonthlyCharges">85</b> $</span><input type="range" min="18" max="120" value="85" data-k="MonthlyCharges"></label>
        ${sel('PaymentMethod', 'Método de pago', [['Electronic check', 'Cheque electrónico', 1], ['Mailed check', 'Cheque por correo'], ['Bank transfer (automatic)', 'Transferencia automática'], ['Credit card (automatic)', 'Tarjeta automática']])}
        ${sel('TechSupport', 'Soporte técnico', [['No', 'No', 1], ['Yes', 'Sí']])}
        ${sel('OnlineSecurity', 'Seguridad en línea', [['No', 'No', 1], ['Yes', 'Sí']])}
      </div>
      <div class="cc-res"><div class="cc-p"><b data-p>–</b><span>probabilidad de baja</span></div><div class="cc-bar"><span data-bar></span><i style="left:25%"></i></div><p data-verdict></p></div>
    </div>
    <p class="note">La marca de la barra es el umbral de 0,25 de la etapa 8. Sin internet, la seguridad y el soporte no se aplican y se ignoran.</p>` },

  { t:'Despliegue', id:'despliegue', plain:'despliegue fastapi api joblib pydantic monitorización deriva', html:() => `
    <p>El modelo (el Pipeline completo, con el preprocesado incluido) se guarda con <code>joblib</code> y se sirve con una <b>API de FastAPI</b>. Pydantic valida cada petición: un tipo de contrato mal escrito devuelve un error 422 en vez de una predicción absurda.</p>
    ${U.code(`@app.post("/prediccion", response_model=Prediccion)\ndef prediccion(cliente: Cliente):\n    p = float(MODELO.predict_proba(pd.DataFrame([cliente.model_dump()]))[0, 1])\n    return Prediccion(probabilidad_baja=round(p, 4), contactar=p >= UMBRAL,\n                      umbral=UMBRAL, version_modelo=VERSION)`, 'notebooks/api/churn_api.py')}
    ${U.code(`POST /prediccion   {"tenure": 3, "Contract": "Month-to-month", "InternetService": "Fiber optic", ...}\n→ {"probabilidad_baja": 0.689, "contactar": true, "umbral": 0.25, "version_modelo": "churn-logistica-1.0"}\n\nPOST /prediccion   {"tenure": 60, "Contract": "Two year", "TechSupport": "Yes", ...}\n→ {"probabilidad_baja": 0.0419, "contactar": false, ...}`, 'Respuestas reales de la API (probada con TestClient)')}
    <h4>En producción</h4>
    <ul><li><b>Uso por lotes:</b> la campaña no necesita tiempo real. Un proceso nocturno puntúa a todos los clientes y deja la lista priorizada en el CRM.</li>
    <li><b>Monitorización:</b> vigilar cada mes la distribución de las variables (deriva de datos) y comparar la tasa real de bajas por decil con la predicha.</li>
    <li><b>Reentrenamiento</b> trimestral, o cuando cambien las tarifas: el modelo aprendió con los precios y las ofertas de un momento concreto.</li>
    <li><b>Retroalimentación:</b> los clientes contactados cambian su comportamiento, así que hay que guardar quién recibió oferta para no contaminar el siguiente entrenamiento.</li></ul>` },

  { t:'Resultados y conclusiones', id:'resultados', plain:'resultados conclusiones lecciones', html:() => `
    ${CH.table(['', 'Resultado'], [
      ['Modelo elegido', 'Regresión logística (C = 3) con preprocesado en Pipeline'],
      ['Calidad en test', 'ROC-AUC 0,842 · PR-AUC 0,631'],
      ['Ordenación', 'El 20 % de más riesgo concentra el 49,7 % de las bajas'],
      ['Decisión', 'Contactar si la probabilidad ≥ 0,25: se alcanza el 81,3 % de las bajas'],
      ['Impacto estimado', '51.954 $ en 1.409 clientes (unos 36.900 $ por cada 1.000), con los supuestos de la etapa 8'],
      ['Despliegue', 'API FastAPI validada con Pydantic; puntuación por lotes nocturna']])}
    <h4>Lo que enseña este proyecto</h4>
    <ol><li><b>Un modelo sencillo bien evaluado vale más que uno complejo sin medir.</b> Regresión logística, Random Forest y XGBoost empatan.</li>
    <li><b>El umbral es una decisión de negocio, no técnica.</b> Cambiarlo de 0,5 a 0,25 aporta más que cualquier ajuste de hiperparámetros.</li>
    <li><b>Explicar con cuidado.</b> Las variables solapadas hacen engañosos los coeficientes: hay que validarlos con la exploración y la importancia por permutación.</li>
    <li><b>Predecir no es actuar.</b> El valor real de la campaña solo se sabe con un experimento controlado.</li></ol>
    <p>Código completo, ejecutable en Colab con los datos incluidos:</p>
    ${CH.repo('churn_telco.py')}` },
];
function enIAlink() { return `<p class="callout">¿Correlación o causa? Los clientes con fibra se van más, pero eso no significa que la fibra provoque bajas: puede deberse a su precio o a la competencia en esas zonas. Lo explica el <a href="#lesson-3">nivel 3 de estadística</a>.</p>`; }
})();

function CHURN_PAGE() {
  const secs = CHURN_STAGES;
  return articleLayout(C.crumbs([['Inicio', 'home'], ['Proyectos', 'projects'], ['Predicción de bajas']]),
    `<header class="page-head in-article"><span class="kicker">Proyecto · Telecomunicaciones · Completado</span><h1>Predicción de bajas de clientes</h1>
     <p class="lede">Qué clientes de una operadora están a punto de irse, a quién merece la pena llamar y cuánto dinero ahorra hacerlo bien: un proyecto de machine learning completo, del problema de negocio a la API, con resultados reales.</p>
     <p class="meta">Dataset IBM Telco Customer Churn (7.043 clientes) · scikit-learn 1.8 y XGBoost 3.2 · random_state = 42 · Todas las cifras se reproducen con notebooks/churn_telco.py</p>
     <ol class="pipeline">${secs.map(s => `<li>${s.t}</li>`).join('')}</ol></header>`,
    secs, 'ch-');
}
