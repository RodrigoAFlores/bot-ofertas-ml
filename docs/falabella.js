// Recolector de Falabella que corre en el celular, sobre el panel de Falabella Creators.
// Lo carga el marcador "Recolectar Falabella". Toma las ofertas que eligió la nube
// (falabella_candidatas.json), crea tus links de afiliado con el generador del panel
// y manda todo a recibir.html, que lo sube a GitHub.
(async () => {
  const BASE = "https://rodrigoaflores.github.io/bot-ofertas-ml/";
  const GENERADOR = "https://creators.falabella.com/publisher/campaign/16240/deeplink_generator";
  const MAXIMO = 10;    // ofertas de Falabella por día
  const POR_TANDA = 5;  // URLs por envío al generador

  if (window.__botFalabella) return;
  window.__botFalabella = true;
  const caja = document.createElement("div");
  caja.style.cssText = "position:fixed;z-index:2147483647;left:12px;right:12px;top:12px;background:#101b3b;color:#fff;font:600 16px -apple-system,system-ui,sans-serif;padding:16px;border-radius:14px;box-shadow:0 6px 30px rgba(0,0,0,.5);line-height:1.4";
  document.body.appendChild(caja);
  const decir = (t) => { caja.textContent = "Bot Falabella: " + t; };
  const fallar = (t) => { decir(t); window.__botFalabella = false; };
  const idDe = (url) => ((url || "").match(/\/product\/(\d+)/) || [])[1];

  try {
    if (location.hostname !== "creators.falabella.com") {
      return fallar("abre primero tu panel de Falabella Creators (creators.falabella.com) y vuelve a tocar el marcador.");
    }
    decir("leyendo las ofertas que eligió el bot…");
    const cand = await (await fetch(BASE + "falabella_candidatas.json?" + Date.now())).json();
    const horas = (Date.now() - new Date(cand.generado).getTime()) / 36e5;
    if (!(cand.candidatas || []).length) return fallar("hoy no hay ofertas nuevas de Falabella.");
    if (horas > 36) return fallar("las ofertas de Falabella tienen más de un día. Espera unos minutos a que el bot las actualice.");

    decir("abriendo el generador de links…");
    const pagina = await (await fetch(GENERADOR, { credentials: "include" })).text();
    const token = (pagina.match(/name="_token"\s+value="([^"]+)"/) || [])[1];
    if (!token) return fallar("no pude abrir el generador. Inicia sesión en Falabella Creators y vuelve a intentarlo.");

    const links = {};
    const lista = cand.candidatas;
    for (let i = 0; i < lista.length; i += POR_TANDA) {
      decir("creando links (" + Math.min(i + POR_TANDA, lista.length) + " de " + lista.length + ")…");
      const cuerpo = new URLSearchParams({ _token: token, list_name: "", urls: lista.slice(i, i + POR_TANDA).map((c) => c.url).join("\n") });
      const r = await fetch(GENERADOR, { method: "POST", body: cuerpo, credentials: "include" });
      const doc = new DOMParser().parseFromString(await r.text(), "text/html");
      for (const fila of doc.querySelectorAll("table tr")) {
        const hrefs = [...fila.querySelectorAll("a")].map((a) => a.getAttribute("href") || "");
        const corto = hrefs.find((h) => /^https:\/\/creators\.falabella\.com\/-[\w-]+$/.test(h));
        const producto = hrefs.map(idDe).find(Boolean);
        if (corto && producto) links[producto] = corto;
      }
      await new Promise((ok) => setTimeout(ok, 800));
    }

    const ofertas = lista
      .filter((c) => links[idDe(c.url)])
      .slice(0, MAXIMO)
      .map((c) => ({ id: c.id, titulo: c.titulo, precio: c.precio, precio_anterior: c.precio_anterior, precio_cmr: c.precio_cmr,
        vendedor: c.vendedor, nota: c.nota, resenas: c.resenas, foto: c.foto, link: links[idDe(c.url)], puntaje: c.puntaje }));
    if (!ofertas.length) return fallar("no pude crear los links de afiliado.");

    const texto = JSON.stringify({ v: 1, tienda: "falabella", generado: new Date().toISOString(), total_revisados: cand.revisados || 0, ofertas });
    const bytes = new TextEncoder().encode(texto);
    let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    decir(ofertas.length + " ofertas listas. Abriendo la página para enviarlas…");
    location.href = BASE + "recibir.html#" + b64;
  } catch (e) {
    fallar("algo falló: " + e);
  }
})();
