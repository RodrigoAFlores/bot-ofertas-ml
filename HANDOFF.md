# Handoff: bot de ofertas ML → Instagram (2026-11-09)

## Hecho y comprobado
- Primera recolección real: 108 productos revisados, 20 ofertas con link de afiliado en data/ofertas.json.
- imagenes.mjs genera 3 posts, 17 historias, la página docs/index.html y docs/publicaciones.json (textos de cada post).
- Un link meli.la probado en el navegador: abre el perfil de afiliado con el producto.
- Todo subido a GitHub.

## No funciona
- Iniciar sesión en ML en la ventana automatizada del bot (recolector.mjs login): ML lo rechaza. No insistir.
- La recolección de hoy se hizo desde el Chrome normal de Rodrigo con la extensión Claude in Chrome.

## Siguiente
1. HECHO: página publicada en https://rodrigoaflores.github.io/bot-ofertas-ml/ (comprobado: carga con 20 ofertas).
1b. Página privada para subir historias desde el celular con el link listo para copiar.
2. HECHO: app de Meta conectada a @ofertas_punto_cl, token en GitHub Secrets, publicar.py probado con el post #1.
2b. Falta el flujo de GitHub Actions que publique solo cada día (requiere `gh auth refresh -s workflow`) y regenerar el token, que quedó expuesto en el chat.
3. Automatizar la recolección diaria sin la ventana del bot (por ejemplo, tarea programada de Claude con Claude in Chrome).
