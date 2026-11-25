#!/usr/bin/env bash
# Une los cuadros (60 fps) con la voz, la música (que baja cuando habla la voz) y los efectos.
set -euo pipefail
cd "$(dirname "$0")"
python3 audio.py
# voz: cada clip en su escena (INI + VO, en ms)
ffmpeg -v error -y -i voz/v1.mp3 -i voz/v2.mp3 -i voz/v3.mp3 -i voz/v4.mp3 -i voz/v5.mp3 -i voz/v6.mp3 -filter_complex \
 "[0]adelay=500:all=1[a];[1]adelay=6054:all=1[b];[2]adelay=12888:all=1[c];[3]adelay=25730:all=1[d];[4]adelay=37264:all=1[e];[5]adelay=44248:all=1[f];[a][b][c][d][e][f]amix=inputs=6:normalize=0,aresample=44100,pan=mono|c0=c0[v]" \
 -map "[v]" voz.wav
ffmpeg -v error -y -i voz.wav -i musica.wav -i efectos.wav -filter_complex \
 "[0]asplit[v1][v2];[1]volume=0.35[m];[m][v2]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350[md];[2]volume=0.9[fx];[v1][md][fx]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]" \
 -map "[a]" -c:a pcm_s16le mezcla.wav
ffmpeg -v error -y -framerate 60 -i cuadros/%05d.png -i mezcla.wav -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 60 \
 -c:a aac -b:a 192k -shortest -movflags +faststart pinguino_piedra_reel.mp4
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration -of default=nw=1 pinguino_piedra_reel.mp4
