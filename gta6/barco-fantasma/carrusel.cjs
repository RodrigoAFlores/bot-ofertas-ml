// Carrusel "paso a paso" del barco fantasma (1080x1350, formato 4:5 para Instagram/Facebook) + PDF.
// Reutiliza el mapa, los dibujos y las letras de mapa-real.html.
// Uso: node carrusel.cjs   → carrusel/01.jpg … 09.jpg y carrusel/barco-fantasma-paso-a-paso.pdf
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const SLIDES = `
const Y0 = 285, Y1 = 1635, TOTAL = 9;            // franja visible (1350 px) dentro del lienzo de 1920
function camara(cx, cy, s) { cam = { cx, cy, s }; drawMap(); }
function barraArriba(n, titulo, sub) {
  const g = x.createLinearGradient(0, Y0, 0, Y0 + 330); g.addColorStop(0, 'rgba(4,25,45,.96)'); g.addColorStop(.7, 'rgba(4,25,45,.8)'); g.addColorStop(1, 'rgba(4,25,45,0)');
  x.fillStyle = g; x.fillRect(0, Y0, W, 330);
  if (n) {
    x.fillStyle = PINK; x.beginPath(); x.arc(130, Y0 + 115, 72, 0, 7); x.fill();
    x.strokeStyle = '#000'; x.lineWidth = 8; x.stroke();
    glow(String(n), 130, Y0 + 120, 100, WHITE);
    glow(titulo, 225 + (W - 225) / 2 - 20, Y0 + 85, titulo.length > 14 ? 74 : 88, PINK);
    text(sub, 225 + (W - 225) / 2 - 20, Y0 + 175, 44, WHITE);
  } else {
    glow(titulo, W/2, Y0 + 90, 96, PINK);
    text(sub, W/2, Y0 + 180, 46, WHITE);
  }
}
function panelAbajo(lineas, tip) {
  const h = 70 + lineas.length * 62 + (tip ? 70 : 0), y = Y1 - 70 - h;
  x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 30;
  x.fillStyle = 'rgba(4,25,45,.95)'; rr(50, y, W - 100, h, 34); x.fill(); x.shadowBlur = 0;
  x.strokeStyle = PINK; x.lineWidth = 5; x.stroke(); x.restore();
  lineas.forEach((l, i) => text(l, W/2, y + 62 + i * 62, 44, WHITE));
  if (tip) text(tip, W/2, y + 62 + lineas.length * 62 + 10, 38, GOLD);
}
function pie(n) {
  text('GTA 6 · BARCO FANTASMA', 70, Y1 - 32, 30, 'rgba(255,255,255,.85)', 'left');
  text(n + ' / ' + TOTAL, W - 70, Y1 - 32, 30, 'rgba(255,255,255,.85)', 'right');
}
function rutas(hasta) {
  if (hasta >= 1) route([START, [990, 452], [1020, 468], ISLW], 1, CYAN);
  if (hasta >= 3) route([LH, HOUSE], 1, GOLD, 8);
  if (hasta >= 4) route([HOUSE, [1048, 466], DOCK], 1, GOLD, 8);
  if (hasta >= 5) route([DOCK, [1068, 488], [1095, 476], FOG], 1, CYAN);
}
function base(hasta, cx = 1040, cy = 458, s = 4.4, noche = true) {
  camara(cx, cy, s);
  if (noche) night(1);
  rutas(hasta);
  lighthouse(LH, 1.05, noche ? 1 : 0, 0.6);
  if (hasta >= 3) house(HOUSE, .9);
}
function fantasmas() {
  const [lx, ly] = S(LH);
  x.save(); x.fillStyle = 'rgba(210,255,225,.95)'; x.shadowColor = GREEN; x.shadowBlur = 26;
  x.beginPath(); x.arc(lx - 34, ly - 125, 16, 0, 7); x.fill();
  x.beginPath(); x.arc(lx + 46, ly - 112, 16, 0, 7); x.fill(); x.restore();
  text('👻 2 fantasmas discutiendo', lx - 40, ly - 190, 36, GREEN);
}

const SLIDE = [
  // 1. portada
  () => {
    performance_t = 23.5; camara(1078, 452, 3.6); night(1.25); viñetaC(); fog(23.5, .8);
    rutas(5);
    const [lx, ly] = S(LH), gx = 800, gy = 830;
    x.save(); x.globalAlpha = .35; x.fillStyle = GREEN;
    const ang = Math.atan2(gy - (ly - 90), gx - lx), R = Math.hypot(gx - lx, gy - ly + 90) * 1.3;
    x.beginPath(); x.moveTo(lx, ly - 90); x.arc(lx, ly - 90, R, ang - .35, ang + .35); x.closePath(); x.fill(); x.restore();
    lighthouse(LH, 1.7, 1, 1.2); ghostShip(gx, gy, 2.4, 1, 0); knife(250, 1230, 2.2, 1, .3);
    const g = x.createLinearGradient(0, Y0, 0, Y0 + 420); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, Y0, W, 420);
    glow('BARCO FANTASMA', W/2, Y0 + 110, 130, PINK);
    text('+ CUCHILLO MALDITO · GTA 6', W/2, Y0 + 220, 48, GREEN);
    panelAbajo(['GUÍA PASO A PASO', 'con la ruta exacta en el mapa'], 'Desliza →');
    pie(1);
  },
  // 2. ubicación
  () => {
    performance_t = 1; camara(820, 640, 1.12);
    pin([1058, 470], PINK, 1, '', .3);
    const [px, py] = S([1058, 470]);
    x.save(); x.strokeStyle = PINK; x.lineWidth = 8; x.beginPath(); x.arc(px, py, 70, 0, 7); x.stroke(); x.restore();
    barraArriba(0, '¿DÓNDE ESTÁ?', 'Noreste de Leonida');
    panelAbajo(['Isla Little Hardin', 'frente a Millport (Millport Basin)'], 'Ve de noche: el evento es entre la 1:00 y el amanecer');
    pie(2);
  },
  // 3. paso 1
  () => {
    performance_t = 1; base(1, 1035, 470, 4.4, false);
    pin(START, GOLD, 1, 'INICIO', .3);
    const [bx, by] = S([1020, 468]); boat(bx, by, .3, 1.5);
    barraArriba(1, 'CRUZA A LA ISLA', 'En lancha o moto de agua');
    panelAbajo(['Sal desde la costa de Millport', 'y cruza Millport Basin hacia el este'], 'La isla no tiene puente');
    pie(3);
  },
  // 4. paso 2
  () => { performance_t = 1; base(1); fantasmas();
    barraArriba(2, 'SUBE AL FARO', 'De noche'); reloj('NOCHE');
    panelAbajo(['Arriba verás a 2 fantasmas', 'discutiendo: uno empuja al otro'], 'Es la señal de que el evento empezó');
    pie(4); },
  // 5. paso 3
  () => { performance_t = 1; base(3);
    const [hx, hy] = S(HOUSE); text('📖 diario junto a la chimenea', hx - 40, hy - 90, 36, GOLD);
    barraArriba(3, 'LA CASA DEL OESTE', 'Al oeste del faro');
    panelAbajo(['Entra a la casa abandonada', 'y lee el diario del farero'], 'Está junto a la chimenea');
    pie(5); },
  // 6. paso 4
  () => { performance_t = 1; base(4);
    const [dx, dy] = S(DOCK); text('🤿 equipo de buceo', dx - 30, dy + 70, 36, CYAN);
    barraArriba(4, 'VE AL MUELLE', 'Muelle de la isla');
    panelAbajo(['En el bote del muelle', 'toma el equipo de buceo'], 'Lo vas a necesitar para el cuchillo');
    pie(6); },
  // 7. paso 5
  () => { performance_t = 20.5; base(5, 1070, 458, 4.0); fog(20.5, 1); 
    const [fx, fy] = S(FOG); boat(fx - 40, fy + 10, 0, 1.5);
    text('motor apagado → ¡bucea!', fx - 70, fy - 90, 36, WHITE);
    x.save(); x.fillStyle = 'rgba(2,18,40,.35)'; x.fillRect(0, Y0, W, Y1 - Y0); x.restore();
    knife(860, 1050, 1.8, 1, .3);
    barraArriba(5, 'AL ESTE, A LA NIEBLA', 'Después de la 1:00'); reloj('01:00');
    panelAbajo(['Cuando el motor se apague, bucea', 'y saca el CUCHILLO MALDITO 🔪'], 'Usa el detector de metales submarino');
    pie(7); },
  // 8. paso 6
  () => { performance_t = 23.5; base(5, 1075, 440, 4.2); fog(23.5, .45); 
    const [lx, ly] = S(LH), [gx, gy] = S(GHOST);
    x.save(); x.globalAlpha = .45; x.fillStyle = GREEN;
    const ang = Math.atan2(gy - (ly - 90), gx - lx), R = Math.hypot(gx - lx, gy - ly + 90) * 1.25;
    x.beginPath(); x.moveTo(lx, ly - 90); x.arc(lx, ly - 90, R, ang - .3, ang + .3); x.closePath(); x.fill(); x.restore();
    ghostShip(gx, gy + 40, 1, 1, 23.5);
    text('↗ MIRA AL NORESTE', lx - 40, ly - 150, 40, GREEN);
    barraArriba(6, 'MIRA AL NORESTE', 'Desde arriba del faro'); reloj('01:30');
    panelAbajo(['Vuelve a subir al faro', 'y usa binoculares cerca de la 1:30'], 'Si amanece, no aparece: repite la noche siguiente');
    pie(8); },
  // 9. resumen
  () => { performance_t = 1; camara(1060, 455, 3.4); night(1.4);
    x.fillStyle = 'rgba(4,25,45,.75)'; x.fillRect(0, Y0, W, Y1 - Y0);
    glow('RESUMEN', W/2, Y0 + 100, 110, PINK);
    const items = ['Cruza a Little Hardin', 'Sube al faro de noche', 'Lee el diario (casa oeste)', 'Toma el equipo de buceo', 'Bucea en la niebla → cuchillo', 'Faro + noreste ~1:30 → barco'];
    items.forEach((s, i) => {
      const y = Y0 + 240 + i * 118;
      x.fillStyle = GREEN; rr(110, y - 38, 76, 76, 16); x.fill(); x.strokeStyle = '#000'; x.lineWidth = 5; x.stroke();
      glow('✓', 148, y + 2, 64, WHITE);
      text(s, 220, y, 50, WHITE, 'left');
    });
    glow('GUÁRDALO 📌', W/2, Y1 - 190, 84, GOLD, 1, ['#fff3b0', '#ffd23e', '#ff8a1e']);
    text('y sígueme para más easter eggs de GTA 6', W/2, Y1 - 100, 40, WHITE);
    pie(9); },
];
function reloj(str) {
  const xx = W - 330, yy = Y0 + 255;
  x.save(); x.fillStyle = 'rgba(4,25,45,.92)'; x.strokeStyle = CYAN; x.lineWidth = 5; rr(xx, yy, 270, 96, 26); x.fill(); x.stroke(); x.restore();
  text('🌙 ' + str, xx + 135, yy + 50, 48, CYAN);
}
function viñetaC() {
  const v = x.createRadialGradient(W/2, H/2, 300, W/2, H/2, 1000); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.75)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
}
window.slide = i => { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); SLIDE[i](); };
window.NSLIDES = SLIDE.length;
`;

(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('ERROR:', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'mapa-real.html'));
  await p.evaluate(async () => { await document.fonts.load('40px GTA'); await document.fonts.load('700 40px GTAsub'); await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  await p.addScriptTag({ content: SLIDES });
  const n = await p.evaluate(() => window.NSLIDES);
  const out = path.join(__dirname, 'carrusel'); fs.mkdirSync(out, { recursive: true });
  const files = [];
  for (let i = 0; i < n; i++) {
    const png = await p.evaluate(i => {
      slide(i);
      const t = document.createElement('canvas'); t.width = 1080; t.height = 1350;
      t.getContext('2d').drawImage(document.getElementById('c'), 0, 285, 1080, 1350, 0, 0, 1080, 1350);
      return t.toDataURL('image/jpeg', 0.93);
    }, i);
    const f = path.join(out, String(i + 1).padStart(2, '0') + '.jpg');
    fs.writeFileSync(f, Buffer.from(png.split(',')[1], 'base64')); files.push(f);
  }
  // PDF: una página por imagen
  const html = '<html><head><style>@page{size:1080px 1350px;margin:0}body{margin:0}img{display:block;width:1080px;height:1350px;page-break-after:always}</style></head><body>' +
    files.map(f => `<img src="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}">`).join('') + '</body></html>';
  const pp = await b.newPage(); await pp.setContent(html); await pp.waitForLoadState('load');
  await pp.pdf({ path: path.join(out, 'barco-fantasma-paso-a-paso.pdf'), width: '1080px', height: '1350px', printBackground: true });
  await b.close();
  console.log('listo', n, 'imágenes');
})();
