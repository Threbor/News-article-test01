// Lecture d'un fichier article (Markdown à en-tête) en données. Aucun HTML ici.
//
// Format : voir redaction/CONSIGNES.md. Un article = en-tête « clé: valeur » entre deux « --- »,
// un corps, puis des sections spéciales facultatives (En bref, Notions clés, Pour aller plus loin, Sources).

import { RE_LIEN_EXTERNE, liensDe } from "./markdown.mjs";
import { slugifier } from "./texte.mjs";

export const SECTIONS = ["En bref", "Notions clés", "Pour aller plus loin", "Sources"];

export class ErreurFormat extends Error {}

export function lireEntete(texte) {
  const m = texte.replace(/\r/g, "").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new ErreurFormat("en-tête « --- … --- » absent ou mal formé");
  const meta = {};
  for (const ligne of m[1].split("\n")) {
    const kv = ligne.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return { meta, reste: m[2] };
}

// Sépare le corps des sections spéciales, où qu'elles se trouvent.
export function decouper(md) {
  const sections = {};
  const corps = [];
  let courante = null;
  for (const ligne of md.split("\n")) {
    const h = ligne.match(/^##\s+(.+?)\s*$/);
    if (h) {
      courante = SECTIONS.find((s) => s.toLowerCase() === h[1].toLowerCase()) ?? null;
      if (courante) { sections[courante] = ""; continue; }
    }
    if (courante) sections[courante] += ligne + "\n";
    else corps.push(ligne);
  }
  return { corps: corps.join("\n").trim(), sections };
}

const puces = (md = "") => md.split("\n").filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, "").trim());

// « - **Terme** : définition. [Comprendre](url) »
function lireNotion(ligne) {
  const m = ligne.match(/^\*\*(.+?)\*\*\s*[:：—–-]?\s*(.*)$/);
  const terme = m ? m[1].trim() : ligne.split(/[:：]/)[0].trim();
  const reste = m ? m[2] : ligne.slice(terme.length).replace(/^\s*[:：]\s*/, "");
  const url = liensDe(reste)[0] ?? "";
  const def = reste.replace(new RegExp(String.raw`\s*${RE_LIEN_EXTERNE.source}\s*\.?\s*$`), "").trim();
  return { terme, id: slugifier(terme), def, url };
}

// « - [Titre](url) — détail »
function lireReference(ligne) {
  const m = ligne.match(new RegExp(String.raw`^${RE_LIEN_EXTERNE.source}\s*[—–-]?\s*(.*)$`));
  return m ? { titre: m[1], url: m[2], detail: m[3] } : { md: ligne };
}

function lireBreves(corps) {
  return corps.split(/^###\s+/m).slice(1).map((b, i) => {
    const [titre, ...reste] = b.split("\n");
    return { n: i + 1, titre: titre.trim(), md: reste.join("\n").trim() };
  });
}

// texte : contenu du fichier ; origine : { date, slug } déduits du chemin, format de la rubrique.
export function lireArticle(texte, { date, slug, format = "article" }) {
  const { meta, reste } = lireEntete(texte);
  const { corps, sections } = decouper(reste.trim());
  const breves = format === "breves" ? lireBreves(corps) : [];
  return {
    ...meta,
    date,
    slug,
    rubrique: meta.rubrique || slug,
    corps: breves.length ? "" : corps,
    breves,
    enBref: puces(sections["En bref"]),
    notions: puces(sections["Notions clés"]).map(lireNotion),
    plusLoin: puces(sections["Pour aller plus loin"]).map(lireReference),
    sources: puces(sections.Sources).map(lireReference),
    brut: texte,
  };
}
