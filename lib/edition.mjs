// Chargement des éditions : content/AAAA-MM-JJ/*.md → données prêtes pour les gabarits.
// L'ordre de lecture et la numérotation sont décidés ici, une seule fois.

import fs from "node:fs";
import path from "node:path";
import { lireArticle } from "./article.mjs";
import { titreCourt } from "./texte.mjs";
import { lireCarte } from "./pays.mjs";

const EST_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Ordre de lecture : ordre des rubriques dans la configuration (éditorial, essentiel, puis cahiers).
function enrichir(a, config) {
  const r = config.rubrique(a.rubrique);
  if (!r) throw new Error(`${a.date}/${a.slug}.md : rubrique « ${a.rubrique} » absente de config/journal.json`);
  const mots = a.corps.replace(/\]\([^)]*\)/g, "]").split(/\s+/).filter(Boolean).length
    + a.breves.reduce((n, b) => n + b.md.split(/\s+/).length, 0);
  const urls = new Set(a.sources.map((s) => s.url).filter(Boolean));
  return {
    ...a,
    format: r.format,
    cahier: r.cahier ?? null,
    rubriqueNom: r.nom,
    rubriqueCourt: r.court,
    auteur: a.auteur || r.agent,
    court: titreCourt(a.titre, a.titre_court),
    carte: lireCarte(a),
    minutes: Math.max(1, Math.round(mots / 230)),
    nbSources: urls.size,
    url: `${a.date}/${a.slug}.html`,
    cle: `${a.date}/${a.slug}`,
  };
}

export function lireEdition(dossier, date, config) {
  const ordre = config.rubriques.map((r) => r.id);
  const articles = fs.readdirSync(dossier)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const slug = path.basename(f, ".md");
      const texte = fs.readFileSync(path.join(dossier, f), "utf8");
      const rub = config.rubrique(texte.match(/^rubrique:\s*(\S+)/m)?.[1] ?? slug);
      try {
        return enrichir(lireArticle(texte, { date, slug, format: rub?.format }), config);
      } catch (e) {
        throw new Error(`${date}/${f} : ${e.message}`);
      }
    })
    .sort((a, b) => ordre.indexOf(a.rubrique) - ordre.indexOf(b.rubrique));

  // Numérotation : tout sauf les brèves ; l'éditorial ouvre le numéro.
  let n = 0;
  for (const a of articles) a.num = a.format === "breves" ? 0 : ++n;
  const edito = articles.find((a) => a.format === "editorial");
  const une = articles.find((a) => a.rubrique === edito?.une || a.slug === edito?.une)
    ?? articles.find((a) => a.format === "article");
  return { date, articles, une, edito, essentiel: articles.find((a) => a.format === "breves"),
    total: n, minutes: articles.filter((a) => a.num).reduce((t, a) => t + a.minutes, 0) };
}

export function chargerEditions(contenu, config) {
  if (!fs.existsSync(contenu)) return [];
  const editions = fs.readdirSync(contenu).filter((d) => EST_DATE.test(d)).sort().reverse()
    .map((date) => lireEdition(path.join(contenu, date), date, config))
    .filter((e) => e.articles.length);
  editions.forEach((e, i) => { e.numero = editions.length - i; });
  return editions;
}
