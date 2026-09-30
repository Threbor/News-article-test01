// Rendu du corps d'un article : appels de source numérotés et termes de notion.
//
// - Chaque lien externe du corps devient un appel « ¹ » renvoyant à la liste des sources ;
//   son numéro est le rang de l'URL dans cette liste (un lien absent y est ajouté à la fin).
// - Chaque notion clé est reliée à sa première occurrence dans les paragraphes, sauf si
//   l'auteur l'a déjà balisée avec [[texte|id-notion]].

import { blocs } from "../lib/markdown.mjs";
import { domaine, normaliser, texteBrut } from "../lib/texte.mjs";

export const lienTerme = (texte, id, racine) =>
  `<a class="terme" href="${racine}notions.html#${id}" data-notion="${id}">${texte}</a>`;

export function rendreCorps(article, racine) {
  const sources = article.sources.map((s) => ({ ...s }));
  const numeros = new Map();
  sources.forEach((s, i) => { if (s.url && !numeros.has(s.url)) numeros.set(s.url, i + 1); });
  const balisees = new Set();

  const html = blocs(article.corps, {
    lien(texte, url) {
      if (!/^https?:\/\//.test(url)) return `<a href="${url}">${texte}</a>`;
      if (!numeros.has(url)) {
        sources.push({ titre: texteBrut(texte), url, detail: domaine(url) });
        numeros.set(url, sources.length);
      }
      const n = numeros.get(url);
      return `<a class="ext appel" href="${url}" data-source="${n}" rel="noopener" target="_blank">${texte}<sup class="appel-num"><span class="visuel-cache">source </span>${n}</sup></a>`;
    },
    terme(texte, id) { balisees.add(id); return lienTerme(texte, id, racine); },
  });

  const aRelier = article.notions.filter((n) => !balisees.has(n.id));
  return { html: marquerTermes(html, aRelier, racine), sources };
}

// Forme cherchée d'une notion : sans parenthèse finale (« Accord de Vienne (PAGC) » → « accord de vienne »).
const formeCherchee = (terme) => normaliser(terme.replace(/\s*\([^)]*\)\s*$/, "")).trim();
const lettre = (c) => !!c && /[\p{L}\p{N}]/u.test(c);

// Normalise un texte en gardant, pour chaque caractère normalisé, sa position d'origine.
function normaliserAvecPositions(texte) {
  let norm = ""; const pos = [];
  for (let i = 0; i < texte.length; i++) {
    const n = normaliser(texte[i]);
    for (const c of n) { norm += c; pos.push(i); }
  }
  return { norm, pos };
}

export function marquerTermes(html, notions, racine) {
  if (!notions.length) return html;
  const restantes = new Map(notions.map((n) => [n.id, formeCherchee(n.terme)]));
  let dansP = 0, bloque = 0;
  return html.split(/(<[^>]+>)/).map((morceau) => {
    if (morceau.startsWith("<")) {
      const m = morceau.match(/^<(\/?)([a-z0-9]+)/i);
      if (m) {
        const fin = m[1] === "/", tag = m[2].toLowerCase();
        if (tag === "p") dansP += fin ? -1 : 1;
        if (["a", "h2", "h3", "h4", "sup", "cite"].includes(tag)) bloque += fin ? -1 : 1;
      }
      return morceau;
    }
    return (!dansP || bloque) ? morceau : relier(morceau, restantes, racine);
  }).join("");
}

// Relie dans un morceau de texte la première occurrence de chaque notion encore non reliée.
function relier(texte, restantes, racine) {
  const { norm, pos } = normaliserAvecPositions(texte);
  let meilleur = null;
  for (const [id, forme] of restantes) {
    let i = norm.indexOf(forme);
    while (i >= 0 && (lettre(norm[i - 1]) || lettre(norm[i + forme.length]))) i = norm.indexOf(forme, i + 1);
    if (i >= 0 && (!meilleur || i < meilleur.i)) meilleur = { id, i, n: forme.length };
  }
  if (!meilleur) return texte;
  restantes.delete(meilleur.id);
  const debut = pos[meilleur.i], fin = pos[meilleur.i + meilleur.n - 1] + 1;
  return texte.slice(0, debut) + lienTerme(texte.slice(debut, fin), meilleur.id, racine)
    + relier(texte.slice(fin), restantes, racine);
}
