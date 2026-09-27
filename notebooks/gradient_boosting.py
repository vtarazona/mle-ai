"""Gradient boosting: desde cero (árboles de regresión sobre residuos) y con scikit-learn / XGBoost, sobre Diabetes."""
import numpy as np, time
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import GradientBoostingRegressor, HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
import xgboost as xgb

X, y = load_diabetes(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)
rmse = lambda a, b: mean_squared_error(a, b) ** 0.5

class GradientBoosting:
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=2):
        self.n, self.lr, self.depth = n_estimators, learning_rate, max_depth
    def fit(self, X, y):
        self.f0 = y.mean(); pred = np.full(len(y), self.f0); self.arboles = []
        for _ in range(self.n):
            residuo = y - pred                               # = −gradiente de ½(y − f)²
            t = DecisionTreeRegressor(max_depth=self.depth).fit(X, residuo)
            pred += self.lr * t.predict(X); self.arboles.append(t)
        return self
    def predict(self, X, n=None):
        arb = self.arboles[:n] if n else self.arboles
        return self.f0 + self.lr * sum(t.predict(X) for t in arb)

gb = GradientBoosting(300, 0.05, 2).fit(X_tr, y_tr)
print("scratch RMSE", round(rmse(y_te, gb.predict(X_te)), 2), "R2", round(r2_score(y_te, gb.predict(X_te)), 3))
for n in [1, 10, 50, 100, 200, 300]:
    print("  n", n, "train", round(rmse(y_tr, gb.predict(X_tr, n)), 1), "test", round(rmse(y_te, gb.predict(X_te, n)), 1))
res = {}
res['lineal'] = LinearRegression().fit(X_tr, y_tr).predict(X_te)
res['arbol_d3'] = DecisionTreeRegressor(max_depth=3, random_state=0).fit(X_tr, y_tr).predict(X_te)
res['rf'] = RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1).fit(X_tr, y_tr).predict(X_te)
sk = GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, random_state=42).fit(X_tr, y_tr); res['gbr'] = sk.predict(X_te)
res['hgb'] = HistGradientBoostingRegressor(max_iter=300, learning_rate=0.05, max_depth=3, random_state=42).fit(X_tr, y_tr).predict(X_te)
xm = xgb.XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, subsample=0.8, reg_lambda=1.0, random_state=42).fit(X_tr, y_tr); res['xgb'] = xm.predict(X_te)
for k, v in res.items(): print(k, "RMSE", round(rmse(y_te, v), 2), "R2", round(r2_score(y_te, v), 3))
kf = KFold(5, shuffle=True, random_state=42)
for name, mod in [('lineal', LinearRegression()), ('gbr', GradientBoostingRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, random_state=42)), ('rf', RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)), ('xgb', xgb.XGBRegressor(n_estimators=300, learning_rate=0.05, max_depth=2, subsample=0.8, random_state=42))]:
    s = cross_val_score(mod, X, y, cv=kf, scoring='r2'); print('cv', name, round(s.mean(), 3), round(s.std(), 3))
# efecto learning rate con mismo nº árboles: sobreajuste
for lr in [0.01, 0.05, 0.1, 0.3, 1.0]:
    m = GradientBoostingRegressor(n_estimators=300, learning_rate=lr, max_depth=2, random_state=42).fit(X_tr, y_tr)
    print('lr', lr, 'train', round(rmse(y_tr, m.predict(X_tr)), 1), 'test', round(rmse(y_te, m.predict(X_te)), 1))
# early stopping
es = GradientBoostingRegressor(n_estimators=2000, learning_rate=0.05, max_depth=2, validation_fraction=0.2, n_iter_no_change=20, random_state=42).fit(X_tr, y_tr)
print('early stopping arboles', es.n_estimators_, 'test', round(rmse(y_te, es.predict(X_te)), 2))
names = load_diabetes().feature_names
imp = sorted(zip(sk.feature_importances_, names), reverse=True)[:5]; print('imp', [(n, round(v, 3)) for v, n in imp])

# --- Segundo caso: relación no lineal (Friedman #1, benchmark sintético clásico) ---
from sklearn.datasets import make_friedman1
Xf, yf = make_friedman1(n_samples=2000, noise=1.0, random_state=42)
Xa, Xb, ya, yb = train_test_split(Xf, yf, test_size=0.25, random_state=42)
for name, mod in [('lineal', LinearRegression()), ('rf', RandomForestRegressor(n_estimators=300, random_state=42, n_jobs=-1)),
                  ('gb_scratch', GradientBoosting(500, 0.05, 3)), ('gbr', GradientBoostingRegressor(n_estimators=500, learning_rate=0.05, max_depth=3, random_state=42)),
                  ('xgb', xgb.XGBRegressor(n_estimators=500, learning_rate=0.05, max_depth=3, subsample=0.8, random_state=42))]:
    t = time.time(); mod.fit(Xa, ya); p = mod.predict(Xb)
    print('friedman', name, 'RMSE', round(rmse(yb, p), 3), 'R2', round(r2_score(yb, p), 3), 't', round(time.time() - t, 2))
