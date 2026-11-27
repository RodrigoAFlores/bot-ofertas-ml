#!/usr/bin/env python3
"""Música nocturna estilo synthwave + efectos, generados con numpy, mezclados con la voz.
Uso: python3 motor/audio.py <carpeta>   (necesita tiempos.json de tiempos.py y config.json) → mezcla.wav
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

AQUI = Path(sys.argv[1]).resolve()
CFG = json.loads((AQUI / "config.json").read_text())
SR = 44100
T = json.loads((AQUI / "tiempos.json").read_text())
DUR, VOZ, ESC = T["dur"], T["voz"], T["escenas"]
N = int(DUR * SR)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def poner(buf, x, t, vol=1.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * vol


def lp(x, a):  # pasa bajos simple
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y


def env(n, at=0.01, rel=0.2):
    e = np.ones(n); a = int(at * SR); r = min(int(rel * SR), n)
    e[:a] = np.linspace(0, 1, a) if a else 1
    e[n - r:] *= np.linspace(1, 0, r)
    return e


def hz(nota):  # nota MIDI
    return 440 * 2 ** ((nota - 69) / 12)


# ---------- música ----------
mus = np.zeros(N)
BPM = 96; beat = 60 / BPM
# progresión menor nocturna: Am - F - C - G (2 compases cada una)
acordes = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
bajos = [45, 41, 48, 43]
compas = beat * 4
for k in range(int(DUR / (compas * 2)) + 1):
    t0 = k * compas * 2
    ac, bj = acordes[k % 4], bajos[k % 4]
    # pad: sierras desafinadas filtradas
    d = compas * 2
    tt = t_(d)
    pad = sum(np.sign(np.sin(2 * np.pi * hz(n) * tt * (1 + det))) * 0.5 + np.sin(2 * np.pi * hz(n) * tt * (1 - det))
              for n in ac for det in (0.003, -0.002))
    pad = np.convolve(pad, np.ones(60) / 60, mode="same") * env(len(tt), 0.6, 0.6) * 0.022
    poner(mus, pad, t0)
    # bajo en corcheas
    for c in range(16):
        tb = t0 + c * beat / 2
        tt = t_(beat / 2 * 0.9)
        b = np.sin(2 * np.pi * hz(bj - 12) * tt) + 0.3 * np.sign(np.sin(2 * np.pi * hz(bj - 12) * tt))
        poner(mus, b * env(len(tt), 0.005, 0.08) * 0.07, tb)
    # bombo + hi-hat suaves
    for c in range(8):
        tb = t0 + c * beat
        tt = t_(0.25)
        kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)
        poner(mus, kick * 0.16, tb)
        hh = rng.standard_normal(int(0.05 * SR)); hh = np.diff(hh, prepend=0) * np.exp(-t_(0.05) * 80)
        poner(mus, hh * 0.018, tb + beat / 2)
    # caja con reverb en 2 y 4
    for c in (1, 3, 5, 7):
        tt = t_(0.4)
        sn = rng.standard_normal(len(tt)) * np.exp(-tt * 9)
        poner(mus, lp(sn, 0.35) * 0.05, t0 + c * beat)

# fade de entrada/salida
fi = int(0.8 * SR); mus[:fi] *= np.linspace(0, 1, fi)
fo = int(1.5 * SR); mus[-fo:] *= np.linspace(1, 0, fo)

# ---------- efectos ----------
fx = np.zeros(N)


def whoosh(d=0.6, v=0.25):
    n = rng.standard_normal(int(d * SR))
    e = np.sin(np.linspace(0, np.pi, len(n))) ** 2
    return lp(n, 0.08) * e * v


def ding(f=1320, d=0.7, v=0.12):
    tt = t_(d)
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-tt * 6) * v


def fantasma(d=2.2, v=0.10):  # brillo etéreo
    tt = t_(d)
    s = sum(np.sin(2 * np.pi * f * tt + 3 * np.sin(2 * np.pi * 5 * tt)) for f in (660, 990, 1320))
    return s * np.sin(np.linspace(0, np.pi, len(tt))) * v / 3


def pop(v=0.2):
    tt = t_(0.12)
    return np.sin(2 * np.pi * (300 + 900 * tt / 0.12) * tt) * np.exp(-tt * 30) * v


def subida(d=1.2, v=0.12):  # arpegio que sube (sorpresa)
    out = np.zeros(int(d * SR))
    for k, n in enumerate([72, 76, 79, 84]):
        poner(out, ding(hz(n), 0.6, 1), k * 0.09)
    return out * v


SFX = {"ding": lambda: ding(1760, 1.2, 0.16), "fantasma": lambda: fantasma(3.0, 0.14), "pop": pop,
       "whoosh": lambda: whoosh(0.8, 0.35), "subida": subida}
for e in ESC[1:]:
    poner(fx, whoosh(), e - 0.3)        # transición entre escenas
for e in CFG.get("pasos", []):
    poner(fx, ding(), ESC[e] + 0.15)    # aparece cada paso
for tipo, e, s in CFG.get("efectos", []):
    poner(fx, SFX[tipo](), ESC[e] + 0.25 + s)

# ---------- voz + mezcla con ducking ----------
voz = np.zeros(N)
for i, t0 in enumerate(VOZ, 1):  # voz/v1.mp3 … vN.mp3
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(AQUI / f"voz/v{i}.mp3"),
                                   "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    poner(voz, np.frombuffer(raw, np.float32).astype(np.float64), t0)

nivel = np.convolve(np.abs(voz), np.ones(int(0.15 * SR)) / (0.15 * SR), mode="same")
duck = 1 - 0.55 * np.clip(nivel / 0.05, 0, 1)
mezcla = voz * 1.0 + mus * duck + fx * (0.6 + 0.4 * duck)
mezcla /= max(1e-9, np.abs(mezcla).max()) / 0.95

pcm = (mezcla * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                str(AQUI / "mezcla.wav")], input=pcm, check=True)
print("mezcla.wav", round(DUR, 2), "s")
