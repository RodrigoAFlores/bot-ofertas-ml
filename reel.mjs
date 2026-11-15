// Arma el reel diario "Top 5 ofertas de hoy" (video vertical con música propia).
//
//   node reel.mjs   → usa data/ofertas.json y escribe docs/reels/<fecha>.mp4 y docs/reel.json
//
// 1) Dibuja 7 tarjetas (portada, 5 ofertas, cierre) con Chrome, igual que las imágenes de los posts.
// 2) Las une con ffmpeg: cada tarjeta con un zoom suave y transiciones, más un ritmo generado con
//    código (sin música con derechos de autor). Todo sale de los datos: nada lo inventa una IA.

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const BASE = dirname(fileURLToPath(import.meta.url));
const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tienda = (o) => (o.tienda === "falabella" ? "Falabella" : "Mercado Libre");

const ESTILO = `* { box-sizing: border-box; margin: 0; }
  body { width: 1080px; height: 1920px; background: #101b3b; color: #fff; overflow: hidden;
         font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif; }`;

function portada(fecha) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${ESTILO}
  body { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 90px; }
  .fuego { font-size: 220px; } h1 { font-size: 150px; font-weight: 900; line-height: 1; margin-top: 30px; }
  h1 span { color: #ffd400; display: block; } p { font-size: 60px; margin-top: 50px; opacity: .85; }
  .fecha { margin-top: 70px; background: #ffd400; color: #101b3b; font-weight: 800; font-size: 56px; padding: 18px 50px; border-radius: 999px; }
  </style></head><body><div class="fuego">🔥</div><h1>TOP 5<span>OFERTAS</span>DE HOY</h1>
  <p>Mercado Libre y Falabella</p><div class="fecha">${esc(fecha)}</div></body></html>`;
}

function tarjeta(o, puesto) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${ESTILO}
  body { display: flex; flex-direction: column; padding: 150px 70px 200px; }
  .arriba { display: flex; justify-content: space-between; align-items: center; }
  .puesto { font-size: 110px; font-weight: 900; color: #ffd400; } .tag { font-size: 40px; font-weight: 700; opacity: .9; }
  .foto { flex: 1; min-height: 0; margin: 40px 0; background: #fff; border-radius: 56px; position: relative;
          display: flex; align-items: center; justify-content: center; padding: 60px; }
  .foto img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .off { position: absolute; top: -30px; right: -20px; background: #e8003d; font-weight: 900; font-size: 120px; line-height: 1;
         padding: 30px 40px; border-radius: 44px; transform: rotate(5deg); text-align: center; }
  .off small { display: block; font-size: 46px; }
  h2 { font-size: 58px; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .precios { display: flex; align-items: baseline; gap: 30px; margin-top: 26px; }
  .ahora { font-size: 140px; font-weight: 900; color: #ffd400; letter-spacing: -3px; } .antes { font-size: 60px; opacity: .7; text-decoration: line-through; }
  </style></head><body>
  <div class="arriba"><div class="puesto">#${puesto}</div><div class="tag">${tienda(o)}</div></div>
  <div class="foto"><img src="${esc(o.foto)}">${o.descuento_pct ? `<div class="off">${o.descuento_pct}%<small>OFF</small></div>` : ""}</div>
  <h2>${esc(o.titulo)}</h2>
  <div class="precios"><div class="ahora">${clp(o.precio)}</div>${o.precio_anterior ? `<div class="antes">${clp(o.precio_anterior)}</div>` : ""}</div>
  </body></html>`;
}

function cierre() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${ESTILO}
  body { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 100px; gap: 70px; }
  .grande { font-size: 110px; font-weight: 900; line-height: 1.05; } .grande span { color: #ffd400; }
  .caja { background: #ffd400; color: #101b3b; font-size: 64px; font-weight: 900; padding: 40px 60px; border-radius: 40px; }
  .chico { font-size: 52px; opacity: .85; }
  </style></head><body><div class="grande">¿Te sirvió?<br><span>Síguenos</span> para más ofertas</div>
  <div class="caja">👉 LINK EN LAS HISTORIAS</div><div class="chico">@ofertas_punto_cl · todos los días</div></body></html>`;
}

// Las 5 mejores: hasta 3 de Mercado Libre y 2 de Falabella (si hay), por porcentaje de descuento.
function elegir(ofertas) {
  const conDescuento = ofertas.filter((o) => o.tipo !== "popular" && o.descuento_pct > 0 && o.foto);
  const orden = (a, b) => b.descuento_pct - a.descuento_pct || (b.puntaje || 0) - (a.puntaje || 0);
  const ml = conDescuento.filter((o) => o.tienda !== "falabella").sort(orden);
  const fal = conDescuento.filter((o) => o.tienda === "falabella").sort(orden);
  const top = [...ml.slice(0, fal.length ? 3 : 5), ...fal.slice(0, 2)];
  for (const o of [...ml, ...fal].sort(orden)) if (top.length < 5 && !top.includes(o)) top.push(o);
  return top.sort(orden).slice(0, 5);
}

function texto(top) {
  const numeros = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
  return [
    "🔥 Top 5 ofertas de hoy en Mercado Libre y Falabella",
    "",
    ...top.map((o, i) => `${numeros[i]} ${o.titulo.slice(0, 60)} · ${clp(o.precio)} (-${o.descuento_pct}%) · ${tienda(o)}`),
    "",
    "🔗 El link de cada oferta está en nuestras historias",
    "👉 Síguenos para recibir ofertas todos los días",
    "Precios vistos hoy. Pueden cambiar.",
    "#ofertas #descuentos #ofertaschile #mercadolibre #falabella #chile",
  ].join("\n");
}

export async function generar({ datos = join(BASE, "data", "ofertas.json"), salida = join(BASE, "docs") } = {}) {
  const entrada = JSON.parse(readFileSync(datos, "utf8"));
  const cuando = new Date(entrada.generado);
  const fecha = cuando.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Santiago" });
  const sello = cuando.toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
  const top = elegir(entrada.ofertas);
  if (top.length < 3) {
    console.log("Menos de 3 ofertas con descuento: hoy no hay reel.");
    return null;
  }

  // 1) Tarjetas
  const tmp = mkdtempSync(join(tmpdir(), "reel-"));
  const pantallas = [portada(fecha), ...top.map((o, i) => tarjeta(o, i + 1)), cierre()];
  const navegador = await chromium.launch({ channel: "chrome", headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
  try {
    const page = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
    for (const [i, html] of pantallas.entries()) {
      await page.setContent(html, { waitUntil: "networkidle" });
      await page.screenshot({ path: join(tmp, `t${i}.png`) });
    }
  } finally {
    await navegador.close();
  }

  // 2) Video: cada tarjeta dura `seg` segundos con un zoom suave; transiciones de 0,4 s; ritmo de 120 bpm.
  const dur = pantallas.map((_, i) => (i === 0 ? 2.2 : i === pantallas.length - 1 ? 3 : 2.8));
  const fade = 0.4;
  const total = dur.reduce((a, b) => a + b, 0) - fade * (dur.length - 1);
  const args = ["-y"];
  dur.forEach((d, i) => args.push("-loop", "1", "-t", String(d), "-i", join(tmp, `t${i}.png`)));
  const ritmo = "0.55*sin(2*PI*52*t)*exp(-9*mod(t\\,0.5))+0.12*sin(2*PI*130*t)*exp(-3*mod(t\\,1))+0.05*(random(0)-0.5)*exp(-40*mod(t+0.25\\,0.5))";
  args.push("-f", "lavfi", "-t", total.toFixed(2), "-i", `aevalsrc=${ritmo}:s=44100`);
  const filtros = [];
  dur.forEach((d, i) => {
    const frames = Math.round(d * 30);
    filtros.push(`[${i}:v]scale=1188:2112,zoompan=z='min(zoom+0.0006,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30,setsar=1,format=yuv420p[v${i}]`);
  });
  let previo = "v0", offset = 0;
  for (let i = 1; i < dur.length; i++) {
    offset += dur[i - 1] - fade;
    const sale = i === dur.length - 1 ? "video" : `x${i}`;
    filtros.push(`[${previo}][v${i}]xfade=transition=${i % 2 ? "slideleft" : "fade"}:duration=${fade}:offset=${offset.toFixed(2)}[${sale}]`);
    previo = sale;
  }
  filtros.push(`[${dur.length}:a]afade=t=in:d=0.3,afade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8,volume=0.8[audio]`);
  const carpeta = join(salida, "reels");
  mkdirSync(carpeta, { recursive: true });
  const archivo = `${sello}.mp4`;
  args.push("-filter_complex", filtros.join(";"), "-map", "[video]", "-map", "[audio]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", join(carpeta, archivo));
  execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });
  rmSync(tmp, { recursive: true, force: true });

  // Solo se guardan los 3 reels más nuevos, para no llenar el repositorio.
  readdirSync(carpeta).filter((f) => f.endsWith(".mp4")).sort().reverse().slice(3)
    .forEach((f) => rmSync(join(carpeta, f)));

  const reel = { fecha: sello, generado: entrada.generado, video: `reels/${archivo}`, segundos: Math.round(total), texto: texto(top),
    ofertas: top.map((o) => ({ n: o.n, titulo: o.titulo, tienda: o.tienda || "mercadolibre" })) };
  writeFileSync(join(salida, "reel.json"), JSON.stringify(reel, null, 2) + "\n");
  return reel;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = await generar();
  if (r) console.log(`✅ Reel de ${r.segundos} s: ${r.video} con ${r.ofertas.length} ofertas`);
}
