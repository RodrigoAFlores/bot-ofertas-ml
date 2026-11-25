// Genera las capas de texto (PNG transparentes 1080x1920) con Chromium.
import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;background:transparent;font-family:"Liberation Sans","DejaVu Sans",sans-serif;position:relative;overflow:hidden}
.t{position:absolute;left:60px;right:60px;top:230px;text-align:center;font-weight:900;font-size:96px;line-height:1.08;color:#fff;
   -webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 8px 24px rgba(0,0,0,.7);letter-spacing:1px}
.t span.e{-webkit-text-stroke:0;font-family:"Noto Color Emoji"}
.hl{color:#FFD43B}
.ab{position:absolute;left:50px;width:150px;height:150px;border-radius:30px;background:#FFD43B;color:#000;font-weight:900;font-size:110px;
    display:flex;align-items:center;justify-content:center;border:6px solid #000;box-shadow:0 10px 30px rgba(0,0,0,.6)}
.sub{position:absolute;left:50%;transform:translateX(-50%);bottom:330px;background:#E62117;color:#fff;font-weight:900;font-size:64px;
     padding:30px 70px;border-radius:24px;box-shadow:0 12px 40px rgba(0,0,0,.6);display:flex;gap:24px;align-items:center}
.bell{font-family:"Noto Color Emoji";font-size:60px}
.wm{position:absolute;right:30px;bottom:40px;color:rgba(255,255,255,.55);font-size:26px;font-weight:700}
`;
const e = (s) => `<span class="e">${s}</span>`;
const pages = {
  t1: `<div class="t">NO TE <span class="hl">OLVIDAN</span> ${e("🐦‍⬛")}</div>`,
  t2: `<div class="t" style="top:40px;font-size:88px">¿A o B? ${e("🤔")}</div>
       <div class="ab" style="top:230px">A</div><div class="ab" style="top:1180px">B</div>`,
  t3: `<div class="t">SE LO CONTARON <span class="hl">A OTROS</span> ${e("😳")}</div>`,
  t4: `<div class="t">ERA LA B:<br><span class="hl">MÁSCARAS</span> ${e("🎭")}</div>`,
  t5: `<div class="t">¿ACERTASTE? ${e("👇")}</div>`,
  sub: `<div class="sub">SUSCRÍBETE <span class="bell">🔔</span></div>`,
  ia: `<div class="wm">Imágenes y voz generadas con IA</div>`,
};
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [k, html] of Object.entries(pages)) {
  await p.setContent(`<style>${css}</style>${html}`);
  await p.screenshot({ path: `ov/${k}.png`, omitBackground: true });
}
await b.close();
