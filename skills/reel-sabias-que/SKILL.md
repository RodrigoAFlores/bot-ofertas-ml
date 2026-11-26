---
name: reel-sabias-que
description: Hace reels verticales "¿Sabías que…?" de animales y curiosidades, animados 100% con código (estilo vectorial fluido a 60 fps), con narración de ElevenLabs (voz Sebastian), música y efectos de sonido generados con código, más la descripción lista para Facebook. Úsala siempre que el usuario pida un reel, short, video o "otro video como el del pingüino/cuervo", un "¿Sabías que…?", un dato curioso animado, o el video para mañana, aunque no diga "skill" ni el estilo.
---

# Reel "¿Sabías que…?" animado con código

Este es el flujo que el usuario aprobó: el resultado tiene que verse y sonar **igual** que el reel de ejemplo
(`assets/ejemplo-pinguino/`, "El pingüino y la piedra"). La consistencia es el objetivo: es una serie y el canal
se reconoce por el estilo. No improvises otro estilo, otra voz u otra música salvo que el usuario lo pida.

Todo en español. El usuario no es programador: explica en palabras simples, sin jerga.

## Paso 1 — Tema

Si el usuario no trae tema, propón 4 con `AskUserQuestion` (una línea cada uno: el dato y por qué se anima bien).
Busca datos **verificables** y fáciles de dibujar (animales con comportamientos visuales: regalos, robos,
inteligencia, cooperación). Evita exagerar: si algo es "a veces" no lo digas como "siempre" (ej.: no afirmar
"pareja para toda la vida" si no es cierto en todos los casos).

## Paso 2 — Guion (esperar aprobación antes de gastar créditos)

Escribe el guion con la plantilla de `references/guion.md`: **solo la historia, sin pregunta A/B** (el usuario
lo pidió así), 5–6 escenas, 45–55 s en total, cada escena con **Narración**, **Pantalla** (texto con emoji) y
**Escena** detallando cámara, efectos y transiciones (catálogo en `references/estilo.md`). Debe pasar algo nuevo
cada 2–3 segundos. Cierre: pregunta al espectador + "Etiquétalo en los comentarios" + "Sígueme para el próximo
¿Sabías que…?" (es Facebook: "Sígueme", nunca "Suscríbete"). Si el tema es un **misterio real sin respuesta**
(para que comenten su teoría sin elegir opciones), cierra con "¿Tú qué crees que fue? Te leo en los
comentarios" y usa música "misterio". Ejemplo hecho: `shorts/senal-wow/` (la señal Wow!).

Muéstralo y pregunta si lo aprueba. La voz cuesta ~750–900 créditos de ElevenLabs; la animación es gratis.
Si pide cambios, ajusta y vuelve a mostrar. Explica, si pregunta, que la voz va **antes** que la animación
porque la animación se sincroniza con las palabras.

## Paso 3 — Voz (ElevenLabs)

1. `creative_create_flow` con nombre "Reel <tema>".
2. Un `creative_generate_speech` **por escena**, todos en ese flow, en paralelo:
   `model_id: "eleven_v4"`, `voice_id: "Sk6HUnnfU78EAgS3Mgu3"` (Sebastian, español latino neutro),
   `generations_count: 1`. Se pueden usar etiquetas suaves como `[curious]`, `[amazed]`, `[warmly]`, `[playful]`
   y "..." para pausas dramáticas. Nunca repitas una llamada para reintentar (cobra de nuevo).
3. `creative_get_flow_run_status` hasta `all_completed` (un "concurrency limit" se reintenta solo: espera).
4. Descarga cada `content_url` a `shorts/<tema>/voz/v1.mp3 … vN.mp3` con `curl -sSfL`. El host es
   `elevenlabsusercontent.com`; si el proxy lo bloquea (403), pide agregarlo a los hosts permitidos del entorno.

## Paso 4 — Tiempos

```bash
python3 <skill>/scripts/tiempos.py shorts/<tema>
```
Crea `config.json` (duraciones de voz, `vo` = cuándo arranca la voz en su escena, `cola` = aire al final,
`sigilo` = escenas con música de puntillas, `nombre` = nombre del mp4, `musica` = `"marimba"`
(alegre, por defecto), `"misterio"` (sintetizador espacial oscuro, para misterios) o `"synthwave"`
(neón ochentero con batería, para videojuegos y temas urbanos); propón la música en el guion) e imprime los tramos de cada frase.
Usa esos números para que cada efecto caiga en su palabra (ej.: el congelado justo en "piedra").

## Paso 5 — Animación

Crea `shorts/<tema>/escenas.js` tomando como base `assets/ejemplo-pinguino/escenas.js` (cópialo y reemplaza
personajes, fondos y escenas). El motor (`assets/motor.js`) **no se edita**: ya trae cámara con capas,
títulos letra por letra con rebote, etiquetas, emojis, destellos, iris, ráfaga, nieve, estrellitas, corazones,
desenfoque de movimiento y el render. Lee `references/estilo.md` antes de escribir: tiene las reglas visuales
y la lista de funciones del motor con ejemplos.

Lo que debe definir `escenas.js`: `Object.assign(C, {...})` (paleta propia), `EMOJIS` (todos los emojis usados),
opcional `RAFAGAS`, una función `escenaN(c, t)` por escena, `const ESC = [...]` y `function eventos()` con los
sonidos (tipos en `scripts/audio.py`).

Revisa antes del render completo (el render completo tarda ~10 min):
```bash
node <skill>/scripts/render.mjs shorts/<tema> info          # valida y crea eventos.json
node <skill>/scripts/render.mjs shorts/<tema> prueba 2 8.5 15 … # 15–20 momentos clave
ffmpeg -v error -y -i shorts/<tema>/prueba/%03d.png -vf "scale=216:384,tile=10x2" -frames:v 1 <scratchpad>/hoja.jpg
```
Mira la hoja con `Read`: textos que no se salgan ni tapen caras, personajes grandes en cuadro, nada vacío.
Corrige y repite hasta que se vea bien.

## Paso 6 — Render, sonido y video

```bash
node <skill>/scripts/render.mjs shorts/<tema> todo      # todos los cuadros, 3 procesos en paralelo (en segundo plano)
python3 <skill>/scripts/armar.py shorts/<tema>          # música + efectos + voz → shorts/<tema>/<nombre>.mp4
```
Revisa una hoja de cuadros del mp4 final y entrégalo con `SendUserFile` (display "render").

## Paso 7 — Entrega

Junto al video, da la descripción para Facebook con la plantilla de `references/guion.md` (emoji + gancho,
3–4 líneas de historia, pregunta para comentar, "Sígueme…", 8 hashtags). Resume en pocas líneas qué pasa en
cada escena y cuántos créditos se gastaron. No agregues marcas de agua ni el texto "voz generada con IA"
(el usuario pidió quitarlo).

Guarda el trabajo en el repo: `shorts/<tema>/` con `escenas.js`, `config.json`, `voz/` y el mp4, y un
`.gitignore` con `cuadros/`, `prueba/`, `*.wav`. Ojo: si el repo ignora `config.json` (pasa en bot-ofertas-ml), agrégalo con `git add -f`. Haz commit en la rama de trabajo y push si hay acceso.

## Archivos de la skill

- `assets/motor.js` — motor de animación (no editar por reel).
- `assets/ejemplo-pinguino/` — reel completo de referencia: `escenas.js`, `config.json`, `voz/`, `guion.md`.
- `assets/fredoka-700.woff2` — tipografía de los títulos.
- `scripts/tiempos.py`, `scripts/render.mjs`, `scripts/audio.py`, `scripts/armar.py` — el flujo de arriba.
- `references/estilo.md` — reglas visuales, catálogo de efectos y API del motor.
- `references/guion.md` — plantilla del guion y de la descripción de Facebook.
