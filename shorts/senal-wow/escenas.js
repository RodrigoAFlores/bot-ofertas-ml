// ESCENAS del reel "La señal Wow!" (motor de la skill reel-sabias-que). Tono: misterio nocturno.

Object.assign(C, {
  noche1: "#04051a", noche2: "#141245", noche3: "#3b2a72", noche4: "#7a3f86",
  metal: "#c9d3e6", metalO: "#7d88a3", metalC: "#eef3ff", senal: "#5ef0ff", senalO: "#1fb8d6",
  papel: "#f3efe2", papelO: "#d8d0b8", tintaP: "#4a4a5a", rojoL: "#e8282c", lampara: "#ffd889",
  piel: "#f0c29a", pelo: "#3a2616", camisa: "#5b7bb5", chaleco: "#8a5a3a",
});
const EMOJIS = "📡👽🔢✍️⏱️✨🔇☄️💨❌👇💬👆🔔🤔";

// ---------- fondos ----------
function cieloNoche(c, t, brillo = 1, semilla = 2) {
  const g = c.createLinearGradient(0, -800, 0, 1500);
  g.addColorStop(0, C.noche1); g.addColorStop(0.55, C.noche2); g.addColorStop(0.85, C.noche3); g.addColorStop(1, C.noche4);
  c.fillStyle = g; c.fillRect(-2000, -1500, W + 4000, 3500);
  // vía láctea
  c.save(); c.translate(540, 500); c.rotate(-0.5);
  const v = c.createLinearGradient(0, -220, 0, 220); v.addColorStop(0, "rgba(160,140,255,0)"); v.addColorStop(0.5, "rgba(190,170,255,0.18)"); v.addColorStop(1, "rgba(160,140,255,0)");
  c.fillStyle = v; c.fillRect(-2200, -220, 4400, 440); c.restore();
  // estrellas que titilan
  const r = rnd(semilla);
  for (let i = 0; i < 260; i++) {
    const x = r() * 3400 - 1200, y = r() * 2200 - 900, s = 1 + r() * 3.2, f = r() * 6;
    const a = (0.4 + 0.6 * Math.abs(Math.sin(t * (0.8 + r() * 2) + f))) * brillo;
    c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    if (s > 3.6) estrellita(c, x, y, s * 3.2, 0, `rgba(255,255,255,${a * 0.7})`);
  }
}
function campoNoche(c, y0 = 1420) {
  c.fillStyle = "#0d1430"; c.beginPath(); c.moveTo(-2000, 2400);
  for (let x = -2000; x <= W + 2000; x += 40) c.lineTo(x, y0 - 60 + Math.sin(x * 0.004) * 40 + Math.sin(x * 0.011) * 14);
  c.lineTo(W + 2000, 2400); c.fill();
  const g = c.createLinearGradient(0, y0, 0, y0 + 600); g.addColorStop(0, "#152040"); g.addColorStop(1, "#070a1c");
  c.fillStyle = g; c.fillRect(-2000, y0, W + 4000, 1400);
  // árboles en silueta
  c.fillStyle = "#070b1f";
  for (const [x, s] of [[-80, 1.2], [80, 0.9], [960, 1.1], [1120, 0.8]]) { c.fillRect(x - 8 * s, y0 - 160 * s, 16 * s, 170 * s); c.beginPath(); c.moveTo(x - 80 * s, y0 - 80 * s); c.lineTo(x, y0 - 330 * s); c.lineTo(x + 80 * s, y0 - 80 * s); c.fill(); }
}
// radiotelescopio (plato) — brillo: 0..1 en el receptor
function antena(c, x, y, s, inclina = -0.5, brillo = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // base y torre
  c.fillStyle = "#2a3350"; c.beginPath(); c.moveTo(-120, 0); c.lineTo(-60, -260); c.lineTo(60, -260); c.lineTo(120, 0); c.fill();
  c.strokeStyle = "#3d4870"; c.lineWidth = 8; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-110 + i * 15, -i * 65); c.lineTo(110 - i * 15, -(i + 1) * 65); c.stroke(); }
  c.translate(0, -280); c.rotate(inclina);
  // plato
  const g = c.createLinearGradient(-300, 0, 300, 0); g.addColorStop(0, C.metalO); g.addColorStop(0.5, C.metalC); g.addColorStop(1, C.metal);
  c.fillStyle = g; c.beginPath(); c.ellipse(0, -40, 320, 120, 0, Math.PI, 0); c.quadraticCurveTo(0, 120, -320, -40); c.fill();
  c.strokeStyle = C.metalO; c.lineWidth = 5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 120, -40 - (2 - Math.abs(i)) * 30); c.quadraticCurveTo(i * 60, 40, 0, 70); c.stroke(); }
  // brazos del receptor
  c.strokeStyle = "#9aa6c4"; c.lineWidth = 9; c.beginPath(); c.moveTo(-220, -40); c.lineTo(0, -300); c.lineTo(220, -40); c.stroke();
  c.fillStyle = "#e8edf8"; c.beginPath(); c.arc(0, -300, 26, 0, 7); c.fill();
  if (brillo > 0) {
    const rg = c.createRadialGradient(0, -300, 4, 0, -300, 180); rg.addColorStop(0, `rgba(94,240,255,${brillo})`); rg.addColorStop(1, "rgba(94,240,255,0)");
    c.fillStyle = rg; c.beginPath(); c.arc(0, -300, 180, 0, 7); c.fill();
  }
  c.restore();
}
// pulso de luz/onda que baja del cielo a la antena
function pulso(c, x0, y0, x1, y1, p, col = C.senal) {
  if (p <= 0 || p >= 1.3) return;
  const pp = clamp(p, 0, 1);
  c.strokeStyle = col; c.lineCap = "round";
  const n = 26;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const q = i / n * pp, x = lerp(x0, x1, q), y = lerp(y0, y1, q), ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
    const amp = Math.sin(q * 40) * 22 * (1 - Math.abs(q - pp) * 0.6);
    const px = x + Math.cos(ang) * amp, py = y + Math.sin(ang) * amp;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.lineWidth = 10; c.globalAlpha = clamp(1.3 - p, 0, 1); c.shadowColor = col; c.shadowBlur = 30; c.stroke(); c.shadowBlur = 0; c.globalAlpha = 1;
}
// interferencia: bandas corridas, líneas de barrido y puntos de estática (sobre lo ya dibujado)
function interferencia(c, fuerza, t) {
  if (fuerza <= 0) return;
  const r = rnd(Math.floor(t * 30) + 7);
  for (let i = 0; i < 9 * fuerza; i++) {
    const y = r() * H, h = 20 + r() * 120, dx = (r() - 0.5) * 160 * fuerza;
    c.drawImage(c.canvas, 0, y, W, h, dx, y, W, h);
    c.fillStyle = r() > 0.5 ? `rgba(94,240,255,${0.18 * fuerza})` : `rgba(255,60,120,${0.18 * fuerza})`; c.fillRect(0, y, W, h);
  }
  estatica(c, 0.35 * fuerza, t);
  c.fillStyle = `rgba(0,0,0,${0.18 * fuerza})`; for (let y = (t * 300) % 8; y < H; y += 8) c.fillRect(0, y, W, 3);
}
function estatica(c, a, t) {
  if (a <= 0) return;
  const r = rnd(Math.floor(t * 60) + 3);
  for (let i = 0; i < 2200; i++) { const v = Math.floor(r() * 255); c.fillStyle = `rgba(${v},${v},${v},${a})`; c.fillRect(r() * W, r() * H, 6 + r() * 14, 3 + r() * 5); }
}

// ---------- oficina, astrónomo y papel ----------
function oficina(c, luz = 1) {
  c.fillStyle = "#1a1626"; c.fillRect(-1500, -1000, W + 3000, 4000);
  // pared con ventana nocturna
  c.fillStyle = "#231d33"; c.fillRect(-1500, -1000, W + 3000, 2300);
  c.fillStyle = "#0a0c26"; redondo(c, 620, 300, 380, 460, 20); c.fill();
  c.fillStyle = "rgba(255,255,255,0.8)"; const r = rnd(5); for (let i = 0; i < 30; i++) { c.beginPath(); c.arc(630 + r() * 360, 310 + r() * 440, 1 + r() * 2.5, 0, 7); c.fill(); }
  c.strokeStyle = "#3a2f4f"; c.lineWidth = 18; redondo(c, 620, 300, 380, 460, 20); c.stroke(); c.beginPath(); c.moveTo(810, 300); c.lineTo(810, 760); c.stroke();
  // escritorio
  c.fillStyle = "#4a2e1c"; c.fillRect(-1500, 1320, W + 3000, 60); c.fillStyle = "#2e1c12"; c.fillRect(-1500, 1380, W + 3000, 1500);
  // luz de lámpara
  const g = c.createRadialGradient(300, 1200, 40, 300, 1250, 900); g.addColorStop(0, `rgba(255,216,137,${0.5 * luz})`); g.addColorStop(1, "rgba(255,216,137,0)");
  c.fillStyle = g; c.fillRect(-1500, -1000, W + 3000, 4000);
  c.fillStyle = "#2a3a2a"; c.beginPath(); c.moveTo(160, 900); c.lineTo(260, 820); c.lineTo(380, 900); c.fill();
  c.fillStyle = C.lampara; c.beginPath(); c.ellipse(270, 905, 110, 18, 0, 0, 7); c.fill();
  c.strokeStyle = "#1a1a1a"; c.lineWidth = 12; c.beginPath(); c.moveTo(270, 820); c.lineTo(200, 1320); c.stroke();
}
const CARS = "123456789ABCDEFGHIJKLMNOPQRSTU";
// columna de papel continuo con caracteres; resalta "6EQUJ5" en (colR, filaR)
function papelContinuo(c, x, y, w, h, desplaz, semilla, resaltar = 0, filaR = 9) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = C.papel; c.fillRect(x, y, w, h);
  c.fillStyle = C.papelO; for (let yy = y - (desplaz % 60); yy < y + h; yy += 60) c.fillRect(x, yy, w, 30);
  c.fillStyle = "#c9c1a8"; for (let yy = y - (desplaz % 40); yy < y + h; yy += 40) { c.beginPath(); c.arc(x + 22, yy, 8, 0, 7); c.fill(); c.beginPath(); c.arc(x + w - 22, yy, 8, 0, 7); c.fill(); }
  c.font = "700 44px monospace"; c.fillStyle = C.tintaP;
  const r = rnd(semilla), cols = Math.floor((w - 100) / 44);
  const fila0 = Math.floor(desplaz / 56);
  for (let f = -1; f < h / 56 + 2; f++) {
    const fr = rnd(semilla * 1000 + f + fila0);
    for (let k = 0; k < cols; k++) {
      let ch = fr() < 0.55 ? "1" : CARS[Math.floor(fr() * 9)];
      const fy = y + (f + 1) * 56 - (desplaz % 56);
      const esCodigo = f + fila0 >= filaR && f + fila0 < filaR + 6 && k === 3;
      if (esCodigo) {
        const idx = f + fila0 - filaR; ch = "6EQUJ5"[idx];
        if (resaltar > idx) { c.fillStyle = "rgba(94,240,255,0.45)"; c.fillRect(x + 50 + k * 44 - 4, fy - 42, 40, 50); c.fillStyle = "#b0101a"; }
      }
      c.fillText(ch, x + 50 + k * 44, fy);
      c.fillStyle = C.tintaP;
    }
  }
  c.restore();
}
// astrónomo de caricatura (años 70: pelo oscuro, patillas, anteojos grandes)
function astronomo(c, x, y, s, t, e = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // cuerpo
  c.fillStyle = C.camisa; redondo(c, -130, -330, 260, 360, 90); c.fill();
  c.fillStyle = C.chaleco; c.beginPath(); c.moveTo(-130, -250); c.lineTo(-40, -330); c.lineTo(-20, 30); c.lineTo(-130, 30); c.fill(); c.beginPath(); c.moveTo(130, -250); c.lineTo(40, -330); c.lineTo(20, 30); c.lineTo(130, 30); c.fill();
  // brazo con lápiz
  const b = e.brazo || 0;
  c.strokeStyle = C.camisa; c.lineWidth = 56; c.lineCap = "round"; c.beginPath(); c.moveTo(110, -270); c.lineTo(lerp(220, 260, b), lerp(-120, -330, b)); c.stroke();
  c.fillStyle = C.piel; c.beginPath(); c.arc(lerp(220, 260, b), lerp(-120, -330, b), 30, 0, 7); c.fill();
  if (e.lapiz) { c.save(); c.translate(lerp(220, 260, b), lerp(-120, -330, b)); c.rotate(-0.7); c.fillStyle = C.rojoL; c.fillRect(-8, -90, 16, 90); c.fillStyle = "#333"; c.beginPath(); c.moveTo(-8, 0); c.lineTo(0, 22); c.lineTo(8, 0); c.fill(); c.restore(); }
  // cabeza
  c.save(); c.translate(0, -440); c.rotate(e.cabeza || 0);
  c.fillStyle = C.piel; c.beginPath(); c.arc(0, 0, 110, 0, 7); c.fill();
  c.fillStyle = C.pelo; c.beginPath(); c.arc(0, -30, 112, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  c.fillRect(-112, -40, 30, 90); c.fillRect(82, -40, 30, 90); // patillas
  // anteojos y ojos
  const oj = e.ojos || "normal";
  for (const ox of [-42, 42]) {
    c.fillStyle = e.brilloLentes ? `rgba(160,240,255,${0.5 + 0.5 * e.brilloLentes})` : "#ffffff"; c.beginPath(); c.arc(ox, -5, 36, 0, 7); c.fill();
    if (!e.brilloLentes) { c.fillStyle = "#222"; c.beginPath(); c.arc(ox + 4, -2, oj === "sorpresa" ? 7 : 12, 0, 7); c.fill(); }
    c.strokeStyle = "#222"; c.lineWidth = 9; c.beginPath(); c.arc(ox, -5, 38, 0, 7); c.stroke();
  }
  c.strokeStyle = "#222"; c.lineWidth = 7; c.beginPath(); c.moveTo(-6, -8); c.lineTo(6, -8); c.stroke();
  // cejas
  c.strokeStyle = C.pelo; c.lineWidth = 12; c.lineCap = "round";
  const ce = oj === "sorpresa" ? -18 : 0;
  c.beginPath(); c.moveTo(-70, -55 + ce); c.lineTo(-20, -60 + ce); c.moveTo(20, -60 + ce); c.lineTo(70, -55 + ce); c.stroke();
  // boca
  c.fillStyle = "#7a2a2a";
  if (oj === "sorpresa") { c.beginPath(); c.ellipse(0, 62, 18, 24, 0, 0, 7); c.fill(); }
  else { c.strokeStyle = "#7a2a2a"; c.lineWidth = 7; c.beginPath(); c.moveTo(-24, 62); c.lineTo(24, 62); c.stroke(); }
  c.restore();
  c.restore();
}
// escritura progresiva (revela el texto de izquierda a derecha, inclinado como a mano)
function escrituraMano(c, txt, x, y, tam, p, col = C.rojoL, rot = -0.12) {
  if (p <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.transform(1, 0, -0.25, 1, 0, 0);
  c.font = `700 ${tam}px Fredoka`; const w = c.measureText(txt).width;
  c.beginPath(); c.rect(-20, -tam, (w + 40) * clamp(p, 0, 1), tam * 1.4); c.clip();
  c.fillStyle = col; c.fillText(txt, 0, 0);
  c.restore();
}
function circuloMano(c, cx, cy, rx, ry, p, col = C.rojoL) {
  if (p <= 0) return;
  c.strokeStyle = col; c.lineWidth = 12; c.lineCap = "round"; c.beginPath();
  const n = 60, tope = Math.floor(n * clamp(p, 0, 1) * 1.08);
  for (let i = 0; i <= tope; i++) { const a = -1.9 + (i / n) * Math.PI * 2, w = 1 + Math.sin(i * 0.7) * 0.03; const px = cx + Math.cos(a) * rx * w, py = cy + Math.sin(a) * ry * w; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke();
}

// ---------- espacio, Sagitario, cronómetro, dial, radar ----------
// asterismo "la tetera" de Sagitario (coordenadas relativas)
const SAGITARIO = [[0, 0], [150, -60], [260, -10], [300, 120], [170, 160], [40, 130], [210, -170], [360, -40], [420, 60]];
const LINEAS_SAG = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [6, 2], [2, 7], [7, 8], [8, 3]];
function sagitario(c, x, y, s, p, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = "rgba(150,220,255,0.75)"; c.lineWidth = 5; c.lineCap = "round";
  LINEAS_SAG.forEach(([a, b], i) => {
    const q = clamp(p * LINEAS_SAG.length - i, 0, 1); if (q <= 0) return;
    const [ax, ay] = SAGITARIO[a], [bx, by] = SAGITARIO[b];
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, q), lerp(ay, by, q)); c.stroke();
  });
  SAGITARIO.forEach(([sx2, sy2], i) => estrellita(c, sx2, sy2, 22 + 6 * Math.sin(t * 3 + i), t * 0.5 + i, "#ffffff"));
  c.restore();
}
function tierra(c, x, y, r) {
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, "#6fc3ff"); g.addColorStop(1, "#1d4f9a");
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = "#4caf6a"; for (const [dx, dy, a, b] of [[-0.3, -0.2, 0.35, 0.22], [0.25, 0.25, 0.3, 0.18], [0.3, -0.35, 0.18, 0.12]]) { c.beginPath(); c.ellipse(x + dx * r, y + dy * r, a * r, b * r, 0.4, 0, 7); c.fill(); }
  c.strokeStyle = "rgba(140,210,255,0.6)"; c.lineWidth = r * 0.08; c.beginPath(); c.arc(x, y, r * 1.04, 0, 7); c.stroke();
}
function cronometro(c, x, y, r, seg) {
  c.fillStyle = "#16203a"; c.beginPath(); c.arc(x, y, r + 16, 0, 7); c.fill();
  c.fillStyle = "#f4f6ff"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = "#16203a"; c.fillRect(x - 22, y - r - 50, 44, 40);
  c.strokeStyle = C.senalO; c.lineWidth = 22; c.beginPath(); c.arc(x, y, r - 26, -Math.PI / 2, -Math.PI / 2 + (seg / 72) * Math.PI * 2); c.stroke();
  c.font = `700 ${r * 0.7}px Fredoka`; c.fillStyle = "#16203a"; c.textAlign = "center"; c.fillText(String(Math.floor(seg)), x, y + r * 0.25);
  c.font = `700 ${r * 0.2}px Fredoka`; c.fillText("SEGUNDOS", x, y + r * 0.55); c.textAlign = "left";
}
function dial(c, x, y, w, mhz, brillo) {
  c.fillStyle = "#2a1d14"; redondo(c, x - w / 2 - 20, y - 110, w + 40, 220, 30); c.fill();
  c.fillStyle = "#0d1a14"; redondo(c, x - w / 2, y - 90, w, 120, 16); c.fill();
  c.strokeStyle = "rgba(120,255,180,0.5)"; c.lineWidth = 3;
  for (let i = 0; i <= 20; i++) { const xx = x - w / 2 + 30 + i * (w - 60) / 20; c.beginPath(); c.moveTo(xx, y - 80); c.lineTo(xx, i % 5 ? y - 60 : y - 45); c.stroke(); }
  const pos = x - w / 2 + 30 + clamp((mhz - 1400) / 40, 0, 1) * (w - 60);
  c.strokeStyle = brillo ? "#ff5050" : "#ffb0b0"; c.lineWidth = 8; c.beginPath(); c.moveTo(pos, y - 88); c.lineTo(pos, y + 26); c.stroke();
  c.font = "700 54px Fredoka"; c.textAlign = "center";
  c.fillStyle = brillo ? `rgba(120,255,180,${0.6 + 0.4 * brillo})` : "rgba(120,255,180,0.6)"; c.fillText(mhz.toFixed(0) + " MHz", x, y + 90);
  c.textAlign = "left";
  if (brillo) { const g = c.createRadialGradient(x, y, 10, x, y, w * 0.6); g.addColorStop(0, `rgba(120,255,180,${0.35 * brillo})`); g.addColorStop(1, "rgba(120,255,180,0)"); c.fillStyle = g; c.fillRect(x - w, y - w, w * 2, w * 2); }
}
function radar(c, x, y, r, t, ping = 0) {
  c.fillStyle = "#061a12"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.strokeStyle = "rgba(90,255,150,0.35)"; c.lineWidth = 4;
  for (let k = 1; k <= 4; k++) { c.beginPath(); c.arc(x, y, (r * k) / 4, 0, 7); c.stroke(); }
  c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke();
  const a = t * 2.4;
  for (let i = 0; i < 30; i++) { c.strokeStyle = `rgba(90,255,150,${0.5 * (1 - i / 30)})`; c.lineWidth = 10; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - i * 0.03) * r, y + Math.sin(a - i * 0.03) * r); c.stroke(); }
  c.strokeStyle = "rgba(90,255,150,0.9)"; c.lineWidth = 10; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
}

// =====================================================================
// ESCENA 1 — gancho: cielo, radiotelescopio, pulso con interferencia, congelado
// =====================================================================
const S1 = { senal: 4.6, congela: 7.85 };
function escena1(c, t) {
  const v = t - VO[0];
  const cong = v > S1.congela, tA = cong ? VO[0] + S1.congela : t;
  const cam = { x: 540, y: lerp(-200, 1050, salida(t / 3.2)), z: lerp(1.0, 1.15, suave(tA / 8)) + (cong ? 0.06 * salida((v - S1.congela) / 0.3) : 0) };
  const ps = (tA - VO[0] - S1.senal) / 0.9;
  conCamara(c, cam, [
    [0.2, () => cieloNoche(c, tA)],
    [0.6, () => { campoNoche(c, 1480); }],
    [1, () => {
      antena(c, 560, 1560, 1.15, -0.45, clamp(ps, 0, 1) * (0.8 + 0.2 * Math.sin(t * 30)));
      pulso(c, 1100, -300, 560 + 0, 1560 - 280 * 1.15 - 300 * 1.15 * 0.9, ps);
    }],
  ]);
  vineta(c, 0.55);
  // interferencia cuando llega la señal
  if (v > S1.senal) interferencia(c, Math.max(0, 1 - (v - S1.senal) / 1.2) + (Math.sin(t * 13) > 0.85 ? 0.3 : 0), t);
  if (cong) { const p = v - S1.congela; destello(c, 0.85 - p * 4, "160,240,255"); }
  titulo(c, ["LA SEÑAL QUE", "NADIE EXPLICA 📡👽"], 300, VO[0] + 0.3, t, 118, ["#ffffff", C.senal]);
  destello(c, 1 - t / 0.5, "0,0,0");
  // estática de TV que llena la pantalla al salir
  const fin = (t - (DUR[0] - 0.35)) / 0.35;
  if (fin > 0) { estatica(c, fin, t); destello(c, fin * 0.5, "200,200,200"); }
}

// =====================================================================
// ESCENA 2 — el hallazgo: oficina, papel continuo, 6-E-Q-U-J-5 uno por uno
// =====================================================================
const S2 = { pronto: 4.54, letras: [6.53, 7.70, 8.55, 9.41, 10.10, 11.06] };
const FILA_COD = Math.floor((S2.pronto * 160 + 300) / 56) + 6; // fila del papel donde está 6EQUJ5 (queda centrada)
function escena2(c, t) {
  const v = t - VO[1];
  const lit = S2.letras.filter((x) => v >= x).length;
  const zoom = v > S2.pronto ? 1 + 0.9 * rebote((v - S2.pronto) / 0.5) : lerp(1.0, 1.05, v / 4);
  const desplaz = v < S2.pronto ? v * 160 : S2.pronto * 160 + 300 * salida((v - S2.pronto) / 0.8);
  // el código queda centrado en pantalla
  const cam = v > S2.pronto ? { x: 560, y: 760 + (lit ? 0 : 0), z: zoom } : { x: 540, y: 960, z: zoom };
  conCamara(c, cam, [
    [0.6, () => oficina(c)],
    [1, () => {
      // impresora y papel
      c.fillStyle = "#5a5a66"; redondo(c, 180, 1180, 720, 170, 20); c.fill(); c.fillStyle = "#3a3a44"; c.fillRect(220, 1180, 640, 26);
      papelContinuo(c, 230, 200, 620, 990, desplaz, 3, lit, FILA_COD);
      if (v < S2.pronto) astronomo(c, 960, 1720, 1.0, t, { cabeza: Math.sin(t * 1.5) * 0.06 });
    }],
  ]);
  vineta(c, 0.5);
  if (v > S2.pronto) destello(c, 0.7 - (v - S2.pronto) * 4, "160,240,255");
  if (lit > 0) etiqueta(c, "6EQUJ5".slice(0, lit), 540, 1560, t, VO[1] + S2.letras[0], C.senal, "#0b1030", 110, 0);
  titulo(c, ["UN AVISO EN", "EL PAPEL… 🔢"], 300, VO[1] + 1.1, t, 118, ["#ffffff", C.senal]);
  // estática de entrada
  estatica(c, 1 - t / 0.35, t);
}

// =====================================================================
// ESCENA 3 — el "Wow!": círculo rojo, escritura a mano, sacudida; salida al espacio
// =====================================================================
const S3 = { circulo: 1.36, escribe: 3.53, wow: 5.07 };
function escena3(c, t) {
  const v = t - VO[2];
  const sac = v > S3.wow ? sacudida(v - S3.wow, 26, 7, 38) : 0;
  const sale = (t - (DUR[2] - 0.45)) / 0.45;
  const desplaz = S2.pronto * 160 + 300;
  const filaR = FILA_COD;
  const cam = { x: 600, y: 760, z: lerp(1.9, 1.5, salida(v / 1.2)) * (sale > 0 ? lerp(1, 0.15, entrada(sale)) : 1) };
  c.save(); c.translate(sac, sac * 0.5);
  conCamara(c, cam, [
    [0.6, () => oficina(c)],
    [1, () => {
      c.fillStyle = "#5a5a66"; redondo(c, 180, 1180, 720, 170, 20); c.fill();
      papelContinuo(c, 230, 200, 620, 990, desplaz, 3, 6, filaR);
      // posición del código en el papel (columna 3)
      const cx = 230 + 50 + 3 * 44 + 14, cy0 = 200 + (filaR - Math.floor(desplaz / 56) + 1) * 56 - (desplaz % 56) - 20;
      circuloMano(c, cx, cy0 + 140, 60, 210, (v - S3.circulo) / 1.6);
      escrituraMano(c, "Wow!", cx + 90, cy0 + 120, 120, (v - S3.wow + 0.5) / 0.6);
      astronomo(c, 980, 1760, 1.0, t, { brazo: v > S3.escribe ? 1 : 0.3, lapiz: true, ojos: v > S3.wow ? "sorpresa" : "normal", brilloLentes: v > S3.wow ? 0.5 + 0.5 * Math.sin(t * 20) : 0 });
    }],
  ]);
  c.restore();
  vineta(c, 0.5);
  if (v > S3.wow) { destello(c, 0.6 - (v - S3.wow) * 3, "255,60,60"); titulo(c, ["¡WOW! ✍️"], 360, VO[2] + S3.wow, t, 170, [C.rojoL]); }
  else titulo(c, ["LO ENCERRÓ", "EN UN CÍRCULO 🔴"], 300, VO[2] + S3.circulo, t, 112, ["#ffffff", C.rojoL]);
  // salida: atraviesa el techo hacia el espacio
  if (sale > 0) { destello(c, sale, "4,5,26"); }
}

// =====================================================================
// ESCENA 4 — lo raro: 72 segundos, Sagitario, viaje de la onda, dial 1420 MHz
// =====================================================================
const S4 = { sagitario: 2.62, hidrogeno: 5.68, cientificos: 8.25 };
function escena4(c, t) {
  const v = t - VO[3];
  // fondo de espacio con estrellas que pasan (viaje)
  const viaje = v < S4.sagitario ? 1 : 0.3;
  conCamara(c, { x: 540, y: 960, z: 1 + 0.05 * Math.sin(t * 0.5) }, [[0.3, () => cieloNoche(c, t, 1, 9)]]);
  // estrellas en estela (velocidad)
  const r = rnd(4);
  c.strokeStyle = "rgba(200,220,255,0.6)"; c.lineCap = "round";
  for (let i = 0; i < 70; i++) { const a = r() * 6.283, d0 = r(); const d = ((d0 + t * 0.6 * viaje) % 1); const R = d * d * 1400, L = 30 + d * 160 * viaje; c.lineWidth = 2 + d * 5; c.beginPath(); c.moveTo(540 + Math.cos(a) * R, 960 + Math.sin(a) * R); c.lineTo(540 + Math.cos(a) * (R + L), 960 + Math.sin(a) * (R + L)); c.stroke(); }
  vineta(c, 0.4);
  if (v < S4.sagitario) {
    // cronómetro 0 → 72 en cámara rápida con onda pulsando
    const seg = 72 * salida(v / 2.2);
    cronometro(c, 540, 1050, 260 * resorte(v + 0.1, 8, 14), seg);
    c.strokeStyle = C.senal; c.lineWidth = 8; c.beginPath();
    for (let x = 0; x <= W; x += 8) c.lineTo(x, 1500 + Math.sin(x * 0.03 - t * 12) * 40 * (0.5 + 0.5 * Math.sin(t * 3)));
    c.stroke();
    titulo(c, ["72 SEGUNDOS ⏱️"], 330, VO[3] + 0.05, t, 128, [C.senal]);
  } else if (v < S4.hidrogeno) {
    // Sagitario: constelación que se une, onda que viaja a la Tierra
    const p = (v - S4.sagitario) / 1.6;
    sagitario(c, 280, 820, 1.25, p, t);
    tierra(c, 840, 1700, 150);
    pulso(c, 520, 860, 820, 1560, (v - S4.sagitario - 1.2) / 1.4);
    etiqueta(c, "SAGITARIO ✨", 470, 1180, t, VO[3] + S4.sagitario + 0.3, "#ffffff", "#0b1030", 64, -0.04);
    titulo(c, ["DESDE", "SAGITARIO ✨"], 300, VO[3] + S4.sagitario, t, 120, ["#ffffff", C.senal]);
  } else {
    // dial de radio que gira hasta 1420 MHz y se ilumina
    const p = salida((v - S4.hidrogeno) / 1.6);
    const mhz = lerp(1401, 1420, p) + (p < 1 ? Math.sin(t * 25) * 0.6 * (1 - p) : 0);
    const brillo = p >= 0.99 ? 0.6 + 0.4 * Math.sin(t * 6) : 0;
    dial(c, 540, 1100, 860, mhz, brillo);
    if (v > S4.cientificos) {
      // ondas que salen como "mensajes"
      for (let i = 0; i < 4; i++) { const q = ((t * 0.7 + i / 4) % 1); c.strokeStyle = `rgba(94,240,255,${1 - q})`; c.lineWidth = 8; c.beginPath(); c.arc(540, 1100, 200 + q * 520, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      emoji(c, "👽", 540, 1500, 170, resorte(v - S4.cientificos - 1.6, 8, 14));
    }
    etiqueta(c, "FRECUENCIA DEL HIDRÓGENO", 540, 1330, t, VO[3] + S4.hidrogeno + 1.2, C.ama, "#0b1030", 50, 0);
    titulo(c, ["¿UN MENSAJE? 👽"], 330, VO[3] + S4.cientificos, t, 128, [C.senal]);
  }
  // cortes con destello al cambiar de momento
  for (const tc of [S4.sagitario, S4.hidrogeno]) if (v > tc) destello(c, 0.7 - (v - tc) * 6, "160,240,255");
  // entrada desde el negro del espacio
  destello(c, 1 - t / 0.3, "4,5,26");
  // salida: la onda se aplana
  const fin = (t - (DUR[3] - 0.35)) / 0.35;
  if (fin > 0) { c.fillStyle = `rgba(4,5,26,${fin})`; c.fillRect(0, 0, W, H); c.strokeStyle = C.senal; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 960); c.lineTo(W, 960); c.stroke(); }
}

// =====================================================================
// ESCENA 5 — el silencio: radar, años que pasan, "SIN SEÑAL", teorías tachadas
// =====================================================================
const S5 = { decadas: 2.45, nunca: 4.06, teorias: 6.25, ninguna: 8.6 };
function escena5(c, t) {
  const v = t - VO[4];
  conCamara(c, { x: 540, y: 1000, z: lerp(1.1, 1.0, salida(t / 1.5)) }, [
    [0.25, () => cieloNoche(c, t, 0.7, 13)],
    [0.7, () => campoNoche(c, 1560)],
    [1, () => {
      // varias antenas que giran buscando
      for (const [x, s, f] of [[180, 0.45, 0], [900, 0.5, 1.3], [540, 0.35, 2.1]]) antena(c, x, 1640, s, -0.6 + Math.sin(t * 0.8 + f) * 0.35, 0);
    }],
  ]);
  vineta(c, 0.5);
  // radar con contador de años
  radar(c, 540, 1000, 300, t);
  const anio = v < S5.decadas ? 1977 : Math.min(2026, Math.floor(lerp(1977, 2026, salida((v - S5.decadas) / 2.2))));
  c.font = "700 120px Fredoka"; c.textAlign = "center"; c.fillStyle = "#9affc8"; c.fillText(String(anio), 540, 1460);
  if (Math.sin(t * 6) > -0.2) { c.font = "700 64px Fredoka"; c.fillStyle = "#ff5a6a"; c.fillText("SIN SEÑAL", 540, 1560); }
  c.textAlign = "left";
  if (v > S5.decadas && v < S5.nunca + 0.5) { emoji(c, "⏩", 930, 160, 90, 1 + 0.08 * Math.sin(t * 12)); }
  // teorías que aparecen y se tachan
  if (v > S5.teorias) {
    [["☄️", "COMETA", 300], ["💨", "NUBE DE GAS", 780]].forEach(([e, txt, x], i) => {
      const t0 = S5.teorias + 0.3 + i * 0.6, s = resorte(v - t0, 8, 15);
      emoji(c, e, x, 560, 130, s); etiqueta(c, txt + " ?", x, 700, t, VO[4] + t0 + 0.1, "#ffffff", "#0b1030", 46, 0);
      if (v > S5.ninguna + i * 0.3) { const p = salida((v - S5.ninguna - i * 0.3) / 0.25); c.strokeStyle = C.rojo; c.lineWidth = 22; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 140, 480); c.lineTo(lerp(x - 140, x + 140, p), lerp(480, 740, p)); c.stroke(); }
    });
  }
  titulo(c, ["NUNCA", "VOLVIÓ 🔇"], 300, VO[4] + S5.nunca, t, 130, ["#ffffff", "#ff5a6a"]);
  destello(c, 1 - t / 0.3, "4,5,26");
  // fundido a negro con un último parpadeo
  const fin = (t - (DUR[4] - 0.35)) / 0.35;
  if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); estrellita(c, 760, 420, 40 * Math.sin(fin * Math.PI), 0, "#ffffff"); }
}

// =====================================================================
// ESCENA 6 — cierre: silueta del astrónomo, estrella que parpadea, ¡TU TEORÍA!, SÍGUEME
// =====================================================================
function escena6(c, t) {
  const v = t - VO[5];
  conCamara(c, { x: 540, y: 1150, z: lerp(1.35, 1.0, suave(t / DUR[5])) }, [
    [0.2, () => cieloNoche(c, t, 1, 21)],
    [0.6, () => campoNoche(c, 1500)],
    [1, () => {
      antena(c, 780, 1600, 0.9, -0.55, 0.3 + 0.2 * Math.sin(t * 2));
      // silueta del astrónomo mirando al cielo
      c.save(); c.globalAlpha = 0.97; c.filter = "brightness(0.08)"; astronomo(c, 300, 1720, 0.8, t, { cabeza: -0.25 }); c.restore();
    }],
  ]);
  // la estrella que "responde": parpadea dos veces
  for (const tb of [1.0, 1.45]) { const q = (v - tb) / 0.3; if (q > 0 && q < 1) { estrellita(c, 700, 640, 70 * Math.sin(q * Math.PI), q * 2, C.senal); const g = c.createRadialGradient(700, 640, 5, 700, 640, 260); g.addColorStop(0, `rgba(94,240,255,${0.5 * Math.sin(q * Math.PI)})`); g.addColorStop(1, "rgba(94,240,255,0)"); c.fillStyle = g; c.fillRect(440, 380, 520, 520); } }
  vineta(c, 0.5);
  titulo(c, ["¿TÚ QUÉ CREES", "QUE FUE? 🤔👇"], 300, VO[5] + 0.1, t, 118, ["#ffffff", C.senal]);
  if (v > 1.57) { emoji(c, "💬", 965, 760, 110, resorte(v - 1.57, 8, 15), -0.1); etiqueta(c, "¡TU TEORÍA AQUÍ!", 720, 800, t, VO[5] + 1.65, C.ama, C.tinta, 56, -0.06); }
  if (v > 2.84) {
    const s = resorte(v - 2.84, 7, 14), b = Math.sin(t * 5) * 6;
    c.save(); c.translate(540, 1720 + b); c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.3)"; redondo(c, -230, -60, 460, 130, 65); c.fill();
    c.fillStyle = C.azulFB; redondo(c, -236, -76, 472, 130, 65); c.fill();
    c.font = `700 76px Fredoka, "Noto Color Emoji"`; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SÍGUEME 🔔", 0, 16); c.textAlign = "left";
    c.restore();
    if (v > 3.2) { const p = ((v - 3.2) % 1.2) / 1.2; emoji(c, "👆", 800, 1800 - salida(p) * 40, 110, 1, -0.3, 1 - p * 0.3); }
  }
  destello(c, 1 - t / 0.5, "0,0,0");
  destello(c, (t - (DUR[5] - 0.6)) / 0.6, "0,0,0");
}

const ESC = [escena1, escena2, escena3, escena4, escena5, escena6];

function eventos() {
  const g = (k, s) => INI[k] + VO[k] + s;
  const e = [], add = (t, tipo) => e.push({ t, tipo });
  const titulos = [[g(0, 0.3), 26], [g(1, 1.1), 20], [g(2, S3.circulo), 26], [g(2, S3.wow), 6], [g(3, 0.05), 12], [g(3, S4.sagitario), 15], [g(3, S4.cientificos), 13], [g(4, S5.nunca), 11], [g(5, 0.1), 24]];
  for (const [t0, n] of titulos) for (let i = 0; i < n; i++) add(t0 + i * 0.035, "pop");
  // escena 1
  add(g(0, S1.senal), "estatica"); add(g(0, S1.senal + 0.2), "ping"); add(g(0, S1.congela), "ding"); add(g(0, S1.congela), "flash"); add(INI[1] - 0.35, "estatica");
  // escena 2
  add(g(1, 0.2), "impresora"); add(g(1, S2.pronto), "golpe");
  for (const tl of S2.letras) add(g(1, tl), "clic");
  // escena 3
  add(g(2, S3.circulo), "lapiz"); add(g(2, S3.wow - 0.45), "lapiz"); add(g(2, S3.wow), "golpe"); add(g(2, S3.wow), "flash"); add(INI[3] - 0.45, "whoosh");
  // escena 4
  add(g(3, 0.1), "tic"); for (let i = 1; i < 8; i++) add(g(3, i * 0.28), "tic");
  add(g(3, S4.sagitario), "corte"); add(g(3, S4.sagitario + 0.3), "brillo"); add(g(3, S4.sagitario + 1.2), "ping");
  add(g(3, S4.hidrogeno), "dial"); add(g(3, S4.hidrogeno + 1.6), "ding"); add(g(3, S4.cientificos + 1.6), "pop");
  // escena 5
  for (let i = 0; i < 5; i++) add(g(4, 0.5 + i * 2.1), "ping");
  add(g(4, S5.decadas), "timelapse"); add(g(4, S5.teorias + 0.3), "pop"); add(g(4, S5.teorias + 0.9), "pop");
  add(g(4, S5.ninguna), "error"); add(g(4, S5.ninguna + 0.3), "error");
  // escena 6
  add(g(5, 1.0), "brillo"); add(g(5, 1.45), "brillo"); add(g(5, 1.57), "pop"); add(g(5, 2.84), "boton");
  return e;
}
