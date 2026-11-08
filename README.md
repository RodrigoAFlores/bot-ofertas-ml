# Bot de ofertas Mercado Libre Chile → WhatsApp

## Configuración (una vez)
1. Crea una app en https://developers.mercadolibre.cl/devcenter
   - Redirect URI: `https://www.google.com/` (o cualquier URL tuya)
2. Copia `config.ejemplo.json` a `config.json` y pon tu `client_id` y `client_secret`.
3. `python3 ofertas.py login` → autoriza y pega la URL a la que te redirige.

## Uso diario
`python3 ofertas.py buscar` → crea `mensajes/ofertas_FECHA.html` (con botón "Copiar mensaje")
y `.txt`. Pega cada mensaje en el grupo.

## Cómo decide qué es oferta
- Si la publicación pertenece a un producto de catálogo, la compara con la mediana de
  precio de **otros vendedores del mismo producto**.
- Si no, la compara con la mediana de la búsqueda (sin el 10% de extremos).
- Se publica si está al menos `descuento_minimo`% más barata.
- No repite la misma publicación durante `no_repetir_dias`.

## Ajustes en config.json
| campo | qué hace |
|---|---|
| `busquedas` | lista de `{q, categoria?, precio_max?, descuento_minimo?}` |
| `comparar_con_busqueda` | `false` = solo productos de catálogo (más preciso, menos ofertas) |
| `sufijo_link` | texto que se agrega a cada link (p. ej. parámetros de afiliado) |
