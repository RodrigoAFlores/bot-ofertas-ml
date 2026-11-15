#!/usr/bin/env python3
"""Convierte lo que manda el celular (data/entrada.json de Mercado Libre y data/entrada_falabella.json)
en data/ofertas.json y actualiza el historial.

Corre en GitHub cada vez que llega una recolección nueva. Todo el cálculo se hace aquí, con código:
vuelve a aplicar la regla de no repetir, recalcula el descuento y numera las ofertas.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

BASE = Path(os.environ.get("BOT_BASE") or Path(__file__).resolve().parent)
ENTRADA = BASE / "data" / "entrada.json"
OFERTAS = BASE / "data" / "ofertas.json"
HISTORIAL = BASE / "data" / "historial.json"
HISTORIAL_PUBLICO = BASE / "docs" / "historial.json"
FAL_ENTRADA = BASE / "data" / "entrada_falabella.json"   # lo que manda el marcador de Falabella
FAL_OFERTAS = BASE / "data" / "falabella_ofertas.json"   # Falabella ya procesado (para no repetir el trabajo)
MAX_FALABELLA = 20
MAX_OFERTAS = 20      # ofertas de Mercado Libre con descuento (todas van como post e historia)
MAX_POPULARES = 10    # más vendidos / más buscados sin descuento (solo historias, "TOP #")


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


def leer(ruta, defecto):
    return json.loads(ruta.read_text()) if ruta.exists() else defecto


def edad_horas(iso):
    return (datetime.now(timezone.utc) - datetime.fromisoformat(iso.replace("Z", "+00:00"))).total_seconds() / 3600


def procesar_mercadolibre(entrada, historial):
    """Valida la recolección de Mercado Libre y aplica la regla de no repetir. Devuelve (ofertas, populares)."""
    ofertas = []
    for o in entrada.get("ofertas", []):
        try:
            precio, antes = int(o["precio"]), int(o.get("precio_anterior") or 0)
            popular = o.get("tipo") == "popular"
            valida = (
                re.fullmatch(r"MLC\d+", o["id"])
                and re.fullmatch(r"https://meli\.la/\w+", o["link"])
                and re.fullmatch(r"[\w-]+", o["foto_id"])
                and precio > 0 and (popular or antes > precio)
            )
        except (KeyError, TypeError, ValueError):
            valida = False
        if not valida:
            continue
        previo = historial.get(o["id"])
        if previo and precio >= previo["precio"]:
            continue  # ya salió y no está más barata
        ofertas.append({
            "id": o["id"],
            "tienda": "mercadolibre",
            "titulo": " ".join(str(o["titulo"]).split())[:140],
            "precio": precio,
            "precio_anterior": antes if antes > precio else None,
            "descuento_pct": round((1 - precio / antes) * 100) if antes > precio else 0,
            "tipo": "popular" if popular else "oferta",
            "destacado": o.get("destacado") if o.get("destacado") in ("MÁS VENDIDO", "MÁS BUSCADO") else ("MÁS VENDIDO" if popular else None),
            "nota": float(o["nota"]) if isinstance(o.get("nota"), (int, float)) and 0 < o["nota"] <= 5 else None,
            "comision_pct": float(o.get("comision_pct") or 0),
            "vendidos": int(o.get("vendidos") or 0),
            "foto": f"https://http2.mlstatic.com/D_NQ_NP_2X_{o['foto_id']}-F.webp",
            "link": o["link"],
            "codigo_busqueda": o.get("codigo"),
            "puntaje": float(o.get("puntaje") or 0),
            "motivo": "bajó" if previo else "nueva",
        })
    con_descuento = sorted((o for o in ofertas if o["tipo"] == "oferta"), key=lambda x: x["puntaje"], reverse=True)[:MAX_OFERTAS]
    populares = sorted((o for o in ofertas if o["tipo"] == "popular"), key=lambda x: x["puntaje"], reverse=True)[:MAX_POPULARES]
    return con_descuento, populares


def procesar_falabella(entrada, historial):
    """Valida el envío de Falabella (links ya creados en el panel) y aplica la regla de no repetir,
    también para variantes del mismo producto (otra talla, otro color) que ya salieron."""
    ofertas = []
    vistas = familias_recientes(historial)
    for o in entrada.get("ofertas", []):
        try:
            precio, antes = int(o["precio"]), int(o.get("precio_anterior") or 0)
            valida = (
                re.fullmatch(r"FAL\d+", o["id"])
                and re.fullmatch(r"https://creators\.falabella\.com/-[\w-]+", o["link"])
                and re.fullmatch(r"https://media\.falabella\.com/[\w/.-]+", o["foto"])
                and 0 < precio < antes
            )
        except (KeyError, TypeError, ValueError):
            valida = False
        if not valida:
            continue
        previo = historial.get(o["id"])
        if previo and precio >= previo["precio"]:
            continue
        if not previo and familia(o["titulo"]) in vistas:
            continue  # variante de algo que ya salió
        vistas.add(familia(o["titulo"]))
        nota = o.get("nota")
        ofertas.append({
            "id": o["id"],
            "tienda": "falabella",
            "titulo": " ".join(str(o["titulo"]).split())[:140],
            "precio": precio,
            "precio_anterior": antes,
            "precio_cmr": int(o["precio_cmr"]) if isinstance(o.get("precio_cmr"), int) and 0 < o["precio_cmr"] < precio else None,
            "descuento_pct": round((1 - precio / antes) * 100),
            "tipo": "oferta",
            "nota": float(nota) if isinstance(nota, (int, float)) and 0 < nota <= 5 else None,
            "vendedor": str(o.get("vendedor") or "")[:60],
            "foto": o["foto"],
            "link": o["link"],
            "puntaje": float(o.get("puntaje") or 0),
            "motivo": "bajó" if previo else "nueva",
        })
    return sorted(ofertas, key=lambda x: x["puntaje"], reverse=True)[:MAX_FALABELLA]


def anotar(historial, lista, generado):
    hoy = datetime.fromisoformat(generado.replace("Z", "+00:00")).astimezone(ZoneInfo("America/Santiago")).strftime("%Y-%m-%d")
    for o in lista:
        historial[o["id"]] = {"precio": o["precio"], "fecha": hoy, "titulo": o["titulo"][:60]}


def main():
    anterior = leer(OFERTAS, {})
    historial = leer(HISTORIAL, {})
    cambios = []

    # 1) Mercado Libre: solo si llegó una recolección nueva; si no, se mantiene la de hoy.
    entrada = leer(ENTRADA, None)
    previas = [o for o in anterior.get("ofertas", []) if o.get("tienda", "mercadolibre") != "falabella"]
    ml_ofertas = [o for o in previas if o["tipo"] == "oferta"]
    ml_populares = [o for o in previas if o["tipo"] == "popular"]
    generado = anterior.get("generado")
    total = anterior.get("total_revisados", 0)
    if entrada and entrada.get("generado") != anterior.get("generado"):
        if not -1 <= edad_horas(entrada["generado"]) <= 12:
            sys.exit(f"La recolección tiene una fecha rara ({entrada['generado']}). No la uso.")
        ml_ofertas, ml_populares = procesar_mercadolibre(entrada, historial)
        if not ml_ofertas and not ml_populares:
            sys.exit("La recolección no trae ofertas nuevas ni rebajadas. Dejo todo como estaba.")
        anotar(historial, ml_ofertas + ml_populares, entrada["generado"])
        generado, total = entrada["generado"], int(entrada.get("total_revisados") or 0)
        cambios.append(f"{len(ml_ofertas)} ofertas y {len(ml_populares)} más vendidos de Mercado Libre")

    # 2) Falabella: si llegó un envío nuevo, se procesa una vez y se guarda aparte.
    fal_entrada = leer(FAL_ENTRADA, None)
    fal_guardado = leer(FAL_OFERTAS, {})
    if fal_entrada and fal_entrada.get("generado") != fal_guardado.get("generado") and -1 <= edad_horas(fal_entrada["generado"]) <= 12:
        fal_lista = procesar_falabella(fal_entrada, historial)
        anotar(historial, fal_lista, fal_entrada["generado"])
        fal_guardado = {"generado": fal_entrada["generado"], "ofertas": fal_lista}
        FAL_OFERTAS.write_text(json.dumps(fal_guardado, ensure_ascii=False, indent=1) + "\n")
        cambios.append(f"{len(fal_lista)} ofertas de Falabella")
    falabella = fal_guardado.get("ofertas", []) if fal_guardado.get("generado") and edad_horas(fal_guardado["generado"]) <= 24 else []

    if not cambios:
        print("No hay recolecciones nuevas que procesar.")
        return

    # 3) Unir: Mercado Libre → más vendidos → Falabella al final. Así, cuando llega Falabella más tarde,
    #    ninguna oferta que ya estaba cambia de número (antes los más vendidos se corrían y se mezclaban).
    lista = [{**o, "n": None} for o in ml_ofertas + ml_populares + falabella]
    for i, o in enumerate(lista):
        o["n"] = i + 1
    OFERTAS.write_text(json.dumps({
        "generado": generado or fal_guardado.get("generado"),
        "total_revisados": total,
        "ofertas": [{"n": o.pop("n"), **o} for o in lista],
    }, ensure_ascii=False, indent=2) + "\n")
    HISTORIAL.write_text(json.dumps(historial, ensure_ascii=False, indent=1) + "\n")
    HISTORIAL_PUBLICO.write_text(json.dumps({k: v["precio"] for k, v in historial.items()}, separators=(",", ":")))
    print("Procesado: " + " y ".join(cambios) + f". Total: {len(lista)}. Historial: {len(historial)}.")


if __name__ == "__main__":
    main()
