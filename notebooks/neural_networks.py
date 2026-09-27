"""Redes neuronales: MLP desde cero en NumPy, con PyTorch y con scikit-learn, sobre el dataset Digits (8×8)."""
import numpy as np, time, torch, torch.nn as nn
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix

X, y = load_digits(return_X_y=True); X = X / 16.0
print('forma', X.shape, 'clases', np.bincount(y))
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)

class MLP:
    """64 → 64 (ReLU) → 10 (softmax), entropía cruzada, SGD por mini-lotes."""
    def __init__(self, d_in, d_h, d_out, seed=0):
        r = np.random.default_rng(seed)
        self.W1 = r.normal(0, np.sqrt(2 / d_in), (d_in, d_h)); self.b1 = np.zeros(d_h)
        self.W2 = r.normal(0, np.sqrt(1 / d_h), (d_h, d_out)); self.b2 = np.zeros(d_out)
    def forward(self, X):
        self.X = X; self.Z1 = X @ self.W1 + self.b1; self.A1 = np.maximum(0, self.Z1)
        Z2 = self.A1 @ self.W2 + self.b2; Z2 -= Z2.max(1, keepdims=True)
        E = np.exp(Z2); self.P = E / E.sum(1, keepdims=True); return self.P
    def backward(self, y, lr):
        n = len(y); dZ2 = self.P.copy(); dZ2[np.arange(n), y] -= 1; dZ2 /= n       # softmax + entropía cruzada
        dW2 = self.A1.T @ dZ2; db2 = dZ2.sum(0)
        dZ1 = (dZ2 @ self.W2.T) * (self.Z1 > 0)                                      # regla de la cadena + ReLU'
        dW1 = self.X.T @ dZ1; db1 = dZ1.sum(0)
        for p, g in ((self.W1, dW1), (self.b1, db1), (self.W2, dW2), (self.b2, db2)): p -= lr * g
    def loss(self, y): return -np.log(self.P[np.arange(len(y)), y] + 1e-12).mean()

net = MLP(64, 64, 10); r = np.random.default_rng(1); t = time.time(); hist = []
for ep in range(60):
    idx = r.permutation(len(X_tr))
    for i in range(0, len(idx), 32):
        b = idx[i:i + 32]; net.forward(X_tr[b]); net.backward(y_tr[b], lr=0.1)
    if ep in (0, 4, 9, 29, 59):
        net.forward(X_tr); lt = net.loss(y_tr); acc_te = accuracy_score(y_te, net.forward(X_te).argmax(1)); hist.append((ep + 1, round(float(lt), 4), round(acc_te, 4)))
print('numpy', 'hist(epoca, loss train, acc test)', hist, 't', round(time.time() - t, 1))
pred_np = net.forward(X_te).argmax(1); print('numpy acc', round(accuracy_score(y_te, pred_np), 4))
cm = confusion_matrix(y_te, pred_np); err = [(i, j, cm[i, j]) for i in range(10) for j in range(10) if i != j and cm[i, j] > 0]; print('errores', err)

# gradiente numérico para comprobar backprop
chk = MLP(64, 8, 10, seed=3); xb, yb = X_tr[:5], y_tr[:5]
chk.forward(xb); n = len(yb); dZ2 = chk.P.copy(); dZ2[np.arange(n), yb] -= 1; dZ2 /= n; dZ1 = (dZ2 @ chk.W2.T) * (chk.Z1 > 0); g = (xb.T @ dZ1)[10, 3]
eps = 1e-5; chk.W1[10, 3] += eps; chk.forward(xb); lp = chk.loss(yb); chk.W1[10, 3] -= 2 * eps; chk.forward(xb); lm = chk.loss(yb)
print('gradiente analitico', g, 'numerico', (lp - lm) / (2 * eps))

torch.manual_seed(0)
modelo = nn.Sequential(nn.Linear(64, 64), nn.ReLU(), nn.Linear(64, 10))
opt = torch.optim.Adam(modelo.parameters(), lr=1e-3); fn = nn.CrossEntropyLoss()
Xt, yt = torch.tensor(X_tr, dtype=torch.float32), torch.tensor(y_tr)
for ep in range(60):
    perm = torch.randperm(len(Xt))
    for i in range(0, len(perm), 32):
        b = perm[i:i + 32]; opt.zero_grad(); L = fn(modelo(Xt[b]), yt[b]); L.backward(); opt.step()
with torch.no_grad(): acc_t = (modelo(torch.tensor(X_te, dtype=torch.float32)).argmax(1).numpy() == y_te).mean()
print('torch acc', round(float(acc_t), 4), 'params', sum(p.numel() for p in modelo.parameters()))
sk = MLPClassifier(hidden_layer_sizes=(64,), max_iter=500, random_state=42).fit(X_tr, y_tr); print('sklearn mlp', round(sk.score(X_te, y_te), 4))
lr = LogisticRegression(max_iter=5000).fit(X_tr, y_tr); print('logistica', round(lr.score(X_te, y_te), 4))
for h in [4, 8, 16, 64, 256]:
    m = MLPClassifier(hidden_layer_sizes=(h,), max_iter=800, random_state=42).fit(X_tr, y_tr); print('ocultas', h, round(m.score(X_te, y_te), 4))
