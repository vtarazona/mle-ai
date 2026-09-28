"""Entrena el Transformer del Transformer Visualizer y exporta sus pesos a src/tv-weights.js.

La arquitectura es idéntica, operación por operación, a la de src/tv.js:
1 bloque decoder, d_model = 8, 2 cabezas (d_k = 4), d_ff = 16, codificación posicional
sinusoidal, LayerNorm sin parámetros (post-norm), máscara causal y logits = h · Eᵀ.
El corpus son frases sintéticas generadas con una pequeña gramática sobre el vocabulario
de 37 palabras del visualizador.
"""
import json, math, random, pathlib
import torch, torch.nn as nn, torch.nn.functional as F

VOCAB = ['[PAD]', '[UNK]', 'el', 'la', 'un', 'una', 'gato', 'perro', 'niña', 'niño', 'sol', 'luna',
         'come', 'bebe', 'duerme', 'corre', 'lee', 'sale', 'brilla', 'pescado', 'leche', 'agua', 'libro', 'casa',
         'jardín', 'parque', 'noche', 'mañana', 'grande', 'pequeño', 'rápido', 'en', 'por', 'de', 'y', '.', ',']
ID = {w: i for i, w in enumerate(VOCAB)}
D, H, DK, DFF, MAXT = 8, 2, 4, 16, 10

# ---------------------------------------------------------------- gramática
random.seed(0)
MASC = {'gato', 'perro', 'niño', 'sol', 'pescado', 'libro', 'jardín', 'parque'}
def det(n, indef=False):
    if n == 'agua': return 'el'                                   # «el agua»
    return ('un' if n in MASC else 'una') if indef else ('el' if n in MASC else 'la')
def np_(n, indef=False, adj=True):
    out = [det(n, indef), n]
    if adj and n in MASC and random.random() < 0.15: out.append(random.choice(['grande', 'pequeño']))
    elif adj and random.random() < 0.08: out.append('grande')
    return out
lugar = lambda: random.choice([['en'] + np_(random.choice(['casa', 'jardín', 'parque']), adj=False),
                                ['por'] + np_(random.choice(['parque', 'jardín', 'casa']), adj=False)])
def frase():
    r = random.random()
    if r < 0.22:   # comer / beber
        s = random.choice(['gato', 'perro', 'niña', 'niño'])
        v, o = random.choice([('come', 'pescado'), ('bebe', 'leche'), ('bebe', 'agua')]) if s == 'gato' else \
               random.choice([('come', 'pescado'), ('bebe', 'agua')]) if s == 'perro' else \
               random.choice([('bebe', 'leche'), ('bebe', 'agua'), ('come', 'pescado')])
        t = np_(s) + [v, o] + (lugar() if random.random() < 0.35 else [])
    elif r < 0.40: # dormir / correr
        s = random.choice(['gato', 'perro', 'niña', 'niño'])
        v = random.choice(['duerme', 'corre'])
        t = np_(s) + [v] + (['rápido'] if v == 'corre' and random.random() < 0.3 else []) + (lugar() if random.random() < 0.8 else [])
    elif r < 0.55: # leer
        s = random.choice(['niña', 'niño'])
        t = np_(s) + ['lee'] + np_('libro', indef=random.random() < 0.6) + (lugar() if random.random() < 0.4 else [])
    elif r < 0.72: # sol / luna
        if random.random() < 0.5: t = ['el', 'sol', random.choice(['sale', 'brilla'])] + (['por', 'la', 'mañana'] if random.random() < 0.8 else [])
        else: t = ['la', 'luna', random.choice(['sale', 'brilla'])] + (['por', 'la', 'noche'] if random.random() < 0.8 else [])
    elif r < 0.82: # complemento al principio
        if random.random() < 0.5: t = ['por', 'la', 'noche', ','] + random.choice([['la', 'luna', 'brilla'], np_(random.choice(['gato', 'perro'])) + ['duerme']])
        else: t = ['por', 'la', 'mañana', ','] + random.choice([['el', 'sol', 'sale'], np_(random.choice(['niña', 'niño'])) + ['lee']])
    elif r < 0.92: # coordinadas
        a = random.choice(['gato', 'perro']); b = 'perro' if a == 'gato' else 'gato'
        t = np_(a, adj=False) + ['duerme', 'y'] + np_(b, adj=False) + ['corre']
    else:          # «la casa del…» → «la casa de un niño»
        t = np_(random.choice(['libro', 'casa'])) + ['de'] + np_(random.choice(['niña', 'niño']), indef=True, adj=False) + ['es' if False else '']
        t = [w for w in t if w]
    return (t + ['.'])[:MAXT]

frases = [frase() for _ in range(30000)]
assert all(w in ID for f in frases for w in f)
print('frases únicas:', len(set(map(tuple, frases))), '· ejemplo:', ' '.join(frases[0]))

def tensor(fs):
    X = torch.zeros(len(fs), MAXT, dtype=torch.long); Y = torch.full((len(fs), MAXT), -100)
    for i, f in enumerate(fs):
        ids = [ID[w] for w in f]; X[i, :len(ids)] = torch.tensor(ids)
        Y[i, :len(ids) - 1] = torch.tensor(ids[1:])           # predecir el siguiente; nada después del punto
    return X, Y
Xtr, Ytr = tensor(frases[:27000]); Xva, Yva = tensor(frases[27000:])

# ---------------------------------------------------------------- modelo (igual que tv.js)
def pos_enc(T):
    pe = torch.zeros(T, D)
    for p in range(T):
        for i in range(D):
            k = i - i % 2; ang = p / 10000 ** (k / D)
            pe[p, i] = math.sin(ang) if i % 2 == 0 else math.cos(ang)
    return pe
PE = pos_enc(MAXT)
class TVTransformer(nn.Module):
    def __init__(s):
        super().__init__()
        g = lambda *sh, sc: nn.Parameter(torch.randn(*sh) * sc)
        s.E = g(len(VOCAB), D, sc=0.8)
        s.WQ, s.WK, s.WV = g(H, D, DK, sc=0.5), g(H, D, DK, sc=0.5), g(H, D, DK, sc=0.5)
        s.WO = g(D, D, sc=0.35); s.W1, s.B1 = g(D, DFF, sc=0.4), nn.Parameter(torch.zeros(DFF))
        s.W2, s.B2 = g(DFF, D, sc=0.3), nn.Parameter(torch.zeros(D))
    def forward(s, idx):
        T = idx.shape[1]; X0 = s.E[idx] + PE[:T]
        mask = torch.triu(torch.ones(T, T, dtype=torch.bool), 1)
        heads = []
        for h in range(H):
            Q, K, V = X0 @ s.WQ[h], X0 @ s.WK[h], X0 @ s.WV[h]
            S = (Q @ K.transpose(1, 2) / math.sqrt(DK)).masked_fill(mask, float('-inf'))
            heads.append(S.softmax(-1) @ V)
        R1 = F.layer_norm(X0 + torch.cat(heads, -1) @ s.WO, (D,))
        R2 = F.layer_norm(R1 + F.relu(R1 @ s.W1 + s.B1) @ s.W2 + s.B2, (D,))
        return R2 @ s.E.T                                        # pesos atados

torch.manual_seed(0)
m = TVTransformer(); opt = torch.optim.AdamW(m.parameters(), lr=0.01, weight_decay=0.0)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, 3000)
ev = lambda X, Y: F.cross_entropy(m(X).reshape(-1, len(VOCAB)), Y.reshape(-1), ignore_index=-100).item()
for paso in range(1, 3001):
    ix = torch.randint(len(Xtr), (256,))
    L = F.cross_entropy(m(Xtr[ix]).reshape(-1, len(VOCAB)), Ytr[ix].reshape(-1), ignore_index=-100)
    opt.zero_grad(); L.backward(); opt.step(); sched.step()
    if paso in (1, 500, 1000, 2000, 3000):
        with torch.no_grad(): print(f'paso {paso:4d} · entrenamiento {L.item():.3f} · validación {ev(Xva, Yva):.3f}')

# ---------------------------------------------------------------- pruebas
@torch.no_grad()
def siguiente(texto, k=3):
    ids = torch.tensor([[ID[w] for w in texto.split()]]); p = m(ids)[0, -1].softmax(-1); p[:2] = 0
    top = p.topk(k); return [(VOCAB[i], round(v.item() * 100)) for v, i in zip(top.values, top.indices)]
PRUEBAS = ['el gato come', 'el perro bebe', 'la niña lee un', 'el sol sale por la', 'la luna brilla por la', 'el niño', 'la niña bebe',
           'el perro corre por el', 'por la noche ,', 'el gato duerme y el']
for t in PRUEBAS: print(f'{t:26s} →', siguiente(t))

# ---------------------------------------------------------------- exportar
r4 = lambda t: [[round(v, 4) for v in row] for row in t.tolist()] if t.dim() == 2 else [round(v, 4) for v in t.tolist()]
pesos = {'E': r4(m.E), 'WQ': [r4(w) for w in m.WQ], 'WK': [r4(w) for w in m.WK], 'WV': [r4(w) for w in m.WV],
         'WO': r4(m.WO), 'W1': r4(m.W1), 'B1': r4(m.B1), 'W2': r4(m.W2), 'B2': r4(m.B2),
         'meta': {'frases': len(frases), 'val_loss': round(ev(Xva, Yva), 3), 'params': sum(p.numel() for p in m.parameters())}}
destino = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'tv-weights.js'
destino.write_text('/* Pesos entrenados por notebooks/tv_train.py. No editar a mano. */\nconst TV_WEIGHTS = ' + json.dumps(pesos, separators=(',', ':')) + ';\n')
print('exportado', destino, destino.stat().st_size, 'bytes ·', pesos['meta'])
