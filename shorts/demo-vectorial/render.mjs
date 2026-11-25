// Renderiza escena.js a 60 fps con Chromium.  node render.mjs [segundos sueltos...]
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const FPS = 60;
const fuente = readFileSync("node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2").toString("base64");
const js = readFileSync("escena.js", "utf8");
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error("ERROR:", e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
const solo = process.argv.slice(2).map(Number);
const dir = solo.length ? "prueba" : "cuadros";
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
const dur = await p.evaluate(() => window.DUR);
const ts = solo.length ? solo : Array.from({ length: Math.round(dur * FPS) }, (_, i) => i / FPS);
for (let i = 0; i < ts.length; i++) {
  const url = await p.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, ts[i]);
  writeFileSync(`${dir}/${String(i).padStart(5, "0")}.png`, Buffer.from(url.split(",")[1], "base64"));
}
console.log(ts.length, "cuadros");
await b.close();
