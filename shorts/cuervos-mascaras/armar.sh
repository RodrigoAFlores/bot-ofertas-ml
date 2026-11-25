#!/usr/bin/env bash
# Arma el short 9:16 a partir de src/i*.png (16:9), src/a*.mp3 y ov/*.png.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p tmp
dur(){ ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
GAP=0.35
ENC="-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -ar 44100 -ac 2"
# Escala la imagen a alto 1920 (ancho 3413) y recorta 1080 de ancho con x en función de t.
pan(){ echo "scale=3413:1920:flags=lanczos,crop=1080:1920:x='$1':y=0,setsar=1"; }
ease(){ echo "($1+($2-$1)*(min(max((t-$3)/$4,0),1))*(min(max((t-$3)/$4,0),1))*(3-2*min(max((t-$3)/$4,0),1)))"; }
escena(){ # n, filtro de video para [0], extra (overlays adicionales)
  local n=$1 vf=$2 extra=${3:-}; local d; d=$(echo "$(dur src/a$n.mp3)+$GAP+${4:-0}" | bc)
  ffmpeg -v error -y -loop 1 -framerate 30 -i src/i$n.png -i src/a$n.mp3 -loop 1 -i ov/t$n.png -loop 1 -i ov/ia.png -loop 1 -i ov/sub.png \
    -filter_complex "[0]$vf[v0];[2]format=rgba,fade=in:st=0.05:d=0.25:alpha=1[tx];[v0][tx]overlay[v1];[v1][3]overlay[v2];[v2]${extra:-null}[v];[1]apad[a]" \
    -map "[v]" -map "[a]" -t "$d" $ENC tmp/s$n.mp4
  echo "escena $n: $d s"
}
D1=$(dur src/a1.mp3); D3=$(dur src/a3.mp3); D5=$(dur src/a5.mp3)
escena 1 "$(pan "$(ease 1150 900 0 $D1)")"
# Escena 2: pantalla dividida (arriba cámara oculta = A, abajo máscara = B)
escena 2 "split[p][q];[p]crop=371:330:295:0,scale=1080:960:flags=lanczos[top];[q]crop=405:360:398:345,scale=1080:960:flags=lanczos[bot];[top][bot]vstack,drawbox=y=954:w=1080:h=12:color=black:t=fill,setsar=1"
escena 3 "$(pan "$(ease 1350 1050 0 $D3)")"
# Escena 4: primero la persona con la máscara de las capturas, luego paneo a la de la otra máscara
escena 4 "$(pan "$(ease 560 2330 4.2 2.6)")"
# Escena 5: cuervo en la ventana + botón de suscribirse al final
escena 5 "$(pan "$(ease 1450 1650 0 $D5)")" "[4]overlay=enable='gte(t,5.3)'" 0.9
printf "file 's%d.mp4'\n" 1 2 3 4 5 > tmp/lista.txt
ffmpeg -v error -y -f concat -safe 0 -i tmp/lista.txt -c copy -movflags +faststart cuervos_mascaras_9x16.mp4
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 cuervos_mascaras_9x16.mp4
