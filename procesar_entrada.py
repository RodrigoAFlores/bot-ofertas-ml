#!/usr/bin/env python3
"""Convierte data/entrada.json (lo que manda el celular) en data/ofertas.json y actualiza el historial.

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
MAX_OFERTAS = 40      # ofertas con descuento (las primeras también van como post)
MAX_POPULARES = 10    # más vendidos / más buscados sin descuento (solo historias)


def leer(ruta, defecto):
    return json.loads(ruta.read_text()) if ruta.exists() else defecto


def main():
    entrada = leer(ENTRADA, None)
    if not entrada:
        print("No hay data/entrada.json: no hay nada nuevo que procesar.")
        return
    anterior = leer(OFERTAS, {})
    if anterior.get("generado") == entrada.get("generado"):
        print("Esa recolección ya estaba procesada.")
        return

    generado = datetime.fromisoformat(entrada["generado"].replace("Z", "+00:00"))
    edad_h = (datetime.now(timezone.utc) - generado).total_seconds() / 3600
    if not -1 <= edad_h <= 12:
        sys.exit(f"La recolección tiene una fecha rara ({entrada['generado']}). No la uso.")

    historial = leer(HISTORIAL, {})
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

    # Primero las ofertas con descuento, después los más vendidos. Cada grupo ordenado por su puntaje.
    con_descuento = sorted((o for o in ofertas if o["tipo"] == "oferta"), key=lambda x: x["puntaje"], reverse=True)[:MAX_OFERTAS]
    populares = sorted((o for o in ofertas if o["tipo"] == "popular"), key=lambda x: x["puntaje"], reverse=True)[:MAX_POPULARES]
    ofertas = [{"n": i + 1, **o} for i, o in enumerate(con_descuento + populares)]
    if not ofertas:
        sys.exit("La recolección no trae ofertas nuevas ni rebajadas. Dejo todo como estaba.")

    hoy = generado.astimezone(ZoneInfo("America/Santiago")).strftime("%Y-%m-%d")
    for o in ofertas:
        historial[o["id"]] = {"precio": o["precio"], "fecha": hoy, "titulo": o["titulo"][:60]}

    OFERTAS.write_text(json.dumps({
        "generado": entrada["generado"],
        "total_revisados": int(entrada.get("total_revisados") or 0),
        "ofertas": ofertas,
    }, ensure_ascii=False, indent=2) + "\n")
    HISTORIAL.write_text(json.dumps(historial, ensure_ascii=False, indent=1) + "\n")
    HISTORIAL_PUBLICO.write_text(json.dumps({k: v["precio"] for k, v in historial.items()}, separators=(",", ":")))
    print(f"{len(con_descuento)} ofertas y {len(populares)} más vendidos listos "
          f"({sum(o['motivo'] == 'bajó' for o in ofertas)} rebajados). Historial: {len(historial)}.")


if __name__ == "__main__":
    main()
