#!/usr/bin/env python3
"""Toma la aprobación que Rodrigo mandó desde el celular (data/alerta_aprobada.json) y la deja lista para publicar.

    python3 aprobar_alerta.py   → escribe el id aprobado en la salida estándar (lo usa aprobar.yml)

Revisa que la alerta exista en docs/alertas.json, que sea de hoy y que el link sea de Falabella Creators.
Le pone el link de afiliado y la anota en el historial (para no repetirla en la tanda diaria).
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
ENTRADA = BASE / "data" / "alerta_aprobada.json"
ALERTAS = BASE / "docs" / "alertas.json"
HISTORIAL = BASE / "data" / "historial.json"
HISTORIAL_PUBLICO = BASE / "docs" / "historial.json"
LINK = re.compile(r"^https://creators\.falabella\.com/-[\w-]+$")


def main():
    entrada = json.loads(ENTRADA.read_text())
    alertas = json.loads(ALERTAS.read_text())
    if entrada.get("tienda") != "alerta" or not entrada.get("ofertas"):
        sys.exit("La aprobación no trae una oferta.")
    pedida = entrada["ofertas"][0]
    a = next((x for x in alertas["alertas"] if x["id"] == pedida.get("id")), None)
    if not a:
        sys.exit("Esa oferta no está entre las alertas de hoy (puede ser de otro día).")
    if not LINK.match(str(pedida.get("link", ""))):
        sys.exit("El link de afiliado no es de Falabella Creators.")
    if a.get("estado") == "publicada":
        sys.exit("Esa oferta ya se publicó.")
    a["link"] = pedida["link"]
    a["estado"] = "aprobada"
    a["aprobada"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    ALERTAS.write_text(json.dumps(alertas, ensure_ascii=False, indent=1) + "\n")

    historial = json.loads(HISTORIAL.read_text()) if HISTORIAL.exists() else {}
    historial[a["id"]] = {"precio": a["mejor_precio"], "fecha": alertas["fecha"], "titulo": a["titulo"][:60]}
    HISTORIAL.write_text(json.dumps(historial, ensure_ascii=False, indent=1) + "\n")
    HISTORIAL_PUBLICO.write_text(json.dumps({k: v["precio"] for k, v in historial.items()}, separators=(",", ":")))
    print(a["id"])


if __name__ == "__main__":
    main()
