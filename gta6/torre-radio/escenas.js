// Huevo de pascua en la torre de radio: al norte de Hamlet, Bluegrass (sur de Vice-Dale County).
// Coordenadas en píxeles del mapa original (1366x1870). Ubicación según guías de jugadores.
const DUR_ANIM = 24.5;
window.TITULO = 'LA TORRE SECRETA';
const HAM   = [766, 1288];   // Hamlet
const MID   = [792, 1250];   // camino al norte
const TORRE = [764, 1207];   // torre (Bluegrass)

window.K = [
  [0,    690,  935, 1.08],
  [2.6,  690,  935, 1.08],
  [4.8,  790, 1180, 1.9],
  [6.8,  775, 1245, 4.2],
  [10,   775, 1245, 4.2],
  [10.8, 766, 1180, 4.6],
  [24.5, 766, 1180, 4.6],
];

function panel(a, y = 560, h = 640) {
  x.save(); x.globalAlpha *= a;
  x.fillStyle = 'rgba(4,25,45,.92)'; rr(90, y, 900, h, 40); x.fill();
  x.strokeStyle = PINK; x.lineWidth = 6; x.stroke(); x.restore();
}

function drawAnim(t) {
  performance_t = t;
  camera(t);
  drawMap();
  intro(t, '¿SABÍAS QUE HAY UN', 'HUEVO DE PASCUA', '🥚 EN LA TORRE MÁS ALTA · GTA 6', TORRE);
  zona(t, 2.6, 6.6, 'AL NORTE DE HAMLET', 'Bluegrass · sur de Vice-Dale County', TORRE);

  if (t >= 6.4) {
    header(seg(t, 6.4, 7.2));
    pin(HAM, GOLD, seg(t, 6.9, 7.4) * (1 - seg(t, 9.6, 10)), 'HAMLET', t);
    route([HAM, MID, [784, 1225], [TORRE[0] + 8, TORRE[1] + 6]], seg(t, 7.4, 9.6), CYAN);
    torre(TORRE, outBack(seg(t, 8.8, 9.6)) * 1.25, 1);
    etiqueta(TORRE, 'LA MÁS ALTA DEL JUEGO', 0, -380, GOLD, seg(t, 9.2, 9.7) * (1 - seg(t, 12.8, 13.2)));
    // 2. reja + escalera
    if (t > 10 && t < 13.2) {
      const a = seg(t, 10.2, 10.6) * (1 - seg(t, 12.8, 13.2));
      const [tx, ty] = S(TORRE);
      x.save(); x.globalAlpha *= a; x.strokeStyle = '#d0d6dc'; x.lineWidth = 4;
      for (let i = -5; i <= 5; i++) { x.beginPath(); x.moveTo(tx + i * 16, ty + 14); x.lineTo(tx + i * 16, ty - 40); x.stroke(); }
      x.beginPath(); x.moveTo(tx - 84, ty - 36); x.lineTo(tx + 84, ty - 36); x.stroke();
      x.restore();
      // salto
      const j = seg(t, 10.8, 11.8);
      x.save(); x.globalAlpha *= a; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 20;
      x.beginPath(); x.arc(tx - 150 + j * 150, ty + 30 - Math.sin(j * Math.PI) * 110, 16, 0, 7); x.fill(); x.restore();
      text('SALTA LA REJA', tx, ty + 90, 40, WHITE, 'center', 700, a);
      text('🪜 escalera en la base', tx, ty + 145, 34, GOLD, 'center', 700, a * seg(t, 11.8, 12.2));
    }
    // 3. subida: contador
    if (t > 13 && t < 16.2) {
      const a = seg(t, 13.1, 13.5) * (1 - seg(t, 15.8, 16.2));
      const [tx, ty] = S(TORRE);
      const k = seg(t, 13.4, 15.6);
      x.save(); x.globalAlpha *= a; x.fillStyle = GOLD; x.shadowColor = GOLD; x.shadowBlur = 20;
      x.beginPath(); x.arc(tx, ty - 10 - k * 300, 15, 0, 7); x.fill(); x.restore();
      const secs = Math.floor(k * 420);
      x.save(); x.globalAlpha *= a; x.fillStyle = 'rgba(4,25,45,.92)'; rr(W/2 - 210, 1290, 420, 150, 30); x.fill(); x.strokeStyle = CYAN; x.lineWidth = 5; x.stroke(); x.restore();
      glow(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, W/2, 1370, 110, WHITE, a);
      text('¡unos 7 minutos de subida!', W/2, 1240, 40, WHITE, 'center', 700, a);
    }
    // 4. nido
    if (t > 16 && t < 19.2) {
      const a = seg(t, 16.1, 16.5) * (1 - seg(t, 18.8, 19.2));
      panel(a);
      glow('EL NIDO', W/2, 650, 90, PINK, a);
      nido(W/2, 900, 3.4 * outBack(seg(t, 16.4, 17)), a);
      text('Toma UN huevo', W/2, 1090, 50, WHITE, 'center', 700, a * seg(t, 17, 17.4));
      text('Solo uno por visita', W/2, 1150, 40, GOLD, 'center', 700, a * seg(t, 17.3, 17.7));
    }
    // 5. lanzar el huevo
    if (t > 19 && t < 22.6) {
      const a = seg(t, 19.1, 19.4) * (1 - seg(t, 22.2, 22.6));
      const [tx, ty] = S(TORRE);
      const top = [tx, ty - 330];
      const f = seg(t, 19.6, 21.2);
      const ex = top[0] + f * 260, ey = top[1] - Math.sin(f * Math.PI * .5) * 120 + f * f * 520;
      x.save(); x.globalAlpha *= a; x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 6; x.setLineDash([4, 16]);
      x.beginPath(); x.moveTo(...top);
      for (let i = 1; i <= 20; i++) { const g = f * i / 20; x.lineTo(top[0] + g * 260, top[1] - Math.sin(g * Math.PI * .5) * 120 + g * g * 520); }
      x.stroke(); x.restore();
      x.save(); x.globalAlpha *= a; huevo(ex, ey, 1.8, '#ff5fa2', '#ffe17a', t * 6); x.restore();
      if (t > 21.2) {
        const k = seg(t, 21.2, 21.6);
        x.save(); x.globalAlpha *= a * .5 * (1 - seg(t, 21.6, 22.2)); x.fillStyle = WHITE; x.fillRect(0, 0, W, H); x.restore();
        glow('🎬 CINEMÁTICA SECRETA', W/2, 1300, 76, PINK, a * k);
      }
    }
    stepCard(1, 'De Hamlet hacia el norte', 'Busca la torre roja y blanca', seg(t, 7.2, 10));
    stepCard(2, 'Salta la reja', 'La escalera está en la base', seg(t, 10, 13));
    stepCard(3, 'Sube hasta arriba', 'Mantén correr: es más rápido', seg(t, 13, 16));
    stepCard(4, 'Toma un huevo del nido', 'Solo uno por visita', seg(t, 16, 19));
    stepCard(5, 'Lánzalo desde la torre', '¡No saltes tú!', seg(t, 19, 22.4));
    cierre(t, 22.4);
  }
}

function drawCover() {
  performance_t = 1; cam = { cx: 766, cy: 1190, s: 4.2 }; drawMap();
  const v = x.createRadialGradient(W/2, H/2, 300, W/2, H/2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.8)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  route([HAM, MID, [784, 1225], [TORRE[0] + 8, TORRE[1] + 6]], 1, CYAN);
  const [tx, ty] = S(TORRE);
  torre(TORRE, 2.4, 1);
  nido(tx, ty - 640, 1.6, 1);
  huevo(tx + 230, ty - 380, 2.6, '#ff5fa2', '#ffe17a', .5);
  const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 560);
  x.save(); x.translate(W/2, 120); x.rotate(-.04); x.fillStyle = '#000'; x.fillRect(-150, -52, 300, 104); x.fillStyle = '#ff3d8e'; x.fillRect(-142, -44, 284, 88); x.restore();
  glow('GTA 6', W/2, 116, 84, WHITE);
  glow('HUEVO DE', W/2, 290, 190, PINK);
  glow('PASCUA', W/2, 460, 190, PINK);
  const g2 = x.createLinearGradient(0, H - 620, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.35, 'rgba(0,0,0,.85)'); g2.addColorStop(1, 'rgba(0,0,0,.95)'); x.fillStyle = g2; x.fillRect(0, H - 620, W, 620);
  glow('EN LA TORRE MÁS ALTA', W/2, 1530, 92, GOLD, 1, ['#fff3b0', '#ffd23e', '#ff8a1e']);
  text('Cinemática secreta', W/2, 1660, 62, WHITE);
  text('Paso a paso 📍', W/2, 1750, 62, GOLD);
}
