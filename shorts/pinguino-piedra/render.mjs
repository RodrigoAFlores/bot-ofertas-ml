// Renderiza escena.js a 60 fps con Chromium.
//   node render.mjs prueba 1.2 5.5 ...   → cuadros sueltos (segundos) en prueba/
//   node render.mjs desde hasta          → cuadros [desde, hasta) en cuadros/ (para correr en paralelo)
//   node render.mjs info                 → duración total y eventos.json
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const FPS = 60;
const fuente = readFileSync("../demo-vectorial/node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2").toString("base64");
const js = readFileSync("escena.js", "utf8");
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error("ERROR:", e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
const total = await p.evaluate(() => window.TOTAL);
const [modo, ...resto] = process.argv.slice(2);
const guardar = async (t, ruta) => {
  const url = await p.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, t);
  writeFileSync(ruta, Buffer.from(url.split(",")[1], "base64"));
};
if (modo === "info") {
  writeFileSync("eventos.json", JSON.stringify(await p.evaluate(() => window.eventos())));
  console.log(JSON.stringify({ total, frames: Math.ceil(total * FPS), ini: await p.evaluate(() => window.INI), vo: await p.evaluate(() => window.VO) }));
} else if (modo === "prueba") {
  mkdirSync("prueba", { recursive: true });
  for (let i = 0; i < resto.length; i++) await guardar(Number(resto[i]), `prueba/${String(i).padStart(3, "0")}.png`);
  console.log(resto.length, "cuadros de prueba");
} else {
  mkdirSync("cuadros", { recursive: true });
  const [a, z] = [Number(modo), Math.min(Number(resto[0]), Math.ceil(total * FPS))];
  for (let f = a; f < z; f++) await guardar(f / FPS, `cuadros/${String(f).padStart(5, "0")}.png`);
  console.log(`cuadros ${a}-${z} listos`);
}
await b.close();
