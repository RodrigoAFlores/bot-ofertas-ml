// ESCENAS del reel "Easter eggs de GTA 6" (motor de la skill reel-sabias-que). Estilo: neón synthwave.
// Todo es dibujo propio: no usa logos, personajes ni imágenes del juego. El mapa es ilustrativo.

Object.assign(C, {
  neonRosa: "#ff3fa4", neonCian: "#3ff0ff", neonMorado: "#9d4dff", neonNaranja: "#ff9a3c",
  cielo1: "#12052e", cielo2: "#3a0f5e", cielo3: "#a12a7a", cielo4: "#ff6a6a",
  mar: "#123a7a", marC: "#2a6fc2", tierra: "#e8d49a", tierraO: "#c9b070", verde: "#5aa860", verdeO: "#2f6b3a", pantano: "#3d6b4a",
});
const EMOJIS = "🗺️🔍🥚📺🦍🦀🛸👇💬👆🔔❓📍🌴";

// ---------- ciudad de neón ----------
function cieloNeon(c, t) {
  const g = c.createLinearGradient(0, -600, 0, 1300);
  g.addColorStop(0, C.cielo1); g.addColorStop(0.5, C.cielo2); g.addColorStop(0.8, C.cielo3); g.addColorStop(1, C.cielo4);
  c.fillStyle = g; c.fillRect(-2000, -1200, W + 4000, 2600);
  const r = rnd(3);
  for (let i = 0; i < 120; i++) { const a = 0.3 + 0.7 * Math.abs(Math.sin(t * (1 + r()) + i)); c.fillStyle = `rgba(255,255,255,${a * 0.8})`; c.beginPath(); c.arc(r() * 3400 - 1200, r() * 900 - 600, 1 + r() * 2.5, 0, 7); c.fill(); }
  // sol synthwave a rayas
  c.save(); c.translate(540, 1000);
  const sg = c.createLinearGradient(0, -260, 0, 260); sg.addColorStop(0, "#ffe66b"); sg.addColorStop(1, "#ff3fa4");
  c.beginPath(); c.arc(0, 0, 260, 0, 7); c.clip(); c.fillStyle = sg; c.fillRect(-260, -260, 520, 520);
  c.fillStyle = C.cielo3; for (let k = 0; k < 7; k++) c.fillRect(-260, 30 + k * 34, 520, 6 + k * 3);
  c.restore();
}
function skyline(c, t, y0 = 1180, semilla = 5) {
  const r = rnd(semilla);
  for (let i = -10; i < 26; i++) {
    const w = 70 + r() * 90, h = 180 + r() * 420, x = i * 110 + r() * 30 - 400;
    c.fillStyle = "#1a0a33"; c.fillRect(x, y0 - h, w, h + 400);
    if (r() > 0.6) { c.fillStyle = r() > 0.5 ? C.neonRosa : C.neonCian; c.fillRect(x, y0 - h, w, 6); }
    for (let yy = y0 - h + 24; yy < y0 - 10; yy += 34) for (let xx = x + 12; xx < x + w - 14; xx += 26) {
      if (r() > 0.55) { const on = Math.sin(t * 0.7 + xx * 0.13 + yy) > -0.6; c.fillStyle = on ? (r() > 0.5 ? "rgba(255,120,200,0.85)" : "rgba(120,240,255,0.8)") : "rgba(60,30,90,0.8)"; c.fillRect(xx, yy, 12, 16); }
    }
  }
}
function palmera(c, x, y, s, t, col = "#0d0420") {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = col; c.lineWidth = 26; c.lineCap = "round";
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(30, -260, -10, -520); c.stroke();
  c.translate(-10, -520); c.fillStyle = col;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.48 + Math.sin(t * 1.5 + i) * 0.05;
    c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(130, -40, 240, 40); c.quadraticCurveTo(130, 10, 0, 18); c.fill(); c.restore();
  }
  c.restore();
}
function calleNeon(c, t, y0 = 1320) {
  const g = c.createLinearGradient(0, y0, 0, y0 + 700); g.addColorStop(0, "#2a0f4a"); g.addColorStop(1, "#0a0318");
  c.fillStyle = g; c.fillRect(-2000, y0, W + 4000, 1400);
  // reflejos y líneas de la calle
  c.strokeStyle = "rgba(255,63,164,0.6)"; c.lineWidth = 6; c.beginPath(); c.moveTo(-2000, y0 + 4); c.lineTo(W + 2000, y0 + 4); c.stroke();
  c.fillStyle = "rgba(255,230,107,0.7)"; for (let x = ((-t * 600) % 220) - 220; x < W + 200; x += 220) c.fillRect(x, y0 + 170, 110, 10);
  // autos como estelas de luz
  for (let i = 0; i < 6; i++) {
    const dir = i % 2 ? 1 : -1, v = 700 + i * 90, x = (((t * v * dir + i * 523) % 2400) + 2400) % 2400 - 700, y = y0 + 80 + (i % 3) * 70;
    c.strokeStyle = dir > 0 ? "rgba(255,80,80,0.85)" : "rgba(255,250,220,0.9)"; c.lineWidth = 10;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - dir * 260, y); c.stroke();
  }
}
function signoPregunta(c, x, y, s, alfa = 1, col = C.neonCian) {
  c.save(); c.globalAlpha = alfa; c.font = `700 ${120 * s}px Fredoka`; c.textAlign = "center"; c.shadowColor = col; c.shadowBlur = 30 * s; c.fillStyle = col; c.fillText("?", x, y); c.shadowBlur = 0; c.textAlign = "left"; c.restore();
}
function lupa(c, x, y, r, rot = 0.6) {
  c.save(); c.translate(x, y);
  c.strokeStyle = "#ffffff"; c.lineWidth = 22; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke();
  c.fillStyle = "rgba(160,240,255,0.15)"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.rotate(rot); c.fillStyle = "#ff3fa4"; redondo(c, r + 4, -20, 190, 40, 20); c.fill();
  c.restore();
}

// ---------- mapa ilustrativo de Leonida ----------
// contorno tipo península (coordenadas en un lienzo de 1000x1300 que se escala)
const PENINSULA = [[120, 120], [520, 90], [760, 140], [820, 260], [790, 420], [840, 600], [880, 780], [860, 930], [790, 1060], [720, 1120], [650, 1090], [600, 980], [520, 900], [460, 800], [420, 650], [360, 520], [250, 420], [110, 330], [60, 220]];
const CAYOS = [[700, 1170, 40], [610, 1210, 32], [520, 1235, 28], [430, 1250, 24], [345, 1255, 20]];
const ZONAS = {
  vice: { x: 800, y: 1000, nombre: "VICE CITY", col: C.neonRosa },
  cayos: { x: 520, y: 1200, nombre: "LOS CAYOS", col: C.neonCian },
  grass: { x: 560, y: 980, nombre: "GRASSRIVERS", col: "#6fe06f" },
  norte: { x: 470, y: 230, nombre: "MONTAÑAS DEL NORTE", col: "#ffd23a" },
};
const PINES = {
  torre: { x: 760, y: 760, emoji: "🥚" }, dexter: { x: 840, y: 905, emoji: "📺" },
  skunk: { x: 630, y: 760, emoji: "🦍" }, cangrejo: { x: 560, y: 860, emoji: "🦀" }, ovni: { x: 200, y: 260, emoji: "🛸" },
};
function mapaLeonida(c, x, y, s, t, opc = {}) {
  c.save(); c.translate(x, y); c.scale(s, s); c.translate(-500, -650);
  // mar con ondas
  const M = opc.marGrande ? 1500 : 0; // mar que llena toda la pantalla en el mapa principal
  c.fillStyle = "#0e2b5e"; if (M) c.fillRect(-M, -M, 1000 + 2 * M, 1300 + 2 * M); else { redondo(c, -40, -40, 1080, 1380, 60); c.fill(); }
  c.strokeStyle = "rgba(120,200,255,0.25)"; c.lineWidth = 4;
  for (let yy = -M; yy < 1300 + M; yy += 60) { c.beginPath(); for (let xx = -20 - M; xx < 1040 + M; xx += 20) c.lineTo(xx, yy + Math.sin(xx * 0.03 + t * 2 + yy) * 6); c.stroke(); }
  // tierra
  c.fillStyle = C.tierra; c.beginPath(); PENINSULA.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill();
  c.strokeStyle = C.tierraO; c.lineWidth = 10; c.stroke();
  for (const [cx, cy, r] of CAYOS) { c.fillStyle = C.tierra; c.beginPath(); c.ellipse(cx, cy, r, r * 0.6, 0, 0, 7); c.fill(); }
  // zonas (se revelan una a una)
  const z = opc.zonas || {};
  if (z.grass) { c.globalAlpha = z.grass; c.fillStyle = C.pantano; c.beginPath(); c.ellipse(640, 840, 130, 170, 0.2, 0, 7); c.fill(); c.fillStyle = "#4f8f5f"; c.beginPath(); c.ellipse(600, 780, 40, 28, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
  if (z.norte) { c.globalAlpha = z.norte; for (const [mx, my, ms] of [[420, 260, 1], [520, 230, 1.2], [610, 270, 0.9]]) { c.fillStyle = "#8a7a5a"; c.beginPath(); c.moveTo(mx - 70 * ms, my + 40); c.lineTo(mx, my - 70 * ms); c.lineTo(mx + 70 * ms, my + 40); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(mx - 20 * ms, my - 40 * ms); c.lineTo(mx, my - 70 * ms); c.lineTo(mx + 20 * ms, my - 40 * ms); c.fill(); } c.globalAlpha = 1; }
  if (z.vice) { c.globalAlpha = z.vice; for (let i = 0; i < 10; i++) { const bx = 760 + (i % 4) * 22, bh = 30 + (i * 37) % 60; c.fillStyle = i % 2 ? C.neonRosa : C.neonCian; c.fillRect(bx, 900 - bh - Math.floor(i / 4) * 10, 16, bh); } c.globalAlpha = 1; }
  // palmeritas decorativas
  for (const [px, py] of [[300, 400], [700, 600], [460, 1000]]) palmera(c, px, py, 0.12, t, C.verdeO);
  // etiquetas de zonas
  for (const k of Object.keys(ZONAS)) {
    const a = z[k] || 0; if (a <= 0) continue;
    const Z = ZONAS[k]; c.save(); c.globalAlpha = a; c.font = "700 46px Fredoka"; const w = c.measureText(Z.nombre).width;
    c.fillStyle = "rgba(10,5,30,0.85)"; redondo(c, Z.x - w / 2 - 22, Z.y - 44, w + 44, 64, 32); c.fill();
    c.fillStyle = Z.col; c.textAlign = "center"; c.fillText(Z.nombre, Z.x, Z.y + 4); c.textAlign = "left"; c.restore();
  }
  // pines
  for (const [k, p] of Object.entries(opc.pines || {})) {
    if (p <= 0) continue; const P = PINES[k], caida = (1 - salida(p)) * -220, s2 = resorte(p * 0.8, 8, 14);
    c.save(); c.translate(P.x, P.y + caida);
    c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.ellipse(0, 6, 26, 9, 0, 0, 7); c.fill();
    c.scale(s2, s2);
    const brilla = opc.brilla === k ? 1 + 0.15 * Math.sin(t * 10) : 1; c.scale(brilla, brilla);
    c.fillStyle = C.neonRosa; c.beginPath(); c.arc(0, -70, 46, Math.PI * 0.85, Math.PI * 0.15); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(0, -72, 32, 0, 7); c.fill();
    c.font = '40px "Noto Color Emoji"'; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(P.emoji, 0, -70); c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.restore();
  }
  // "?" por explorar
  if (opc.preguntas) { const r = rnd(17); for (let i = 0; i < 14; i++) { const px = 180 + r() * 640, py = 180 + r() * 900, ap = clamp((opc.preguntas - i * 0.15) * 2, 0, 1); if (ap > 0) signoPregunta(c, px, py, 0.45 * ap, 0.5 + 0.5 * Math.sin(t * 4 + i)); } }
  c.font = "700 30px Fredoka"; c.fillStyle = "rgba(255,255,255,0.6)"; c.fillText("MAPA ILUSTRATIVO", 40, 1290);
  c.restore();
}
// mini-mapa en la esquina con el pin del secreto actual
function miniMapa(c, pin, t, aparece) {
  if (aparece <= 0) return;
  const s = 0.24 * resorte(aparece, 8, 15);
  c.save(); c.shadowColor = "rgba(0,0,0,0.5)"; c.shadowBlur = 30; mapaLeonida(c, 880, 1560, s, t, { pines: { [pin]: 1 }, brilla: pin }); c.restore();
}

// ---------- lugares de los secretos ----------
function torreRadio(c, x, y0, alto, t) {
  c.strokeStyle = "#c9c2e0"; c.lineWidth = 10;
  const base = 120, tope = 20;
  c.beginPath(); c.moveTo(x - base, y0); c.lineTo(x - tope, y0 - alto); c.moveTo(x + base, y0); c.lineTo(x + tope, y0 - alto); c.stroke();
  c.lineWidth = 6; for (let k = 0; k < 14; k++) { const yy = y0 - (alto * k) / 14, yy2 = y0 - (alto * (k + 1)) / 14, w1 = lerp(base, tope, k / 14), w2 = lerp(base, tope, (k + 1) / 14); c.beginPath(); c.moveTo(x - w1, yy); c.lineTo(x + w2, yy2); c.moveTo(x + w1, yy); c.lineTo(x - w2, yy2); c.moveTo(x - w1, yy); c.lineTo(x + w1, yy); c.stroke(); }
  // luz roja que parpadea
  const on = Math.sin(t * 5) > 0; c.fillStyle = on ? "#ff3030" : "#601010"; c.beginPath(); c.arc(x, y0 - alto - 30, 16, 0, 7); c.fill();
  if (on) { const g = c.createRadialGradient(x, y0 - alto - 30, 4, x, y0 - alto - 30, 90); g.addColorStop(0, "rgba(255,60,60,0.6)"); g.addColorStop(1, "rgba(255,60,60,0)"); c.fillStyle = g; c.fillRect(x - 90, y0 - alto - 120, 180, 180); }
}
function nidoHuevos(c, x, y, s, t, brillo = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = "#8a5a2a"; c.lineWidth = 9; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(0, 10, 110 - (i % 4) * 6, Math.PI * (0.05 + (i % 3) * 0.02), Math.PI * (0.95 - (i % 2) * 0.03)); c.stroke(); }
  const cols = ["#ff7ac0", "#7ad8ff", "#ffe066", "#9dff8a", "#c79bff"];
  cols.forEach((col, i) => {
    const ex = -80 + i * 40, ey = 0 - (i % 2) * 14;
    c.save(); c.translate(ex, ey); c.rotate((i - 2) * 0.15);
    c.fillStyle = col; c.beginPath(); c.ellipse(0, 0, 26, 34, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 5; c.beginPath(); c.moveTo(-22, -4); c.quadraticCurveTo(0, 8, 22, -4); c.stroke();
    c.restore();
  });
  c.fillStyle = "#8a5a2a"; c.beginPath(); c.ellipse(0, 26, 120, 30, 0, 0, Math.PI); c.fill();
  if (brillo) estrellita(c, 0, -30, 60 * brillo, t * 2, "#fff6c0");
  c.restore();
}
function edificioDeco(c, x, y, t, ventanaOn = 0) {
  // edificio art déco de playa, de noche
  c.fillStyle = "#e9d8f5"; c.fillRect(x - 300, y - 900, 600, 900);
  c.fillStyle = "#cbb6e6"; c.fillRect(x - 300, y - 900, 600, 40); c.fillRect(x - 60, y - 1000, 120, 120);
  c.fillStyle = C.neonCian; c.fillRect(x - 300, y - 640, 600, 10); c.fillStyle = C.neonRosa; c.fillRect(x - 300, y - 340, 600, 10);
  for (let fila = 0; fila < 3; fila++) for (let col = 0; col < 4; col++) {
    const wx = x - 240 + col * 130, wy = y - 830 + fila * 300, encendida = fila === 1 && col === 2;
    c.fillStyle = encendida ? `rgba(255,220,140,${0.25 + 0.75 * ventanaOn})` : "#3a2a5a"; c.fillRect(wx, wy, 90, 160);
    if (encendida && ventanaOn > 0.5) { c.fillStyle = "rgba(20,10,20,0.95)"; c.beginPath(); c.arc(wx + 45, wy + 70, 22, 0, 7); c.fill(); c.fillRect(wx + 18, wy + 92, 54, 68); }
  }
}
function pantanoFondo(c, t) {
  const g = c.createLinearGradient(0, -400, 0, 1600); g.addColorStop(0, "#0d1f1a"); g.addColorStop(0.6, "#1f3d30"); g.addColorStop(1, "#2a4a3a");
  c.fillStyle = g; c.fillRect(-2000, -1000, W + 4000, 3500);
  c.fillStyle = "rgba(220,255,230,0.9)"; c.beginPath(); c.arc(780, 300, 80, 0, 7); c.fill();
  for (const [x, s] of [[-50, 1.3], [150, 0.9], [420, 1.1], [760, 1.0], [1000, 1.4]]) { c.fillStyle = "#081510"; c.fillRect(x - 18 * s, 500, 36 * s, 1000); c.beginPath(); c.ellipse(x, 480, 180 * s, 90 * s, 0, 0, 7); c.fill(); for (let k = 0; k < 6; k++) c.fillRect(x - 120 * s + k * 45 * s, 520, 6, 120 + (k % 3) * 40); }
  c.fillStyle = "#16302a"; c.fillRect(-2000, 1380, W + 4000, 1000);
  c.strokeStyle = "rgba(150,220,180,0.25)"; c.lineWidth = 4; for (let i = 0; i < 12; i++) { const y = 1420 + i * 40; c.beginPath(); c.moveTo(-100 + Math.sin(t + i) * 30, y); c.lineTo(W + 100, y); c.stroke(); }
}
function niebla(c, t, a = 0.5) {
  for (let i = 0; i < 6; i++) { const x = ((t * 40 + i * 300) % 1800) - 400, y = 1100 + (i % 3) * 140; const g = c.createRadialGradient(x, y, 20, x, y, 420); g.addColorStop(0, `rgba(200,240,220,${a * 0.35})`); g.addColorStop(1, "rgba(200,240,220,0)"); c.fillStyle = g; c.fillRect(x - 420, y - 420, 840, 840); }
}
function skunkApe(c, x, y, s, t, anda = 1) {
  const p = Math.sin(t * 5) * anda;
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = "#0a0a08";
  c.beginPath(); c.ellipse(0, -300, 110, 170, 0.05, 0, 7); c.fill();                // cuerpo
  c.beginPath(); c.arc(20, -500, 70, 0, 7); c.fill();                                // cabeza
  c.save(); c.translate(-80, -380); c.rotate(0.3 + p * 0.3); c.fillRect(-25, 0, 50, 260); c.restore();   // brazos largos
  c.save(); c.translate(90, -380); c.rotate(-0.2 - p * 0.3); c.fillRect(-25, 0, 50, 260); c.restore();
  c.save(); c.translate(-40, -160); c.rotate(p * 0.35); c.fillRect(-30, 0, 60, 170); c.restore();       // piernas
  c.save(); c.translate(50, -160); c.rotate(-p * 0.35); c.fillRect(-30, 0, 60, 170); c.restore();
  c.fillStyle = "rgba(255,80,60,0.9)"; c.beginPath(); c.arc(50, -510, 7, 0, 7); c.fill();               // ojo que brilla
  c.restore();
}
function estacion(c, t) {
  pantanoFondo(c, t);
  c.fillStyle = "#4a4a52"; c.fillRect(180, 900, 720, 480); c.fillStyle = "#38383f"; c.beginPath(); c.moveTo(150, 900); c.lineTo(540, 720); c.lineTo(930, 900); c.fill();
  c.fillStyle = "#8a4a2a"; for (let i = 0; i < 9; i++) c.fillRect(200 + i * 78, 980 + (i % 3) * 20, 30, 14); // óxido
  c.fillStyle = "#1a1a1f"; c.fillRect(260, 1000, 140, 180); c.fillRect(680, 1000, 140, 180); c.fillRect(470, 1120, 140, 260);
  c.font = "700 40px Fredoka"; c.fillStyle = "rgba(255,255,255,0.5)"; c.fillText("RESEARCH STATION", 345, 950);
  c.strokeStyle = "#5a5a60"; c.lineWidth = 12; c.beginPath(); c.moveTo(860, 900); c.lineTo(860, 640); c.stroke(); c.beginPath(); c.arc(860, 620, 30, 0, 7); c.stroke();
}
function cangrejo(c, x, y, s, t, abre = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const p = Math.sin(t * 6) * 0.1;
  c.strokeStyle = "#c2301e"; c.lineWidth = 26; c.lineCap = "round";
  for (const lado of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(lado * 120, 20 + k * 30); c.lineTo(lado * (220 + k * 20), 60 + k * 40 + p * 100 * lado); c.lineTo(lado * (260 + k * 20), 160 + k * 30); c.stroke(); }
  // pinzas
  for (const lado of [-1, 1]) {
    c.save(); c.translate(lado * 150, -40); c.rotate(lado * (-0.6 - abre * 0.3));
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -140); c.stroke();
    c.fillStyle = "#e0432c"; c.beginPath(); c.ellipse(0, -200, 70, 90, 0, 0, 7); c.fill();
    c.fillStyle = "#16302a"; c.beginPath(); c.moveTo(0, -200); c.lineTo(-30 - abre * 30, -300); c.lineTo(30 + abre * 30, -300); c.fill();
    c.restore();
  }
  c.fillStyle = "#e0432c"; c.beginPath(); c.ellipse(0, 40, 200, 120, 0, 0, 7); c.fill();
  c.fillStyle = "#ff7a5a"; c.beginPath(); c.ellipse(-40, 10, 90, 30, -0.2, 0, 7); c.fill();
  for (const ox of [-50, 50]) { c.strokeStyle = "#c2301e"; c.lineWidth = 12; c.beginPath(); c.moveTo(ox, -50); c.lineTo(ox, -110); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.arc(ox, -120, 22, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(ox + 4, -118, 11, 0, 7); c.fill(); }
  c.restore();
}
function caminoNoche(c, t) {
  const g = c.createLinearGradient(0, -500, 0, 1400); g.addColorStop(0, "#05031a"); g.addColorStop(1, "#1a1040");
  c.fillStyle = g; c.fillRect(-2000, -1000, W + 4000, 3500);
  const r = rnd(8); for (let i = 0; i < 150; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t + i))})`; c.beginPath(); c.arc(r() * 3200 - 1000, r() * 1200 - 400, 1 + r() * 2, 0, 7); c.fill(); }
  c.fillStyle = "#0a0820"; c.beginPath(); c.moveTo(-2000, 1250); for (let x = -2000; x < W + 2000; x += 60) c.lineTo(x, 1200 + Math.sin(x * 0.004) * 50); c.lineTo(W + 2000, 2500); c.lineTo(-2000, 2500); c.fill();
  c.fillStyle = "#3a2a20"; c.fillRect(-2000, 1450, W + 4000, 160);
  c.fillStyle = "rgba(255,255,255,0.08)"; for (let x = ((t * 400) % 300) - 300; x < W + 300; x += 300) c.fillRect(x, 1520, 120, 8);
}
function autoNoche(c, x, y, s, t) {
  c.save(); c.translate(x, y + Math.sin(t * 20) * 2); c.scale(s, s);
  // haz de los faros
  const g = c.createLinearGradient(160, 0, 700, 0); g.addColorStop(0, "rgba(255,250,200,0.55)"); g.addColorStop(1, "rgba(255,250,200,0)");
  c.fillStyle = g; c.beginPath(); c.moveTo(170, -40); c.lineTo(720, -120); c.lineTo(720, 60); c.lineTo(170, -10); c.fill();
  c.fillStyle = "#1c1430"; redondo(c, -200, -80, 380, 90, 30); c.fill(); c.beginPath(); c.moveTo(-120, -80); c.lineTo(-60, -140); c.lineTo(80, -140); c.lineTo(130, -80); c.fill();
  c.fillStyle = "rgba(120,200,255,0.35)"; c.beginPath(); c.moveTo(-100, -84); c.lineTo(-55, -130); c.lineTo(70, -130); c.lineTo(110, -84); c.fill();
  c.fillStyle = "#fff6c0"; c.beginPath(); c.arc(175, -45, 12, 0, 7); c.fill(); c.fillStyle = "#ff3030"; c.fillRect(-205, -60, 10, 18);
  for (const wx of [-120, 110]) { c.fillStyle = "#050308"; c.beginPath(); c.arc(wx, 10, 40, 0, 7); c.fill(); c.strokeStyle = "#555"; c.lineWidth = 6; c.save(); c.translate(wx, 10); c.rotate(t * 20); c.beginPath(); c.moveTo(-25, 0); c.lineTo(25, 0); c.stroke(); c.restore(); }
  c.restore();
}
function ovni(c, x, y, s, t, haz = 0) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (haz > 0) { const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, `rgba(120,255,140,${0.55 * haz})`); g.addColorStop(1, "rgba(120,255,140,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(-60, 20); c.lineTo(60, 20); c.lineTo(260, 900); c.lineTo(-260, 900); c.fill(); }
  c.fillStyle = "rgba(160,255,200,0.55)"; c.beginPath(); c.ellipse(0, -40, 80, 60, 0, Math.PI, 0); c.fill();
  const g2 = c.createLinearGradient(0, -30, 0, 40); g2.addColorStop(0, "#d8dde8"); g2.addColorStop(1, "#6a7088");
  c.fillStyle = g2; c.beginPath(); c.ellipse(0, 0, 220, 50, 0, 0, 7); c.fill();
  for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * 6; c.fillStyle = Math.sin(a) > 0 ? "#7affb0" : "#ff7ae0"; c.beginPath(); c.arc(-150 + i * 50, 8, 10, 0, 7); c.fill(); }
  c.restore();
}

// =====================================================================
// ESCENA 1 — gancho: ciudad de neón, la lupa revela "?", congelado en "más de una docena"
// =====================================================================
const S1 = { docena: 5.25 };
function escena1(c, t) {
  const v = t - VO[0], cong = v > S1.docena, tA = cong ? VO[0] + S1.docena : t;
  const cam = { x: 540, y: lerp(700, 1000, salida(t / 2.5)), z: lerp(1.15, 1.0, salida(t / 2.5)) + (cong ? 0.06 * salida((v - S1.docena) / 0.3) : 0) };
  const lx = 540 + Math.sin(tA * 1.3) * 300, ly = 900 + Math.cos(tA * 0.9) * 280;
  conCamara(c, cam, [
    [0.25, () => cieloNeon(c, tA)],
    [0.6, () => skyline(c, tA)],
    [1, () => {
      calleNeon(c, tA);
      for (const [px, s] of [[60, 1.0], [1010, 1.1], [860, 0.7]]) palmera(c, px, 1330, s, tA);
      // signos "?" escondidos que aparecen cuando pasa la lupa cerca (y quedan)
      const r = rnd(12);
      for (let i = 0; i < 12; i++) { const qx = 100 + r() * 880, qy = 500 + r() * 800, cerca = Math.hypot(qx - lx, qy - ly) < 260 || tA > VO[0] + 3 + i * 0.12; if (cerca) signoPregunta(c, qx, qy, 0.6 + 0.2 * Math.sin(tA * 3 + i)); }
    }],
  ]);
  if (!cong) lupa(c, lx, ly, 150);
  vineta(c, 0.45);
  if (cong) {
    const p = v - S1.docena; destello(c, 0.8 - p * 4, "255,120,220");
    c.save(); c.translate(540, 1200); const s = resorte(p, 7, 14); c.scale(s, s);
    c.font = "700 260px Fredoka"; c.textAlign = "center"; c.lineJoin = "round"; c.strokeStyle = "#16203a"; c.lineWidth = 34; c.strokeText("12+", 0, 0);
    c.shadowColor = C.neonRosa; c.shadowBlur = 40; c.fillStyle = "#ffffff"; c.fillText("12+", 0, 0); c.shadowBlur = 0; c.textAlign = "left"; c.restore();
  }
  titulo(c, ["SECRETOS OCULTOS", "EN GTA 6 🗺️🔍"], 300, VO[0] + 0.2, t, 118, ["#ffffff", C.neonCian]);
  destello(c, 1 - t / 0.4, "0,0,0");
  // salida: sube al cielo
  const fin = (t - (DUR[0] - 0.35)) / 0.35; if (fin > 0) destello(c, fin, "14,43,94");
}

// =====================================================================
// ESCENA 2 — el mapa: zonas que aparecen al nombrarlas, 5 pines que caen
// =====================================================================
const S2 = { vice: 2.75, cayos: 3.6, grass: 4.9, norte: 6.3, pines: 9.56 };
function escena2(c, t) {
  const v = t - VO[1];
  const z = {};
  for (const k of ["vice", "cayos", "grass", "norte"]) z[k] = clamp((v - S2[k]) / 0.3, 0, 1);
  const pines = {}; Object.keys(PINES).forEach((k, i) => (pines[k] = clamp((v - S2.pines - i * 0.12) / 0.5, 0, 1)));
  // la cámara viaja a cada zona cuando se nombra (coordenadas del mapa → mundo: +40, +430)
  const focos = [["vice", 1.4], ["cayos", 1.4], ["grass", 1.4], ["norte", 1.4]];
  let cs = { x: 540, y: 1080, z: 1.0 };
  for (const [k, zz] of focos) { const p = suave((v - (S2[k] - 0.25)) / 0.5); if (p > 0) { const Z = ZONAS[k]; cs = { x: lerp(cs.x, 40 + Z.x, p), y: lerp(cs.y, 430 + Z.y, p), z: lerp(cs.z, zz, p) }; } }
  const vuelve = suave((v - 7.6) / 0.8); cs = { x: lerp(cs.x, 540, vuelve), y: lerp(cs.y, 1080, vuelve), z: lerp(cs.z, 1.0, vuelve) };
  c.fillStyle = "#08142e"; c.fillRect(0, 0, W, H);
  conCamara(c, cs, [[1, () => mapaLeonida(c, 540, 1080, 1.0, t, { zonas: z, pines, marGrande: true })]]);
  vineta(c, 0.45);
  titulo(c, ["EL MAPA", "DE LEONIDA 🌴"], 300, VO[1] + 0.1, t, 118, ["#ffffff", C.neonRosa]);
  destello(c, 1 - t / 0.35, "14,43,94");
  const fin = (t - (DUR[1] - 0.3)) / 0.3; if (fin > 0) destello(c, fin, "255,255,255");
}

// =====================================================================
// ESCENA 3 — #1 nido en la torre de radio (Vice-Dale) y #2 departamento de Dexter (Washington Island)
// =====================================================================
const S3 = { nido: 4.7, literales: 6.68, dexter: 8.79, ventana: 11.2 };
function escena3(c, t) {
  const v = t - VO[2];
  if (v < S3.dexter) {
    // la cámara sube por la torre hasta el nido
    const sube = salida(v / 4.6);
    const cam = { x: 540, y: lerp(1500, 520, sube), z: v > S3.nido ? lerp(1.0, 1.4, salida((v - S3.nido) / 1.2)) : 1.0 };
    conCamara(c, cam, [
      [0.3, () => cieloNeon(c, t)],
      [0.6, () => skyline(c, t, 1600, 9)],
      [1, () => { torreRadio(c, 540, 1900, 1500, t); nidoHuevos(c, 540, 380, 1.0, t, v > S3.literales ? 0.6 + 0.4 * Math.sin(t * 8) : 0); }],
    ]);
    vineta(c, 0.45);
    titulo(c, ["#1 HUEVOS", "DE PASCUA 🥚"], 300, VO[2] + 0.2, t, 120, ["#ffffff", C.neonCian]);
    etiqueta(c, "TORRE DE RADIO · VICE-DALE", 540, 1720, t, VO[2] + 1.0, "#ffffff", "#1a0a33", 46, 0);
    if (v > S3.literales) etiqueta(c, "¡LITERALES! 🥚", 760, 1180, t, VO[2] + S3.literales, C.ama, "#1a0a33", 64, 0.06);
    miniMapa(c, "torre", t, v - 0.6);
  } else {
    const td = v - S3.dexter;
    const cam = { x: 540, y: 1000, z: lerp(1.0, 1.25, salida(td / 3)) };
    conCamara(c, cam, [
      [0.25, () => cieloNeon(c, t)],
      [1, () => { calleNeon(c, t, 1500); edificioDeco(c, 540, 1500, t, clamp((v - S3.ventana) / 0.4, 0, 1)); palmera(c, 120, 1510, 1.1, t); palmera(c, 980, 1510, 1.0, t); }],
    ]);
    vineta(c, 0.5);
    titulo(c, ["#2 EL DEPA", "DE DEXTER 📺"], 300, VO[2] + S3.dexter + 0.1, t, 120, ["#ffffff", C.neonRosa]);
    etiqueta(c, "WASHINGTON ISLAND · VICE CITY", 540, 1720, t, VO[2] + S3.dexter + 0.4, "#ffffff", "#1a0a33", 44, 0);
    miniMapa(c, "dexter", t, td - 0.3);
    destello(c, 1 - td / 0.1, "255,255,255");
  }
  destello(c, 1 - t / 0.3, "255,255,255");
  const fin = (t - (DUR[2] - 0.35)) / 0.35;
  if (fin > 0) { c.save(); c.translate(-fin * W, 0); c.restore(); destello(c, fin, "8,20,16"); }
}

// =====================================================================
// ESCENA 4 — #3 Skunk Ape (Grassrivers) y #4 cangrejo gigante (Gullet Marsh)
// =====================================================================
const S4 = { ape: 4.6, cangrejo: 7.98, aparece: 11.56 };
function escena4(c, t) {
  const v = t - VO[3];
  if (v < S4.cangrejo) {
    const congela = v > S4.ape && v < S4.ape + 1.6, tA = congela ? VO[3] + S4.ape : t;
    const ax = lerp(-250, 1300, (tA - VO[3] - 1.2) / 6.0);
    conCamara(c, { x: 540 + Math.sin(t * 0.4) * 40, y: 1050, z: congela ? 1.15 : 1.0 }, [
      [0.4, () => pantanoFondo(c, tA)],
      [1, () => { skunkApe(c, ax, 1430, 1.05, tA, congela ? 0 : 1); niebla(c, tA, 0.7); }],
    ]);
    vineta(c, 0.55);
    if (congela) { destello(c, 0.7 - (v - S4.ape) * 4); etiqueta(c, "¿LO VISTE? 👀", 540, 1650, t, VO[3] + S4.ape + 0.05, C.ama, "#1a0a33", 70, -0.04); }
    titulo(c, ["#3 SKUNK APE 🦍"], 300, VO[3] + 3.4, t, 122, ["#6fe06f"]);
    etiqueta(c, "LAGO COTTONMOUTH · GRASSRIVERS", 540, 1780, t, VO[3] + 0.5, "#ffffff", "#0a1a14", 42, 0);
    miniMapa(c, "skunk", t, v - 0.8);
  } else {
    const tc = v - S4.cangrejo, sale = clamp((v - S4.aparece) / 0.6, 0, 1);
    const sac = v > S4.aparece ? sacudida(v - S4.aparece, 30, 7, 30) : 0;
    c.save(); c.translate(sac, sac * 0.6);
    conCamara(c, { x: 540, y: 1100, z: lerp(1.25, 1.0, salida(tc / 2)) }, [[1, () => { estacion(c, t); cangrejo(c, 540, lerp(1650, 1330, salida(sale)), 1.2, t, sale * (0.5 + 0.5 * Math.sin(t * 8))); niebla(c, t, 0.4); }]]);
    c.restore();
    vineta(c, 0.55);
    titulo(c, ["#4 CANGREJO", "GIGANTE 🦀"], 300, VO[3] + S4.cangrejo + 0.1, t, 122, ["#ffffff", "#ff7a5a"]);
    etiqueta(c, "ESTACIÓN ABANDONADA · GULLET MARSH", 540, 1780, t, VO[3] + S4.cangrejo + 0.4, "#ffffff", "#0a1a14", 40, 0);
    miniMapa(c, "cangrejo", t, tc - 0.3);
    destello(c, 1 - tc / 0.1, "255,255,255");
  }
  destello(c, 1 - t / 0.35, "8,20,16");
  const fin = (t - (DUR[3] - 0.35)) / 0.35; if (fin > 0) destello(c, fin, "5,3,26");
}

// =====================================================================
// ESCENA 5 — #5 OVNI de noche cerca de Port Gellhorn
// =====================================================================
const S5 = { ovni: 4.73 };
function escena5(c, t) {
  const v = t - VO[4], to = v - S5.ovni;
  const sac = to > 0 ? sacudida(to, 16, 5, 30) : 0;
  c.save(); c.translate(sac, 0);
  conCamara(c, { x: 540, y: 1150, z: to > 0 ? lerp(1.0, 1.12, salida(to / 1)) : 1.0 }, [
    [0.3, () => caminoNoche(c, t)],
    [1, () => {
      const ux = to > 0 ? lerp(-300, 1500, entrada((to - 0.2) / 1.6)) : -500;
      if (to > 0) ovni(c, to < 0.2 ? 540 : ux < 540 ? 540 : ux, lerp(-200, 760, salida(to / 0.5)) - (to > 0.6 ? (to - 0.6) * 300 : 0), 1.2, t, to < 1.2 ? 1 - to / 1.2 : 0);
      autoNoche(c, 420, 1490, 1.25, t);
    }],
  ]);
  c.restore();
  vineta(c, 0.5);
  if (to > 0) { interferenciaRadio(c, Math.max(0, 1 - to / 1.0), t); destello(c, 0.6 - to * 3, "120,255,140"); }
  titulo(c, ["#5 ¿UN OVNI? 🛸"], 330, VO[4] + S5.ovni + 0.05, t, 128, ["#7affb0"]);
  etiqueta(c, "DE NOCHE · CERCA DE PORT GELLHORN", 540, 1780, t, VO[4] + 1.4, "#ffffff", "#1a0a33", 42, 0);
  miniMapa(c, "ovni", t, v - 1.0);
  destello(c, 1 - t / 0.35, "5,3,26");
  const fin = (t - (DUR[4] - 0.35)) / 0.35; if (fin > 0) destello(c, fin, "8,20,46");
}
function interferenciaRadio(c, f, t) {
  if (f <= 0) return; const r = rnd(Math.floor(t * 30));
  for (let i = 0; i < 8 * f; i++) { const y = r() * H, h = 10 + r() * 60; c.drawImage(c.canvas, 0, y, W, h, (r() - 0.5) * 120 * f, y, W, h); }
  c.fillStyle = `rgba(120,255,140,${0.12 * f})`; for (let y = (t * 200) % 10; y < H; y += 10) c.fillRect(0, y, W, 3);
}

// =====================================================================
// ESCENA 6 — cierre: mapa completo con los 5 pines y muchos "?" por explorar
// =====================================================================
function escena6(c, t) {
  const v = t - VO[5];
  const pines = {}; Object.keys(PINES).forEach((k) => (pines[k] = 1));
  c.fillStyle = "#08142e"; c.fillRect(0, 0, W, H);
  conCamara(c, { x: 540, y: 1100, z: lerp(1.25, 0.92, suave(t / DUR[5])) }, [[1, () => mapaLeonida(c, 540, 1100, 1.0, t, { marGrande: true, zonas: { vice: 1, cayos: 1, grass: 1, norte: 1 }, pines, preguntas: (v - 2.04) / 1.2 })]]);
  vineta(c, 0.5);
  titulo(c, ["¿CUÁL", "ENCONTRASTE TÚ? 👇"], 300, VO[5] + 4.1, t, 118, ["#ffffff", C.neonCian]);
  if (v < 4.0) titulo(c, ["¡Y QUEDAN", "MUCHOS MÁS! ❓"], 300, VO[5] + 0.1, t, 118, ["#ffffff", C.neonRosa]);
  if (v > 6.38) { emoji(c, "💬", 965, 760, 110, resorte(v - 6.38, 8, 15), -0.1); etiqueta(c, "¡CUÉNTAME EL TUYO!", 700, 800, t, VO[5] + 6.45, C.ama, C.tinta, 54, -0.06); }
  if (v > 7.73) {
    const s = resorte(v - 7.73, 7, 14), b = Math.sin(t * 5) * 6;
    c.save(); c.translate(540, 1720 + b); c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.3)"; redondo(c, -230, -60, 460, 130, 65); c.fill();
    c.fillStyle = C.azulFB; redondo(c, -236, -76, 472, 130, 65); c.fill();
    c.font = `700 76px Fredoka, "Noto Color Emoji"`; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SÍGUEME 🔔", 0, 16); c.textAlign = "left";
    c.restore();
    if (v > 8.1) { const p = ((v - 8.1) % 1.2) / 1.2; emoji(c, "👆", 800, 1800 - salida(p) * 40, 110, 1, -0.3, 1 - p * 0.3); }
  }
  destello(c, 1 - t / 0.35, "8,20,46");
  destello(c, (t - (DUR[5] - 0.6)) / 0.6, "0,0,0");
}

const ESC = [escena1, escena2, escena3, escena4, escena5, escena6];

function eventos() {
  const g = (k, s) => INI[k] + VO[k] + s;
  const e = [], add = (t, tipo) => e.push({ t, tipo });
  const titulos = [[g(0, 0.2), 26], [g(1, 0.1), 17], [g(2, 0.2), 16], [g(2, S3.dexter + 0.1), 16], [g(3, 3.4), 12], [g(3, S4.cangrejo + 0.1), 17], [g(4, S5.ovni + 0.05), 12], [g(5, 0.1), 21], [g(5, 4.1), 21]];
  for (const [t0, n] of titulos) for (let i = 0; i < n; i++) add(t0 + i * 0.035, "pop");
  // escena 1
  add(g(0, 0.5), "whoosh"); add(g(0, 2.0), "brillo"); add(g(0, S1.docena), "golpe"); add(g(0, S1.docena), "flash"); add(INI[1] - 0.35, "whoosh");
  // escena 2
  for (const k of ["vice", "cayos", "grass", "norte"]) add(g(1, S2[k]), "check");
  for (let i = 0; i < 5; i++) add(g(1, S2.pines + i * 0.12 + 0.3), "toc");
  add(INI[2] - 0.3, "whoosh");
  // escena 3
  add(g(2, 0.3), "whoosh"); add(g(2, S3.nido), "brillo"); add(g(2, S3.literales), "ding"); add(g(2, S3.dexter), "corte"); add(g(2, S3.ventana), "toc"); add(INI[3] - 0.35, "whoosh");
  // escena 4
  add(g(3, 1.2), "rugido"); add(g(3, S4.ape), "golpe"); add(g(3, S4.ape), "flash"); add(g(3, S4.cangrejo), "corte"); add(g(3, S4.aparece), "golpe"); add(g(3, S4.aparece + 0.1), "rugido");
  for (let i = 0; i < 4; i++) add(g(3, S4.aparece + 0.4 + i * 0.25), "toc");
  // escena 5
  add(g(4, 0.3), "rodar"); add(g(4, S5.ovni), "ovni"); add(g(4, S5.ovni), "estatica");
  // escena 6
  add(g(5, 2.1), "brillo"); add(g(5, 6.38), "pop"); add(g(5, 7.73), "boton");
  return e;
}
