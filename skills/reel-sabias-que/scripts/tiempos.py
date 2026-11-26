#!/usr/bin/env python3
"""Mide la voz de un reel y deja config.json listo.

Uso: python3 tiempos.py <carpeta_del_reel>
  - Lee voz/v1.mp3, v2.mp3, … (un clip por escena).
  - Escribe/actualiza config.json con "voz" (duraciones) y, si faltan, "vo" y "cola" por defecto.
  - Imprime los tramos con voz de cada clip (segundos desde que empieza ese clip): son los momentos
    donde caen las frases, para sincronizar efectos en escenas.js.
"""
import json, re, subprocess, sys
from pathlib import Path

reel = Path(sys.argv[1])
clips = sorted((reel / "voz").glob("v*.mp3"), key=lambda p: int(re.sub(r"\D", "", p.stem)))
if not clips:
    sys.exit("No hay clips en voz/ (v1.mp3, v2.mp3, …)")


def duracion(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())


def tramos(p, dur):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", "silencedetect=n=-30dB:d=0.07", "-f", "null", "-"], capture_output=True, text=True).stderr
    marcas = [float(x) for x in re.findall(r"silence_(?:start|end): ([0-9.]+)", out)]
    # convierte silencios en tramos de voz
    cortes, voz, ini = list(zip(marcas[0::2], marcas[1::2])), [], 0.0
    for a, b in cortes:
        if a - ini > 0.05:
            voz.append((round(ini, 2), round(a, 2)))
        ini = b
    if dur - ini > 0.05:
        voz.append((round(ini, 2), round(dur, 2)))
    return voz


cfg_path = reel / "config.json"
cfg = json.loads(cfg_path.read_text()) if cfg_path.exists() else {}
cfg.setdefault("nombre", reel.name)
cfg["voz"] = [round(duracion(p), 3) for p in clips]
n = len(clips)
if len(cfg.get("vo", [])) != n:
    cfg["vo"] = [0.5] + [0.35] * (n - 1)
if len(cfg.get("cola", [])) != n:
    cfg["cola"] = [0.45] * (n - 1) + [1.2]
cfg.setdefault("sigilo", [])
cfg_path.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n")

print(f"config.json listo ({n} escenas, total ≈ {sum(cfg['vo']) + sum(cfg['voz']) + sum(cfg['cola']):.1f} s)\n")
for i, p in enumerate(clips):
    print(f"Escena {i + 1} ({p.name}, {cfg['voz'][i]:.2f} s): frases en " + "  ".join(f"{a:.2f}–{b:.2f}" for a, b in tramos(p, cfg["voz"][i])))
