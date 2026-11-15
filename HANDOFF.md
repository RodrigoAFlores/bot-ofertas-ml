# Handoff: bot de ofertas ML → Instagram (2026-11-10, noche)

## Funcionando y comprobado
- Página pública de ofertas y página de historias (GitHub Pages).
- Recolección desde el celular: marcador "Recolectar" (docs/recolectar.js) → docs/recibir.html → data/entrada.json → workflow procesar.yml (elige, dibuja imágenes en la nube, publica páginas). Probado todo menos el envío real desde el teléfono.
- La clave de GitHub de Rodrigo quedó guardada en su iPhone y GitHub la aceptó (falta confirmar que tenga permiso de escritura: se ve en el primer envío).
- Regla de no repetir (data/historial.json, docs/historial.json).

## Sin comprobar
- RESUELTO 14-nov: GitHub solo disparaba el cron cada 5-6 h. Ahora cron-job.org llama a publicar.yml cada 10 min (9:00-22:59 Chile). Comprobado con el post #5 a las 9:10.
- Hay 14 posts del 10-nov listos y sin publicar (ofertas recolectadas el 10-nov a las 20:50; el bot los descarta a las 30 horas).

## Rutina diaria de Rodrigo
1. En el celular: panel de afiliados → marcador Recolectar → Enviar al bot. No hacerlo antes de que se publiquen los posts del día, porque reemplaza la tanda.
2. Subir las historias a mano desde /historias.html.

## Pendiente
1. Regenerar el token de Instagram (quedó pegado en el chat).
2. Poner el link de la página en la bio de Instagram (lo hace Rodrigo).
3. Ampliar la búsqueda por categorías cuando se agoten las ofertas nuevas.

## Falabella (14-nov)
- Integrada y subida. Rutina: después de recolectar Mercado Libre, abrir creators.falabella.com en el celular → marcador "Recolectar Falabella" → Enviar al bot.
- Probado en Chrome de escritorio hasta la página de envío (10 links reales correctos). Falta: crear el marcador en el iPhone y el primer envío real.

## Carruseles por categoría (15-nov)
- Hecho (commit local, SIN subir a GitHub): posts e historias sin número ("OFERTA #n" se quitó), con el logo de Mercado Libre o Falabella arriba a la izquierda y la categoría arriba a la derecha.
- categorias.mjs clasifica por palabras del título: Tecnología · Cuidado y Belleza · Moda · Entretención (lo demás = "Otros", no va a carrusel). Probar con `node categorias.mjs`.
- imagenes.mjs arma un carrusel por categoría: portada (estilo stickers con garabatos, fuentes Fredoka + Pacifico de Google Fonts) + hasta 9 ofertas, ordenadas por descuento alternando tiendas y completadas con "más vendidos". Quedan en publicaciones.json → "carruseles" (imagenes, texto del caption, links). Logos en marcas/.
- Probado en el Mac con las ofertas del 15-nov: 4 carruseles (Tecnología 9, Belleza 6, Moda 9, Entretención 5).
- Rodrigo eligió publicar LAS 4 categorías cada día.
- publicar.py: `siguiente` publica los carruseles (si la tanda los trae) en vez de los posts sueltos, repartidos en el día (con recolección a las 9: ~9:00, 12:30, 16:00, 19:30). `python3 publicar.py carrusel Moda` publica uno a mano. Probado solo en modo prueba (--probar); la primera subida real a Instagram está SIN comprobar.
- FALTA: subir a GitHub (push) con permiso de Rodrigo. Hasta entonces sigue el sistema viejo de posts sueltos.

## Borrado de posts antiguos (15-nov)
- Rodrigo aprobó borrar los 87 posts sueltos (se conserva el carrusel). Lista guardada en data/borrados_2026-11-15.json (id, enlace, texto).
- El borrado por API falló: "(#10) Insufficient permissions" (el token no tiene permisos de páginas; 'instagram_manage_contents' no existe en la app). Rodrigo decidió BORRARLOS A MANO desde la app de Instagram. data/publicado.json se deja igual (sirve para no repetir productos).
- Reel eliminado del flujo (reel.mjs, docs/reels y pasos de los workflows). Primer carrusel publicado el 15-nov: https://www.instagram.com/p/Dfw2El5Iyg5/
