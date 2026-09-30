// Contrôle d'un article lu (lib/article.mjs) selon les règles de son format (config/journal.json).
// Renvoie la liste des problèmes ; une liste vide signifie « conforme ».

import { liensDe } from "./markdown.mjs";
import { domaine } from "./texte.mjs";

const OBLIGATOIRES = ["titre", "chapo", "rubrique", "auteur", "date"];
const compterMots = (md) => md.replace(/\]\([^)]*\)/g, "]").split(/\s+/).filter(Boolean).length;

export function controler(article, regles = {}) {
  const p = [];
  for (const k of OBLIGATOIRES) if (!article[k]) p.push(`clé « ${k} » manquante`);
  if (article.date && article.dateDossier && article.date !== article.dateDossier)
    p.push(`date ${article.date} ≠ dossier ${article.dateDossier}`);

  const corps = article.corps;
  const mots = compterMots(corps);
  const liensCorps = liensDe(corps);
  const sites = new Set(liensCorps.map(domaine)).size;
  const urlsSources = article.sources.map((s) => s.url).filter(Boolean);

  if (regles.mots) {
    const [min, max] = regles.mots;
    if (mots < min) p.push(`corps trop court : ${mots} mots (minimum ${min})`);
    if (mots > max) p.push(`corps trop long : ${mots} mots (maximum ${max})`);
  }
  if (regles.liensCorps && liensCorps.length < regles.liensCorps)
    p.push(`${liensCorps.length} lien(s) dans le corps (minimum ${regles.liensCorps})`);
  if (regles.sitesCorps && sites < regles.sitesCorps)
    p.push(`liens du corps vers ${sites} site(s) (minimum ${regles.sitesCorps})`);
  if (regles.enBref && article.enBref.length !== regles.enBref)
    p.push(`« En bref » : ${article.enBref.length} point(s), ${regles.enBref} attendus`);
  if (regles.notions) {
    const [min, max] = regles.notions;
    if (article.notions.length < min || article.notions.length > max)
      p.push(`« Notions clés » : ${article.notions.length} notion(s), entre ${min} et ${max} attendues`);
    for (const n of article.notions) if (!n.url) p.push(`notion « ${n.terme} » sans lien « Comprendre »`);
  }
  if (regles.plusLoin && article.plusLoin.filter((r) => r.url).length < regles.plusLoin)
    p.push(`« Pour aller plus loin » : minimum ${regles.plusLoin} ressources avec lien`);
  if (regles.sources && urlsSources.length < regles.sources)
    p.push(`« Sources » : ${urlsSources.length} lien(s), minimum ${regles.sources}`);
  if (regles.breves) {
    if (article.breves.length < regles.breves) p.push(`${article.breves.length} brève(s), minimum ${regles.breves}`);
    article.breves.forEach((b) => { if (!liensDe(b.md).length) p.push(`brève ${b.n} « ${b.titre} » sans lien`); });
  }
  if (regles.une && !article.une) p.push("clé « une » manquante (rubrique de l'article à la une)");

  // Termes balisés [[texte|id]] : l'id doit désigner une notion clé de l'article.
  const ids = new Set(article.notions.map((n) => n.id));
  for (const [, texte, id] of article.brut.matchAll(/\[\[([^\]|]+)\|([a-z0-9-]+)\]\]/g))
    if (!ids.has(id)) p.push(`terme « ${texte} » : notion « ${id} » absente des notions clés`);

  const douteuses = liensDe(article.brut).filter((u) => /example\.(com|org)|…|\.\.\.$/.test(u));
  if (douteuses.length) p.push(`URL suspectes : ${douteuses.join(", ")}`);
  return p;
}
