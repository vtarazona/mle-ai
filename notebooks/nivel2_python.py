"""Nivel 2 · Python para IA: todos los ejemplos, ejercicios y el proyecto de la lección (análisis exploratorio del dataset Wine Quality)."""
# --- 1. Variables y tipos ---
precio = 12.5          # float: número con decimales
unidades = 3           # int: número entero
producto = "vino"      # str: texto
en_oferta = True       # bool: verdadero o falso
total = precio * unidades
print(f"{unidades} × {producto} = {total} €")          # 3 × vino = 37.5 €
print(type(precio), type(unidades), type(producto), type(en_oferta))
print(7 / 2, 7 // 2, 7 % 2, 2 ** 3)                   # 3.5 3 1 8

# --- 2. Listas y diccionarios ---
notas = [7, 5, 9, 6]
print(len(notas), sum(notas), notas[0], notas[-1], notas[1:3])   # 4 27 7 6 [5, 9]
notas.append(8); print(notas, "media =", sum(notas) / len(notas))  # media = 7.0
vino = {"alcohol": 9.4, "acidez": 0.70, "calidad": 5}
print(vino["alcohol"], list(vino.keys()))
vino["calidad"] = 6; print(vino)

# --- 3. Condiciones y bucles ---
def etiqueta(calidad):
    if calidad >= 7:
        return "bueno"
    elif calidad >= 5:
        return "normal"
    else:
        return "malo"
for c in [4, 5, 7]:
    print(c, "→", etiqueta(c))
cuadrados = [n ** 2 for n in range(5)]; print(cuadrados)          # [0, 1, 4, 9, 16]
aprobadas = [n for n in notas if n >= 6]; print(aprobadas)        # [7, 9, 6, 8]

# --- 4. Funciones ---
def media(valores):
    return sum(valores) / len(valores)
def precio_final(precio, descuento=0.0):
    return precio * (1 - descuento)
print(media([7, 5, 9, 6, 8]), precio_final(20), precio_final(20, 0.25))   # 7.0 20.0 15.0

# --- 5. NumPy: operaciones con arrays enteros ---
import numpy as np
x = np.array([1.0, 2.0, 3.0, 4.0])
print(x * 2, x + 10, x ** 2, x.mean(), x.sum(), x.max())
print("máscara x > 2:", x > 2, "→", x[x > 2])
u, v = np.array([3, 1]), np.array([1, 2]); print("u @ v =", u @ v)      # 5, como en el nivel 1
import timeit
n = 1_000_000
datos = list(range(n)); arr = np.arange(n, dtype=np.float64)
def suma_cuadrados_bucle():
    total = 0
    for d in datos:
        total += d * d
    return total
t_bucle = min(timeit.repeat(suma_cuadrados_bucle, number=1, repeat=5))
t_numpy = min(timeit.repeat(lambda: (arr * arr).sum(), number=1, repeat=5))
print(f"suma de cuadrados de un millón de números · bucle {t_bucle * 1000:.0f} ms · NumPy {t_numpy * 1000:.1f} ms · {t_bucle / t_numpy:.0f}× más rápido")

# --- 6. Pandas: tablas ---
import pandas as pd, io
csv = """tienda,mes,ventas
Centro,ene,120
Centro,feb,
Playa,ene,80
Playa,feb,95
Puerto,ene,
Puerto,feb,60
"""
df = pd.read_csv(io.StringIO(csv))
print(df.shape); print(df.isna().sum())                 # 2 valores nulos en ventas
print("media sin nulos:", df["ventas"].mean())          # 88.75
limpio = df.dropna(); print("filas tras dropna:", len(limpio))            # 4
relleno = df.fillna({"ventas": df["ventas"].median()}); print(relleno)    # mediana = 87.5
print(relleno.groupby("tienda")["ventas"].sum())       # Centro 207.5 · Playa 175 · Puerto 147.5
print(relleno[relleno["ventas"] > 90])

# --- Proyecto: análisis exploratorio de Wine Quality (vino tinto) ---
import matplotlib.pyplot as plt
URL = "https://raw.githubusercontent.com/vtarazona/mle-ai/main/notebooks/data/winequality-red.csv"
try:
    vinos = pd.read_csv("data/winequality-red.csv", sep=";")      # copia local del repositorio
except FileNotFoundError:
    vinos = pd.read_csv(URL, sep=";")                             # en Colab se descarga de GitHub
print(vinos.shape)                                                # (1599, 12)
print(vinos.head())
print("nulos en total:", vinos.isna().sum().sum())               # 0
print("duplicados:", vinos.duplicated().sum())                   # 240
print(vinos[["alcohol", "pH", "quality"]].describe().round(2))
print(vinos["quality"].value_counts().sort_index())              # 3:10 4:53 5:681 6:638 7:199 8:18
print(vinos.groupby("quality")["alcohol"].mean().round(2))       # 3→9.96 … 8→12.09
corr = vinos.corr()["quality"].drop("quality").sort_values()
print(corr.round(3))                                             # alcohol +0.476 · volatile acidity −0.391
vinos["bueno"] = vinos["quality"] >= 7
print("vinos buenos (calidad ≥ 7):", vinos["bueno"].sum(), f"({vinos['bueno'].mean():.1%})")
print(vinos.groupby("bueno")[["alcohol", "volatile acidity"]].mean().round(3))

fig, ax = plt.subplots(1, 3, figsize=(15, 4))
vinos["quality"].value_counts().sort_index().plot.bar(ax=ax[0], title="¿Cuántos vinos hay de cada calidad?")
vinos.boxplot(column="alcohol", by="quality", ax=ax[1]); ax[1].set_title("Alcohol según la calidad")
ax[2].scatter(vinos["alcohol"], vinos["volatile acidity"], c=vinos["quality"], s=8, cmap="viridis")
ax[2].set_xlabel("alcohol (%)"); ax[2].set_ylabel("acidez volátil (g/L)"); ax[2].set_title("Color = calidad")
plt.tight_layout(); plt.show()
