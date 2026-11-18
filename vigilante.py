#!/usr/bin/env python3
"""Vigilante de ofertas fuertes en Falabella (pre Black Friday, Cyber, etc.).

    python3 vigilante.py              → revisa (cada 30 min como máximo) y avisa al teléfono si hay ofertas muy buenas
    python3 vigilante.py --ya         → revisa ahora aunque no hayan pasado 30 minutos
    python3 vigilante.py --probar     → revisa y muestra qué avisaría, sin mandar avisos ni guardar nada

Todo el cálculo es con código:
  mejor precio  = el menor entre el precio internet/evento y el precio con tarjeta CMR
  descuento     = 1 - mejor precio / precio normal
  baja real     = cuánto bajó respecto del precio más bajo que el bot vio antes (los "precios normales"
                  se inflan antes del Black, por eso la memoria propia vale más que el % de la tienda)

Una oferta es "fuerte" si cumple alguna de estas reglas (y tiene reseñas, o la vende Falabella):
  1. descuento ≥ 55%
  2. baja real ≥ 15% y descuento ≥ 35%
  3. la tarjeta CMR rebaja ≥ 15% extra sobre el precio internet y el descuento ≥ 45%
El aviso llega con la app ntfy (gratis). Rodrigo aprueba desde el aviso; sin su aprobación no se publica nada.
"""
import json
import math
import os
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import comparador
import falabella as fal

BASE = Path(__file__).resolve().parent
PRECIOS = BASE / "data" / "precios_falabella.json"   # memoria de precios: id → precio más bajo visto
ALERTAS = BASE / "docs" / "alertas.json"             # avisos de hoy (los lee la página de aprobar y el marcador)
HISTORIAL = BASE / "data" / "historial.json"
CHILE = ZoneInfo("America/Santiago")
PAGINA = "https://rodrigoaflores.github.io/bot-ofertas-ml"

CFG = fal.CONFIG.get("vigilante", {})
BUSQUEDAS = CFG.get("busquedas", [
    "smart tv", "notebook", "celular", "iphone", "tablet", "audifonos", "parlante bluetooth", "smartwatch",
    "consola", "monitor", "freidora de aire", "aspiradora", "robot aspirador", "cafetera", "refrigerador",
    "lavadora", "microondas", "colchon", "perfume", "maquillaje", "zapatillas", "juguetes", "bicicleta",
    "afeitadora", "secador de pelo",
])
MINUTOS_ENTRE_REVISIONES = CFG.get("minutos_entre_revisiones", 30)
HORA_INICIO, HORA_FIN = CFG.get("hora_inicio", 8), CFG.get("hora_fin", 23)   # no avisa de noche
MAX_POR_REVISION = CFG.get("max_por_revision", 3)
MAX_POR_DIA = CFG.get("max_por_dia", 15)
PRECIO_MINIMO = CFG.get("precio_minimo", 8000)       # nada de ofertas de $2.990
DIAS_MEMORIA = 30
TOPE_DESCUENTO = 80                                  # Soicos prohíbe publicar descuentos sobre 80%


def leer(ruta, defecto):
    return json.loads(ruta.read_text()) if ruta.exists() else defecto


def guardar(ruta, datos):
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n")


def clp(n):
    return "$" + f"{round(n):,}".replace(",", ".")


def evaluar(o, memoria):
    """Devuelve los datos de la alerta si la oferta es fuerte, o None. Solo números, nada de IA."""
    internet, cmr, normal = o["precio"], o.get("precio_cmr") or 0, o["precio_anterior"]
    mejor = min(internet, cmr) if cmr else internet
    if mejor < PRECIO_MINIMO or not normal:
        return None
    if not (o["resenas"] >= 10 or o["vendedor"].lower() == "falabella"):
        return None
    descuento = round((1 - mejor / normal) * 100)
    if descuento > TOPE_DESCUENTO:
        return None  # regla de Soicos: nada de errores de precio ni descuentos "sospechosos"
    extra_cmr = round((1 - cmr / internet) * 100) if cmr and cmr < internet else 0
    antes = memoria.get(o["id"])
    baja_real = round((1 - mejor / antes["min"]) * 100) if antes and antes["min"] > mejor else 0
    motivos = []
    if descuento >= 55:
        motivos.append(f"{descuento}% de descuento")
    if baja_real >= 15 and descuento >= 35:
        motivos.append(f"bajó {baja_real}% desde lo más bajo que vimos ({clp(antes['min'])})")
    if extra_cmr >= 15 and descuento >= 45:
        motivos.append(f"con CMR baja {extra_cmr}% extra")
    if not motivos:
        return None
    # Puntaje para elegir las mejores si hay muchas: descuento, baja real y reseñas (señal de ventas).
    puntaje = round((descuento + 2 * baja_real + extra_cmr) * (1 + math.log10(o["resenas"] + 1)) ** 1.2, 1)
    return {"mejor_precio": mejor, "descuento_total": descuento, "extra_cmr": extra_cmr,
            "baja_real": baja_real, "motivo": " · ".join(motivos), "puntaje_alerta": puntaje}


def avisar(topico, a):
    """Manda la notificación al teléfono con ntfy (con foto y botones)."""
    aprobar = f"{PAGINA}/aprobar.html#{a['id']}"
    if a.get("comparado"):  # oferta real de otra tienda (comparador.py): se compara con las demás tiendas
        precio = f"{clp(a['mejor_precio'])} en {a['nombre_tienda']} · " + " · ".join(
            f"{c['tienda']} {clp(c['precio'])}" for c in a["comparado"][:2])
        titulo = f"💰 {a['descuento_total']}% más barato en {a['nombre_tienda']}"
    else:
        con_cmr = a.get("precio_cmr") and a["precio_cmr"] <= a["precio"]
        precio = f"{clp(a['mejor_precio'])}{' con CMR' if con_cmr else ''} (antes {clp(a['precio_anterior'])})"
        titulo = f"🔥 {a['descuento_total']}% OFF en Falabella"
    cuerpo = {
        "topic": topico,
        "title": titulo,
        "message": f"{a['titulo']}\n{precio}\n{a['motivo']}",
        "tags": ["moneybag"],
        "priority": 4,
        "click": aprobar,
        "attach": a["foto"],
        "actions": [
            {"action": "view", "label": "✅ Revisar y aprobar", "url": aprobar, "clear": True},
            {"action": "view", "label": f"Ver en {a.get('nombre_tienda', 'Falabella')}", "url": a["url"]},
        ],
    }
    req = urllib.request.Request("https://ntfy.sh/", data=json.dumps(cuerpo).encode(),
                                 headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status == 200


def ofertas_reales(alertas, historial, ahora, forzar=False):
    """Ofertas REALES de otras tiendas (hoy: Líder) con el comparador de SoloTodo. Corre cada 2 horas."""
    ultima = alertas.get("ultima_comparacion")
    if ultima and not forzar and (ahora - datetime.fromisoformat(ultima)).total_seconds() < CFG.get("minutos_comparador", 120) * 60:
        return []
    alertas["ultima_comparacion"] = ahora.isoformat(timespec="seconds")
    ya_avisadas = {a["id"]: a for a in alertas["alertas"]}
    elegidas = []
    for tienda in CFG.get("tiendas_comparador", ["lider"]):
        del_dia = sum(1 for a in alertas["alertas"] if a.get("tienda") == tienda)
        cupo = max(0, min(CFG.get("max_por_revision_comparador", 2), CFG.get("max_por_dia_comparador", 10) - del_dia))
        try:
            ofertas = comparador.buscar(tienda)
        except Exception as e:
            print(f"  El comparador de {tienda} falló: {e}")
            continue
        nuevas = []
        for o in ofertas:
            previa = ya_avisadas.get(o["id"])
            if previa and o["mejor_precio"] > previa["mejor_precio"] * 0.95:
                continue
            publicada = historial.get(o["id"])
            if publicada and o["mejor_precio"] >= publicada["precio"]:
                continue
            if len(nuevas) >= cupo:
                break
            nuevas.append(o)
        print(f"Comparador {tienda}: {len(ofertas)} ofertas reales, aviso {len(nuevas)}.")
        elegidas += nuevas
    return elegidas


def topico_ntfy():
    if os.environ.get("NTFY_TOPIC"):
        return os.environ["NTFY_TOPIC"].strip()
    ruta = Path.home() / ".config" / "bot-ofertas-ml" / "ntfy_topic"
    return ruta.read_text().strip() if ruta.exists() else ""


def main():
    probar, ya = "--probar" in sys.argv, "--ya" in sys.argv
    ahora = datetime.now(timezone.utc)
    hora_chile = ahora.astimezone(CHILE)
    hoy = hora_chile.strftime("%Y-%m-%d")
    if not (probar or ya) and not HORA_INICIO <= hora_chile.hour < HORA_FIN:
        print(f"Son las {hora_chile:%H:%M} en Chile: el vigilante descansa de noche.")
        return
    memoria = leer(PRECIOS, {})
    alertas = leer(ALERTAS, {})
    if alertas.get("fecha") != hoy:
        alertas = {"fecha": hoy, "alertas": []}
    ultima = alertas.get("ultima_revision")
    if ultima and not (probar or ya):
        minutos = (ahora - datetime.fromisoformat(ultima)).total_seconds() / 60
        if minutos < MINUTOS_ENTRE_REVISIONES:
            print(f"La última revisión fue hace {minutos:.0f} min: espero a los {MINUTOS_ENTRE_REVISIONES}.")
            return

    vistos = {}
    for termino in BUSQUEDAS:
        try:
            for r in fal.buscar(termino):
                o = fal.convertir(r)
                if o and o["id"] not in vistos:
                    vistos[o["id"]] = {**o, "busqueda": termino}
        except Exception as e:  # una búsqueda que falla no detiene las demás
            print(f"  {termino}: {e}")
        time.sleep(1.2)
    if not vistos:
        print("Falabella no respondió: no reviso nada esta vez.")
        return

    historial = leer(HISTORIAL, {})
    ya_avisadas = {a["id"]: a for a in alertas["alertas"]}
    fuertes = []
    for o in vistos.values():
        ev = evaluar(o, memoria)
        if not ev:
            continue
        previa = ya_avisadas.get(o["id"])
        if previa and ev["mejor_precio"] > previa["mejor_precio"] * 0.95:
            continue  # ya avisada hoy y no bajó más de 5%
        publicada = historial.get(o["id"])
        if publicada and ev["mejor_precio"] >= publicada["precio"]:
            continue  # ya salió en Instagram y no está más barata
        fuertes.append({**o, **ev})
    fuertes.sort(key=lambda a: a["puntaje_alerta"], reverse=True)

    # Variedad: no dos variantes del mismo producto (otra talla o color) en la misma revisión.
    # Tampoco algo que ya salió en Instagram en los últimos 14 días, ni dos del mismo tipo (dos colchones) a la vez.
    elegidas, familias, tipos = [], fal.familias_recientes(historial), set()
    cupo = max(0, min(MAX_POR_REVISION, MAX_POR_DIA - len(alertas["alertas"])))
    for a in fuertes:
        f = fal.familia(a["titulo"])
        if f in familias or a["busqueda"] in tipos or len(elegidas) >= cupo:
            continue
        familias.add(f)
        tipos.add(a["busqueda"])
        elegidas.append(a)

    elegidas += ofertas_reales(alertas, historial, ahora, forzar=probar or ya)

    print(f"Revisados {len(vistos)} productos de Falabella: {len(fuertes)} ofertas fuertes, aviso {len(elegidas)}"
          f"{' (primera revisión: el bot recién empieza a recordar precios)' if not memoria else ''}.")
    for a in elegidas:
        print(f"  {a['descuento_total']}% · {clp(a['mejor_precio'])} · {a['titulo'][:60]} · {a['motivo']}")
    if probar:
        return

    topico = topico_ntfy()
    for a in elegidas:
        a.update({"hora": hora_chile.strftime("%H:%M"), "visto": ahora.isoformat(timespec="seconds"), "estado": "avisada"})
        try:
            if topico:
                avisar(topico, a)
            else:
                print("  Falta NTFY_TOPIC: no pude mandar el aviso al teléfono.")
        except Exception as e:
            print(f"  No se pudo mandar el aviso: {e}")
        alertas["alertas"] = [x for x in alertas["alertas"] if x["id"] != a["id"]] + [a]

    # Memoria de precios: el más bajo visto en los últimos 30 días.
    limite = (ahora - timedelta(days=DIAS_MEMORIA)).date().isoformat()
    for o in vistos.values():
        mejor = min(o["precio"], o["precio_cmr"]) if o.get("precio_cmr") else o["precio"]
        m = memoria.get(o["id"])
        if not m or m["fecha_min"] < limite or mejor < m["min"]:
            memoria[o["id"]] = {"min": mejor, "fecha_min": hoy}
        memoria[o["id"]]["visto"] = hoy
    memoria = {k: v for k, v in memoria.items() if v["visto"] >= limite}
    alertas["ultima_revision"] = ahora.isoformat(timespec="seconds")
    guardar(PRECIOS, memoria)
    guardar(ALERTAS, alertas)


if __name__ == "__main__":
    main()
