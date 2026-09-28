/* =========================================================================
   PROYECTO: DETECCIÓN DE ANOMALÍAS EN TRÁFICO DE RED
   Todas las cifras salen de notebooks/anomalias_red.py (NSL-KDD,
   scikit-learn 1.8, PyTorch, random_state = 42).
   ========================================================================= */
const ANOM_UMBRALES = [{"fpr":0.001,"fpr_test":0.0016,"det":0.2162,"prec":0.9943,"DoS":0.2462,"Probe":0.3775,"R2L":0.0042,"U2R":0.1791},{"fpr":0.005,"fpr_test":0.0066,"det":0.392,"prec":0.9874,"DoS":0.4472,"Probe":0.6729,"R2L":0.0177,"U2R":0.2388},{"fpr":0.01,"fpr_test":0.0192,"det":0.6073,"prec":0.9767,"DoS":0.7427,"Probe":0.8389,"R2L":0.071,"U2R":0.2836},{"fpr":0.02,"fpr_test":0.0284,"det":0.6811,"prec":0.9694,"DoS":0.8024,"Probe":0.9707,"R2L":0.1313,"U2R":0.403},{"fpr":0.05,"fpr_test":0.0416,"det":0.789,"prec":0.9616,"DoS":0.9127,"Probe":0.993,"R2L":0.302,"U2R":0.6269},{"fpr":0.1,"fpr_test":0.1067,"det":0.8337,"prec":0.9117,"DoS":0.9328,"Probe":0.9992,"R2L":0.4385,"U2R":0.8507}];
const ANOM_STAGES = (() => {
const pct = v => String(v).replace('.', ',') + ' %';
const FPRS = ['0,1 %', '0,5 %', '1 %', '2 %', '5 %', '10 %'];
const CURVAS = { if: [0.394, 0.527, 0.571, 0.621, 0.652, 0.727], ae: [0.02, 0.242, 0.35, 0.571, 0.84, 0.933] };
return [
  { t:'Problema', id:'problema', plain:'ids intrusión firmas anomalías ataques nuevos seguridad red', html:() => `
    <p>Los sistemas de detección de intrusiones clásicos funcionan con <b>firmas</b>: reglas escritas a mano para cada ataque conocido. Son precisos, pero ciegos ante un ataque que nadie ha visto todavía. La alternativa es darle la vuelta al problema: <b>aprender cómo es el tráfico normal</b> y avisar de todo lo que se aparte de él.</p>
    ${CH.table(['Pregunta', 'Respuesta en este proyecto'], [
      ['Tipo de problema', 'Detección de anomalías (novelty detection): los modelos se entrenan <b>solo con tráfico normal</b>, sin ninguna etiqueta de ataque'],
      ['Para qué sirven las etiquetas', 'Solo para evaluar al final, y para un modelo supervisado de referencia'],
      ['Métrica principal', 'Porcentaje de ataques detectados con un presupuesto fijo de falsas alarmas (1 % del tráfico normal)'],
      ['Pregunta clave', '¿Detecta ataques que no existían cuando se entrenó?']])}` },

  { t:'Datos', id:'datos', plain:'nsl-kdd kdd cup 99 conexiones variables dos probe r2l u2r ataques nuevos', html:() => `
    <p>Dataset <b>NSL-KDD</b> (Universidad de New Brunswick, 2009), una versión depurada del clásico KDD Cup 99. Cada fila es una <b>conexión de red</b> descrita con 41 variables en cuatro grupos:</p>
    ${CH.table(['Grupo', 'Ejemplos'], [
      ['Básicas', 'Duración, protocolo (tcp, udp, icmp), servicio (http, ftp, telnet…), estado de la conexión, bytes enviados y recibidos'],
      ['De contenido', 'Intentos fallidos de inicio de sesión, acceso de root, ficheros creados'],
      ['De tráfico (últimos 2 s)', 'Conexiones al mismo host o servicio, porcentaje de errores SYN o de rechazo'],
      ['De host (últimas 100 conexiones)', 'Cuántas van al mismo host de destino y con qué servicio']])}
    ${CH.table(['', 'Entrenamiento', 'Test'], [['Normal', '67.343', '9.711'], ['DoS (denegación de servicio)', '45.927', '7.458'], ['Probe (escaneos)', '11.656', '2.421'], ['R2L (acceso remoto no autorizado)', '995', '2.887'], ['U2R (escalada a root)', '52', '67'], ['Total', '125.973', '22.544']])}
    <p><b>Lo que hace interesante este dataset:</b> el test incluye <b>17 tipos de ataque que no aparecen en el entrenamiento</b> (<code>mscan</code>, <code>apache2</code>, <code>snmpguess</code>, <code>processtable</code>…): 3.750 conexiones, el 29,2 % de los ataques del test. Es la situación real de un sistema en producción.</p>
    <p class="callout warn"><b>Limitación:</b> NSL-KDD viene de un tráfico simulado de 1998. Sirve para aprender y comparar métodos, no para proteger una red actual. Para eso se usan datasets modernos como CIC-IDS2017 o UNSW-NB15, con la misma metodología de este proyecto.</p>` },

  { t:'Exploración', id:'exploracion', plain:'exploración bytes colas largas protocolo serror count', html:() => `
    <p>Cada familia de ataques deja una huella distinta en las variables (medianas del entrenamiento):</p>
    ${CH.table(['Categoría', 'Bytes enviados', 'Bytes recibidos', 'Conexiones al mismo host (2 s)', 'Tasa de errores SYN', 'Mismo servicio'], [
      ['Normal', '233', '379', '4', '0', '100 %'],
      ['DoS', '0', '0', '<b>172</b>', '<b>100 %</b>', '<b>7 %</b>'],
      ['Probe', '1', '0', '1', '0', '100 %'],
      ['R2L', '334', '0', '1', '0', '100 %'],
      ['U2R', '273', '2.907', '1', '0', '100 %']])}
    <p>Un DoS como <code>neptune</code> (inundación SYN) abre cientos de conexiones medio abiertas contra el mismo host: se ve a la legua en las variables de tráfico. En cambio, un ataque <b>R2L</b> es una única conexión con un aspecto parecido al normal: la diferencia está en su contenido (por ejemplo, contraseñas probadas), no en su forma. Esta observación anticipa el resultado principal del proyecto.</p>
    <p>Otros hallazgos: los bytes tienen colas enormes (el 39,2 % de las conexiones envía 0 bytes y el máximo pasa de 1.300 millones), el 35,5 % de los escaneos usa ICMP (ping) y la variable <code>num_outbound_cmds</code> vale siempre 0, así que se descarta.</p>` },

  { t:'Preprocesado', id:'preprocesado', plain:'preprocesado logaritmo escalado onehot solo tráfico normal validación', html:() => `
    <ul><li><b>Logaritmo</b> (<code>log1p</code>) en las 13 variables de cola larga (bytes, duración, contadores), para que un millón de bytes no aplaste todo lo demás. Después, estandarización.</li>
    <li><b>One-hot</b> de protocolo, servicio y estado: 76 columnas en total.</li>
    <li>El preprocesado se ajusta <b>solo con tráfico normal</b>: el detector no debe saber nada de los ataques.</li>
    <li>El tráfico normal del entrenamiento se divide en 53.874 conexiones para ajustar los modelos y 13.469 para <b>fijar el umbral</b> de alarma.</li></ul>
    ${U.code(`colas = ["duration", "src_bytes", "dst_bytes", "count", "srv_count", ...]\nprep = ColumnTransformer([\n    ("colas", Pipeline([("log", FunctionTransformer(np.log1p, feature_names_out="one-to-one")),\n                        ("esc", StandardScaler())]), colas),\n    ("num", StandardScaler(), resto),\n    ("cat", OneHotEncoder(handle_unknown="ignore"), ["protocol_type", "service", "flag"]),\n], sparse_threshold=0)\n\nnormal = train[train["ataque"] == 0]\nn_fit, n_val = train_test_split(normal, test_size=0.2, random_state=42)\nprep.fit(n_fit)`, 'notebooks/anomalias_red.py')}` },

  { t:'Detectores', id:'detectores', plain:'detectores isolation forest autoencoder pca distancia no supervisado', html:() => `
    <p>Cuatro formas de medir «lo raro» que es una conexión, de la más simple a la más elaborada:</p>
    ${CH.table(['Detector', 'Idea', 'Puntuación de anomalía'], [
      ['Distancia a la media', 'Lo normal está cerca del centro', 'Distancia euclídea al promedio del tráfico normal'],
      ['PCA', 'El tráfico normal vive en un subespacio de 25 dimensiones (95 % de la varianza)', 'Error al proyectar y reconstruir'],
      ['Isolation Forest', 'Lo raro se aísla con pocos cortes al azar', 'Profundidad media a la que queda aislado (300 árboles)'],
      ['Autoencoder', 'Una red que comprime y reconstruye; solo sabe reconstruir bien lo normal', 'Error de reconstrucción (red 76 → 64 → 16 → 64 → 76)']])}
    ${U.code(`ae = nn.Sequential(nn.Linear(76, 64), nn.ReLU(), nn.Linear(64, 16), nn.ReLU(),\n                   nn.Linear(16, 64), nn.ReLU(), nn.Linear(64, 76))\nfor epoca in range(60):                           # 18 s en CPU\n    for b in lotes(Xf, 256):\n        loss = ((ae(b) - b) ** 2).mean()          # aprende a copiar el tráfico normal\n        opt.zero_grad(); loss.backward(); opt.step()\n\nanomalia = ((ae(X) - X) ** 2).sum(1)              # lo que no sabe copiar, es raro`, 'notebooks/anomalias_red.py')}
    <p>El <b>umbral</b> de cada detector se fija sin mirar ningún ataque: es el percentil 99 de las puntuaciones del tráfico normal de validación. Por construcción, deberían saltar falsas alarmas en el 1 % de las conexiones normales.</p>
    <p class="callout">La idea del autoencoder, comprimir y reconstruir, es la misma que la de las <a href="#neural-networks">redes neuronales</a> del portal con una capa estrecha en medio. Isolation Forest es primo del <a href="#random-forest">Random Forest</a>.</p>` },

  { t:'Evaluación', id:'evaluacion', plain:'evaluación auc roc detección falsas alarmas punto operación', html:() => `
    ${CH.table(['Detector', 'ROC-AUC', 'Detecta (1 % de falsas alarmas)', 'Con 2 %', 'Con 5 %', 'Falsas alarmas reales en test'], [
      ['Distancia a la media', '0,941', '26,0 %', '29,5 %', '61,8 %', '0,4 %'],
      ['PCA', '0,958', '6,5 %', '39,9 %', '68,6 %', '0,6 %'],
      ['Isolation Forest', '0,950', '57,1 %', '62,1 %', '65,2 %', '1,6 %'],
      ['Autoencoder', '0,963', '35,0 %', '57,1 %', '<b>84,0 %</b>', '1,4 %'],
      ['<b>Isolation Forest + Autoencoder</b>', '0,961', '<b>60,7 %</b>', '<b>68,1 %</b>', '78,9 %', '1,9 %']])}
    <p><b>Primera lección: el ROC-AUC engaña aquí.</b> Todos los detectores superan 0,94, pero con el presupuesto real de falsas alarmas el PCA solo detecta el 6,5 % de los ataques y el Isolation Forest, el 57,1 %. El AUC promedia todos los umbrales posibles, incluidos los que nadie usaría; en seguridad solo importa la esquina izquierda de la curva, la de muy pocas falsas alarmas.</p>
    ${CH.line({ series: [{ name: 'Autoencoder', pts: CURVAS.ae.map((v, i) => [i, v * 100]) }, { name: 'Isolation Forest', pts: CURVAS.if.map((v, i) => [i, v * 100]), alt: true }], xs: FPRS, ymin: 0, ymax: 100, yticks: [0, 25, 50, 75, 100], yfmt: v => v + ' %', xlabel: 'presupuesto de falsas alarmas (sobre el tráfico normal)', aria: 'Detección según el presupuesto de falsas alarmas', caption: 'Porcentaje de ataques del test detectados según el presupuesto de falsas alarmas. Isolation Forest es mejor con presupuestos muy estrictos; el autoencoder, con presupuestos más holgados.' })}
    <p><b>Segunda lección: los detectores se complementan.</b> Por eso el modelo final los <b>combina</b>: cada puntuación se convierte en su percentil dentro del tráfico normal (así son comparables) y se promedian. Con un 1 % de presupuesto detecta el 60,7 %, más que cualquiera de los dos por separado, aunque también da algo más de falsas alarmas reales (1,9 % frente a 1,6 % y 1,4 %).</p>
    <p><b>Tercera lección: el tráfico normal cambia.</b> El umbral prometía un 1 % de falsas alarmas y en el test salen un 1,9 %: el tráfico normal del test no es idéntico al del entrenamiento. En producción pasa siempre; por eso hay que medir las falsas alarmas reales y reajustar el umbral.</p>` },

  { t:'Por tipo de ataque', id:'tipos', plain:'tipo ataque dos probe r2l u2r ataques nuevos supervisado random forest', html:() => `
    ${CH.bars([['DoS', 74.3, true], ['Probe', 83.9, true], ['R2L', 7.1], ['U2R', 28.4]], { fmt: pct, max: 100, caption: 'Porcentaje detectado de cada familia con el modelo final (1 % de presupuesto de falsas alarmas).' })}
    <p>Tal como anticipaba la exploración: los ataques que <b>cambian la forma del tráfico</b> (DoS, escaneos) se detectan bien; los que se esconden en una conexión de aspecto normal (<b>R2L</b>: adivinar contraseñas, subir ficheros por FTP…) apenas se ven. Para esos hacen falta otras fuentes de datos, como los registros de autenticación de los servidores.</p>
    <h4>Comparación con un modelo supervisado</h4>
    <p>Un Random Forest entrenado con las etiquetas de ataque del entrenamiento tiene el mismo ROC-AUC (0,962), pero su comportamiento es muy distinto:</p>
    ${CH.table(['', 'Ataques conocidos', 'Ataques nuevos', 'Falsas alarmas'], [['Random Forest supervisado', '<b>76,7 %</b>', '31,2 %', '2,7 %'], ['Isolation Forest + Autoencoder', '63,6 %', '<b>53,9 %</b>', '1,9 %']])}
    <p>El supervisado es mejor con lo que ya ha visto y mucho peor con lo nuevo: aprendió «cómo son los ataques de 1998», no «cómo es lo normal». En la práctica se usan <b>los dos juntos</b>: el supervisado (o las firmas) para lo conocido y el detector de anomalías como red de seguridad para lo desconocido.</p>` },

  { t:'Presupuesto de alertas', id:'umbral', plain:'umbral presupuesto alertas precisión tasa base soc analistas', html:() => `
    <p>¿Cuántas falsas alarmas puede revisar el equipo de seguridad? Mueve el presupuesto y observa qué se detecta y qué precisión tendrían las alertas según lo frecuentes que sean los ataques en tu red.</p>
    <div class="anom-exp card" data-anom-exp='${JSON.stringify(ANOM_UMBRALES)}'>
      <div class="ae-ctl">
        <label class="cc-f"><span>Presupuesto de falsas alarmas: <b data-o="fpr">1 %</b></span><input type="range" min="0" max="5" step="1" value="2" data-i></label>
        <label class="cc-f"><span>Ataques en el tráfico</span><select data-prev><option value="0.569">56,9 % (como en el test)</option><option value="0.01">1 %</option><option value="0.001" selected>0,1 % (red real)</option></select></label>
      </div>
      <div class="ae-kpi"><div><b data-o="det">–</b><span>de los ataques detectados</span></div><div><b data-o="prec">–</b><span>de las alertas son ataques reales</span></div><div><b data-o="fa">–</b><span>falsas alarmas por cada millón de conexiones normales</span></div></div>
      <div class="ae-bars" data-bars></div>
    </div>
    <p><b>La trampa de la tasa base.</b> En el test, el 97,7 % de las alertas son ataques reales, pero es porque allí más de la mitad del tráfico es ataque. En una red real, donde los ataques son quizá el 0,1 % de las conexiones, solo el <b>3,1 %</b> de las alertas sería un ataque real: el mismo fenómeno que los falsos positivos de un test médico del <a href="#lesson-1">nivel 1</a>. Con el presupuesto del 1 %, cada millón de conexiones normales genera unas 19.200 falsas alarmas.</p>
    <p>Por eso ningún equipo revisa alertas sueltas: se <b>agrupan</b> por host y ventana de tiempo (un escaneo son cientos de conexiones anómalas seguidas desde la misma IP), se ordenan por puntuación y solo las más graves llegan a una persona.</p>` },

  { t:'¿Por qué salta la alarma?', id:'explicacion', plain:'explicación alerta error reconstrucción variables contribución', html:() => `
    <p>Una alerta sin explicación no sirve a un analista. El autoencoder permite ver <b>qué variables no ha sabido reconstruir</b>: son las que hacen rara a esa conexión.</p>
    ${CH.table(['Conexión (tipo real)', 'Puntuación · umbral', 'Variables que más contribuyen'], [
      ['<code>guess_passwd</code> (adivinar contraseñas)', '10,1 · 9,1', 'Porcentaje de conexiones al mismo servicio del host (19 %), número de conexiones al host (13 %), duración (8 %), servicio telnet (7 %)'],
      ['<code>mscan</code> (escaneo, <b>ataque nuevo</b>)', '9,7 · 9,1', 'Tasa de conexiones rechazadas (22 %), tasa de errores SYN (13 %), cierre por reset (10 %), servicio telnet (9 %)']])}
    <p>Las dos explicaciones tienen sentido para un experto: el escaneo provoca rechazos y conexiones incompletas; el ataque de contraseñas, sesiones telnet largas y repetidas. Y el escaneo <code>mscan</code> no existía en el entrenamiento.</p>` },

  { t:'Despliegue', id:'despliegue', plain:'despliegue zeek netflow siem streaming deriva reentrenamiento', html:() => `
    <ol><li><b>Captura:</b> un sensor (Zeek, NetFlow o CICFlowMeter) resume cada conexión en variables como las de este dataset.</li>
    <li><b>Puntuación:</b> un servicio aplica el mismo preprocesado y los dos detectores. Es barato: en nuestra prueba, preprocesado incluido, puntuó unas 60.000 conexiones por segundo en una CPU.</li>
    <li><b>Agregación:</b> las conexiones anómalas se agrupan por IP de origen y ventana de tiempo antes de crear una alerta.</li>
    <li><b>SIEM:</b> las alertas llegan a la consola del equipo de seguridad con su puntuación y sus variables explicativas.</li>
    <li><b>Retroalimentación:</b> lo que el analista confirma como ataque alimenta al modelo supervisado; lo que descarta ayuda a recalibrar el umbral.</li></ol>
    ${U.code(`UMBRAL = np.quantile(combinar(Xv), 0.99)               # 1 % de falsas alarmas previstas\n\ndef puntuar(conexiones: pd.DataFrame) -> pd.DataFrame:\n    s = combinar(prep.transform(conexiones).astype(np.float32))\n    return pd.DataFrame({"puntuacion": s.round(3), "alerta": s > UMBRAL})\n\n#    puntuacion  alerta          real\n#         0.990    True       neptune\n#         0.378   False        normal\n#         0.850   False   warezmaster     ← R2L: el punto débil\n#         0.856   False  guess_passwd`, 'notebooks/anomalias_red.py')}
    <p><b>Mantenimiento:</b> el tráfico normal cambia (nuevas aplicaciones, teletrabajo, un servicio en la nube), y con él suben las falsas alarmas, como ya pasa entre el entrenamiento y el test. Hay que medir cada semana la tasa real de falsas alarmas y reentrenar con tráfico normal reciente, comprobando antes que ese tráfico no esté contaminado por un ataque en curso.</p>` },

  { t:'Resultados y conclusiones', id:'resultados', plain:'resultados conclusiones', html:() => `
    ${CH.table(['', 'Resultado'], [
      ['Modelo final', 'Isolation Forest + autoencoder, entrenados solo con tráfico normal'],
      ['Detección (1 % de falsas alarmas)', '60,7 % de los ataques: DoS 74,3 %, escaneos 83,9 %, R2L 7,1 %, U2R 28,4 %'],
      ['Ataques nuevos', '53,9 % detectados, frente al 31,2 % de un Random Forest supervisado'],
      ['Falsas alarmas reales', '1,9 % en test (previsto: 1 %) por cambios en el tráfico normal'],
      ['Con ataques raros (0,1 %)', 'Solo el 3,1 % de las alertas sería un ataque: hay que agregar y priorizar']])}
    <h4>Lo que enseña este proyecto</h4>
    <ol><li><b>Evalúa en el punto de operación.</b> Un ROC-AUC de 0,96 puede esconder un detector que casi no detecta nada con un presupuesto realista.</li>
    <li><b>Lo no supervisado protege frente a lo desconocido</b>, a cambio de detectar peor lo conocido. Supervisado y no supervisado se complementan.</li>
    <li><b>Los datos ponen el límite.</b> Si un ataque no cambia las variables que mides (R2L), ningún modelo lo verá: hacen falta otras fuentes de datos.</li>
    <li><b>La tasa base manda.</b> Con ataques raros, incluso un buen detector genera sobre todo falsas alarmas.</li></ol>
    <p>Código completo, ejecutable en Colab (descarga NSL-KDD de una réplica pública):</p>
    ${CH.repo('anomalias_red.py')}` },
];
})();

function ANOM_PAGE() {
  return articleLayout(C.crumbs([['Inicio', 'home'], ['Proyectos', 'projects'], ['Anomalías en tráfico de red']]),
    `<header class="page-head in-article"><span class="kicker">Proyecto · Redes y ciberseguridad · Completado</span><h1>Detección de anomalías en tráfico de red</h1>
     <p class="lede">Aprender cómo es el tráfico normal para detectar ataques, incluidos los que nunca se han visto antes: Isolation Forest y un autoencoder entrenados sin una sola etiqueta de ataque, evaluados con un presupuesto realista de falsas alarmas.</p>
     <p class="meta">Dataset NSL-KDD (148.517 conexiones) · scikit-learn 1.8 y PyTorch · random_state = 42 · Todas las cifras se reproducen con notebooks/anomalias_red.py</p>
     <ol class="pipeline">${ANOM_STAGES.map(s => `<li>${s.t}</li>`).join('')}</ol></header>`,
    ANOM_STAGES, 'an-');
}
