// Lecture de flux RSS 2.0 / Atom et classement des dépêches par rubrique. Fonctions pures.

import { normaliser } from "./texte.mjs";

const ENTITES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decoder(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, e) => ENTITES[e.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, " ")   // après les entités : les résumés contiennent souvent du HTML échappé
    .replace(/\s+/g, " ")
    .trim();
}

const balise = (xml, nom) => {
  const m = xml.match(new RegExp(`<${nom}(?:\\s[^>]*)?>([\\s\\S]*?)</${nom}>`, "i"));
  return m ? m[1] : "";
};

function lienAtom(xml) {
  const liens = [...xml.matchAll(/<link\b([^>]*)\/?>/gi)].map((m) => m[1]);
  const alt = liens.find((l) => /rel=["']alternate["']/.test(l)) ?? liens.find((l) => !/rel=/.test(l)) ?? liens[0] ?? "";
  return (alt.match(/href=["']([^"']+)["']/) || [])[1] ?? "";
}

// Renvoie [{ titre, url, resume, date (ISO ou "") }].
export function lireFlux(xml) {
  const atom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocs = [...xml.matchAll(atom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return blocs.map((b) => {
    const url = atom ? lienAtom(b) : decoder(balise(b, "link")) || decoder(balise(b, "guid"));
    const brut = atom ? balise(b, "updated") || balise(b, "published") : balise(b, "pubDate") || balise(b, "dc:date");
    const d = new Date(decoder(brut));
    return {
      titre: decoder(balise(b, "title")),
      url: url.trim(),
      resume: decoder(atom ? balise(b, "summary") || balise(b, "content") : balise(b, "description")).slice(0, 400),
      date: isNaN(d) ? "" : d.toISOString(),
    };
  }).filter((x) => x.titre && /^https?:\/\//.test(x.url));
}

// Rubrique d'une dépêche : celle du flux s'il est thématique, sinon la meilleure par mots-clés.
export function classer(depeche, flux, rubriques) {
  if (flux.rubriques?.length) return flux.rubriques[0];
  const texte = ` ${normaliser(`${depeche.titre} ${depeche.resume}`)} `;
  let meilleure = null, score = 0;
  for (const r of rubriques) {
    const s = (r.motsCles ?? []).reduce((n, mot) => n + (texte.includes(normaliser(mot)) ? 1 : 0), 0);
    if (s > score) { meilleure = r.id; score = s; }
  }
  return meilleure;
}

// Retire les doublons (même URL ou même titre) en gardant la première occurrence.
export function dedoublonner(depeches) {
  const vues = new Set();
  return depeches.filter((d) => {
    const cles = [d.url.replace(/[?#].*$/, ""), normaliser(d.titre)];
    if (cles.some((c) => vues.has(c))) return false;
    cles.forEach((c) => vues.add(c));
    return true;
  });
}
