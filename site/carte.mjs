// Carte de situation d'un article, dessinée en SVG au moment de la construction.
// Projection équirectangulaire centrée sur le lieu (fidèle à l'échelle régionale), pays cités
// en surbrillance, repère du lieu, échelle en kilomètres et vignette de situation mondiale.

import { pays } from "../lib/pays.mjs";
import { echapper } from "../lib/texte.mjs";

const L = 640, H = 400;               // dimensions de la carte (viewBox)
const KM_PAR_DEGRE = 111.32;
const RAD = Math.PI / 180;

// Ramène une longitude dans [-180, 180] autour d'un centre.
const recentrer = (lon, centre) => ((lon - centre + 540) % 360) - 180;

function projection({ lat, lon, rayon }) {
  const k = (L / 2) / (rayon / KM_PAR_DEGRE);        // pixels par degré de latitude
  const c = Math.cos(lat * RAD);
  return {
    k, c,
    x: (dl) => L / 2 + dl * c * k,           // dl : écart de longitude au centre, en degrés
    y: (la) => H / 2 - (la - lat) * k,
    demiLon: (L / 2) / (k * c) + 2, demiLat: (H / 2) / k + 2,
  };
}

// Zone d'un point par rapport au cadre (0 = dedans) ; deux points consécutifs hors cadre dans la
// même zone peuvent être fusionnés : le segment qui les relie reste dans cette zone, donc invisible.
const MARGE = 12;
const zone = (x, y) => (x < -MARGE) | ((x > L + MARGE) << 1) | ((y < -MARGE) << 2) | ((y > H + MARGE) << 3);

// Anneau projeté en tracé SVG : fusion des points hors cadre, puis des points plus proches que « pas » pixels.
// centre : longitude du centre de la carte ; l'écart au centre est suivi de proche en proche, pour
// qu'un contour qui franchit l'antiméridien reste continu au lieu de traverser toute la carte.
function trace(anneau, px, py, { pas = 1, cadre = true, centre = null } = {}) {
  let d = "", ax = null, ay = null, zonePrec = 0, enAttente = null, dl = null, prec = null;
  const ecrire = (x, y) => { d += `${ax === null ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`; ax = x; ay = y; };
  for (let i = 0; i < anneau.length; i += 2) {
    const lon = anneau[i];
    if (centre !== null) dl = dl === null ? recentrer(lon, centre) : dl + recentrer(lon, prec);
    prec = lon;
    const x = px(centre === null ? lon : dl), y = py(anneau[i + 1]);
    const z = cadre ? zone(x, y) : 0;
    if (z && z === zonePrec) { enAttente = [x, y]; continue; }
    if (enAttente) { ecrire(...enAttente); enAttente = null; }
    zonePrec = z;
    if (ax !== null && Math.abs(x - ax) < pas && Math.abs(y - ay) < pas) continue;
    ecrire(x, y);
  }
  if (enAttente) ecrire(...enAttente);
  return d ? d + "Z" : "";
}

// Un anneau est-il (au moins en partie) dans la fenêtre ?
function visible(anneau, p, carte) {
  let minLo = Infinity, maxLo = -Infinity, minLa = Infinity, maxLa = -Infinity;
  for (let i = 0; i < anneau.length; i += 2) {
    const lo = recentrer(anneau[i], carte.lon), la = anneau[i + 1];
    if (lo < minLo) minLo = lo; if (lo > maxLo) maxLo = lo;
    if (la < minLa) minLa = la; if (la > maxLa) maxLa = la;
  }
  if (maxLo - minLo > 300) return true; // anneau à cheval sur l'antiméridien : on le garde
  return maxLo > -p.demiLon && minLo < p.demiLon && maxLa > carte.lat - p.demiLat && minLa < carte.lat + p.demiLat;
}

// Échelle « ronde » (1, 2 ou 5 × 10^n km) d'environ 110 px.
function echelle(p) {
  const kmParPx = KM_PAR_DEGRE / p.k;
  const brut = kmParPx * 110, e = 10 ** Math.floor(Math.log10(brut));
  const km = [1, 2, 5, 10].map((m) => m * e).find((v) => v >= brut * 0.7);
  const w = km / kmParPx;
  return `<g class="carte-echelle" transform="translate(18 ${H - 20})"><path d="M0 -5V0H${w.toFixed(1)}V-5"/><text x="${(w / 2).toFixed(1)}" y="-8">${km.toLocaleString("fr-FR")} km</text></g>`;
}

// Monde très simplifié (1 unité = 1 degré), servi une fois pour toutes dans assets/monde.svg.
export function dessinerMonde() {
  const d = pays().map((c) => c.p.map((r) => trace(r, (lo) => lo + 180, (la) => 85 - la, { pas: 1.2, cadre: false })).join("")).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170"><path fill="#8f8a82" d="${d}"/></svg>\n`;
}

// Vignette de situation : le monde et le cadre de la zone montrée.
function vignette(carte, p, monde) {
  const w = 120, h = 57, kx = w / 360, ky = h / 170;
  const x0 = (carte.lon - p.demiLon + 180) * kx, y0 = (85 - (carte.lat + p.demiLat)) * ky;
  const cw = Math.max(3, 2 * p.demiLon * kx), ch = Math.max(3, 2 * p.demiLat * ky);
  return `<g class="carte-vignette" transform="translate(${L - w - 12} 12)"><rect class="carte-vignette-fond" width="${w}" height="${h}"/><image href="${monde}" width="${w}" height="${h}" preserveAspectRatio="none"/><rect class="carte-cadre" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}"/></g>`;
}

// monde : URL de assets/monde.svg depuis la page.
export function dessinerCarte(carte, monde) {
  const p = projection(carte);
  const cites = new Set(carte.pays);
  const fonds = [], surlignes = [], etiquettes = [], candidates = [];

  for (const c of pays()) {
    const anneaux = c.p.filter((r) => visible(r, p, carte));
    if (!anneaux.length) continue;
    const d = anneaux.map((r) => trace(r, p.x, p.y, { centre: carte.lon })).join("");
    if (!d) continue;
    (cites.has(c.c) ? surlignes : fonds).push(`<path d="${d}"><title>${echapper(c.n)}</title></path>`);
    if (cites.has(c.c)) {
      // Étiquette au centre des points visibles du plus grand anneau.
      const r = anneaux.reduce((a, b) => (b.length > a.length ? b : a));
      let sx = 0, sy = 0, n = 0;
      for (let i = 0, dl = null, prec = null; i < r.length; i += 2) {
        dl = dl === null ? recentrer(r[i], carte.lon) : dl + recentrer(r[i], prec); prec = r[i];
        const [x, y] = [p.x(dl), p.y(r[i + 1])];
        if (x > 0 && x < L && y > 0 && y < H) { sx += x; sy += y; n++; }
      }
      if (n) candidates.push({ x: sx / n, y: sy / n, texte: c.n.toUpperCase(), poids: n });
    }
  }

  // Étiquettes de pays : les plus étendues d'abord, sans chevaucher une étiquette déjà posée ni le lieu.
  const posees = [{ x0: L / 2 - 12, x1: L / 2 + 20 + carte.lieu.length * 12, y0: H / 2 - 16, y1: H / 2 + 12 }];
  const chevauche = (b) => posees.some((a) => b.x0 < a.x1 && b.x1 > a.x0 && b.y0 < a.y1 && b.y1 > a.y0);
  for (const e of candidates.sort((a, b) => b.poids - a.poids)) {
    const w = e.texte.length * 13.5;
    const boite = { x0: e.x - w / 2, x1: e.x + w / 2, y0: e.y - 14, y1: e.y + 5 };
    if (boite.x0 < 6 || boite.x1 > L - 6 || boite.y0 < 6 || boite.y1 > H - 34 || chevauche(boite)) continue;
    posees.push(boite);
    etiquettes.push(`<text class="carte-pays" x="${e.x.toFixed(0)}" y="${e.y.toFixed(0)}">${echapper(e.texte)}</text>`);
  }

  const titre = `Carte de situation : ${carte.lieu}`;
  return `<figure class="carte">
  <svg viewBox="0 0 ${L} ${H}" role="img" aria-label="${echapper(titre)}">
    <title>${echapper(titre)}</title>
    <rect class="carte-mer" width="${L}" height="${H}"/>
    <g class="carte-terres">${fonds.join("")}</g>
    <g class="carte-cites">${surlignes.join("")}</g>
    <g>${etiquettes.join("")}</g>
    <g class="carte-lieu" transform="translate(${L / 2} ${H / 2})"><circle r="8"/><circle class="carte-lieu-coeur" r="3"/><text x="14" y="7">${echapper(carte.lieu)}</text></g>
    ${echelle(p)}
    ${vignette(carte, p, monde)}
  </svg>
  <figcaption>${echapper(carte.lieu)}<span> · Fond de carte : Natural Earth</span></figcaption>
</figure>`;
}
