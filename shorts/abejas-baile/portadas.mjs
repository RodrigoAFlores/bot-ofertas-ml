// Portadas del reel de las abejas: toma momentos del video (sin sus textos) y les pone un título grande.
//   node portadas.mjs  → portadas/portada-1.png … portada-4.png
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const { chromium } = createRequire(import.meta.url)(execSync("npm root -g").toString().trim() + "/playwright");
const SK = "../../skills/reel-sabias-que";
const fuente = readFileSync(`${SK}/assets/fredoka-700.woff2`).toString("base64");
const js = `window.CONFIG = ${readFileSync("config.json", "utf8")};\n` + readFileSync(`${SK}/assets/motor.js`, "utf8") + "\n" + readFileSync("escenas.js", "utf8") + `
const tituloReal = titulo, medallaReal = medalla;
const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
window.portada = (T, lineas, tam, dy = 0, medallaEn = null) => {
  // apaga los textos propios del video (y, si se pide, la medalla) para dejar solo la imagen
  titulo = () => {}; etiqueta = () => {}; if (medallaEn) medalla = () => {};
  render(T);
  titulo = tituloReal; medalla = medallaReal;
  const c = ctx;
  // baja la escena dy píxeles para dejar aire al título (arriba queda el mismo cielo, estirado)
  if (dy) { const t2 = tmp.getContext("2d"); t2.clearRect(0, 0, W, H); t2.drawImage(cv, 0, 0); c.drawImage(tmp, 0, 0, W, dy * 2, 0, 0, W, dy * 2 + 4); c.drawImage(tmp, 0, dy); }
  if (medallaEn) { for (let i = 0; i < 8; i++) estrellita(c, medallaEn[0] + Math.cos(i) * 190, medallaEn[1] + 40 + Math.sin(i) * 190, 24, i, C.ama); medallaReal(c, medallaEn[0], medallaEn[1], 1.3, 0.15); }
  const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, "rgba(10,10,30,0.6)"); g.addColorStop(1, "rgba(10,10,30,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, 1000);
  // etiqueta "¿SABÍAS QUE…?"
  c.font = '700 64px Fredoka'; const txt = "¿SABÍAS QUE…?", w = c.measureText(txt).width;
  c.fillStyle = C.ama; redondo(c, W / 2 - w / 2 - 40, 150, w + 80, 100, 50); c.fill();
  c.fillStyle = C.tinta; c.textAlign = "center"; c.fillText(txt, W / 2, 222); c.textAlign = "left";
  titulo(c, lineas, 420, 0, 99, tam, ["#ffffff", "#ffffff", C.ama]);
};`;
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error(e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
const g = (k, s) => p.evaluate(([k, s]) => window.INI[k] + window.VO[k] + s, [k, s]);
const lista = [
  [await g(0, 3.25), ["LAS ABEJAS", "BAILAN PARA", "HABLAR 🐝💃"], 150, 260],
  [await g(2, 5.6), ["EL BAILE", "SECRETO DE", "LAS ABEJAS 🐝"], 150],
  [await g(3, 7.6), ["SU BAILE", "¡ES UN", "MAPA! 🗺️☀️"], 150],
  [await g(4, 6.9), ["¡GANÓ UN", "NOBEL POR", "ESTE BAILE! 🏆"], 150, 120, [830, 980]],
];
for (let i = 0; i < lista.length; i++) {
  const url = await p.evaluate(([T, l, tam, dy, m]) => { window.portada(T, l, tam, dy, m); return document.getElementById("c").toDataURL("image/png"); }, lista[i]);
  writeFileSync(`portadas/portada-${i + 1}.png`, Buffer.from(url.split(",")[1], "base64"));
}
await b.close();
console.log("4 portadas listas");
