#!/usr/bin/env bash
# Une los cuadros de 60 fps con la voz y el sonido ambiente.
set -euo pipefail
cd "$(dirname "$0")"
python3 audio.py
ffmpeg -v error -y -framerate 60 -i cuadros/%05d.png -i ../cuervos-mascaras/src/a1.mp3 -i ambiente.wav -filter_complex \
 "[1]adelay=300:all=1,volume=1.0[v];[2]volume=0.8[a];[v][a]amix=inputs=2:normalize=0,alimiter=limit=0.95[m]" \
 -map 0:v -map "[m]" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -r 60 -c:a aac -b:a 192k -t 5.0 -movflags +faststart demo_cuervo_vectorial_60fps.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration -of default=nw=1 demo_cuervo_vectorial_60fps.mp4
