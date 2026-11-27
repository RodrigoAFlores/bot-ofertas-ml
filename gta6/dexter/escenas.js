// Dexter Morgan en GTA 6: Trinity Apartments, Washington Island (Vice Beach).
// Coordenadas en píxeles del mapa original (1366x1870). Ubicaciones según guías de jugadores.
const DUR_ANIM = 24.5;
window.TITULO = 'DEXTER EN GTA 6';
const VC   = [1000, 831];   // Vice City, inicio del puente
const PEN  = [1088, 829];   // Penmarch Isle
const WI   = [1118, 816];   // llegada a Washington Island
const APT  = [1133, 811];   // Trinity Apartments
const DOCK = [1111, 813];   // muelle lado oeste

window.K = [
  [0,    690,  935, 1.08],
  [2.6,  690,  935, 1.08],
  [4.8,  1010, 870, 1.9],
  [6.8,  1070, 822, 4.0],
  [10,   1070, 822, 4.0],
  [11,   1124, 814, 5.4],
  [19,   1124, 814, 5.4],
  [19.8, 1118, 816, 5.4],
  [22.4, 1118, 816, 5.4],
  [24.5, 1090, 830, 3.0],
];

function panel(a, h = 560) {   // recuadro central para "zoom" de detalle
  x.save(); x.globalAlpha *= a;
  x.fillStyle = 'rgba(4,25,45,.92)'; rr(90, 560, 900, h, 40); x.fill();
  x.strokeStyle = PINK; x.lineWidth = 6; x.stroke(); x.restore();
}

function drawAnim(t) {
  performance_t = t;
  camera(t);
  drawMap();
  intro(t, 'EL DEPARTAMENTO DE', 'DEXTER MORGAN', '🔪 EASTER EGG · GTA 6', [1125, 815]);
  zona(t, 2.6, 6.6, 'VICE BEACH', 'Washington Island · este de Vice City', [1125, 815]);

  if (t >= 6.4) {
    header(seg(t, 6.4, 7.2));
    // 1. puente
    pin(VC, GOLD, seg(t, 6.9, 7.4) * (1 - seg(t, 9.6, 10)), 'INICIO', t);
    route([VC, PEN, WI], seg(t, 7.4, 9.6), CYAN);
    // 2. edificio
    edificio(APT, outBack(seg(t, 10.6, 11.3)) * 1.1, 1);
    etiqueta(APT, 'TRINITY APARTMENTS', 0, -130, GOLD, seg(t, 11, 11.5) * (1 - seg(t, 18.8, 19.3)));
    if (t > 11.6 && t < 13) {
      const a = seg(t, 11.6, 12) * (1 - seg(t, 12.7, 13));
      text('Trinity = el asesino de la temporada 4 😱', W/2, 1440, 38, WHITE, 'center', 700, a);
    }
    // 3. segundo piso, esquina oeste
    if (t > 13 && t < 16.2) {
      const a = seg(t, 13.1, 13.5) * (1 - seg(t, 15.8, 16.2));
      panel(a);
      x.save(); x.globalAlpha *= a;
      // fachada grande
      x.fillStyle = '#f2e6d0'; x.fillRect(250, 665, 580, 400);
      x.fillStyle = '#ff7a59'; x.fillRect(235, 645, 610, 26);
      for (let r = 0; r < 3; r++) for (let cc = 0; cc < 6; cc++) {
        const hi = r === 1 && cc === 0;
        x.fillStyle = hi ? GOLD : '#2b6f8f';
        x.fillRect(282 + cc * 90, 705 + r * 115, 56, 70);
      }
      const k = seg(t, 13.8, 14.6);
      x.strokeStyle = PINK; x.lineWidth = 8; x.beginPath(); x.arc(310, 855, 60 + 6 * Math.sin(t * 6), 0, 7); x.stroke();
      text('← OESTE', 470, 1080, 46, WHITE, 'center', 700, k);
      text('2º PISO · ESQUINA', 540, 615, 44, GOLD, 'center', 700, k);
      x.restore();
      if (t > 14.8) {
        x.save(); x.globalAlpha *= a * seg(t, 14.8, 15.1); x.translate(640, 905); x.rotate(-.18);
        const s = outBack(seg(t, 14.8, 15.2));
        x.scale(s, s); x.strokeStyle = '#ff2b2b'; x.lineWidth = 10; rr(-170, -55, 340, 110, 14); x.stroke();
        x.font = `100px ${FT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff2b2b'; x.fillText('CERRADO', 0, 6);
        x.restore();
      }
    }
    // 4. azotea: kit
    if (t > 16 && t < 19.2) {
      const a = seg(t, 16.1, 16.5) * (1 - seg(t, 18.8, 19.2));
      panel(a, 660);
      kitDexter(520, 820, 3.0 * outBack(seg(t, 16.4, 17)), a);
      text('Herramientas · Guantes', W/2, 1110, 44, WHITE, 'center', 700, a * seg(t, 17, 17.4));
      text('Jeringa · Cuchillo', W/2, 1170, 44, GOLD, 'center', 700, a * seg(t, 17.3, 17.7));
      glow('EL KIT DE DEXTER', W/2, 640, 80, PINK, a);
    }
    // 5. muelle
    route([APT, [1124, 806], DOCK], seg(t, 19.2, 20.4), GOLD, 8);
    if (t > 20) {
      const [dx, dy] = S(DOCK), a = seg(t, 20.2, 20.6) * (1 - seg(t, 22.4, 22.9));
      boat(dx - 30, dy + 20, Math.PI, 1.6 * outBack(seg(t, 20.2, 20.7)));
      text('SLICE OF LIFE ⛵', dx - 10, dy - 70, 38, GOLD, 'center', 700, a);
      text('Lure Predator · se puede manejar', W/2, 1440, 38, WHITE, 'center', 700, a);
    }
    stepCard(1, 'Cruza a Washington Island', 'Por el puente desde Vice City', seg(t, 7.2, 10));
    stepCard(2, 'Busca Trinity Apartments', 'El edificio con piscina', seg(t, 10, 13));
    stepCard(3, 'Segundo piso, al oeste', 'La última puerta de la esquina', seg(t, 13, 16));
    stepCard(4, 'Sube a la azotea', 'Ahí está su kit', seg(t, 16, 19));
    stepCard(5, 'Muelle del lado oeste', 'Su lancha de la serie', seg(t, 19, 22.4));
    cierre(t, 22.4);
  }
}

function drawCover() {
  performance_t = 1; cam = { cx: 1124, cy: 815, s: 4.6 }; drawMap();
  const v = x.createRadialGradient(W/2, H/2, 300, W/2, H/2, 1150); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.8)');
  x.fillStyle = v; x.fillRect(0, 0, W, H);
  route([VC, PEN, WI], 1, CYAN); edificio(APT, 1.4, 1);
  x.save(); x.fillStyle = 'rgba(120,0,0,.25)'; x.fillRect(0, 0, W, H); x.restore();
  kitDexter(560, 1180, 3.4, 1);
  const g = x.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 560);
  x.save(); x.translate(W/2, 120); x.rotate(-.04); x.fillStyle = '#000'; x.fillRect(-150, -52, 300, 104); x.fillStyle = '#ff3d8e'; x.fillRect(-142, -44, 284, 88); x.restore();
  glow('GTA 6', W/2, 116, 84, WHITE);
  glow('DEXTER', W/2, 300, 240, PINK, 1, ['#ffffff', '#ff6b6b', '#c4001a']);
  glow('ESTÁ AQUÍ', W/2, 480, 150, PINK);
  const g2 = x.createLinearGradient(0, H - 620, 0, H); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(.35, 'rgba(0,0,0,.85)'); g2.addColorStop(1, 'rgba(0,0,0,.95)'); x.fillStyle = g2; x.fillRect(0, H - 620, W, 620);
  glow('🔪 SU DEPARTAMENTO', W/2, 1530, 96, GOLD, 1, ['#fff3b0', '#ffd23e', '#ff8a1e']);
  text('Ruta exacta en el mapa', W/2, 1660, 62, WHITE);
  text('Paso a paso 📍', W/2, 1750, 62, GOLD);
}
