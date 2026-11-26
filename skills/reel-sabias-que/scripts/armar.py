#!/usr/bin/env python3
"""Une todo: cuadros (60 fps) + voz por escena + música (baja sola cuando habla la voz) + efectos.

Uso: python3 armar.py <carpeta_del_reel>  → <reel>/<nombre>.mp4  (nombre sale de config.json)
Requiere haber corrido antes: render.mjs <reel> info  y  render.mjs <reel> todo.
"""
import json, re, subprocess, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
REEL = Path(sys.argv[1]).resolve()
CFG = json.loads((REEL / "config.json").read_text())
DUR = [a + b + c for a, b, c in zip(CFG["vo"], CFG["voz"], CFG["cola"])]
INI = [sum(DUR[:i]) for i in range(len(DUR))]
clips = sorted((REEL / "voz").glob("v*.mp3"), key=lambda p: int(re.sub(r"\D", "", p.stem)))
ff = ["ffmpeg", "-v", "error", "-y"]

subprocess.run([sys.executable, str(AQUI / "audio.py"), str(REEL)], check=True)

# voz: cada clip empieza en INI[escena] + VO[escena]
entradas, filtros = [], []
for i, c in enumerate(clips):
    entradas += ["-i", str(c)]
    filtros.append(f"[{i}]adelay={round((INI[i] + CFG['vo'][i]) * 1000)}:all=1[v{i}]")
mezcla_voz = ";".join(filtros) + ";" + "".join(f"[v{i}]" for i in range(len(clips))) + f"amix=inputs={len(clips)}:normalize=0,aresample=44100,pan=mono|c0=c0[v]"
subprocess.run(ff + entradas + ["-filter_complex", mezcla_voz, "-map", "[v]", str(REEL / "voz.wav")], check=True)

subprocess.run(ff + ["-i", str(REEL / "voz.wav"), "-i", str(REEL / "musica.wav"), "-i", str(REEL / "efectos.wav"), "-filter_complex",
    "[0]asplit[v1][v2];[1]volume=0.35[m];[m][v2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[md];"
    "[2]volume=0.9[fx];[v1][md][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]",
    "-map", "[a]", "-c:a", "pcm_s16le", str(REEL / "mezcla.wav")], check=True)

salida = REEL / f"{CFG.get('nombre', REEL.name)}.mp4"
subprocess.run(ff + ["-framerate", "60", "-i", str(REEL / "cuadros/%05d.png"), "-i", str(REEL / "mezcla.wav"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "60",
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(salida)], check=True)
for f in ("voz.wav", "musica.wav", "efectos.wav", "mezcla.wav"):
    (REEL / f).unlink(missing_ok=True)
print("Listo:", salida)
