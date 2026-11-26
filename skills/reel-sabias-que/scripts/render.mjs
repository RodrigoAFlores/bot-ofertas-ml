// Renderiza un reel cuadro a cuadro (60 fps) con Chromium: motor.js + escenas.js del reel.
//   node render.mjs <reel> info                 → duración total y <reel>/eventos.json (sonidos)
//   node render.mjs <reel> prueba 1.2 5.5 …     → cuadros sueltos (segundos) en <reel>/prueba/
//   node render.mjs <reel> todo                 → todos los cuadros en <reel>/cuadros/, en 3 procesos paralelos
//   node render.mjs <reel> desde hasta          → cuadros [desde, hasta) (lo usa "todo")
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn, execSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(join(execSync("npm root -g").toString().trim(), "playwright"))); }
const FPS = 60;
const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [reelArg, modo, ...resto] = process.argv.slice(2);
const reel = resolve(reelArg);

if (modo === "todo") {
  // reparte el trabajo en 3 procesos (cada uno con su Chromium)
  const info = JSON.parse(execSync(`node "${fileURLToPath(import.meta.url)}" "${reel}" info`).toString().trim().split("\n").pop());
  rmSync(join(reel, "cuadros"), { recursive: true, force: true });
  const n = info.frames, partes = 3, paso = Math.ceil(n / partes);
  await Promise.all(Array.from({ length: partes }, (_, i) => new Promise((ok, mal) => {
    const p = spawn("node", [fileURLToPath(import.meta.url), reel, String(i * paso), String(Math.min(n, (i + 1) * paso))], { stdio: "inherit" });
    p.on("exit", (c) => (c ? mal(new Error("falló el render " + i)) : ok()));
  })));
  console.log(`${n} cuadros listos en ${join(reel, "cuadros")}`);
  process.exit(0);
}

const fuente = readFileSync(join(SKILL, "assets/fredoka-700.woff2")).toString("base64");
const config = readFileSync(join(reel, "config.json"), "utf8");
const js = `window.CONFIG = ${config};\n` + readFileSync(join(SKILL, "assets/motor.js"), "utf8") + "\n" + readFileSync(join(reel, "escenas.js"), "utf8");
const b = await chromium.launch();
const p = await b.newPage();
p.on("pageerror", (e) => { console.error("ERROR en escenas:", e.message); process.exit(1); });
await p.setContent(`<style>@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${fuente})}</style><canvas id="c"></canvas><script>${js}</script>`);
await p.evaluate(() => window.preparar());
const total = await p.evaluate(() => window.TOTAL);
const guardar = async (t, ruta) => {
  const url = await p.evaluate((t) => { window.render(t); return document.getElementById("c").toDataURL("image/png"); }, t);
  writeFileSync(ruta, Buffer.from(url.split(",")[1], "base64"));
};
if (modo === "info") {
  writeFileSync(join(reel, "eventos.json"), JSON.stringify(await p.evaluate(() => window.eventos())));
  console.log(JSON.stringify({ total, frames: Math.ceil(total * FPS), ini: await p.evaluate(() => window.INI) }));
} else if (modo === "prueba") {
  const dir = join(reel, "prueba"); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  for (let i = 0; i < resto.length; i++) await guardar(Number(resto[i]), join(dir, `${String(i).padStart(3, "0")}.png`));
  console.log(resto.length, "cuadros de prueba en", dir);
} else {
  mkdirSync(join(reel, "cuadros"), { recursive: true });
  const a = Number(modo), z = Math.min(Number(resto[0]), Math.ceil(total * FPS));
  for (let f = a; f < z; f++) await guardar(f / FPS, join(reel, "cuadros", `${String(f).padStart(5, "0")}.png`));
  console.log(`cuadros ${a}-${z} listos`);
}
await b.close();
