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
         font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif; padding: ${historia ? "150px 70px 170px" : "60px"}; }
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
  .libre { height: 260px; display: flex; align-items: center; justify-content: center; }  /* espacio para el link en la historia */
  .link { background: #fff; color: #101b3b; font-size: 60px; font-weight: 800; padding: 26px 54px; border-radius: 999px; }
  .nota { margin-top: 18px; font-size: 26px; opacity: .6; }
  .cta { margin-top: 26px; background: #ffd400; color: #101b3b; text-align: center; font-size: 46px; font-weight: 900; letter-spacing: 1px; padding: 22px; border-radius: 24px; }
  </style></head><body>
    <div class="arriba"><div class="num">OFERTA #${o.n}</div><div class="tag">Mercado Libre Chile</div></div>
    <div class="foto">
      ${o.foto ? `<img src="${esc(o.foto)}">` : ""}
      ${o.descuento_pct ? `<div class="off">${o.descuento_pct}%<small>OFF</small></div>` : ""}
    </div>
    <h1>${esc(o.titulo)}</h1>
    <div class="precios"><div class="ahora">${clp(o.precio)}</div>${o.precio_anterior ? `<div class="antes">${clp(o.precio_anterior)}</div>` : ""}</div>
    <div class="nota">Precio visto el ${esc(o._fecha)}. Puede cambiar.</div>
    ${historia ? "" : `<div class="cta">👉 LINK EN LAS HISTORIAS</div>`}
    ${historia ? `<div class="libre">${o._link_visible ? `<div class="link">🔗 ${esc(o.link.replace("https://", ""))}</div>` : ""}</div>` : ""}
  </body></html>`;
}

function texto(o) {
  return [
    `🔥 ${o.titulo}`,
    "",
    `💰 Ahora ${clp(o.precio)}` + (o.precio_anterior ? ` (antes ${clp(o.precio_anterior)}) · ${o.descuento_pct}% OFF` : ""),
    "",
    `Precio visto el ${o._fecha}. Puede cambiar.`,
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
<footer>Los precios pueden cambiar sin aviso.</footer>
</body></html>`;
}

// Página para el celular: cada historia con su imagen y su link listo para copiar.
function paginaHistorias(historias, fecha) {
  const items = historias.map((h) => `
    <section class="h" id="h${h.n}">
      <header><b>#${h.n}</b> ${esc(h.titulo)}<br><span>${clp(h.precio)} · ${h.descuento_pct}% OFF</span></header>
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
.b.ok{background:#3ddc84} label{font-size:14px;opacity:.85}
</style></head><body>
<h1>Historias de hoy</h1>
<p class="ayuda">${esc(fecha)} · ${historias.length} historias.<br>Guarda la imagen, copia el link y, en Instagram, sube la historia y pega el link en el sticker "Enlace".</p>
${items}
<script>
const clave = "hechas-${esc(fecha)}";
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


export async function generar({ datos = join(BASE, "data", "ofertas.json"), salida = join(BASE, "docs"), config } = {}) {
  const cfg = config || JSON.parse(readFileSync(join(BASE, "recolector.config.json"), "utf8"));
  const entrada = JSON.parse(readFileSync(datos, "utf8"));
  const cuando = new Date(entrada.generado);
  const fecha = cuando.toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
  const sello = cuando.toLocaleDateString("sv-SE", { timeZone: "America/Santiago" }); // 2026-11-09
  const ofertas = entrada.ofertas.map((o) => ({ ...o, _fecha: fecha, _link_visible: !!cfg.link_en_historia }));
  const nPosts = cfg.posts_por_dia ?? 3;

  const img = join(salida, "img");
  rmSync(img, { recursive: true, force: true });
  mkdirSync(img, { recursive: true });

  const navegador = await chromium.launch({ channel: "chrome", headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
  const plan = { generado: entrada.generado, base_url: cfg.pagina_url, posts: [], historias: [] };
  try {
    const page = await navegador.newPage();
    for (const o of ofertas) {
      // Cada oferta tiene su historia; las primeras además tienen post.
      const formatos = o.n <= nPosts ? ["post", "historia"] : ["historia"];
      for (const formato of formatos) {
        const archivo = `${sello}-${formato}-${dos(o.n)}.jpg`;
        await page.setViewportSize({ width: 1080, height: formato === "post" ? 1350 : 1920 });
        await page.setContent(tarjeta(o, formato), { waitUntil: "networkidle" });
        await page.screenshot({ path: join(img, archivo), type: "jpeg", quality: 90 });
        const item = { n: o.n, titulo: o.titulo, precio: o.precio, descuento_pct: o.descuento_pct, imagen: `img/${archivo}`, link: o.link };
        if (formato === "post") plan.posts.push({ ...item, texto: texto(o) });
        else plan.historias.push(item);
      }
    }
  } finally {
    await navegador.close();
  }
  writeFileSync(join(salida, "index.html"), pagina(ofertas, fecha));
  writeFileSync(join(salida, "historias.html"), paginaHistorias(plan.historias, fecha));
  writeFileSync(join(salida, "publicaciones.json"), JSON.stringify(plan, null, 2) + "\n");
  return plan;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plan = await generar({ datos: arg("--datos"), salida: arg("--salida") });
  console.log(`✅ ${plan.posts.length} posts y ${plan.historias.length} historias generados`);
}
