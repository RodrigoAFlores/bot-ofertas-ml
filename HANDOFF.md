# Handoff: bot de ofertas ML → Instagram (2026-11-08)

## Hecho y comprobado
- GitHub: repo público RodrigoAFlores/bot-ofertas-ml. gh conectado en el Mac.
- App de ML "Bot ofertas" creada y autorizada: config.json y tokens.json, solo locales.
- Comprobado: la API de búsqueda de ML da 403 y la web pública tiene anti-bot.
- Comprobado: las APIs internas del panel de afiliados (hub/search y createLink) funcionan con la sesión del usuario. Detalle en docs/plan.md.
- recolector.mjs + recolector.config.json escritos y subidos. Pasan la revisión de sintaxis, pero todavía no recolectaron de verdad.

## Bloqueado
- Iniciar sesión en ML en el perfil del bot: ML respondió "demasiados intentos". Reintentar más tarde con `node recolector.mjs login` (PATH de node: ~/.nvm/versions/node/v26.13.0/bin). Pedir verificación por código, no por link (los links se abren en Safari).

## Siguiente
1. Con la sesión lista: `node recolector.mjs --sin-subir` y revisar data/ofertas.json.
2. Programar el recolector diario con launchd.
3. Nube: imágenes con Pillow, página en GitHub Pages, GitHub Actions.
4. App de Meta + Instagram Empresa → publicar.
