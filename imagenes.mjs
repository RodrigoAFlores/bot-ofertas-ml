// Arma las imágenes (post e historia), los textos y la página "ofertas de hoy".
//
//   node imagenes.mjs                              → usa data/ofertas.json y escribe en docs/
//   node imagenes.mjs --datos X.json --salida DIR  → para pruebas
//
// Las imágenes se dibujan con el Chrome instalado (HTML → foto), sin IA: todo sale de los datos.

import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = dirname(fileURLToPath(import.meta.url));
const arg = (nombre, defecto) => {
  const i = process.argv.indexOf(nombre);
  return i > -1 ? process.argv[i + 1] : defecto;
};

const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const dos = (n) => String(n).padStart(2, "0");

function tarjeta(o, formato) {
  const historia = formato === "historia";
  const alto = historia ? 1920 : 1350;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1080px; height: ${alto}px; background: #101b3b; color: #fff; display: flex; flex-direction: column;
         font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; padding: ${historia ? "150px 70px 170px" : "60px"}; }
  .arriba { display: flex; justify-content: space-between; align-items: center; }
  .num { font-size: 44px; font-weight: 800; background: #ffd400; color: #101b3b; padding: 12px 30px; border-radius: 999px; }
  .tag { font-size: 34px; font-weight: 600; opacity: .85; }
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
  .pie { margin-top: 30px; background: rgba(255,255,255,.1); border-radius: 32px; padding: 30px 36px; font-size: 38px; line-height: 1.4; }
  .pie b { color: #ffd400; }
  .nota { margin-top: 18px; font-size: 26px; opacity: .6; }
  </style></head><body>
    <div class="arriba"><div class="num">OFERTA #${o.n}</div><div class="tag">Mercado Libre Chile</div></div>
    <div class="foto">
      ${o.foto ? `<img src="${esc(o.foto)}">` : ""}
      ${o.descuento_pct ? `<div class="off">${o.descuento_pct}%<small>OFF</small></div>` : ""}
    </div>
    <h1>${esc(o.titulo)}</h1>
    <div class="precios"><div class="ahora">${clp(o.precio)}</div>${o.precio_anterior ? `<div class="antes">${clp(o.precio_anterior)}</div>` : ""}</div>
    <div class="pie">🔗 Link en mi bio → <b>Oferta #${o.n}</b>${o.codigo_busqueda ? `<br>🔍 O busca en Mercado Libre: <b>${esc(o.codigo_busqueda)}</b>` : ""}</div>
    <div class="nota">Precio visto el ${esc(o._fecha)}. Puede cambiar. Link de afiliado.</div>
  </body></html>`;
}

function texto(o) {
  return [
    `🔥 ${o.titulo}`,
    "",
    `💰 Ahora ${clp(o.precio)}` + (o.precio_anterior ? ` (antes ${clp(o.precio_anterior)}) · ${o.descuento_pct}% OFF` : ""),
    "",
    `🔗 Link en mi bio → Oferta #${o.n}`,
    o.codigo_busqueda ? `🔍 O busca en Mercado Libre: ${o.codigo_busqueda}` : null,
    "",
    `Precio visto el ${o._fecha}. Puede cambiar. Link de afiliado.`,
    "#ofertas #descuentos #mercadolibre #chile #ofertaschile",
  ].filter((l) => l !== null).join("\n");
}

function pagina(ofertas, fecha) {
  const items = ofertas.map((o) => `
    <a class="card" href="${esc(o.link)}" rel="nofollow sponsored noopener" target="_blank">
      <span class="num">#${o.n}</span>
      ${o.descuento_pct ? `<span class="off">${o.descuento_pct}% OFF</span>` : ""}
      <img src="${esc(o.foto)}" alt="" loading="lazy">
      <h2>${esc(o.titulo)}</h2>
      <p class="precio">${clp(o.precio)} ${o.precio_anterior ? `<s>${clp(o.precio_anterior)}</s>` : ""}</p>
      <span class="btn">Ver oferta</span>
    </a>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ofertas de hoy</title>
<style>
*{box-sizing:border-box} body{margin:0;background:#101b3b;color:#fff;font-family:-apple-system,system-ui,sans-serif;padding:18px}
header{text-align:center;margin:10px 0 20px} header h1{margin:0;font-size:26px} header p{margin:6px 0 0;opacity:.75;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;max-width:980px;margin:0 auto}
.card{position:relative;background:#fff;color:#111;border-radius:16px;padding:12px;text-decoration:none;display:flex;flex-direction:column}
.card img{width:100%;aspect-ratio:1;object-fit:contain}
.num{position:absolute;top:8px;left:8px;background:#ffd400;color:#101b3b;font-weight:800;border-radius:999px;padding:3px 10px;font-size:14px}
.off{position:absolute;top:8px;right:8px;background:#e8003d;color:#fff;font-weight:800;border-radius:8px;padding:3px 8px;font-size:13px}
h2{font-size:14px;font-weight:600;margin:8px 0 6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.precio{font-size:20px;font-weight:800;margin:0 0 10px} .precio s{font-size:13px;font-weight:400;color:#777}
.btn{margin-top:auto;background:#101b3b;color:#fff;text-align:center;border-radius:10px;padding:9px;font-weight:700;font-size:14px}
footer{text-align:center;opacity:.6;font-size:12px;margin:24px auto 8px;max-width:600px}
</style></head><body>
<header><h1>🔥 Ofertas de hoy</h1><p>Actualizado el ${esc(fecha)} · Busca el número que viste en Instagram</p></header>
<main class="grid">${items || "<p>Hoy no hay ofertas publicadas.</p>"}</main>
<footer>Los precios pueden cambiar sin aviso. Los links son de afiliado: si compras, puedo recibir una comisión sin costo extra para ti.</footer>
</body></html>`;
}

export async function generar({ datos = join(BASE, "data", "ofertas.json"), salida = join(BASE, "docs"), config } = {}) {
  const cfg = config || JSON.parse(readFileSync(join(BASE, "recolector.config.json"), "utf8"));
  const entrada = JSON.parse(readFileSync(datos, "utf8"));
  const cuando = new Date(entrada.generado);
  const fecha = cuando.toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
  const sello = cuando.toLocaleDateString("sv-SE", { timeZone: "America/Santiago" }); // 2026-11-09
  const ofertas = entrada.ofertas.map((o) => ({ ...o, _fecha: fecha }));
  const nPosts = cfg.posts_por_dia ?? 3;

  const img = join(salida, "img");
  rmSync(img, { recursive: true, force: true });
  mkdirSync(img, { recursive: true });

  const navegador = await chromium.launch({ channel: "chrome", headless: true });
  const plan = { generado: entrada.generado, base_url: cfg.pagina_url, posts: [], historias: [] };
  try {
    const page = await navegador.newPage();
    for (const o of ofertas) {
      const esPost = o.n <= nPosts;
      const formato = esPost ? "post" : "historia";
      const archivo = `${sello}-${formato}-${dos(o.n)}.jpg`;
      await page.setViewportSize({ width: 1080, height: esPost ? 1350 : 1920 });
      await page.setContent(tarjeta(o, formato), { waitUntil: "networkidle" });
      await page.screenshot({ path: join(img, archivo), type: "jpeg", quality: 90 });
      const item = { n: o.n, titulo: o.titulo, imagen: `img/${archivo}`, link: o.link };
      if (esPost) plan.posts.push({ ...item, texto: texto(o) });
      else plan.historias.push(item);
    }
  } finally {
    await navegador.close();
  }
  writeFileSync(join(salida, "index.html"), pagina(ofertas, fecha));
  writeFileSync(join(salida, "publicaciones.json"), JSON.stringify(plan, null, 2) + "\n");
  return plan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plan = await generar({ datos: arg("--datos"), salida: arg("--salida") });
  console.log(`✅ ${plan.posts.length} posts y ${plan.historias.length} historias generados`);
}
