#!/usr/bin/env python3
"""Publica en Instagram un post o una historia ya generados.

    python3 publicar.py post 1        → publica el post de la oferta #1
    python3 publicar.py historia 4    → publica la historia de la oferta #4
    python3 publicar.py siguiente     → publica el próximo post pendiente (--probar solo lo muestra)

El token se lee de la variable IG_TOKEN (en GitHub) o de ~/.config/bot-ofertas-ml/ig_token (en el Mac).
Nunca se imprime. Lo publicado queda anotado en data/publicado.json para no repetirlo.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pathlib import Path

BASE = Path(__file__).resolve().parent
API = "https://graph.facebook.com/v21.0"
PLAN = BASE / "docs" / "publicaciones.json"
REGISTRO = BASE / "data" / "publicado.json"
IG_USER_ID = os.environ.get("IG_USER_ID", "17841445164016594")
CHILE = ZoneInfo("America/Santiago")
HORA_INICIO, HORA_FIN = int(os.environ.get("HORA_INICIO", 9)), int(os.environ.get("HORA_FIN", 23))      # publica entre 9:00 y 22:59 hora de Chile (cambia sola con el horario de verano)
MINUTOS_ENTRE_POSTS = int(os.environ.get("MINUTOS_ENTRE_POSTS", 9))           # nunca dos posts seguidos, aunque GitHub ejecute varias veces juntas
DIAS_SIN_REPETIR = 7               # un mismo producto no sale dos veces en esta cantidad de días


def token():
    t = os.environ.get("IG_TOKEN")
    if not t:
        ruta = Path.home() / ".config" / "bot-ofertas-ml" / "ig_token"
        if ruta.exists():
            t = ruta.read_text()
    if not t:
        sys.exit("Falta el token de Instagram.")
    return t.strip()


def llamar(metodo, ruta, **params):
    params["access_token"] = token()
    datos = urllib.parse.urlencode(params)
    url = f"{API}/{ruta}"
    if metodo == "GET":
        req = urllib.request.Request(f"{url}?{datos}")
    else:
        req = urllib.request.Request(url, data=datos.encode(), method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            mensaje = json.loads(e.read()).get("error", {}).get("message", "")
        except Exception:
            mensaje = ""
        sys.exit(f"Instagram rechazó la llamada ({e.code}): {mensaje}")


def publicar(tipo, n):
    plan = json.loads(PLAN.read_text())
    lista = plan["posts"] if tipo == "post" else plan["historias"]
    item = next((x for x in lista if x["n"] == n), None)
    if not item:
        sys.exit(f"No hay {tipo} para la oferta #{n} en el plan de hoy.")

    registro = json.loads(REGISTRO.read_text()) if REGISTRO.exists() else []
    if any(r["imagen"] == item["imagen"] for r in registro):
        sys.exit(f"Ese {tipo} ya se publicó antes. No lo repito.")

    params = {"image_url": f"{plan['base_url']}/{item['imagen']}"}
    if tipo == "post":
        params["caption"] = item["texto"]
    else:
        params["media_type"] = "STORIES"

    contenedor = llamar("POST", f"{IG_USER_ID}/media", **params)["id"]
    for _ in range(20):  # Instagram tarda unos segundos en procesar la imagen
        estado = llamar("GET", contenedor, fields="status_code").get("status_code")
        if estado == "FINISHED":
            break
        if estado == "ERROR":
            sys.exit("Instagram no pudo procesar la imagen.")
        time.sleep(3)
    else:
        sys.exit("Instagram no terminó de procesar la imagen a tiempo.")

    media = llamar("POST", f"{IG_USER_ID}/media_publish", creation_id=contenedor)["id"]
    enlace = llamar("GET", media, fields="permalink").get("permalink", "")

    registro.append({
        "tipo": tipo, "n": n, "titulo": item["titulo"], "imagen": item["imagen"],
        "media_id": media, "enlace": enlace,
        "fecha": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    REGISTRO.parent.mkdir(exist_ok=True)
    REGISTRO.write_text(json.dumps(registro, ensure_ascii=False, indent=2) + "\n")
    print(f"✅ {tipo} #{n} publicado: {enlace or media}")


def normalizar(texto):
    return " ".join(str(texto).lower().split())[:60]


def siguiente(probar=False):
    """Publica el próximo post pendiente. Lo llaman cada 10 minutos; este código decide si toca, repartiendo los posts en el día."""
    ahora = datetime.now(timezone.utc)
    hora_chile = ahora.astimezone(CHILE)
    if not HORA_INICIO <= hora_chile.hour < HORA_FIN:
        print(f"Son las {hora_chile:%H:%M} en Chile: fuera del horario de publicación.")
        return
    plan = json.loads(PLAN.read_text())
    generado = datetime.fromisoformat(plan["generado"].replace("Z", "+00:00"))
    edad_h = (ahora - generado).total_seconds() / 3600
    if edad_h > 30:
        print(f"Las ofertas tienen {edad_h:.0f} horas: no publico precios viejos. Falta recolectar hoy.")
        return
    registro = json.loads(REGISTRO.read_text()) if REGISTRO.exists() else []
    hechas = {r["imagen"] for r in registro}
    limite = ahora - timedelta(days=DIAS_SIN_REPETIR)
    recientes = {normalizar(r["titulo"]) for r in registro
                 if r.get("fecha") and datetime.fromisoformat(r["fecha"]) >= limite}
    pendientes = [p for p in plan["posts"]
                  if p["imagen"] not in hechas and normalizar(p["titulo"]) not in recientes]
    if not pendientes:
        print("No quedan posts nuevos por publicar hoy.")
        return

    # Reparte los posts que quedan en lo que queda del día: espacio = minutos restantes / posts pendientes.
    # Se recalcula en cada llamada, así se ajusta solo si hay más o menos posts. Nunca menos de MINUTOS_ENTRE_POSTS.
    fin = hora_chile.replace(hour=HORA_FIN % 24, minute=0, second=0, microsecond=0)
    if HORA_FIN >= 24 or fin <= hora_chile:
        fin = fin + timedelta(days=1) if fin <= hora_chile else fin
    minutos_restantes = (fin - hora_chile).total_seconds() / 60
    espacio = max(MINUTOS_ENTRE_POSTS, minutos_restantes / len(pendientes))
    fechas = [datetime.fromisoformat(r["fecha"]) for r in registro if r.get("fecha")]
    if fechas:
        minutos = (ahora - max(fechas)).total_seconds() / 60
        # Tolerancia de 5 minutos: el reloj externo llama cada 10, así no se salta una vuelta entera.
        if minutos < max(MINUTOS_ENTRE_POSTS, espacio - 5):
            print(f"El último post salió hace {minutos:.0f} minutos; toca uno cada {espacio:.0f} min "
                  f"({len(pendientes)} pendientes): espero.")
            return
    pendiente = pendientes[0]
    if probar:
        print(f"Prueba: el siguiente sería el post #{pendiente['n']}: {pendiente['titulo']}")
        return
    publicar("post", pendiente["n"])


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "siguiente":
        siguiente(probar="--probar" in sys.argv)
        sys.exit(0)
    if len(sys.argv) != 3 or sys.argv[1] not in ("post", "historia") or not sys.argv[2].isdigit():
        sys.exit(__doc__)
    publicar(sys.argv[1], int(sys.argv[2]))
