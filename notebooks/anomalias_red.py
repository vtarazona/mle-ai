"""Detección de anomalías en tráfico de red: modelos no supervisados entrenados solo con tráfico normal (NSL-KDD), evaluados frente a ataques conocidos y nuevos."""
# --- 1. Datos ---
import json, time
import numpy as np
import pandas as pd
import torch, torch.nn as nn
from sklearn.preprocessing import OneHotEncoder, StandardScaler, FunctionTransformer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score

BASE = "https://raw.githubusercontent.com/defcom17/NSL_KDD/master/"     # réplica pública de NSL-KDD (UNB)
COLS = ["duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", "land", "wrong_fragment", "urgent", "hot",
        "num_failed_logins", "logged_in", "num_compromised", "root_shell", "su_attempted", "num_root", "num_file_creations",
        "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login", "is_guest_login", "count", "srv_count",
        "serror_rate", "srv_serror_rate", "rerror_rate", "srv_rerror_rate", "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate",
        "dst_host_count", "dst_host_srv_count", "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
        "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "dst_host_rerror_rate",
        "dst_host_srv_rerror_rate", "label", "difficulty"]
def cargar(nombre):
    try:
        return pd.read_csv(f"data/nsl_kdd/{nombre}", names=COLS)
    except FileNotFoundError:
        return pd.read_csv(BASE + nombre, names=COLS)
train, test = cargar("KDDTrain+.txt"), cargar("KDDTest+.txt")
CAT = {**{a: "DoS" for a in "back land neptune pod smurf teardrop apache2 udpstorm processtable mailbomb".split()},
       **{a: "Probe" for a in "satan ipsweep nmap portsweep mscan saint".split()},
       **{a: "R2L" for a in "guess_passwd ftp_write imap phf multihop warezmaster warezclient spy xlock xsnoop snmpguess snmpgetattack httptunnel sendmail named worm".split()},
       **{a: "U2R" for a in "buffer_overflow loadmodule rootkit perl sqlattack xterm ps".split()}, "normal": "Normal"}
for d in (train, test):
    d["categoria"] = d["label"].map(CAT); d["ataque"] = (d["label"] != "normal").astype(int)
assert train["categoria"].notna().all() and test["categoria"].notna().all()
print("entrenamiento", train.shape, "· test", test.shape)
print(train["categoria"].value_counts(), "\n", test["categoria"].value_counts())
nuevos = sorted(set(test["label"]) - set(train["label"]))
test["nuevo"] = test["label"].isin(nuevos)
print(f"tipos de ataque que solo aparecen en test: {len(nuevos)} · conexiones: {test['nuevo'].sum()} ({test['nuevo'].sum() / test['ataque'].sum():.1%} de los ataques de test)")
print(nuevos)

# --- 2. Exploración ---
print(train.groupby("categoria")[["src_bytes", "dst_bytes", "count", "serror_rate", "same_srv_rate"]].median().round(2))
print("proporción de conexiones con src_bytes = 0:", round((train["src_bytes"] == 0).mean(), 3), "· máximo:", train["src_bytes"].max())
print(pd.crosstab(train["categoria"], train["protocol_type"], normalize="index").round(3))
print("constante:", [c for c in COLS[:-2] if train[c].nunique() == 1])

# --- 3. Preprocesado: solo se aprende del tráfico normal ---
cat_cols = ["protocol_type", "service", "flag"]
num_cols = [c for c in COLS[:-2] if c not in cat_cols + ["num_outbound_cmds"]]
colas = ["duration", "src_bytes", "dst_bytes", "hot", "num_failed_logins", "num_compromised", "num_root", "num_file_creations", "num_access_files", "count", "srv_count", "dst_host_count", "dst_host_srv_count"]
resto = [c for c in num_cols if c not in colas]
prep = ColumnTransformer([
    ("colas", Pipeline([("log", FunctionTransformer(np.log1p, feature_names_out="one-to-one")), ("esc", StandardScaler())]), colas),
    ("num", StandardScaler(), resto),
    ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)], sparse_threshold=0)
normal = train[train["ataque"] == 0]
n_fit, n_val = train_test_split(normal, test_size=0.2, random_state=42)       # validación: solo normales, para fijar el umbral
prep.fit(n_fit)
Xf, Xv, Xt = (prep.transform(d).astype(np.float32) for d in (n_fit, n_val, test))
yt = test["ataque"].values
print("normales para ajustar", Xf.shape, "· para fijar el umbral", Xv.shape, "· columnas", Xf.shape[1])

# --- 4. Detectores ---
PUNT = {}
media = Xf.mean(0)
PUNT["Distancia a la media"] = lambda X: np.linalg.norm(X - media, axis=1)
pca = PCA(n_components=0.95, random_state=42).fit(Xf)
print("PCA: componentes para el 95 % de la varianza:", pca.n_components_)
PUNT["PCA (error de reconstrucción)"] = lambda X: ((X - pca.inverse_transform(pca.transform(X))) ** 2).sum(1)
t0 = time.time(); iso = IsolationForest(n_estimators=300, random_state=42, n_jobs=-1).fit(Xf)
print(f"Isolation Forest entrenado en {time.time() - t0:.1f} s")
PUNT["Isolation Forest"] = lambda X: -iso.score_samples(X)

torch.manual_seed(42)
d = Xf.shape[1]
ae = nn.Sequential(nn.Linear(d, 64), nn.ReLU(), nn.Linear(64, 16), nn.ReLU(), nn.Linear(16, 64), nn.ReLU(), nn.Linear(64, d))
opt = torch.optim.Adam(ae.parameters(), lr=1e-3)
Xf_t, Xv_t = torch.tensor(Xf), torch.tensor(Xv)
t0 = time.time()
for epoca in range(60):
    perm = torch.randperm(len(Xf_t))
    for i in range(0, len(perm), 256):
        b = Xf_t[perm[i:i + 256]]; loss = ((ae(b) - b) ** 2).mean()
        opt.zero_grad(); loss.backward(); opt.step()
    if epoca % 20 == 19:
        with torch.no_grad(): print(f"autoencoder · época {epoca + 1} · error validación {((ae(Xv_t) - Xv_t) ** 2).mean():.4f}")
print(f"autoencoder entrenado en {time.time() - t0:.1f} s")
def err_ae(X):
    with torch.no_grad():
        X = torch.tensor(X); return ((ae(X) - X) ** 2).sum(1).numpy()
PUNT["Autoencoder"] = err_ae

# --- 5. Evaluación en test ---
FPR = 0.01                                          # presupuesto: 1 % de falsas alarmas sobre el tráfico normal
RES, S = {}, {}
def evaluar(nombre, sv, st):
    umbral = np.quantile(sv, 1 - FPR); alerta = st > umbral
    r = {"auc": roc_auc_score(yt, st), "ap": average_precision_score(yt, st), "fpr_test": alerta[yt == 0].mean(), "det": alerta[yt == 1].mean(),
         "nuevos": alerta[test["nuevo"].values].mean(), "conocidos": alerta[(yt == 1) & ~test["nuevo"].values].mean()}
    for c in ("DoS", "Probe", "R2L", "U2R"): r[c] = alerta[(test["categoria"] == c).values].mean()
    for f in (0.02, 0.05): r[f"det_{f}"] = (st > np.quantile(sv, 1 - f))[yt == 1].mean()
    RES[nombre] = r; S[nombre] = (sv, st)
    print(f"{nombre:32s} AUC {r['auc']:.3f} · PR-AUC {r['ap']:.3f} · detecta {r['det']:.1%} (2 %: {r['det_0.02']:.1%} · 5 %: {r['det_0.05']:.1%}) · falsas alarmas en test {r['fpr_test']:.1%} · "
          + " · ".join(f"{c} {r[c]:.1%}" for c in ("DoS", "Probe", "R2L", "U2R")) + f" · conocidos {r['conocidos']:.1%} · nuevos {r['nuevos']:.1%}")
for nombre, f in PUNT.items():
    evaluar(nombre, f(Xv), f(Xt))

# combinación: cada puntuación se convierte en su percentil dentro del tráfico normal de validación y se promedian
def percentil(ref, s): return np.searchsorted(np.sort(ref), s) / len(ref)
ref_if, ref_ae = S["Isolation Forest"][0], S["Autoencoder"][0]
combinar = lambda X: (percentil(ref_if, PUNT["Isolation Forest"](X)) + percentil(ref_ae, PUNT["Autoencoder"](X))) / 2
evaluar("Isolation Forest + Autoencoder", combinar(Xv), combinar(Xt))

# referencia supervisada: necesita etiquetas de ataques y solo conoce los del entrenamiento
from sklearn.base import clone
rf = Pipeline([("prep", clone(prep)), ("rf", RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1))]).fit(train, train["ataque"])
p_rf = rf.predict_proba(test)[:, 1]; al = p_rf >= 0.5
print(f"Random Forest supervisado        AUC {roc_auc_score(yt, p_rf):.3f} · detecta {al[yt == 1].mean():.1%} · falsas alarmas {al[yt == 0].mean():.1%} · "
      + " · ".join(f"{c} {al[(test['categoria'] == c).values].mean():.1%}" for c in ('DoS', 'Probe', 'R2L', 'U2R'))
      + f" · conocidos {al[(yt == 1) & ~test['nuevo'].values].mean():.1%} · nuevos {al[test['nuevo'].values].mean():.1%}")

# --- 6. Umbral: presupuesto de alertas ---
mejor = "Isolation Forest + Autoencoder"
sv, st = S[mejor]
TABLA = []
for fpr in (0.001, 0.005, 0.01, 0.02, 0.05, 0.10):
    u = np.quantile(sv, 1 - fpr); a = st > u
    fila = {"fpr": fpr, "fpr_test": round(float(a[yt == 0].mean()), 4), "det": round(float(a[yt == 1].mean()), 4),
            "prec": round(float(yt[a].mean()), 4)}
    for c in ("DoS", "Probe", "R2L", "U2R"): fila[c] = round(float(a[(test["categoria"] == c).values].mean()), 4)
    TABLA.append(fila)
    print(fila)
print("UMBRALES =", json.dumps(TABLA))
FPRS = (0.001, 0.005, 0.01, 0.02, 0.05, 0.10)
for nombre in ("Isolation Forest", "Autoencoder", "Isolation Forest + Autoencoder"):
    sv_, st_ = S[nombre]
    print("curva", nombre, [round(float((st_ > np.quantile(sv_, 1 - f))[yt == 1].mean()), 3) for f in FPRS])
# con qué frecuencia acertaría una alerta si los ataques fueran raros (en test son el 57 %)
fila = TABLA[2]
for prev in (yt.mean(), 0.01, 0.001):
    print(f"ataques = {prev:.1%} del tráfico → precisión de las alertas {prev * fila['det'] / (prev * fila['det'] + (1 - prev) * fila['fpr_test']):.1%}")

# --- 7. ¿Por qué salta la alarma? ---
nombres = prep.get_feature_names_out()
def explicar(fila):
    x = torch.tensor(prep.transform(fila).astype(np.float32))
    with torch.no_grad(): e = ((ae(x) - x) ** 2)[0].numpy()
    top = np.argsort(-e)[:4]
    return [(nombres[i].split("__")[1], round(float(e[i] / e.sum()), 3)) for i in top]
for etiqueta in ("neptune", "portsweep", "guess_passwd", "mscan"):
    fila = test[test["label"] == etiqueta].iloc[[0]]
    print(etiqueta, "· puntuación", round(float(err_ae(prep.transform(fila).astype(np.float32))[0]), 1), "· umbral 1 %", round(float(np.quantile(ref_ae, 0.99)), 1), "·", explicar(fila))

# --- 8. Puntuación de nuevas conexiones (lo que haría el servicio en producción) ---
UMBRAL = float(np.quantile(S[mejor][0], 1 - FPR))
def puntuar(conexiones: pd.DataFrame) -> pd.DataFrame:
    s = combinar(prep.transform(conexiones).astype(np.float32))
    return pd.DataFrame({"puntuacion": s.round(3), "alerta": s > UMBRAL})
muestra = test.sample(6, random_state=3)
print("umbral:", round(UMBRAL, 4)); print(puntuar(muestra[COLS[:-2]]).assign(real=muestra["label"].values))
