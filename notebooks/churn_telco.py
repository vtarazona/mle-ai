"""Predicción de bajas de clientes (churn) en una operadora de telecomunicaciones: del problema de negocio al modelo desplegable, con el dataset IBM Telco Customer Churn."""
# --- 1. Datos ---
import json, pathlib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, cross_val_predict, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.metrics import roc_auc_score, average_precision_score, precision_score, recall_score, f1_score, confusion_matrix, brier_score_loss
from sklearn.inspection import permutation_importance
from xgboost import XGBClassifier

URL = "https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/data/telco_churn.csv"
try:
    df = pd.read_csv("data/telco_churn.csv")
except FileNotFoundError:
    df = pd.read_csv(URL)
print(df.shape)                                                     # (7043, 21)
print(df.dtypes.value_counts())

# TotalCharges viene como texto: 11 clientes recién llegados (tenure = 0) lo tienen en blanco
print("TotalCharges en blanco:", (df["TotalCharges"].str.strip() == "").sum(), "· su antigüedad:", df.loc[df["TotalCharges"].str.strip() == "", "tenure"].unique())
df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0.0)
df["Churn"] = (df["Churn"] == "Yes").astype(int)
df = df.drop(columns="customerID")
print("tasa de bajas:", round(df["Churn"].mean() * 100, 1), "%")      # 26.5 %

# --- 2. Exploración ---
def tasa(col):
    t = df.groupby(col)["Churn"].agg(["mean", "size"]); t["mean"] = (t["mean"] * 100).round(1); return t.sort_values("mean", ascending=False)
for col in ("Contract", "InternetService", "PaymentMethod", "TechSupport", "SeniorCitizen", "PaperlessBilling"):
    print(tasa(col), "\n")
df["tramo_antiguedad"] = pd.cut(df["tenure"], [-1, 6, 12, 24, 48, 72], labels=["0-6", "7-12", "13-24", "25-48", "49-72"])
print(tasa("tramo_antiguedad").sort_index())
df = df.drop(columns="tramo_antiguedad")
print(df.groupby("Churn")[["tenure", "MonthlyCharges", "TotalCharges"]].median())
print("correlación tenure-TotalCharges:", round(df["tenure"].corr(df["TotalCharges"]), 3))

# --- 3. Preprocesado ---
y = df["Churn"]; X = df.drop(columns="Churn")
num = ["tenure", "MonthlyCharges", "TotalCharges"]
cat = [c for c in X.columns if c not in num]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
print("entrenamiento", X_tr.shape, "· test", X_te.shape, "· bajas", round(y_tr.mean() * 100, 1), round(y_te.mean() * 100, 1))
prep = ColumnTransformer([("num", StandardScaler(), num), ("cat", OneHotEncoder(handle_unknown="ignore", drop="if_binary"), cat)])
print("columnas tras el preprocesado:", prep.fit(X_tr).transform(X_tr).shape[1])

# --- 4. Modelos candidatos y validación cruzada ---
cv = StratifiedKFold(5, shuffle=True, random_state=42)
modelos = {
    "Línea base (siempre «no se va»)": DummyClassifier(strategy="prior"),
    "Regresión logística": LogisticRegression(max_iter=2000),
    "Random Forest": RandomForestClassifier(n_estimators=400, min_samples_leaf=5, random_state=42, n_jobs=-1),
    "XGBoost": XGBClassifier(n_estimators=300, learning_rate=0.05, max_depth=4, subsample=0.9, colsample_bytree=0.8, random_state=42, n_jobs=4, eval_metric="logloss"),
}
CV = {}
for nombre, m in modelos.items():
    pipe = Pipeline([("prep", prep), ("modelo", m)])
    auc = cross_val_score(pipe, X_tr, y_tr, cv=cv, scoring="roc_auc")
    ap = cross_val_score(pipe, X_tr, y_tr, cv=cv, scoring="average_precision")
    CV[nombre] = (auc.mean(), auc.std(), ap.mean())
    print(f"{nombre:34s} ROC-AUC {auc.mean():.3f} ± {auc.std():.3f} · PR-AUC {ap.mean():.3f}")

# --- 5. Optimización de hiperparámetros ---
g_lr = GridSearchCV(Pipeline([("prep", prep), ("modelo", LogisticRegression(max_iter=2000))]),
                    {"modelo__C": [0.01, 0.03, 0.1, 0.3, 1, 3]}, cv=cv, scoring="roc_auc").fit(X_tr, y_tr)
print("logística · mejor C:", g_lr.best_params_, "· ROC-AUC", round(g_lr.best_score_, 4))
g_xgb = GridSearchCV(Pipeline([("prep", prep), ("modelo", XGBClassifier(subsample=0.9, colsample_bytree=0.8, random_state=42, n_jobs=4, eval_metric="logloss"))]),
                     {"modelo__n_estimators": [200, 400], "modelo__learning_rate": [0.02, 0.05], "modelo__max_depth": [2, 3, 4]}, cv=cv, scoring="roc_auc").fit(X_tr, y_tr)
print("XGBoost · mejores:", g_xgb.best_params_, "· ROC-AUC", round(g_xgb.best_score_, 4))

# --- 6. Evaluación en el conjunto de test (se mira una sola vez) ---
finales = {"Regresión logística": g_lr.best_estimator_, "XGBoost": g_xgb.best_estimator_}
TEST = {}
for nombre, m in finales.items():
    p = m.predict_proba(X_te)[:, 1]; pred = (p >= 0.5).astype(int)
    TEST[nombre] = dict(auc=roc_auc_score(y_te, p), ap=average_precision_score(y_te, p), prec=precision_score(y_te, pred), rec=recall_score(y_te, pred), f1=f1_score(y_te, pred), brier=brier_score_loss(y_te, p))
    print(nombre, {k: round(v, 3) for k, v in TEST[nombre].items()}, "\nmatriz de confusión (umbral 0,5):\n", confusion_matrix(y_te, pred))
modelo = finales["Regresión logística"]           # igual de bueno, más simple y explicable
p_te = modelo.predict_proba(X_te)[:, 1]

# ranking: ¿cuántas bajas captura el 20 % de clientes con más riesgo?
orden = np.argsort(-p_te); top = orden[: int(0.2 * len(orden))]
print(f"el 20 % con más riesgo contiene el {y_te.iloc[top].sum() / y_te.sum() * 100:.1f} % de las bajas (tasa {y_te.iloc[top].mean() * 100:.1f} % frente a {y_te.mean() * 100:.1f} %)")
deciles = pd.qcut(pd.Series(p_te).rank(method="first", ascending=False), 10, labels=range(1, 11))
lift = pd.Series(y_te.values).groupby(deciles.values).mean().round(3) * 100
print("tasa de bajas por decil de riesgo (1 = más riesgo):", lift.tolist())

# --- 7. Umbral de decisión según el negocio ---
# Supuestos (cámbialos por los de tu empresa):
COSTE_OFERTA = 50       # $ por cliente contactado (llamada + descuento)
EXITO = 0.30            # fracción de clientes que iban a irse y se quedan gracias a la oferta
MESES = 12              # ingresos que se conservan si se queda
def beneficio(y_true, prob, cuota, umbral):
    c = prob >= umbral
    return float((EXITO * MESES * cuota[c] * y_true[c]).sum() - COSTE_OFERTA * c.sum())
# el umbral se elige con predicciones fuera de pliegue del entrenamiento, no con el test
p_oof = cross_val_predict(modelo, X_tr, y_tr, cv=cv, method="predict_proba")[:, 1]
umbrales = np.round(np.arange(0.05, 0.96, 0.05), 2)
b_tr = [beneficio(y_tr.values, p_oof, X_tr["MonthlyCharges"].values, u) for u in umbrales]
u_opt = umbrales[int(np.argmax(b_tr))]
print("umbral óptimo (validación):", u_opt)
CURVA = []
for u in umbrales:
    c = p_te >= u
    CURVA.append((float(u), round(beneficio(y_te.values, p_te, X_te["MonthlyCharges"].values, u)), int(c.sum()), int((c & (y_te.values == 1)).sum())))
for u, b, n, tp in CURVA: print(f"umbral {u:.2f}: contactar {n:4d} · bajas detectadas {tp:3d} · beneficio {b:8.0f} $")
todos = beneficio(y_te.values, p_te, X_te["MonthlyCharges"].values, 0.0)
print("contactar a todos:", round(todos), "$ · nadie: 0 $")
pred_opt = (p_te >= u_opt).astype(int)
print("con el umbral óptimo · precisión", round(precision_score(y_te, pred_opt), 3), "· recall", round(recall_score(y_te, pred_opt), 3), "\n", confusion_matrix(y_te, pred_opt))

# --- 8. ¿Qué explica las bajas? ---
coef = pd.Series(modelo.named_steps["modelo"].coef_[0], index=modelo.named_steps["prep"].get_feature_names_out()).sort_values()
print("coeficientes más negativos (retienen):\n", coef.head(6).round(3), "\nmás positivos (empujan a irse):\n", coef.tail(6).round(3))
imp = permutation_importance(modelo, X_te, y_te, scoring="roc_auc", n_repeats=10, random_state=42)
imp = pd.Series(imp.importances_mean, index=X_te.columns).sort_values(ascending=False)
print("importancia por permutación (caída de ROC-AUC):\n", imp.head(8).round(4))

# --- 9. Modelo simplificado para la calculadora de la web ---
SIMPLE = ["Contract", "tenure", "InternetService", "PaymentMethod", "MonthlyCharges", "TechSupport", "OnlineSecurity"]
cat_s = [c for c in SIMPLE if c not in ("tenure", "MonthlyCharges")]
simple = Pipeline([("prep", ColumnTransformer([("num", StandardScaler(), ["tenure", "MonthlyCharges"]), ("cat", OneHotEncoder(handle_unknown="ignore"), cat_s)])),
                   ("modelo", LogisticRegression(C=g_lr.best_params_["modelo__C"], max_iter=2000))]).fit(X_tr[SIMPLE], y_tr)
auc_s = roc_auc_score(y_te, simple.predict_proba(X_te[SIMPLE])[:, 1]); print("modelo simplificado · ROC-AUC test", round(auc_s, 3))
pr, lr_ = simple.named_steps["prep"], simple.named_steps["modelo"]
sc = pr.named_transformers_["num"]; oh = pr.named_transformers_["cat"]
w = lr_.coef_[0]; k = 2
calc = {"intercept": round(float(lr_.intercept_[0]), 5), "auc": round(auc_s, 3),
        "num": {c: {"mean": round(float(m), 4), "std": round(float(s), 4), "w": round(float(w[i]), 5)} for i, (c, m, s) in enumerate(zip(["tenure", "MonthlyCharges"], sc.mean_, sc.scale_))}, "cat": {}}
for c, cats in zip(cat_s, oh.categories_):
    calc["cat"][c] = {str(v): round(float(w[k + j]), 5) for j, v in enumerate(cats)}; k += len(cats)
ejemplo = pd.DataFrame([{"Contract": "Month-to-month", "tenure": 3, "InternetService": "Fiber optic", "PaymentMethod": "Electronic check", "MonthlyCharges": 85.0, "TechSupport": "No", "OnlineSecurity": "No"}])
print("ejemplo de alto riesgo:", round(simple.predict_proba(ejemplo)[0, 1], 3))
print("CALC =", json.dumps(calc, ensure_ascii=False))

# --- 10. Guardar el modelo para el despliegue ---
import joblib
pathlib.Path("modelos").mkdir(exist_ok=True)
joblib.dump(modelo, "modelos/churn_logistica.joblib")
print("modelo guardado · umbral de decisión", u_opt)
