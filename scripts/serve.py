"""Servidor local que imita a Vercel (cleanUrls): /ruta → ruta.html. Uso: python3 scripts/serve.py dist 8000"""
import http.server, os, sys, functools
root, port = sys.argv[1] if len(sys.argv) > 1 else 'dist', int(sys.argv[2]) if len(sys.argv) > 2 else 8000
class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        p = self.path.split('?')[0].split('#')[0]
        fs = os.path.join(self.directory, p.lstrip('/'))
        if p != '/' and os.path.isdir(fs) and os.path.exists(os.path.join(fs, 'index.html')): self.path = p.rstrip('/') + '/index.html'
        elif p != '/' and not os.path.exists(fs) and os.path.exists(fs + '.html'): self.path = p + '.html'
        elif p != '/' and not os.path.exists(fs):
            self.send_response(404); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers()
            self.wfile.write(open(os.path.join(self.directory, '404.html'), 'rb').read()); return None
        return super().send_head()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('', port), functools.partial(H, directory=root)).serve_forever()
