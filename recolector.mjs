// Recolector de ofertas desde el panel de afiliados de Mercado Libre (corre en el Mac).
//
//   node recolector.mjs login   → abre Chrome para que inicies sesión en ML (una sola vez)
//   node recolector.mjs         → junta ofertas, calcula el ranking, crea links y sube data/ofertas.json
//
// Usa tu Chrome instalado, con un perfil aparte guardado en ~/.config/bot-ofertas-ml/chrome-perfil.
// En ese perfil queda tu sesión de ML. Ese perfil nunca se sube a GitHub.

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = dirname(fileURLToPath(import.meta.url));
const PERFIL = join(homedir(), ".config", "bot-ofertas-ml", "chrome-perfil");
const HUB = "https://www.mercadolibre.cl/afiliados/hub";
const SALIDA = join(BASE, "data", "ofertas.json");
const HISTORIAL = join(BASE, "data", "historial.json");
const CONFIG = JSON.parse(readFileSync(join(BASE, "recolector.config.json"), "utf8"));

const log = (...a) => console.log(new Date().toLocaleTimeString("es-CL"), ...a);

async function abrir({ visible }) {
  mkdirSync(PERFIL, { recursive: true });
  const ctx = await chromium.launchPersistentContext(PERFIL, {
    channel: "chrome",
    headless: !visible,
    viewport: { width: 1280, height: 860 },
    locale: "es-CL",
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  return { ctx, page };
}

// Llama a la API interna del panel desde la página (usa la sesión de este perfil).
async function api(page, ruta, cuerpo) {
  return page.evaluate(
    async ({ ruta, cuerpo }) => {
      const r = await fetch(ruta, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(cuerpo),
        credentials: "include",
      });
      let datos = null;
      try { datos = await r.json(); } catch {}
      return { status: r.status, datos };
    },
    { ruta, cuerpo }
  );
}

const buscar = (page, cuerpo) =>
  api(page, "/affiliate-program/api/hub/search?is_affiliate=true&device=desktop", cuerpo);

async function sesionActiva(page) {
  if (!page.url().includes("/afiliados/hub")) return false;
  const r = await buscar(page, { search: "", sort: "relevance", filters: [], offset: 0 });
  return r.status === 200 && !!r.datos?.polycard_client_model?.polycards;
}

// ------------------------------------------------------------------ login

async function login() {
  const { ctx } = await abrir({ visible: true });
  let page = ctx.pages()[0];
  let cerrado = false;
  ctx.on("close", () => { cerrado = true; });
  await page.goto(HUB, { waitUntil: "domcontentloaded" });
  log("Se abrió Chrome. Inicia sesión en Mercado Libre en esa ventana (tienes 15 minutos).");
  const limite = Date.now() + 15 * 60_000;
  while (Date.now() < limite) {
    if (cerrado) throw new Error("Se cerró la ventana del bot antes de terminar el inicio de sesión.");
    try {
      // Si ML abrió otra pestaña o cerró la actual, seguimos con la última abierta.
      const abiertas = ctx.pages().filter((p) => !p.isClosed());
      if (!abiertas.length) page = await ctx.newPage(), await page.goto(HUB, { waitUntil: "domcontentloaded" });
      else page = abiertas[abiertas.length - 1];
      if (!page.url().includes("/afiliados/hub") && /mercadolibre\.cl\/?($|\?)/.test(page.url())) {
        await page.goto(HUB, { waitUntil: "domcontentloaded" });
      }
      if (await sesionActiva(page)) {
        log("✅ Sesión lista. El bot ya puede usarla solo.");
        await ctx.close();
        return;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 3000));
  }
  await ctx.close().catch(() => {});
  throw new Error("No se detectó la sesión en 15 minutos.");
}

// ------------------------------------------------------------- recolectar

function numero(texto) {
  // "+5mil vendidos" → 5000 ; "+1000 vendidos" → 1000 ; "+250mil" → 250000
  const m = /([\d.,]+)\s*(mil|M)?/i.exec(texto || "");
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  return Math.round(n * (m[2]?.toLowerCase() === "mil" ? 1000 : m[2] === "M" ? 1_000_000 : 1));
}

function convertir(card) {
  const comp = Object.fromEntries((card.components || []).map((c) => [c.type, c]));
  const precio = comp.price?.price || {};
  const actual = precio.current_price?.value;
  const anterior = precio.previous_price?.value || null;
  if (!actual) return null;
  const chips = (card.components || []).filter((c) => c.type === "chip");
  const textoComision = chips.map((c) => c.chip?.pill?.text || c.chip?.text || "").join(" ");
  const comision = parseFloat((/COMISI[ÓO]N\s*([\d.,]+)/i.exec(textoComision) || [])[1]?.replace(",", ".") || "0");
  const rev = comp.review_compacted?.review_compacted;
  const etiquetas = (rev?.values || []).filter((v) => v.type === "label").map((v) => v.label?.text || "");
  const foto = card.pictures?.pictures?.[0]?.id;
  const m = card.metadata || {};
  return {
    id: m.id,
    pid: m.pid || m.id,
    tipo: m.type,
    url: m.url,
    extra_comision: m.extra_commission || "false",
    titulo: comp.title?.title?.text || "",
    precio: actual,
    precio_anterior: anterior,
    descuento_pct: anterior && anterior > actual ? Math.round((1 - actual / anterior) * 100) : 0,
    comision_pct: comision,
    nota: parseFloat(etiquetas[0]) || null,
    vendidos: numero(etiquetas[1] || rev?.alt_text || ""),
    destacado: comp.highlight?.highlight?.text || null,
    foto: foto ? `https://http2.mlstatic.com/D_NQ_NP_2X_${foto}-F.webp` : null,
  };
}

// Ranking hecho con código: más descuento, más comisión y más ventas suben el puntaje.
function puntaje(o) {
  return o.descuento_pct * (1 + o.comision_pct / 10) * Math.log10(o.vendidos + 10);
}

async function recolectar() {
  const { ctx, page } = await abrir({ visible: CONFIG.ventana_visible });
  try {
    await page.goto(HUB, { waitUntil: "domcontentloaded" });
    if (!(await sesionActiva(page))) {
      throw new Error("La sesión de ML no está activa. Corre: node recolector.mjs login");
    }
    const vistos = new Map();
    for (const consulta of CONFIG.consultas) {
      for (let pagina = 0; pagina < CONFIG.paginas_por_consulta; pagina++) {
        const r = await buscar(page, { search: consulta.texto || "", sort: consulta.orden || "relevance", filters: consulta.filtros || [], offset: pagina * 18 });
        const cards = r.datos?.polycard_client_model?.polycards || [];
        log(`Consulta "${consulta.nombre}" página ${pagina + 1}: ${cards.length} productos`);
        for (const c of cards) {
          const o = convertir(c);
          if (o && !vistos.has(o.id)) vistos.set(o.id, o);
        }
        if (cards.length < 18) break;
        await page.waitForTimeout(800);
      }
    }

    // No repetir: una oferta ya usada solo vuelve si hoy está más barata que la última vez.
    const historial = existsSync(HISTORIAL) ? JSON.parse(readFileSync(HISTORIAL, "utf8")) : {};
    const candidatas = [...vistos.values()]
      .filter((o) => o.descuento_pct >= CONFIG.descuento_minimo && o.comision_pct > 0)
      .filter((o) => !historial[o.id] || o.precio < historial[o.id].precio)
      .map((o) => ({ ...o, puntaje: Math.round(puntaje(o) * 10) / 10, motivo: historial[o.id] ? "bajó" : "nueva" }))
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, CONFIG.max_ofertas);
    log(`${vistos.size} productos revisados → ${candidatas.length} ofertas elegidas`);

    const ofertas = [];
    for (const o of candidatas) {
      const r = await api(page, "/affiliate-program/api/v2/affiliates/createLink", {
        itemId: o.pid, type: o.tipo, extraCommission: o.extra_comision, itemAddToList: o.id, tag: CONFIG.etiqueta, urls: [o.url],
      });
      const u = r.datos?.urls?.[0];
      if (r.status !== 200 || !u?.short_url) { log(`  sin link: ${o.titulo.slice(0, 50)}`); continue; }
      ofertas.push({ ...o, link: u.short_url, codigo_busqueda: u.regex || null });
      await page.waitForTimeout(500);
    }

    const salida = { generado: new Date().toISOString(), total_revisados: vistos.size, ofertas: ofertas.map((o, i) => ({ n: i + 1, ...o })) };
    mkdirSync(dirname(SALIDA), { recursive: true });
    writeFileSync(SALIDA, JSON.stringify(salida, null, 2) + "\n");
    const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
    for (const o of ofertas) historial[o.id] = { precio: o.precio, fecha: hoy, titulo: o.titulo.slice(0, 60) };
    writeFileSync(HISTORIAL, JSON.stringify(historial, null, 1) + "\n");
    log(`✅ ${ofertas.length} ofertas guardadas en data/ofertas.json`);
    return ofertas.length;
  } finally {
    await ctx.close();
  }
}

function subirAGitHub() {
  const git = (...a) => execFileSync("git", a, { cwd: BASE, stdio: "pipe" }).toString().trim();
  git("add", "data/ofertas.json", "data/historial.json");
  if (!git("status", "--porcelain", "data/ofertas.json")) return log("Sin cambios que subir.");
  git("commit", "-m", `Ofertas del ${new Date().toLocaleDateString("es-CL")}`);
  git("push", "-q");
  log("⬆️  Subido a GitHub.");
}

const comando = process.argv[2];
try {
  if (comando === "login") await login();
  else {
    const n = await recolectar();
    if (n > 0 && !process.argv.includes("--sin-subir")) subirAGitHub();
  }
} catch (e) {
  console.error("❌", e.message);
  process.exit(1);
}
