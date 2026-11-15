#!/usr/bin/env python3
"""Busca ofertas en la búsqueda pública de Falabella y deja candidatas para crear links de afiliado.

    python3 falabella.py                 → busca y escribe docs/falabella_candidatas.json
    python3 falabella.py --si-hace-falta → solo busca si hoy (hora de Chile) todavía no se buscó

Corre en GitHub (lo llama la tarea de cada 10 minutos). El cálculo es todo con código:
descuento = 1 - precio / precio normal; puntaje = descuento × confianza (reseñas y nota).
El celular toma estas candidatas con el marcador "Recolectar Falabella" y crea los links.
"""
import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = Path(__file__).resolve().parent
SALIDA = BASE / "docs" / "falabella_candidatas.json"
HISTORIAL = BASE / "data" / "historial.json"
CONFIG = json.loads((BASE / "recolector.config.json").read_text())
CHILE = ZoneInfo("America/Santiago")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0 Safari/537.36"

FAL = CONFIG.get("falabella", {})
BUSQUEDAS = FAL.get("busquedas", [
    "audifonos", "smart tv", "notebook", "celular", "freidora de aire", "aspiradora", "cafetera",
    "zapatillas", "perfume", "colchon", "juguetes", "maquillaje", "parlante bluetooth", "smartwatch",
])
DESCUENTO_MINIMO = FAL.get("descuento_minimo", 25)
CANDIDATAS = FAL.get("candidatas", 15)          # se crean links para hasta este número (algunas pueden fallar)
MAX_POR_BUSQUEDA = FAL.get("max_por_busqueda", 2)  # variedad: no más de 2 colchones, 2 perfumes, etc.
NOTA_MINIMA_MARKETPLACE = 4.0                   # regla de Creators: vendedores de marketplace con 4-5 estrellas
VENDEDORES_EXCLUIDOS = re.compile(r"sodimac|tottus", re.I)  # no comisionan


def familia(titulo):
    """Huella de un producto para detectar variantes: 3 primeras palabras con letras (sin números ni plurales).
    'Colchón Ortopedic 1.5 Plazas' y 'Colchón Ortopedic 1 Plaza' dan lo mismo: 'colchon ortopedic plaza'."""
    import unicodedata
    texto = unicodedata.normalize("NFKD", str(titulo).lower()).encode("ascii", "ignore").decode()
    palabras = [re.sub(r"s$", "", p) for p in re.findall(r"[a-z]{3,}", texto)]
    return " ".join(palabras[:3])


def familias_recientes(historial, dias=14):
    """Familias de productos de Falabella que ya salieron en los últimos días."""
    from datetime import date, timedelta
    limite = (date.today() - timedelta(days=dias)).isoformat()
    return {familia(v.get("titulo", "")) for k, v in historial.items() if k.startswith("FAL") and v.get("fecha", "") >= limite}


def precio(texto):
    return int(re.sub(r"\D", "", texto or "") or 0)


def buscar(termino):
    url = "https://www.falabella.com/falabella-cl/search?" + urllib.parse.urlencode({"Ntt": termino})
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "es-CL"})
    with urllib.request.urlopen(req, timeout=40) as r:
        html = r.read().decode("utf-8", "ignore")
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return []
    return json.loads(m.group(1))["props"]["pageProps"].get("results", []) or []


def convertir(r):
    precios = {p.get("type"): precio((p.get("price") or [""])[0]) for p in r.get("prices", [])}
    normal = precios.get("normalPrice", 0)
    # Precio que paga cualquier persona (sin tarjeta CMR): evento o internet.
    actual = precios.get("eventPrice") or precios.get("internetPrice") or 0
    if not (normal and actual and normal > actual):
        return None
    vendedor = r.get("sellerName") or ""
    nota = float(r["rating"]) if r.get("rating") else None
    resenas = int(r.get("totalReviews") or 0)
    if VENDEDORES_EXCLUIDOS.search(vendedor) or r.get("isSponsored"):
        return None
    if vendedor.lower() != "falabella" and (nota or 0) < NOTA_MINIMA_MARKETPLACE:
        return None
    url = (r.get("url") or "").split("?")[0]
    foto = (r.get("mediaUrls") or [None])[0]
    if not (url.startswith("https://www.falabella.com/") and foto and r.get("productId")):
        return None
    descuento = round((1 - actual / normal) * 100)
    return {
        "id": "FAL" + str(r["productId"]),
        "url": url,
        "titulo": " ".join(str(r.get("displayName", "")).split())[:140],
        "marca": r.get("brand") or "",
        "precio": actual,
        "precio_anterior": normal,
        "precio_cmr": precios.get("cmrPrice") or None,
        "descuento_pct": descuento,
        "vendedor": vendedor,
        "nota": round(nota, 1) if nota else None,
        "resenas": resenas,
        "foto": foto,
        "puntaje": round(descuento * (1 + math.log10(resenas + 1)) * ((nota or 4) / 5), 1),
    }


def main():
    hoy = datetime.now(CHILE).strftime("%Y-%m-%d")
    if "--si-hace-falta" in sys.argv and SALIDA.exists():
        if json.loads(SALIDA.read_text()).get("fecha") == hoy:
            print("Las candidatas de Falabella de hoy ya están.")
            return
    historial = json.loads(HISTORIAL.read_text()) if HISTORIAL.exists() else {}
    vistos = {}
    for termino in BUSQUEDAS:
        try:
            for r in buscar(termino):
                o = convertir(r)
                if o and o["id"] not in vistos:
                    vistos[o["id"]] = {**o, "busqueda": termino}
        except Exception as e:  # una búsqueda que falla no detiene las demás
            print(f"  {termino}: {e}")
        time.sleep(1.5)
    ordenadas = sorted(
        (o for o in vistos.values()
         if o["descuento_pct"] >= DESCUENTO_MINIMO
         and (o["id"] not in historial or o["precio"] < historial[o["id"]]["precio"])),
        key=lambda o: o["puntaje"], reverse=True,
    )
    # Variedad: máximo MAX_POR_BUSQUEDA por búsqueda y nada de variantes del mismo producto.
    # Además: nada que sea variante de algo que ya salió en los últimos 14 días (otro color, otra talla).
    elegidas, por_busqueda, parecidos = [], {}, familias_recientes(historial)
    for o in ordenadas:
        parecido = familia(o["titulo"])
        if parecido in parecidos or por_busqueda.get(o["busqueda"], 0) >= MAX_POR_BUSQUEDA:
            continue
        elegidas.append(o)
        parecidos.add(parecido)
        por_busqueda[o["busqueda"]] = por_busqueda.get(o["busqueda"], 0) + 1
        if len(elegidas) >= CANDIDATAS:
            break
    SALIDA.write_text(json.dumps({
        "fecha": hoy,
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "revisados": len(vistos),
        "candidatas": elegidas,
    }, ensure_ascii=False, indent=1) + "\n")
    print(f"Falabella: {len(vistos)} productos con descuento revisados → {len(elegidas)} candidatas.")


if __name__ == "__main__":
    main()
