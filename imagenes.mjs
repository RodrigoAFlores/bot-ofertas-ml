// Arma las imágenes (post e historia), los textos y la página "ofertas de hoy".
//
//   node imagenes.mjs                              → usa data/ofertas.json y escribe en docs/
//   node imagenes.mjs --datos X.json --salida DIR  → para pruebas
//
// Las imágenes se dibujan con el Chrome instalado (HTML → foto), sin IA: todo sale de los datos.

import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { categoria, CATEGORIAS } from "./categorias.mjs";

const BASE = dirname(fileURLToPath(import.meta.url));
const arg = (nombre, defecto) => {
  const i = process.argv.indexOf(nombre);
  return i > -1 ? process.argv[i + 1] : defecto;
};

const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dos = (n) => String(n).padStart(2, "0");
// Logos de las tiendas, incrustados en el HTML (así no dependen de internet).
const logo = (archivo) => "data:image/png;base64," + readFileSync(join(BASE, "marcas", archivo)).toString("base64");
const LOGOS = { mercadolibre: logo("mercadolibre.png"), falabella: logo("falabella.png") };
const logoTienda = (o) => `<div class="logo ${o.tienda === "falabella" ? "fal" : "ml"}"><img src="${LOGOS[o.tienda === "falabella" ? "falabella" : "mercadolibre"]}" alt=""></div>`;

const vendidosTexto = (v) => (v >= 1000 ? `${Math.round(v / 1000).toLocaleString("es-CL")} mil` : String(v));

export function tarjeta(o, formato) {
  const historia = formato === "historia";
  const alto = historia ? 1920 : 1350;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1080px; height: ${alto}px; background: #101b3b; color: #fff; display: flex; flex-direction: column;
         font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif; padding: ${historia ? "150px 70px 170px" : "60px"}; }
  .arriba { display: flex; justify-content: space-between; align-items: center; }
  .logo { background: #fff; border-radius: 28px; height: 116px; padding: 10px 30px; display: flex; align-items: center; }
  .logo img { height: 96px; } .logo.fal img { height: 58px; }
  .tag { font-size: 34px; font-weight: 700; background: rgba(255,255,255,.12); padding: 14px 30px; border-radius: 999px; }
  .foto { flex: 1; min-height: 0; margin: 40px 0; background: #fff; border-radius: 48px; position: relative;
          display: flex; align-items: center; justify-content: center; padding: 50px; }
  .foto img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .off { position: absolute; top: -26px; right: -18px; background: #e8003d; color: #fff; font-weight: 900; font-size: 92px;
         line-height: 1; padding: 28px 36px; border-radius: 40px; transform: rotate(4deg); text-align: center; }
  .off small { display: block; font-size: 38px; font-weight: 800; }
  h1 { font-size: 50px; line-height: 1.18; font-weight: 700; display: -webkit-box; -webkit-line-clamp: 2;
       -webkit-box-orient: vertical; overflow: hidden; }
  .precios { display: flex; align-items: baseline; gap: 28px; margin-top: 22px; }
  .ahora { font-size: 116px; font-weight: 900; color: #ffd400; letter-spacing: -2px; }
  .antes { font-size: 50px; opacity: .7; text-decoration: line-through; }
  .libre { height: 260px; display: flex; align-items: center; justify-content: center; }  /* espacio para el link en la historia */
  .link { background: #fff; color: #101b3b; font-size: 60px; font-weight: 800; padding: 26px 54px; border-radius: 999px; }
  .nota { margin-top: 18px; font-size: 26px; opacity: .6; }
  .top { position: absolute; top: -26px; right: -18px; background: #ff7733; color: #fff; font-weight: 900; font-size: 50px;
         line-height: 1.05; padding: 24px 32px; border-radius: 36px; transform: rotate(4deg); text-align: center; }
  .top small { display: block; font-size: 30px; font-weight: 800; }
  .ventas { margin-top: 14px; font-size: 40px; font-weight: 700; color: #ffd400; }
  .cta { margin-top: 26px; background: #ffd400; color: #101b3b; text-align: center; font-size: 46px; font-weight: 900; letter-spacing: 1px; padding: 22px; border-radius: 24px; }
  </style></head><body>
    <div class="arriba">${logoTienda(o)}${o._categoria && o._categoria !== "Otros" ? `<div class="tag">${esc(o._categoria)}</div>` : ""}</div>
    <div class="foto">
      ${o.foto ? `<img src="${esc(o.foto)}">` : ""}
      ${o.descuento_pct ? `<div class="off">${o.descuento_pct}%<small>OFF</small></div>`
        : o.tipo === "popular" ? `<div class="top">🔥 ${esc(o.destacado || "MÁS VENDIDO").split(" ").join("<br>")}<small>en Mercado Libre</small></div>` : ""}
    </div>
    <h1>${esc(o.titulo)}</h1>
    <div class="precios"><div class="ahora">${clp(o.precio)}</div>${o.precio_anterior ? `<div class="antes">${clp(o.precio_anterior)}</div>` : ""}</div>
    ${o._con_cmr ? `<div class="ventas">💳 Precio con tarjeta CMR · sin tarjeta ${clp(o._sin_tarjeta)}</div>` : ""}
    ${o.tipo === "popular" && (o.vendidos || o.nota) ? `<div class="ventas">${[o.nota ? `⭐ ${String(o.nota).replace(".", ",")}` : "", o.vendidos ? `+${vendidosTexto(o.vendidos)} vendidos` : ""].filter(Boolean).join("  ·  ")}</div>` : ""}
    <div class="nota">Precio visto el ${esc(o._fecha)}${o._hora ? " a las " + esc(o._hora) : ""}. Puede cambiar.</div>
    ${historia ? "" : `<div class="cta">👉 LINK EN LAS HISTORIAS</div>`}
    ${historia ? `<div class="libre">${o._link_visible ? `<div class="link">🔗 ${esc(o.link.replace("https://", ""))}</div>` : ""}</div>` : ""}
  </body></html>`;
}

// Colores y emoji de cada categoría (portada del carrusel y página).
export const ESTILO = {
  "Ofertas flash": { color: "#ff4d6d", emoji: "⚡", tags: "#blackfriday #ofertaflash" },
  "Tecnología": { color: "#4fd8ff", emoji: "🎧", tags: "#tecnologia #tech #gadgets" },
  "Cuidado y Belleza": { color: "#ffa8d6", emoji: "💄", tags: "#belleza #skincare #perfumes" },
  "Moda": { color: "#ffd400", emoji: "👟", tags: "#moda #ropa #zapatillas" },
  "Entretención": { color: "#8ef5a4", emoji: "🎮", tags: "#entretencion #panoramas #aventura" },
};

// Garabatos blancos/de color para la portada (dibujados con SVG, sin imágenes de terceros).
const garabatos = (c) => `
  <svg class="g g1" viewBox="0 0 120 60"><path d="M5 40 L25 10 L45 40 L65 10 L85 40 L105 10" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <svg class="g g2" viewBox="0 0 200 90"><path d="M10 60 C10 10 50 10 50 45 C50 75 20 70 30 45 C40 20 80 15 85 45 C90 75 60 72 70 45 C80 20 120 15 125 45 C130 75 100 72 110 45 C120 20 160 20 165 50" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg>
  <svg class="g g3" viewBox="0 0 160 90"><path d="M10 20 Q30 0 50 20 T90 20 T130 20 M10 45 Q30 25 50 45 T90 45 T130 45 M10 70 Q30 50 50 70 T90 70 T130 70" fill="none" stroke="${c}" stroke-width="8" stroke-linecap="round"/></svg>
  <svg class="g g4" viewBox="0 0 100 100"><path d="M50 8 L58 40 L92 50 L58 60 L50 92 L42 60 L8 50 L42 40 Z" fill="${c}"/></svg>
  <svg class="g g5" viewBox="0 0 100 100"><path d="M50 15 L56 44 L85 50 L56 56 L50 85 L44 56 L15 50 L44 44 Z" fill="#fff"/></svg>`;

function portada(cat, items, fecha) {
  const { color } = ESTILO[cat];
  const maxOff = Math.max(0, ...items.map((o) => o.descuento_pct || 0));
  const tiendas = [...new Set(items.map((o) => (o.tienda === "falabella" ? "falabella" : "mercadolibre")))];
  // Hasta 3 fotos de productos, como stickers con borde blanco, en posiciones y ángulos fijos.
  const pos = [
    { l: 560, t: 610, w: 420, r: 6 }, { l: 90, t: 650, w: 370, r: -7 }, { l: 380, t: 905, w: 290, r: -3 },
  ];
  const fotos = items.filter((o) => o.foto).slice(0, 3).map((o, i) => {
    const p = pos[i];
    return `<div class="st" style="left:${p.l}px;top:${p.t}px;width:${p.w}px;height:${p.w}px;transform:rotate(${p.r}deg)">
      <img src="${esc(o.foto)}">${o.descuento_pct ? `<b style="font-size:${Math.round(p.w / 6.5)}px">-${o.descuento_pct}%</b>` : ""}</div>`;
  });
  const collage = [fotos[1], fotos[0], fotos[2]].filter(Boolean).join(""); // la tercera queda encima, para que se vea su descuento
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Pacifico&display=block" rel="stylesheet">
  <style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1080px; height: 1350px; position: relative; overflow: hidden; color: #fff;
         background: radial-gradient(circle at 75% 15%, #2a3a6e 0, #101b3b 55%, #0a1230 100%);
         font-family: "Fredoka", -apple-system, "Inter", Arial, sans-serif; }
  .titulo { position: absolute; left: 0; right: 0; top: 90px; text-align: center; transform: rotate(-3deg); }
  .t1 { font-size: 190px; font-weight: 700; line-height: .95; letter-spacing: 2px; text-shadow: 0 8px 0 rgba(0,0,0,.25); }
  .t2 { font-family: "Pacifico", cursive; font-size: ${cat.length > 12 ? 92 : 118}px; color: ${color}; line-height: 1.25; margin-top: 6px; text-shadow: 0 6px 0 rgba(0,0,0,.25); }
  .t3 { font-size: 64px; font-weight: 600; letter-spacing: 6px; margin-top: 4px; }
  .st { position: absolute; background: #fff; border-radius: 40px; padding: 26px; border: 10px solid #fff;
        box-shadow: 0 24px 50px rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; }
  .st img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .st b { position: absolute; top: -22px; right: -22px; background: #e8003d; color: #fff; font-weight: 700; padding: 8px 18px; border-radius: 22px; transform: rotate(8deg); }
  .g { position: absolute; }
  .g1 { width: 170px; left: 50px; top: 70px; transform: rotate(-12deg); }
  .g2 { width: 230px; right: 40px; top: 60px; transform: rotate(10deg); }
  .g3 { width: 170px; left: 760px; top: 1075px; transform: rotate(-6deg); }
  .g4 { width: 90px; left: 40px; top: 520px; } .g5 { width: 70px; right: 60px; top: 500px; }
  .pie { position: absolute; left: 50px; right: 50px; bottom: 44px; display: flex; align-items: center; justify-content: space-between; }
  .chip { background: #ffd400; color: #101b3b; font-size: 46px; font-weight: 700; padding: 18px 36px; border-radius: 999px; box-shadow: 0 10px 0 rgba(0,0,0,.25); }
  .marcas { display: flex; gap: 14px; }
  .marcas div { background: #fff; border-radius: 22px; height: 92px; padding: 8px 20px; display: flex; align-items: center; }
  .marcas img { height: 76px; } .marcas .fal img { height: 44px; }
  .fecha { position: absolute; left: 0; right: 0; top: 505px; text-align: center; font-size: 36px; font-weight: 600; opacity: .8; }
  </style></head><body>
    ${garabatos(color)}
    <div class="titulo"><div class="t1">¡OFERTAS</div><div class="t2">de ${esc(cat)}</div><div class="t3">PARA HOY!</div></div>
    <div class="fecha">${esc(fecha)}${maxOff ? ` · hasta ${maxOff}% OFF` : ""}</div>
    ${collage}
    <div class="pie"><div class="chip">Desliza 👉</div>
      <div class="marcas">${tiendas.map((t) => `<div class="${t === "falabella" ? "fal" : "ml"}"><img src="${LOGOS[t]}"></div>`).join("")}</div></div>
  </body></html>`;
}

function textoCarrusel(cat, items, fecha) {
  const { emoji, tags } = ESTILO[cat];
  return [
    `${emoji} Ofertas de ${cat} para hoy (${fecha})`,
    "",
    ...items.map((o) => `• ${o.titulo.length > 70 ? o.titulo.slice(0, 67).trimEnd() + "…" : o.titulo} — ${clp(o.precio)}`
      + (o.descuento_pct ? ` (${o.descuento_pct}% OFF)` : o.tipo === "popular" ? " 🔥 más vendido" : "")
      + ` · ${o.tienda === "falabella" ? "Falabella" : "Mercado Libre"}`),
    "",
    "👉 Los links están en las historias.",
    "Precios vistos hoy. Pueden cambiar.",
    "",
    `#ofertas #descuentos #chile #ofertaschile ${tags}`,
  ].join("\n");
}

function texto(o) {
  return [
    `🔥 ${o.titulo}`,
    "",
    `💰 Ahora ${clp(o.precio)}` + (o.precio_anterior ? ` (antes ${clp(o.precio_anterior)}) · ${o.descuento_pct}% OFF` : ""),
    o.precio_cmr ? `💳 Con tarjeta CMR: ${clp(o.precio_cmr)}` : null,
    `🛒 En ${o.tienda === "falabella" ? "Falabella" : "Mercado Libre"}`,
    "",
    `Precio visto el ${o._fecha}. Puede cambiar.`,
    o.tienda === "falabella" ? "#ofertas #descuentos #falabella #chile #ofertaschile" : "#ofertas #descuentos #mercadolibre #chile #ofertaschile",
  ].filter((l) => l !== null).join("\n");
}

function pagina(ofertas, fecha) {
  const tarjetas = (lista) => lista.map((o) => `
    <a class="card" href="${esc(o.link)}" rel="nofollow sponsored noopener" target="_blank">
      ${o.descuento_pct ? `<span class="off">${o.descuento_pct}% OFF</span>` : o.tipo === "popular" ? `<span class="off top">🔥 ${esc(o.destacado || "MÁS VENDIDO")}</span>` : ""}
      <img src="${esc(o.foto)}" alt="" loading="lazy">
      <h2>${esc(o.titulo)}</h2>
      <p class="precio">${clp(o.precio)} ${o.precio_anterior ? `<s>${clp(o.precio_anterior)}</s>` : ""}</p>
      <span class="btn">Ver oferta</span>
    </a>`).join("");
  // Agrupadas por categoría: primero las con descuento y después los más vendidos de cada una.
  const orden = (lista) => [...lista.filter((o) => o.tipo !== "popular"), ...lista.filter((o) => o.tipo === "popular")];
  const items = [...CATEGORIAS, "Otros"].map((cat) => {
    const lista = orden(ofertas.filter((o) => o._categoria === cat));
    return lista.length ? `<h2 class="seccion">${cat === "Otros" ? "🛍️ Otras ofertas" : `${ESTILO[cat].emoji} ${cat}`}</h2>${tarjetas(lista)}` : "";
  }).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ofertas de hoy</title>
<style>
*{box-sizing:border-box} body{margin:0;background:#101b3b;color:#fff;font-family:-apple-system,system-ui,sans-serif;padding:18px}
header{text-align:center;margin:10px 0 20px} header h1{margin:0;font-size:26px} header p{margin:6px 0 0;opacity:.75;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;max-width:980px;margin:0 auto}
.card{position:relative;background:#fff;color:#111;border-radius:16px;padding:12px;text-decoration:none;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:1;object-fit:contain}
.num{position:absolute;top:8px;left:8px;background:#ffd400;color:#101b3b;font-weight:800;border-radius:999px;padding:3px 10px;font-size:14px}
.off{position:absolute;top:8px;right:8px;background:#e8003d;color:#fff;font-weight:800;border-radius:8px;padding:3px 8px;font-size:13px} .off.top{background:#ff7733;font-size:11px}
.seccion{grid-column:1/-1;color:#fff;font-size:20px;margin:18px 0 0;-webkit-line-clamp:unset}
h2{font-size:14px;font-weight:600;margin:8px 0 6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.precio{font-size:20px;font-weight:800;margin:0 0 10px} .precio s{font-size:13px;font-weight:400;color:#777}
.btn{margin-top:auto;background:#101b3b;color:#fff;text-align:center;border-radius:10px;padding:9px;font-weight:700;font-size:14px}
footer{text-align:center;opacity:.6;font-size:12px;margin:24px auto 8px;max-width:600px}
</style></head><body>
<header><h1>🔥 Ofertas de hoy</h1><p>Actualizado el ${esc(fecha)} · Busca el producto que viste en Instagram</p></header>
<main class="grid">${items || "<p>Hoy no hay ofertas publicadas.</p>"}</main>
<footer>Los precios pueden cambiar sin aviso.</footer>
</body></html>`;
}

// Página para el celular: cada historia con su imagen y su link listo para copiar.
export function paginaHistorias(historias, fecha, version) {
  // Agrupadas por categoría (en el mismo orden que los carruseles), con un título y contador por grupo.
  const cuantas = (cat) => historias.filter((h) => h.categoria === cat).length;
  const items = historias.map((h, i) => `${i === 0 || historias[i - 1].categoria !== h.categoria
      ? `<h2 class="seccion" id="cat-${h.categoria.normalize("NFD").replace(/[^\w]/g, "")}">${h.categoria === "Otros" ? "🛍️ Otras ofertas" : `${ESTILO[h.categoria].emoji} ${esc(h.categoria)}`} <small>(${cuantas(h.categoria)})</small></h2>` : ""}
    <section class="h" id="h${h.n}">
      <header><b>#${h.n}</b> ${h.tienda === "falabella" ? "<em>Falabella</em> · " : ""}${esc(h.titulo)}<br><span>${clp(h.precio)} · ${h.tipo === "popular" ? "🔥 " + esc(h.destacado || "MÁS VENDIDO") : h.descuento_pct + "% OFF"}</span></header>
      <img src="${esc(h.imagen)}" alt="Historia ${h.n}" loading="lazy">
      <div class="botones">
        <a class="b" href="${esc(h.imagen)}" download>1. Guardar imagen</a>
        <button class="b copiar" data-link="${esc(h.link)}">2. Copiar link</button>
      </div>
      <label><input type="checkbox" data-n="${h.n}"> Ya la subí</label>
    </section>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Historias de hoy</title>
<style>
*{box-sizing:border-box} body{margin:0;background:#101b3b;color:#fff;font-family:-apple-system,system-ui,sans-serif;padding:16px;max-width:520px;margin:0 auto}
h1{font-size:22px;margin:8px 0 4px} .ayuda{opacity:.75;font-size:14px;margin:0 0 18px;line-height:1.4}
.h{background:#1b2850;border-radius:16px;padding:14px;margin-bottom:18px} .h.lista{opacity:.45}
.h header{font-size:15px;line-height:1.35;margin-bottom:10px} .h header span{color:#ffd400;font-weight:700}
.h img{width:100%;border-radius:12px;display:block}
.botones{display:flex;gap:10px;margin:12px 0 10px}
.b{flex:1;background:#ffd400;color:#101b3b;border:0;border-radius:12px;padding:14px 8px;font-size:15px;font-weight:800;text-align:center;text-decoration:none;font-family:inherit}
.b.ok{background:#3ddc84} label{font-size:14px;opacity:.85} .seccion{font-size:22px;margin:30px 0 12px;color:#ffd400;position:sticky;top:0;background:#101b3b;padding:10px 0;z-index:2} .seccion small{font-size:15px;opacity:.7;color:#fff}
.indice{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px} .indice a{background:#1b2850;color:#fff;text-decoration:none;border-radius:999px;padding:8px 12px;font-size:14px;font-weight:700}
</style></head><body>
<h1>Historias de hoy</h1>
<p class="ayuda">${esc(fecha)} · ${historias.length} historias, agrupadas por categoría.<br>Guarda la imagen, copia el link y, en Instagram, sube la historia y pega el link en el sticker "Enlace". Sube una categoría completa antes de pasar a la siguiente.</p>
<nav class="indice">${[...new Set(historias.map((h) => h.categoria))].map((c) => `<a href="#cat-${c.normalize("NFD").replace(/[^\w]/g, "")}">${c === "Otros" ? "🛍️ Otras" : ESTILO[c].emoji + " " + esc(c)} (${cuantas(c)})</a>`).join("")}</nav>
${items}
<script>
const clave = "hechas-${esc(fecha)}";
// Si la lista cambió desde que abriste la página (por ejemplo, llegó Falabella), recarga sola
// para que ninguna imagen quede con el link de otra oferta.
const version = "${esc(version)}";
setInterval(async () => {
  try {
    const r = await fetch("publicaciones.json?" + Date.now(), { cache: "no-store" });
    const p = await r.json();
    if (p.version && p.version !== version) location.reload();
  } catch {}
}, 60000);
const hechas = new Set(JSON.parse(localStorage.getItem(clave) || "[]"));
document.querySelectorAll(".copiar").forEach((b) => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.link); } catch { prompt("Copia el link:", b.dataset.link); }
  b.textContent = "¡Link copiado!"; b.classList.add("ok");
  setTimeout(() => { b.textContent = "2. Copiar link"; b.classList.remove("ok"); }, 2000);
}));
document.querySelectorAll("input[type=checkbox]").forEach((c) => {
  const marcar = () => c.closest(".h").classList.toggle("lista", c.checked);
  c.checked = hechas.has(c.dataset.n); marcar();
  c.addEventListener("change", () => {
    c.checked ? hechas.add(c.dataset.n) : hechas.delete(c.dataset.n);
    localStorage.setItem(clave, JSON.stringify([...hechas])); marcar();
  });
});
</script></body></html>`;
}


// Historias de las ofertas flash aprobadas hoy (sus imágenes viven en docs/img-alertas y no se borran).
export function alertasAprobadas(salida, sello) {
  const ruta = join(salida, "alertas.json");
  if (!existsSync(ruta)) return [];
  const a = JSON.parse(readFileSync(ruta, "utf8"));
  if (a.fecha !== sello) return [];
  return (a.alertas || []).filter((x) => x.historia).map((x) => x.historia);
}

// Huella de la lista de historias: cambia si cambia cualquier imagen o link.
export function historiasVersion(historias) {
  let h = 0;
  for (const c of historias.map((x) => x.imagen + x.link).join("|")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}

export async function generar({ datos = join(BASE, "data", "ofertas.json"), salida = join(BASE, "docs"), config } = {}) {
  const cfg = config || JSON.parse(readFileSync(join(BASE, "recolector.config.json"), "utf8"));
  const entrada = JSON.parse(readFileSync(datos, "utf8"));
  const cuando = new Date(entrada.generado);
  const fecha = cuando.toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
  const sello = cuando.toLocaleDateString("sv-SE", { timeZone: "America/Santiago" }); // 2026-11-09
  const ofertas = entrada.ofertas.map((o) => ({ ...o, _fecha: fecha, _link_visible: !!cfg.link_en_historia, _categoria: categoria(o.titulo) }));
  const nPosts = cfg.posts_por_dia ?? 3;

  const img = join(salida, "img");
  rmSync(img, { recursive: true, force: true });
  mkdirSync(img, { recursive: true });

  const navegador = await chromium.launch({ channel: "chrome", headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
  const plan = { generado: entrada.generado, base_url: cfg.pagina_url, posts: [], historias: [], carruseles: [] };
  try {
    const page = await navegador.newPage();
    for (const o of ofertas) {
      // Cada oferta tiene su historia; las primeras además tienen post.
      // Post: las primeras ofertas de Mercado Libre (hasta posts_por_dia) y todas las de Falabella.
      const formatos = o.tipo !== "popular" && (o.tienda === "falabella" || o.n <= nPosts) ? ["post", "historia"] : ["historia"];
      for (const formato of formatos) {
        // El nombre lleva el id del producto: una imagen nunca puede quedar asociada al link de otro producto.
        const archivo = `${sello}-${formato}-${dos(o.n)}-${String(o.id).replace(/[^\w]/g, "")}.jpg`;
        await page.setViewportSize({ width: 1080, height: formato === "post" ? 1350 : 1920 });
        await page.setContent(tarjeta(o, formato), { waitUntil: "networkidle" });
        await page.screenshot({ path: join(img, archivo), type: "jpeg", quality: 90 });
        const item = { n: o.n, titulo: o.titulo, precio: o.precio, descuento_pct: o.descuento_pct, tipo: o.tipo || "oferta", tienda: o.tienda || "mercadolibre", destacado: o.destacado || null, categoria: o._categoria, imagen: `img/${archivo}`, link: o.link };
        if (formato === "post") plan.posts.push({ ...item, texto: texto(o) });
        else plan.historias.push(item);
      }
    }

    // CARRUSELES: uno por categoría = portada + hasta 9 ofertas (Instagram acepta 10 fotos por carrusel).
    // Primero las de mayor descuento, alternando Mercado Libre y Falabella; si faltan, se completa con los más vendidos.
    const MAX = 9, MIN = cfg.min_ofertas_carrusel ?? 3;
    const porDescuento = (a, b) => (b.descuento_pct || 0) - (a.descuento_pct || 0);
    for (const cat of CATEGORIAS) {
      const deCat = ofertas.filter((o) => o._categoria === cat);
      const ml = deCat.filter((o) => o.tipo !== "popular" && o.tienda !== "falabella").sort(porDescuento);
      const fal = deCat.filter((o) => o.tipo !== "popular" && o.tienda === "falabella").sort(porDescuento);
      const elegidas = [];
      while (ml.length || fal.length) {
        const sig = [ml[0], fal[0]].filter(Boolean).sort(porDescuento);
        if (sig.length) elegidas.push(...sig.map((o) => (o === ml[0] ? ml.shift() : fal.shift())));
      }
      elegidas.push(...deCat.filter((o) => o.tipo === "popular").sort((a, b) => (b.vendidos || 0) - (a.vendidos || 0)));
      const items = elegidas.slice(0, MAX);
      if (items.length < MIN) continue;
      const clave = cat.normalize("NFD").replace(/[^\w]/g, "").toLowerCase();
      const slides = [];
      await page.setViewportSize({ width: 1080, height: 1350 });
      await page.setContent(portada(cat, items, fecha), { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const archivoPortada = `${sello}-carrusel-${clave}-portada.jpg`;
      await page.screenshot({ path: join(img, archivoPortada), type: "jpeg", quality: 90 });
      for (const o of items) {
        const yaHecho = plan.posts.find((p) => p.link === o.link);
        if (yaHecho) { slides.push(yaHecho.imagen); continue; }
        const archivo = `${sello}-carrusel-${clave}-${String(o.id).replace(/[^\w]/g, "")}.jpg`;
        await page.setContent(tarjeta(o, "post"), { waitUntil: "networkidle" });
        await page.screenshot({ path: join(img, archivo), type: "jpeg", quality: 90 });
        slides.push(`img/${archivo}`);
      }
      plan.carruseles.push({
        categoria: cat, portada: `img/${archivoPortada}`, imagenes: [`img/${archivoPortada}`, ...slides],
        ofertas: items.map((o) => ({ titulo: o.titulo, precio: o.precio, descuento_pct: o.descuento_pct, tienda: o.tienda || "mercadolibre", link: o.link })),
        texto: textoCarrusel(cat, items, fecha),
      });
    }
  } finally {
    await navegador.close();
  }
  // Intercala las tiendas en proporción (con 20 y 20: una y una) para que no salgan todas juntas.
  const ml = plan.posts.filter((p) => p.tienda !== "falabella"), fal = plan.posts.filter((p) => p.tienda === "falabella");
  plan.posts = [];
  const cada = fal.length ? Math.max(1, Math.round(ml.length / fal.length)) : 1;
  while (ml.length || fal.length) { plan.posts.push(...ml.splice(0, cada)); if (fal.length) plan.posts.push(fal.shift()); }
  writeFileSync(join(salida, "index.html"), pagina(ofertas, fecha));
  // Historias ordenadas por categoría (Tecnología, Belleza, Moda, Entretención, Otros); dentro de cada una,
  // primero las con descuento y después los más vendidos.
  const ordenCat = [...CATEGORIAS, "Otros"];
  plan.historias = plan.historias.map((h, i) => ({ h, i }))
    .sort((a, b) => ordenCat.indexOf(a.h.categoria) - ordenCat.indexOf(b.h.categoria)
      || (a.h.tipo === "popular") - (b.h.tipo === "popular") || a.i - b.i)
    .map(({ h }) => h);
  // Las ofertas flash que Rodrigo aprobó hoy (vigilante.py → aprobar.yml) quedan arriba de todo.
  plan.historias = [...alertasAprobadas(salida, sello), ...plan.historias];
  plan.version = historiasVersion(plan.historias);
  writeFileSync(join(salida, "historias.html"), paginaHistorias(plan.historias, fecha, plan.version));
  writeFileSync(join(salida, "publicaciones.json"), JSON.stringify(plan, null, 2) + "\n");
  return plan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plan = await generar({ datos: arg("--datos"), salida: arg("--salida") });
  console.log(`✅ ${plan.posts.length} posts, ${plan.historias.length} historias y ${plan.carruseles.length} carruseles (${plan.carruseles.map((c) => `${c.categoria}: ${c.imagenes.length - 1}`).join(", ")})`);
}
