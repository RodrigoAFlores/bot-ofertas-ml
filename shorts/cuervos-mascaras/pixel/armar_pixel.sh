#!/usr/bin/env bash
# Une cuadros pixel art (x5 sin suavizado) + voz + música chiptune + efectos.
set -euo pipefail
cd "$(dirname "$0")"
python3 audio.py
A=../src
ffmpeg -v error -y -i $A/a1.mp3 -i $A/a2.mp3 -i $A/a3.mp3 -i $A/a4.mp3 -i $A/a5.mp3 -filter_complex \
 "[1]adelay=4791:all=1[b];[2]adelay=15407:all=1[c];[3]adelay=36995:all=1[d];[4]adelay=47950:all=1[e];[0][b][c][d][e]amix=inputs=5:normalize=0,aresample=44100,pan=mono|c0=c0[v]" \
 -map "[v]" voz.wav
# la música baja sola cuando habla la voz (sidechain)
ffmpeg -v error -y -i voz.wav -i musica.wav -i efectos.wav -filter_complex \
 "[0]asplit[v1][v2];[1]volume=0.3[m];[m][v2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md];[v1][md][2]amix=inputs=3:normalize=0,alimiter=limit=0.95[a]" \
 -map "[a]" -c:a pcm_s16le mezcla.wav
ffmpeg -v error -y -framerate 30 -i cuadros/%05d.png -i mezcla.wav \
 -vf "scale=1080:1920:flags=neighbor,format=yuv420p" -c:v libx264 -preset slow -crf 16 -tune animation \
 -c:a aac -b:a 192k -shortest -movflags +faststart ../cuervos_mascaras_pixelart.mp4
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 ../cuervos_mascaras_pixelart.mp4
