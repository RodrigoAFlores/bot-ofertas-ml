// Historias (3 partes) del reel de las abejas, para subir y que la gente comente.
//   node historias.mjs → historias/historia-1.png … historia-3.png
// Zonas seguras: arriba ~250 px y abajo ~350 px los tapa la interfaz de la app.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const { chromium } = createRequire(import.meta.url)(execSync("npm root -g").toString().trim() + "/playwright");
const SK = "../../skills/reel-sabias-que";
const fuente = readFileSync(`${SK}/assets/fredoka-700.woff2`).toString("base64");
const js = `window.CONFIG = ${readFileSync("config.json", "utf8")};\n` + readFileSync(`${SK}/assets/motor.js`, "utf8") + "\n" + readFileSync("escenas.js", "utf8") + `
const tituloReal = titulo, etiquetaReal = etiqueta, emojiReal = emoji;
const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
function fondo(T, oscuro = 0, dy = 0) {
  titulo = () => {}; etiqueta = () => {}; emoji = () => {};
  render(T);
  titulo = tituloReal; etiqueta = etiquetaReal; emoji = emojiReal;
  // baja la escena para dejar aire arriba al texto (arriba queda el mismo cielo, estirado)
  if (dy) { const t2 = tmp.getContext("2d"); t2.clearRect(0, 0, W, H); t2.drawImage(cv, 0, 0); ctx.drawImage(tmp, 0, 0, W, dy * 2, 0, 0, W, dy * 2 + 4); ctx.drawImage(tmp, 0, dy); }
  if (oscuro) { ctx.fillStyle = "rgba(15,10,30," + oscuro + ")"; ctx.fillRect(0, 0, W, H); }
}
function caja(texto, y, tam, fondoCol, col, ancho = 900) {
  const c = ctx; c.font = "700 " + tam + "px Fredoka, 'Noto Color Emoji'";
  // corta en líneas que quepan
  const palabras = texto.split(" "), lineas = []; let l = "";
  for (const p of palabras) { const prueba = l ? l + " " + p : p; if (c.measureText(prueba).width > ancho - 80 && l) { lineas.push(l); l = p; } else l = prueba; }
  lineas.push(l);
  const alto = lineas.length * tam * 1.2 + tam * 0.8;
  c.fillStyle = "rgba(0,0,0,0.25)"; redondo(c, W / 2 - ancho / 2 + 6, y + 8, ancho, alto, 40); c.fill();
  c.fillStyle = fondoCol; redondo(c, W / 2 - ancho / 2, y, ancho, alto, 40); c.fill();
  c.fillStyle = col; c.textAlign = "center";
  lineas.forEach((t, i) => c.fillText(t, W / 2, y + tam * 1.15 + i * tam * 1.2));
  c.textAlign = "left";
  return y + alto;
}
function parte(n) {
  const c = ctx;
  c.font = "700 46px Fredoka"; c.fillStyle = "rgba(255,255,255,0.92)"; redondo(c, W - 230, 270, 160, 76, 38); c.fill();
  c.fillStyle = C.tinta; c.textAlign = "center"; c.fillText(n + "/3", W - 150, 324); c.textAlign = "left";
}
function oscurecerArriba(h = 1000) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(10,10,30,0.65)"); g.addColorStop(1, "rgba(10,10,30,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, h); }
window.historia = (n, T) => {
  const c = ctx;
  if (n === 1) {
    fondo(T, 0, 330); oscurecerArriba();
    caja("¿SABÍAS QUE…?", 270, 58, C.ama, C.tinta, 520);
    titulo(c, ["LAS ABEJAS", "¡BAILAN PARA", "HABLAR! 🐝💃"], 520, 0, 99, 140, ["#ffffff", "#ffffff", C.ama]);
    caja("Toca para descubrir cómo 👉", 1480, 56, "#ffffff", C.tinta, 940);
  }
  if (n === 2) {
    fondo(T, 0.35); oscurecerArriba(900);
    titulo(c, ["¿QUÉ LES DICE", "CON SU BAILE? 🤔"], 470, 0, 99, 118, ["#ffffff", C.ama]);
    caja("A) 🌸 DÓNDE HAY FLORES", 690, 64, "#ffffff", C.tinta, 900);
    caja("B) ⚠️ QUE HAY PELIGRO", 860, 64, "#ffffff", C.tinta, 900);
    caja("¡VOTA AQUÍ! 👇", 1050, 60, C.ama, C.tinta, 520);
    // espacio libre (1180–1520) para el sticker de encuesta
  }
  if (n === 3) {
    fondo(T); oscurecerArriba(1100);
    titulo(c, ["¡ERA LA A!", "DÓNDE HAY FLORES 🌸"], 470, 0, 99, 112, ["#ffffff", C.ama]);
    let y = caja("Su baile marca hacia dónde volar y qué tan lejos están las flores ☀️", 640, 50, "rgba(22,32,58,0.88)", "#ffffff", 940);
    y = caja("¡Y un científico ganó el Premio Nobel por descifrarlo! 🏆", y + 24, 50, "rgba(22,32,58,0.88)", "#ffffff", 940);
    caja("💬 ¿A quién le enseñarías este baile? ¡Comenta!", 1330, 54, C.ama, C.tinta, 940);
    caja("Mira el reel completo en mi perfil 🐝", 1560, 46, "#ffffff", C.tinta, 960);
  }
  parte(n);
};`;
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error(e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
await p.evaluate(() => document.fonts.load('64px "Noto Color Emoji"', "🤔⚠️👉🌸☀️🏆💬🐝💃👇"));
const g = (k, s) => p.evaluate(([k, s]) => window.INI[k] + window.VO[k] + s, [k, s]);
const momentos = [await g(0, 3.25), await g(2, 5.6), await g(5, 1.9)];
for (let i = 0; i < 3; i++) {
  const url = await p.evaluate(([n, T]) => { window.historia(n, T); return document.getElementById("c").toDataURL("image/png"); }, [i + 1, momentos[i]]);
  writeFileSync(`historias/historia-${i + 1}.png`, Buffer.from(url.split(",")[1], "base64"));
}
await b.close();
console.log("3 historias listas");
