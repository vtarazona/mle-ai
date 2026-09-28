"""Nivel 3 · Estadística para IA: todos los ejemplos, ejercicios y el proyecto de la lección (correlaciones y outliers en California Housing)."""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
rng = np.random.default_rng(42)

# --- 1. Centro: media, mediana y moda ---
sueldos = np.array([1800, 2000, 2100, 2300, 2500])
print("media", sueldos.mean(), "· mediana", np.median(sueldos))                        # 2140 · 2100
con_millonario = np.append(sueldos, 50_000)
print("con un millonario → media", round(con_millonario.mean(), 1), "· mediana", np.median(con_millonario))   # 10116.7 · 2200
tallas = pd.Series([38, 40, 40, 42, 40, 44, 38]); print("moda", tallas.mode()[0])          # 40

# --- 2. Dispersión: varianza, desviación típica, cuartiles ---
clase_a = np.array([5, 5, 5, 5, 5, 5]); clase_b = np.array([0, 2, 5, 5, 8, 10])
for n, c in (("A", clase_a), ("B", clase_b)):
    print(f"clase {n}: media {c.mean()} · desviación típica {c.std():.2f}")               # 5 · 0.00 / 5 · 3.42
d = np.array([2, 4, 4, 4, 5, 5, 7, 9])
print("desviaciones", d - d.mean(), "· varianza", d.var(), "· desviación típica", d.std())   # 4 · 2
q1, q3 = np.percentile(sueldos, [25, 75]); print("Q1", q1, "Q3", q3, "IQR", q3 - q1)

# --- 3. Distribuciones: la normal y la regla 68-95-99,7 ---
alturas = rng.normal(170, 8, 100_000)
for k in (1, 2, 3):
    print(f"±{k} desviaciones: {np.mean(np.abs(alturas - 170) < k * 8):.3f}")            # 0.683 0.954 0.997

# --- 4. Teorema central del límite con una exponencial ---
espera = rng.exponential(scale=10, size=(100_000, 30))       # tiempos de espera, media 10 minutos
for n in (1, 5, 30):
    medias = espera[:, :n].mean(axis=1)
    print(f"n = {n:2d}: media {medias.mean():.2f} · desviación {medias.std():.2f} · teoría 10/√n = {10 / np.sqrt(n):.2f}")
HIST = {}
bordes = np.arange(0, 41, 2)
for n in (1, 5, 30):
    cuenta, _ = np.histogram(espera[:, :n].mean(axis=1), bins=bordes)
    HIST[n] = (cuenta / len(espera) * 100).round(1).tolist()                               # % de muestras en cada tramo de 2 min
print("histogramas (%) para la lección:", HIST)

# --- 5. Intervalo de confianza del 95 %: medimos la altura de 50 personas ---
muestra = rng.normal(170, 8, 50)
media, error = muestra.mean(), muestra.std(ddof=1) / np.sqrt(len(muestra))
print(f"media {media:.1f} · error estándar {error:.2f} · IC 95 % [{media - 1.96 * error:.1f}, {media + 1.96 * error:.1f}]")
aciertos = 0
for _ in range(10_000):                     # repetimos el experimento 10 000 veces
    m = rng.normal(170, 8, 50); e = m.std(ddof=1) / np.sqrt(50)
    aciertos += (m.mean() - 1.96 * e) <= 170 <= (m.mean() + 1.96 * e)
print(f"de 10 000 intervalos, contienen la media real (170): {aciertos / 100:.1f} %")

# --- 6. Correlación ---
horas = np.array([1, 2, 3, 4, 5, 6]); nota = np.array([3, 4, 6, 5, 8, 9])
print("r(horas, nota) =", round(np.corrcoef(horas, nota)[0, 1], 3))                        # 0.943
x = np.linspace(-3, 3, 61); print("r(x, x²) =", round(np.corrcoef(x, x**2)[0, 1], 3))      # 0: relación sin correlación lineal

# --- 7. Contraste de hipótesis: ¿la moneda está trucada? ---
caras = rng.binomial(100, 0.5, 100_000)
p = np.mean(np.abs(caras - 50) >= 10); print(f"P(≥ 60 o ≤ 40 caras con moneda justa) ≈ {p:.3f}")   # ≈ 0.057
p70 = np.mean(np.abs(caras - 50) >= 20); print(f"P(≥ 70 o ≤ 30 caras) ≈ {p70:.5f}")
from scipy import stats
print("exacto con scipy:", round(stats.binomtest(60, 100, 0.5).pvalue, 4), round(stats.binomtest(70, 100, 0.5).pvalue, 6))

# --- 8. Bayes: el filtro de spam ---
correos, p_spam = 1000, 0.30
spam_gratis, normal_gratis = 0.40 * correos * p_spam, 0.05 * correos * (1 - p_spam)
print(f"spam con 'gratis' {spam_gratis:.0f} · normales con 'gratis' {normal_gratis:.0f} · P(spam | gratis) = {spam_gratis / (spam_gratis + normal_gratis):.3f}")

# --- Proyecto: correlaciones y outliers en California Housing ---
URL = "https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/data/california_housing.csv"
try:
    casas = pd.read_csv("data/california_housing.csv")
except FileNotFoundError:
    casas = pd.read_csv(URL)
print(casas.shape); print(casas.isna().sum()[casas.isna().sum() > 0])                       # total_bedrooms: 207
print(casas[["median_income", "median_house_value", "housing_median_age"]].describe().round(2))
v = casas["median_house_value"]
print("media", round(v.mean()), "· mediana", v.median(), "· asimetría", round(v.skew(), 2))
print("valor máximo", v.max(), "repetido", (v == v.max()).sum(), "veces · edad máxima", casas["housing_median_age"].max(), "repetida", (casas["housing_median_age"] == 52).sum())
casas["habitaciones_por_hogar"] = casas["total_rooms"] / casas["households"]
num = casas.drop(columns="ocean_proximity")
corr = num.corr()["median_house_value"].drop("median_house_value").sort_values()
print(corr.round(3))
print("Spearman ingresos-valor:", round(num["median_income"].corr(num["median_house_value"], method="spearman"), 3))
# outliers con la regla del rango intercuartílico (IQR)
for col in ("median_income", "habitaciones_por_hogar", "population"):
    q1, q3 = casas[col].quantile([0.25, 0.75]); iqr = q3 - q1
    fuera = ((casas[col] < q1 - 1.5 * iqr) | (casas[col] > q3 + 1.5 * iqr)).sum()
    print(f"{col}: Q1 {q1:.2f} · Q3 {q3:.2f} · límite alto {q3 + 1.5 * iqr:.2f} · outliers {fuera} ({fuera / len(casas):.1%}) · máximo {casas[col].max():.2f}")
print(casas.groupby("ocean_proximity")["median_house_value"].agg(["count", "median"]).sort_values("median"))
sin_tope = casas[v < 500_001]
print("r ingresos-valor con tope", round(casas["median_income"].corr(v), 3), "· sin el tope", round(sin_tope["median_income"].corr(sin_tope["median_house_value"]), 3))

fig, ax = plt.subplots(1, 3, figsize=(16, 4.5))
ax[0].hist(v, bins=50); ax[0].set_title("Valor mediano de la vivienda: el pico de la derecha es el tope"); ax[0].set_xlabel("dólares")
ax[1].scatter(casas["median_income"], v, s=2, alpha=0.2); ax[1].set_xlabel("ingresos medianos (decenas de miles de $)"); ax[1].set_ylabel("valor"); ax[1].set_title(f"r = {corr['median_income']:.2f}")
casas.boxplot(column="habitaciones_por_hogar", ax=ax[2]); ax[2].set_yscale("log"); ax[2].set_title("Habitaciones por hogar: outliers")
plt.tight_layout(); plt.show()
