"""Nivel 1 · Matemáticas para IA: todos los ejemplos, ejercicios y el proyecto de la lección, para ejecutarlos y cambiar los números."""
import numpy as np

# --- 1. Vectores: listas de números que describen algo ---
vivienda = np.array([90, 3, 2])          # m², habitaciones, km al centro
u, v = np.array([3, 1]), np.array([1, 2])
print("u + v =", u + v, "· 2·u =", 2 * u, "· u·v =", u @ v)
# El producto escalar mide parecido: gustos (acción, romance) de tres personas
ana, luis, marta = np.array([5, 1]), np.array([4, 2]), np.array([1, 5])
print("ana·luis =", ana @ luis, "· ana·marta =", ana @ marta)
print("longitud de (3, 4) =", np.linalg.norm([3, 4]))

# --- 2. Matrices: tablas que transforman vectores ---
cesta = np.array([2, 3])                 # 2 manzanas, 3 panes
precios = np.array([[0.5, 1.0],          # tienda A: manzana, pan
                    [0.4, 1.2]])         # tienda B
print("coste en cada tienda =", precios @ cesta)
A, x = np.array([[1, 2], [0, 1]]), np.array([3, 1])
print("A·x =", A @ x)
print("forma (2×3)·(3×4) →", (np.ones((2, 3)) @ np.ones((3, 4))).shape)

# --- 3. Derivadas: la pendiente ---
f = lambda x: x**2
for h in (0.1, 0.01, 0.001):
    print(f"h = {h}: (f(3+h) − f(3)) / h = {(f(3 + h) - f(3)) / h:.4f}")   # se acerca a 6
print("f(x) = x² → f'(x) = 2x → f'(3) =", 2 * 3)

# --- 4. Regla de la cadena ---
y = lambda x: (2 * x + 1)**2
print("dy/dx en x = 1: fórmula =", 2 * (2 * 1 + 1) * 2, "· numérica =", round((y(1.001) - y(1)) / 0.001, 3))

# --- 5. Gradiente ---
g = lambda x, y: x**2 + y**2
e = 1e-6
print("∇g(1, 2) ≈", (round((g(1 + e, 2) - g(1, 2)) / e, 3), round((g(1, 2 + e) - g(1, 2)) / e, 3)), "· fórmula (2x, 2y) = (2, 4)")
k = lambda x, y: x**2 + 3 * x * y
print("∇k(1, 2) ≈", (round((k(1 + e, 2) - k(1, 2)) / e, 3), round((k(1, 2 + e) - k(1, 2)) / e, 3)), "· fórmula (2x + 3y, 3x) = (8, 3)")

# --- 6. Descenso de gradiente paso a paso ---
L  = lambda w: (w - 3)**2
dL = lambda w: 2 * (w - 3)
w, eta = 0.0, 0.1
for paso in range(6):
    print(f"paso {paso}: w = {w:.4f} · pérdida = {L(w):.4f} · pendiente = {dL(w):.4f}")
    w = w - eta * dL(w)
for eta in (0.01, 0.1, 1.1):
    w = 0.0
    for _ in range(20): w = w - eta * dL(w)
    print(f"η = {eta}: tras 20 pasos w = {w:.4f}")

# --- 7. Probabilidad ---
dado = np.arange(1, 7); print("media de un dado =", dado.mean())
rng = np.random.default_rng(0); print("media de 10 000 tiradas simuladas =", rng.integers(1, 7, 10_000).mean().round(3))
personas, enfermos = 1000, 10
pos_enf, pos_sanos = 0.99 * enfermos, 0.05 * (personas - enfermos)
print(f"positivos enfermos {pos_enf} · positivos sanos {pos_sanos} · P(enfermo | positivo) = {pos_enf / (pos_enf + pos_sanos):.3f}")
z = np.array([2.0, 1.0, 0.1]); p = np.exp(z) / np.exp(z).sum(); print("softmax([2, 1, 0.1]) =", p.round(3), "· suma =", p.sum())

# --- Proyecto: descenso de gradiente con dos parámetros ---
import matplotlib.pyplot as plt
F    = lambda x, y: (x - 3)**2 + 2 * (y + 1)**2
grad = lambda x, y: np.array([2 * (x - 3), 4 * (y + 1)])
def descenso(eta, x=0.0, y=0.0, max_pasos=200):
    tray = [(x, y)]
    for _ in range(max_pasos):
        gx, gy = grad(x, y)
        if np.hypot(gx, gy) < 1e-3: break   # ya casi no hay pendiente: hemos llegado
        x, y = x - eta * gx, y - eta * gy
        tray.append((x, y))
        if abs(x) + abs(y) > 1e6: break
    return np.array(tray)
for eta in (0.1, 0.4, 0.55):
    t = descenso(eta); print(f"η = {eta}: {len(t) - 1} pasos · final {t[-1].round(4)}")
xs, ys = np.meshgrid(np.linspace(-1, 5, 200), np.linspace(-4, 2, 200))
plt.contour(xs, ys, F(xs, ys), levels=15)
for eta in (0.1, 0.4):
    t = descenso(eta); plt.plot(t[:, 0], t[:, 1], "o-", ms=3, label=f"η = {eta} · {len(t) - 1} pasos")
plt.legend(); plt.gca().set_aspect("equal"); plt.show()
