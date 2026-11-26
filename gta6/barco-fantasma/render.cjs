// Uso: node render.cjs preview  |  node render.cjs video
(async () => {
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const mode = process.argv[2] || 'preview';
const FPS = 30;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + path.resolve('mapa.html'));
await p.evaluate(() => document.fonts.ready);
const DUR = await p.evaluate(() => window.DUR);
const frame = async t => {
  const d = await p.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t);
  return Buffer.from(d.split(',')[1], 'base64');
};
if (mode === 'preview') {
  const fs = require('fs');
  fs.mkdirSync('preview', { recursive: true });
  for (const t of (process.argv[3] || '1.5,4.5,6.5,9,11.8,14.5,17,18.8,20.8,23.8,25.6').split(',').map(Number))
    fs.writeFileSync(`preview/t${t}.jpg`, await frame(t));
} else {
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', 'barco-fantasma-mapa.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < DUR * FPS; i++) { if (!ff.stdin.write(await frame(i / FPS))) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await b.close();
})();
