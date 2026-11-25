// Demo de estilo vectorial fluido: gancho del cuervo, 1080x1920 a 60 fps.
// Cuervo armado por piezas (alas de plumas que giran desde el hombro, cabeza, cola),
// resortes y curvas suaves, cámara con capas de profundidad y desenfoque de movimiento.

const W = 1080, H = 1920, DUR = 5.0;
const cv = document.getElementById("c");
cv.width = W; cv.height = H;
const ctx = cv.getContext("2d");
const sub = document.createElement("canvas"); sub.width = W; sub.height = H;
const sx = sub.getContext("2d");

// ---------- matemáticas de movimiento ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const suave = (p) => { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
const salida = (p) => 1 - Math.pow(1 - clamp(p, 0, 1), 3);
const rebote = (p) => { p = clamp(p, 0, 1); const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
// resorte amortiguado: arranca en 0, llega a 1 con un pequeño rebote
const resorte = (tau, k = 7, w = 15) => (tau <= 0 ? 0 : 1 - Math.exp(-k * tau) * Math.cos(w * tau));
// oscilación amortiguada que parte en 0 (para asentarse tras un impacto)
const sacudida = (tau, amp, k = 6, w = 13) => (tau <= 0 ? 0 : amp * Math.exp(-k * tau) * Math.sin(w * tau));
function rnd(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// interpolación entre poses con transiciones rápidas (las aves mueven la cabeza "a golpes")
function pose(claves, t, dur = 0.16) {
  let v = claves[0].v;
  for (let i = 1; i < claves.length; i++) {
    const c = claves[i];
    if (t >= c.t) v = c.v;
    else { const p = (t - (c.t - dur)) / dur; if (p > 0) v = Object.fromEntries(Object.keys(v).map((k) => [k, lerp(v[k], c.v[k], rebote(p))])); break; }
  }
  return v;
}

// ---------- tiempos ----------
const T = { aterriza: 1.12, mira: 1.65, ladea: 2.35, bandada: 2.1, frente: 3.05, amenaza: 3.75, txt1: 0.35, txt2: 3.15 };

// ---------- fondo ----------
function cielo(c) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1b1240"); g.addColorStop(0.32, "#5a2a6e"); g.addColorStop(0.55, "#c64a62"); g.addColorStop(0.7, "#f6894e"); g.addColorStop(0.8, "#ffc56e");
  c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
}
function sol(c, t) {
  const r = 150 + Math.sin(t * 1.3) * 3;
  const g = c.createRadialGradient(720, 1180, 10, 720, 1180, 700);
  g.addColorStop(0, "rgba(255,240,190,0.95)"); g.addColorStop(0.12, "rgba(255,210,140,0.7)"); g.addColorStop(0.4, "rgba(255,150,90,0.18)"); g.addColorStop(1, "rgba(255,120,80,0)");
  c.fillStyle = g; c.fillRect(-200, 300, W + 400, 1700);
  c.fillStyle = "#fff3cf"; c.beginPath(); c.arc(720, 1180, r, 0, 7); c.fill();
}
function nubes(c, t) {
  const r = rnd(5);
  for (let i = 0; i < 6; i++) {
    const y = 380 + i * 120 + r() * 60, x = ((r() * 1600 + t * (14 + i * 4)) % 1700) - 300, s = 0.7 + r() * 0.8;
    c.fillStyle = i < 3 ? "rgba(255,160,150,0.28)" : "rgba(255,200,160,0.25)";
    for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + k * 70 * s, y - (k % 2) * 22 * s, 110 * s, 34 * s, 0, 0, 7); c.fill(); }
  }
}
function colinas(c, y0, amp, f, ph, col) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-300, H + 300);
  for (let x = -300; x <= W + 300; x += 20) c.lineTo(x, y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph * 2) * amp * 0.35);
  c.lineTo(W + 300, H + 300); c.closePath(); c.fill();
}
function arbolLejano(c, x, y, s, col) {
  c.fillStyle = col;
  c.fillRect(x - 6 * s, y - 120 * s, 12 * s, 120 * s);
  for (const [dx, dy, r] of [[0, -170, 70], [-45, -135, 50], [45, -135, 52], [0, -230, 46]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }
  // ramas secas donde se posa la bandada
  c.strokeStyle = col; c.lineWidth = 6 * s; c.lineCap = "round";
  c.beginPath(); c.moveTo(x, y - 200 * s); c.lineTo(x + 110 * s, y - 280 * s); c.moveTo(x, y - 190 * s); c.lineTo(x - 100 * s, y - 260 * s); c.stroke();
}
function rama(c, t) {
  const g = c.createLinearGradient(0, 1300, 0, 1420);
  g.addColorStop(0, "#6b3f2a"); g.addColorStop(0.5, "#4a2a1c"); g.addColorStop(1, "#2a160e");
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-100, 1300); c.bezierCurveTo(300, 1330, 650, 1340, 980, 1300); c.lineTo(1000, 1345); c.bezierCurveTo(650, 1395, 300, 1420, -100, 1440); c.closePath(); c.fill();
  // ramita
  c.beginPath(); c.moveTo(760, 1320); c.bezierCurveTo(820, 1240, 880, 1200, 960, 1170); c.lineTo(966, 1186); c.bezierCurveTo(890, 1215, 835, 1260, 785, 1330); c.fill();
  // textura de corteza
  c.strokeStyle = "rgba(255,190,140,0.18)"; c.lineWidth = 4; c.lineCap = "round";
  for (let i = 0; i < 14; i++) { const x = i * 70 - 40; c.beginPath(); c.moveTo(x, 1335 + (i % 3) * 8); c.quadraticCurveTo(x + 30, 1328, x + 60, 1338 + (i % 2) * 6); c.stroke(); }
  // hojas que se mecen
  for (const [x, y, a, s] of [[930, 1170, -0.6, 1], [880, 1205, 0.5, 0.85], [120, 1330, 2.4, 0.9], [60, 1350, 2.0, 1.1]]) hoja(c, x, y, a + Math.sin(t * 2.2 + x) * 0.12, s);
}
function hoja(c, x, y, a, s, col = "#3f6b3a", col2 = "#2c4f2a") {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(40, -32, 95, 0); c.quadraticCurveTo(40, 32, 0, 0); c.fill();
  c.strokeStyle = col2; c.lineWidth = 3; c.beginPath(); c.moveTo(4, 0); c.lineTo(88, 0); c.stroke();
  c.restore();
}
function polvo(c, t) {
  const r = rnd(11);
  for (let i = 0; i < 40; i++) {
    const x = r() * W, v = 12 + r() * 25, y = (r() * H - t * v + H * 3) % H, rr = 2 + r() * 5;
    const a = 0.25 + 0.25 * Math.sin(t * 2 + i);
    c.fillStyle = `rgba(255,225,170,${a})`; c.beginPath(); c.arc(x + Math.sin(t + i) * 12, y, rr, 0, 7); c.fill();
  }
}

function tronco(c) {
  const g = c.createLinearGradient(-200, 0, 150, 0);
  g.addColorStop(0, "#1e0f0a"); g.addColorStop(0.7, "#3a2016"); g.addColorStop(1, "#4e2c1c");
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-300, 1150); c.bezierCurveTo(-60, 1220, 60, 1300, 40, 1420); c.bezierCurveTo(20, 1700, 80, 1900, 120, 2300); c.lineTo(-300, 2300); c.closePath(); c.fill();
  c.strokeStyle = "rgba(255,170,120,0.15)"; c.lineWidth = 5;
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-10 + i * 6, 1450 + i * 120); c.quadraticCurveTo(30, 1500 + i * 120, 50 + i * 4, 1560 + i * 120); c.stroke(); }
}
function arbustos(c, t) {
  const r = rnd(21);
  for (let capaB = 0; capaB < 2; capaB++) for (let i = 0; i < 9; i++) {
    const x = i * 150 - 60 + r() * 60, y = 1560 + capaB * 110 + r() * 50, rr = 110 + r() * 70;
    const m = Math.sin(t * 1.6 + i) * 4;
    c.fillStyle = capaB ? "#170b1e" : "#24122e"; c.beginPath(); c.arc(x + m, y, rr, 0, 7); c.fill();
    if (!capaB) { c.fillStyle = "rgba(255,140,110,0.12)"; c.beginPath(); c.arc(x + m + rr * 0.25, y - rr * 0.55, rr * 0.45, Math.PI * 1.1, Math.PI * 1.9); c.fill(); }
  }
}

// ---------- cuervo por piezas ----------
// estado: { alas: 0 plegadas → 1 abiertas, aleteo: ángulo extra, cabeza:{rot, mira}, cola, pecho, parpado, pico }
const NEGRO = "#15121f", PLUMA = "#221d33", BRILLO = "#4b4f8c", BRILLO2 = "#6f5fa8";
function pluma(c, L, w, col, borde) {
  c.beginPath(); c.moveTo(0, -w / 2); c.quadraticCurveTo(L * 0.55, -w * 0.75, L, 0); c.quadraticCurveTo(L * 0.55, w * 0.75, 0, w / 2); c.closePath();
  c.fillStyle = col; c.fill();
  if (borde) { c.strokeStyle = borde; c.lineWidth = 3; c.stroke(); }
}
function ala(c, e, lejos) {
  // nueve plumas que se abren en abanico desde el hombro
  c.save(); c.translate(20, -285);
  const plegada = 2.47, abierta = 3.95 + e.aleteo;
  const base = lerp(plegada, abierta, e.alas), abanico = lerp(0.16, 0.95, e.alas);
  const col = lejos ? "#100d18" : PLUMA, borde = lejos ? null : "rgba(75,79,140,0.55)";
  for (let i = 8; i >= 0; i--) {
    const a = base - abanico / 2 + (abanico * i) / 8 + Math.sin(e.t * 9 + i) * 0.012 * e.alas;
    c.save(); c.rotate(a); pluma(c, 250 + i * 16 - (lejos ? 20 : 0), 62, col, borde); c.restore();
  }
  // coberteras (parte gruesa del ala)
  c.save(); c.rotate(base - 0.05);
  c.fillStyle = lejos ? "#120f1c" : NEGRO; c.beginPath(); c.ellipse(80, 0, 120, 62, 0, 0, 7); c.fill();
  if (!lejos) { c.fillStyle = BRILLO; c.globalAlpha = 0.35; c.beginPath(); c.ellipse(70, -20, 80, 16, -0.1, 0, 7); c.fill(); c.globalAlpha = 1; }
  c.restore();
  c.restore();
}
function cuervo(c, x, y, s, e, silueta = null) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(e.inclina || 0);
  const col = (k) => silueta || k;
  if (!silueta) ala(c, e, true);
  else { c.save(); c.translate(20, -285); c.rotate(lerp(2.47, 3.95 + e.aleteo, e.alas)); c.fillStyle = silueta; c.beginPath(); c.ellipse(140, 0, 170, 45, 0, 0, 7); c.fill(); c.restore(); }
  // cola (gira desde la base, con retardo)
  c.save(); c.translate(-110, -165); c.rotate(e.cola);
  for (let i = 0; i < 5; i++) { c.save(); c.rotate(-0.15 + i * 0.07); c.translate(0, 0); c.rotate(Math.PI * 0.78); pluma(c, 230, 54, col(i % 2 ? PLUMA : NEGRO), silueta ? null : "#2e2a48"); c.restore(); }
  c.restore();
  // patas
  if (e.patas !== false) {
    c.strokeStyle = col("#2a2630"); c.lineWidth = 16; c.lineCap = "round"; c.lineJoin = "round";
    for (const dx of [0, 38]) { c.beginPath(); c.moveTo(dx + 5, -120); c.lineTo(dx - 4, -60); c.lineTo(dx, 0); c.stroke(); c.lineWidth = 10; c.beginPath(); c.moveTo(dx, 0); c.lineTo(dx + 34, 6); c.moveTo(dx, 0); c.lineTo(dx - 26, 8); c.stroke(); c.lineWidth = 16; }
  }
  // cuerpo con brillo iridiscente
  c.save(); c.translate(0, -215); c.scale(1, e.pecho);
  c.fillStyle = col(NEGRO); c.beginPath(); c.ellipse(0, 0, 160, 118, -0.38, 0, 7); c.fill();
  if (!silueta) {
    const g = c.createLinearGradient(-120, -90, 80, 60);
    g.addColorStop(0, "rgba(111,95,168,0.55)"); g.addColorStop(0.4, "rgba(75,79,140,0.25)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 150, 108, -0.38, 0, 7); c.fill();
  }
  c.restore();
  // cuello
  c.fillStyle = col(NEGRO); c.beginPath(); c.moveTo(20, -330); c.quadraticCurveTo(150, -340, 140, -230); c.lineTo(20, -200); c.closePath(); c.fill();
  // plumas del cuello (se erizan al amenazar)
  if (!silueta) for (let i = 0; i < 6; i++) { c.save(); c.translate(120 + i * 6, -300 + i * 14); c.rotate(0.6 + e.eriza * 0.7); pluma(c, 30 + e.eriza * 18, 14, NEGRO); c.restore(); }
  // ala cercana
  if (!silueta) ala(c, e, false);
  else { c.save(); c.translate(20, -285); c.rotate(lerp(2.47, 3.95 + e.aleteo, e.alas) + 0.1); c.fillStyle = silueta; c.beginPath(); c.ellipse(140, 0, 175, 50, 0, 0, 7); c.fill(); c.restore(); }
  // cabeza
  const h = e.cabeza;
  c.save(); c.translate(115, -372); c.rotate(h.rot);
  c.fillStyle = col(NEGRO); c.beginPath(); c.ellipse(0, 0, 84, 74, 0, 0, 7); c.fill();
  if (!silueta) { c.fillStyle = "rgba(111,95,168,0.4)"; c.beginPath(); c.ellipse(-12, -40, 50, 16, -0.2, 0, 7); c.fill(); }
  // pico: se acorta al girar hacia cámara
  c.save(); c.translate(55, -8); c.scale(lerp(1, 0.62, h.mira), 1);
  c.fillStyle = col("#2d2a36");
  c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(80, -24, 140, 14 + e.pico * 4); c.lineTo(10, 14); c.closePath(); c.fill();
  c.fillStyle = col("#221f2a");
  c.save(); c.translate(10, 14); c.rotate(e.pico * 0.35);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(126, 0); c.quadraticCurveTo(70, 26, 0, 22); c.closePath(); c.fill(); c.restore();
  if (!silueta) { c.strokeStyle = "rgba(255,220,200,0.25)"; c.lineWidth = 4; c.beginPath(); c.moveTo(14, -20); c.quadraticCurveTo(70, -20, 120, 8); c.stroke(); }
  c.restore();
  // ojo: la pupila se corre hacia la cámara
  if (!silueta) {
    const ex = 22 + h.mira * 8, ey = -18;
    c.fillStyle = "#0a0810"; c.beginPath(); c.arc(ex, ey, 17, 0, 7); c.fill();
    c.fillStyle = "#3a2a20"; c.beginPath(); c.arc(ex + 2 + h.mira * 2, ey, 11, 0, 7); c.fill();
    c.fillStyle = "#050408"; c.beginPath(); c.arc(ex + 3 + h.mira * 3, ey, 7, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(ex - 4 + h.mira * 4, ey - 6, 4.5, 0, 7); c.fill();
    // párpado
    if (e.parpado > 0) { c.fillStyle = PLUMA; c.beginPath(); c.ellipse(ex, ey - 18 + e.parpado * 18, 20, e.parpado * 19, 0, 0, 7); c.fill(); }
  }
  c.restore();
  c.restore();
}

// estado del cuervo protagonista en el tiempo t
const POSES = [
  { t: 0, v: { rot: -0.18, mira: 0 } },
  { t: T.mira, v: { rot: 0.04, mira: 0.55 } },
  { t: T.ladea, v: { rot: 0.32, mira: 0.8 } },
  { t: T.frente, v: { rot: -0.04, mira: 1 } },
];
function protagonista(t) {
  const pos = { x: 520, y: 1326 };
  const e = { t, alas: 0, aleteo: 0, cola: 0, pecho: 1, parpado: 0, pico: 0, eriza: 0, inclina: 0, cabeza: pose(POSES, t) };
  if (t < T.aterriza) {
    // vuelo de entrada por una curva, frenando
    const p = salida(t / T.aterriza);
    const a = { x: 1350, y: 380 }, b = { x: 1000, y: 1150 }, d = { x: 520, y: 1326 };
    pos.x = (1 - p) * (1 - p) * a.x + 2 * (1 - p) * p * b.x + p * p * d.x;
    pos.y = (1 - p) * (1 - p) * a.y + 2 * (1 - p) * p * b.y + p * p * d.y;
    const frec = lerp(4.2, 2.2, p);
    e.alas = 1; e.aleteo = Math.sin(t * frec * Math.PI * 2) * lerp(0.75, 0.95, p) + (p > 0.75 ? 0.4 * (p - 0.75) / 0.25 : 0);
    e.inclina = lerp(0.12, -0.28, p); e.cola = lerp(0.1, -0.35, p);
  } else {
    const tau = t - T.aterriza;
    // las alas se pliegan con rebote, la cola se asienta con retardo
    e.alas = 1 - resorte(tau * 1.1, 6, 11);
    e.aleteo = 0.4 * Math.exp(-5 * tau);
    e.inclina = lerp(-0.28, 0, resorte(tau, 7, 12)) + sacudida(tau, 0.06);
    e.cola = -0.35 * Math.exp(-4 * tau) + sacudida(tau - 0.08, 0.28, 5, 12);
    pos.y += sacudida(tau, 26, 7, 14);
    // respiración
    e.pecho = 1 + Math.sin(t * 3.2) * 0.012;
    // amenaza: se inclina adelante y eriza plumas
    const am = suave((t - T.amenaza) / 0.35);
    e.inclina += 0.1 * am; e.eriza = am; e.pecho *= 1 + 0.04 * am;
    e.pico = am * (0.5 + 0.5 * Math.sin(t * 22)) * (t > 4.15 && t < 4.45 ? 1 : 0);
  }
  // parpadeos
  for (const tb of [2.75, 4.65]) { const v = (t - tb) / 0.14; if (v > 0 && v < 1) e.parpado = Math.sin(v * Math.PI); }
  return { pos, e };
}

// bandada al fondo (siluetas que llegan a los árboles lejanos)
const BANDADA = Array.from({ length: 9 }, (_, i) => {
  const r = rnd(40 + i);
  return { x0: -200 - r() * 300, y0: 500 + r() * 300, x1: 150 + r() * 820, y1: 980 + r() * 90, ret: r() * 0.6, s: 0.1 + r() * 0.05, f: 3.5 + r() * 1.5 };
});
function bandada(c, t) {
  for (const b of BANDADA) {
    const tau = t - T.bandada - b.ret; if (tau < 0) continue;
    const p = salida(tau / 1.4);
    const x = lerp(b.x0, b.x1, p), y = lerp(b.y0, b.y1, p) - Math.sin(p * Math.PI) * 120;
    const e = { t, alas: 1 - suave((p - 0.85) / 0.15), aleteo: Math.sin(tau * b.f * 6.28) * 0.8, cola: 0, pecho: 1, parpado: 0, pico: 0, eriza: 0, inclina: -0.1, cabeza: { rot: 0, mira: 0 }, patas: p > 0.9 };
    cuervo(c, x, y, b.s, e, "#2a1638");
  }
}

// ---------- títulos ----------
function titulo(c, txt, y, t0, t, col) {
  const letras = [...txt];
  c.font = "700 190px Fredoka"; c.textBaseline = "alphabetic"; c.lineJoin = "round";
  const ancho = c.measureText(txt).width;
  let x = W / 2 - ancho / 2;
  letras.forEach((l, i) => {
    const w = c.measureText(l).width, tau = t - t0 - i * 0.045;
    if (tau > 0) {
      const s = resorte(tau, 8, 16), a = clamp(tau / 0.08, 0, 1);
      c.save(); c.translate(x + w / 2, y); c.scale(s, s); c.rotate((1 - clamp(s, 0, 1)) * 0.3); c.globalAlpha = a;
      c.shadowColor = "rgba(20,5,30,0.55)"; c.shadowBlur = 30; c.shadowOffsetY = 14;
      c.strokeStyle = "#1a0f26"; c.lineWidth = 26; c.strokeText(l, -w / 2, 0);
      c.shadowColor = "transparent"; c.fillStyle = col; c.fillText(l, -w / 2, 0);
      c.restore();
    }
    x += w;
  });
}

// ---------- composición ----------
let hojasDesenf = null;
function prepararHojas() {
  hojasDesenf = document.createElement("canvas"); hojasDesenf.width = W; hojasDesenf.height = H;
  const c = hojasDesenf.getContext("2d");
  c.filter = "blur(14px)";
  for (const [x, y, a, s] of [[-30, 1700, -0.4, 3.2], [960, 1820, 3.6, 3.6], [1040, 260, 2.6, 2.6], [-60, 120, 0.4, 2.4]]) hoja(c, x, y, a, s, "#1f3a22", "#14281a");
}
function cuadro(c, t) {
  // cámara: acercamiento lento hacia el cuervo con leve deriva
  const zoom = lerp(1.42, 1.56, suave(t / DUR)), fx = 600, fy = 1150;
  const dx = Math.sin(t * 0.7) * 10, dy = Math.cos(t * 0.5) * 8;
  const capa = (prof, fn) => {
    c.save();
    const z = 1 + (zoom - 1) * prof;
    c.translate(W / 2 + dx * prof, H / 2 + dy * prof); c.scale(z, z); c.translate(-fx + (fx - W / 2) * (1 - prof), -fy + (fy - H / 2) * (1 - prof));
    fn(); c.restore();
  };
  capa(0.15, () => { cielo(c); sol(c, t); });
  capa(0.3, () => nubes(c, t));
  capa(0.45, () => { colinas(c, 1240, 30, 0.004, 1, "#5a2a5e"); });
  capa(0.6, () => { colinas(c, 1330, 45, 0.003, 3, "#3b1d48"); for (const [x, s] of [[170, 1.0], [470, 0.8], [800, 1.15], [1010, 0.9]]) arbolLejano(c, x, 1330, s, "#2f1840"); bandada(c, t); });
  capa(1, () => {
    tronco(c);
    rama(c, t);
    const { pos, e } = protagonista(t);
    cuervo(c, pos.x, pos.y, 1.0, e);
  });
  capa(1.15, () => arbustos(c, t));
  capa(1.4, () => polvo(c, t));
  capa(1.8, () => c.drawImage(hojasDesenf, 0, 0));
  // viñeta
  const v = c.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(10,0,20,0.55)");
  c.fillStyle = v; c.fillRect(0, 0, W, H);
  titulo(c, "NO TE", 290, T.txt1, t, "#ffffff");
  titulo(c, "OLVIDAN", 480, T.txt2, t, "#ffd43b");
  // entrada desde negro
  if (t < 0.25) { c.fillStyle = `rgba(0,0,0,${1 - t / 0.25})`; c.fillRect(0, 0, W, H); }
}

// desenfoque de movimiento: promedio de submuestras dentro del "obturador" (media rotación)
function render(t, fps = 60, muestras = 6) {
  const obt = 0.5 / fps;
  ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < muestras; i++) {
    const ti = t - obt / 2 + (obt * (i + 0.5)) / muestras;
    sx.clearRect(0, 0, W, H); cuadro(sx, Math.max(0, ti));
    ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(sub, 0, 0);
  }
  ctx.globalAlpha = 1;
}
window.preparar = async () => { await document.fonts.load("700 190px Fredoka"); prepararHojas(); };
window.render = render; window.DUR = DUR; window.T = T;
