// Short "cuervos y máscaras" en pixel art, dibujado 100% con código.
// Lienzo de 216x384 que luego se amplía x5 (1080x1920) sin suavizado.
// render(t) dibuja el cuadro del segundo t. EVENTOS lista los sonidos (graznidos, etc.).

const W = 216, H = 384;
const cv = document.getElementById("c");
let ctx = cv.getContext("2d");
const off = document.createElement("canvas"); off.width = W; off.height = H;
const octx = off.getContext("2d");
// Dibuja el "mundo" en otro lienzo y lo muestra ampliado x2 desde (x0, y0): cámara cercana con píxeles parejos.
function mundo(fn, x0, y0) {
  const m = ctx; ctx = octx; ctx.clearRect(0, 0, W, H); fn(); ctx = m;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, Math.round(x0), Math.round(y0), W / 2, H / 2, 0, 0, W, H);
}
cv.width = W; cv.height = H;

// ---------- tiempos (segundos, medidos de la narración) ----------
const DUR = [4.7908, 10.6161, 21.5876, 10.9557, 10.0010];
const INI = DUR.reduce((a, d, i) => (a.push(i ? a[i - 1] + DUR[i - 1] : 0), a), []);
const TOTAL = INI[4] + DUR[4];

// ---------- paleta ----------
const P = {
  neg: "#0d0b14", tinta: "#1b1726", pluma: "#2b2840", brillo: "#4a4f7a", pico: "#3c3a4a",
  blanco: "#f4f1e8", gris: "#8b8796", grisO: "#55515f",
  ama: "#ffd43b", nar: "#ff8c2b", nar2: "#e0592a", rojo: "#e62117", rojoO: "#9e1810",
  cielo1: "#2b1b4a", cielo2: "#6a2c5e", cielo3: "#c4466a", cielo4: "#f08a4b", cielo5: "#ffc86b",
  azulD: "#1e2a4a", azul: "#3a5a8c", celeste: "#8fc3e8", celeste2: "#c8e6f5",
  verde: "#2f6b3a", verdeC: "#4f9a4a", verdeO: "#1d4127", pasto: "#5c8f3a",
  cafe: "#5a3a26", cafeC: "#8a5a36", cafeO: "#3a2418", piel: "#c98a5a",
  piedra: "#c9b48a", piedraO: "#9a8462", piedraC: "#e3d2a6", vidrio: "#3d5f7a",
  otono1: "#d9622b", otono2: "#f2a33a", otono3: "#a83a22",
  jeans: "#3d5a8a", jeansO: "#2b4066", chaqueta: "#4f6a3a", chaquetaO: "#3a4f2a", gorroA: "#7a3a5a",
  mascara: "#c9a060", mascaraO: "#6a4024", mascaraC: "#e6c088", pelo: "#2a1a10",
  madera: "#6b4228", maderaC: "#8a5a36", maderaO: "#4a2c1a", pared: "#3a2a3a", paredC: "#4a3648",
  luz: "#ffe7a0",
};

// ---------- utilidades de píxel ----------
let rnd = mulberry(7);
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (p) => { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
const lerp = (a, b, p) => a + (b - a) * p;
function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(x, y, c) { rect(x, y, 1, 1, c); }
function elipse(cx, cy, rx, ry, c) {
  cx = Math.round(cx); cy = Math.round(cy);
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.35) * (ry + 0.35)))));
    if (w >= 0) ctx.fillRect(cx - w, cy + y, 2 * w + 1, 1);
  }
}
function poligono(pts, c) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  ctx.fillStyle = c;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      const yc = y + 0.5;
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.round(xs[i]), b = Math.round(xs[i + 1]); if (b > a) ctx.fillRect(a, y, b - a, 1); }
  }
}
// Matriz de Bayer 4x4 para degradados con tramado
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
// Degradado vertical tramado entre una lista de colores
function degradado(x, y, w, h, cols) {
  for (let j = 0; j < h; j++) {
    const f = (j / Math.max(1, h - 1)) * (cols.length - 1);
    const i = Math.min(cols.length - 2, Math.floor(f)), r = f - i;
    for (let k = 0; k < w; k++) px(x + k, y + j, r > bayer(x + k, y + j) ? cols[i + 1] : cols[i]);
  }
}
// Oscurece con tramado (0..1): transiciones e iluminación
function sombra(nivel, x = 0, y = 0, w = W, h = H, c = P.neg) {
  if (nivel <= 0) return;
  ctx.fillStyle = c;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (nivel > bayer(i, j)) ctx.fillRect(i, j, 1, 1);
}
function sprite(rows, pal, x, y, flip = false) {
  x = Math.round(x); y = Math.round(y);
  const w = rows[0].length;
  rows.forEach((r, j) => { for (let i = 0; i < w; i++) { const ch = r[i]; if (ch !== "." && pal[ch]) px(x + (flip ? w - 1 - i : i), y + j, pal[ch]); } });
}

// ---------- fuente bitmap 5x7 ----------
const F = Object.fromEntries(Object.entries({
  A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.", C: ".####|#....|#....|#....|#....|#....|.####",
  D: "####.|#...#|#...#|#...#|#...#|#...#|####.", E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
  G: ".####|#....|#....|#.###|#...#|#...#|.###.", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#", I: ".###.|..#..|..#..|..#..|..#..|..#..|.###.",
  J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..", K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
  M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#", O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
  P: "####.|#...#|#...#|####.|#....|#....|#....", Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
  S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..", U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
  V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
  Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
  "?": ".###.|#...#|....#|...#.|..#..|.....|..#..", "¿": "..#..|.....|..#..|.#...|#....|#...#|.###.", "!": "..#..|..#..|..#..|..#..|..#..|.....|..#..",
  ":": ".....|..#..|..#..|.....|..#..|..#..|.....", ".": ".....|.....|.....|.....|.....|..#..|..#..", " ": ".....|.....|.....|.....|.....|.....|.....",
}).map(([k, v]) => [k, v.replaceAll("|", "")]));
const ACENTO = { "Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U", "Ñ": "N" };
function medirTexto(s, e) { return s.length * 6 * e - e; }
function letra(ch, x, y, e, c) {
  const base = ACENTO[ch] || ch, g = F[base] || F[" "];
  ctx.fillStyle = c;
  for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) if (g[j * 5 + i] === "#") ctx.fillRect(x + i * e, y + j * e, e, e);
  if (ACENTO[ch]) {
    if (ch === "Ñ") { ctx.fillRect(x + 1 * e, y - 2 * e, 2 * e, e); ctx.fillRect(x + 3 * e, y - 2 * e, e, e); }
    else { ctx.fillRect(x + 3 * e, y - 3 * e, e, e); ctx.fillRect(x + 2 * e, y - 2 * e, e, e); }
  }
}
// Texto centrado en cx, con contorno negro de 1 píxel y sombra
function texto(s, cx, y, e = 2, c = P.blanco, cont = P.neg) {
  s = s.toUpperCase();
  const x0 = Math.round(cx - medirTexto(s, e) / 2);
  const pasada = (dx, dy, col) => { for (let i = 0; i < s.length; i++) letra(s[i], x0 + i * 6 * e + dx, y + dy, e, col); };
  if (cont) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [-1, 2]]) pasada(dx, dy, cont); }
  pasada(0, 0, c);
}
// Texto con aparición "pop" (crece de 0 a tamaño final en 0.2 s)
function titulo(lineas, t, y = 14, e = 3) {
  if (t < 0) return;
  const sube = Math.round((1 - ease(t / 0.18)) * 6);
  lineas.forEach((l, i) => {
    const [s, c] = Array.isArray(l) ? l : [l, P.blanco];
    texto(s, W / 2, y + i * (8 * e + 4) - sube, e, c);
  });
}
function insignia(letraS, x, y, activo, t) {
  const pulso = activo ? Math.round(Math.sin(t * 12) > 0 ? 1 : 0) : 0;
  rect(x - 1 - pulso, y - 1 - pulso, 22 + 2 * pulso, 22 + 2 * pulso, P.neg);
  rect(x - pulso, y - pulso, 20 + 2 * pulso, 20 + 2 * pulso, activo ? P.ama : "#b8a040");
  texto(letraS, x + 10, y + 3, 2, P.neg, null);
}

// ---------- cuervos ----------
const PAL_C = { k: P.tinta, d: P.pluma, b: P.brillo, y: P.pico, e: P.blanco, l: P.grisO, o: P.nar };
const VUELA = [
  ["....kk........", "....kkk.......", ".....kkk......", "kk...kkkkkk...", ".kkkkkkkkkkeyy", "...kkkkkkkk...", "..............", ".............."],
  ["..............", "..............", "..............", "kk...kkkkkk...", ".kkkkkkkkkkeyy", "...kkkkdkkk...", ".....kkk......", "....kkk......."],
];
const POSADO = [
  "......kkk...", ".....kkkkk..", ".....kkekkyy", "....kkkkkky.", "...kkkkkkk..",
  "..kkddkkkk..", ".kkdddkkkk..", "kkkddkkkk...", "kk..kkkk....", ".....l.l....", "....ll.ll...",
];
// cuervo pequeño volando; graznando abre el pico; anillo = marcado por los científicos
function cuervoVuela(x, y, t, flip, anillo = false, grazna = false) {
  const f = Math.floor(t * 8) % 2;
  sprite(VUELA[f], PAL_C, x, y, flip);
  if (grazna) { const bx = flip ? x - 2 : x + 14; px(bx, y + 3, P.pico); px(bx, y + 5, P.pico); }
  if (anillo) px(flip ? x + 8 : x + 5, y + 6, P.nar);
}
function cuervoPosado(x, y, flip, anillo = false) {
  sprite(POSADO, PAL_C, x, y, flip);
  if (anillo) px(flip ? x + 12 - 1 - 5 : x + 5, y + 9, P.nar);
}
// cuervo grande procedural (perfil mirando a la derecha). s = escala de formas, inc = inclinación de cabeza
function cuervoGrande(cx, cy, s, t, inc = 0, parpadeo = false) {
  // cola
  poligono([[cx - 20 * s, cy + 6 * s], [cx - 34 * s, cy + 26 * s], [cx - 24 * s, cy + 28 * s], [cx - 10 * s, cy + 12 * s]], P.tinta);
  // cuerpo
  elipse(cx, cy, Math.round(17 * s), Math.round(14 * s), P.tinta);
  // ala con brillo tramado
  elipse(cx - 4 * s, cy + 2 * s, Math.round(13 * s), Math.round(9 * s), P.pluma);
  for (let j = -6; j < 6; j++) for (let i = -10; i < 8; i++) {
    const X = Math.round(cx - 4 * s + i * s), Y = Math.round(cy + 2 * s + j * s * 0.8);
    if ((i + j) % 3 === 0 && j < 0 && i > -6) px(X, Y, P.brillo);
  }
  // cabeza (se ladea con inc)
  const hx = cx + 12 * s + inc * 2 * s, hy = cy - 14 * s + Math.abs(inc) * 1.5 * s;
  elipse(cx + 8 * s, cy - 8 * s, Math.round(9 * s), Math.round(8 * s), P.tinta); // cuello
  elipse(hx, hy, Math.round(10 * s), Math.round(9 * s), P.tinta);
  // pico
  const by = hy + 1 * s + inc * 2 * s;
  poligono([[hx + 6 * s, by - 4 * s], [hx + 22 * s, by + 1 * s], [hx + 6 * s, by + 4 * s]], P.pico);
  rect(hx + 8 * s, by, 12 * s, 1, P.neg);
  px(hx + 10 * s, by - 2 * s, P.gris);
  // ojo mirando a cámara
  const ex = Math.round(hx + 3 * s), ey = Math.round(hy - 2 * s);
  if (parpadeo) rect(ex - 2 * s, ey, 5 * s, Math.max(1, s), P.pluma);
  else { elipse(ex, ey, Math.round(2.5 * s), Math.round(2.5 * s), P.neg); rect(ex - Math.round(s), ey - Math.round(s), Math.max(1, s), Math.max(1, s), P.blanco); }
  // brillo de la cabeza
  rect(hx - 4 * s, hy - 7 * s, 6 * s, Math.max(1, s), P.brillo);
  return { hx, hy };
}

// ---------- personas ----------
// tipo: "cavernario" (máscara de las capturas) o "neutra" (máscara blanca)
function persona(x, y, t, tipo, anda = true, agacha = 0, colores = {}) {
  x = Math.round(x); y = Math.round(y);
  const ch = colores.chaqueta || P.chaqueta, chO = colores.chaquetaO || P.chaquetaO, pa = colores.pantalon || P.jeans;
  const f = anda ? Math.floor(t * 6) % 4 : 0;
  const pierna = [[0, 0], [2, -1], [0, 0], [-2, -1]][f];
  // piernas
  rect(x + 1 + pierna[0], y + 22 + agacha, 3, 12 - agacha + pierna[1], pa);
  rect(x + 6 - pierna[0], y + 22 + agacha, 3, 12 - agacha - pierna[1], P.jeansO);
  rect(x + pierna[0], y + 33 + pierna[1], 5, 2, P.neg);
  rect(x + 5 - pierna[0], y + 33 - pierna[1], 5, 2, P.neg);
  // torso
  rect(x - 1, y + 10 + agacha, 12, 13, ch);
  rect(x - 1, y + 20 + agacha, 12, 2, chO);
  rect(x + 4, y + 10 + agacha, 2, 12, chO);
  // brazos (si agacha, los sube a la cabeza)
  if (agacha) { rect(x - 3, y + 2 + agacha, 3, 10, ch); rect(x + 10, y + 2 + agacha, 3, 10, ch); rect(x - 3, y + 1 + agacha, 3, 2, P.piel); rect(x + 10, y + 1 + agacha, 3, 2, P.piel); }
  else { const b = anda ? [0, 1, 0, -1][f] : 0; rect(x - 3, y + 11 + b, 3, 10, chO); rect(x + 10, y + 11 - b, 3, 10, chO); rect(x - 3, y + 21 + b, 3, 2, P.piel); rect(x + 10, y + 21 - b, 3, 2, P.piel); }
  mascara(x + 5, y + 4 + agacha, tipo);
}
function mascara(cx, cy, tipo) {
  if (tipo === "cavernario") {
    elipse(cx, cy - 1, 7, 7, P.pelo);          // melena
    elipse(cx, cy + 1, 5, 6, P.mascara);       // cara
    rect(cx - 4, cy - 2, 8, 1, P.mascaraO);    // ceja gruesa
    px(cx - 2, cy, P.neg); px(cx + 2, cy, P.neg);
    rect(cx - 1, cy + 1, 2, 2, P.mascaraC);    // nariz
    rect(cx - 3, cy + 4, 7, 2, P.mascaraO);    // boca
    px(cx - 2, cy + 4, P.blanco); px(cx, cy + 4, P.blanco); px(cx + 2, cy + 4, P.blanco);
    px(cx - 5, cy + 3, P.pelo); px(cx + 5, cy + 3, P.pelo);
  } else {
    elipse(cx, cy, 5, 6, P.blanco);
    px(cx - 2, cy, P.neg); px(cx + 2, cy, P.neg);
    rect(cx - 1, cy + 3, 3, 1, P.gris);
    rect(cx - 5, cy - 6, 11, 2, P.cafeO);      // pelo
  }
}
function globoGraz(x, y, t0, t) {
  const v = t - t0; if (v < 0 || v > 0.6) return;
  const sube = Math.round(v * 8);
  rect(x - 13, y - 11 - sube, 27, 11, P.neg);
  rect(x - 12, y - 10 - sube, 25, 9, P.blanco);
  px(x - 2, y - 1 - sube, P.blanco); px(x - 3, y - sube, P.blanco);
  texto("CRA!", x, y - 9 - sube, 1, P.neg, null);
}

// ---------- fondos ----------
function campus(t, desp = 0) {
  degradado(0, 0, W, 210, [P.celeste, P.celeste2, "#f5d8a8"]);
  // nubes
  for (let i = 0; i < 4; i++) { const cx = ((i * 71 + t * 3 + 400) % 300) - 40; elipse(cx, 40 + i * 22, 14, 4, "#eef6fb"); elipse(cx + 9, 37 + i * 22, 8, 4, "#eef6fb"); }
  // edificio con torre (piedra)
  const bx = 120 - desp * 0.3;
  rect(bx, 120, 110, 110, P.piedra);
  rect(bx + 30, 60, 30, 70, P.piedra);
  poligono([[bx + 28, 62], [bx + 45, 36], [bx + 62, 62]], P.piedraO);
  for (let i = 0; i < 5; i++) rect(bx + 30 + i * 7, 56, 4, 5, P.piedra);
  rect(bx + 40, 75, 10, 16, P.vidrio); rect(bx + 44, 75, 2, 16, P.piedraO);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) { rect(bx + 6 + c * 17, 132 + r * 28, 8, 14, P.vidrio); px(bx + 6 + c * 17, 132 + r * 28, P.piedraC); }
  rect(bx, 120, 110, 3, P.piedraC); rect(bx + 30, 60, 30, 2, P.piedraC);
  // edificio izquierdo
  const ax = -30 - desp * 0.3;
  rect(ax, 150, 80, 80, "#b8a27a"); for (let c = 0; c < 4; c++) rect(ax + 8 + c * 18, 165, 8, 12, P.vidrio);
  // pasto y camino
  rect(0, 210, W, 174, P.pasto);
  for (let j = 210; j < H; j += 3) for (let i = (j * 7) % 11; i < W; i += 11) px(i, j, P.verdeC);
  poligono([[95, 210], [121, 210], [W + 40, H], [-40, H]], "#b7ab9a");
  for (let j = 214; j < H; j += 9) { const w = lerp(26, 260, (j - 210) / 174); rect(108 - w / 2, j, w, 1, "#a2967f"); }
  // árboles de otoño
  arbol(22 - desp * 0.6, 214, 1.0, t); arbol(196 - desp * 0.6, 220, 1.1, t + 1); arbol(70 - desp * 0.4, 205, 0.7, t + 2); arbol(160 - desp * 0.4, 204, 0.65, t + 3);
  // faroles
  farol(46 - desp * 0.7, 250); farol(176 - desp * 0.7, 255);
}
function arbol(x, base, s, t) {
  rect(x - 2 * s, base - 30 * s, 5 * s, 30 * s, P.cafe);
  const m = Math.round(Math.sin(t * 1.5) * 1);
  elipse(x + m, base - 42 * s, Math.round(18 * s), Math.round(16 * s), P.otono3);
  elipse(x - 5 * s + m, base - 46 * s, Math.round(12 * s), Math.round(11 * s), P.otono1);
  elipse(x + 6 * s + m, base - 50 * s, Math.round(9 * s), Math.round(8 * s), P.otono2);
}
function farol(x, base) { rect(x, base - 36, 2, 36, P.neg); rect(x - 2, base - 40, 6, 5, P.neg); rect(x - 1, base - 39, 4, 3, P.luz); }

function hojasCayendo(t, n = 8, cols = [P.otono1, P.otono2]) {
  const r = mulberry(99);
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, v = 12 + r() * 14, f = r() * 10;
    const y = ((t * v + r() * H) % (H + 20)) - 10;
    const x = x0 + Math.sin(t * 2 + f) * 6;
    px(x, y, cols[i % cols.length]); px(x + 1, y, cols[i % cols.length]);
  }
}

// ---------- escenas ----------
function escena1(t) {
  // atardecer
  degradado(0, 0, W, 260, [P.cielo1, P.cielo2, P.cielo3, P.cielo4, P.cielo5]);
  elipse(150, 200, 22, 22, "#ffe08a"); elipse(150, 200, 18, 18, "#fff2c0");
  // colinas
  for (let i = 0; i < W; i++) { const h1 = 230 + Math.sin(i * 0.04) * 8 + Math.sin(i * 0.11) * 3; rect(i, h1, 1, H - h1, "#4a2350"); }
  for (let i = 0; i < W; i++) { const h2 = 260 + Math.sin(i * 0.05 + 2) * 10; rect(i, h2, 1, H - h2, "#2e1838"); }
  // río reflejando
  for (let j = 268; j < 300; j += 3) rect(110 + Math.sin(j + t * 3) * 6, j, 60 - (j - 268), 1, "#f6a35a");
  rect(0, 300, W, 84, P.tinta);
  // rama
  poligono([[-10, 290], [170, 262], [172, 270], [-10, 304]], P.cafeO);
  poligono([[-10, 292], [168, 264], [168, 266], [-10, 296]], P.cafe);
  poligono([[120, 268], [150, 248], [152, 252], [124, 272]], P.cafeO);
  // hojas en la rama
  for (const [hx, hy] of [[150, 246], [158, 243], [30, 284], [10, 290]]) { elipse(hx, hy, 4, 2, P.verdeO); px(hx, hy - 1, P.verde); }
  // cuervo grande: zoom lento hacia la cámara
  const s = lerp(2.0, 2.25, ease(t / DUR[0]));
  const parp = (t % 2.2) > 2.05;
  cuervoGrande(88, 222, s, t, 0, parp);
  hojasCayendo(t, 6, [P.otono2, P.cielo4]);
  titulo(["NO TE", ["OLVIDAN", P.ama]], t - 0.05, 20, 4);
}

function escena2(t) {
  const H2 = 190;
  // panel A: bosque con cámara oculta
  degradado(0, 0, W, H2, [P.verdeO, P.verde, "#3c7a44"]);
  for (let i = 0; i < 7; i++) rect(i * 34 - 6, 0, 10, H2, i % 2 ? "#24502c" : "#1a3d22");
  rect(70, 0, 52, H2, P.cafe); for (let j = 0; j < H2; j += 6) rect(74 + (j % 12), j, 2, 4, P.cafeO);
  rect(68, 92, 56, 6, P.neg); // correa
  // cámara camuflada
  rect(78, 78, 36, 44, "#5a5a3a"); rect(80, 80, 32, 40, "#6f6f45");
  for (const [a, b] of [[82, 84], [96, 92], [86, 106], [102, 110]]) rect(a, b, 7, 5, "#4a4a2e");
  elipse(96, 98, 6, 6, P.neg); elipse(96, 98, 3, 3, "#3a4a6a"); px(95, 97, P.celeste2);
  rect(84, 84, 6, 3, P.neg);
  if (Math.floor(t * 2) % 2 === 0) rect(105, 84, 3, 3, P.rojo); else rect(105, 84, 3, 3, P.rojoO);
  // hojas al frente
  for (let i = 0; i < 9; i++) elipse(i * 26 + 5, 175 + (i % 2) * 6, 12, 8, i % 2 ? P.verdeC : P.verde);
  for (let i = 0; i < 6; i++) elipse(150 + (i % 3) * 18, 20 + Math.floor(i / 3) * 18 + Math.round(Math.sin(t * 2 + i)), 10, 6, P.verdeC);

  // separador
  rect(0, H2, W, 4, P.neg);
  // panel B: mesa con lámpara y máscara
  const y0 = H2 + 4;
  rect(0, y0, W, H - y0, P.pared);
  for (let j = y0; j < H; j += 12) rect(0, j, W, 1, P.paredC);
  // cono de luz tramado
  for (let j = y0 + 40; j < y0 + 150; j++) {
    const w = (j - y0 - 40) * 0.8 + 10;
    for (let i = Math.round(150 - w); i < 150 + w; i++) if (0.35 > bayer(i, j)) px(i, j, "#6a5040");
  }
  // lámpara
  rect(182, y0 + 20, 3, 100, P.neg);
  poligono([[140, y0 + 40], [160, y0 + 22], [190, y0 + 22], [176, y0 + 40]], "#3a4a3a");
  rect(140, y0 + 40, 36, 2, P.luz);
  // mesa
  rect(0, y0 + 140, W, 10, P.maderaC); rect(0, y0 + 150, W, H, P.madera);
  for (let i = 0; i < W; i += 17) rect(i, y0 + 152, 9, 1, P.maderaO);
  // máscara grande de cavernario sobre la mesa
  const mx = 110, my = y0 + 112;
  elipse(mx, my, 40, 30, P.pelo);
  for (let i = -36; i <= 36; i += 6) rect(mx + i, my + 22 + (i % 12 === 0 ? 4 : 0), 3, 8, P.pelo);
  elipse(mx, my + 4, 28, 26, P.mascara);
  rect(mx - 24, my - 10, 48, 6, P.mascaraO); // ceja
  elipse(mx - 11, my + 2, 6, 4, P.neg); elipse(mx + 11, my + 2, 6, 4, P.neg);
  elipse(mx, my + 12, 6, 6, P.mascaraC); px(mx - 2, my + 15, P.mascaraO); px(mx + 2, my + 15, P.mascaraO);
  rect(mx - 10, my + 22, 20, 3, P.mascaraO); rect(mx - 7, my + 22, 3, 2, P.piedraC); rect(mx + 3, my + 22, 3, 2, P.piedraC);
  for (let j = -18; j < 28; j += 5) px(mx - 20 + (j % 3), my + j, P.mascaraC);

  // resaltar A (3.3–5.2 s) y B (5.3–7.5 s)
  const aOn = t > 3.25 && t < 5.25, bOn = t > 5.3 && t < 7.6;
  if (bOn) sombra(0.45, 0, 0, W, H2); else if (aOn) sombra(0.45, 0, y0, W, H - y0);
  insignia("A", 10, 24, aOn, t); insignia("B", 10, y0 + 12, bOn, t);
  // título arriba
  titulo([["¿A O B?", P.blanco]], t - 0.1, 4, 3);
  // barra de cuenta regresiva "piensa tu respuesta" (7.8 s → fin)
  if (t > 7.7) {
    const p = clamp((t - 7.7) / (DUR[1] - 7.9), 0, 1);
    rect(20, H - 22, W - 40, 10, P.neg);
    rect(22, H - 20, Math.round((W - 44) * (1 - p)), 6, p > 0.7 ? P.rojo : P.ama);
    texto("PIENSA...", W / 2, H - 36, 1, P.blanco);
  }
}

// Escena 3: captura y marcado → los cuervos lo atacan → años después → otros cuervos se suman
const S3 = { suelta: 6.6, ataque: 6.7, anios: 12.8, otros: 15.75 };
function escena3(t) {
  const camina = t > S3.ataque;
  const desp = camina ? (t - S3.ataque) * 4 : 0;
  const xP = 102, yP = 268, pos = [];
  mundo(() => {
    campus(t, desp);
    if (!camina) {
      // investigador (con la máscara) marca un cuervo y lo suelta
      persona(xP, yP, t, "cavernario", false);
      const marca = t > 2.4, suelto = t > 4.4;
      if (!suelto) {
        cuervoPosado(xP + 12, yP + 9, false, marca);
        if (t > 2.4 && t < 2.9) { const r = Math.round((t - 2.4) * 16); for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) px(xP + 17 + dx, yP + 18 + dy, P.ama); }
      } else {
        const v = t - 4.4;
        cuervoVuela(xP + 14 + v * 30, yP + 8 - v * 30 - v * v * 6, t, false, true);
      }
      // otros dos cuervos ya marcados, posados cerca
      cuervoPosado(64, 292, false, t > 1.2); cuervoPosado(132, 294, true, t > 1.8);
    } else {
      const tc = t - S3.ataque;
      persona(xP, yP, t, "cavernario", true, tc > 0.6 ? 6 : 0);
      // 3 cuervos marcados y, después, cuervos nuevos (sin anillo)
      const n = nCuervos(t);
      for (let i = 0; i < n; i++) {
        const nuevo = i >= 3;
        const ent = nuevo ? clamp((t - S3.otros - (i - 3) / 3) / 0.8, 0, 1) : clamp(tc / 0.8, 0, 1);
        const fase = i * 1.7, w = 1.6 + (i % 3) * 0.35;
        const R = 18 + (i % 4) * 8;
        let x = xP + 5 + Math.cos(t * w + fase) * R;
        let y = yP - 14 + Math.sin(t * w * 2 + fase) * 9 - (i % 3) * 9;
        const ox = i % 2 ? 175 : 30, oy = 160 + ((i * 23) % 50);
        x = lerp(ox, x, ease(ent)); y = lerp(oy, y, ease(ent));
        const flip = Math.sin(t * w + fase) > 0;
        cuervoVuela(x - 7, y - 4, t + i * 0.3, flip, !nuevo, grazna(i, t));
        pos.push([x, y, i]);
      }
      hojasCayendo(t, 10);
    }
  }, 53, 153);
  // textos (a tamaño normal, sobre la cámara)
  if (!camina && t < 6.4) texto(t < 4.4 ? "LO MARCAN..." : "...Y LO SUELTAN", W / 2, H - 34, 2, P.blanco);
  if (camina) {
    // globos "CRA!" sobre los cuervos que graznan (en coordenadas de pantalla)
    for (const [x, y, i] of pos) {
      const ph = (t + ((i * 0.53) % 1.6)) % 1.6;
      if (ph < 0.45) globoGraz(clamp((x - 53) * 2, 16, W - 16), (y - 153) * 2 - 12, 0, ph);
    }
  }
  if (t > S3.anios && t < S3.otros + 0.3) {
    sombra(0.3 * Math.min(1, (t - S3.anios) * 3));
    texto("AÑOS DESPUÉS...", W / 2, 150, 2, P.ama);
  }
  if (t > S3.otros) titulo(["SE LO CONTARON", ["A OTROS", P.ama]], t - S3.otros, 14, 2);
}
const nCuervos = (t) => (t > S3.otros ? 3 + Math.min(7, Math.floor((t - S3.otros) * 3)) : 3);
const grazna = (i, t) => ((t + ((i * 0.53) % 1.6)) % 1.6) < 0.25;
// graznidos (para los sonidos): mismos tiempos que los globos de la escena 3
function graznidos() {
  const ev = [];
  for (let t = S3.ataque; t < DUR[2]; t += 1 / 30) {
    for (let i = 0; i < nCuervos(t); i++) {
      const tg = (i * 0.53) % 1.6, ph = (t + tg) % 1.6;
      if (ph < 1 / 30) ev.push({ t: INI[2] + t, tipo: "cra", i });
    }
  }
  return ev;
}

function escena4(t) {
  const xA = 62, xB = lerp(170, 128, ease((t - 6.9) / 1.6));
  mundo(() => {
    campus(t + 20, 30);
    // izquierda: la máscara de las capturas → atacado
    persona(xA, 272, t, "cavernario", false, 6);
    for (let i = 0; i < 6; i++) {
      const fase = i * 1.05, w = 2 + (i % 3) * 0.4, R = 14 + (i % 3) * 6;
      const x = xA + 5 + Math.cos(t * w + fase) * R, y = 258 + Math.sin(t * w * 2 + fase) * 8 - (i % 4) * 7;
      cuervoVuela(x - 7, y, t + i * 0.2, Math.sin(t * w + fase) > 0, i < 3, ((t + i * 0.4) % 1.2) < 0.25);
    }
    // derecha: otra máscara → tranquilo e ignorado (entra a los 6.9 s)
    if (t > 6.8) {
      persona(xB, 270, t, "neutra", t < 8.5, 0, { chaqueta: P.gorroA, chaquetaO: "#5a2a44", pantalon: P.cafeC });
      cuervoPosado(xB + 16, 294, true);
    }
  }, 46, 153);
  const sx = (x) => (x - 46) * 2;
  if (t > 6.8) {
    const xc = sx(xB + 5);
    if (t > 8.6) { rect(xc - 9, 172, 19, 13, P.neg); texto("OK", xc, 175, 1, "#6fe06f", null); }
    if (t > 9.3) texto("ZZZ", sx(xB + 30), 250 - Math.round((t * 4) % 6), 1, P.blanco);
  }
  if (t < 0.25) sombra(1 - t / 0.25, 0, 0, W, H, P.blanco);
  titulo(["ERA LA B:", ["MÁSCARAS", P.ama]], t - 0.05, 16, 3);
  if (t > 9.3) texto("RECONOCEN LA CARA", W / 2, H - 34, 2, P.blanco);
}

function escena5(t) {
  // pared interior
  rect(0, 0, W, H, P.pared);
  for (let j = 0; j < H; j += 8) for (let i = (j / 8) % 2 ? 0 : 8; i < W; i += 16) rect(i, j, 1, 8, P.paredC);
  // ventana con atardecer
  const vx = 28, vy = 70, vw = 160, vh = 170;
  rect(vx - 8, vy - 8, vw + 16, vh + 24, P.maderaO);
  degradado(vx, vy, vw, vh, [P.cielo1, P.cielo2, P.cielo3, P.cielo4]);
  for (let i = 0; i < 9; i++) { const bh = 30 + ((i * 37) % 50); rect(vx + i * 18, vy + vh - bh, 16, bh, "#2a1a3a"); if (i % 2) { px(vx + i * 18 + 5, vy + vh - bh + 8, P.luz); px(vx + i * 18 + 9, vy + vh - bh + 16, P.luz); } }
  rect(vx + vw / 2 - 2, vy, 4, vh, P.maderaO); rect(vx, vy + vh / 2 - 2, vw, 3, P.maderaO);
  // alféizar y cuervo mirando adentro, ladeando la cabeza
  const inc = Math.floor(t / 1.1) % 2 ? 1 : -0.6;
  cuervoGrande(104, vy + vh - 30, 1.35, t, inc, (t % 3) > 2.85);
  rect(vx - 12, vy + vh, vw + 24, 10, P.maderaC); rect(vx - 12, vy + vh + 10, vw + 24, 3, P.maderaO);
  // reflejo en el vidrio
  for (let k = 0; k < 18; k++) px(vx + 12 + k, vy + 30 - k, "#ffffff22");
  // mesa con lámpara
  rect(0, 320, W, 64, P.madera); rect(0, 320, W, 3, P.maderaC);
  rect(12, 286, 20, 34, "#a0505a"); poligono([[6, 288], [38, 288], [32, 268], [12, 268]], P.luz);
  sombra(0.25, 0, 0, W, 60);
  titulo([["¿ACERTASTE?", P.blanco]], t - 0.05, 14, 3);
  if (t > 0.9) texto("COMENTA  A  O  B", W / 2, 46, 1, P.ama);
  // flecha que rebota
  if (t > 0.9 && t < 5.6) { const b = Math.round(Math.abs(Math.sin(t * 5)) * 4); poligono([[100, 262 + b], [116, 262 + b], [108, 272 + b]], P.ama); rect(105, 252 + b, 6, 10, P.ama); }
  // botón de suscribirse
  if (t > 5.7) {
    const p = ease((t - 5.7) / 0.25), b = Math.round(Math.sin(t * 6) * 1);
    const w = Math.round(150 * p), h = Math.round(30 * p);
    if (w > 4) {
      rect(W / 2 - w / 2 + 2, 272 + 2 + b, w, h, P.neg);
      rect(W / 2 - w / 2, 272 + b, w, h, P.rojo);
      rect(W / 2 - w / 2, 272 + h - 3 + b, w, 3, P.rojoO);
      if (p > 0.9) texto("SUSCRÍBETE", W / 2, 280 + b, 2, P.blanco, null);
    }
  }
}

// ---------- marco general ----------
const ESC = [escena1, escena2, escena3, escena4, escena5];
function render(T) {
  let k = 4; for (let i = 0; i < 5; i++) if (T < INI[i] + DUR[i]) { k = i; break; }
  const t = T - INI[k];
  ctx.clearRect(0, 0, W, H);
  ESC[k](t);
  // transición: entra con tramado desde negro (0.3 s) y sale a negro (0.15 s)
  if (k > 0) sombra(1 - t / 0.3);
  if (k < 4) sombra((t - (DUR[k] - 0.15)) / 0.15);
  // marca de IA
  texto("VOZ GENERADA CON IA", W - 62, H - 10, 1, P.gris, null);
}
function eventos() {
  return [
    ...graznidos(),
    { t: INI[1] + 3.3, tipo: "blip" }, { t: INI[1] + 5.35, tipo: "blip" },
    { t: INI[3], tipo: "acierto" }, { t: INI[4] + 5.7, tipo: "boton" },
    ...INI.slice(1).map((t) => ({ t, tipo: "corte" })),
  ];
}
window.render = render; window.TOTAL = TOTAL; window.eventos = eventos;
