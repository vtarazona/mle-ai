"""Regresión lineal: desde cero (ecuación normal y descenso de gradiente) y con scikit-learn, sobre el dataset Diabetes."""
import numpy as np
from sklearn.datasets import load_diabetes
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

datos = load_diabetes()
X, y = datos.data, datos.target
print("forma", X.shape, "objetivo: min", y.min(), "max", y.max(), "media", round(y.mean(), 1))
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

# --- Desde cero: ecuación normal ---
Xb = np.c_[np.ones(len(X_tr)), X_tr]
w = np.linalg.solve(Xb.T @ Xb, Xb.T @ y_tr)
pred_ne = np.c_[np.ones(len(X_te)), X_te] @ w

# --- Desde cero: descenso de gradiente (variables estandarizadas) ---
sc = StandardScaler().fit(X_tr)
Xs, Xts = sc.transform(X_tr), sc.transform(X_te)
wg, b, eta = np.zeros(X.shape[1]), 0.0, 0.1
hist = []
for paso in range(2000):
    err = Xs @ wg + b - y_tr
    wg -= eta * 2 * Xs.T @ err / len(y_tr)
    b -= eta * 2 * err.mean()
    if paso in (0, 10, 50, 100, 500, 1999): hist.append((paso, round(float(np.mean(err**2)), 1)))
pred_gd = Xts @ wg + b

m = LinearRegression().fit(X_tr, y_tr); pred = m.predict(X_te)
rmse = lambda a, b: mean_squared_error(a, b) ** 0.5
print("ecuacion normal RMSE", round(rmse(y_te, pred_ne), 2))
print("GD RMSE", round(rmse(y_te, pred_gd), 2), "historial MSE train", hist)
print("sklearn RMSE", round(rmse(y_te, pred), 2), "MAE", round(mean_absolute_error(y_te, pred), 2), "R2", round(r2_score(y_te, pred), 3))
print("R2 train", round(m.score(X_tr, y_tr), 3))
print("baseline media RMSE", round(rmse(y_te, np.full_like(y_te, y_tr.mean())), 2))
cv = cross_val_score(LinearRegression(), X, y, cv=5, scoring="r2"); print("CV R2", round(cv.mean(), 3), round(cv.std(), 3))
coef = sorted(zip(m.coef_, datos.feature_names), key=lambda t: -abs(t[0]))
print("coeficientes", [(n, round(c, 1)) for c, n in coef])
# solo bmi
mb = LinearRegression().fit(X_tr[:, [2]], y_tr); print("solo bmi R2 test", round(mb.score(X_te[:, [2]], y_te), 3), "pendiente", round(mb.coef_[0], 1), "intercepto", round(mb.intercept_, 1))
for a in [0.01, 0.1, 1, 10]:
    r = Ridge(alpha=a).fit(X_tr, y_tr); print("ridge", a, round(r.score(X_te, y_te), 3))
print("igual NE vs sklearn", np.allclose(pred_ne, pred), "GD vs sklearn max diff", round(float(np.abs(pred_gd - pred).max()), 3))
