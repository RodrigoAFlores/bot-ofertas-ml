// Uso: node render.cjs <archivo.html> preview [t1,t2,...]   |   node render.cjs <archivo.html> video
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const html = process.argv[2] || 'mapa-real.html', mode = process.argv[3] || 'preview';
  const name = path.basename(html, '.html'), FPS = 30;
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(html));
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  const DUR = await p.evaluate(() => window.DUR);
  const frame = async t => Buffer.from((await p.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, t)).split(',')[1], 'base64');
  if (mode === 'preview') {
    fs.mkdirSync('preview', { recursive: true });
    for (const t of (process.argv[4] || '1.5,4.5,7,9,11.8,14.5,17,19,21,24.5,26.8').split(',').map(Number))
      fs.writeFileSync(`preview/${name}-t${t}.jpg`, await frame(t));
  } else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', `${name}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < DUR * FPS; i++) { if (!ff.stdin.write(await frame(i / FPS))) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close();
})();
