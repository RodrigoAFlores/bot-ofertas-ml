// Recolector de Falabella que corre en el celular, sobre el panel de Falabella Creators.
// Lo carga el marcador "Recolectar Falabella". Toma las ofertas que eligió la nube
// (falabella_candidatas.json), crea tus links de afiliado con el generador del panel
// y manda todo a recibir.html, que lo sube a GitHub.
(async () => {
  const BASE = "https://rodrigoaflores.github.io/bot-ofertas-ml/";
  const GENERADOR = "https://creators.falabella.com/publisher/campaign/16240/deeplink_generator";
  const MAXIMO = 20;    // ofertas de Falabella por día
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
    const enviar = (datos) => {
      const bytes = new TextEncoder().encode(JSON.stringify(datos));
      let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      location.href = BASE + "recibir.html#" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
    const abrirGenerador = async () => {
      const pagina = await (await fetch(GENERADOR, { credentials: "include" })).text();
      return (pagina.match(/name="_token"\s+value="([^"]+)"/) || [])[1];
    };
    const crearLinks = async (token, urls, links) => {
      const cuerpo = new URLSearchParams({ _token: token, list_name: "", urls: urls.join("\n") });
      const r = await fetch(GENERADOR, { method: "POST", body: cuerpo, credentials: "include" });
      const doc = new DOMParser().parseFromString(await r.text(), "text/html");
      for (const fila of doc.querySelectorAll("table tr")) {
        const hrefs = [...fila.querySelectorAll("a")].map((a) => a.getAttribute("href") || "");
        const corto = hrefs.find((h) => /^https:\/\/creators\.falabella\.com\/-[\w-]+$/.test(h));
        const producto = hrefs.map(idDe).find(Boolean);
        if (corto && producto) links[producto] = corto;
      }
    };

    // OFERTA FLASH: Rodrigo tocó "Aprobar" en el aviso del teléfono → se crea el link de esa sola oferta.
    const flash = (location.hash.match(/bot-alerta=([\w-]+)/) || [])[1];
    if (flash) {
      decir("creando el link de la oferta flash que aprobaste…");
      const al = await (await fetch(BASE + "alertas.json?" + Date.now(), { cache: "no-store" })).json();
      const a = (al.alertas || []).find((x) => x.id === flash);
      if (!a) return fallar("no encontré esa oferta flash (puede ser de otro día).");
      if (a.estado !== "avisada") return fallar("esa oferta flash ya fue aprobada antes. No hace falta repetir.");
      const token = await abrirGenerador();
      if (!token) return fallar("no pude abrir el generador. Inicia sesión en Falabella Creators y vuelve a tocar el marcador.");
      const links = {};
      await crearLinks(token, [a.url], links);
      const link = links[idDe(a.url)];
      if (!link) return fallar("Falabella no creó el link (puede que ese producto no comisione).");
      decir("link listo. Enviando tu aprobación…");
      return enviar({ v: 1, tienda: "alerta", generado: new Date().toISOString(), total_revisados: 1,
        ofertas: [{ id: a.id, titulo: a.titulo, precio: a.mejor_precio, foto: a.foto, link }] });
    }

    decir("leyendo las ofertas que eligió el bot…");
    const cand = await (await fetch(BASE + "falabella_candidatas.json?" + Date.now())).json();
    const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
    if (cand.fecha !== hoy) return fallar("las ofertas de Falabella de hoy todavía no están listas. Prueba de nuevo en 15 minutos.");
    if (!(cand.candidatas || []).length) return fallar("hoy no hay ofertas nuevas de Falabella.");

    decir("abriendo el generador de links…");
    const token = await abrirGenerador();
    if (!token) return fallar("no pude abrir el generador. Inicia sesión en Falabella Creators y vuelve a intentarlo.");

    const links = {};
    const lista = cand.candidatas;
    for (let i = 0; i < lista.length; i += POR_TANDA) {
      decir("creando links (" + Math.min(i + POR_TANDA, lista.length) + " de " + lista.length + ")…");
      await crearLinks(token, lista.slice(i, i + POR_TANDA).map((c) => c.url), links);
      await new Promise((ok) => setTimeout(ok, 800));
    }

    const ofertas = lista
      .filter((c) => links[idDe(c.url)])
      .slice(0, MAXIMO)
      .map((c) => ({ id: c.id, titulo: c.titulo, precio: c.precio, precio_anterior: c.precio_anterior, precio_cmr: c.precio_cmr,
        vendedor: c.vendedor, nota: c.nota, resenas: c.resenas, foto: c.foto, link: links[idDe(c.url)], puntaje: c.puntaje }));
    if (!ofertas.length) return fallar("no pude crear los links de afiliado.");

    decir(ofertas.length + " ofertas listas. Abriendo la página para enviarlas…");
    enviar({ v: 1, tienda: "falabella", generado: new Date().toISOString(), total_revisados: cand.revisados || 0, ofertas });
  } catch (e) {
    fallar("algo falló: " + e);
  }
})();
