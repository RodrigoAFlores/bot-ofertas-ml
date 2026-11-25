# Sonido de la demo: viento, aleteos sincronizados con el vuelo, aterrizaje, golpes de título,
# graznidos lejanos de la bandada y un acorde de fondo. Todo generado con numpy.
import wave
import numpy as np

SR = 44100
DUR = 5.0
N = int(DUR * SR)
rng = np.random.default_rng(1)
T = dict(aterriza=1.12, bandada=2.1, txt1=0.35, txt2=3.15)


def ruido(n):
    return rng.uniform(-1, 1, n)


def pasa_bajos(x, a):  # filtro de un polo
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y


def poner(buf, x, t):
    i = int(t * SR)
    if 0 <= i < len(buf):
        x = x[: len(buf) - i]; buf[i : i + len(x)] += x


out = np.zeros(N)
tt = np.arange(N) / SR

# viento suave que sube y baja
viento = pasa_bajos(ruido(N), 0.02) * (0.5 + 0.3 * np.sin(tt * 1.3))
out += viento * 0.35

# acorde de fondo (La menor, sinusoides con trémolo leve) que entra despacio
for f, v in [(110, 0.05), (164.8, 0.035), (220, 0.03), (261.6, 0.025), (329.6, 0.018)]:
    out += np.sin(2 * np.pi * f * tt) * v * np.minimum(1, tt / 1.2) * (1 + 0.15 * np.sin(tt * 3 + f))

# aleteos: un "fwump" en cada bajada del ala (misma frecuencia que la animación)
t, fase = 0.0, 0.0
while t < T["aterriza"]:
    p = 1 - (1 - t / T["aterriza"]) ** 3
    frec = 4.2 + (2.2 - 4.2) * p
    fase_n = fase + frec / 1000
    if int(fase_n - 0.25) > int(fase - 0.25):  # cruce de la bajada
        n = int(0.12 * SR); e = np.exp(-np.arange(n) / SR * 30)
        poner(out, pasa_bajos(ruido(n), 0.08) * e * 1.6, t)
    fase = fase_n; t += 0.001

# aterrizaje: golpe sordo + roce de plumas al plegar
n = int(0.25 * SR)
poner(out, np.sin(2 * np.pi * 70 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 18) * 0.5, T["aterriza"])
n = int(0.5 * SR)
poner(out, (ruido(n) - pasa_bajos(ruido(n), 0.3)) * np.exp(-np.arange(n) / SR * 7) * 0.12, T["aterriza"] + 0.05)

# títulos: "pop" por palabra y un golpe grave en OLVIDAN
for t0, letras in [(T["txt1"], 5), (T["txt2"], 7)]:
    for i in range(letras):
        n = int(0.05 * SR); k = np.arange(n) / SR
        poner(out, np.sin(2 * np.pi * (900 - 6000 * k) * k) * np.exp(-k * 60) * 0.12, t0 + i * 0.045)
n = int(0.9 * SR); k = np.arange(n) / SR
poner(out, np.sin(2 * np.pi * (55 + 30 * np.exp(-k * 8)) * k) * np.exp(-k * 4) * 0.6, T["txt2"])

# graznidos lejanos de la bandada
for i, t0 in enumerate([2.25, 2.6, 3.0, 3.5]):
    n = int(0.2 * SR); k = np.arange(n) / SR
    f = 700 - 900 * k
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + ruido(n) * 0.5
    poner(out, pasa_bajos(y, 0.25) * np.exp(-k * 10) * 0.09, t0)

# fundido final
f = int(0.3 * SR); out[-f:] *= np.linspace(1, 0, f)
out = np.clip(out, -1, 1)
with wave.open("ambiente.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32000).astype("<i2").tobytes())
print("ambiente.wav listo")
