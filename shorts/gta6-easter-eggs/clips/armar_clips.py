#!/usr/bin/env python3
"""Pone la narración y la letra (subtítulos palabra por palabra) a los clips de video del reel de GTA 6.

Uso: python3 armar_clips.py <carpeta_con_los_clips>
Salida: clip_1.mp4 … clip_5.mp4 (cada clip con su parte de la voz) y gta6_easter_eggs_clips.mp4 (los 5 unidos).

Por cada clip: ajusta la velocidad del video para que dure lo mismo que su parte de la narración,
mezcla la voz con el sonido original del clip (bajito) y quema la letra estilo reel:
bloques de hasta 4 palabras en mayúsculas, con la palabra que se está diciendo en amarillo.
"""
import json, subprocess, sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
VOZ = AQUI.parent / "voz"
SUBIDOS = Path(sys.argv[1])
T = json.loads((AQUI / "transcripcion.json").read_text())

# (archivo subido, clip de voz, recorte de voz [desde, hasta], recorte del video desde, pausa antes de la voz, aire al final)
CLIPS = [
    ("e0fbc9f2-410707620_1795720802579876.mp4", "v1", (0, 7.9), 0.0, 0.15, 0.3),   # lupa en la ciudad de neón (gancho)
    ("c253c530-1016929623_1795720834383642.mp4", "v2", (0, 11.0), 0.0, 0.1, 0.3),  # mapa de Leonida con pines
    ("ce1d8482-103706268_1795720827221841.mp4", "v3", (0, 13.2), 0.0, 0.1, 0.35),  # torre con el nido y ventana de Dexter
    ("4c18124a-125895195_1795720821970604.mp4", "v5", (0, 6.4), 0.0, 0.2, 0.0),    # auto y OVNI
    ("b2d7bdfe-979058107_1795720842634955.mp4", "v6", (0, 10.45), 0.0, 0.1, 0.4),  # mapa con "?" y comentarios (cierre)
]
FPS = 30


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).decode())


def ts(s):
    s = max(0, s); h = int(s // 3600); m = int(s % 3600 // 60); return f"{h}:{m:02d}:{s % 60:05.2f}"


def ass(palabras, desplaz, fin_video):
    """Subtítulos ASS: bloques de hasta 4 palabras; la palabra actual en amarillo."""
    bloques, actual = [], []
    for w in palabras:
        actual.append(w)
        if len(actual) == 4 or w[0][-1] in ".,?:…!»":
            bloques.append(actual); actual = []
    if actual: bloques.append(actual)
    lineas = []
    for bi, b in enumerate(bloques):
        fin_bloque = bloques[bi + 1][0][1] if bi + 1 < len(bloques) else min(b[-1][2] + 0.6, fin_video - desplaz)
        for wi, (txt, ini, fin) in enumerate(b):
            t0 = ini if wi else ini
            t1 = b[wi + 1][1] if wi + 1 < len(b) else fin_bloque
            texto = " ".join(("{\\c&H00D7FF&\\fscx112\\fscy112}" + x.upper() + "{\\c&HFFFFFF&\\fscx100\\fscy100}") if j == wi else x.upper() for j, (x, _, _) in enumerate(b))
            lineas.append(f"Dialogue: 0,{ts(t0 + desplaz)},{ts(t1 + desplaz)},Letra,,0,0,0,,{texto}")
    cab = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Letra,Fredoka Light,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,5,3,2,60,60,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    return cab + "\n".join(lineas) + "\n"


salidas = []
for i, (archivo, voz, (va, vb), corte, pausa, aire) in enumerate(CLIPS, 1):
    src = SUBIDOS / archivo
    largo_video = dur(src) - corte
    largo_voz = vb - va
    objetivo = pausa + largo_voz + aire if aire else max(largo_video, pausa + largo_voz)
    factor = objetivo / largo_video  # >1 = más lento, <1 = más rápido
    palabras = [w for w in T[voz] if w[1] >= va and w[2] <= vb + 0.05]
    (AQUI / f"letra_{i}.ass").write_text(ass(palabras, pausa - va, objetivo))
    salida = AQUI / f"clip_{i}.mp4"
    tempo = 1 / factor
    filtro = (
        f"[0:v]trim=start={corte},setpts=(PTS-STARTPTS)*{factor:.5f},fps={FPS},ass={AQUI / f'letra_{i}.ass'}[v];"
        f"[0:a]atrim=start={corte},asetpts=PTS-STARTPTS,atempo={tempo:.5f},volume=0.25[fondo];"
        f"[1:a]atrim={va}:{vb},asetpts=PTS-STARTPTS,adelay={int(pausa * 1000)}:all=1,volume=1.0[voz];"
        f"[voz][fondo]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95[a]"
    )
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-i", str(VOZ / f"{voz}.mp3"), "-filter_complex", filtro,
                    "-map", "[v]", "-map", "[a]", "-t", f"{objetivo:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2", str(salida)], check=True)
    print(f"clip_{i}.mp4: {objetivo:.1f} s (velocidad del video x{1 / factor:.2f})")
    salidas.append(salida)

lista = AQUI / "lista.txt"
lista.write_text("".join(f"file '{s}'\n" for s in salidas))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", "-movflags", "+faststart",
                str(AQUI / "gta6_easter_eggs_clips.mp4")], check=True)
print("Listo:", AQUI / "gta6_easter_eggs_clips.mp4", f"{dur(AQUI / 'gta6_easter_eggs_clips.mp4'):.1f} s")
