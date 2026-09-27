"""Regresión logística: desde cero con descenso de gradiente y con scikit-learn, sobre Breast Cancer Wisconsin."""
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix, precision_score, recall_score, f1_score, log_loss

d = load_breast_cancer(); X, y = d.data, d.target
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
sc = StandardScaler().fit(X_tr); Xs, Xts = sc.transform(X_tr), sc.transform(X_te)

sig = lambda z: 1 / (1 + np.exp(-z))
w, b, eta, lam = np.zeros(X.shape[1]), 0.0, 0.1, 0.01
hist = []
for it in range(3000):
    p = sig(Xs @ w + b)
    grad_w = Xs.T @ (p - y_tr) / len(y_tr) + lam * w
    grad_b = (p - y_tr).mean()
    w -= eta * grad_w; b -= eta * grad_b
    if it in (0, 10, 100, 1000, 2999): hist.append((it, round(float(log_loss(y_tr, p)), 4)))
pt = sig(Xts @ w + b)
print("scratch acc", round(accuracy_score(y_te, pt > .5), 4), "auc", round(roc_auc_score(y_te, pt), 4), "hist", hist)

m = make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)).fit(X_tr, y_tr)
pr = m.predict(X_te); pb = m.predict_proba(X_te)[:, 1]
print("sk acc", round(accuracy_score(y_te, pr), 4), "prec", round(precision_score(y_te, pr), 4), "rec", round(recall_score(y_te, pr), 4), "f1", round(f1_score(y_te, pr), 4), "auc", round(roc_auc_score(y_te, pb), 4), "logloss", round(log_loss(y_te, pb), 4))
print(confusion_matrix(y_te, pr))
cv = cross_val_score(make_pipeline(StandardScaler(), LogisticRegression(max_iter=5000)), X, y, cv=5); print("cv", round(cv.mean(), 4), round(cv.std(), 4))
coef = m[-1].coef_[0]; order = np.argsort(-np.abs(coef))[:6]
print("top coef", [(d.feature_names[i], round(coef[i], 2)) for i in order])
# umbral para priorizar recall de malignos (clase 0): prob de maligno = 1 - pb
for t in [0.5, 0.3, 0.2, 0.1]:
    pred_mal = (1 - pb) >= t
    tp = int(((y_te == 0) & pred_mal).sum()); fn = int(((y_te == 0) & ~pred_mal).sum()); fp = int(((y_te == 1) & pred_mal).sum())
    print("umbral maligno", t, "detectados", tp, "/", tp + fn, "falsas alarmas", fp)
for C in [0.001, 0.01, 0.1, 1, 10, 100]:
    mm = make_pipeline(StandardScaler(), LogisticRegression(C=C, max_iter=5000)).fit(X_tr, y_tr); print("C", C, round(mm.score(X_te, y_te), 4))
print("sin escalar convergencia:")
import warnings
with warnings.catch_warnings(record=True) as wlist:
    warnings.simplefilter("always"); LogisticRegression(max_iter=100).fit(X_tr, y_tr); print(" avisos", [str(x.category.__name__) for x in wlist][:2])
