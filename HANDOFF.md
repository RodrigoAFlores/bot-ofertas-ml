# Handoff: bot de ofertas ML → Instagram (2026-11-09)

## Hecho y comprobado
- Primera recolección real: 108 productos revisados, 20 ofertas con link de afiliado en data/ofertas.json.
- imagenes.mjs genera 3 posts, 17 historias, la página docs/index.html y docs/publicaciones.json (textos de cada post).
- Un link meli.la probado en el navegador: abre el perfil de afiliado con el producto.
- Todo guardado en git local (sin push).

## No funciona
- Iniciar sesión en ML en la ventana automatizada del bot (recolector.mjs login): ML lo rechaza. No insistir.
- La recolección de hoy se hizo desde el Chrome normal de Rodrigo con la extensión Claude in Chrome.

## Siguiente
1. Publicar la página: push + activar GitHub Pages en /docs (pedir permiso).
2. App de Meta + Instagram Empresa → publicar posts e historias desde GitHub Actions (falta `gh auth refresh -s workflow`).
3. Automatizar la recolección diaria sin la ventana del bot (por ejemplo, tarea programada de Claude con Claude in Chrome).
