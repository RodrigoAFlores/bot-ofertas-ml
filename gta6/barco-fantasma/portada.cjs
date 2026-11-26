// Portada vertical (1080x1920) usando el mismo mapa, dibujos y letras de mapa-real.html.
// Uso: node portada.cjs  → portada.jpg y portada.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve('mapa-real.html'));
  await p.evaluate(async () => { await document.fonts.load('40px GTA'); await document.fonts.load('700 40px GTAsub'); await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  const data = await p.evaluate(() => {
    const t = 23.5;
    performance_t = t;
    cam = { cx: 1078, cy: 452, s: 3.6 };
    drawMap();
    night(1.25);
    // viñeta
    const v = x.createRadialGradient(W/2, H/2, 300, W/2, H/2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    fog(t, .8);
    // ruta
    route([START, [990, 452], [1020, 468], ISLW], 1, CYAN);
    route([LH, HOUSE], 1, GOLD, 8);
    route([HOUSE, [1048, 466], DOCK], 1, GOLD, 8);
    route([DOCK, [1068, 488], [1095, 476], FOG], 1, CYAN);
    // cono hacia el barco
    const [lx, ly] = S(LH), gx = 800, gy = 820;
    x.save(); x.globalAlpha = .35; x.fillStyle = GREEN;
    const ang = Math.atan2(gy - (ly - 90), gx - lx), R = Math.hypot(gx - lx, gy - ly + 90) * 1.3;
    x.beginPath(); x.moveTo(lx, ly - 90); x.arc(lx, ly - 90, R, ang - .35, ang + .35); x.closePath(); x.fill(); x.restore();
    lighthouse(LH, 1.7, 1, 1.2);
    ghostShip(gx, gy, 2.6, 1, 0);
    knife(250, 1240, 2.4, 1, 0.3);
    // títulos
    const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, 560);
    // sello GTA 6
    x.save(); x.translate(W/2, 120); x.rotate(-.04);
    x.fillStyle = '#000'; x.fillRect(-150, -52, 300, 104);
    x.fillStyle = '#ff3d8e'; x.fillRect(-142, -44, 284, 88);
    x.restore();
    glow('GTA 6', W/2, 116, 84, WHITE);
    glow('BARCO', W/2, 290, 210, PINK);
    glow('FANTASMA', W/2, 470, 200, PINK);
    // banda inferior
    const g2 = x.createLinearGradient(0, H - 620, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.35, 'rgba(0,0,0,.85)'); g2.addColorStop(1, 'rgba(0,0,0,.95)');
    x.fillStyle = g2; x.fillRect(0, H - 620, W, 620);
    glow('+ CUCHILLO MALDITO', W/2, 1520, 104, GREEN, 1, ['#d4ffb0', '#3dff7a', '#0f9e4a']);
    text('Ruta exacta en el mapa', W/2, 1650, 62, WHITE);
    text('Paso a paso 📍', W/2, 1740, 62, GOLD);
    return document.getElementById('c').toDataURL('image/png');
  });
  fs.writeFileSync('portada.png', Buffer.from(data.split(',')[1], 'base64'));
  await b.close();
})();
