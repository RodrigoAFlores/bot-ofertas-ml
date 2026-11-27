// Uso (desde gta6/):
//   node motor/render.cjs <carpeta> preview [t1,t2,...]  → <carpeta>/preview/*.jpg (+ hoja.jpg)
//   node motor/render.cjs <carpeta> video                → <carpeta>/<carpeta>.mp4 (con mezcla.wav si existe)
//   node motor/render.cjs <carpeta> portada              → <carpeta>/portada.jpg (usa drawCover)
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = path.resolve(process.argv[2]), mode = process.argv[3] || 'preview';
  fs.copyFileSync(path.join(__dirname, 'plantilla.html'), path.join(dir, 'video.html'));
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('ERROR en la página:', e.message));
  await p.goto('file://' + path.join(dir, 'video.html'));
  await p.evaluate(async () => { await document.fonts.load('40px GTA'); await document.fonts.load('700 40px GTAsub'); await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  const DUR = await p.evaluate(() => window.DUR);
  const shot = async (fn, t, fmt = 'image/jpeg') => Buffer.from((await p.evaluate(([fn, t, fmt]) => { window[fn](t); return document.getElementById('c').toDataURL(fmt, 0.93); }, [fn, t, fmt])).split(',')[1], 'base64');
  const name = path.basename(dir);
  if (mode === 'preview') {
    const out = path.join(dir, 'preview'); fs.mkdirSync(out, { recursive: true });
    const ts = (process.argv[4] || '').split(',').filter(Boolean).map(Number);
    const times = ts.length ? ts : Array.from({ length: 12 }, (_, i) => +(0.5 + i * (DUR - 1) / 11).toFixed(2));
    for (const [i, t] of times.entries()) fs.writeFileSync(path.join(out, `${String(i).padStart(2, '0')}_t${t}.jpg`), await shot('draw', t));
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-pattern_type', 'glob', '-i', path.join(out, '*_t*.jpg'), '-vf', 'scale=270:480,tile=6x2', '-frames:v', '1', path.join(out, 'hoja.jpg')]);
    console.log('DUR', DUR, 'tiempos', times.join(','));
  } else if (mode === 'portada') {
    fs.writeFileSync(path.join(dir, 'portada.jpg'), await shot('drawCover', 0));
  } else {
    const FPS = 30, tmp = path.join(dir, '_sin_audio.mp4');
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
    const N = Math.round(DUR * FPS);
    for (let i = 0; i < N; i++) { if (!ff.stdin.write(await shot('draw', i / FPS))) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    const wav = path.join(dir, 'mezcla.wav'), mp4 = path.join(dir, `${name}.mp4`);
    if (fs.existsSync(wav)) {
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4]);
      fs.unlinkSync(tmp);
    } else fs.renameSync(tmp, mp4);
    console.log('listo', mp4);
  }
  await b.close();
})();
