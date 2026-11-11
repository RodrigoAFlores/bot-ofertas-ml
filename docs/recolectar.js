// Recolector que corre en el celular, sobre el panel de afiliados de Mercado Libre.
// Lo carga el marcador "Recolectar". Elige ofertas sin repetir, crea los links y manda todo a recibir.html.
(async () => {
  const BASE = "https://rodrigoaflores.github.io/bot-ofertas-ml/";
  const CFG = { etiqueta: "flro3183825", descuento_minimo: 20, max_ofertas: 20, paginas: 8,
    consultas: [{ filtros: [] }, { filtros: [{ id: "best_seller", value: true }] }] };

  if (window.__botOfertas) return;
  window.__botOfertas = true;
  const caja = document.createElement("div");
  caja.style.cssText = "position:fixed;z-index:2147483647;left:12px;right:12px;top:12px;background:#101b3b;color:#fff;font:600 16px -apple-system,system-ui,sans-serif;padding:16px;border-radius:14px;box-shadow:0 6px 30px rgba(0,0,0,.5);line-height:1.4";
  document.body.appendChild(caja);
  const decir = (t) => { caja.textContent = "Bot ofertas: " + t; };
  const fallar = (t) => { decir(t); window.__botOfertas = false; };

  try {
    if (!/mercadolibre\.cl$/.test(location.hostname) || !location.pathname.startsWith("/afiliados")) {
      return fallar("abre primero tu panel de afiliados (mercadolibre.cl/afiliados/hub) y vuelve a tocar el marcador.");
    }
    const post = async (ruta, cuerpo) => {
      const r = await fetch(ruta, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo), credentials: "include" });
      let d = null; try { d = await r.json(); } catch (e) {}
      return { status: r.status, d };
    };
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const numero = (t) => {
      const m = /([\d.,]+)\s*(mil|M)?/i.exec(t || ""); if (!m) return 0;
      const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
      return Math.round(n * ((m[2] || "").toLowerCase() === "mil" ? 1000 : m[2] === "M" ? 1e6 : 1));
    };
    const convertir = (card) => {
      const comp = Object.fromEntries((card.components || []).map((c) => [c.type, c]));
      const p = (comp.price && comp.price.price) || {};
      const actual = p.current_price && p.current_price.value;
      const anterior = (p.previous_price && p.previous_price.value) || null;
      if (!actual) return null;
      const chips = (card.components || []).filter((c) => c.type === "chip");
      const tc = chips.map((c) => (c.chip && ((c.chip.pill && c.chip.pill.text) || c.chip.text)) || "").join(" ");
      const com = parseFloat(((/COMISI[ÓO]N\s*([\d.,]+)/i.exec(tc) || [])[1] || "0").replace(",", "."));
      const rev = comp.review_compacted && comp.review_compacted.review_compacted;
      const et = ((rev && rev.values) || []).filter((v) => v.type === "label").map((v) => (v.label && v.label.text) || "");
      const foto = card.pictures && card.pictures.pictures && card.pictures.pictures[0] && card.pictures.pictures[0].id;
      const m = card.metadata || {};
      return { id: m.id, pid: m.pid || m.id, tipo: m.type, url: m.url, extra: m.extra_commission || "false",
        titulo: (comp.title && comp.title.title && comp.title.title.text) || "", precio: actual, precio_anterior: anterior,
        descuento_pct: anterior && anterior > actual ? Math.round((1 - actual / anterior) * 100) : 0,
        comision_pct: com, vendidos: numero(et[1] || (rev && rev.alt_text) || ""), foto_id: foto || null };
    };
    const puntaje = (o) => o.descuento_pct * (1 + o.comision_pct / 10) * Math.log10(o.vendidos + 10);

    decir("leyendo el historial…");
    let HIST = {};
    try { HIST = await (await fetch(BASE + "historial.json?" + Date.now())).json(); } catch (e) {}

    const vistos = new Map();
    let paso = 0;
    for (const c of CFG.consultas) {
      for (let pg = 0; pg < CFG.paginas; pg++) {
        decir("revisando productos (" + (++paso) + " de " + CFG.consultas.length * CFG.paginas + ")…");
        const r = await post("/affiliate-program/api/hub/search?is_affiliate=true&device=desktop", { search: "", sort: "relevance", filters: c.filtros, offset: pg * 18 });
        if (r.status !== 200) return fallar("no pude leer tu panel. Inicia sesión en Mercado Libre en este navegador y vuelve a intentarlo.");
        const cards = (r.d && r.d.polycard_client_model && r.d.polycard_client_model.polycards) || [];
        for (const k of cards) { const o = convertir(k); if (o && o.id && !vistos.has(o.id)) vistos.set(o.id, o); }
        if (cards.length < 18) break;
        await espera(600);
      }
    }
    const candidatas = [...vistos.values()]
      .filter((o) => o.descuento_pct >= CFG.descuento_minimo && o.comision_pct > 0 && o.foto_id)
      .filter((o) => !(o.id in HIST) || o.precio < HIST[o.id])
      .map((o) => ({ ...o, puntaje: Math.round(puntaje(o) * 10) / 10, motivo: o.id in HIST ? "bajó" : "nueva" }))
      .sort((a, b) => b.puntaje - a.puntaje).slice(0, CFG.max_ofertas);
    if (!candidatas.length) return fallar("hoy no encontré ofertas nuevas ni rebajadas (" + vistos.size + " productos revisados).");

    const ofertas = [];
    for (const o of candidatas) {
      decir("creando links (" + (ofertas.length + 1) + " de " + candidatas.length + ")…");
      const r = await post("/affiliate-program/api/v2/affiliates/createLink", { itemId: o.pid, type: o.tipo, extraCommission: o.extra, itemAddToList: o.id, tag: CFG.etiqueta, urls: [o.url] });
      const u = r.d && r.d.urls && r.d.urls[0];
      if (r.status !== 200 || !u || !u.short_url) continue;
      ofertas.push({ id: o.id, titulo: o.titulo.slice(0, 140), precio: o.precio, precio_anterior: o.precio_anterior, comision_pct: o.comision_pct,
        vendidos: o.vendidos, foto_id: o.foto_id, link: u.short_url, codigo: u.regex || null, puntaje: o.puntaje, motivo: o.motivo });
      await espera(400);
    }
    if (!ofertas.length) return fallar("no pude crear los links de afiliado.");

    const texto = JSON.stringify({ v: 1, generado: new Date().toISOString(), total_revisados: vistos.size, ofertas });
    const bytes = new TextEncoder().encode(texto);
    let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    decir(ofertas.length + " ofertas listas. Abriendo la página para enviarlas…");
    location.href = BASE + "recibir.html#" + b64;
  } catch (e) {
    fallar("algo falló: " + e);
  }
})();
