/* =========================================================================
   Gráficos SVG para los artículos (se renderizan en el build, sin JS en el
   navegador). Los colores salen de las variables del tema, así que funcionan
   en modo claro y oscuro.
   ========================================================================= */
const CH = {
  /** Gráfico de líneas. series: [{ name, pts: [[x, y], …], alt }] ; x categórica por índice o numérica. */
  line({ series, xs, ymin, ymax, yticks, yfmt = v => v, xlabel = '', caption = '', aria = '', h = 230, marks = [] }) {
    const W = 600, H = h, pl = 54, pr = 18, pt = 20, pb = xlabel ? 44 : 30;
    const X = i => pl + i / (xs.length - 1) * (W - pl - pr), Y = v => pt + (ymax - v) / (ymax - ymin) * (H - pt - pb);
    let g = '';
    for (const v of yticks) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${pl - 7}" y="${Y(v) + 4}" text-anchor="end" class="ax">${yfmt(v)}</text>`;
    xs.forEach((x, i) => { g += `<text x="${X(i)}" y="${H - pb + 17}" text-anchor="middle" class="ax">${x}</text>`; });
    if (xlabel) g += `<text x="${(pl + W - pr) / 2}" y="${H - 6}" text-anchor="middle" class="ax">${xlabel}</text>`;
    for (const m of marks) g += `<line x1="${X(m.i)}" x2="${X(m.i)}" y1="${pt}" y2="${H - pb}" class="mk"/><text x="${X(m.i) + 5}" y="${pt + 10}" class="lbl">${m.t}</text>`;
    series.forEach(s => {
      const cls = s.alt ? 'ln2' : 'ln', pc = s.alt ? 'pt2' : 'pt';
      g += `<polyline points="${s.pts.map(([i, v]) => `${X(i)},${Y(v)}`).join(' ')}" class="${cls}"${s.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
      s.pts.forEach(([i, v]) => { g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3.5" class="${pc}"/>`; });
    });
    const legend = series.length > 1 ? `<div class="legend">${series.map(s => `<span><i class="${s.alt ? 'k2' : 'k1'}"></i>${s.name}</span>`).join('')}</div>` : '';
    return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${aria}">${g}</svg>${legend}<figcaption>${caption}</figcaption></figure>`;
  },
  /** Barras horizontales. rows: [[etiqueta, valor, destacada?]] */
  bars(rows, { fmt = v => v, caption = '', max = null } = {}) {
    const mx = max ?? Math.max(...rows.map(r => Math.abs(r[1])));
    return `<figure class="chart"><div class="hbars">${rows.map(([n, v, hl]) => `<div class="hb${hl ? ' hl' : ''}"><span class="hbl">${n}</span><span class="hbt"><i style="width:${Math.abs(v) / mx * 100}%"></i></span><span class="hbn">${fmt(v)}</span></div>`).join('')}</div><figcaption>${caption}</figcaption></figure>`;
  },
  table(head, rows) {
    return `<div class="tbl"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  },
  hp(rows) { return CH.table(['Parámetro', 'Por defecto', 'Efecto'], rows.map(([p, d, e]) => [`<code>${p}</code>`, d, e])); },
  refs(list) { return `<ol class="refs">${list.map(r => `<li>${r}</li>`).join('')}</ol>`; },
  repo(file, label) {
    const gh = `https://github.com/vtarazona/mle-ai/blob/main/notebooks/${file}`;
    const colab = `https://colab.research.google.com/github/vtarazona/mle-ai/blob/main/notebooks/${file.replace('.py', '.ipynb')}`;
    return `<div class="repo-links"><a class="btn sm primary" href="${colab}" target="_blank" rel="noopener">Abrir en Google Colab ↗</a><a class="btn sm" href="${gh}" target="_blank" rel="noopener">Ver ${label || file} en GitHub ↗</a></div>`;
  },
};
