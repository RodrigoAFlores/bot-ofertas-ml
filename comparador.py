#!/usr/bin/env python3
"""Buscador de descuentos REALES: compara el precio de una tienda con el de las demás tiendas grandes de Chile.

    python3 comparador.py              → muestra las ofertas reales de las tiendas vigiladas (hoy: Líder)
    python3 comparador.py --tienda paris

Usa la API pública de SoloTodo (api.solotodo.com, sin clave), que sigue los precios de ~370 tiendas chilenas
(Líder, Paris, Falabella, Ripley, Mercado Libre, Hites...) con su historial diario. Se usa con moderación:
unas 30 consultas cada 2 horas. Lo llama vigilante.py.

Todo el cálculo es con código. Una oferta es REAL si:
  1. el precio en la tienda vigilada es al menos 12% más barato que el más barato del resto de las tiendas grandes, y
  2. ese precio no está inflado: es menor o igual a la mediana de los últimos 30 días en la misma tienda.
"""
import json
import statistics
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
CONFIG = json.loads((BASE / "recolector.config.json").read_text()).get("comparador", {})
API = "https://api.solotodo.com"
UA = "bot-ofertas-chile/1.0 (comparador de precios)"

# Tiendas grandes con las que se compara (id de SoloTodo → nombre para mostrar).
TIENDAS = {43: "Líder", 11: "Paris", 9: "Falabella", 18: "Ripley", 260: "Mercado Libre", 87: "Hites", 5: "ABC"}
VIGILADAS = {"lider": 43, "paris": 11, "falabella": 9, "ripley": 18, "hites": 87}
CATEGORIAS = CONFIG.get("categorias", {
    11: "Televisores", 6: "Celulares", 1: "Notebooks", 14: "Tablets", 50: "Audífonos y Headsets", 33: "Consolas",
    48: "Wearables", 256: "Air fryers", 18: "Aspiradoras", 219: "Cafeteras", 15: "Refrigeradores",
    19: "Lavadoras y Secadoras", 17: "Hornos y Microondas", 4: "Monitores", 780: "Perfumes",
})
AHORRO_MINIMO = CONFIG.get("ahorro_minimo", 12)       # % más barato que la siguiente tienda más barata
PRECIO_MINIMO = CONFIG.get("precio_minimo", 15000)
POR_CATEGORIA = CONFIG.get("productos_por_categoria", 40)


def get(ruta, **params):
    url = f"{API}/{ruta}?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def precios_por_tienda(producto):
    """{id_tienda: entidad más barata disponible y nueva} de un producto."""
    mejores = {}
    for e in producto["entities"]:
        r = e.get("active_registry") or {}
        if not r.get("is_available") or e["store"] not in TIENDAS or e.get("cell_plan"):
            continue
        if e.get("condition") and "NewCondition" not in e["condition"]:
            continue  # nada de reacondicionados
        precio = float(r["offer_price"])
        if e["store"] not in mejores or precio < mejores[e["store"]]["precio"]:
            mejores[e["store"]] = {"precio": precio, "normal": float(r["normal_price"]), "entidad": e}
    return mejores


def mediana_30_dias(id_entidad):
    desde = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
    historia = get(f"entities/{id_entidad}/pricing_history/", timestamp_after=desde)
    precios = [float(h["offer_price"]) for h in historia if h.get("is_available")]
    return (statistics.median(precios), min(precios), len(precios)) if precios else (None, None, 0)


def buscar(tienda="lider", avisar=print):
    """Devuelve ofertas reales de una tienda, de mejor a peor."""
    id_tienda = VIGILADAS[tienda]
    candidatas = []
    for id_cat, nombre_cat in CATEGORIAS.items():
        try:
            lista = get("products/browse/", categories=id_cat, stores=id_tienda, countries=1, page_size=POR_CATEGORIA)
            ids = [pe["product"]["id"] for r in lista["results"] for pe in r["product_entries"]]
            if not ids:
                continue
            datos = get("products/available_entities/", ids=ids, countries=1, page_size=len(ids))
        except Exception as e:  # una categoría que falla no detiene las demás
            avisar(f"  {nombre_cat}: {e}")
            continue
        for p in datos["results"]:
            precios = precios_por_tienda(p)
            if id_tienda not in precios or len(precios) < 2:
                continue
            propio = precios[id_tienda]
            otras = sorted((v["precio"], TIENDAS[k]) for k, v in precios.items() if k != id_tienda)
            ahorro = round((1 - propio["precio"] / otras[0][0]) * 100)
            if propio["precio"] < PRECIO_MINIMO or ahorro < AHORRO_MINIMO or ahorro > 80:
                continue
            candidatas.append({"p": p, "cat": nombre_cat, "propio": propio, "otras": otras, "ahorro": ahorro})
        time.sleep(1)

    # Solo para las candidatas se pide el historial (para no cargar a SoloTodo).
    reales = []
    for c in sorted(candidatas, key=lambda c: c["ahorro"], reverse=True)[:CONFIG.get("max_historiales", 15)]:
        e = c["propio"]["entidad"]
        try:
            mediana, minimo, dias = mediana_30_dias(e["id"])
        except Exception:
            continue
        if mediana and c["propio"]["precio"] > mediana:
            continue  # precio inflado respecto de su propio último mes
        baja = round((1 - c["propio"]["precio"] / mediana) * 100) if mediana else 0
        motivo = f"{c['ahorro']}% más barato que en {c['otras'][0][1]} ({clp(c['otras'][0][0])})"
        if baja >= 5:
            motivo += f" · bajó {baja}% en el último mes"
        reales.append({
            "id": f"ST{e['id']}", "tienda": tienda, "nombre_tienda": TIENDAS[id_tienda], "categoria_st": c["cat"],
            "url": e["external_url"], "titulo": " ".join(c["p"]["product"]["name"].split())[:140],
            "foto": (e.get("picture_urls") or [None])[0],
            "precio": c["propio"]["normal"], "precio_tarjeta": c["propio"]["precio"] if c["propio"]["precio"] < c["propio"]["normal"] else None,
            "mejor_precio": c["propio"]["precio"],
            "comparado": [{"tienda": t, "precio": v} for v, t in c["otras"][:3]],
            "precio_anterior": c["otras"][0][0], "descuento_total": c["ahorro"], "baja_mes": baja,
            "motivo": motivo, "vendedor": TIENDAS[id_tienda], "resenas": 0, "nota": None,
            "puntaje_alerta": round(c["ahorro"] + baja + 3 * len(c["otras"]), 1),
        })
        time.sleep(0.5)
    return sorted((r for r in reales if r["foto"]), key=lambda r: r["puntaje_alerta"], reverse=True)


def comparar(titulo, id_producto, id_tienda=9):
    """Busca en SoloTodo un producto de una tienda (por defecto Falabella) y devuelve los precios de las demás.
    [(precio, tienda), ...] de menor a mayor, [] si solo lo vende esa tienda, o None si SoloTodo no lo tiene
    (ropa, colchones y otras categorías que SoloTodo no sigue)."""
    lista = get("products/browse/", search=titulo[:60], stores=id_tienda, countries=1, page_size=5)
    ids = [pe["product"]["id"] for r in lista["results"] for pe in r["product_entries"]]
    if not ids:
        return None
    datos = get("products/available_entities/", ids=ids, countries=1, page_size=len(ids))
    for p in datos["results"]:
        if any(e["store"] == id_tienda and str(id_producto) in (e.get("external_url") or "") + (e.get("sku") or "")
               for e in p["entities"]):
            return sorted((v["precio"], TIENDAS[k]) for k, v in precios_por_tienda(p).items() if k != id_tienda)
    return None


def clp(n):
    return "$" + f"{round(n):,}".replace(",", ".")


if __name__ == "__main__":
    tienda = sys.argv[sys.argv.index("--tienda") + 1] if "--tienda" in sys.argv else "lider"
    ofertas = buscar(tienda)
    print(f"{len(ofertas)} ofertas reales en {TIENDAS[VIGILADAS[tienda]]}:")
    for o in ofertas[:15]:
        print(f"  {o['descuento_total']}% · {clp(o['mejor_precio'])} · {o['titulo'][:55]} · {o['motivo']}")
