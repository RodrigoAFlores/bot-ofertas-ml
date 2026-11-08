#!/usr/bin/env python3
"""Bot de ofertas de Mercado Libre Chile -> mensajes para WhatsApp.

Uso:
    python3 ofertas.py login      # una sola vez: autoriza la app y guarda el token
    python3 ofertas.py buscar     # busca ofertas y genera los mensajes
    python3 ofertas.py demo       # prueba el formato con datos de ejemplo (sin API)
"""
import html
import json
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import datetime, timedelta
from pathlib import Path

BASE = Path(__file__).resolve().parent
CONFIG = BASE / "config.json"
TOKENS = BASE / "tokens.json"
VISTOS = BASE / "vistos.json"
SALIDA = BASE / "mensajes"

API = "https://api.mercadolibre.com"
AUTH_URL = "https://auth.mercadolibre.cl/authorization"
SITE = "MLC"


# ---------------------------------------------------------------- utilidades

def cargar_json(ruta, defecto):
    try:
        return json.loads(ruta.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return defecto


def guardar_json(ruta, datos):
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2), encoding="utf-8")


def clp(valor):
    return "$" + f"{int(round(valor)):,}".replace(",", ".")


def http(metodo, url, token=None, datos=None):
    headers = {"Accept": "application/json"}
    cuerpo = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if datos is not None:
        cuerpo = urllib.parse.urlencode(datos).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=cuerpo, headers=headers, method=metodo)
    for intento in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429 and intento < 2:  # demasiadas peticiones: esperar
                time.sleep(2 * (intento + 1))
                continue
            detalle = e.read().decode(errors="replace")[:300]
            raise RuntimeError(f"HTTP {e.code} en {url.split('?')[0]}: {detalle}") from None


# --------------------------------------------------------------------- OAuth

def login(cfg):
    params = {
        "response_type": "code",
        "client_id": cfg["client_id"],
        "redirect_uri": cfg["redirect_uri"],
    }
    url = f"{AUTH_URL}?{urllib.parse.urlencode(params)}"
    print("1) Abre esta URL, inicia sesión y autoriza la app:\n\n   " + url + "\n")
    webbrowser.open(url)
    print("2) Te redirigirá a tu redirect_uri con ?code=TG-... en la barra de direcciones.")
    archivo = BASE / "codigo.txt"
    if archivo.exists() and archivo.read_text().strip():
        pegado = archivo.read_text().strip()  # sin terminal: la URL se pega en codigo.txt
        archivo.unlink()
    else:
        pegado = input("   Pega aquí la URL completa (o solo el code): ").strip()
    code = urllib.parse.parse_qs(urllib.parse.urlparse(pegado).query).get("code", [pegado])[0]
    tok = http("POST", f"{API}/oauth/token", datos={
        "grant_type": "authorization_code",
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "code": code,
        "redirect_uri": cfg["redirect_uri"],
    })
    guardar_tokens(tok)
    print("\nListo: token guardado en tokens.json. Ya puedes correr: python3 ofertas.py buscar")


def guardar_tokens(tok):
    tok["expira"] = time.time() + tok.get("expires_in", 21600) - 300
    guardar_json(TOKENS, tok)


def token_valido(cfg):
    tok = cargar_json(TOKENS, None)
    if not tok:
        sys.exit("No hay token. Corre primero: python3 ofertas.py login")
    if time.time() < tok.get("expira", 0):
        return tok["access_token"]
    nuevo = http("POST", f"{API}/oauth/token", datos={
        "grant_type": "refresh_token",
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"],
        "refresh_token": tok["refresh_token"],
    })
    guardar_tokens(nuevo)
    return nuevo["access_token"]


# ---------------------------------------------------------------- búsqueda

def buscar_items(token, busqueda, paginas):
    items = []
    for pagina in range(paginas):
        params = {"q": busqueda["q"], "limit": 50, "offset": pagina * 50, "condition": "new"}
        if busqueda.get("categoria"):
            params["category"] = busqueda["categoria"]
        res = http("GET", f"{API}/sites/{SITE}/search?{urllib.parse.urlencode(params)}", token)
        items.extend(i for i in res.get("results", []) if i.get("currency_id") == "CLP" and i.get("price"))
        if len(res.get("results", [])) < 50:
            break
    return items


def precios_otros_vendedores(token, catalog_id, item_id):
    """Precios del mismo producto de catálogo publicados por otros vendedores."""
    try:
        res = http("GET", f"{API}/products/{catalog_id}/items?limit=50", token)
    except RuntimeError:
        return []
    return [r["price"] for r in res.get("results", []) if r.get("item_id") != item_id and r.get("price")]


def mediana_sin_extremos(precios):
    """Mediana tras descartar el 10% más barato y más caro (accesorios, packs, errores)."""
    p = sorted(precios)
    corte = len(p) // 10
    return statistics.median(p[corte:len(p) - corte] if corte else p)


def evaluar(token, cfg, busqueda, items):
    minimo = busqueda.get("descuento_minimo", cfg["descuento_minimo"])
    muestra = cfg["muestra_minima"]
    mediana_busqueda = mediana_sin_extremos([i["price"] for i in items]) if len(items) >= muestra else None
    cache_catalogo = {}
    ofertas = []

    for it in items:
        if busqueda.get("precio_max") and it["price"] > busqueda["precio_max"]:
            continue
        referencia, fuente = None, None
        cat = it.get("catalog_product_id")
        if cat:
            if cat not in cache_catalogo:
                cache_catalogo[cat] = precios_otros_vendedores(token, cat, it["id"])
            otros = cache_catalogo[cat]
            if len(otros) >= 2:
                referencia, fuente = statistics.median(otros), f"{len(otros)} vendedores del mismo producto"
        if referencia is None and cfg["comparar_con_busqueda"] and mediana_busqueda:
            referencia, fuente = mediana_busqueda, f"mediana de {len(items)} publicaciones similares"
        if referencia is None:
            continue

        ahorro = 1 - it["price"] / referencia
        if ahorro * 100 >= minimo:
            ofertas.append({
                "id": it["id"],
                "titulo": it["title"],
                "precio": it["price"],
                "precio_original": it.get("original_price"),
                "referencia": referencia,
                "fuente": fuente,
                "ahorro": ahorro,
                "envio_gratis": bool(it.get("shipping", {}).get("free_shipping")),
                "link": it["permalink"] + cfg.get("sufijo_link", ""),
                "imagen": (it.get("thumbnail") or "").replace("-I.jpg", "-O.jpg"),
                "busqueda": busqueda["q"],
            })
    return ofertas


# ---------------------------------------------------------------- mensajes

def mensaje_whatsapp(o):
    lineas = [f"🔥 *{o['titulo']}*", ""]
    if o["precio_original"] and o["precio_original"] > o["precio"]:
        lineas.append(f"Antes: ~{clp(o['precio_original'])}~")
    lineas.append(f"💰 *Ahora: {clp(o['precio'])}*")
    lineas.append(f"📉 {round(o['ahorro'] * 100)}% bajo el mercado (ref. {clp(o['referencia'])})")
    if o["envio_gratis"]:
        lineas.append("🚚 Envío gratis")
    lineas += ["", f"👉 {o['link']}"]
    return "\n".join(lineas)


def escribir_salida(ofertas, demo=False):
    SALIDA.mkdir(exist_ok=True)
    marca = datetime.now().strftime("%Y-%m-%d_%H%M")
    textos = [mensaje_whatsapp(o) for o in ofertas]
    txt = SALIDA / f"ofertas_{marca}.txt"
    txt.write_text("\n\n────────────\n\n".join(textos), encoding="utf-8")

    tarjetas = []
    for o, t in zip(ofertas, textos):
        tarjetas.append(f"""
<div class="card">
  <img src="{html.escape(o['imagen'])}" alt="">
  <div class="cuerpo">
    <pre>{html.escape(t)}</pre>
    <small>Referencia: {html.escape(o['fuente'])} · búsqueda “{html.escape(o['busqueda'])}”</small>
    <div class="acciones">
      <button onclick="copiar(this)">Copiar mensaje</button>
      <a href="{html.escape(o['link'])}" target="_blank">Ver en ML</a>
    </div>
  </div>
</div>""")
    aviso = '<p class="demo">DATOS DE EJEMPLO — no son publicaciones reales</p>' if demo else ""
    pagina = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ofertas {marca}</title>
<style>
body{{font-family:-apple-system,system-ui,sans-serif;background:#f4f4f4;margin:0;padding:16px;color:#222}}
h1{{font-size:20px}} .demo{{background:#ffe08a;padding:8px;border-radius:6px}}
.card{{display:flex;gap:16px;background:#fff;border-radius:10px;padding:14px;margin-bottom:14px;box-shadow:0 1px 3px #0002}}
.card img{{width:140px;height:140px;object-fit:contain;flex-shrink:0}}
pre{{white-space:pre-wrap;font-family:inherit;margin:0 0 8px}} small{{color:#777}}
.acciones{{margin-top:10px;display:flex;gap:10px;align-items:center}}
button{{background:#25d366;color:#fff;border:0;border-radius:6px;padding:8px 14px;font-size:14px;cursor:pointer}}
@media(max-width:560px){{.card{{flex-direction:column}} .card img{{width:100%;height:180px}}}}
</style></head><body>
<h1>{len(ofertas)} ofertas · {marca.replace('_', ' ')}</h1>{aviso}
{''.join(tarjetas) or '<p>No se encontraron ofertas con los criterios actuales.</p>'}
<script>
function copiar(b){{navigator.clipboard.writeText(b.closest('.cuerpo').querySelector('pre').innerText)
.then(()=>{{b.textContent='¡Copiado!';setTimeout(()=>b.textContent='Copiar mensaje',1500)}})}}
</script></body></html>"""
    pag = SALIDA / f"ofertas_{marca}.html"
    pag.write_text(pagina, encoding="utf-8")
    return txt, pag


# ---------------------------------------------------------------- comandos

def buscar(cfg):
    token = token_valido(cfg)
    vistos = cargar_json(VISTOS, {})
    limite = (datetime.now() - timedelta(days=cfg["no_repetir_dias"])).isoformat()
    vistos = {k: v for k, v in vistos.items() if v > limite}

    todas = {}
    for b in cfg["busquedas"]:
        print(f"Buscando “{b['q']}”...", end=" ", flush=True)
        try:
            items = buscar_items(token, b, cfg["paginas_por_busqueda"])
            ofertas = evaluar(token, cfg, b, items)
        except RuntimeError as e:
            print(f"error: {e}")
            continue
        nuevas = [o for o in ofertas if o["id"] not in vistos]
        print(f"{len(items)} publicaciones, {len(ofertas)} ofertas, {len(nuevas)} nuevas")
        for o in nuevas:
            todas.setdefault(o["id"], o)

    ofertas = sorted(todas.values(), key=lambda o: o["ahorro"], reverse=True)[: cfg["max_ofertas"]]
    ahora = datetime.now().isoformat()
    for o in ofertas:
        vistos[o["id"]] = ahora
    guardar_json(VISTOS, vistos)

    txt, pag = escribir_salida(ofertas)
    print(f"\n{len(ofertas)} ofertas listas:\n  {txt}\n  {pag}")
    if cfg.get("abrir_al_terminar", True) and ofertas:
        webbrowser.open(pag.as_uri())


def demo():
    ejemplo = [
        {"id": "MLC1", "titulo": "Audífonos Sony WH-1000XM5 Negro", "precio": 249990,
         "precio_original": 399990, "referencia": 329990, "fuente": "7 vendedores del mismo producto",
         "ahorro": 1 - 249990 / 329990, "envio_gratis": True, "link": "https://www.mercadolibre.cl/",
         "imagen": "", "busqueda": "audifonos sony"},
        {"id": "MLC2", "titulo": "Freidora de Aire 5.5 L Digital", "precio": 39990,
         "precio_original": None, "referencia": 54990, "fuente": "mediana de 48 publicaciones similares",
         "ahorro": 1 - 39990 / 54990, "envio_gratis": False, "link": "https://www.mercadolibre.cl/",
         "imagen": "", "busqueda": "freidora de aire"},
    ]
    txt, pag = escribir_salida(ejemplo, demo=True)
    print(mensaje_whatsapp(ejemplo[0]))
    print(f"\nArchivos de prueba:\n  {txt}\n  {pag}")


def main():
    comando = sys.argv[1] if len(sys.argv) > 1 else "buscar"
    if comando == "demo":
        return demo()
    cfg = cargar_json(CONFIG, None)
    if not cfg:
        sys.exit("Falta config.json (copia config.ejemplo.json y complétalo).")
    if comando == "login":
        login(cfg)
    elif comando == "buscar":
        buscar(cfg)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
