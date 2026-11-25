// Renderiza escenas.js cuadro a cuadro con Chromium.
//   node render.mjs            → todos los cuadros en cuadros/ + eventos.json
//   node render.mjs 1 8 20     → solo esos segundos, en prueba/
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const FPS = 30;
const js = readFileSync(new URL("./escenas.js", import.meta.url), "utf8");
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error("ERROR:", e.message); process.exit(1); });
await p.setContent(`<canvas id="c"></canvas><script>${js}</script>`);
const total = await p.evaluate(() => window.TOTAL);
const solo = process.argv.slice(2).map(Number);
const dir = solo.length ? "prueba" : "cuadros";
mkdirSync(dir, { recursive: true });
const tiempos = solo.length ? solo : Array.from({ length: Math.ceil(total * FPS) }, (_, i) => i / FPS);
for (let i = 0; i < tiempos.length; i++) {
  const url = await p.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, tiempos[i]);
  writeFileSync(`${dir}/${String(i).padStart(5, "0")}.png`, Buffer.from(url.split(",")[1], "base64"));
}
if (!solo.length) writeFileSync("eventos.json", JSON.stringify(await p.evaluate(() => window.eventos())));
console.log(`${tiempos.length} cuadros, total ${total.toFixed(2)} s`);
await b.close();
