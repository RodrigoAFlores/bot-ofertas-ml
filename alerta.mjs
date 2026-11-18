// Dibuja el post y la historia de una OFERTA FLASH aprobada por Rodrigo y la suma a la página de historias.
//
//   node alerta.mjs FALprod123   → usa docs/alertas.json (la alerta ya trae el link de afiliado)
//
// Lo llama .github/workflows/aprobar.yml después de aprobar_alerta.py. Las imágenes quedan en
// docs/img-alertas (imagenes.mjs no las borra) y la historia queda arriba en historias.html.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tarjeta, paginaHistorias, historiasVersion } from "./imagenes.mjs";

const BASE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(BASE, "docs");
const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");

const id = process.argv[2];
const rutaAlertas = join(DOCS, "alertas.json");
const alertas = JSON.parse(readFileSync(rutaAlertas, "utf8"));
const a = alertas.alertas.find((x) => x.id === id);
if (!a || !a.link) throw new Error(`No hay alerta aprobada con link para ${id}`);

const cuando = new Date(a.visto);
const fecha = cuando.toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
const conCmr = !!(a.precio_cmr && a.precio_cmr < a.precio);
const comparado = a.comparado || null;   // oferta real de otra tienda (comparador.py)
const tienda = a.nombre_tienda || "Falabella";
const n = 900 + alertas.alertas.indexOf(a) + 1;   // número propio, no choca con las ofertas del día
const oferta = {
  ...a, n, tienda: a.tienda || "falabella", precio: a.mejor_precio, descuento_pct: a.descuento_total, _comparado: comparado,
  _fecha: fecha, _hora: a.hora, _categoria: "Ofertas flash", _con_cmr: conCmr, _sin_tarjeta: a.precio,
};

const texto = [
  `⚡ OFERTA FLASH`,
  `🔥 ${a.titulo}`,
  "",
  comparado
    ? `💰 ${clp(a.mejor_precio)} en ${tienda} · ${a.descuento_total}% más barato que en otras tiendas\n` +
      comparado.slice(0, 3).map((c) => `   ${c.tienda}: ${clp(c.precio)}`).join("\n")
    : conCmr
    ? `💳 Con tarjeta CMR: ${clp(a.mejor_precio)} (antes ${clp(a.precio_anterior)}) · ${a.descuento_total}% OFF\n💰 Sin tarjeta: ${clp(a.precio)}`
    : `💰 Ahora ${clp(a.mejor_precio)} (antes ${clp(a.precio_anterior)}) · ${a.descuento_total}% OFF`,
  `🛒 En ${tienda}`,
  "",
  `Precio visto el ${fecha} a las ${a.hora}. Puede cambiar o agotarse.`,
  `#ofertas #descuentos #${tienda.normalize("NFD").replace(/[^\w]/g, "").toLowerCase()} #blackfriday #chile #ofertaschile`,
].join("\n");

const carpeta = join(DOCS, "img-alertas");
mkdirSync(carpeta, { recursive: true });
const sello = alertas.fecha;
const limpio = id.replace(/[^\w]/g, "");
const navegador = await chromium.launch({ channel: "chrome", headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
try {
  const page = await navegador.newPage();
  for (const formato of ["post", "historia"]) {
    await page.setViewportSize({ width: 1080, height: formato === "post" ? 1350 : 1920 });
    await page.setContent(tarjeta(oferta, formato), { waitUntil: "networkidle" });
    await page.screenshot({ path: join(carpeta, `${sello}-${formato}-${limpio}.jpg`), type: "jpeg", quality: 90 });
  }
} finally {
  await navegador.close();
}

a.post = { imagen: `img-alertas/${sello}-post-${limpio}.jpg`, texto };
a.historia = {
  n, titulo: a.titulo, precio: a.mejor_precio, descuento_pct: a.descuento_total, tipo: "oferta", tienda: a.tienda || "falabella",
  destacado: null, categoria: "Ofertas flash", imagen: `img-alertas/${sello}-historia-${limpio}.jpg`, link: a.link,
};
writeFileSync(rutaAlertas, JSON.stringify(alertas, null, 1) + "\n");

// Suma la historia arriba de la página de historias de hoy (sin tocar las demás).
const rutaPlan = join(DOCS, "publicaciones.json");
const plan = JSON.parse(readFileSync(rutaPlan, "utf8"));
plan.historias = [a.historia, ...plan.historias.filter((h) => h.imagen !== a.historia.imagen)];
plan.version = historiasVersion(plan.historias);
const fechaPlan = new Date(plan.generado).toLocaleDateString("es-CL", { day: "numeric", month: "long", timeZone: "America/Santiago" });
writeFileSync(join(DOCS, "historias.html"), paginaHistorias(plan.historias, fechaPlan, plan.version));
writeFileSync(rutaPlan, JSON.stringify(plan, null, 2) + "\n");
console.log(`✅ Oferta flash lista: ${a.post.imagen} y su historia arriba en historias.html`);
