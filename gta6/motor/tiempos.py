#!/usr/bin/env python3
"""Sincroniza la animación con la voz.  Uso: python3 motor/tiempos.py <carpeta>

Lee config.json y la duración de cada frase en voz/v1..vN.mp3, calcula cuándo empieza cada escena en el video final
y escribe tiempos.js con:
  - WARP: pares [tiempo_final, tiempo_animación] (la animación se estira/encoge por tramos)
  - DUR:  duración total
  - VOZ:  cuándo arranca cada frase (lo usa audio.py)
"""
import json, subprocess
from pathlib import Path

import sys
AQUI = Path(sys.argv[1]).resolve()
CFG = json.loads((AQUI / "config.json").read_text())
ANTES, DESPUES, COLA = 0.25, 0.35, 1.3   # aire antes/después de cada frase, y al final

ESCENAS = CFG["escenas"]                 # límites de cada escena en la animación (n_voces + 1 valores)
ANCLAS = [tuple(x) for x in CFG.get("anclas", [])]   # (escena, tiempo_animación, segundo dentro de la frase)
NV = len(ESCENAS) - 1


def dur(f):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]))


voces = [dur(AQUI / f"voz/v{i}.mp3") for i in range(1, NV + 1)]
ini, t = [], 0.0
for i, d in enumerate(voces):
    ini.append(t)
    t += ANTES + d + (COLA if i == len(voces) - 1 else DESPUES)
total = round(t, 2)

warp = [[ini[i], ESCENAS[i]] for i in range(NV)]
warp += [[ini[e] + ANTES + s, a] for e, a, s in ANCLAS]
warp.append([total, ESCENAS[-1]])
warp.sort()

voz = [round(ini[i] + ANTES, 3) for i in range(NV)]
(AQUI / "tiempos.js").write_text(
    f"window.WARP = {json.dumps([[round(a, 3), b] for a, b in warp])};\n"
    f"window.DUR = {total};\nwindow.VOZ = {json.dumps(voz)};\n")
(AQUI / "tiempos.json").write_text(json.dumps({"dur": total, "voz": voz, "escenas": [round(x, 3) for x in ini]}, indent=1))
for i, (s, d) in enumerate(zip(ini, voces), 1):
    print(f"escena {i}: empieza {s:6.2f}s  voz {d:.2f}s")
print("total", total, "s")
