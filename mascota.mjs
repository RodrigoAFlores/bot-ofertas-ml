// Video de la mascota "Ofertín": una bolsita de compras que presenta la mejor oferta del día con voz.
//
//   node mascota.mjs   → usa data/ofertas.json y escribe docs/mascota/<fecha>.mp4 y docs/mascota.json
//
// 1) Guion con datos reales de la oferta (precio, descuento, ventas, estrellas). Nunca dice que la compró.
// 2) Voz en español con Piper (programa de voz gratuito y abierto), una frase a la vez para saber cuánto dura.
// 3) La boca se abre según el volumen de la voz, cuadro por cuadro; parpadea; subtítulos por frase.
// 4) Chrome dibuja cada cuadro y ffmpeg une cuadros + voz. Se avisa en el texto que el video es con IA.

import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const BASE = dirname(fileURLToPath(import.meta.url));
const VOZ = process.env.PIPER_VOZ || join(BASE, "voz", "es_MX-claude-high.onnx");
const FPS = 30;
const clp = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tienda = (o) => (o.tienda === "falabella" ? "Falabella" : "Mercado Libre");

// Nombre corto para decirlo en voz alta: hasta 6 palabras, sin códigos de modelo.
function nombreCorto(titulo) {
  const palabras = titulo.replace(/[|()\[\]]/g, " ").split(/\s+/).filter((p) => p && !/\d{3,}|^[A-Z0-9-]{6,}$/.test(p));
  return palabras.slice(0, 6).join(" ");
}

function guion(o) {
  const frases = [
    `¡Hola! Soy Ofertín, y hoy encontré esto en ${tienda(o)}.`,
    `${nombreCorto(o.titulo)}.`,
    o.precio_anterior ? `Antes costaba ${Math.round(o.precio_anterior)} pesos, y hoy está a ${Math.round(o.precio)}.` : `Hoy está a ${Math.round(o.precio)} pesos.`,
    o.descuento_pct ? `¡Eso es un ${o.descuento_pct} por ciento menos!` : null,
    o.vendidos >= 1000 ? `Y ya lleva más de ${o.vendidos < 2000 ? "" : Math.round(o.vendidos / 1000) + " "}mil vendidos.` : o.nota ? `Y tiene ${String(o.nota).replace(".", " coma ")} estrellas.` : null,
    "El link está en mis historias. ¡Sígueme para más ofertas!",
  ];
  return frases.filter(Boolean);
}

// La mejor oferta: mezcla descuento y ventas (lo que más llama la atención y más se vende).
function elegir(ofertas) {
  const valor = (o) => o.descuento_pct * Math.log10((o.vendidos || 0) + 10);
  return ofertas.filter((o) => o.tipo !== "popular" && o.descuento_pct > 0 && o.foto).sort((a, b) => valor(b) - valor(a))[0];
}

// Lee un WAV PCM de 16 bits y devuelve el volumen (0 a 1) de cada cuadro de video.
function volumenes(ruta) {
  const b = readFileSync(ruta);
  let pos = 12, fmt = null, datos = null;
  while (pos < b.length - 8) {
    const id = b.toString("ascii", pos, pos + 4), tam = b.readUInt32LE(pos + 4);
    if (id === "fmt ") fmt = { canales: b.readUInt16LE(pos + 10), tasa: b.readUInt32LE(pos + 12) };
    if (id === "data") { datos = b.subarray(pos + 8, pos + 8 + tam); break; }
    pos += 8 + tam + (tam % 2);
  }
  const porCuadro = Math.round(fmt.tasa / FPS) * fmt.canales;
  const muestras = datos.length / 2, salida = [];
  for (let i = 0; i < muestras; i += porCuadro) {
    let suma = 0, n = 0;
    for (let j = i; j < Math.min(i + porCuadro, muestras); j++) { const v = datos.readInt16LE(j * 2) / 32768; suma += v * v; n++; }
    salida.push(Math.sqrt(suma / Math.max(n, 1)));
  }
  const max = Math.max(...salida, 0.01);
  return salida.map((v) => Math.min(1, v / (max * 0.7)));
}

const PAGINA = (o) => `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1920px; background: #101b3b; color: #fff; overflow: hidden; position: relative;
       font-family: -apple-system, "Inter", "Helvetica Neue", Arial, sans-serif; }
.producto { position: absolute; top: 110px; left: 70px; right: 70px; background: #fff; border-radius: 50px; height: 760px;
            display: flex; align-items: center; justify-content: center; padding: 50px; }
.producto img { max-width: 100%; max-height: 100%; object-fit: contain; }
.off { position: absolute; top: -26px; right: -18px; background: #e8003d; font-weight: 900; font-size: 100px; line-height: 1;
       padding: 26px 34px; border-radius: 40px; transform: rotate(5deg); text-align: center; } .off small { display: block; font-size: 40px; }
.tag { position: absolute; top: 40px; left: 70px; font-size: 40px; font-weight: 700; opacity: .9; }
.precio { position: absolute; top: 900px; left: 70px; right: 70px; display: flex; align-items: baseline; gap: 26px; }
.ahora { font-size: 120px; font-weight: 900; color: #ffd400; } .antes { font-size: 54px; opacity: .7; text-decoration: line-through; }
#sub { position: absolute; left: 60px; right: 60px; bottom: 120px; text-align: center; font-size: 62px; font-weight: 900; line-height: 1.2;
       text-shadow: 0 4px 0 #000, 0 0 18px #000; min-height: 160px; }
#mascota { position: absolute; left: 50%; bottom: 330px; width: 470px; margin-left: -235px; }
.ia { position: absolute; top: 46px; right: 70px; font-size: 30px; opacity: .7; }
</style></head><body>
<div class="tag">${tienda(o)}</div><div class="ia">🤖 Hecho con IA</div>
<div class="producto"><img src="${esc(o.foto)}">${o.descuento_pct ? `<div class="off">${o.descuento_pct}%<small>OFF</small></div>` : ""}</div>
<div class="precio"><div class="ahora">${clp(o.precio)}</div>${o.precio_anterior ? `<div class="antes">${clp(o.precio_anterior)}</div>` : ""}</div>
<svg id="mascota" viewBox="0 0 300 330">
  <path d="M95 92 C95 30 205 30 205 92" fill="none" stroke="#e0b800" stroke-width="16" stroke-linecap="round"/>
  <g id="cuerpo">
    <rect x="25" y="85" width="250" height="230" rx="42" fill="#ffd400" stroke="#e0b800" stroke-width="6"/>
    <circle cx="95" cy="225" r="20" fill="#ff9a9a" opacity=".6"/><circle cx="205" cy="225" r="20" fill="#ff9a9a" opacity=".6"/>
    <g id="ojos"><ellipse cx="110" cy="175" rx="24" ry="28" fill="#fff"/><ellipse cx="190" cy="175" rx="24" ry="28" fill="#fff"/>
      <circle cx="114" cy="180" r="12" fill="#101b3b"/><circle cx="194" cy="180" r="12" fill="#101b3b"/></g>
    <rect id="parpado1" x="84" y="145" width="52" height="0" fill="#ffd400"/><rect id="parpado2" x="164" y="145" width="52" height="0" fill="#ffd400"/>
    <ellipse id="boca" cx="150" cy="250" rx="34" ry="5" fill="#7a1f2b"/>
  </g>
</svg>
<div id="sub"></div>
<script>
window.cuadro = (abre, parpado, rebote, texto) => {
  document.getElementById("boca").setAttribute("ry", 5 + abre * 30);
  document.getElementById("boca").setAttribute("rx", 34 - abre * 6);
  for (const id of ["parpado1", "parpado2"]) document.getElementById(id).setAttribute("height", parpado * 62);
  document.getElementById("cuerpo").setAttribute("transform", "translate(0," + (-rebote * 10) + ")");
  document.getElementById("sub").textContent = texto;
};
</script></body></html>`;

export async function generar({ datos = join(BASE, "data", "ofertas.json"), salida = join(BASE, "docs") } = {}) {
  const entrada = JSON.parse(readFileSync(datos, "utf8"));
  const o = elegir(entrada.ofertas);
  if (!o) { console.log("No hay oferta para la mascota."); return null; }
  const sello = new Date(entrada.generado).toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
  const frases = guion(o);
  const tmp = mkdtempSync(join(tmpdir(), "mascota-"));

  // 2) Voz: una frase por archivo, con una pausa corta entre frases.
  const tramos = [];
  const lista = [];
  let inicio = 0;
  frases.forEach((f, i) => {
    const wav = join(tmp, `f${i}.wav`);
    execFileSync("piper", ["--model", VOZ, "--output_file", wav, "--sentence_silence", "0.25"], { input: f });
    const vol = volumenes(wav);
    tramos.push({ texto: f, desde: inicio, hasta: inicio + vol.length, vol });
    inicio += vol.length;
    lista.push(`file '${wav}'`);
  });
  writeFileSync(join(tmp, "lista.txt"), lista.join("\n"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", join(tmp, "lista.txt"), "-ar", "44100", join(tmp, "voz.wav")]);

  // 3) Cuadros: boca según el volumen (suavizado), parpadeo cada ~3 s, rebote suave.
  const cuadros = inicio + FPS; // un segundo extra al final, con la boca cerrada
  const navegador = await chromium.launch({ channel: "chrome", headless: true, args: process.env.CI ? ["--no-sandbox"] : [] });
  try {
    const page = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
    await page.setContent(PAGINA(o), { waitUntil: "networkidle" });
    let abre = 0;
    for (let c = 0; c < cuadros; c++) {
      const tramo = tramos.find((t) => c >= t.desde && c < t.hasta);
      const objetivo = tramo ? tramo.vol[c - tramo.desde] : 0;
      abre = abre + (objetivo - abre) * 0.6;
      const enCiclo = c % 95, parpado = enCiclo < 3 ? 1 - Math.abs(enCiclo - 1.5) / 1.5 : 0;
      const rebote = (Math.sin((c / FPS) * Math.PI * 2) + 1) / 2;
      await page.evaluate(([a, p, r, t]) => window.cuadro(a, p, r, t), [abre, parpado, rebote, tramo ? tramo.texto : frases.at(-1)]);
      await page.screenshot({ path: join(tmp, `c${String(c).padStart(5, "0")}.jpg`), type: "jpeg", quality: 88 });
    }
  } finally {
    await navegador.close();
  }

  // 4) Video
  const carpeta = join(salida, "mascota");
  mkdirSync(carpeta, { recursive: true });
  const archivo = `${sello}.mp4`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-framerate", String(FPS), "-i", join(tmp, "c%05d.jpg"), "-i", join(tmp, "voz.wav"),
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
    "-af", "apad", "-shortest", "-movflags", "+faststart", join(carpeta, archivo)]);
  rmSync(tmp, { recursive: true, force: true });
  readdirSync(carpeta).filter((f) => f.endsWith(".mp4")).sort().reverse().slice(3).forEach((f) => rmSync(join(carpeta, f)));

  const info = {
    fecha: sello, video: `mascota/${archivo}`, segundos: Math.round(cuadros / FPS),
    oferta: { n: o.n, titulo: o.titulo, tienda: o.tienda || "mercadolibre" }, guion: frases,
    texto: [`🛍️ Ofertín encontró esto en ${tienda(o)}: ${o.titulo.slice(0, 70)}`, "",
      `💰 ${clp(o.precio)}` + (o.precio_anterior ? ` (antes ${clp(o.precio_anterior)}) · ${o.descuento_pct}% OFF` : ""),
      "🔗 Link en las historias · 👉 Síguenos para más ofertas", "",
      "🤖 Video hecho con IA: Ofertín es nuestra mascota virtual.",
      "#ofertas #descuentos #ofertaschile #chile"].join("\n"),
  };
  writeFileSync(join(salida, "mascota.json"), JSON.stringify(info, null, 2) + "\n");
  return info;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = await generar();
  if (r) console.log(`✅ Video de Ofertín de ${r.segundos} s: ${r.video}\n   ${r.guion.join(" ")}`);
}
