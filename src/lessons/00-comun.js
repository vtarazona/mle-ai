/* =========================================================================
   LECCIONES DE LA RUTA DE APRENDIZAJE · componentes comunes
   Cada lección (10-matematicas.js, 20-python.js, …) hace LESSONS.push({…}).
   ========================================================================= */
const LESSONS = [];
const LX = (() => {
const idea = t => `<p class="idea"><span class="eyebrow">La idea en una frase</span>${t}</p>`;
const enIA = t => `<p class="callout ia"><b>¿Dónde aparece en IA?</b> ${t}</p>`;
const ojo  = t => `<p class="callout warn"><b>Error típico:</b> ${t}</p>`;
const ex = (n, enunciado, solucion, pista) => `<details class="card exercise"><summary><span class="exn">Ejercicio ${n}</span>${enunciado}</summary>${pista ? `<p class="hintline"><b>Pista:</b> ${pista}</p>` : ''}<div class="sol"><span class="eyebrow">Solución</span>${solucion}</div></details>`;
const quiz = (id, qs) => `<div class="quiz" data-quiz="${id}"><ol>${qs.map((q, i) => `<li class="q" data-answer="${q.ok}">
    <p class="qt">${q.q}</p>
    <div class="opts" role="radiogroup">${q.o.map((o, j) => `<label><input type="radio" name="${id}-${i}" value="${j}"> <span>${o}</span></label>`).join('')}</div>
    <p class="fb" hidden>${q.why}</p></li>`).join('')}</ol>
  <div class="quiz-bar"><button type="button" class="btn primary" data-check>Comprobar respuestas</button><button type="button" class="btn" data-reset>Volver a empezar</button><p class="score" aria-live="polite"></p></div></div>`;
const checklist = (id, items) => `<ul class="checklist" data-checklist="${id}">${items.map((t, i) => `<li><label><input type="checkbox" data-item="${i}"> <span>${t}</span></label></li>`).join('')}</ul>
  <div class="level-done"><button type="button" class="btn primary" data-complete-level="${id.replace('nivel-', '')}">Marcar el nivel como completado</button><span class="note" data-level-status></span></div>`;

return { idea, enIA, ojo, ex, quiz, checklist };
})();
