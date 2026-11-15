// Clasifica cada oferta en una categoría según las palabras de su título (sin IA: reglas fijas).
//
//   Tecnología · Cuidado y Belleza · Moda · Entretención   (lo que no calza queda en "Otros")
//
// Las reglas se revisan en orden y gana la primera que calza. Para corregir una oferta mal clasificada,
// basta con agregar la palabra en la regla que corresponde.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CATEGORIAS = ["Tecnología", "Cuidado y Belleza", "Moda", "Entretención"];

const REGLAS = [
  // Primero lo de entretención que es inconfundible (un disfraz o una consola nunca es "moda" ni "tecnología").
  ["Entretención", /\b(disfra\w*|juguete\w*|lego|consola\w*|playstation|ps[45]|nintendo|switch 2|xbox|videojuego\w*|juego de mesa|peluche\w*|puzzle|rompecabeza\w*|munec\w*|hot wheels|barbie)\b/],
  ["Tecnología", /\b(audifono\w*|auricular\w*|parlante\w*|soundcore|airpods?|tv|televisor\w*|smart ?tv|monitor\w*|tablet\w*|tab|ipad|notebook\w*|laptop\w*|computador\w*|teclado\w*|mouse|smartwatch\w*|smart ?band|band \d+|reloj inteligente|celular\w*|smartphone\w*|iphone|galaxy|xiaomi|redmi|motorola|starlink|router|wifi|camara\w*|gopro|cargador\w*|power ?bank|disco (duro|ssd)|ssd|pendrive|impresora\w*|proyector\w*|microfono\w*|hdmi|freidora\w*|aspiradora\w*|robot|microondas|refrigerador\w*|lavadora\w*|cafetera\w*|licuadora\w*|hervidor\w*|aire acondicionado|estufa\w*|ventilador\w*)\b/],
  ["Cuidado y Belleza", /\b(perfume\w*|colonia|edt|edp|eau de|serum|crema\w*|protector solar|bloqueador|maquillaje|foundation|base de maquillaje|labial\w*|mascara de pestanas|pestan\w*|rimel|shampoo|acondicionador|secador\w* de pelo|plancha de pelo|alisador\w*|rizador\w*|afeitadora\w*|depiladora\w*|cepillo de dientes|cepillo dental|eucerin|revitalift|l'?oreal|nivea|cerave|la roche|vichy|facial|skincare|desodorante\w*|incontinencia|panal\w*|unas|esmalte\w*|tinte|cosmetic\w*|belleza)\b/],
  ["Moda", /\b(zapatilla\w*|zapato\w*|bota\w*|botin\w*|sandalia\w*|pantalon\w*|jeans?|polera\w*|camisa\w*|chaqueta\w*|parka\w*|poleron\w*|polar|vestido\w*|falda\w*|calzon\w*|sosten\w*|brasier\w*|calcetin\w*|boxer\w*|ropa|billetera\w*|tarjetero\w*|cartera\w*|mochila\w*|bolso\w*|reloj\w*|lentes|gafas|overol\w*|faja\w*|cinturilla\w*|cinturon\w*|gorro\w*|jockey|short\w*|buzo\w*|pijama\w*|bikini\w*|traje de bano|blusa\w*|sweater\w*|chaleco\w*|leggings?|calza\w*)\b/],
  // Al final, deporte y aire libre (para que "zapatilla running" quede en Moda y no acá).
  ["Entretención", /\b(bicicleta\w*|scooter\w*|patineta\w*|skate|stand up|paddle|surf|kayak|carpa\w*|camping|picnic|pesca|carrete\w*|piscina\w*|inflable\w*|karaoke|guitarra\w*|instrumento\w*|pelota\w*|balon\w*|gimnasio|mancuerna\w*|pesas|trampolin\w*|libro\w*|cine|parrilla\w*)\b/],
];

const normalizar = (t) => String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function categoria(titulo) {
  const t = normalizar(titulo);
  for (const [nombre, regla] of REGLAS) if (regla.test(t)) return nombre;
  return "Otros";
}

// Prueba rápida: node categorias.mjs  → muestra cómo quedó clasificada cada oferta de data/ofertas.json
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ofertas } = JSON.parse(readFileSync(new URL("./data/ofertas.json", import.meta.url), "utf8"));
  for (const o of ofertas) console.log(categoria(o.titulo).padEnd(18), o.tienda === "falabella" ? "FAL" : "ML ", o.tipo === "popular" ? "pop" : "   ", o.titulo);
}
