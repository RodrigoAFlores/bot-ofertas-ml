# Música chiptune y efectos 8-bit generados con código (numpy), sincronizados con eventos.json.
#   python3 audio.py  → musica.wav y efectos.wav
import json, wave
import numpy as np

SR = 44100
INI = [0, 4.7908, 15.4069, 36.9945, 47.9502]
TOTAL = 57.9512
N = int(TOTAL * SR) + SR


def nota(n):  # número MIDI → Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def pulso(f, dur, duty=0.25, vol=1.0):
    t = np.arange(int(dur * SR)) / SR
    y = np.where((t * f) % 1 < duty, 1.0, -1.0)
    env = np.minimum(1, t / 0.005) * np.exp(-t * 3.5)
    return y * env * vol


def triangulo(f, dur, vol=1.0):
    t = np.arange(int(dur * SR)) / SR
    y = 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
    env = np.minimum(1, t / 0.005) * np.minimum(1, (dur - t) / 0.02)
    return y * env * vol


def poner(buf, x, t):
    i = int(t * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i : i + len(x)] += x


# ---------- música: misterio (La menor) y, desde la revelación, más luminosa ----------
musica = np.zeros(N)
bpm = 104
negra = 60 / bpm
corcheas = negra / 2
misterio = [(57, [0, 3, 7, 12]), (53, [0, 4, 7, 12]), (50, [0, 3, 7, 12]), (52, [0, 4, 7, 11])]  # Am F Dm E
alegre = [(48, [0, 4, 7, 12]), (55, [0, 4, 7, 12]), (57, [0, 3, 7, 12]), (53, [0, 4, 7, 12])]  # C G Am F
t, compas = 0.0, 0
while t < TOTAL:
    prog = alegre if t >= INI[3] else misterio
    raiz, arp = prog[compas % 4]
    for k in range(8):  # 8 corcheas por compás
        n = raiz + 12 + arp[k % 4] + (12 if k >= 4 and t >= INI[3] else 0)
        poner(musica, pulso(nota(n), corcheas * 0.9, 0.125, 0.22), t + k * corcheas)
    for k in range(4):  # bajo en negras
        poner(musica, triangulo(nota(raiz - 12 + (7 if k == 2 else 0)), negra * 0.85, 0.5), t + k * negra)
    # golpecito de ruido (hi-hat) en cada tiempo
    for k in range(4):
        r = np.random.default_rng(k).uniform(-1, 1, int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 120) * 0.12
        poner(musica, r, t + k * negra + corcheas)
    t += 4 * negra
    compas += 1
# fundido al final
f = int(1.5 * SR)
fin = int(TOTAL * SR)
musica[fin - f : fin] *= np.linspace(1, 0, f)
musica[fin:] = 0

# ---------- efectos ----------
efectos = np.zeros(N)
rng = np.random.default_rng(3)


def graznido():
    d = 0.16
    t = np.arange(int(d * SR)) / SR
    f = 950 - 2600 * t
    fase = 2 * np.pi * np.cumsum(f) / SR
    y = np.sign(np.sin(fase)) * 0.5 + rng.uniform(-1, 1, len(t)) * 0.5
    y *= np.minimum(1, t / 0.004) * np.exp(-t * 14) * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 38 * t)))
    return y * 0.45


ultimo = -1
for e in json.load(open("eventos.json")):
    if e["tipo"] == "cra":
        if e["t"] - ultimo < 0.14:
            continue
        ultimo = e["t"]
        poner(efectos, graznido() * rng.uniform(0.6, 1.0), e["t"])
    elif e["tipo"] == "blip":
        poner(efectos, pulso(880, 0.09, 0.5, 0.35), e["t"])
    elif e["tipo"] == "acierto":
        for k, n in enumerate([72, 76, 79, 84]):
            poner(efectos, pulso(nota(n), 0.12, 0.5, 0.4), e["t"] + k * 0.07)
    elif e["tipo"] == "boton":
        poner(efectos, pulso(988, 0.07, 0.5, 0.4), e["t"])
        poner(efectos, pulso(1319, 0.25, 0.5, 0.4), e["t"] + 0.07)
    elif e["tipo"] == "corte":
        d = 0.18
        tt = np.arange(int(d * SR)) / SR
        poner(efectos, rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 25) * 0.15, e["t"] - 0.05)


def guardar(nombre, x):
    x = np.clip(x, -1, 1)
    with wave.open(nombre, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32000).astype("<i2").tobytes())


guardar("musica.wav", musica)
guardar("efectos.wav", efectos)
print("listo", len(json.load(open("eventos.json"))), "eventos")
