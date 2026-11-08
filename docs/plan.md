# Plan: ofertas de Mercado Libre → Instagram (afiliados)

Última actualización: 2026-11-08

## Decisiones tomadas (por Rodrigo)
- Negocio: afiliados de Mercado Libre Chile. Sin tienda propia.
- Presupuesto: cero. Todo gratis.
- Las ofertas más llamativas van como **publicación** y el resto como **historias**, con link de afiliado.
- Plan mixto: las ofertas se recolectan desde **su panel de afiliados en el Mac** y se publican **desde la nube** (GitHub).
- El repositorio es público: github.com/RodrigoAFlores/bot-ofertas-ml. Las claves nunca se suben.
- Más adelante: videos con IA hechos con código (reels).

## Por qué este camino
- La API de búsqueda de ML responde 403, tanto con token de app como de usuario. ML la cerró.
- La web pública de ML pide verificación anti-bot a los scripts, y no la vamos a saltar.
- El panel de afiliados sí entrega lo que hace falta. Usa dos APIs internas con la sesión del usuario:
  - `POST /affiliate-program/api/hub/search?is_affiliate=true&device=desktop`
    body `{"search":"","sort":"relevance","filters":[],"offset":0}` → `polycard_client_model.polycards[]`.
    Cada uno trae título, precio actual y anterior, % OFF, comisión, ventas, foto e id.
    Filtros: `category` (MLC1051…) y `best_seller`. Orden: relevance, lowest_price, highest_price.
  - `POST /affiliate-program/api/v2/affiliates/createLink`
    body `{"itemId": pid, "type": metadata.type, "extraCommission": "false", "itemAddToList": metadata.id, "tag": "flro3183825", "urls": [metadata.url]}`
    → `urls[0].short_url` (meli.la) y `urls[0].regex`, un código para pegar en el buscador de ML.
  - Foto: `https://http2.mlstatic.com/D_NQ_NP_2X_{picture_id}-F.webp`
- Esos productos son elegibles para comisión. Un producto cualquiera puede no serlo.

## Arquitectura
1. **Mac (recolector, 1 vez al día).** Node + playwright-core usa el Chrome instalado, con un perfil propio donde se inicia sesión en ML una vez. Llama a las dos APIs desde la página del panel. Guarda `data/ofertas.json` (sin datos sensibles) y hace push a GitHub. Lo programa launchd.
   - ⚠️ DEUDA TÉCNICA: depende de que el Mac esté encendido a esa hora.
2. **Nube (GitHub Actions + Pages).**
   - Ranking hecho con código (no con IA): descuento, comisión y ventas.
   - Imágenes 1080×1080 (post) y 1080×1920 (historia) con Pillow.
   - Página "ofertas de hoy" en GitHub Pages: la usa el link de la bio y aloja las imágenes que Instagram necesita.
   - Publicación en Instagram con la API oficial (Instagram Login, cuenta Empresa): posts + historias repartidas en el día.
   - Las historias no pueden llevar sticker de link por API. En su lugar muestran "Oferta #N, link en mi bio" y el **código de búsqueda de ML**.

## Pendientes que necesitan a Rodrigo
- [ ] Permiso para instalar playwright-core (npm, ~14 MB).
- [ ] Iniciar sesión en ML una vez, en la ventana de Chrome del bot.
- [ ] Crear la app de Meta y conectar el Instagram Empresa.
- [ ] Elegir la hora diaria de recolección y las horas de publicación.
