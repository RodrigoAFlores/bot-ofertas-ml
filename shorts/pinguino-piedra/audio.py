# Música y efectos del reel del pingüino, generados con numpy y sincronizados con eventos.json.
#   python3 audio.py → musica.wav, efectos.wav
import json, wave
import numpy as np

SR = 44100
INI = [0, 5.704, 12.538, 25.38, 36.914, 43.898]
TOTAL = 52.37
N = int((TOTAL + 1) * SR)
rng = np.random.default_rng(7)


def k(d):
    return np.arange(int(d * SR)) / SR


def poner(buf, x, t, vol=1.0):
    i = int(t * SR)
    if i < 0 or i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i : i + len(x)] += x * vol


def pb(x, a):  # pasa bajos de un polo (vectorizado aproximado con lfilter casero)
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def nota(n):
    return 440 * 2 ** ((n - 69) / 12)


def marimba(f, d=0.5, v=0.3):
    t = k(d)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    return y * np.exp(-t * 7) * np.minimum(1, t / 0.003) * v


def pizz(f, d=0.25, v=0.3):
    t = k(d)
    y = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 + np.sin(2 * np.pi * f * t)
    return pb(y, 0.15) * np.exp(-t * 16) * v


def ruido(d):
    return rng.uniform(-1, 1, int(d * SR))


# ---------------- música ----------------
musica = np.zeros(N)
bpm = 108; negra = 60 / bpm; corchea = negra / 2
prog = [(60, [0, 4, 7]), (55, [0, 4, 7]), (57, [0, 3, 7]), (53, [0, 4, 7])]  # C G Am F
patron = [0, 2, 1, 2, 0, 2, 1, 2]
t, comp = 0.3, 0
while t < TOTAL:
    raiz, acorde = prog[comp % 4]
    sigilo = INI[4] - 0.2 <= t < INI[5] - 0.3
    if sigilo:
        # línea de puntillas: pizzicato en Do menor, entrecortada
        linea = [48, 0, 51, 0, 55, 0, 54, 53]
        for i, n in enumerate(linea):
            if n:
                poner(musica, pizz(nota(n)), t + i * corchea, 0.9)
    else:
        for i, idx in enumerate(patron):
            n = raiz + 12 + acorde[idx] + (12 if i in (3, 7) else 0)
            poner(musica, marimba(nota(n), 0.4, 0.22), t + i * corchea)
        poner(musica, marimba(nota(raiz - 12), 0.9, 0.35), t)
        poner(musica, marimba(nota(raiz - 12 + 7), 0.9, 0.25), t + 2 * negra)
    t += 4 * negra; comp += 1
# entrada suave y fundido final
musica[: int(0.6 * SR)] *= np.linspace(0, 1, int(0.6 * SR))
f0, f1 = int((TOTAL - 1.2) * SR), int(TOTAL * SR)
musica[f0:f1] *= np.linspace(1, 0, f1 - f0); musica[f1:] = 0

# ---------------- efectos ----------------
ef = np.zeros(N)


def whoosh(d=0.45, v=0.35):
    t = k(d); env = np.sin(np.pi * t / d) ** 2
    return pb(ruido(d), 0.12) * env * v * 2.5


def sfx(tipo):
    if tipo == "pop":
        t = k(0.06); return np.sin(2 * np.pi * (700 + 2500 * t) * t) * np.exp(-t * 70) * 0.10
    if tipo == "check":
        return np.concatenate([marimba(nota(84), 0.08, 0.35), marimba(nota(91), 0.3, 0.35)])
    if tipo == "whoosh":
        return whoosh()
    if tipo == "rafaga":
        return whoosh(0.8, 0.5)
    if tipo == "ding":
        t = k(1.2); return (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 2349 * t)) * np.exp(-t * 4) * 0.35
    if tipo == "flash":
        t = k(0.3); return pb(ruido(0.3), 0.5) * np.exp(-t * 18) * 0.25
    if tipo == "error":
        t = k(0.22); return np.sign(np.sin(2 * np.pi * 180 * t)) * np.exp(-t * 9) * 0.18
    if tipo == "crack":
        t = k(0.25); return ruido(0.25) * np.exp(-t * 30) * 0.5
    if tipo == "golpe":
        t = k(0.5); return np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 20)) * t) * np.exp(-t * 7) * 0.7
    if tipo == "rodar":
        t = k(0.9); return pb(ruido(0.9), 0.03) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) * np.minimum(1, t * 3) * 2.2
    if tipo == "corte":
        return whoosh(0.18, 0.3)
    if tipo == "swish":
        t = k(0.3); return pb(ruido(0.3), 0.3) * np.sin(np.pi * t / 0.3) * 0.35
    if tipo == "coro":  # "aaah" con armónicos que crece
        t = k(1.8); y = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(523, 1), (659, 0.8), (784, 0.7), (1046, 0.4)])
        y *= (1 + 0.08 * np.sin(2 * np.pi * 5.5 * t)); return y * np.sin(np.pi * t / 1.8) * 0.09
    if tipo == "brillo":
        y = np.zeros(int(0.8 * SR))
        for i, n in enumerate([84, 88, 91, 96, 100]):
            m = marimba(nota(n), 0.4, 0.2); s = int(i * 0.06 * SR); y[s : s + len(m)] += m[: len(y) - s]
        return y
    if tipo == "toc":
        t = k(0.15); return np.sin(2 * np.pi * 300 * t) * np.exp(-t * 40) * 0.5
    if tipo == "tic":
        t = k(0.08); return np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 60) * 0.25
    if tipo == "corazones":
        y = np.zeros(int(1.2 * SR))
        for i in range(8):
            m = marimba(nota(76 + [0, 4, 7, 12, 7, 12, 16, 19][i]), 0.3, 0.16); s = int(i * 0.07 * SR); y[s : s + len(m)] += m[: len(y) - s]
        return y
    if tipo == "timelapse":  # tic-tac rápido durante el nido
        y = np.zeros(int(1.8 * SR))
        for i in range(18):
            t = k(0.04); m = np.sin(2 * np.pi * (1500 if i % 2 else 1100) * t) * np.exp(-t * 90) * 0.18
            s = int(i * 0.1 * SR); y[s : s + len(m)] += m
        return y
    if tipo == "iris":
        t = k(0.5); return np.sin(2 * np.pi * (900 - 1400 * t) * t) * np.exp(-t * 3) * 0.08
    if tipo == "sigilo":
        return np.zeros(1)
    if tipo == "huida":  # pasitos rápidos + silbido
        y = np.zeros(int(1.0 * SR))
        for i in range(12):
            t = k(0.03); m = pb(ruido(0.03), 0.4) * np.exp(-t * 80) * 0.5; s = int(i * 0.07 * SR); y[s : s + len(m)] += m
        t = k(1.0); y += np.sin(2 * np.pi * (1200 + 600 * t) * t) * np.exp(-t * 3) * 0.05
        return y
    if tipo == "enojo":
        t = k(0.35); return np.sign(np.sin(2 * np.pi * (220 - 80 * t) * t)) * np.exp(-t * 6) * 0.12
    if tipo == "boing":
        t = k(0.5); return np.sin(2 * np.pi * (300 + 200 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 5)) * t) * np.exp(-t * 5) * 0.25
    if tipo == "boton":
        return np.concatenate([marimba(nota(88), 0.08, 0.4), marimba(nota(93), 0.5, 0.4)])
    return np.zeros(1)


for e in json.load(open("eventos.json")):
    poner(ef, sfx(e["tipo"]), e["t"])


def guardar(nombre, x):
    x = np.clip(x, -1, 1)
    with wave.open(nombre, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32000).astype("<i2").tobytes())


guardar("musica.wav", musica)
guardar("efectos.wav", ef)
print("audio listo")
