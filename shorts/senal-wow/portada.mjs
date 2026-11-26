// Portada del reel de la señal Wow!: antena brillando + el papel con 6EQUJ5 encerrado y "Wow!".
//   node portada.mjs → portada.png
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
const { chromium } = createRequire(import.meta.url)(execSync("npm root -g").toString().trim() + "/playwright");
const SK = "../../skills/reel-sabias-que";
const fuente = readFileSync(`${SK}/assets/fredoka-700.woff2`).toString("base64");
const js = `window.CONFIG = ${readFileSync("config.json", "utf8")};\n` + readFileSync(`${SK}/assets/motor.js`, "utf8") + "\n" + readFileSync("escenas.js", "utf8") + `
window.portada = (T) => {
  const tituloReal = titulo;
  titulo = () => {}; render(T); titulo = tituloReal;
  const c = ctx;
  // oscurece arriba para el texto
  const g = c.createLinearGradient(0, 0, 0, 1000); g.addColorStop(0, "rgba(2,3,15,0.75)"); g.addColorStop(1, "rgba(2,3,15,0)");
  c.fillStyle = g; c.fillRect(0, 0, W, 1000);
  // etiqueta superior
  c.font = "700 58px Fredoka"; const txt = "MISTERIO SIN RESOLVER", w = c.measureText(txt).width;
  c.fillStyle = C.senal; redondo(c, W / 2 - w / 2 - 40, 150, w + 80, 96, 48); c.fill();
  c.fillStyle = "#06102a"; c.textAlign = "center"; c.fillText(txt, W / 2, 218); c.textAlign = "left";
  titulo(c, ["LA SEÑAL QUE", "NADIE PUEDE", "EXPLICAR 👽"], 420, 0, 99, 140, ["#ffffff", "#ffffff", C.senal]);
  // el papel con el código, inclinado, con sombra
  c.save(); c.translate(560, 1330); c.rotate(-0.07);
  c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 50; c.shadowOffsetY = 20; c.fillStyle = C.papel; c.fillRect(-270, -320, 540, 640); c.shadowColor = "transparent";
  papelContinuo(c, -270, -320, 540, 640, 0, 3, 6, 4);
  const cx = -270 + 50 + 3 * 44 + 13, cyA = -320 + 5 * 56 - 20, cyB = -320 + 10 * 56 - 20;
  circuloMano(c, cx, (cyA + cyB) / 2, 58, (cyB - cyA) / 2 + 60, 1);
  escrituraMano(c, "Wow!", cx + 80, (cyA + cyB) / 2 + 10, 130, 1);
  c.restore();
  // brillo de "señal" alrededor del papel
  const rg = c.createRadialGradient(560, 1330, 200, 560, 1330, 560); rg.addColorStop(0, "rgba(94,240,255,0)"); rg.addColorStop(0.6, "rgba(94,240,255,0.10)"); rg.addColorStop(1, "rgba(94,240,255,0)");
  c.fillStyle = rg; c.fillRect(0, 700, W, 1300);
  // fecha
  c.font = "700 64px Fredoka"; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 20;
  c.fillText("15 · AGOSTO · 1977", W / 2, 1760); c.shadowColor = "transparent"; c.textAlign = "left";
};`;
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error(e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
// momento de la escena 1 con la antena encendida y sin interferencia
const T = await p.evaluate(() => window.INI[0] + window.VO[0] + 7.3);
const url = await p.evaluate((T) => { window.portada(T); return document.getElementById("c").toDataURL("image/png"); }, T);
writeFileSync("portada.png", Buffer.from(url.split(",")[1], "base64"));
await b.close();
console.log("portada lista");
