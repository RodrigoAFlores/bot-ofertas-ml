# Estilo visual y API del motor

## Reglas del estilo (lo que hace que se vea "fluido")

- **Formato**: 1080×1920, 60 fps, desenfoque de movimiento (4 submuestras por cuadro; lo hace el motor).
- **Dibujo**: vectorial plano con degradados suaves, sin contornos negros gruesos. Personajes **armados por
  piezas** (cuerpo, cabeza, aletas/alas, patas, ojos, pico) que giran desde sus articulaciones con parámetros
  (`cabeza`, `aletaD`, `pico`, `parpado`, `inclina`, `aplasta`, `anda`/`paso`…). Así todo se mueve continuo.
- **Movimiento**: nunca lineal. Usa `salida`, `suave`, `rebote` y `resorte` (llega con un pequeño rebote).
  Acción superpuesta: tras un impacto, el cuerpo se asienta primero y las partes después (`sacudida`).
- **Cámara siempre viva**: acercamientos, paneos, paradas en seco con rebote. Fondo en **capas** con distinta
  profundidad (`conCamara`): cielo 0.15–0.2, montañas 0.35–0.4, mar/medio 0.55–0.6, suelo y personajes 1,
  partículas delante 1.3–1.4.
- **Ritmo**: algo nuevo cada 2–3 s (corte, zoom, efecto, etiqueta). Cada efecto cae en la palabra de la voz
  (tiempos de `tiempos.py`; dentro de la escena la voz empieza en `VO[k]`).
- **Textos**:
  - **Título** por escena arriba (y≈300), letra por letra con rebote, blanco con la 2ª línea amarilla
    (`C.ama`), contorno oscuro y emoji al final.
  - **Etiquetas** (cajitas redondeadas) para datos cortos: "✔ LISA", "¡LADRÓN!".
  - Los títulos se achican solos si no caben; aun así, que no tapen caras.
- **Personajes**: grandes en cuadro (que ocupen ~1/3 de la altura en planos generales). Expresivos: ojos
  `brillo` (estrellas), `corazon`, `astuto`, `enojado`; `rubor` en mejillas; gota de nervios; 💢.
- **Colores**: día brillante y limpio; el cierre al **atardecer** (morado/rosado/naranja) con corazón flotando.
- **Viñeta** suave en todas las escenas (`vineta(c, 0.4)`).
- **Cierre fijo**: pregunta al espectador, 💬 + "¡ETIQUÉTALO!", botón azul `SÍGUEME 🔔` (color `C.azulFB`) con
  rebote y 👆 animado, fundido a negro al final.
- **Sin** marcas de agua ni "voz generada con IA".

## Catálogo de efectos (todos usados en el ejemplo; ver `escenas.js` del pingüino)

| Efecto | Cómo se hace | Ejemplo en el pingüino |
|---|---|---|
| Apertura desde negro | `destello(c, 1 - t/0.45, "0,0,0")` | escena 1 |
| Cámara que baja del cielo + acercamiento rápido | `cam.y` con `salida`, `cam.z` con `rebote` | escena 1 |
| **Congelado** con destello y anillo | tiempo de animación fijo (`tA`) mientras la cámara sigue; `destello` + círculo punteado + estrellitas | "piedra" (esc. 1), "¡ladrón!" (esc. 5) |
| Ráfaga de nieve/viento entre escenas | `RAFAGAS = [k]` (el motor la dibuja al empezar la escena k) | 1→2 |
| Paneo lateral amplio + parada en seco | `cam.x` con `suave`, luego `sacudida` y zoom con `rebote` | escena 2 |
| Icono que se tacha y se rompe | dibujo + X roja que crece + dos mitades con `clip` que caen girando | rama (esc. 2) |
| Objetos que ruedan y tapan la pantalla | `transicionPiedras` (adaptar el objeto al tema) | 2→3 |
| Caminata con cámara que acompaña | `cam.x` sigue al personaje, capas con paralaje | escena 3 |
| **Cortes rápidos** con mini zoom y destello | sub-escenas por tiempo, `cam.rot` distinto, `destello(c, 1 - tc/0.08)` | 3 cortes con ❌ |
| Empujón lento dramático + rayos de luz | `cam.z` creciendo, rayos girando, resplandor radial, estrellitas | piedra ideal |
| Primer plano con ojos de estrella | zoom 2.8 a la cara, `ojos: "brillo"` | escena 3 |
| Destello que llena la pantalla (transición) | `destello` al final de la escena y al inicio de la siguiente | 3→4 |
| Cámara lenta | animación más lenta y partículas a 0.25× | dejar la piedra |
| Zooms alternados (tensión) | `cam` salta de un personaje al otro | él / ella |
| Explosión de corazones + fondo rosado | `explosionCorazones(c, pc)` y capa rosada | "la acepta" |
| **Cámara rápida** (time-lapse) | tiempo ×4, ⏩ + etiqueta "x4" | nido |
| Iris (círculo que se cierra/abre) | `iris(c, p, x, y)` | 4→5 |
| Sacudida de pantalla | `c.translate(sacudida(...))` alrededor de la cámara | robo |
| Letrero con flecha | `etiqueta` + flecha con `resorte` | "¡LADRÓN!" |
| Huida en cámara rápida + líneas de velocidad + barrido | `cam.x` con `entrada`, líneas blancas | escena 5 |
| Cámara que se aleja al final | `cam.z` de 1.55 a 1.05 | cierre |

## API del motor (`assets/motor.js`)

Globales: `W=1080`, `H=1920`, `INI[k]` (inicio de la escena k en el video), `DUR[k]`, `VO[k]` (inicio de la voz
dentro de la escena), `TOTAL`, `C` (paleta: `ama`, `rosa`, `rojo`, `azulFB`, `tinta` + las del reel).

Movimiento: `clamp`, `lerp`, `suave(p)`, `salida(p)`, `entrada(p)`, `rebote(p)`, `resorte(tau, k, w)`,
`sacudida(tau, amp, k, w)`, `rnd(semilla)` (aleatorio repetible: úsalo siempre, nunca `Math.random`,
para que cada cuadro sea igual al re-renderizar), `ventana(t, a, b)`.

Dibujo y efectos:
- `conCamara(c, {x, y, z, rot}, [[profundidad, () => dibujo], …])`: cámara con capas.
- `titulo(c, ["LÍNEA 1", "LÍNEA 2 🐧"], y, tInicio, t, tam=128, colores)`.
- `etiqueta(c, "TEXTO", x, y, t, tInicio, colorTexto, fondo, tam, rot)`.
- `emoji(c, "❌", x, y, tam, escala, rot, alfa)`.
- `destello(c, alfa, "r,g,b")`, `vineta(c, fuerza)`, `iris(c, p, x, y)`, `rafaga(c, p)`.
- `nieve(c, t, n, semilla, velX, tam, alfa)`, `estrellita(c, x, y, r, rot, col)`, `corazon(c, x, y, r, col)`.
- `explosionCorazones(c, segundosDesdeInicio, x, y)`.
- `redondo(c, x, y, w, h, r)`: rectángulo redondeado (para botones).

Sonidos: `eventos()` devuelve `[{t: segundosGlobales, tipo}]`; para un momento de la escena k usa
`INI[k] + VO[k] + segundosDeLaFrase`. Pon un `pop` por letra de cada título (cada 0.035 s), `check` en
etiquetas, `whoosh` en transiciones, `ding`/`flash` en congelados, `golpe` en paradas en seco, `error` en ❌,
`swish` al lanzar, `coro` + `brillo` en revelaciones, `corazones`, `timelapse`, `iris`, `huida`, `enojo`,
`boing` al ladear la cabeza y `boton` al aparecer SÍGUEME. Escenas de travesura: `config.json → "sigilo": [k]`.
