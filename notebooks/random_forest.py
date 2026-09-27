"""Random Forest: implementación desde cero en NumPy y con scikit-learn, sobre Breast Cancer Wisconsin."""
import numpy as np

class Nodo:
    def __init__(self, feature=None, umbral=None, izq=None, der=None, valor=None):
        self.feature, self.umbral, self.izq, self.der, self.valor = feature, umbral, izq, der, valor

def gini(y):
    _, cuentas = np.unique(y, return_counts=True)
    p = cuentas / len(y)
    return 1.0 - np.sum(p ** 2)

class ArbolDecision:
    def __init__(self, max_depth=None, min_samples_split=2, max_features=None, rng=None):
        self.max_depth, self.min_samples_split = max_depth, min_samples_split
        self.max_features, self.rng = max_features, rng or np.random.default_rng()

    def fit(self, X, y):
        self.raiz = self._crecer(X, y, profundidad=0)
        return self

    def _crecer(self, X, y, profundidad):
        if (len(np.unique(y)) == 1 or len(y) < self.min_samples_split
                or (self.max_depth is not None and profundidad >= self.max_depth)):
            return Nodo(valor=np.bincount(y).argmax())
        n_feat = X.shape[1]
        k = self.max_features or n_feat
        candidatas = self.rng.choice(n_feat, k, replace=False)   # aleatoriedad por nodo
        mejor = (None, None, gini(y))
        for f in candidatas:
            for t in np.unique(X[:, f])[:-1]:
                izq = X[:, f] <= t
                g = (izq.sum() * gini(y[izq]) + (~izq).sum() * gini(y[~izq])) / len(y)
                if g < mejor[2]:
                    mejor = (f, t, g)
        f, t, _ = mejor
        if f is None:
            return Nodo(valor=np.bincount(y).argmax())
        izq = X[:, f] <= t
        return Nodo(f, t, self._crecer(X[izq], y[izq], profundidad + 1),
                    self._crecer(X[~izq], y[~izq], profundidad + 1))

    def _predecir_uno(self, x, nodo):
        while nodo.valor is None:
            nodo = nodo.izq if x[nodo.feature] <= nodo.umbral else nodo.der
        return nodo.valor

    def predict(self, X):
        return np.array([self._predecir_uno(x, self.raiz) for x in X])

class RandomForest:
    def __init__(self, n_estimators=100, max_depth=None, max_features="sqrt", seed=0):
        self.n_estimators, self.max_depth = n_estimators, max_depth
        self.max_features, self.rng = max_features, np.random.default_rng(seed)

    def fit(self, X, y):
        n, d = X.shape
        k = int(np.sqrt(d)) if self.max_features == "sqrt" else d
        self.arboles = []
        for _ in range(self.n_estimators):
            idx = self.rng.integers(0, n, n)                       # muestra bootstrap
            arbol = ArbolDecision(self.max_depth, max_features=k, rng=self.rng)
            self.arboles.append(arbol.fit(X[idx], y[idx]))
        return self

    def predict(self, X):
        votos = np.array([a.predict(X) for a in self.arboles])   # (n_arboles, n_muestras)
        return np.apply_along_axis(lambda v: np.bincount(v).argmax(), 0, votos)


# --- Experimentos del artículo ---
import time
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

datos = load_breast_cancer(); X, y = datos.data, datos.target      # y: 0 = maligno, 1 = benigno
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)

t = time.time(); rf = RandomForest(n_estimators=25, max_depth=8, seed=0).fit(X_tr, y_tr)
print("desde cero:", accuracy_score(y_te, rf.predict(X_te)), f"({time.time() - t:.1f} s)")
print("un árbol:", accuracy_score(y_te, DecisionTreeClassifier(random_state=42).fit(X_tr, y_tr).predict(X_te)))

modelo = RandomForestClassifier(n_estimators=300, oob_score=True, random_state=42, n_jobs=-1).fit(X_tr, y_tr)
pred, prob = modelo.predict(X_te), modelo.predict_proba(X_te)[:, 1]
print("OOB:", modelo.oob_score_)
print("acierto", accuracy_score(y_te, pred), "precisión", precision_score(y_te, pred), "recall", recall_score(y_te, pred),
      "F1", f1_score(y_te, pred), "ROC-AUC", roc_auc_score(y_te, prob))
print(confusion_matrix(y_te, pred))
cv = cross_val_score(RandomForestClassifier(n_estimators=300, random_state=42), X, y, cv=5); print("CV:", cv.mean(), cv.std())
for nombre, imp in sorted(zip(datos.feature_names, modelo.feature_importances_), key=lambda t: -t[1])[:8]: print(f"  {imp:.4f} {nombre}")
for n in [1, 5, 10, 25, 50, 100, 200, 300]:
    m = RandomForestClassifier(n_estimators=n, random_state=42, n_jobs=-1).fit(X_tr, y_tr); print("árboles", n, accuracy_score(y_te, m.predict(X_te)))
