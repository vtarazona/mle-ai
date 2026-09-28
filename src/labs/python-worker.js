/* Laboratorio de Python · worker que ejecuta Pyodide (Python compilado a WebAssembly).
   Corre en un hilo aparte para que un bucle infinito no bloquee la página:
   si una ejecución tarda demasiado, la página termina el worker y crea otro. */
const DEFAULT_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let py = null, ready = null;

const RUNNER = `
import sys, io, json, traceback

def __mlai_run(code, check):
    ns = {"__name__": "__main__"}
    buf = io.StringIO()
    old = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buf
    err = None
    try:
        exec(compile(code, "<tu código>", "exec"), ns)
    except SyntaxError as e:
        err = {"type": type(e).__name__, "msg": e.msg, "line": e.lineno}
    except BaseException as e:
        line = None
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == "<tu código>":
                line = fr.lineno
        err = {"type": type(e).__name__, "msg": str(e), "line": line}
    finally:
        sys.stdout, sys.stderr = old
    out = buf.getvalue()
    res = None
    if check and err is None:
        cns = {"ns": ns, "out": out, "code": code}
        try:
            exec(check, cns)
            res = {"ok": True, "msg": cns.get("msg", "")}
        except AssertionError as e:
            res = {"ok": False, "msg": str(e) or "Todavía no está."}
        except KeyError as e:
            res = {"ok": False, "msg": f"No encuentro la variable {e}. Comprueba que la has creado con ese nombre exacto."}
        except Exception as e:
            res = {"ok": False, "msg": f"No he podido comprobarlo: {type(e).__name__}: {e}"}
    return json.dumps({"out": out, "err": err, "check": res})
`;

async function init(base) {
  importScripts(base + 'pyodide.js');
  py = await loadPyodide({ indexURL: base });
  await py.runPythonAsync(RUNNER);
  return py.version;
}

self.onmessage = async ({ data }) => {
  const { id, kind } = data;
  try {
    if (kind === 'init') {
      const base = typeof data.base === 'string' && /^\/[\w\-/.]*\/$/.test(data.base) ? data.base : DEFAULT_BASE;
      ready = ready || init(base);
      const v = await ready;
      self.postMessage({ id, kind: 'ready', version: v });
      return;
    }
    await ready;
    if (data.packages && data.packages.length) {
      self.postMessage({ id, kind: 'status', msg: 'Cargando ' + data.packages.join(' y ') + '… (solo la primera vez)' });
      await py.loadPackage(data.packages);
    }
    self.postMessage({ id, kind: 'running' });
    const run = py.globals.get('__mlai_run');
    const res = run(data.code, data.check || '');
    run.destroy();
    self.postMessage({ id, kind: 'result', ...JSON.parse(res) });
  } catch (e) {
    self.postMessage({ id, kind: 'fatal', msg: String(e && e.message || e) });
  }
};
