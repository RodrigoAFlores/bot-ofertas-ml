# Handoff: bot de ofertas ML → Instagram (2026-11-10)

## Funcionando
- Página pública: https://rodrigoaflores.github.io/bot-ofertas-ml/ (20 ofertas del día).
- Página de historias para el celular: /historias.html (guardar imagen + copiar link; el sticker se pone a mano).
- Publicación automática en @ofertas_punto_cl: GitHub Actions, un post por hora de 9:00 a 22:00 de Chile, 14 por día.
- Regla de no repetir: data/historial.json; una oferta vuelve solo si bajó de precio.

## Sin comprobar
- La primera ejecución automática en la nube (prevista 22:00 del 10-nov). Revisar con `gh run list` y data/publicado.json.

## Manual todavía
- Recolección diaria: la hace Claude desde el Chrome de Rodrigo (panel de afiliados), pasando el historial al JS.
- Sin recolección nueva, el bot deja de publicar a las 30 horas.

## Pendiente
1. Regenerar el token de Instagram (quedó pegado en el chat) y guardarlo con pbpaste en ~/.config/bot-ofertas-ml/ig_token y `gh secret set IG_TOKEN`.
2. Automatizar la recolección diaria.
3. Ampliar la búsqueda por categorías cuando se agoten las ofertas nuevas (~4-5 días).
4. Poner el link de la página en la bio de Instagram (lo hace Rodrigo).
