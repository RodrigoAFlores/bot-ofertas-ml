// MOTOR de reels "¿Sabías que…?" — animación vectorial 1080x1920 a 60 fps.
// No se edita por reel: cada reel aporta su escenas.js (dibujos y escenas) y config.json (tiempos de la voz).
// Se carga así: CONFIG (window.CONFIG) → motor.js → escenas.js, en un mismo <script>.

const W = 1080, H = 1920;
const cv = document.getElementById("c");
cv.width = W; cv.height = H;
const ctx = cv.getContext("2d");
const sub = document.createElement("canvas"); sub.width = W; sub.height = H;
const sx = sub.getContext("2d");

// ---------- tiempos (desde config.json) ----------
// VOZ: duración de cada clip de voz; VO: cuándo empieza la voz dentro de su escena; COLA: aire al final de la escena
const VOZ = window.CONFIG.voz, VO = window.CONFIG.vo, COLA = window.CONFIG.cola;
const NESC = VOZ.length;
const DUR = VOZ.map((v, i) => VO[i] + v + COLA[i]);
const INI = DUR.reduce((a, d, i) => (a.push(i ? a[i - 1] + DUR[i - 1] : 0), a), []);
const TOTAL = INI[NESC - 1] + DUR[NESC - 1];

// ---------- utilidades ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const suave = (p) => { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
const salida = (p) => 1 - Math.pow(1 - clamp(p, 0, 1), 3);
const entrada = (p) => Math.pow(clamp(p, 0, 1), 3);
const rebote = (p) => { p = clamp(p, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const resorte = (tau, k = 7, w = 15) => (tau <= 0 ? 0 : 1 - Math.exp(-k * tau) * Math.cos(w * tau));
const sacudida = (tau, amp, k = 6, w = 13) => (tau <= 0 ? 0 : amp * Math.exp(-k * tau) * Math.sin(w * tau));
function rnd(s) { s = s % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const ventana = (t, a, b, fi = 0.15, fo = 0.15) => clamp((t - a) / fi, 0, 1) * clamp((b - t) / fo, 0, 1);
let EVENTOS = [];
const ev = (t, tipo) => EVENTOS.push({ t, tipo });

// ---------- paleta base (cada reel agrega la suya con Object.assign(C, {...})) ----------
const C = { ama: "#ffd43b", rosa: "#ff6fa8", rojo: "#ff3b3b", azulFB: "#1877f2", tinta: "#16203a" };

// ---------- partículas y adornos ----------
function nieve(c, t, n = 70, semilla = 1, velX = 0, tam = 1, alfa = 0.9) {
  const r = rnd(semilla);
  for (let i = 0; i < n; i++) {
    const v = 60 + r() * 90, x0 = r() * (W + 400) - 200, y0 = r() * H, rr = (3 + r() * 6) * tam;
    const y = (y0 + t * v) % (H + 40) - 20, x = ((x0 + Math.sin(t * 0.8 + i) * 30 + t * velX) % (W + 400) + W + 400) % (W + 400) - 200;
    c.fillStyle = `rgba(255,255,255,${alfa * (0.5 + 0.5 * r())})`; c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill();
  }
}
function estrellita(c, x, y, r, rot = 0, col = "#ffffff") {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.22 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  c.closePath(); c.fill(); c.restore();
}

function corazon(c, x, y, r, col) {
  c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath();
  c.moveTo(0, r * 0.9); c.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.6, -r * 1.4, 0, -r * 0.45); c.bezierCurveTo(r * 0.6, -r * 1.4, r * 1.6, -r * 0.2, 0, r * 0.9); c.fill(); c.restore();
}


// ---------- textos ----------
const seg = new Intl.Segmenter("es", { granularity: "grapheme" });
const esEmoji = (g) => /\p{Extended_Pictographic}/u.test(g);
function titulo(c, lineas, y0, t0, t, tam = 128, colores = ["#ffffff", C.ama]) {
  if (t < t0) return;
  c.font = `700 ${tam}px Fredoka, "Noto Color Emoji"`;
  const maxAncho = Math.max(...lineas.map((l) => c.measureText(l).width));
  if (maxAncho > W - 110) tam = Math.floor((tam * (W - 110)) / maxAncho);
  c.font = `700 ${tam}px Fredoka, "Noto Color Emoji"`; c.textBaseline = "alphabetic"; c.lineJoin = "round";
  let k = 0;
  lineas.forEach((txt, li) => {
    const gs = [...seg.segment(txt)].map((s) => s.segment);
    const ws = gs.map((g) => c.measureText(g).width), total = ws.reduce((a, b) => a + b, 0);
    let x = W / 2 - total / 2; const y = y0 + li * tam * 1.08;
    gs.forEach((g, i) => {
      const tau = t - t0 - k++ * 0.035;
      if (tau > 0 && g.trim()) {
        const s = resorte(tau, 8, 16);
        c.save(); c.translate(x + ws[i] / 2, y - tam * 0.35); c.scale(s, s); c.rotate((1 - clamp(s, 0, 1)) * 0.35); c.translate(0, tam * 0.35);
        c.globalAlpha = clamp(tau / 0.08, 0, 1);
        if (!esEmoji(g)) {
          c.shadowColor = "rgba(10,20,50,0.45)"; c.shadowBlur = 26; c.shadowOffsetY = 12;
          c.strokeStyle = "#16203a"; c.lineWidth = tam * 0.16; c.strokeText(g, -ws[i] / 2, 0); c.shadowColor = "transparent";
        }
        c.fillStyle = colores[li % colores.length]; c.fillText(g, -ws[i] / 2, 0);
        c.restore();
      }
      x += ws[i];
    });
  });
}
function etiqueta(c, txt, x, y, t, t0, col = "#ffffff", fondo = "#16203a", tam = 58, rot = -0.05) {
  const tau = t - t0; if (tau < 0) return;
  const s = resorte(tau, 9, 18);
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.font = `700 ${tam}px Fredoka, "Noto Color Emoji"`; const w = c.measureText(txt).width;
  c.fillStyle = fondo; redondo(c, -w / 2 - 28, -tam * 0.9, w + 56, tam * 1.35, 26); c.fill();
  c.fillStyle = col; c.textAlign = "center"; c.fillText(txt, 0, tam * 0.2); c.textAlign = "left";
  c.restore();
}
function redondo(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function emoji(c, e, x, y, tam, s = 1, rot = 0, alfa = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha = alfa;
  c.font = `${tam}px "Noto Color Emoji"`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(e, 0, 0);
  c.restore();
}

// ---------- cámara ----------
// cam: { x, y (punto del mundo al centro), z (zoom), rot }
function conCamara(c, cam, capas) {
  for (const [prof, fn] of capas) {
    c.save();
    const z = 1 + (cam.z - 1) * prof;
    c.translate(W / 2, H / 2); c.rotate((cam.rot || 0) * prof); c.scale(z, z);
    c.translate(-(W / 2 + (cam.x - W / 2) * prof), -(H / 2 + (cam.y - H / 2) * prof));
    fn(); c.restore();
  }
}
function vineta(c, fuerza = 0.45) {
  const v = c.createRadialGradient(W / 2, H * 0.5, H * 0.32, W / 2, H * 0.5, H * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, `rgba(10,20,45,${fuerza})`);
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
function destello(c, a, col = "255,255,255") { if (a > 0) { c.fillStyle = `rgba(${col},${clamp(a, 0, 1)})`; c.fillRect(0, 0, W, H); } }

// iris: círculo que se cierra (p: 1 → 0) o se abre (p: 0 → 1) sobre (x, y)
function iris(c, p, x, y) {
  if (p >= 1) return;
  const r = Math.max(0, p) * 1300;
  c.save(); c.fillStyle = "#0e1424"; c.beginPath(); c.rect(0, 0, W, H); c.arc(x, y, r, 0, 7, true); c.fill("evenodd"); c.restore();
}


// ---------- transición de ráfaga de nieve entre escenas 1 y 2 ----------
function rafaga(c, p) {
  if (p <= 0 || p >= 1) return;
  const r = rnd(55);
  c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const y = r() * H, len = 200 + r() * 500, x = lerp(-700, W + 700, clamp(p * 1.4 - r() * 0.4, 0, 1)) + (r() - 0.5) * 300;
    c.lineWidth = 6 + r() * 18; c.beginPath(); c.moveTo(x, y); c.lineTo(x - len, y + 30); c.stroke();
  }
  c.fillStyle = `rgba(255,255,255,${Math.sin(p * Math.PI) * 0.85})`; c.fillRect(0, 0, W, H);
}

// explosión de corazones (o cualquier forma) desde (x, y), pc = segundos desde que empezó
function explosionCorazones(c, pc, x = 540, y = 1150, n = 26, semilla = 91) {
  const r = rnd(semilla);
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, vel = 500 + r() * 900, life = clamp(1 - pc / 1.8, 0, 1);
    if (life <= 0) break;
    const px = x + Math.cos(a) * vel * salida(pc / 1.2), py = y + Math.sin(a) * vel * salida(pc / 1.2) - pc * 120;
    c.globalAlpha = life; corazon(c, px, py, 22 + r() * 26, r() > 0.5 ? C.rosa : "#ff3b6b"); c.globalAlpha = 1;
  }
}

// ---------- marco general ----------
// escenas.js define: ESC (lista de funciones escenaN(c, t)), eventos(), EMOJIS (texto con los emojis usados)
// y opcionalmente RAFAGAS (índices de escena que empiezan con ráfaga de nieve/viento).
function cuadro(c, T) {
  let k = NESC - 1; for (let i = 0; i < NESC; i++) if (T < INI[i] + DUR[i]) { k = i; break; }
  const t = T - INI[k];
  c.save(); ESC[k](c, t); c.restore();
  for (const e of (typeof RAFAGAS !== "undefined" ? RAFAGAS : [])) { const tr = T - (INI[e] - 0.45); if (tr > 0 && tr < 0.8) rafaga(c, tr / 0.8); }
}
function render(T, fps = 60, muestras = 4) {
  const obt = 0.5 / fps;
  ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < muestras; i++) {
    const ti = T - obt / 2 + (obt * (i + 0.5)) / muestras;
    sx.clearRect(0, 0, W, H); cuadro(sx, clamp(ti, 0, TOTAL - 1e-4));
    ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(sub, 0, 0);
  }
  ctx.globalAlpha = 1;
}
// sonidos sincronizados (segundos globales)
window.preparar = async () => { await document.fonts.load("700 128px Fredoka"); await document.fonts.load('64px "Noto Color Emoji"', typeof EMOJIS !== "undefined" ? EMOJIS : "✨"); };
window.render = render; window.TOTAL = TOTAL; window.INI = INI; window.VO = VO; window.DUR = DUR; // eventos() lo define escenas.js (queda global)
