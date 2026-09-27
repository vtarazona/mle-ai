/* =========================================================================
   UTILIDADES
   ========================================================================= */
const U = {
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])),
  norm: s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''),
  slug: s => U.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  tex(src, display = true) {
    try { if (window.katex) return katex.renderToString(src, { output: 'mathml', displayMode: display, throwOnError: false }); } catch (e) { console.warn('KaTeX', e); }
    return `<code class="tex-fallback">${U.esc(src)}</code>`;
  },
  hlPy(code) {
    const re = /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(def|class|return|for|in|if|else|elif|import|from|as|while|None|True|False|and|or|not|lambda|with|self|async|await|raise|try|except)\b|\b(\d+(?:\.\d+)?)\b/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(code))) {
      out += U.esc(code.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 'n';
      out += `<span class="${cls}">${U.esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + U.esc(code.slice(last));
  },
  code(src, label = 'Python') {
    return `<div class="code"><div class="lab">${label}<button type="button" data-copy>Copiar</button></div><pre><code>${U.hlPy(src)}</code></pre></div>`;
  },
  wireCopy(root) {
    root.querySelectorAll('[data-copy]').forEach(btn => {
      if (btn.dataset.wired) return; btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        const pre = btn.closest('.code').querySelector('pre');
        const ok = () => { btn.textContent = 'Copiado'; setTimeout(() => btn.textContent = 'Copiar', 1500); };
        const fb = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Seleccionado · Ctrl+C'; };
        try { navigator.clipboard.writeText(pre.innerText).then(ok, fb); } catch (e) { fb(); }
      });
    });
  },
  store: {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } },
  },
};
