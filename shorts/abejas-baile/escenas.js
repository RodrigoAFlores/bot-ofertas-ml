// ESCENAS del reel "Las abejas que bailan" (motor de la skill reel-sabias-que).

Object.assign(C, {
  amarillo: "#ffc928", amarilloO: "#f0a500", rayas: "#2a1d12", ala: "rgba(220,240,255,0.55)", alaBorde: "rgba(255,255,255,0.9)",
  miel: "#f6a81c", mielC: "#ffd25a", mielO: "#b86e0a", cera: "#e8a33a", tallo: "#4f9a4a", talloO: "#3a7a36",
  pasto: "#7cc957", pastoO: "#5aa83c", cerro1: "#9ad67a", cerro2: "#6fbf5a", piel: "#f2c49b", bata: "#ffffff",
});
const EMOJIS = "🐝💃🎵🎶🌸✨❌⏩🗺️☀️⏱️🏆🏅👇💬👆🔔💛";

// ---------- personajes ----------
// abeja de perfil mirando a la derecha. e: { alas (fase), menea, cabeza, ojos, rubor, sonrisa, antenas, patasArriba }
function abeja(c, x, y, s, e = {}, flip = false, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(flip ? -s : s, s);
  c.rotate(e.menea || 0);
  // ala trasera
  const fa = Math.sin((e.alas || 0) * Math.PI * 2);
  const alaAng = -0.9 + fa * 0.7;
  const dibAla = (dx, escala, alfa) => {
    c.save(); c.translate(dx, -50); c.rotate(alaAng); c.scale(escala, escala);
    c.fillStyle = C.ala; c.globalAlpha = alfa; c.beginPath(); c.ellipse(0, -70, 42, 78, 0.15, 0, 7); c.fill();
    c.strokeStyle = C.alaBorde; c.lineWidth = 4; c.stroke(); c.globalAlpha = 1; c.restore();
  };
  dibAla(-20, 0.85, 0.8);
  // aguijón
  c.fillStyle = C.rayas; c.beginPath(); c.moveTo(-118, 6); c.lineTo(-150, 14); c.lineTo(-116, 22); c.fill();
  // cuerpo con rayas
  c.save(); c.beginPath(); c.ellipse(-30, 10, 95, 72, 0, 0, 7); c.clip();
  const g = c.createLinearGradient(0, -60, 0, 80); g.addColorStop(0, C.amarillo); g.addColorStop(1, C.amarilloO);
  c.fillStyle = g; c.fillRect(-140, -70, 230, 160);
  c.fillStyle = C.rayas; for (const xr of [-95, -45, 5]) { c.beginPath(); c.ellipse(xr, 10, 15, 80, 0.1, 0, 7); c.fill(); }
  c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.ellipse(-30, -35, 60, 14, -0.1, 0, 7); c.fill();
  c.restore();
  // patitas
  c.strokeStyle = C.rayas; c.lineWidth = 7; c.lineCap = "round";
  for (const [px, d] of [[-40, 0], [-5, 1], [30, 2]]) {
    const sw = Math.sin((e.alas || 0) * 6.28 * 0.25 + d) * 0.2;
    c.beginPath(); c.moveTo(px, 70); c.lineTo(px + 10 + sw * 20, e.patasArriba ? 40 : 100); c.stroke();
  }
  // cabeza
  c.save(); c.translate(80, -15); c.rotate(e.cabeza || 0);
  c.fillStyle = C.rayas; c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fill();
  // antenas
  const an = (e.antenas || 0);
  c.strokeStyle = C.rayas; c.lineWidth = 7;
  for (const [dx, a0] of [[-10, -1.9], [12, -1.4]]) {
    const a = a0 + an * 0.3 + Math.sin((e.alas || 0) * 0.9 + dx) * 0.06;
    const ex = dx + Math.cos(a) * 70, ey = -40 + Math.sin(a) * 70;
    c.beginPath(); c.moveTo(dx, -40); c.quadraticCurveTo(dx + Math.cos(a) * 40 + 12, -40 + Math.sin(a) * 40, ex, ey); c.stroke();
    c.fillStyle = C.rayas; c.beginPath(); c.arc(ex, ey, 10, 0, 7); c.fill();
  }
  // ojo grande
  const ojos = e.ojos || "normal";
  if (ojos === "corazon") corazon(c, 22, -8, 22, C.rosa);
  else if (ojos === "brillo") { estrellita(c, 22, -8, 28, 0, C.ama); estrellita(c, 22, -8, 12, 0.4, "#fff"); }
  else {
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(22, -8, 20, 24, 0, 0, 7); c.fill();
    c.fillStyle = "#111"; c.beginPath(); c.arc(28, -6, 12, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(24, -12, 4.5, 0, 7); c.fill();
    if (ojos === "sorpresa") { c.fillStyle = "#fff"; c.beginPath(); c.arc(28, -6, 6, 0, 7); c.fill(); }
    const pp = e.parpado || 0; if (pp > 0) { c.fillStyle = C.rayas; c.beginPath(); c.ellipse(22, -32 + pp * 24, 22, pp * 26, 0, 0, 7); c.fill(); }
  }
  // sonrisa y mejilla
  c.strokeStyle = "#fff"; c.lineWidth = 5; c.beginPath(); c.arc(30, 22, 14, 0.2, 1.4); c.stroke();
  if (e.rubor) { c.fillStyle = `rgba(255,120,150,${0.7 * e.rubor})`; c.beginPath(); c.ellipse(4, 22, 13, 8, 0, 0, 7); c.fill(); }
  c.restore();
  // ala delantera
  dibAla(-5, 1, 0.9);
  c.restore();
}
// abeja volando: aleteo rápido + bamboleo
function abejaVuela(c, x, y, s, t, extra = {}, flip = false, rot = 0) {
  abeja(c, x, y + Math.sin(t * 7) * 8 * s, s, Object.assign({ alas: t * 9, menea: Math.sin(t * 5) * 0.06 }, extra), flip, rot);
}
function flor(c, x, y, s, col, t, semilla = 1, tallo = 260) {
  const m = Math.sin(t * 1.6 + semilla) * 0.06;
  c.save(); c.translate(x, y); c.rotate(m); c.scale(s, s);
  c.strokeStyle = C.tallo; c.lineWidth = 12; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(14, -tallo / 2, 0, -tallo); c.stroke();
  c.fillStyle = C.talloO; c.beginPath(); c.ellipse(16, -tallo * 0.4, 30, 12, -0.5, 0, 7); c.fill();
  c.translate(0, -tallo); c.rotate(t * 0.15 + semilla);
  c.fillStyle = col;
  for (let i = 0; i < 6; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.ellipse(0, -44, 26, 40, 0, 0, 7); c.fill(); }
  c.fillStyle = C.mielC; c.beginPath(); c.arc(0, 0, 30, 0, 7); c.fill();
  c.fillStyle = C.amarilloO; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(Math.cos(i) * 14, Math.sin(i) * 14, 4, 0, 7); c.fill(); }
  c.restore();
}
const COLFLOR = ["#ff6fa8", "#ffffff", "#b07cff", "#ff9a3c", "#ff5a5a", "#6fc3ff"];
function campoFlores(c, t, y0, n, semilla, escala = 1, ancho = 3000, x0 = -800) {
  const r = rnd(semilla);
  for (let i = 0; i < n; i++) flor(c, x0 + r() * ancho, y0 + r() * 60, escala * (0.5 + r() * 0.5), COLFLOR[i % COLFLOR.length], t, i + semilla, 160 + r() * 140);
}
// prado: tono 0 = día, 1 = atardecer
function prado(c, t, tono = 0, semilla = 3) {
  const g = c.createLinearGradient(0, -600, 0, 1400);
  if (tono < 0.5) { g.addColorStop(0, "#58b4f0"); g.addColorStop(0.6, "#a8dcfa"); g.addColorStop(1, "#fff3c4"); }
  else { g.addColorStop(0, "#4a2f7a"); g.addColorStop(0.5, "#d0567a"); g.addColorStop(1, "#ffc077"); }
  c.fillStyle = g; c.fillRect(-2000, -1000, W + 4000, 2600);
  const sx0 = 760, sy0 = tono < 0.5 ? 380 : 1050;
  const rg = c.createRadialGradient(sx0, sy0, 10, sx0, sy0, 420);
  rg.addColorStop(0, "rgba(255,250,210,0.95)"); rg.addColorStop(0.2, "rgba(255,240,170,0.45)"); rg.addColorStop(1, "rgba(255,240,170,0)");
  c.fillStyle = rg; c.fillRect(-2000, -1000, W + 4000, 2600);
  c.fillStyle = tono < 0.5 ? "#fff7cc" : "#ffe2a0"; c.beginPath(); c.arc(sx0, sy0, 80, 0, 7); c.fill();
  // nubes
  const r = rnd(semilla);
  c.fillStyle = tono < 0.5 ? "rgba(255,255,255,0.9)" : "rgba(255,190,190,0.5)";
  for (let i = 0; i < 6; i++) { const x = ((r() * 3000 + t * 18) % 3400) - 1200, y = 200 + r() * 500; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + k * 60, y - (k % 2) * 25, 90, 40, 0, 0, 7); c.fill(); } }
}
function cerros(c, tono = 0) {
  const col = tono < 0.5 ? [C.cerro1, C.cerro2] : ["#8a5a8a", "#6a3f72"];
  for (const [y0, amp, f, ph, cc] of [[1180, 70, 0.0025, 1, col[0]], [1290, 60, 0.0035, 3, col[1]]]) {
    c.fillStyle = cc; c.beginPath(); c.moveTo(-2000, 2400);
    for (let x = -2000; x <= W + 3000; x += 30) c.lineTo(x, y0 + Math.sin(x * f + ph) * amp);
    c.lineTo(W + 3000, 2400); c.fill();
  }
}
function suelo(c, tono = 0) {
  const g = c.createLinearGradient(0, 1380, 0, 2200);
  g.addColorStop(0, tono < 0.5 ? C.pasto : "#7a6a6a"); g.addColorStop(1, tono < 0.5 ? C.pastoO : "#4a3a4a");
  c.fillStyle = g; c.fillRect(-2000, 1380, W + 5000, 1400);
}
// panal (hexágonos) para el interior de la colmena; luz: 0..1
function panal(c, x0, y0, w, h, luz = 1, semilla = 5) {
  c.fillStyle = "#3a2208"; c.fillRect(x0, y0, w, h);
  const R = 62, dx = R * Math.sqrt(3), dy = R * 1.5, r = rnd(semilla);
  for (let j = -1; j < h / dy + 2; j++) for (let i = -1; i < w / dx + 2; i++) {
    const cx = x0 + i * dx + (j % 2 ? dx / 2 : 0), cy = y0 + j * dy, llena = r();
    c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; c.lineTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5)); } c.closePath();
    const gg = c.createRadialGradient(cx - 10, cy - 14, 4, cx, cy, R);
    gg.addColorStop(0, llena > 0.4 ? C.mielC : "#d48a2a"); gg.addColorStop(1, llena > 0.4 ? C.miel : "#9a5a14");
    c.fillStyle = gg; c.fill(); c.strokeStyle = C.cera; c.lineWidth = 8; c.stroke();
  }
  if (luz < 1) { c.fillStyle = `rgba(20,8,0,${0.7 * (1 - luz)})`; c.fillRect(x0, y0, w, h); }
}
// colmena de paja (exterior)
function colmenaPaja(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = "#6b4a22"; c.fillRect(-200, 0, 400, 30);
  for (let i = 0; i < 6; i++) {
    const w = 190 - i * 26, yy = -i * 62;
    const g = c.createLinearGradient(0, yy - 60, 0, yy); g.addColorStop(0, "#f2c25a"); g.addColorStop(1, "#c98a2a");
    c.fillStyle = g; redondo(c, -w, yy - 64, w * 2, 66, 33); c.fill();
    c.strokeStyle = "rgba(120,70,20,0.5)"; c.lineWidth = 3; for (let k = -w + 20; k < w; k += 28) { c.beginPath(); c.moveTo(k, yy - 55); c.lineTo(k + 10, yy - 8); c.stroke(); }
  }
  c.fillStyle = "#3a2208"; c.beginPath(); c.ellipse(0, -30, 38, 26, 0, 0, 7); c.fill();
  c.restore();
}
// científico de caricatura con lupa. e: { salto, brazos, ojos ('normal'|'sorpresa'|'feliz'), boca }
function cientifico(c, x, y, s, t, e = {}) {
  c.save(); c.translate(x, y - (e.salto || 0)); c.scale(s, s);
  c.fillStyle = "rgba(0,0,0,0.18)"; c.beginPath(); c.ellipse(0, 10 + (e.salto || 0) / s, 120, 22, 0, 0, 7); c.fill();
  // piernas y zapatos
  c.fillStyle = "#3a4a6a"; c.fillRect(-50, -170, 40, 170); c.fillRect(12, -170, 40, 170);
  c.fillStyle = "#222"; c.beginPath(); c.ellipse(-30, 0, 42, 16, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(36, 0, 42, 16, 0, 0, 7); c.fill();
  // bata
  c.fillStyle = C.bata; redondo(c, -100, -460, 200, 320, 60); c.fill();
  c.strokeStyle = "#d8dde6"; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -440); c.lineTo(0, -150); c.stroke();
  c.fillStyle = "#5a8ad6"; c.fillRect(30, -380, 34, 44);
  // brazos
  const b = e.brazos || 0;
  c.strokeStyle = C.bata; c.lineWidth = 46; c.lineCap = "round";
  c.beginPath(); c.moveTo(-85, -420); c.lineTo(-150, lerp(-260, -560, b)); c.stroke();
  c.beginPath(); c.moveTo(85, -420); c.lineTo(160, lerp(-330, -560, b)); c.stroke();
  c.fillStyle = C.piel; c.beginPath(); c.arc(-150, lerp(-250, -575, b), 26, 0, 7); c.fill(); c.beginPath(); c.arc(160, lerp(-320, -575, b), 26, 0, 7); c.fill();
  // lupa en la mano derecha
  if (!b || b < 0.5) { c.strokeStyle = "#6b4a22"; c.lineWidth = 14; c.beginPath(); c.moveTo(170, -320); c.lineTo(220, -380); c.stroke(); c.strokeStyle = "#555"; c.lineWidth = 12; c.fillStyle = "rgba(200,235,255,0.5)"; c.beginPath(); c.arc(250, -420, 52, 0, 7); c.fill(); c.stroke(); }
  // cabeza
  c.fillStyle = C.piel; c.beginPath(); c.arc(0, -560, 100, 0, 7); c.fill();
  c.fillStyle = "#e8e8e8"; for (const [hx, hy, hr] of [[-95, -600, 45], [95, -600, 45], [-70, -650, 40], [70, -650, 40]]) { c.beginPath(); c.arc(hx, hy, hr, 0, 7); c.fill(); }
  // anteojos y ojos
  const oj = e.ojos || "normal";
  for (const ox of [-38, 38]) {
    c.fillStyle = "#fff"; c.beginPath(); c.arc(ox, -570, 30, 0, 7); c.fill();
    if (oj === "feliz") { c.strokeStyle = "#222"; c.lineWidth = 7; c.beginPath(); c.arc(ox, -562, 14, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    else { c.fillStyle = "#222"; c.beginPath(); c.arc(ox + 4, -568, oj === "sorpresa" ? 7 : 11, 0, 7); c.fill(); }
    c.strokeStyle = "#333"; c.lineWidth = 7; c.beginPath(); c.arc(ox, -570, 32, 0, 7); c.stroke();
  }
  c.strokeStyle = "#333"; c.lineWidth = 6; c.beginPath(); c.moveTo(-6, -572); c.lineTo(6, -572); c.stroke();
  // bigote y boca
  c.fillStyle = "#e8e8e8"; c.beginPath(); c.ellipse(-24, -510, 30, 13, 0.2, 0, 7); c.fill(); c.beginPath(); c.ellipse(24, -510, 30, 13, -0.2, 0, 7); c.fill();
  c.fillStyle = "#7a2a2a";
  if (e.boca === "o") { c.beginPath(); c.ellipse(0, -482, 14, 18, 0, 0, 7); c.fill(); }
  else { c.beginPath(); c.arc(0, -492, 26, 0.1, Math.PI - 0.1); c.fill(); }
  c.restore();
}
function medalla(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = "#d63a3a"; c.beginPath(); c.moveTo(-50, -150); c.lineTo(-10, -20); c.lineTo(10, -20); c.lineTo(50, -150); c.lineTo(20, -150); c.lineTo(0, -80); c.lineTo(-20, -150); c.fill();
  const g = c.createRadialGradient(-20, 10, 10, 0, 40, 90); g.addColorStop(0, "#fff3a0"); g.addColorStop(0.5, "#ffc928"); g.addColorStop(1, "#c98a00");
  c.fillStyle = g; c.beginPath(); c.arc(0, 40, 80, 0, 7); c.fill();
  c.strokeStyle = "#a86e00"; c.lineWidth = 8; c.beginPath(); c.arc(0, 40, 62, 0, 7); c.stroke();
  estrellita(c, 0, 40, 36, 0.4, "#fff8d0");
  c.restore();
}
// ondas de vibración
function ondas(c, x, y, t, col = "rgba(255,240,180,", n = 3, rmax = 160) {
  for (let i = 0; i < n; i++) { const p = ((t * 1.4 + i / n) % 1); c.strokeStyle = col + (1 - p) * 0.8 + ")"; c.lineWidth = 8; c.beginPath(); c.arc(x, y, 30 + p * rmax, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(x, y, 30 + p * rmax, Math.PI - 0.9, Math.PI + 0.9); c.stroke(); }
}
// nubecita de olor
function olor(c, x, y, t, alfa = 1) {
  for (let i = 0; i < 4; i++) { const p = ((t * 0.6 + i / 4) % 1); c.fillStyle = `rgba(255,150,200,${(1 - p) * 0.6 * alfa})`; c.beginPath(); c.arc(x + Math.sin(t * 2 + i) * 20, y - p * 160, 18 + p * 26, 0, 7); c.fill(); }
}
// pétalos que barren la pantalla (transición)
function rafagaPetalos(c, p) {
  if (p <= 0 || p >= 1) return;
  const r = rnd(66);
  for (let i = 0; i < 90; i++) {
    const y = r() * H, x = lerp(-300, W + 300, clamp(p * 1.5 - r() * 0.5, 0, 1)) + (r() - 0.5) * 400;
    c.save(); c.translate(x, y); c.rotate(p * 8 + i); c.fillStyle = COLFLOR[i % COLFLOR.length];
    c.beginPath(); c.ellipse(0, 0, 26 + r() * 20, 14 + r() * 8, 0, 0, 7); c.fill(); c.restore();
  }
  destello(c, Math.sin(p * Math.PI) * 0.5, "255,240,245");
}
// baile del meneo: posición en el "8" (corrida recta hacia arriba + vuelta por la derecha, corrida + vuelta por la izquierda)
// u: tiempo del baile (s), periodo: duración de un "8" completo; ang: inclinación de la corrida (0 = hacia arriba)
function puntoBaile(u, cx, cy, largo = 300, periodo = 3.2, ang = 0) {
  const f = ((u / periodo) % 1 + 1) % 1, mitad = f < 0.5 ? 0 : 1, g = (f % 0.5) / 0.5;
  let lx, ly, dir;
  if (g < 0.45) { const q = g / 0.45; lx = 0; ly = largo / 2 - q * largo; dir = -Math.PI / 2; }
  else {
    const q = (g - 0.45) / 0.55, lado = mitad ? -1 : 1, rr = largo / 2;
    const a = -Math.PI / 2 + lado * q * Math.PI; // de arriba hacia abajo por un costado
    lx = lado * rr * 0.75 * Math.sin(q * Math.PI); ly = -rr * Math.cos(q * Math.PI);
    dir = Math.atan2(rr * Math.sin(q * Math.PI) * Math.PI, lado * rr * 0.75 * Math.cos(q * Math.PI) * Math.PI);
  }
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return { x: cx + lx * ca - ly * sa, y: cy + lx * sa + ly * ca, dir: dir + ang, corrida: g < 0.45 };
}
function estelaBaile(c, u, cx, cy, largo, periodo, ang, alfa = 1, col = "255,230,120") {
  c.lineCap = "round";
  for (let k = 1; k < 60; k++) {
    const a = puntoBaile(u - (k - 1) * 0.03, cx, cy, largo, periodo, ang), b = puntoBaile(u - k * 0.03, cx, cy, largo, periodo, ang);
    if (Math.hypot(a.x - b.x, a.y - b.y) > 80) continue;
    c.strokeStyle = `rgba(${col},${alfa * (1 - k / 60)})`; c.lineWidth = 18 * (1 - k / 70); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }
}
function bailarina(c, u, cx, cy, s, largo, periodo, ang = 0, extra = {}) {
  const p = puntoBaile(u, cx, cy, largo, periodo, ang);
  const menea = p.corrida ? Math.sin(u * 40) * 0.32 : 0;
  abeja(c, p.x, p.y, s, Object.assign({ alas: p.corrida ? u * 3 : u * 1.2, menea, rubor: 0.6 }, extra), false, p.dir);
  return p;
}

// =====================================================================
// ESCENA 1 — gancho: vuela entre flores; congelado en "bailando"
// =====================================================================
function escena1(c, t) {
  const v = t - VO[0], tBaila = 2.75, cong = v > tBaila;
  const tA = cong ? VO[0] + tBaila : t;
  const cam = { x: 540, y: lerp(250, 1150, salida(t / 1.8)), z: lerp(1.0, 1.22, rebote((v - 0.9) / 0.45)) + (cong ? 0.08 * salida((v - tBaila) / 0.3) : 0) };
  const bx = 540 + Math.sin(tA * 2.6) * 170 * (1 - salida(tA / 3)), by = lerp(700, 1050, salida(tA / 2.5)), bs = lerp(0.6, 1.25, salida(tA / 3));
  conCamara(c, cam, [
    [0.2, () => prado(c, tA)],
    [0.45, () => cerros(c)],
    [0.7, () => { suelo(c); campoFlores(c, tA, 1420, 22, 2, 0.8); }],
    [1, () => {
      abejaVuela(c, bx, by, bs, tA, cong ? { menea: 0.35, ojos: "brillo", rubor: 1, patasArriba: true, cabeza: 0.2 } : { rubor: 0.5 }, Math.cos(tA * 2.6) < -0.3 && !cong);
      campoFlores(c, tA, 1700, 8, 9, 1.4, 1600, -300);
    }],
  ]);
  vineta(c, 0.35);
  if (cong) {
    const p = v - tBaila;
    destello(c, 0.9 - p * 4);
    const scx = W / 2 + (bx - cam.x) * cam.z, scy = H / 2 + (by - cam.y) * cam.z, r = lerp(380, 300, salida(p / 0.35));
    c.strokeStyle = C.ama; c.lineWidth = 14; c.setLineDash([36, 18]); c.lineDashOffset = -p * 200;
    c.beginPath(); c.arc(scx, scy, r, 0, 7); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 5; i++) { const a = i * 1.257 + p * 2; emoji(c, i % 2 ? "🎵" : "🎶", scx + Math.cos(a) * (r + 30), scy + Math.sin(a) * (r + 30), 80, resorte(p - i * 0.05, 9, 16)); }
  }
  titulo(c, ["¡BAILAN PARA", "HABLAR! 🐝💃"], 300, VO[0] + 0.3, t);
  destello(c, 1 - t / 0.45, "0,0,0");
  rafagaPetalos(c, (t - (DUR[0] - 0.45)) / 0.8);
}

// =====================================================================
// ESCENA 2 — el descubrimiento: paneo por el campo, parada en la flor, globo vacío tachado, salida con barrido
// =====================================================================
const S2 = { flores: 2.55, globo: 3.88, tacha: 4.55, rompe: 5.05, pregunta: 5.61 };
function escena2(c, t) {
  const v = t - VO[1];
  rafagaPetalos(c, 0);
  let camX = v < S2.flores ? lerp(-400, 1300, suave(v / S2.flores)) : 1300 - sacudida(v - S2.flores, 16, 8, 16);
  const sale = v > VOZ[1] - 0.2;
  if (sale) camX += entrada((v - (VOZ[1] - 0.2)) / 0.9) * 2600;
  const z = v > S2.flores ? 1.0 + 0.16 * rebote((v - S2.flores) / 0.3) : 1.0;
  const cam = { x: camX + 540, y: 1250, z };
  const flX = 1840, flY = 1640;
  conCamara(c, cam, [
    [0.15, () => prado(c, t, 0, 7)],
    [0.4, () => cerros(c)],
    [0.7, () => { suelo(c); campoFlores(c, t, 1430, 40, 4, 0.8, 4200, -1200); }],
    [1, () => {
      flor(c, flX, flY, 1.7, "#ff6fa8", t, 3, 300);
      // la abeja vuela junto a la cámara y luego aterriza en la flor
      let bx, by, ex = {};
      if (v < S2.flores) { bx = camX + 540 + Math.sin(t * 3) * 60; by = 1080 + Math.sin(t * 2.2) * 40; ex = { rubor: 0.4 }; }
      else { const p = salida((v - S2.flores) / 0.6); bx = lerp(camX + 540, flX, p); by = lerp(1080, flY - 300 * 1.7 - 80, p); ex = { ojos: v > S2.flores + 0.4 && v < S2.globo ? "brillo" : "normal", rubor: 1, cabeza: v > S2.globo ? -0.15 : 0 }; }
      if (sale) { const p = entrada((v - (VOZ[1] - 0.2)) / 0.6); bx += p * 1800; by -= p * 300; }
      abejaVuela(c, bx, by, 1.15, t, ex, false);
      if (sale) { c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 10; c.lineCap = "round"; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(bx - 200 - i * 30, by - 60 + i * 30); c.lineTo(bx - 450 - i * 30, by - 60 + i * 30); c.stroke(); } }
    }],
    [1.3, () => campoFlores(c, t, 1900, 10, 21, 1.5, 4200, -1200)],
  ]);
  vineta(c, 0.35);
  // globo de diálogo vacío → tachado → se rompe
  if (v > S2.globo && v < S2.rompe + 1.2) {
    const s = resorte(v - S2.globo, 8, 15), rp = Math.max(0, v - S2.rompe);
    for (const lado of [-1, 1]) {
      c.save(); c.translate(560 + lado * rp * 240, 780 + rp * rp * 1500); c.rotate(lado * rp * 2); c.scale(s, s);
      c.beginPath(); c.rect(lado < 0 ? -300 : 0, -250, 300, 500); c.clip();
      c.fillStyle = "#fff"; c.strokeStyle = C.tinta; c.lineWidth = 12;
      c.beginPath(); c.ellipse(0, 0, 220, 140, 0, 0, 7); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-40, 130); c.lineTo(-90, 220); c.lineTo(20, 136); c.fill();
      c.fillStyle = "#c8cfdc"; for (const dx of [-70, 0, 70]) { c.beginPath(); c.arc(dx, 0, 18, 0, 7); c.fill(); }
      c.restore();
    }
    if (v > S2.tacha && v < S2.rompe + 0.15) {
      const p = salida((v - S2.tacha) / 0.25);
      c.strokeStyle = C.rojo; c.lineWidth = 38; c.lineCap = "round";
      c.beginPath(); c.moveTo(380, 620); c.lineTo(lerp(380, 740, p), lerp(620, 940, p)); c.moveTo(740, 620); c.lineTo(lerp(740, 380, p), lerp(620, 940, p)); c.stroke();
    }
  }
  titulo(c, ["¿CÓMO LES", "AVISA? 🌸"], 300, VO[1] + S2.pregunta, t);
}

// =====================================================================
// ESCENA 3 — el baile en la colmena: oscuridad, el "8", cortes rápidos, ondas, cámara rápida
// =====================================================================
const S3 = { oscuridad: 1.25, baila: 2.6, avanza: 3.89, menea: 5.15, vuelta: 6.66, repite: 7.86, otravez: 9.0 };
function escena3(c, t) {
  const v = t - VO[2];
  const luz = 1 - 0.65 * suave((v - S3.oscuridad) / 0.6);
  const ub = v - S3.baila; // tiempo de baile
  const rapido = v > S3.otravez;
  const u = ub < 0 ? 0 : rapido ? (S3.otravez - S3.baila) + (v - S3.otravez) * 3 : ub;
  const CX = 540, CY = 1250, L = 380, PER = 3.2;
  let cam = { x: 540, y: 1200, z: 1.0 };
  let corte = 0;
  if (v > S3.avanza && v < S3.vuelta) { cam = { x: 540, y: 1150, z: 1.55, rot: -0.03 }; corte = S3.avanza; }
  if (v > S3.menea && v < S3.vuelta) corte = S3.menea;
  if (v > S3.vuelta && v < S3.repite) { cam = { x: 700, y: 1250, z: 1.45, rot: 0.04 }; corte = S3.vuelta; }
  if (v > S3.repite) { cam = { x: 540, y: 1200, z: lerp(1.0, 0.92, suave((v - S3.repite) / 2)) }; corte = S3.repite; }
  conCamara(c, cam, [
    [1, () => {
      panal(c, -600, -400, W + 1200, H + 900, luz);
      // brillo cálido donde baila
      if (ub > 0) { const g = c.createRadialGradient(CX, CY, 20, CX, CY, 700); g.addColorStop(0, `rgba(255,220,120,${0.35 * (1 - luz + 0.3)})`); g.addColorStop(1, "rgba(255,220,120,0)"); c.fillStyle = g; c.fillRect(-600, -400, W + 1200, H + 900); }
      // compañeras alrededor (miran y se mueven)
      const r = rnd(8);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.283 + 0.3, rr = 470 + r() * 60, x = CX + Math.cos(a) * rr * 0.85, y = CY + Math.sin(a) * rr;
        abeja(c, x, y, 0.72, { alas: t * 2 + i, cabeza: Math.sin(t * 2 + i) * 0.1, antenas: Math.sin(t * 6 + i) * 0.5, rubor: 0.4 }, x > CX, 0);
      }
      if (ub > 0) estelaBaile(c, u, CX, CY, L, PER, 0, clamp(ub / 0.4, 0, 1));
      if (ub <= 0) {
        // llega volando desde arriba
        const p = salida((v + 0.35) / 1.6);
        abejaVuela(c, lerp(900, CX, p), lerp(200, CY + L / 2, p), 1.0, t, { rubor: 0.6 });
      } else {
        const p = bailarina(c, u, CX, CY, 1.0, L, PER, 0);
        if (v > S3.menea && p.corrida) ondas(c, p.x, p.y, t, "rgba(255,240,180,", 3, 200);
      }
    }],
  ]);
  vineta(c, 0.55);
  if (corte) destello(c, 1 - (v - corte) / 0.08);
  if (v > S3.avanza && v < S3.menea) etiqueta(c, "⬆️ EN LÍNEA RECTA", 540, 1650, t, VO[2] + S3.avanza + 0.05, C.ama);
  if (v > S3.menea && v < S3.vuelta) etiqueta(c, "〰️ ¡MENEO!", 540, 1650, t, VO[2] + S3.menea + 0.05, C.ama);
  if (v > S3.vuelta && v < S3.repite) etiqueta(c, "↩️ DA LA VUELTA", 540, 1650, t, VO[2] + S3.vuelta + 0.05, C.ama);
  if (rapido) { emoji(c, "⏩", 930, 160, 90, 1 + 0.08 * Math.sin(t * 12)); etiqueta(c, "x3", 930, 260, t, VO[2] + S3.otravez, "#fff", C.tinta, 44, 0); }
  titulo(c, ["EL BAILE", "DEL MENEO 🐝"], 300, VO[2] + S3.baila, t);
  // entra con iris desde la escena anterior
  iris(c, salida(t / 0.5), W / 2, 1100);
  // sale: el "8" brillante crece y llena la pantalla
  const fin = (t - (DUR[2] - 0.45)) / 0.45;
  if (fin > 0) {
    c.save(); c.translate(540, 1200); c.scale(1 + fin * 5, 1 + fin * 5);
    c.strokeStyle = `rgba(255,230,120,${0.9})`; c.lineWidth = 30; c.beginPath();
    for (let k = 0; k <= 80; k++) { const q = puntoBaile((k / 80) * PER, 0, 0, L, PER, 0); k ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); } c.stroke();
    c.restore(); destello(c, fin * 1.2, "255,245,210");
  }
}

// =====================================================================
// ESCENA 4 — el mapa: pantalla dividida (cielo arriba / panal abajo), mismo ángulo, distancia; luego primer plano
// =====================================================================
const S4 = { sol: 3.09, dura: 4.58, lejos: 6.65, siguen: 8.6, vibra: 9.97, huelen: 11.39 };
function escena4(c, t) {
  const v = t - VO[3];
  const TH = 0.62; // ángulo de las flores respecto del sol (rad)
  const lejos = suave((v - S4.lejos) / 1.2);
  const dist = lerp(330, 470, lejos);
  if (v < S4.siguen) {
    // ---- panel de arriba: afuera ----
    c.save(); c.beginPath(); c.rect(0, 0, W, 955); c.clip();
    c.save(); c.translate(0, -300); prado(c, t, 0, 12); c.restore();
    c.fillStyle = C.cerro2; c.beginPath(); c.moveTo(0, 955); for (let x = 0; x <= W; x += 30) c.lineTo(x, 840 + Math.sin(x * 0.006) * 30); c.lineTo(W, 955); c.fill();
    const hx = 540, hy = 860, sunX = 540, sunY = 470;
    // sol que late
    const latido = v > S4.sol ? 1 + 0.12 * Math.sin((v - S4.sol) * 8) * Math.exp(-(v - S4.sol) * 1.5) : 1;
    c.save(); c.translate(sunX, sunY); c.scale(latido, latido);
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = "rgba(255,210,60,0.8)"; c.beginPath(); c.moveTo(70, -12); c.lineTo(110, 0); c.lineTo(70, 12); c.fill(); }
    c.fillStyle = "#ffd23a"; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill(); c.restore();
    colmenaPaja(c, hx, hy + 60, 0.45);
    const fx = hx + Math.sin(TH) * dist, fy = hy - Math.cos(TH) * dist;
    for (let i = 0; i < 5; i++) flor(c, fx - 60 + i * 30, fy + 60 + (i % 2) * 14, 0.45, COLFLOR[i], t, i, 90);
    // flecha colmena → flores (se dibuja de a poco)
    const pf = salida(v / 2.4);
    flecha(c, hx, hy - 30, lerp(hx, fx, pf), lerp(hy - 30, fy + 40, pf), "#ff4f8a", pf);
    if (v > S4.sol) { lineaPunteada(c, hx, hy - 30, sunX, sunY + 70, salida((v - S4.sol) / 0.5)); arcoAngulo(c, hx, hy - 30, TH, salida((v - S4.sol - 0.3) / 0.4)); }
    if (v > S4.lejos) etiqueta(c, "+ LEJOS", fx + 60, fy - 40, t, VO[3] + S4.lejos + 0.1, "#fff", "#ff4f8a", 44, 0.05);
    c.restore();
    // ---- panel de abajo: el panal con la corrida del baile ----
    c.save(); c.beginPath(); c.rect(0, 965, W, H - 965); c.clip();
    panal(c, 0, 965, W, H - 965, 0.75, 14);
    const ox = 540, oy = 1520, Lb = 300 + lejos * 200;
    if (v > S4.sol) { lineaPunteada(c, ox, oy, ox, oy - 360, salida((v - S4.sol) / 0.5)); arcoAngulo(c, ox, oy, TH, salida((v - S4.sol - 0.3) / 0.4)); etiqueta(c, "⬆️ = ☀️", ox - 230, oy - 300, t, VO[3] + S4.sol + 0.4, C.ama, C.tinta, 46, 0); }
    c.save(); c.translate(ox, oy); c.rotate(TH); c.strokeStyle = "rgba(255,79,138,0.9)"; c.lineWidth = 14; c.setLineDash([26, 14]); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -Lb); c.stroke(); c.setLineDash([]); c.restore();
    // la abeja recorre la corrida meneándose
    const per = 1.6 + lejos * 1.0, q = (v % per) / per;
    const bx = ox + Math.sin(TH) * Lb * q, by = oy - Math.cos(TH) * Lb * q;
    abeja(c, bx, by, 0.75, { alas: t * 3, menea: Math.sin(t * 40) * 0.3, rubor: 0.6 }, false, TH - Math.PI / 2);
    // cronómetro: el meneo dura más
    if (v > S4.dura) { emoji(c, "⏱️", 880, 1100, 90, resorte(v - S4.dura, 8, 15)); c.fillStyle = C.tinta; redondo(c, 790, 1160, 190, 30, 15); c.fill(); c.fillStyle = C.ama; redondo(c, 795, 1165, 180 * (0.3 + 0.7 * lejos) * (0.5 + 0.5 * q), 20, 10); c.fill(); }
    c.restore();
    // separador
    c.fillStyle = C.tinta; c.fillRect(0, 953, W, 14);
    // "MISMO ÁNGULO"
    if (v > S4.sol + 0.6) etiqueta(c, "¡MISMO ÁNGULO! 📐", 540, 960, t, VO[3] + S4.sol + 0.6, "#fff", "#ff4f8a", 50, 0);
    titulo(c, ["¡ES UN MAPA! 🗺️☀️"], 230, VO[3] + 0.2, t, 110);
    destello(c, 1 - t / 0.35, "255,245,210");
  } else {
    // ---- primer plano: las compañeras la siguen ----
    const tp = v - S4.siguen;
    const cam = { x: 540, y: 1150, z: lerp(1.6, 1.3, salida(tp / 1.2)) };
    const CX = 540, CY = 1150;
    conCamara(c, cam, [[1, () => {
      panal(c, -500, -300, W + 1000, H + 700, 0.8, 22);
      const p = bailarina(c, t, CX, CY, 1.0, 340, 3.0, 0);
      for (let i = 0; i < 4; i++) {
        const a = -0.5 + i * 1.55, d = 210;
        const fx = p.x + Math.cos(a) * d * 0.9, fy = p.y + Math.sin(a) * d;
        abeja(c, fx, fy, 0.7, { alas: t * 2 + i, antenas: Math.sin(t * 10 + i) * 0.8, cabeza: 0.2, rubor: 0.5, ojos: v > S4.huelen && i % 2 ? "corazon" : "normal" }, fx > p.x, 0);
      }
      if (v > S4.vibra) ondas(c, p.x, p.y, t, "rgba(255,240,180,", 3, 260);
      if (v > S4.huelen) olor(c, p.x + 40, p.y - 60, t, clamp((v - S4.huelen) / 0.4, 0, 1));
    }]]);
    vineta(c, 0.5);
    destello(c, 1 - tp / 0.12);
    if (v > S4.vibra) etiqueta(c, "〰️ VIBRACIONES", 300, 1600, t, VO[3] + S4.vibra + 0.05, C.ama);
    if (v > S4.huelen) etiqueta(c, "🌸 OLOR A FLORES", 760, 1720, t, VO[3] + S4.huelen + 0.05, "#ffb3d1", C.tinta, 58, 0.04);
    titulo(c, ["¡LA SIGUEN! 🐝🐝"], 300, VO[3] + S4.siguen + 0.1, t, 120);
    // salida: el enjambre despega hacia la cámara
    const fin = (t - (DUR[3] - 0.5)) / 0.5;
    if (fin > 0) { const r = rnd(44); for (let i = 0; i < 14; i++) { const s = 0.4 + fin * fin * (2 + r() * 3); abejaVuela(c, r() * W + (r() - 0.5) * 300 * fin, r() * H, s, t + i, { rubor: 0.5 }, r() > 0.5); } }
  }
}
function flecha(c, x1, y1, x2, y2, col, alfa = 1) {
  if (alfa <= 0) return;
  const a = Math.atan2(y2 - y1, x2 - x1);
  c.globalAlpha = clamp(alfa * 3, 0, 1); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 16; c.lineCap = "round";
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  c.beginPath(); c.moveTo(x2 + Math.cos(a) * 30, y2 + Math.sin(a) * 30); c.lineTo(x2 + Math.cos(a + 2.4) * 40, y2 + Math.sin(a + 2.4) * 40); c.lineTo(x2 + Math.cos(a - 2.4) * 40, y2 + Math.sin(a - 2.4) * 40); c.fill();
  c.globalAlpha = 1;
}
function lineaPunteada(c, x1, y1, x2, y2, p) {
  if (p <= 0) return;
  c.strokeStyle = "rgba(255,215,60,0.95)"; c.lineWidth = 10; c.setLineDash([20, 16]); c.beginPath(); c.moveTo(x1, y1); c.lineTo(lerp(x1, x2, p), lerp(y1, y2, p)); c.stroke(); c.setLineDash([]);
}
function arcoAngulo(c, x, y, th, p) {
  if (p <= 0) return;
  c.strokeStyle = "#ffffff"; c.lineWidth = 9; c.beginPath(); c.arc(x, y, 120, -Math.PI / 2, -Math.PI / 2 + th * p); c.stroke();
}

// =====================================================================
// ESCENA 5 — el giro: el científico, congelado en "Nobel", medalla, iris
// =====================================================================
const S5 = { cientifico: 2.69, nobel: 5.87 };
function escena5(c, t) {
  const v = t - VO[4];
  const cong = v > S5.nobel && v < S5.nobel + 0.7;
  const tA = cong ? VO[4] + S5.nobel : t;
  const va = tA - VO[4];
  let cam = { x: 540, y: 1250, z: lerp(1.15, 1.0, salida(t / 1.2)) };
  if (va > S5.cientifico) cam = { x: 470, y: 1150, z: 1.0 + 0.35 * salida((va - S5.cientifico) / 0.8) };
  const feliz = v > S5.nobel + 0.7;
  const salto = feliz ? Math.abs(Math.sin((v - S5.nobel - 0.7) * 7)) * 120 : 0;
  const sac = v > S5.nobel && v < S5.nobel + 0.7 ? sacudida(v - S5.nobel, 24, 8, 40) : 0;
  c.save(); c.translate(sac, sac * 0.4);
  conCamara(c, cam, [
    [0.2, () => prado(c, tA, 0, 30)],
    [0.45, () => cerros(c)],
    [0.7, () => { suelo(c); campoFlores(c, tA, 1430, 20, 31, 0.7); }],
    [1, () => {
      colmenaPaja(c, 820, 1640, 1.0);
      cientifico(c, 360, 1700, 0.95, tA, { ojos: feliz ? "feliz" : va > S5.cientifico ? "sorpresa" : "normal", boca: feliz ? "sonrisa" : "o", brazos: feliz ? 1 : 0, salto });
      for (let i = 0; i < 4; i++) { const a = tA * (1.2 + i * 0.2) + i * 1.6; abejaVuela(c, 820 + Math.cos(a) * 220, 1300 + Math.sin(a * 1.3) * 120, 0.45, tA + i, { rubor: 0.5 }, Math.sin(a) > 0); }
      // abeja que hace una reverencia al final
      if (feliz) abeja(c, 640, 1420, 0.7, { alas: t * 2, menea: 0.5 * Math.abs(Math.sin((v - S5.nobel - 0.7) * 3)), rubor: 1, ojos: "corazon" }, true, 0);
    }],
  ]);
  c.restore();
  vineta(c, cong ? 0.6 : 0.4);
  // medalla que cae
  if (v > S5.nobel) {
    const p = v - S5.nobel, y = lerp(-200, 820, salida(p / 0.5)) + sacudida(p - 0.5, 30, 6, 14);
    for (let i = 0; i < 8; i++) estrellita(c, 540 + Math.cos(i + p * 2) * 230, 820 + Math.sin(i + p * 2) * 230, 26 * clamp(p * 3, 0, 1), p * 3, C.ama);
    medalla(c, 540, y, 1.6, Math.sin(p * 4) * 0.15 * Math.exp(-p));
    destello(c, 0.9 - p * 4);
    etiqueta(c, "PREMIO NOBEL 1973 🏅", 540, 1140, t, VO[4] + S5.nobel + 0.25, C.ama, C.tinta, 58, -0.04);
  }
  titulo(c, ["¡GANÓ UN", "NOBEL! 🏆"], 300, VO[4] + S5.nobel + 0.05, t);
  // entra con destello desde el enjambre; sale con iris sobre la medalla
  destello(c, 1 - t / 0.3, "255,255,255");
  iris(c, 1 - clamp((t - (DUR[4] - 0.5)) / 0.5, 0, 1), 540, 820);
}

// =====================================================================
// ESCENA 6 — cierre al atardecer: varias abejas bailan el "8", cámara que se aleja, SÍGUEME
// =====================================================================
function escena6(c, t) {
  const v = t - VO[5];
  const cam = { x: 540, y: 1300, z: lerp(1.5, 1.02, suave(t / DUR[5])) };
  conCamara(c, cam, [
    [0.15, () => prado(c, t, 1, 40)],
    [0.4, () => cerros(c, 1)],
    [0.7, () => { suelo(c, 1); campoFlores(c, t, 1440, 26, 41, 0.75); }],
    [1, () => {
      colmenaPaja(c, 540, 1700, 1.0);
      for (const [cx, cy, s, d] of [[300, 1150, 0.55, 0], [780, 1120, 0.55, 1.1]]) { estelaBaile(c, t + d, cx, cy, 220, 2.6, 0, 0.8, "255,220,140"); bailarina(c, t + d, cx, cy, s, 220, 2.6); }
      const ladea = v > 1.0 ? 0.35 * rebote((v - 1.0) / 0.35) : 0;
      abeja(c, 540, 1180, 0.85, { alas: t * 9, cabeza: ladea, rubor: 0.8, parpado: (t % 3.3) > 3.15 ? 1 : 0 }, false, 0);
      corazon(c, 540, 1000 - Math.sin(t * 2) * 10, 34 * clamp(t, 0, 1), "rgba(255,111,168,0.85)");
    }],
  ]);
  vineta(c, 0.5);
  titulo(c, ["¿A QUIÉN SE LO", "ENSEÑARÍAS? 👇"], 300, VO[5] + 0.3, t, 118);
  if (v > 2.42) { emoji(c, "💬", 965, 545, 110, resorte(v - 2.42, 8, 15), -0.1); etiqueta(c, "¡ETIQUÉTALO!", 730, 585, t, VO[5] + 2.5, C.ama, C.tinta, 56, -0.06); }
  if (v > 4.21) {
    const s = resorte(v - 4.21, 7, 14), b = Math.sin(t * 5) * 6;
    c.save(); c.translate(540, 1720 + b); c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.3)"; redondo(c, -230, -60, 460, 130, 65); c.fill();
    c.fillStyle = C.azulFB; redondo(c, -236, -76, 472, 130, 65); c.fill();
    c.font = `700 76px Fredoka, "Noto Color Emoji"`; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SÍGUEME 🔔", 0, 16); c.textAlign = "left";
    c.restore();
    if (v > 4.55) { const p = ((v - 4.55) % 1.2) / 1.2; emoji(c, "👆", 800, 1800 - salida(p) * 40, 110, 1, -0.3, 1 - p * 0.3); }
  }
  // entra con iris; fundido final
  iris(c, salida(t / 0.5), 540, 1000);
  destello(c, (t - (DUR[5] - 0.6)) / 0.6, "0,0,0");
}

const ESC = [escena1, escena2, escena3, escena4, escena5, escena6];

function eventos() {
  const g = (k, s) => INI[k] + VO[k] + s;
  const e = [], add = (t, tipo) => e.push({ t, tipo });
  const titulos = [[g(0, 0.3), 19], [g(1, S2.pregunta), 14], [g(2, S3.baila), 15], [g(3, 0.2), 14], [g(3, S4.siguen + 0.1), 14], [g(4, S5.nobel + 0.05), 13], [g(5, 0.3), 25]];
  for (const [t0, n] of titulos) for (let i = 0; i < n; i++) add(t0 + i * 0.035, "pop");
  // zumbidos de abeja
  for (const t0 of [0.3, 1.6, 2.6]) add(t0, "zumbido");
  add(g(1, 0.2), "zumbido"); add(g(1, 1.4), "zumbido"); add(g(2, 0), "zumbido"); add(g(4, 0.4), "zumbido"); add(g(5, 0.2), "zumbido");
  // escena 1
  add(g(0, 0.9), "whoosh"); add(g(0, 2.75), "ding"); add(g(0, 2.75), "flash"); add(INI[1] - 0.45, "rafaga");
  // escena 2
  add(g(1, S2.flores), "golpe"); add(g(1, S2.flores + 0.4), "brillo"); add(g(1, S2.globo), "pop"); add(g(1, S2.tacha), "error"); add(g(1, S2.rompe), "crack"); add(INI[2] - 0.6, "whoosh");
  // escena 3
  add(INI[2], "iris"); add(g(2, S3.oscuridad), "toc");
  for (const tc of [S3.avanza, S3.menea, S3.vuelta, S3.repite]) { add(g(2, tc), "corte"); add(g(2, tc + 0.05), "check"); }
  add(g(2, S3.menea), "zumbido"); add(g(2, S3.otravez), "timelapse"); add(INI[3] - 0.45, "coro");
  // escena 4
  add(g(3, 0.1), "whoosh"); add(g(3, S4.sol), "ding"); add(g(3, S4.sol + 0.6), "check"); add(g(3, S4.dura), "tic"); add(g(3, S4.dura + 0.5), "tic"); add(g(3, S4.lejos + 0.1), "check");
  add(g(3, S4.siguen), "corte"); add(g(3, S4.vibra), "zumbido"); add(g(3, S4.vibra + 0.05), "check"); add(g(3, S4.huelen), "corazones"); add(INI[4] - 0.5, "zumbido"); add(INI[4] - 0.4, "whoosh");
  // escena 5
  add(g(4, S5.cientifico), "boing"); add(g(4, S5.nobel), "golpe"); add(g(4, S5.nobel), "flash"); add(g(4, S5.nobel + 0.3), "brillo"); add(g(4, S5.nobel + 0.25), "check"); add(g(4, S5.nobel + 0.7), "corazones"); add(INI[5] - 0.5, "iris");
  // escena 6
  add(g(5, 1.0), "boing"); add(g(5, 2.42), "pop"); add(g(5, 4.21), "boton");
  return e;
}
