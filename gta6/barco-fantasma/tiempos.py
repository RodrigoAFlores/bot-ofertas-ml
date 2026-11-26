#!/usr/bin/env python3
"""Sincroniza la animación con la voz.

Lee la duración de cada frase en voz/v1..v9.mp3, calcula cuándo empieza cada escena en el video final
y escribe tiempos.js con:
  - WARP: pares [tiempo_final, tiempo_animación] (la animación se estira/encoge por tramos)
  - DUR:  duración total
  - VOZ:  cuándo arranca cada frase (lo usa audio.py)
"""
import json, subprocess
from pathlib import Path

AQUI = Path(__file__).parent
ANTES, DESPUES, COLA = 0.25, 0.35, 1.3   # aire antes/después de cada frase, y al final

# límites de cada escena en la animación original (segundos de mapa-real.html)
ESCENAS = [0, 3.0, 7.2, 10.3, 13.2, 16.2, 17.6, 22.4, 26.0, 28.0]

# anclas internas: (escena, tiempo_animación, segundo dentro de la frase)
ANCLAS = [
    (3, 11.0, 3.25),   # "y mira a los dos fantasmas"
    (3, 12.4, 5.0),    # "...discutir" → el empujón
    (6, 19.4, 4.26),   # "Cuando el motor se apague"
    (6, 20.0, 6.8),    # "y saca el Cuchillo Maldito"
    (7, 23.4, 5.5),    # "ahí está el barco fantasma"
]


def dur(f):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]))


voces = [dur(AQUI / f"voz/v{i}.mp3") for i in range(1, 10)]
ini, t = [], 0.0
for i, d in enumerate(voces):
    ini.append(t)
    t += ANTES + d + (COLA if i == len(voces) - 1 else DESPUES)
total = round(t, 2)

warp = [[ini[i], ESCENAS[i]] for i in range(9)]
warp += [[ini[e] + ANTES + s, a] for e, a, s in ANCLAS]
warp.append([total, ESCENAS[-1]])
warp.sort()

voz = [round(ini[i] + ANTES, 3) for i in range(9)]
(AQUI / "tiempos.js").write_text(
    f"window.WARP = {json.dumps([[round(a, 3), b] for a, b in warp])};\n"
    f"window.DUR = {total};\nwindow.VOZ = {json.dumps(voz)};\n")
(AQUI / "tiempos.json").write_text(json.dumps({"dur": total, "voz": voz, "escenas": [round(x, 3) for x in ini]}, indent=1))
for i, (s, d) in enumerate(zip(ini, voces), 1):
    print(f"escena {i}: empieza {s:6.2f}s  voz {d:.2f}s")
print("total", total, "s")
