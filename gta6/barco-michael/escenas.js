// El barco de Michael (GTA 5) frente a la casa de Jason en Key Lento (Leonida Keys).
// Coordenadas en píxeles del mapa original (1366x1870). Ubicación según guías de jugadores.
const DUR_ANIM = 24.5;
window.TITULO = 'EL BARCO DE MICHAEL';
const PUENTE = [842, 1470];   // llegada por la ruta 1A
const RUTA   = [[842, 1470], [828, 1490], [806, 1515], [784, 1534]];
const CASA   = [776, 1540];   // casa de Jason (referencial)
const BOTE   = [764, 1543];

window.K = [
  [0,    690,  935, 1.08],
  [2.6,  690,  935, 1.08],
  [4.8,  790, 1500, 1.9],
  [6.8,  805, 1505, 4.0],
  [10,   805, 1505, 4.0],
  [10.8, 776, 1530, 5.0],
  [24.5, 776, 1530, 5.0],
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
  intro(t, '¿SABÍAS QUE EL BARCO', 'DE MICHAEL', '⛵ DE GTA 5 ESTÁ EN GTA 6', CASA);
  zona(t, 2.6, 6.6, 'LEONIDA KEYS · KEY LENTO', 'Donde empieza la historia', CASA);

  if (t >= 6.4) {
    header(seg(t, 6.4, 7.2), window.TITULO, 'GTA 6 · EASTER EGG');
    pin(PUENTE, GOLD, seg(t, 6.9, 7.4) * (1 - seg(t, 9.6, 10)), 'RUTA 1A', t);
    route(RUTA, seg(t, 7.4, 9.6), CYAN);
    house(CASA, 1.3 * outBack(seg(t, 10.4, 11)));
    etiqueta(CASA, 'CASA DE JASON', 0, -95, GOLD, seg(t, 10.8, 11.3) * (1 - seg(t, 18.8, 19.2)));
    if (t > 12.6) {   // velero pequeño en el mapa
      const [bx, by] = S(BOTE);
      velero(bx - 20, by + 40, .55 * outBack(seg(t, 12.6, 13.2)), 1);
    }
    // 3. el velero
    if (t > 13 && t < 16.2) {
      const a = seg(t, 13.1, 13.5) * (1 - seg(t, 15.8, 16.2));
      panel(a);
      glow('MODELO MARQUIS', W/2, 650, 84, PINK, a);
      velero(W/2, 1000, 2.6 * outBack(seg(t, 13.4, 14)), a);
      text('El mismo que tenía Michael en GTA 5', W/2, 1130, 40, WHITE, 'center', 700, a * seg(t, 14.2, 14.6));
    }
    // 4. GPS con Los Santos
    if (t > 16 && t < 19.2) {
      const a = seg(t, 16.1, 16.5) * (1 - seg(t, 18.8, 19.2));
      panel(a);
      glow('MIRA EL GPS', W/2, 650, 84, PINK, a);
      pantallaLS(W/2, 890, 1.9 * outBack(seg(t, 16.4, 17)), a);
      text('¡Muestra el mapa de Los Santos!', W/2, 1130, 42, GOLD, 'center', 700, a * seg(t, 17.2, 17.6));
    }
    // 5. pregunta
    if (t > 19 && t < 22.6) {
      const a = seg(t, 19.1, 19.5) * (1 - seg(t, 22.2, 22.6));
      panel(a, 640, 520);
      glow('¿ES EL BARCO', W/2, 770, 104, WHITE, a);
      glow('DE MICHAEL?', W/2, 890, 104, PINK, a);
      text('Rockstar no lo ha confirmado', W/2, 1010, 40, GOLD, 'center', 700, a * seg(t, 19.6, 20));
      text('💬 Cuéntame en los comentarios', W/2, 1080, 40, WHITE, 'center', 700, a * seg(t, 20.2, 20.6));
    }
    stepCard(1, 'Ve a Key Lento', 'Por la ruta 1A', seg(t, 7.2, 10));
    stepCard(2, 'Casa de Jason', 'Tu primera casa del juego', seg(t, 10, 13));
    stepCard(3, 'Mira el velero de afuera', 'Modelo Marquis', seg(t, 13, 16));
    stepCard(4, 'Revisa la pantalla del GPS', 'Mapa de Los Santos', seg(t, 16, 19));
    cierre(t, 22.4);
  }
}

function drawCover() {
  performance_t = 1; cam = { cx: 790, cy: 1520, s: 4.0 }; drawMap();
  const v = x.createRadialGradient(W/2, H/2, 300, W/2, H/2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.8)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  route(RUTA, 1, CYAN); house(CASA, 1.4);
  velero(400, 1130, 2.6, 1);
  pantallaLS(800, 860, 1.25, 1);
  const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 560);
  x.save(); x.translate(W/2, 120); x.rotate(-.04); x.fillStyle = '#000'; x.fillRect(-150, -52, 300, 104); x.fillStyle = '#ff3d8e'; x.fillRect(-142, -44, 284, 88); x.restore();
  glow('GTA 6', W/2, 116, 84, WHITE);
  glow('EL BARCO', W/2, 290, 190, PINK);
  glow('DE MICHAEL', W/2, 460, 170, PINK);
  const g2 = x.createLinearGradient(0, H - 620, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.35, 'rgba(0,0,0,.85)'); g2.addColorStop(1, 'rgba(0,0,0,.95)'); x.fillStyle = g2; x.fillRect(0, H - 620, W, 620);
  glow('¿DE GTA 5 A GTA 6?', W/2, 1530, 96, GOLD, 1, ['#fff3b0', '#ffd23e', '#ff8a1e']);
  text('Su GPS muestra Los Santos', W/2, 1660, 62, WHITE);
  text('Mira dónde está 📍', W/2, 1750, 62, GOLD);
}
