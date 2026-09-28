/* =========================================================================
   CLIENTE — se carga en todas las páginas (ya prerenderizadas en el build).
   Solo añade interactividad: menús, tema, buscador, copiar código y el
   montaje de los componentes vivos de cada página (portada animada,
   laboratorio, Transformer Visualizer, índice del artículo, progreso de la ruta).
   ========================================================================= */
(() => {
  const $ = id => document.getElementById(id);
  const page = document.body.dataset.page || '';

  /* ---------- enlaces antiguos con # (versión de una sola página) ---------- */
  const OLD = window.__OLD_ROUTES || {};
  if (location.pathname === '/' || location.pathname.endsWith('/index.html')) {
    const h = location.hash.slice(1);
    if (h && OLD[h]) { location.replace(OLD[h]); return; }
  }

  /* ---------- tema ---------- */
  const tbtn = $('theme-btn');
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const label = () => { tbtn.setAttribute('aria-label', isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); tbtn.textContent = isDark() ? '☀' : '☾'; };
  tbtn.onclick = () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; U.store.set('mlai.theme', next); label();
    const fr = document.querySelector('#lab-frame iframe'); try { if (fr) fr.contentDocument.documentElement.dataset.theme = next; } catch (e) { /* sin acceso */ }
  };
  label();

  /* ---------- menús ---------- */
  const tb = $('topics-btn'), mega = $('mega'), mb = $('menu-btn');
  const closeMenus = () => { mega.hidden = true; tb.setAttribute('aria-expanded', 'false'); document.body.classList.remove('drawer-open'); mb.setAttribute('aria-expanded', 'false'); };
  tb.onclick = e => { e.stopPropagation(); mega.hidden = !mega.hidden; tb.setAttribute('aria-expanded', String(!mega.hidden)); };
  document.addEventListener('click', e => { if (!e.target.closest('#mega') && !e.target.closest('#topics-btn')) { mega.hidden = true; tb.setAttribute('aria-expanded', 'false'); } });
  mb.onclick = () => { const o = document.body.classList.toggle('drawer-open'); mb.setAttribute('aria-expanded', String(o)); };

  /* ---------- buscador (índice JSON que genera el build) ---------- */
  let INDEX = null, selIdx = 0, lastRes = [];
  const loadIndex = async () => {
    if (INDEX) return INDEX;
    try { INDEX = await fetch('/assets/search-index.json').then(r => r.json()); INDEX.forEach(d => { d._t = U.norm(d.title); d._x = U.norm(d.text); }); }
    catch (e) { console.error('Buscador: no se pudo cargar el índice', e); INDEX = []; }
    return INDEX;
  };
  function search(q) {
    const terms = U.norm(q).split(/\s+/).filter(t => t.length > 1);
    if (!terms.length || !INDEX) return [];
    const out = [];
    for (const d of INDEX) {
      let sc = 0, all = true;
      for (const t of terms) { const inT = d._t.includes(t), inX = d._x.includes(t); if (!inT && !inX) { all = false; break; }
        sc += inT ? (d._t.startsWith(t) || d._t.includes(' ' + t) ? 8 : 5) : 1; }
      if (all) out.push([sc + (d.type === 'Laboratorio' || d.type === 'Artículo' ? 1 : 0), d]);
    }
    return out.sort((a, b) => b[0] - a[0]).slice(0, 10).map(x => x[1]);
  }
  function renderResults(q) {
    const box = $('search-results');
    lastRes = search(q); selIdx = 0;
    if (!q.trim()) { box.innerHTML = `<p class="hint">Busca conceptos, algoritmos, laboratorios, papers, datasets o proyectos. Por ejemplo: <i>gini</i>, <i>softmax</i>, <i>lora</i>, <i>regresión logística</i>.</p>`; return; }
    if (!INDEX) { box.innerHTML = '<p class="hint">Cargando índice…</p>'; return; }
    if (!lastRes.length) { box.innerHTML = `<p class="hint">Sin resultados para «${U.esc(q)}». Prueba con otra palabra o sin tildes.</p>`; return; }
    box.innerHTML = `<ul role="listbox">${lastRes.map((d, i) => `<li role="option" aria-selected="${i === selIdx}" data-i="${i}" class="${i === selIdx ? 'on' : ''}"><a href="${U.esc(d.url)}" tabindex="-1"><span class="rt">${d.type}</span><b>${U.esc(d.title)}</b><small>${U.esc(d.text.slice(0, 110))}${d.text.length > 110 ? '…' : ''}</small></a></li>`).join('')}</ul>`;
  }
  const openSearch = async () => { $('search').hidden = false; const inp = $('search-input'); inp.value = ''; renderResults(''); inp.focus(); document.body.classList.add('noscroll'); await loadIndex(); if (inp.value) renderResults(inp.value); };
  const closeSearch = () => { $('search').hidden = true; document.body.classList.remove('noscroll'); };
  document.querySelectorAll('[data-open-search]').forEach(b => b.onclick = openSearch);
  const inp = $('search-input');
  inp.oninput = () => renderResults(inp.value);
  inp.onkeydown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!lastRes.length) return; selIdx = (selIdx + (e.key === 'ArrowDown' ? 1 : -1) + lastRes.length) % lastRes.length;
      document.querySelectorAll('#search-results li').forEach((li, i) => { li.classList.toggle('on', i === selIdx); li.setAttribute('aria-selected', String(i === selIdx)); if (i === selIdx) li.scrollIntoView({ block:'nearest' }); }); }
    if (e.key === 'Enter' && lastRes[selIdx]) location.href = lastRes[selIdx].url;
    if (e.key === 'Escape') closeSearch();
  };
  $('search').onclick = e => { if (e.target.id === 'search') closeSearch(); };
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') { closeMenus(); if (!$('search').hidden) closeSearch(); }
  });

  /* ---------- copiar código ---------- */
  U.wireCopy(document);

  /* ---------- componentes de cada página ---------- */
  if (page === 'home') { const cv = $('hero-canvas'); if (cv && typeof PixelHero !== 'undefined') PixelHero.mount(cv, cv.dataset.bg); }

  if (page === 'lab') {
    const box = $('lab-frame'), file = box.dataset.file;
    const fr = document.createElement('iframe'); fr.title = box.dataset.title; fr.src = file + (location.hash.startsWith('#reto-') ? location.hash : '');
    box.innerHTML = ''; box.appendChild(fr);
    const fit = () => { try { const d = fr.contentDocument; if (d && d.body) { const t = document.documentElement.dataset.theme; if (t) d.documentElement.dataset.theme = t; const h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight); if (h > 50) fr.style.height = h + 'px'; } } catch (e) { fr.style.height = '85vh'; clearInterval(timer); } };
    fr.onload = fit; const timer = setInterval(fit, 700);
  }

  if (page === 'transformer' && typeof TVUI !== 'undefined') TVUI.render($('tv-root'));

  if (page === 'article') {
    const links = [...document.querySelectorAll('.article .toc a')];
    const map = new Map(links.map(a => [a.dataset.target, a]));
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.remove('on')); map.get(e.target.id)?.classList.add('on'); } }), { rootMargin:'-20% 0px -70% 0px' });
    map.forEach((_, id) => { const el = $(id); if (el) obs.observe(el); });
  }

  // lecciones: test de autoevaluación
  document.querySelectorAll('[data-quiz]').forEach(qz => {
    const qs = [...qz.querySelectorAll('li.q')], score = qz.querySelector('.score');
    qz.querySelector('[data-check]').onclick = () => {
      let ok = 0, blank = 0;
      qs.forEach(q => {
        const sel = q.querySelector('input:checked'), fb = q.querySelector('.fb');
        q.classList.remove('right', 'wrong');
        if (!sel) { blank++; fb.hidden = true; return; }
        const right = sel.value === q.dataset.answer; ok += right;
        q.classList.add(right ? 'right' : 'wrong'); fb.hidden = false;
      });
      score.textContent = `${ok} de ${qs.length} correctas` + (blank ? ` · ${blank} sin contestar` : '') +
        (ok === qs.length ? ' · ¡Perfecto!' : ok >= qs.length * 0.8 ? ' · ¡Superado!' : ' · Repasa los apartados de las preguntas falladas y vuelve a intentarlo.');
      U.store.set('mlai.quiz.' + qz.dataset.quiz, Math.max(ok, U.store.get('mlai.quiz.' + qz.dataset.quiz, 0)));
    };
    qz.querySelector('[data-reset]').onclick = () => {
      qs.forEach(q => { q.classList.remove('right', 'wrong'); q.querySelector('.fb').hidden = true; q.querySelectorAll('input').forEach(i => i.checked = false); });
      score.textContent = '';
    };
  });
  // lecciones: lista de comprobación y botón de nivel completado
  document.querySelectorAll('[data-checklist]').forEach(cl => {
    const key = 'mlai.check.' + cl.dataset.checklist, boxes = [...cl.querySelectorAll('input[data-item]')];
    const saved = U.store.get(key, {}); boxes.forEach(b => { b.checked = !!saved[b.dataset.item]; b.onchange = () => { const d = U.store.get(key, {}); d[b.dataset.item] = b.checked; U.store.set(key, d); }; });
  });
  document.querySelectorAll('[data-complete-level]').forEach(btn => {
    const n = btn.dataset.completeLevel, status = btn.parentElement.querySelector('[data-level-status]');
    const paint = () => { const done = !!U.store.get('mlai.path', {})[n]; btn.textContent = done ? 'Nivel completado ✓ (desmarcar)' : 'Marcar el nivel como completado'; btn.classList.toggle('primary', !done); status.textContent = done ? 'Aparece como completado en la ruta de aprendizaje.' : ''; };
    btn.onclick = () => { const d = U.store.get('mlai.path', {}); d[n] = !d[n]; U.store.set('mlai.path', d); paint(); };
    paint();
  });

  // calculadora de riesgo de baja (proyecto de churn)
  document.querySelectorAll('[data-churn-calc]').forEach(box => {
    let M; try { M = JSON.parse(box.dataset.churnCalc); } catch (e) { return; }
    const f = k => box.querySelector(`[data-k="${k}"]`);
    const calc = () => {
      const v = {}; box.querySelectorAll('[data-k]').forEach(el => { v[el.dataset.k] = el.type === 'range' ? +el.value : el.value; });
      const sinInternet = v.InternetService === 'No';
      ['TechSupport', 'OnlineSecurity'].forEach(k => { f(k).disabled = sinInternet; if (sinInternet) v[k] = 'No internet service'; });
      let z = M.intercept;
      for (const [k, p] of Object.entries(M.num)) z += p.w * (v[k] - p.mean) / p.std;
      for (const [k, w] of Object.entries(M.cat)) z += w[v[k]] || 0;
      const pr = 1 / (1 + Math.exp(-z));
      box.querySelectorAll('[data-out]').forEach(o => { o.textContent = v[o.dataset.out]; });
      box.querySelector('[data-p]').textContent = Math.round(pr * 100) + ' %';
      const bar = box.querySelector('[data-bar]'); bar.style.width = (pr * 100).toFixed(1) + '%'; bar.className = pr >= 0.25 ? 'hi' : '';
      box.querySelector('[data-verdict]').textContent = pr >= 0.25 ? 'Por encima del umbral de 0,25: entraría en la campaña de retención.' : 'Por debajo del umbral de 0,25: no se contactaría.';
    };
    box.addEventListener('input', calc); calc();
  });

  if (page === 'path') {
    const boxes = [...document.querySelectorAll('[data-level]')], bar = document.querySelector('.progress');
    const paint = () => {
      const d = U.store.get('mlai.path', {}); let n = 0;
      boxes.forEach(c => { c.checked = !!d[c.dataset.level]; c.closest('li').classList.toggle('is-done', c.checked); n += c.checked; });
      const pct = Math.round(n / boxes.length * 100);
      bar.setAttribute('aria-valuenow', pct); bar.querySelector('span').style.width = pct + '%'; bar.querySelector('b').textContent = pct + ' % completado';
    };
    boxes.forEach(c => c.onchange = () => { const d = U.store.get('mlai.path', {}); d[c.dataset.level] = c.checked; U.store.set('mlai.path', d); paint(); });
    paint();
  }

  if (page === 'papers') {
    document.querySelectorAll('.filters button').forEach(b => b.onclick = () => {
      document.querySelectorAll('.filters button').forEach(x => x.classList.toggle('on', x === b));
      document.querySelectorAll('.paper').forEach(p => { p.hidden = !!b.dataset.f && p.dataset.area !== b.dataset.f; });
    });
  }

  // destacar el elemento al que apunta un ancla (#t-random-forest, #p-…)
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) { if (el.tagName === 'DETAILS') el.open = true; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }
})();
