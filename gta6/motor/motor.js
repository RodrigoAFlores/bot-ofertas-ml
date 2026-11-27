// Motor común de los videos de GTA 6: mapa de Leonida, cámara, letras estilo GTA, rutas, iconos,
// tarjetas de pasos y sincronización con la voz. Cada video define en escenas.js:
//   K (cámara), DUR_ANIM, TITULO, SUBTITULO y drawAnim(t). Opcional: drawCover().
const W = 1080, H = 1920, MW = 1366, MH = 1870;
const c = document.getElementById('c'), x = c.getContext('2d');
const MAP = document.getElementById('map');
const F = 'GTAsub, Inter, sans-serif', FT = 'GTA, Impact, sans-serif';
const PINK = '#ff2e93', CYAN = '#00e0ff', GREEN = '#3dff7a', GOLD = '#ffd23e', WHITE = '#ffffff', NAVY = '#06233a';

const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
const outBack = t => { const k = 1.7; return 1 + (k+1)*Math.pow(t-1,3) + k*Math.pow(t-1,2); };
const seg = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;

// ---------- cámara ----------
let cam = { cx: 0, cy: 0, s: 1 };
function camera(t) {
  const K = window.K;
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const [t0, x0, y0, s0] = K[i], [t1, x1, y1, s1] = K[i + 1];
  const e = ease(seg(t, t0, t1));
  const s = Math.exp(lerp(Math.log(s0), Math.log(s1), e));
  // interpolar el centro proporcional al zoom para que el acercamiento se sienta recto
  const zf = Math.abs(s1 - s0) > 1e-6 ? (1/s - 1/s0) / (1/s1 - 1/s0) : e;
  // no mostrar el borde blanco del mapa (marco interior aprox. 46..1320 x 46..1824)
  const hw = W / 2 / s, hh = H / 2 / s;
  const cxx = cl(lerp(x0, x1, zf), 46 + hw, 1320 - hw), cyy = cl(lerp(y0, y1, zf), 46 + hh, 1824 - hh);
  cam = { cx: cxx, cy: cyy, s };
}
const S = ([mx, my]) => [W/2 + (mx - cam.cx) * cam.s, H/2 + (my - cam.cy) * cam.s];

// ---------- dibujo ----------
function drawMap() {
  x.fillStyle = '#0aa5c8'; x.fillRect(0, 0, W, H);
  x.save(); x.imageSmoothingQuality = 'high';
  x.translate(W/2, H/2); x.scale(cam.s, cam.s); x.translate(-cam.cx, -cam.cy);
  x.drawImage(MAP, 0, 0, MW, MH);
  x.restore();
}
// texto estilo GTA: mayúsculas, borde negro grueso y sombra dura
function text(s, px, py, size, color = WHITE, align = 'center', weight = 700, alpha = 1) {
  if (alpha <= 0) return;
  s = s.toUpperCase();
  x.save(); x.globalAlpha *= alpha; x.font = `${weight} ${size}px ${F}`;
  x.textAlign = align; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.fillStyle = '#000'; x.fillText(s, px + size * .07, py + size * .07);
  x.lineWidth = size * .2; x.strokeStyle = '#000'; x.strokeText(s, px, py);
  x.fillStyle = color; x.fillText(s, px, py); x.restore();
}
// título estilo GTA VI: degradado atardecer, borde negro y sombra
const SUNSET = ['#ffe17a', '#ff9a4d', '#ff3d8e', '#b43cff'];
function glow(s, px, py, size, color, alpha = 1, grad = null) {
  if (alpha <= 0) return;
  s = s.toUpperCase();
  x.save(); x.globalAlpha *= alpha; x.font = `${size}px ${FT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round';
  x.fillStyle = '#000'; x.fillText(s, px + size * .08, py + size * .09);
  x.lineWidth = size * .18; x.strokeStyle = '#000'; x.strokeText(s, px, py);
  let fill = color;
  if (grad || color === PINK) {
    const g = x.createLinearGradient(0, py - size * .5, 0, py + size * .5);
    (grad || SUNSET).forEach((col, i, arr) => g.addColorStop(i / (arr.length - 1), col));
    fill = g;
  }
  x.fillStyle = fill; x.fillText(s, px, py);
  x.restore();
}
function rr(a, b, w, h, r) { x.beginPath(); x.roundRect(a, b, w, h, r); }

function pin(p, color, k, label, t) {
  if (k <= 0) return;
  const [px, py] = S(p), s = outBack(cl(k));
  x.save(); x.translate(px, py);
  const ph = (t * 1.2) % 1;
  x.globalAlpha *= (1 - ph) * .8; x.strokeStyle = color; x.lineWidth = 5;
  x.beginPath(); x.arc(0, 0, 14 + ph * 46, 0, 7); x.stroke(); x.globalAlpha = 1;
  x.scale(s, s);
  x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 12; x.shadowOffsetY = 4;
  x.fillStyle = color; x.beginPath(); x.arc(0, -46, 26, Math.PI * .82, Math.PI * .18); x.lineTo(0, 0); x.closePath(); x.fill();
  x.shadowColor = 'transparent'; x.fillStyle = WHITE; x.beginPath(); x.arc(0, -48, 10, 0, 7); x.fill();
  x.restore();
  if (label) text(label, px, py - 100, 34, WHITE, 'center', 700, cl(k * 2 - 1));
}
function routePts(pts) { return pts.map(S); }
function route(pts, k, color, w = 9) {
  if (k <= 0) return null;
  const P = routePts(pts);
  let L = 0; const d = [];
  for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0]-P[i-1][0], P[i][1]-P[i-1][1]); d.push(l); L += l; }
  let rem = L * cl(k), end = P[0], ang = 0;
  const path = new Path2D(); path.moveTo(...P[0]);
  for (let i = 1; i < P.length && rem > 0; i++) {
    const f = Math.min(1, rem / d[i-1]);
    end = [lerp(P[i-1][0], P[i][0], f), lerp(P[i-1][1], P[i][1], f)];
    ang = Math.atan2(P[i][1]-P[i-1][1], P[i][0]-P[i-1][0]);
    path.lineTo(...end); rem -= d[i-1];
  }
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  x.strokeStyle = NAVY; x.lineWidth = w + 8; x.stroke(path);
  x.strokeStyle = color; x.lineWidth = w; x.setLineDash([22, 16]); x.lineDashOffset = -performance_t * 60; x.stroke(path);
  x.restore();
  // flecha en la punta
  x.save(); x.translate(...end); x.rotate(ang); x.fillStyle = color; x.strokeStyle = NAVY; x.lineWidth = 5;
  x.beginPath(); x.moveTo(20, 0); x.lineTo(-12, -15); x.lineTo(-12, 15); x.closePath(); x.stroke(); x.fill(); x.restore();
  return { end, ang };
}
let performance_t = 0;

function lighthouse(p, s, beam, t) {
  const [px, py] = S(p);
  x.save(); x.translate(px, py); x.scale(s, s);
  if (beam > 0) {
    x.save(); x.globalAlpha *= .45 * beam; x.translate(0, -77); x.rotate(t * 1.6);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 480);
    g.addColorStop(0, 'rgba(255,245,190,1)'); g.addColorStop(1, 'rgba(255,245,190,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 480, -.17, .17); x.closePath(); x.fill(); x.restore();
  }
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
  x.fillStyle = WHITE; x.beginPath(); x.moveTo(-18, 0); x.lineTo(-11, -60); x.lineTo(11, -60); x.lineTo(18, 0); x.closePath(); x.fill();
  x.shadowColor = 'transparent';
  x.fillStyle = '#e8304a'; x.fillRect(-15, -22, 30, 9); x.fillRect(-13, -44, 26, 9);
  x.fillStyle = '#222'; x.fillRect(-14, -70, 28, 10);
  x.fillStyle = GOLD; x.fillRect(-9, -84, 18, 14);
  x.fillStyle = '#e8304a'; x.beginPath(); x.moveTo(-13, -84); x.lineTo(0, -98); x.lineTo(13, -84); x.fill();
  x.restore();
}
function house(p, s) {
  const [px, py] = S(p);
  x.save(); x.translate(px, py); x.scale(s, s);
  x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
  x.fillStyle = '#7a5f48'; x.fillRect(-24, -26, 48, 30);
  x.fillStyle = '#3e2f24'; x.beginPath(); x.moveTo(-30, -24); x.lineTo(0, -48); x.lineTo(30, -24); x.fill();
  x.shadowColor = 'transparent'; x.fillStyle = GOLD; x.fillRect(-6, -16, 12, 12);
  x.restore();
}
function boat(px, py, ang, s) {
  x.save(); x.translate(px, py); x.rotate(ang); x.scale(s, s);
  x.fillStyle = WHITE; x.strokeStyle = NAVY; x.lineWidth = 4;
  x.beginPath(); x.moveTo(26, 0); x.lineTo(8, -12); x.lineTo(-22, -12); x.lineTo(-22, 12); x.lineTo(8, 12); x.closePath(); x.stroke(); x.fill();
  x.fillStyle = NAVY; x.fillRect(-12, -6, 14, 12); x.restore();
}
function ghostShip(px, py, s, a, t) {
  if (a <= 0) return;
  x.save(); x.translate(px, py + Math.sin(t * 2) * 6); x.scale(s, s); x.globalAlpha *= a;
  x.shadowColor = GREEN; x.shadowBlur = 45; x.fillStyle = 'rgba(61,255,122,.7)';
  x.beginPath(); x.moveTo(-90, 0); x.lineTo(90, 0); x.lineTo(70, 30); x.lineTo(-70, 30); x.closePath(); x.fill();
  x.fillRect(-4, -110, 8, 110); x.fillRect(-50, -80, 4, 80);
  x.beginPath(); x.moveTo(6, -105); x.quadraticCurveTo(60, -70, 6, -20); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-46, -78); x.quadraticCurveTo(-10, -55, -46, -20); x.closePath(); x.fill();
  x.restore();
}
function knife(px, py, s, a, t) {
  if (a <= 0) return;
  x.save(); x.translate(px, py); x.rotate(-.6 + Math.sin(t * 3) * .1); x.scale(s, s); x.globalAlpha *= a;
  x.shadowColor = GREEN; x.shadowBlur = 40 + Math.sin(t * 6) * 15;
  x.fillStyle = GREEN; x.beginPath(); x.moveTo(0, -70); x.quadraticCurveTo(16, -20, 10, 10); x.lineTo(-10, 10); x.quadraticCurveTo(-8, -30, 0, -70); x.fill();
  x.fillStyle = '#1c2b22'; x.fillRect(-20, 10, 40, 8); x.fillRect(-7, 18, 14, 40); x.restore();
}
function rnd(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function fog(t, k) {
  if (k <= 0) return;
  const [fx0, fy0] = S(FOG);
  for (let i = 0; i < 14; i++) {
    const fx = fx0 - 120 + rnd(i) * 320 + Math.sin(t * .5 + i) * 30, fy = fy0 - 200 + rnd(i + 5) * 400;
    const r = 130 + rnd(i + 2) * 90;
    const g = x.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, `rgba(235,242,250,${.55 * k})`); g.addColorStop(1, 'rgba(235,242,250,0)');
    x.fillStyle = g; x.fillRect(fx - r, fy - r, r * 2, r * 2);
  }
}
// oscurecer = noche
function night(k) { if (k <= 0) return; x.fillStyle = `rgba(3,14,40,${.45 * k})`; x.fillRect(0, 0, W, H); }

function header(k, titulo = window.TITULO, sub = window.SUBTITULO || 'GTA 6 · RUTA PASO A PASO') {
  if (k <= 0) return;
  x.save(); x.globalAlpha *= k;
  const g = x.createLinearGradient(0, 0, 0, 330); g.addColorStop(0, 'rgba(4,25,45,.92)'); g.addColorStop(1, 'rgba(4,25,45,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, 330);
  glow(titulo, W/2, 135, titulo.length > 14 ? 96 : 110, PINK);
  text(sub, W/2, 228, 38, CYAN, 'center', 700);
  x.restore();
}
function clock(str, k) {
  if (k <= 0) return;
  x.save(); x.globalAlpha *= k;
  x.fillStyle = 'rgba(4,25,45,.9)'; x.strokeStyle = CYAN; x.lineWidth = 4; rr(60, 290, 260, 90, 24); x.fill(); x.stroke();
  text('🌙 ' + str, 190, 336, 46, CYAN, 'center', 700); x.restore();
}
function stepCard(n, title, sub, k) {
  if (k <= 0 || k >= 1) return;
  const y = lerp(H + 50, 1580, ease(cl(k * 4)));
  const a = cl(k * 4) * cl((1 - k) * 10);
  x.save(); x.globalAlpha *= a;
  x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 30;
  x.fillStyle = 'rgba(4,25,45,.94)'; rr(50, y, 980, 250, 36); x.fill();
  x.shadowBlur = 0; x.strokeStyle = PINK; x.lineWidth = 5; x.stroke();
  x.fillStyle = PINK; x.beginPath(); x.arc(145, y + 125, 60, 0, 7); x.fill();
  glow(String(n), 145, y + 128, 84, WHITE);
  text(title, 238, y + 88, 54, WHITE, 'left');
  text(sub, 238, y + 165, 36, GOLD, 'left');
  x.restore();
}

// tiempo del video final → tiempo de la animación (sincronizado con la voz, ver tiempos.py)
function warp(T) {
  const P = window.WARP || [[0, 0], [DUR_ANIM, DUR_ANIM]];
  if (T <= P[0][0]) return P[0][1];
  for (let i = 1; i < P.length; i++) if (T <= P[i][0]) return lerp(P[i-1][1], P[i][1], (T - P[i-1][0]) / (P[i][0] - P[i-1][0]));
  return P[P.length - 1][1];
}

// ---------- iconos extra ----------
function sombra() { x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 10; x.shadowOffsetY = 4; }
function edificio(p, s, a = 1) {          // edificio de departamentos con piscina
  if (a <= 0 || s <= 0) return;
  const [px, py] = S(p);
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a; sombra();
  x.fillStyle = '#f2e6d0'; x.fillRect(-46, -80, 92, 80);
  x.shadowColor = 'transparent';
  x.fillStyle = '#2b6f8f';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) x.fillRect(-38 + c * 21, -72 + r * 24, 13, 15);
  x.fillStyle = '#ff7a59'; x.fillRect(-50, -86, 100, 8);
  x.fillStyle = '#39d3ff'; rr(-44, 6, 88, 22, 8); x.fill();   // piscina
  x.restore();
}
function torre(p, s, a = 1) {             // torre de radio roja y blanca
  if (a <= 0 || s <= 0) return;
  const [px, py] = S(p);
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a; sombra();
  const h = 260;
  for (let i = 0; i < 8; i++) {
    const y0 = -i * h / 8, y1 = -(i + 1) * h / 8, w0 = 26 - i * 2.6, w1 = 26 - (i + 1) * 2.6;
    x.fillStyle = i % 2 ? '#ffffff' : '#e8304a';
    x.beginPath(); x.moveTo(-w0, y0); x.lineTo(w0, y0); x.lineTo(w1, y1); x.lineTo(-w1, y1); x.closePath(); x.fill();
  }
  x.shadowColor = 'transparent';
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const y0 = -i * h / 8, y1 = -(i + 1) * h / 8; x.beginPath(); x.moveTo(-20 + i * 2, y0); x.lineTo(18 - i * 2, y1); x.stroke(); }
  x.fillStyle = '#ff2020'; x.shadowColor = '#ff2020'; x.shadowBlur = 20 + 10 * Math.sin(performance_t * 6);
  x.beginPath(); x.arc(0, -h - 8, 8, 0, 7); x.fill();
  x.restore();
}
function nido(px, py, s, a = 1) {        // nido con huevos de pascua (coordenadas de pantalla)
  if (a <= 0 || s <= 0) return;
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a;
  const cols = [['#ff5fa2', '#ffe17a'], ['#5fd4ff', '#ffffff'], ['#9dff6a', '#b43cff']];
  cols.forEach(([c1, c2], i) => huevo(-34 + i * 34, -18 - (i === 1 ? 8 : 0), 1, c1, c2));
  x.fillStyle = '#8a5a2b'; x.beginPath(); x.ellipse(0, 0, 70, 26, 0, 0, Math.PI); x.fill();
  x.strokeStyle = '#5b3a1a'; x.lineWidth = 3;
  for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(-66 + i * 16, 2); x.quadraticCurveTo(-56 + i * 16, 18, -44 + i * 16, 4); x.stroke(); }
  x.restore();
}
function huevo(px, py, s, c1 = '#ff5fa2', c2 = '#ffe17a', rot = 0) {
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s);
  x.beginPath(); x.ellipse(0, 0, 17, 23, 0, 0, 7); x.closePath();
  x.fillStyle = c1; x.fill(); x.clip();
  x.fillStyle = c2; for (let i = -2; i <= 2; i++) x.fillRect(-20, i * 10 - 2, 40, 4);
  x.restore();
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s);
  x.strokeStyle = '#000'; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 17, 23, 0, 0, 7); x.stroke(); x.restore();
}
function velero(px, py, s, a = 1, color = '#ffffff') {   // velero tipo Marquis (pantalla)
  if (a <= 0 || s <= 0) return;
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a; sombra();
  x.fillStyle = color; x.beginPath(); x.moveTo(-90, 0); x.lineTo(95, 0); x.lineTo(70, 28); x.lineTo(-70, 28); x.closePath(); x.fill();
  x.shadowColor = 'transparent';
  x.fillStyle = '#2b6fd6'; x.fillRect(-72, 8, 150, 6);
  x.fillStyle = '#c9c1b0'; x.fillRect(-3, -150, 6, 150);
  x.fillStyle = 'rgba(245,240,225,.95)';
  x.beginPath(); x.moveTo(6, -145); x.lineTo(70, -10); x.lineTo(6, -10); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-6, -125); x.lineTo(-60, -10); x.lineTo(-6, -10); x.closePath(); x.fill();
  x.restore();
}
function kitDexter(px, py, s, a = 1) {   // caja de herramientas, jeringa, cuchillo, guantes
  if (a <= 0 || s <= 0) return;
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a; sombra();
  x.fillStyle = '#ff8a1e'; rr(-70, -10, 90, 50, 6); x.fill();          // caja naranja
  x.shadowColor = 'transparent';
  x.fillStyle = '#7a3e00'; x.fillRect(-70, 4, 90, 5); x.fillRect(-40, -22, 30, 12);
  x.fillStyle = '#d9f2ff'; x.fillRect(32, -2, 54, 12); x.fillStyle = '#9ad0ff'; x.fillRect(86, 1, 14, 6);  // jeringa
  x.fillStyle = '#c0c6cc'; x.beginPath(); x.moveTo(30, 26); x.lineTo(96, 20); x.lineTo(96, 30); x.closePath(); x.fill(); // cuchillo
  x.fillStyle = '#222'; x.fillRect(16, 22, 16, 8);
  x.fillStyle = '#f6f6f0'; rr(-60, 46, 34, 22, 8); x.fill(); rr(-20, 46, 34, 22, 8); x.fill();    // guantes
  x.restore();
}
function pantallaLS(px, py, s, a = 1) {   // GPS con el mapa de Los Santos
  if (a <= 0 || s <= 0) return;
  x.save(); x.translate(px, py); x.scale(s, s); x.globalAlpha *= a;
  x.fillStyle = '#111'; rr(-150, -100, 300, 200, 22); x.fill();
  x.fillStyle = '#0f3550'; rr(-134, -84, 268, 168, 12); x.fill();
  x.save(); rr(-134, -84, 268, 168, 12); x.clip();
  x.fillStyle = '#3b7a4a'; x.beginPath(); x.moveTo(-110, -84); x.lineTo(60, -84); x.lineTo(40, -10); x.lineTo(70, 40); x.lineTo(10, 84); x.lineTo(-60, 84); x.lineTo(-80, 10); x.closePath(); x.fill();
  x.fillStyle = '#9aa3ad'; x.beginPath(); x.moveTo(-50, 20); x.lineTo(30, 10); x.lineTo(40, 70); x.lineTo(-30, 84); x.closePath(); x.fill();
  x.restore();
  text('LOS SANTOS', 0, 60, 30, GOLD, 'center');
  x.restore();
}

// ---------- bloques de escena reutilizables ----------
function intro(t, l1, l2, l3, p) {
  if (t >= 3.2) return;
  const a = 1 - seg(t, 2.6, 3.2);
  x.save(); x.globalAlpha *= a;
  const g = x.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, 'rgba(4,25,45,.95)'); g.addColorStop(1, 'rgba(4,25,45,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, 520);
  glow(l1, W/2, 115, 80, WHITE, seg(t, 0, .5));
  glow(l2, W/2, 215, l2.length > 15 ? 104 : 120, PINK, seg(t, .2, .7));
  text(l3, W/2, 315, 44, GREEN, 'center', 700, seg(t, .7, 1.2));
  x.restore();
  pin(p, PINK, seg(t, 1.2, 1.7), '', t);
}
function zona(t, a0, a1, l1, l2, p) {     // texto de la zona mientras la cámara se acerca
  if (t < a0 || t >= a1 + .6) return;
  const a = seg(t, a0 + .2, a0 + .7) * (1 - seg(t, a1, a1 + .6));
  const g = x.createLinearGradient(0, H - 420, 0, H); g.addColorStop(0, 'rgba(4,25,45,0)'); g.addColorStop(1, `rgba(4,25,45,${.9 * a})`);
  x.fillStyle = g; x.fillRect(0, H - 420, W, 420);
  text(l1, W/2, 1710, 60, WHITE, 'center', 700, a);
  text(l2, W/2, 1795, 42, GOLD, 'center', 700, a);
  pin(p, PINK, seg(t, a0 + .4, a0 + .9) * (1 - seg(t, a1 - .8, a1 - .3)), '', t);
}
function cierre(t, t0, sub = 'para más easter eggs de GTA 6') {
  if (t <= t0) return;
  const a = seg(t, t0, t0 + .6);
  x.save(); x.globalAlpha *= a * .75; x.fillStyle = '#04192d'; x.fillRect(0, 0, W, H); x.restore();
  glow('SÍGUEME', W/2, 870, 170, PINK, a);
  text(sub, W/2, 1010, 46, WHITE, 'center', 700, a);
}
function etiqueta(p, s, dx, dy, color, a) {   // texto pegado a un punto del mapa
  if (a <= 0) return; const [px, py] = S(p); text(s, px + dx, py + dy, 34, color, 'center', 700, a);
}

window.draw = T => drawAnim(warp(T));

// ---------- portadas ----------
function viñeta(color = 'rgba(0,0,0,.8)', tinte = null) {
  const v = x.createRadialGradient(W/2, H/2, 260, W/2, H/2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, color);
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  if (tinte) { x.fillStyle = tinte; x.fillRect(0, 0, W, H); }
}
function portadaArriba(l1, l2, grad = null, s1 = 210, s2 = 190) {
  const g = x.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, 'rgba(0,0,0,.94)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, 600);
  x.save(); x.translate(W/2, 120); x.rotate(-.04); x.fillStyle = '#000'; x.fillRect(-150, -52, 300, 104); x.fillStyle = '#ff3d8e'; x.fillRect(-142, -44, 284, 88); x.restore();
  glow('GTA 6', W/2, 116, 84, WHITE);
  glow(l1, W/2, 295, s1, PINK, 1, grad);
  if (l2) glow(l2, W/2, 470, s2, PINK, 1, grad);
}
function portadaAbajo(grande, l1, l2, grad = ['#fff3b0', '#ffd23e', '#ff8a1e']) {
  const g = x.createLinearGradient(0, H - 640, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(0,0,0,.86)'); g.addColorStop(1, 'rgba(0,0,0,.96)');
  x.fillStyle = g; x.fillRect(0, H - 640, W, 640);
  glow(grande, W/2, 1530, grande.length > 16 ? 88 : 100, GOLD, 1, grad);
  text(l1, W/2, 1660, 62, WHITE);
  text(l2, W/2, 1750, 62, GOLD);
}
function sello(px, py, s, rot, color, txt) {   // etiqueta tipo sticker
  x.save(); x.translate(px, py); x.rotate(rot);
  x.font = `${s}px ${FT}`; const w = x.measureText(txt).width + s * .8;
  x.fillStyle = '#000'; x.fillRect(-w/2 - 8, -s * .62 - 8, w + 16, s * 1.24 + 16);
  x.fillStyle = color; x.fillRect(-w/2, -s * .62, w, s * 1.24);
  x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, s * .05);
  x.restore();
}
function cuchilloRojo(px, py, s, rot) {
  x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s);
  x.shadowColor = '#ff1a1a'; x.shadowBlur = 40;
  x.fillStyle = '#e9edf2'; x.beginPath(); x.moveTo(0, -80); x.quadraticCurveTo(18, -20, 11, 10); x.lineTo(-11, 10); x.quadraticCurveTo(-8, -30, 0, -80); x.fill();
  x.shadowBlur = 0; x.fillStyle = '#c4001a';
  x.beginPath(); x.moveTo(-6, -40); x.quadraticCurveTo(0, -20, 6, -5); x.lineTo(-4, -5); x.closePath(); x.fill();
  x.beginPath(); x.ellipse(2, 30, 4, 9, 0, 0, 7); x.fill();
  x.fillStyle = '#222'; x.fillRect(-22, 10, 44, 9); x.fillRect(-8, 19, 16, 44);
  x.restore();
}
