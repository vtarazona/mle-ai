"""Transformer: self-attention en NumPy, un mini-GPT de caracteres en PyTorch entrenado con el texto del propio portal,
y el recuento de parámetros de GPT-2 small."""
import numpy as np, torch, torch.nn as nn, torch.nn.functional as F, time, math

# --- 1. Self-attention causal en NumPy ---
def self_attention(X, Wq, Wk, Wv):
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = Q @ K.T / np.sqrt(K.shape[1])
    S = np.where(np.tril(np.ones_like(S)) == 1, S, -np.inf)       # máscara causal
    A = np.exp(S - S.max(1, keepdims=True)); A /= A.sum(1, keepdims=True)
    return A @ V, A
r = np.random.default_rng(0); X = r.normal(size=(4, 8)); W = [r.normal(size=(8, 4)) * 0.5 for _ in range(3)]
O, A = self_attention(X, *W); print('A (filas suman 1)', A.sum(1).round(6), 'triangular', np.allclose(np.triu(A, 1), 0), 'O', O.shape)
# comprobar contra PyTorch
Qt, Kt, Vt = [torch.tensor(X @ w, dtype=torch.float64) for w in W]
Ot = F.scaled_dot_product_attention(Qt[None], Kt[None], Vt[None], is_causal=True)[0].numpy()
print('igual a F.scaled_dot_product_attention', np.allclose(O, Ot))

# --- 2. Mini-GPT de caracteres ---
torch.manual_seed(42)
import os, urllib.request
if not os.path.exists('corpus_mleai.txt'):   # en Colab: descarga el corpus del repositorio
    urllib.request.urlretrieve('https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/corpus_mleai.txt', 'corpus_mleai.txt')
texto = open('corpus_mleai.txt').read()
chars = sorted(set(texto)); stoi = {c: i for i, c in enumerate(chars)}; itos = {i: c for c, i in stoi.items()}
data = torch.tensor([stoi[c] for c in texto]); n = int(0.9 * len(data)); tr, va = data[:n], data[n:]
V, T, D, H, L, DROP = len(chars), 64, 96, 4, 2, 0.2
def lote(d, B=32):
    ix = torch.randint(len(d) - T - 1, (B,)); return torch.stack([d[i:i + T] for i in ix]), torch.stack([d[i + 1:i + T + 1] for i in ix])
class Bloque(nn.Module):
    def __init__(s):
        super().__init__(); s.ln1, s.ln2 = nn.LayerNorm(D), nn.LayerNorm(D)
        s.attn = nn.MultiheadAttention(D, H, dropout=DROP, batch_first=True); s.ffn = nn.Sequential(nn.Linear(D, 4 * D), nn.GELU(), nn.Linear(4 * D, D), nn.Dropout(DROP))
        s.register_buffer('mask', torch.triu(torch.ones(T, T, dtype=torch.bool), 1))
    def forward(s, x):
        t = x.shape[1]; h = s.ln1(x); x = x + s.attn(h, h, h, attn_mask=s.mask[:t, :t], need_weights=False)[0]
        return x + s.ffn(s.ln2(x))
class MiniGPT(nn.Module):
    def __init__(s):
        super().__init__(); s.tok, s.pos = nn.Embedding(V, D), nn.Embedding(T, D)
        s.bloques = nn.Sequential(*[Bloque() for _ in range(L)]); s.ln = nn.LayerNorm(D); s.head = nn.Linear(D, V, bias=False)
    def forward(s, idx):
        x = s.tok(idx) + s.pos(torch.arange(idx.shape[1])); return s.head(s.ln(s.bloques(x)))
    @torch.no_grad()
    def generar(s, idx, n, temp=0.8):
        for _ in range(n):
            p = F.softmax(s(idx[:, -T:])[:, -1] / temp, -1); idx = torch.cat([idx, torch.multinomial(p, 1)], 1)
        return idx
m = MiniGPT(); print('vocab', V, 'params', sum(p.numel() for p in m.parameters()), 'corpus chars', len(texto))
opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=0.1)
@torch.no_grad()
def val_loss():
    m.eval(); ls = [F.cross_entropy(m(x).view(-1, V), y.view(-1)).item() for x, y in [lote(va) for _ in range(20)]]; m.train(); return sum(ls) / len(ls)
print('perdida inicial esperada ln(V)', round(math.log(V), 3), 'medida', round(val_loss(), 3))
t0 = time.time(); hist = []
mejor, estado = 9e9, None
for paso in range(1, 1201):
    x, y = lote(tr); L_ = F.cross_entropy(m(x).view(-1, V), y.view(-1)); opt.zero_grad(); L_.backward(); opt.step()
    if paso % 100 == 0 or paso == 1:
        v = val_loss(); hist.append((paso, round(L_.item(), 3), round(v, 3)))
        if v < mejor: mejor, estado = v, {k: t.clone() for k, t in m.state_dict().items()}   # early stopping
m.load_state_dict(estado); m.eval(); print('mejor val', round(mejor, 3))
print('hist (paso, train, val)', hist, 't', round(time.time() - t0, 1))
torch.manual_seed(7)
for pr in ['El modelo ', 'La atención ']:
    out = m.generar(torch.tensor([[stoi[c] for c in pr]]), 160)[0].tolist(); print('MUESTRA:', ''.join(itos[i] for i in out).replace('\n', ' / '))

# --- 3. Parámetros de GPT-2 small ---
vocab, ctx, d, capas = 50257, 1024, 768, 12
por_capa = 2 * d + (d * 3 * d + 3 * d) + (d * d + d) + 2 * d + (d * 4 * d + 4 * d) + (4 * d * d + d)
total = vocab * d + ctx * d + capas * por_capa + 2 * d
print('gpt2 por capa', por_capa, 'embeddings', vocab * d + ctx * d, 'total', total)
