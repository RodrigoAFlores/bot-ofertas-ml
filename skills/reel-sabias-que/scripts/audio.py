#!/usr/bin/env python3
"""Música (marimba alegre; pizzicato de "sigilo" en las escenas indicadas) y efectos de sonido,
generados con numpy y sincronizados con <reel>/eventos.json (lo crea render.mjs <reel> info).

Uso: python3 audio.py <carpeta_del_reel>  → <reel>/musica.wav y <reel>/efectos.wav

Tipos de efecto disponibles para eventos(): pop, check, whoosh, rafaga, ding, flash, error, crack, golpe,
rodar, corte, swish, coro, brillo, toc, tic, corazones, timelapse, iris, huida, enojo, boing, boton, zumbido,
estatica, ping, impresora, clic, lapiz, dial, ovni, rugido.
Música: config.json -> "musica": "marimba" (por defecto), "misterio" o "synthwave".
"""
import json, sys, wave
from pathlib import Path
import numpy as np

REEL = Path(sys.argv[1])
CFG = json.loads((REEL / "config.json").read_text())
DUR = [a + b + c for a, b, c in zip(CFG["vo"], CFG["voz"], CFG["cola"])]
INI = [sum(DUR[:i]) for i in range(len(DUR))]
TOTAL = sum(DUR)
SIGILO = CFG.get("sigilo", [])
SR = 44100
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
# config.json -> "musica": "marimba" (alegre, por defecto) o "misterio" (sintetizador espacial oscuro)
MODO = CFG.get("musica", "marimba")
musica = np.zeros(N)
bpm = 108; negra = 60 / bpm; corchea = negra / 2
prog = [(60, [0, 4, 7]), (55, [0, 4, 7]), (57, [0, 3, 7]), (53, [0, 4, 7])]  # C G Am F
patron = [0, 2, 1, 2, 0, 2, 1, 2]
t, comp = 0.3, 0
while t < TOTAL:
    raiz, acorde = prog[comp % 4]
    sigilo = any(INI[e] - 0.2 <= t < (INI[e + 1] if e + 1 < len(INI) else TOTAL) - 0.3 for e in SIGILO)
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
if MODO == "misterio":
    musica[:] = 0
    tt = np.arange(N) / SR
    # dron grave que respira
    musica += (np.sin(2 * np.pi * 55 * tt) * 0.16 + np.sin(2 * np.pi * 82.41 * tt + 1) * 0.08) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * tt))
    # acordes oscuros de colchón (Am, F, Dm, Mi) con dientes de sierra desafinados y filtrados
    ciclo = [(57, [0, 3, 7]), (53, [0, 4, 7]), (50, [0, 3, 7]), (52, [0, 4, 7])]
    dur_acorde = 8 * negra
    t0, i = 0.0, 0
    while t0 < TOTAL:
        raiz, ac = ciclo[i % 4]
        n = int(dur_acorde * SR); k_ = np.arange(n) / SR
        env = np.minimum(1, k_ / 1.2) * np.minimum(1, (dur_acorde - k_) / 1.2)
        y = np.zeros(n)
        for st in ac:
            for det in (-0.12, 0.12):
                f = nota(raiz + st) * 2 ** (det / 12)
                y += 2 * ((f * k_) % 1) - 1
        poner(musica, pb(y, 0.02) * env * 0.05, t0)
        # campanita lejana
        poner(musica, np.sin(2 * np.pi * nota(raiz + 24 + ac[1]) * k(2.5)) * np.exp(-k(2.5) * 1.6) * 0.06, t0 + 1.5)
        t0 += dur_acorde; i += 1
if MODO == "synthwave":
    # synthwave de neón: batería electrónica, bajo en corcheas y acordes de sintetizador (Am F C G)
    musica[:] = 0
    prog_s = [(45, [0, 3, 7]), (41, [0, 4, 7]), (48, [0, 4, 7]), (43, [0, 4, 7])]
    t0, i = 0.3, 0
    while t0 < TOTAL:
        raiz, ac = prog_s[i % 4]
        for b in range(4):  # bombo en cada tiempo, caja en 2 y 4, platillo en corcheas
            tb = t0 + b * negra
            kk = k(0.35); poner(musica, np.sin(2 * np.pi * (50 + 90 * np.exp(-kk * 30)) * kk) * np.exp(-kk * 9) * 0.5, tb)
            if b % 2: kk = k(0.25); poner(musica, (ruido(0.25) * 0.6 + np.sin(2 * np.pi * 190 * kk) * 0.4) * np.exp(-kk * 14) * 0.22, tb)
            for h in range(2): kk = k(0.05); x = ruido(0.05); poner(musica, (x - pb(x, 0.6)) * np.exp(-kk * 80) * 0.08, tb + h * corchea)
        for e8 in range(8):  # bajo en corcheas (octava alternada)
            kk = k(corchea * 0.95); f = nota(raiz + (12 if e8 % 2 else 0))
            y = 2 * ((f * kk) % 1) - 1; poner(musica, pb(y, 0.08) * np.exp(-kk * 4) * 0.3, t0 + e8 * corchea)
        n = int(4 * negra * SR); kk = np.arange(n) / SR; y = np.zeros(n)  # acorde de colchón
        for st in ac:
            for det in (-0.1, 0.1):
                f = nota(raiz + 24 + st) * 2 ** (det / 12); y += 2 * ((f * kk) % 1) - 1
        env = np.minimum(1, kk / 0.3) * np.minimum(1, (4 * negra - kk) / 0.4)
        poner(musica, pb(y, 0.05) * env * 0.04, t0)
        t0 += 4 * negra; i += 1
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
    if tipo == "estatica":  # estática de radio/TV
        t = k(0.6); x = ruido(0.6); return (x - pb(x, 0.35)) * np.sin(np.pi * t / 0.6) * 0.35
    if tipo == "ping":  # sonar / radar
        t = k(1.6); y = np.sin(2 * np.pi * 1250 * t) * np.exp(-t * 3.5)
        eco = np.zeros_like(y); d = int(0.28 * SR); eco[d:] = y[:-d] * 0.35
        return (y + eco) * 0.16
    if tipo == "impresora":  # impresora de matriz de puntos, 3 s
        y = np.zeros(int(3.0 * SR))
        for i in range(int(3.0 * 14)):
            t = k(0.035); m = (ruido(0.035) - pb(ruido(0.035), 0.3)) * np.exp(-t * 90) * 0.3
            s0 = int(i / 14 * SR); y[s0 : s0 + len(m)] += m[: len(y) - s0]
        return y * np.minimum(1, np.linspace(3, 0, len(y)))
    if tipo == "clic":  # tecla de máquina de escribir
        t = k(0.12); return (ruido(0.12) * np.exp(-t * 120) * 0.5 + np.sin(2 * np.pi * 140 * t) * np.exp(-t * 40) * 0.4) * 0.6
    if tipo == "lapiz":  # lápiz que escribe rápido
        t = k(0.9); x = ruido(0.9); return (x - pb(x, 0.5)) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t)) ** 2 * np.sin(np.pi * t / 0.9) * 0.22
    if tipo == "dial":  # sintonizar una radio
        t = k(1.6); f = 300 + 700 * t / 1.6 + 60 * np.sin(2 * np.pi * 3 * t)
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.08 + (ruido(1.6) - pb(ruido(1.6), 0.4)) * 0.08
        return y * np.sin(np.pi * t / 1.6)
    if tipo == "ovni":  # zumbido oscilante tipo platillo volador
        t = k(2.2); f = 420 + 160 * np.sin(2 * np.pi * 5 * t) + 200 * t
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 2.2) * 0.16
    if tipo == "rugido":  # gruñido grave de criatura
        t = k(1.0); x = ruido(1.0); y = pb(x, 0.03) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)) + np.sin(2 * np.pi * (70 + 20 * np.sin(2 * np.pi * 3 * t)) * t) * 0.3
        return y * np.sin(np.pi * t / 1.0) * 0.45
    if tipo == "zumbido":  # abeja: diente de sierra con vibrato que pasa (sube y baja)
        t = k(0.9); f = 230 + 25 * np.sin(2 * np.pi * 7 * t)
        y = 2 * ((np.cumsum(f) / SR) % 1) - 1
        return pb(y, 0.2) * np.sin(np.pi * t / 0.9) ** 2 * (0.8 + 0.2 * np.sin(2 * np.pi * 31 * t)) * 0.16
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


for e in json.loads((REEL / "eventos.json").read_text()):
    poner(ef, sfx(e["tipo"]), e["t"])


def guardar(nombre, x):
    x = np.clip(x, -1, 1)
    with wave.open(nombre, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32000).astype("<i2").tobytes())


guardar(str(REEL / "musica.wav"), musica)
guardar(str(REEL / "efectos.wav"), ef)
print("audio listo")
