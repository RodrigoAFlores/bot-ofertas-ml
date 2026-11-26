// ESCENAS del reel "El pingüino y la piedra" (ejemplo de referencia del estilo).
// Usa todo lo del motor: clamp, lerp, suave, salida, entrada, rebote, resorte, sacudida, rnd, conCamara, titulo,
// etiqueta, emoji, destello, vineta, iris, rafaga, nieve, estrellita, corazon, explosionCorazones, INI, VO, DUR.

// paleta propia del reel
Object.assign(C, {
  negro: "#141826", lomo: "#1c2236", brilloLomo: "#3a4766", blanco: "#f7f9fc", sombraBlanca: "#d6dfec",
  pico: "#ff6a2b", picoO: "#d9481a", pata: "#ff8a4a", pataO: "#e0662e",
  piedra: "#8e96a3", piedraC: "#b9c0cb", piedraO: "#5f6773", fea: "#7a6a58", feaO: "#54473a",
  ideal: "#cfd6e0", idealC: "#f2f5fa",
});
const EMOJIS = "🐧💝🪨✨❌💕⏩💧🥚😳💢💬👇👆🔔❄️";
const RAFAGAS = [1];

// ---------- fondo antártico (capas con profundidad) ----------
// tono: 0 = día polar, 1 = atardecer
function cieloAnt(c, tono) {
  const g = c.createLinearGradient(0, 0, 0, H);
  const d = ["#7fb8ef", "#b9dcf6", "#e8f3fb", "#fde9d6"], a = ["#3b2a6b", "#b4497a", "#f58a5c", "#ffd08a"];
  const mix = (x, y) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)); const A = p(x), B = p(y); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], tono))).join(",")})`; };
  [0, 0.4, 0.62, 0.74].forEach((s, i) => g.addColorStop(s, mix(d[i], a[i])));
  c.fillStyle = g; c.fillRect(-400, -600, W + 800, H + 1200);
  // sol bajo
  const sxp = 760, syp = 1020;
  const rg = c.createRadialGradient(sxp, syp, 10, sxp, syp, 520);
  rg.addColorStop(0, tono > 0.5 ? "rgba(255,230,170,0.95)" : "rgba(255,255,240,0.95)");
  rg.addColorStop(0.15, tono > 0.5 ? "rgba(255,190,120,0.55)" : "rgba(255,250,225,0.5)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = rg; c.fillRect(-400, 300, W + 800, 1500);
  c.fillStyle = tono > 0.5 ? "#fff0c8" : "#fffef4"; c.beginPath(); c.arc(sxp, syp, 70, 0, 7); c.fill();
}
function montanas(c, tono, ancho = 3) {
  const r = rnd(9);
  for (let k = -1; k < ancho; k++) {
    const x0 = k * 700 + r() * 100, h = 380 + r() * 200;
    const lado = tono > 0.5 ? "#8a6aa8" : "#c4d8ee", sombra = tono > 0.5 ? "#5e4a86" : "#9fbbdb";
    c.fillStyle = lado; c.beginPath(); c.moveTo(x0 - 380, 1130); c.lineTo(x0, 1130 - h); c.lineTo(x0 + 420, 1130); c.fill();
    c.fillStyle = sombra; c.beginPath(); c.moveTo(x0, 1130 - h); c.lineTo(x0 + 420, 1130); c.lineTo(x0 + 60, 1130); c.fill();
    c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(x0, 1130 - h); c.lineTo(x0 - 80, 1130 - h + 110); c.lineTo(x0 - 20, 1130 - h + 90); c.lineTo(x0 + 30, 1130 - h + 120); c.lineTo(x0 + 85, 1130 - h + 100); c.closePath(); c.fill();
  }
}
function mar(c, t, tono) {
  const g = c.createLinearGradient(0, 1120, 0, 1330);
  g.addColorStop(0, tono > 0.5 ? "#6a4f9a" : "#3f7fc4"); g.addColorStop(1, tono > 0.5 ? "#3a2f6a" : "#245a99");
  c.fillStyle = g; c.fillRect(-2000, 1120, W + 4000, 260);
  c.strokeStyle = tono > 0.5 ? "rgba(255,200,150,0.5)" : "rgba(255,255,255,0.45)"; c.lineWidth = 4; c.lineCap = "round";
  const r = rnd(3);
  for (let i = 0; i < 40; i++) { const x = r() * 3000 - 1000 + Math.sin(t + i) * 20, y = 1140 + r() * 170, w = 30 + r() * 60; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); }
}
function iceberg(c, x, y, s, t, brillo = 0) {
  c.save(); c.translate(x, y + Math.sin(t * 1.2 + x) * 4); c.scale(s, s);
  c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(-120, 0); c.lineTo(-90, -90); c.lineTo(-30, -150); c.lineTo(40, -110); c.lineTo(110, -60); c.lineTo(130, 0); c.fill();
  c.fillStyle = "#cfe4f7"; c.beginPath(); c.moveTo(-30, -150); c.lineTo(40, -110); c.lineTo(110, -60); c.lineTo(130, 0); c.lineTo(10, 0); c.fill();
  c.fillStyle = "rgba(160,210,240,0.5)"; c.fillRect(-120, 0, 250, 14);
  if (brillo > 0) estrellita(c, -40, -120, 40 * brillo, t * 3);
  c.restore();
}
function playa(c, t, tono, semilla = 4) {
  const g = c.createLinearGradient(0, 1300, 0, H);
  g.addColorStop(0, tono > 0.5 ? "#a58aa8" : "#e6edf5"); g.addColorStop(0.25, tono > 0.5 ? "#8c7393" : "#d0dbe8"); g.addColorStop(1, tono > 0.5 ? "#5a4a6a" : "#aab8c9");
  c.fillStyle = g; c.beginPath(); c.moveTo(-2000, 1330); for (let x = -2000; x <= W + 2000; x += 60) c.lineTo(x, 1325 + Math.sin(x * 0.01) * 12); c.lineTo(W + 2000, H + 600); c.lineTo(-2000, H + 600); c.fill();
  // guijarros
  const r = rnd(semilla);
  for (let i = 0; i < 160; i++) {
    const x = r() * 4200 - 1500, y = 1360 + Math.pow(r(), 0.8) * 700, s = 0.4 + (y - 1360) / 600;
    c.fillStyle = r() > 0.5 ? (tono > 0.5 ? "#6e5c78" : "#9aa6b6") : (tono > 0.5 ? "#7d6a88" : "#b3bdca");
    c.beginPath(); c.ellipse(x, y, 14 * s, 8 * s, r(), 0, 7); c.fill();
  }
}
// ---------- piedras ----------
function piedra(c, x, y, s, tipo = "normal", rot = 0, semilla = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  const r = rnd(semilla * 7 + 3);
  if (tipo === "fea") {
    c.fillStyle = C.fea; c.beginPath();
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283, rr = 34 + r() * 18; c.lineTo(Math.cos(a) * rr * 1.2, Math.sin(a) * rr * 0.85); }
    c.closePath(); c.fill();
    c.fillStyle = C.feaO; c.beginPath(); c.ellipse(8, 10, 22, 10, 0.3, 0, 7); c.fill();
  } else if (tipo === "ideal") {
    const g = c.createRadialGradient(-12, -14, 4, 0, 0, 50);
    g.addColorStop(0, C.idealC); g.addColorStop(1, C.ideal);
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 46, 32, 0, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.ellipse(-16, -14, 14, 6, -0.4, 0, 7); c.fill();
  } else {
    c.fillStyle = C.piedra; c.beginPath(); c.ellipse(0, 0, 40 + r() * 8, 27 + r() * 6, r() - 0.5, 0, 7); c.fill();
    c.fillStyle = C.piedraC; c.beginPath(); c.ellipse(-10, -9, 15, 6, -0.3, 0, 7); c.fill();
  }
  c.restore();
}

// ---------- pingüino papúa armado por piezas ----------
// e: { paso (fase de caminar), anda (0..1), aletaI, aletaD, cabeza, pico, parpado, ojos ('normal'|'brillo'|'corazon'|'astuto'|'enojado'),
//      carga (piedra en el pico: tipo o null), inclina, aplasta, hembra }
function pinguino(c, x, y, s, e = {}, flip = false) {
  const anda = e.anda || 0, fase = (e.paso || 0) * Math.PI * 2;
  const bambo = Math.sin(fase) * 0.13 * anda, bote = Math.abs(Math.sin(fase)) * 16 * anda;
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
  // sombra
  c.fillStyle = "rgba(40,60,90,0.22)"; c.beginPath(); c.ellipse(0, 6, 120, 22, 0, 0, 7); c.fill();
  // patas (alternan al caminar)
  const p1 = Math.sin(fase) * 18 * anda, p2 = -p1;
  for (const [dx, dl] of [[-36, p1], [34, p2]]) {
    c.save(); c.translate(dx + 18, -Math.max(0, dl) * 0.6);
    c.fillStyle = C.pata; c.beginPath(); c.ellipse(10, 0, 40, 13, 0.05, 0, 7); c.fill();
    c.fillStyle = C.pataO; c.beginPath(); c.ellipse(28, 3, 14, 6, 0, 0, 7); c.fill();
    c.restore();
  }
  c.translate(0, -bote); c.rotate(bambo + (e.inclina || 0));
  const ap = e.aplasta || 0; c.scale(1 + ap * 0.12, 1 - ap * 0.12);
  // aleta lejana
  aleta(c, -25, -250, (e.aletaI ?? 0.25) - 0.15, true);
  // cuerpo
  c.fillStyle = C.negro; c.beginPath(); c.ellipse(0, -185, 118, 178, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(-40, -300, 80, -40);
  g.addColorStop(0, C.blanco); g.addColorStop(1, C.sombraBlanca);
  c.fillStyle = g; c.beginPath(); c.ellipse(30, -160, 84, 146, 0.04, 0, 7); c.fill();
  c.fillStyle = "rgba(255,255,255,0.10)"; c.beginPath(); c.ellipse(-55, -250, 22, 70, 0.2, 0, 7); c.fill();
  // cabeza
  c.save(); c.translate(22, -372); c.rotate(e.cabeza || 0);
  c.fillStyle = C.negro; c.beginPath(); c.ellipse(0, 0, 86, 80, 0, 0, 7); c.fill();
  // mancha blanca sobre el ojo (rasgo del papúa)
  c.fillStyle = C.blanco; c.beginPath(); c.ellipse(24, -36, 34, 15, -0.25, 0, 7); c.fill();
  c.beginPath(); c.ellipse(-30, -44, 22, 11, 0.35, 0, 7); c.fill();
  // pico
  const ab = e.pico || 0;
  c.fillStyle = C.pico; c.beginPath(); c.moveTo(62, -12); c.quadraticCurveTo(120, -10, 152, 6 - ab * 6); c.lineTo(66, 10); c.closePath(); c.fill();
  c.fillStyle = C.picoO; c.save(); c.translate(66, 10); c.rotate(ab * 0.35); c.beginPath(); c.moveTo(0, 0); c.lineTo(80, -2); c.quadraticCurveTo(40, 18, 0, 14); c.fill(); c.restore();
  if (e.carga) piedra(c, 132, 14 + ab * 10, 0.75, e.carga, 0.1, 5);
  // ojo
  ojo(c, 36, -16, e);
  if (e.hembra) { c.strokeStyle = C.negro; c.lineWidth = 5; c.lineCap = "round"; for (const a of [-1.75, -1.25, -0.75]) { c.beginPath(); c.moveTo(36 + Math.cos(a) * 15, -16 + Math.sin(a) * 15); c.lineTo(36 + Math.cos(a) * 27, -16 + Math.sin(a) * 27); c.stroke(); } }
  // mejillas
  if (e.rubor) { c.fillStyle = `rgba(255,110,150,${0.55 * e.rubor})`; c.beginPath(); c.ellipse(40, 18, 18, 9, 0, 0, 7); c.fill(); }
  c.restore();
  // aleta cercana
  aleta(c, -15, -255, e.aletaD ?? 0.25, false);
  c.restore();
}
function ojo(c, x, y, e) {
  const tipo = e.ojos || "normal";
  if (tipo === "corazon") { corazon(c, x, y, 20, C.rosa); return; }
  if (tipo === "brillo") { estrellita(c, x, y, 26, 0, C.ama); estrellita(c, x, y, 12, 0.4, "#fff"); return; }
  c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x, y, 15, 0, 7); c.fill();
  c.fillStyle = "#151515"; c.beginPath(); c.arc(x + 4, y + 1, 9, 0, 7); c.fill();
  c.fillStyle = "#fff"; c.beginPath(); c.arc(x + 1, y - 3, 3.5, 0, 7); c.fill();
  if (tipo === "astuto") { c.fillStyle = C.negro; c.fillRect(x - 18, y - 18, 36, 13); }
  if (tipo === "enojado") { c.strokeStyle = C.negro; c.lineWidth = 8; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 16, y - 24); c.lineTo(x + 16, y - 12); c.stroke(); }
  const pp = e.parpado || 0;
  if (pp > 0) { c.fillStyle = C.negro; c.beginPath(); c.ellipse(x, y - 15 + pp * 15, 17, pp * 17, 0, 0, 7); c.fill(); }
}
function aleta(c, x, y, ang, lejos) {
  c.save(); c.translate(x, y); c.rotate(Math.PI / 2 + 0.35 - ang);
  c.fillStyle = lejos ? "#0d101b" : C.lomo;
  c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(110, -36, 175, 0); c.quadraticCurveTo(100, 30, 0, 26); c.closePath(); c.fill();
  if (!lejos) { c.strokeStyle = C.brilloLomo; c.lineWidth = 4; c.beginPath(); c.moveTo(10, -18); c.quadraticCurveTo(100, -28, 165, -2); c.stroke(); }
  c.restore();
}

// =====================================================================
// ESCENA 1 — gancho: el pingüino llega con la piedra; congelado en "piedra"
// =====================================================================
function escena1(c, t) {
  const v = t - VO[0];
  const tPiedra = 4.1, congela = clamp(v - tPiedra, 0, 10) > 0;
  const tA = congela ? VO[0] + tPiedra : t; // tiempo de la animación (se congela)
  // cámara: baja desde el cielo y luego acercamiento rápido
  const baja = salida(t / 2.0);
  const acerca = rebote((v - 1.6) / 0.45);
  const cam = { x: 540, y: lerp(300, 1180, baja), z: lerp(1.0, 1.25, acerca) + (congela ? 0.06 * salida((v - tPiedra) / 0.3) : 0) };
  const pz = lerp(0.62, 1.0, salida(tA / 3.4)), py = lerp(1420, 1560, salida(tA / 3.4));
  conCamara(c, cam, [
    [0.2, () => cieloAnt(c, 0)],
    [0.4, () => montanas(c, 0)],
    [0.55, () => { mar(c, tA, 0); iceberg(c, 220, 1180, 0.9, tA); iceberg(c, 900, 1200, 0.6, tA); }],
    [1, () => {
      playa(c, tA, 0);
      pinguino(c, 540, py, pz, { anda: congela ? 0 : 1, paso: tA * 1.6, carga: "ideal", aletaD: 0.35 + Math.sin(tA * 10) * 0.1, aletaI: 0.35 }, false);
    }],
    [1.3, () => nieve(c, tA, 60, 2)],
  ]);
  vineta(c);
  // congelado: destello + anillo que resalta la piedra
  if (congela) {
    const p = (v - tPiedra);
    destello(c, 0.9 - p * 4);
    c.save(); c.filter = "none";
    const cx = 540 + (540 + 132 * 0.75 * pz * 1.0 - 540) * 1, cy = 0;
    c.restore();
    const r = lerp(260, 120, salida(p / 0.35));
    // posición en pantalla de la piedra en el pico (aprox.)
    const z = cam.z, wx = 540 + (22 + 132 * 0.75) * pz, wy = py - (372 - 14) * pz;
    const scx = W / 2 + (wx - cam.x) * z, scy = H / 2 + (wy - cam.y) * z;
    c.strokeStyle = C.ama; c.lineWidth = 14; c.setLineDash([36, 18]); c.lineDashOffset = -p * 200;
    c.beginPath(); c.arc(scx, scy, r, 0, 7); c.stroke(); c.setLineDash([]);
    for (let i = 0; i < 6; i++) estrellita(c, scx + Math.cos(i + p * 3) * (r + 40), scy + Math.sin(i + p * 3) * (r + 40), 22 * clamp(p * 4, 0, 1), p * 4);
  }
  titulo(c, ["SU REGALO", "DE AMOR 🐧💝"], 300, VO[0] + 0.55, t);
  if (t < 0.45) destello(c, 1 - t / 0.45, "0,0,0");
}

// =====================================================================
// ESCENA 2 — no hay ramas: paneo lateral, rama tachada, parada en seco sobre las piedras
// =====================================================================
function escena2(c, t) {
  const v = t - VO[1];
  const tPiedras = 5.07;
  const pan = v < tPiedras ? lerp(-500, 1400, suave(v / tPiedras) * 0.92) : 1400 * 0.92 + lerp(-500 * 0.08, 0, 0) ;
  // parada en seco con pequeño rebote
  const stop = clamp((v - tPiedras) / 0.25, 0, 1);
  const camX = v < tPiedras ? lerp(-500, 1250, suave(v / tPiedras)) : 1250 - sacudida(v - tPiedras, 18, 8, 16);
  const punch = v > tPiedras ? 1.0 + 0.18 * rebote((v - tPiedras) / 0.3) : 1.0;
  const cam = { x: camX + 540, y: 1150, z: punch };
  conCamara(c, cam, [
    [0.15, () => cieloAnt(c, 0)],
    [0.35, () => montanas(c, 0, 5)],
    [0.55, () => { mar(c, t, 0); iceberg(c, 300, 1190, 1, t, v > 3.8 && v < 4.8 ? Math.sin((v - 3.8) * Math.PI) : 0); iceberg(c, 1300, 1210, 0.7, t); iceberg(c, 2100, 1180, 1.1, t); }],
    [1, () => {
      playa(c, t, 0, 8);
      // pingüino pequeño mirando a su alrededor
      pinguino(c, 700, 1560, 0.6, { cabeza: Math.sin(t * 2.2) * 0.25, aletaD: 0.3, aletaI: 0.3 }, Math.sin(t * 1.1) > 0.3);
      // montón de piedras al final del paneo
      const r = rnd(12);
      for (let i = 0; i < 26; i++) piedra(c, 1790 + (r() - 0.5) * 420, 1640 - Math.abs(r() - 0.5) * 200 * (1 - Math.abs(r() - 0.5)) - i * 3, 1.1 + r() * 0.6, "normal", r() * 3, i);
    }],
    [1.4, () => nieve(c, t, 50, 3)],
  ]);
  vineta(c);
  // icono de rama que aparece, se tacha y se rompe
  const tR = 1.5, tX = 2.25, tRompe = 2.75;
  if (v > tR && v < tRompe + 1.4) {
    const s = resorte(v - tR, 8, 15);
    const rompe = v > tRompe ? v - tRompe : 0;
    for (const lado of [-1, 1]) {
      c.save();
      c.translate(540 + lado * rompe * 260, 760 + rompe * rompe * 1400);
      c.rotate(lado * rompe * 2.2); c.scale(s, s);
      c.beginPath(); c.rect(lado < 0 ? -400 : 0, -200, 400, 400); c.clip();
      c.strokeStyle = "#7a4a2a"; c.lineWidth = 34; c.lineCap = "round";
      c.beginPath(); c.moveTo(-220, 60); c.quadraticCurveTo(0, -10, 220, -60); c.moveTo(-40, 15); c.lineTo(40, -110); c.moveTo(90, -30); c.lineTo(160, 40); c.stroke();
      for (const [hx, hy, a] of [[40, -125, -0.8], [170, 50, 0.6], [-150, 40, 2.6]]) { c.save(); c.translate(hx, hy); c.rotate(a); c.fillStyle = "#4f9a4a"; c.beginPath(); c.ellipse(0, 0, 46, 22, 0, 0, 7); c.fill(); c.restore(); }
      c.restore();
    }
    if (v > tX && v < tRompe + 0.2) {
      const p = salida((v - tX) / 0.25);
      c.strokeStyle = C.rojo; c.lineWidth = 40; c.lineCap = "round";
      c.beginPath(); c.moveTo(330, 560); c.lineTo(lerp(330, 750, p), lerp(560, 960, p)); c.moveTo(750, 560); c.lineTo(lerp(750, 330, p), lerp(560, 960, p)); c.stroke();
    }
  }
  titulo(c, ["NO HAY RAMAS ❄️"], 330, VO[1] + 1.2, t);
  if (v > tPiedras) etiqueta(c, "SOLO PIEDRAS 🪨", 540, 1260, t, VO[1] + tPiedras + 0.1, C.ama);
  // transición: piedras que ruedan hacia la cámara y tapan la pantalla
  transicionPiedras(c, t - (DUR[1] - 0.5), 0.5, false);
}
function transicionPiedras(c, tau, dur, abriendo) {
  if (tau < 0 || tau > dur) return;
  const r = rnd(77);
  for (let i = 0; i < 16; i++) {
    const p = abriendo ? 1 - tau / dur : tau / dur;
    const lx = r() * W, ly = r() * H, sz = 3 + r() * 3.5;
    const s = sz * salida(clamp(p * 1.6 - r() * 0.5, 0, 1));
    const y = abriendo ? ly + (1 - p) * 1400 : ly;
    piedra(c, lx, y, s, "normal", r() * 6 + p * 4, i);
  }
}

// =====================================================================
// ESCENA 3 — la búsqueda: caminata, cortes rápidos con ❌, piedra ideal con rayos de luz
// =====================================================================
const S3 = { lisa: 3.93, tamano: 4.48, cortes: [5.21, 6.59, 7.56], encuentra: 8.6, ideal: 10.12 };
function escena3(c, t) {
  const v = t - VO[2];
  transicionPiedras(c, 0, 0, true);
  if (v < S3.cortes[0]) {
    // caminata con cámara que acompaña
    const cx = 540 + t * 160;
    conCamara(c, { x: cx, y: 1200, z: 1.15 }, [
      [0.15, () => cieloAnt(c, 0)],
      [0.35, () => montanas(c, 0, 6)],
      [0.55, () => { mar(c, t, 0); iceberg(c, 900, 1190, 0.9, t); }],
      [1, () => {
        playa(c, t, 0, 15);
        const r = rnd(31); for (let i = 0; i < 14; i++) piedra(c, 300 + i * 160 + r() * 60, 1600 + r() * 120, 0.8 + r() * 0.4, r() > 0.6 ? "fea" : "normal", r() * 3, i);
        pinguino(c, cx - 40, 1560, 0.9, { anda: 1, paso: t * 1.7, cabeza: 0.35 + Math.sin(t * 3) * 0.06, aletaD: 0.4, aletaI: 0.4 }, false);
      }],
      [1.3, () => nieve(c, t, 40, 5, -120)],
    ]);
    vineta(c);
    titulo(c, ["LA PIEDRA", "PERFECTA 🪨✨"], 300, VO[2] + 2.85, t);
    etiqueta(c, "✔ LISA", 300, 1300, t, VO[2] + S3.lisa, "#3fd16b");
    etiqueta(c, "✔ TAMAÑO JUSTO", 640, 1420, t, VO[2] + S3.tamano, "#3fd16b", "#16203a", 58, 0.04);
    transicionPiedras(c, t, 0.5, true);
    return;
  }
  if (v < S3.encuentra) {
    // cortes rápidos: revisa, ❌, la lanza por detrás
    let k = 0; for (let i = 0; i < 3; i++) if (v >= S3.cortes[i]) k = i;
    const t0 = S3.cortes[k], fin = k < 2 ? S3.cortes[k + 1] : S3.encuentra, tc = v - t0, dc = fin - t0;
    const zoom = 1.55 + 0.1 * salida(tc / dc);
    const cam = { x: 600 + k * 40, y: 1300, z: zoom, rot: [-0.04, 0.05, -0.02][k] };
    const lanza = clamp((tc - dc * 0.55) / 0.12, 0, 1);
    conCamara(c, cam, [
      [0.15, () => cieloAnt(c, 0)],
      [0.4, () => montanas(c, 0, 3)],
      [0.6, () => mar(c, t, 0)],
      [1, () => {
        playa(c, t, 0, 40 + k);
        const inclina = tc < dc * 0.5 ? 0.35 * salida(tc / 0.2) : lerp(0.35, -0.4, salida((tc - dc * 0.5) / 0.15));
        pinguino(c, 520, 1560, 1, { inclina, cabeza: inclina * 0.6 + Math.sin(tc * 14) * 0.05 * (tc < dc * 0.5 ? 1 : 0), aletaD: 0.3 + lanza * 0.6, aletaI: 0.3, ojos: tc > dc * 0.35 ? "enojado" : "normal" }, false);
        // la piedra fea: en el suelo, luego vuela por detrás
        const tipo = ["fea", "fea", "normal"][k];
        if (lanza <= 0) piedra(c, 720, 1580, 1.3, tipo, 0.2, 60 + k);
        else { const tv = tc - dc * 0.55; piedra(c, 720 - tv * 1500, 1580 - tv * 1600 + tv * tv * 2600, 1.3, tipo, tv * 18, 60 + k); }
      }],
    ]);
    vineta(c, 0.5);
    // ❌ que aparece
    if (tc > dc * 0.3) { const s = resorte(tc - dc * 0.3, 9, 18); emoji(c, "❌", 760, 900, 220, s, -0.1); }
    // corte con destello
    destello(c, 1 - tc / 0.08);
    return;
  }
  // encuentra la ideal: empujón lento, rayos de luz, brillos; ojos que se iluminan
  const te = v - S3.encuentra;
  const zoomLento = lerp(1.3, 2.1, suave(te / 1.6));
  const primerPlano = v > S3.ideal + 0.3;
  if (!primerPlano) {
    const cam = { x: 640, y: 1500, z: zoomLento };
    conCamara(c, cam, [
      [0.15, () => cieloAnt(c, 0)],
      [0.4, () => montanas(c, 0, 3)],
      [0.6, () => mar(c, t, 0)],
      [1, () => {
        playa(c, t, 0, 50);
        // rayos de luz detrás de la piedra
        c.save(); c.translate(760, 1580); c.rotate(t * 0.6);
        for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = `rgba(255,240,170,${0.28 * suave(te / 0.6)})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(600, -50); c.lineTo(600, 50); c.fill(); }
        c.restore();
        const g = c.createRadialGradient(760, 1580, 10, 760, 1580, 260);
        g.addColorStop(0, `rgba(255,250,210,${0.8 * suave(te / 0.6)})`); g.addColorStop(1, "rgba(255,250,210,0)");
        c.fillStyle = g; c.beginPath(); c.arc(760, 1580, 260, 0, 7); c.fill();
        piedra(c, 760, 1580 - Math.sin(t * 3) * 6, 1.6, "ideal", 0, 1);
        for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * 1.5, rr = 120 + (i % 3) * 30; estrellita(c, 760 + Math.cos(a) * rr, 1560 + Math.sin(a) * rr * 0.7, 18 + 10 * Math.sin(t * 6 + i), t * 2 + i); }
        pinguino(c, 470, 1560, 1, { cabeza: 0.3, aletaD: 0.6 + Math.sin(t * 18) * 0.15 * clamp(te, 0, 1), aletaI: 0.5 }, false);
      }],
    ]);
  } else {
    // primer plano de la cara: los ojos se vuelven estrellas
    const tp = v - S3.ideal - 0.3;
    const cam = { x: 600, y: 1210, z: 2.8 + 0.15 * salida(tp) };
    conCamara(c, cam, [
      [0.2, () => cieloAnt(c, 0)],
      [1, () => {
        c.fillStyle = "rgba(255,240,180,0.25)"; c.fillRect(-1000, -1000, 4000, 4000);
        pinguino(c, 540, 1560, 1, { cabeza: 0.05 + sacudida(tp, 0.15, 6, 20), ojos: tp > 0.15 ? "brillo" : "normal", pico: 0.6 * suave(tp / 0.2), rubor: suave(tp / 0.3), aletaD: 1.2, aletaI: 1.2 }, false);
      }],
    ]);
    for (let i = 0; i < 10; i++) { const a = i * 0.63 + tp * 2; estrellita(c, 540 + Math.cos(a) * 420, 900 + Math.sin(a) * 420, 22 + 12 * Math.sin(tp * 8 + i), tp * 3, C.ama); }
    destello(c, 0.9 - tp * 5);
  }
  vineta(c, 0.4);
  if (primerPlano) etiqueta(c, "¡LA IDEAL! ✨", 540, 1500, t, VO[2] + S3.ideal + 0.35, C.ama, "#16203a", 76);
  // transición: el brillo llena la pantalla
  destello(c, (t - (DUR[2] - 0.45)) / 0.45, "255,252,235");
}

// =====================================================================
// ESCENA 4 — el regalo: cámara lenta, zooms alternados, corazones, nido en time-lapse, huevo, iris
// =====================================================================
const S4 = { deja: 1.32, el: 3.0, ella: 3.6, acepta: 4.44, nido: 5.45, nidoFin: 7.24, huevo: 7.5 };
function escena4(c, t) {
  const v = t - VO[3];
  // él camina hasta ella con la piedra
  const llega = salida((v + 0.35) / 1.55);
  const xEl = lerp(120, 400, llega);
  const deja = clamp((v - S4.deja) / 1.2, 0, 1);       // cámara lenta: dejar la piedra
  const enSuelo = v > S4.deja + 0.9;
  const acepta = v > S4.acepta;
  const nidoP = clamp((v - S4.nido) / (S4.nidoFin - S4.nido), 0, 1);
  const huevo = v > S4.huevo;
  // cámara: plano de dos; zooms alternados en la tensión; acercamiento al huevo
  let cam = { x: 560, y: 1330, z: 1.25 };
  if (v > S4.el && v < S4.acepta) {
    const aEl = v < S4.ella;
    cam = { x: aEl ? 420 : 720, y: 1180, z: 2.0 + 0.1 * salida((v - (aEl ? S4.el : S4.ella)) / 0.4) };
  }
  if (nidoP > 0) cam = { x: 560, y: 1380, z: lerp(1.25, 1.0, suave(nidoP)) };
  if (huevo) cam = { x: 560, y: 1550, z: lerp(1.0, 1.9, suave((v - S4.huevo) / 1.8)) };
  const rosa = acepta ? suave((v - S4.acepta) / 0.4) * (1 - suave((v - S4.nidoFin) / 0.8) * 0.6) : 0;
  const tl = nidoP > 0 && nidoP < 1; // time-lapse
  const tt = tl ? t * 4 : t;
  conCamara(c, cam, [
    [0.15, () => { cieloAnt(c, 0); if (rosa > 0) { c.fillStyle = `rgba(255,150,190,${0.45 * rosa})`; c.fillRect(-1000, -1000, 4000, 5000); } }],
    [0.4, () => montanas(c, 0)],
    [0.6, () => { mar(c, t, 0); iceberg(c, 860, 1200, 0.7, t); }],
    [1, () => {
      playa(c, t, 0, 70);
      // charcos de deshielo y barro alrededor
      if (huevo) {
        const a = suave((v - S4.huevo) / 0.5);
        c.globalAlpha = a; c.fillStyle = "#7fb6e6"; c.beginPath(); c.ellipse(220, 1700, 120, 30, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(900, 1690, 110, 26, 0, 0, 7); c.fill();
        c.fillStyle = "#8a6a4a"; c.beginPath(); c.ellipse(560, 1790, 200, 34, 0, 0, 7); c.fill(); c.globalAlpha = 1;
      }
      // nido: anillo de piedras que aparecen una a una
      const n = 18, visibles = Math.floor(nidoP * n + (nidoP >= 1 ? n : 0));
      for (let i = 0; i < Math.min(n, visibles); i++) {
        const a = (i / n) * Math.PI * 2, tp = (nidoP * n - i);
        const s = nidoP >= 1 ? 1 : resorte(tp * 0.25, 9, 16);
        piedra(c, 560 + Math.cos(a) * 300, 1640 + Math.sin(a) * 80, 0.95 * s, "normal", a, i + 3);
      }
      if (huevo) {
        const ph = v - S4.huevo, s = resorte(ph, 8, 14);
        c.save(); c.translate(560, 1630); c.scale(s, s);
        const g = c.createRadialGradient(-14, -30, 6, 0, -10, 70); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#dfe6ef");
        c.fillStyle = g; c.beginPath(); c.ellipse(0, -20, 46, 60, 0, 0, 7); c.fill(); c.restore();
        estrellita(c, 600, 1570, 26 * clamp(ph * 2, 0, 1) * (0.7 + 0.3 * Math.sin(t * 8)), t * 3);
      }
      // piedra regalada
      if (enSuelo && !huevo) piedra(c, 560, 1600 + (deja < 1 ? 0 : 0), 1.0, "ideal", 0, 1);
      // ella
      const xElla = nidoP > 0 ? 700 + Math.sin(tt * 2) * 30 * (tl ? 1 : 0) : 720;
      pinguino(c, xElla, 1560, 0.92, { hembra: true, cabeza: acepta ? -0.15 + Math.sin(t * 3) * 0.05 : -0.25, ojos: acepta && !tl ? "corazon" : "normal", rubor: acepta ? 1 : 0, parpado: v > 2.2 && v < 2.35 ? 1 : 0, aletaD: acepta ? 0.6 + Math.sin(t * 9) * 0.2 : 0.25, aletaI: 0.3, anda: tl ? 1 : 0, paso: tt }, true);
      // él
      const xE = nidoP > 0 ? 410 + Math.sin(tt * 2.3 + 1) * 30 * (tl ? 1 : 0) : xEl;
      const reverencia = enSuelo ? 0 : 0.55 * Math.sin(deja * Math.PI);
      pinguino(c, xE, 1560, 1, { anda: v < 1.1 ? 1 : tl ? 1 : 0, paso: tl ? tt : t * 1.6, inclina: reverencia, cabeza: reverencia * 0.8, carga: !enSuelo && deja < 0.75 ? "ideal" : null, ojos: acepta && !tl ? "corazon" : "normal", rubor: acepta ? 1 : 0.4, aletaD: v > S4.el && v < S4.acepta ? 0.25 + Math.sin(t * 30) * 0.08 : 0.35, aletaI: 0.3 }, false);
      // piedra cayendo en cámara lenta
      if (!enSuelo && deja >= 0.75) { const p = (deja - 0.75) / 0.25; piedra(c, lerp(xEl + 140, 560, p), lerp(1390, 1600, p * p), 1.0, "ideal", p * 0.6, 1); }
      // gota de nervios
      if (v > S4.el && v < S4.acepta) { const p = (v - S4.el) % 0.9; c.fillStyle = "#8fd0ff"; c.beginPath(); c.ellipse(xEl - 30, 1180 + p * 60, 12, 18, 0, 0, 7); c.fill(); }
    }],
    [1.3, () => nieve(c, tl ? tt : (deja > 0 && deja < 1 ? S4.deja + VO[3] + (t - S4.deja - VO[3]) * 0.25 : t), 50, 7)],
  ]);
  // explosión de corazones
  if (acepta) {
    const pc = v - S4.acepta, r = rnd(91);
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.283, vel = 500 + r() * 900, life = clamp(1 - pc / 1.8, 0, 1);
      if (life <= 0) break;
      const x = 540 + Math.cos(a) * vel * salida(pc / 1.2), y = 1150 + Math.sin(a) * vel * salida(pc / 1.2) - pc * 120;
      c.globalAlpha = life; corazon(c, x, y, 22 + r() * 26, r() > 0.5 ? C.rosa : "#ff3b6b"); c.globalAlpha = 1;
    }
  }
  vineta(c, 0.4);
  if (tl) { emoji(c, "⏩", 930, 160, 90, 1 + 0.08 * Math.sin(t * 12)); etiqueta(c, "x4", 930, 260, t, VO[3] + S4.nido, "#fff", "#16203a", 44, 0); }
  if (acepta && v < S4.nido + 0.4) titulo(c, ["¡DIJO QUE SÍ! 💕"], 330, VO[3] + S4.acepta + 0.05, t, 130, ["#ffffff"]);
  if (huevo) { etiqueta(c, "💧 AGUA AFUERA", 300, 1240, t, VO[3] + 8.2, "#bfe4ff"); etiqueta(c, "🥚 HUEVO SECO", 760, 1360, t, VO[3] + 8.8, C.ama, "#16203a", 58, 0.04); }
  // apertura desde blanco
  destello(c, 1 - t / 0.4, "255,252,235");
  // iris que se cierra sobre el huevo
  iris(c, 1 - clamp((t - (DUR[3] - 0.5)) / 0.5, 0, 1), W / 2, 1100);
}

// =====================================================================
// ESCENA 5 — el giro: ladrón de puntillas, congelado con "¡LADRÓN!", huida en cámara rápida, barrido
// =====================================================================
const S5 = { algunos: 2.75, roban: 3.55, huye: 4.7 };
function escena5(c, t) {
  const v = t - VO[4];
  const congelado = v > S5.roban && v < S5.huye;
  const tA = congelado ? VO[4] + S5.roban : t;
  const va = tA - VO[4];
  // ladrón: de puntillas (lento), toma la piedra, huye rápido
  let xL;
  if (va < S5.algunos) xL = lerp(-150, 520, salida(Math.max(0, va) / S5.algunos));
  else if (va < S5.roban) xL = 520 + (va - S5.algunos) * 60;
  else xL = 570 + Math.max(0, v - S5.huye) * 1400;
  const conPiedra = va > S5.algunos + 0.45;
  // cámara: se aleja revelando, luego barrido siguiendo al ladrón
  let cam = { x: 640, y: 1350, z: lerp(1.7, 1.15, salida(t / 1.4)) };
  if (v > S5.huye) cam = { x: 640 + entrada((v - S5.huye) / 0.9) * 2200, y: 1350, z: 1.15 };
  if (congelado) cam.z = 1.15 + 0.08 * salida((v - S5.roban) / 0.3);
  const sac = congelado ? sacudida(v - S5.roban, 26, 8, 40) : 0;
  c.save(); c.translate(sac, sac * 0.4);
  conCamara(c, cam, [
    [0.15, () => cieloAnt(c, 0.15)],
    [0.4, () => montanas(c, 0.15, 6)],
    [0.6, () => { mar(c, tA, 0); iceberg(c, 1500, 1200, 0.8, tA); }],
    [1, () => {
      playa(c, tA, 0, 90);
      // nido de la pareja (izquierda, recortado por el borde)
      for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; piedra(c, 120 + Math.cos(a) * 230, 1650 + Math.sin(a) * 60, 0.85, "normal", a, i); }
      pinguino(c, 60, 1580, 0.9, { hembra: true, cabeza: -0.1 }, true);
      // nido del vecino (derecha) con el vecino durmiendo
      for (let i = 0; i < 12; i++) { if (conPiedra && i === 3) continue; const a = (i / 12) * 6.283; piedra(c, 980 + Math.cos(a) * 230, 1650 + Math.sin(a) * 60, 0.85, "normal", a, i + 20); }
      const despierta = v > S5.huye + 0.3;
      pinguino(c, 990, 1580, 0.95, { parpado: despierta ? 0 : 1, ojos: despierta ? "enojado" : "normal", cabeza: despierta ? 0.15 + sacudida(v - S5.huye - 0.3, 0.2, 5, 25) : -0.2, aletaD: despierta ? 0.9 + Math.sin(t * 22) * 0.3 : 0.2, aletaI: despierta ? 0.9 : 0.2, aplasta: despierta ? 0 : 0.08 }, true);
      // ladrón
      const puntillas = va < S5.algunos;
      pinguino(c, xL, 1600, 0.88, { anda: 1, paso: v > S5.huye ? t * 5 : tA * (puntillas ? 0.9 : 1.2), ojos: "astuto", carga: conPiedra ? "normal" : null, inclina: v > S5.huye ? 0.25 : puntillas ? -0.08 : 0.2, aletaD: v > S5.huye ? 1.3 + Math.sin(t * 40) * 0.3 : 0.15, aletaI: v > S5.huye ? 1.3 : 0.15 }, false);
      // líneas de velocidad en la huida
      if (v > S5.huye) { c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 8; c.lineCap = "round"; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(xL - 160 - i * 30, 1300 + i * 45); c.lineTo(xL - 380 - i * 30, 1300 + i * 45); c.stroke(); } }
    }],
    [1.3, () => nieve(c, tA, 45, 9)],
  ]);
  c.restore();
  vineta(c, congelado ? 0.65 : 0.4);
  // "zzz" del vecino dormido
  if (v < S5.huye + 0.3) { const zt = (t * 0.8) % 1; c.font = `700 ${60 + zt * 30}px Fredoka`; c.fillStyle = `rgba(255,255,255,${1 - zt})`; c.fillText("z", 860 + zt * 60, 1080 - zt * 120); }
  if (congelado) {
    const p = v - S5.roban;
    destello(c, 0.8 - p * 5);
    // letrero "¡LADRÓN!" con flecha
    const scx = W / 2 + (xL - cam.x) * cam.z;
    etiqueta(c, "¡LADRÓN! 🪨", scx + 40, 980, t, VO[4] + S5.roban + 0.08, "#ffffff", C.rojo, 72, -0.08);
    c.strokeStyle = C.rojo; c.lineWidth = 16; c.lineCap = "round"; const pa = resorte(p - 0.15, 9, 18);
    c.beginPath(); c.moveTo(scx + 40, 1040); c.lineTo(scx + 40, 1040 + 120 * pa); c.moveTo(scx + 10, 1120 * 1 + 40 * pa - 40); c.lineTo(scx + 40, 1040 + 120 * pa); c.lineTo(scx + 70, 1120 + 40 * pa - 40); c.stroke();
  }
  if (v > S5.huye + 0.35) emoji(c, "💢", 900 - (cam.x - 640) * 1.15, 1000, 130, resorte(v - S5.huye - 0.35, 9, 16));
  titulo(c, ["¡HASTA LAS", "ROBAN! 😳"], 300, VO[4] + S5.roban + 0.05, t);
  // apertura del iris
  iris(c, clamp(t / 0.5, 0, 1), W / 2, 1100);
  if (t < 0.5) iris(c, salida(t / 0.5), W / 2, 1100);
}

// =====================================================================
// ESCENA 6 — cierre al atardecer: pareja, huevo, cámara que se aleja, botón "SÍGUEME"
// =====================================================================
function escena6(c, t) {
  const v = t - VO[5];
  const cam = { x: 560, y: 1380, z: lerp(1.55, 1.05, suave(t / DUR[5])) };
  conCamara(c, cam, [
    [0.15, () => cieloAnt(c, 1)],
    [0.4, () => montanas(c, 1)],
    [0.6, () => { mar(c, t, 1); iceberg(c, 900, 1200, 0.7, t); }],
    [1, () => {
      playa(c, t, 1, 70);
      for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.283; piedra(c, 560 + Math.cos(a) * 300, 1640 + Math.sin(a) * 80, 0.95, "normal", a, i + 3); }
      c.fillStyle = "#f5ecf2"; c.beginPath(); c.ellipse(560, 1610, 46, 60, 0, 0, 7); c.fill();
      pinguino(c, 720, 1560, 0.92, { hembra: true, cabeza: -0.1 + 0.05 * Math.sin(t * 1.5), rubor: 0.6, parpado: (t % 3.1) > 2.95 ? 1 : 0 }, true);
      const ladea = v > 1.0 ? 0.32 * rebote((v - 1.0) / 0.35) : 0;
      pinguino(c, 400, 1560, 1, { cabeza: ladea, rubor: 0.6, aletaD: 0.35, parpado: (t % 3.7) > 3.55 ? 1 : 0 }, false);
      corazon(c, 560, 1180 - Math.sin(t * 2) * 10, 34 * clamp(t, 0, 1), "rgba(255,111,168,0.85)");
    }],
    [1.3, () => nieve(c, t, 60, 11)],
  ]);
  vineta(c, 0.5);
  titulo(c, ["¿A QUIÉN", "SE LA DARÍAS? 👇"], 300, VO[5] + 0.3, t, 118);
  if (v > 2.62) { emoji(c, "💬", 965, 545, 110, resorte(v - 2.62, 8, 15), -0.1); etiqueta(c, "¡ETIQUÉTALO!", 730, 585, t, VO[5] + 2.7, C.ama, "#16203a", 56, -0.06); }
  // botón SÍGUEME
  if (v > 4.15) {
    const s = resorte(v - 4.15, 7, 14), b = Math.sin(t * 5) * 6;
    c.save(); c.translate(540, 1720 + b); c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,0.3)"; redondo(c, -230, -60, 460, 130, 65); c.fill();
    c.fillStyle = C.azulFB; redondo(c, -236, -76, 472, 130, 65); c.fill();
    c.font = `700 76px Fredoka, "Noto Color Emoji"`; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("SÍGUEME 🔔", 0, 16); c.textAlign = "left";
    c.restore();
    if (v > 4.5) { const p = ((v - 4.5) % 1.2) / 1.2; emoji(c, "👆", 800, 1800 - salida(p) * 40, 110, 1, -0.3, 1 - p * 0.3); }
  }
  // barrido de entrada (viene del barrido de la escena 5)
  if (t < 0.35) { c.fillStyle = `rgba(255,255,255,${0.6 * (1 - t / 0.35)})`; c.fillRect(0, 0, W, H); }
  // fundido final
  destello(c, (t - (DUR[5] - 0.6)) / 0.6, "0,0,0");
}


const ESC = [escena1, escena2, escena3, escena4, escena5, escena6];
function eventos() {
  const g = (k, s) => INI[k] + VO[k] + s;
  const e = [];
  const add = (t, tipo) => e.push({ t, tipo });
  // títulos (un pop por letra) y etiquetas
  const titulos = [[g(0, 0.55), 15], [g(1, 1.2), 12], [g(2, 2.85), 16], [g(3, S4.acepta + 0.05), 12], [g(4, S5.roban + 0.05), 15], [g(5, 0.3), 20]];
  for (const [t0, n] of titulos) for (let i = 0; i < n; i++) add(t0 + i * 0.035, "pop");
  for (const t0 of [g(2, S3.lisa), g(2, S3.tamano), g(1, 5.17), g(5, 2.7)]) add(t0, "check");
  // escena 1
  add(g(0, 1.6), "whoosh"); add(g(0, 4.1), "ding"); add(g(0, 4.1), "flash");
  add(INI[1] - 0.45, "rafaga");
  // escena 2
  add(g(1, 1.5), "pop"); add(g(1, 2.25), "error"); add(g(1, 2.75), "crack"); add(g(1, 5.07), "golpe"); add(INI[2] - 0.5, "rodar");
  // escena 3
  for (const tc of S3.cortes) { add(g(2, tc), "corte"); }
  for (let k = 0; k < 3; k++) { const t0 = S3.cortes[k], fin = k < 2 ? S3.cortes[k + 1] : S3.encuentra, dc = fin - t0; add(g(2, t0 + dc * 0.3), "error"); add(g(2, t0 + dc * 0.55), "swish"); }
  add(g(2, S3.encuentra), "coro"); add(g(2, S3.ideal + 0.3), "brillo"); add(INI[3] - 0.45, "whoosh");
  // escena 4
  add(g(3, S4.deja + 1.15), "toc"); add(g(3, S4.el), "tic"); add(g(3, S4.ella), "tic");
  add(g(3, S4.acepta), "corazones"); add(g(3, S4.nido), "timelapse"); add(g(3, S4.huevo), "brillo"); add(INI[4] - 0.5, "iris");
  // escena 5
  add(g(4, 0), "sigilo"); add(g(4, S5.roban), "golpe"); add(g(4, S5.roban), "flash"); add(g(4, S5.huye), "huida"); add(g(4, S5.huye + 0.35), "enojo"); add(INI[5] - 0.2, "whoosh");
  // escena 6
  add(g(5, 1.0), "boing"); add(g(5, 2.62), "pop"); add(g(5, 4.15), "boton");
  return e;
}
