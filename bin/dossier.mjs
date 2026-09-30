#!/usr/bin/env node
// Prépare la consigne complète d'une rubrique : gabarit (redaction/consignes/FORMAT.md) + données du jour.
// C'est un générateur de programme : sa sortie est le texte que lira le modèle.

import fs from "node:fs";
import path from "node:path";
import { lireArticle, lireEntete } from "../lib/article.mjs";
import { principal } from "../lib/cli.mjs";
import { chargerConfig, chemin } from "../lib/config.mjs";
import { aujourdhui, dateCourte, dateLongue } from "../lib/texte.mjs";

const AIDE = `
usage : dossier --rubrique ID [--date AAAA-MM-JJ] [--depeches fichier.jsonl]

Écrit sur la sortie standard la consigne de la rubrique ID pour la date donnée.
Les dépêches (sortie de collecter) sont lues dans --depeches, ou à défaut ignorées.
Échoue si le gabarit contient un champ {{…}} inconnu.
`;

const PAR_RUBRIQUE_BREVES = 3;

function lireDepeches(fichier) {
  if (!fichier) return [];
  return fs.readFileSync(fichier, "utf8").split("\n").filter(Boolean).map((l, i) => {
    try { return JSON.parse(l); } catch { throw new Error(`${fichier}, ligne ${i + 1} : JSON invalide`); }
  });
}

const formaterDepeche = (d) => `- [${d.titre}](${d.url}) — ${d.media}${d.date ? `, ${d.date.slice(0, 10)}` : ""}${d.resume ? `\n  ${d.resume}` : ""}`;

// Titres des articles de la rubrique sur les 14 derniers jours.
function dejaTraites(id, date) {
  const racine = chemin("content");
  if (!fs.existsSync(racine)) return [];
  return fs.readdirSync(racine).filter((d) => d < date).sort().reverse().slice(0, 14)
    .map((d) => path.join(racine, d, `${id}.md`)).filter(fs.existsSync)
    .map((f) => `- ${path.basename(path.dirname(f))} : ${lireEntete(fs.readFileSync(f, "utf8")).meta.titre}`);
}

// Pour l'éditorial : ce que disent les articles déjà écrits du jour.
function articlesDuJour(date, config) {
  const dossier = chemin("content", date);
  if (!fs.existsSync(dossier)) return [];
  return fs.readdirSync(dossier).filter((f) => f.endsWith(".md") && f !== "editorial.md").map((f) => {
    const slug = path.basename(f, ".md");
    const texte = fs.readFileSync(path.join(dossier, f), "utf8");
    const a = lireArticle(texte, { date, slug, format: config.rubrique(slug)?.format });
    const points = a.breves.length ? a.breves.map((b) => b.titre) : a.enBref;
    return `## ${slug}.html — ${config.rubrique(a.rubrique)?.nom ?? a.rubrique}\n**${a.titre}**\n${a.chapo}\n${points.map((p) => `- ${p}`).join("\n")}`;
  });
}

// Règles de contrôle traduites en phrase, pour que le modèle sache ce qui sera vérifié.
function decrireRegles(r = {}) {
  const d = [];
  if (r.mots) d.push(`corps de ${r.mots[0]} à ${r.mots[1]} mots`);
  if (r.liensCorps) d.push(`au moins ${r.liensCorps} liens dans le corps vers ${r.sitesCorps ?? 1} sites différents`);
  if (r.enBref) d.push(`exactement ${r.enBref} puces dans « En bref »`);
  if (r.notions) d.push(`${r.notions[0]} à ${r.notions[1]} notions clés, chacune avec un lien`);
  if (r.plusLoin) d.push(`au moins ${r.plusLoin} ressources dans « Pour aller plus loin »`);
  if (r.sources) d.push(`au moins ${r.sources} sources avec lien`);
  if (r.breves) d.push(`au moins ${r.breves} brèves, chacune avec un lien`);
  if (r.carte) d.push("carte de situation décrite par « carte_lieu » et « carte_coord » (codes « carte_pays » valides)");
  if (r.une) d.push("clé « une » dans l'en-tête");
  return d.join(" ; ") + ".";
}

principal((o) => {
  const config = chargerConfig();
  const r = config.rubrique(o.rubrique);
  if (!r) throw new Error(`rubrique inconnue : ${o.rubrique ?? "(absente, voir --aide)"}`);
  const date = typeof o.date === "string" ? o.date : aujourdhui(config.fuseau);
  const format = config.format(r);
  const depeches = lireDepeches(o.depeches);

  const choisies = r.format === "breves"
    ? config.rubriques.flatMap((x) => depeches.filter((d) => d.rubrique === x.id).slice(0, PAR_RUBRIQUE_BREVES))
    : depeches.filter((d) => d.rubrique === r.id);

  const champs = {
    journal: config.nom,
    agent: r.agent,
    rubrique: r.id,
    rubrique_nom: r.nom,
    consigne: r.consigne,
    date,
    date_longue: dateLongue(date),
    date_courte: dateCourte(date).replace(/ \d{4}$/, ""),
    recherches: String(format.recherches ?? 0),
    lectures: String(format.lectures ?? 0),
    depeches: choisies.length ? choisies.map(formaterDepeche).join("\n") : "(aucune dépêche collectée : fais tes propres recherches, dans le budget)",
    deja_traites: dejaTraites(r.id, date).join("\n") || "(aucun)",
    articles_du_jour: articlesDuJour(date, config).join("\n\n") || "(aucun article)",
    charte: fs.readFileSync(chemin("redaction", "CONSIGNES.md"), "utf8").trim(),
    regles: decrireRegles(format.regles),
  };

  const gabarit = fs.readFileSync(chemin(format.consigne), "utf8");
  const inconnus = [...gabarit.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).filter((k) => !(k in champs));
  if (inconnus.length) throw new Error(`${format.consigne} : champ(s) inconnu(s) ${inconnus.map((k) => `{{${k}}}`).join(", ")}`);
  process.stdout.write(gabarit.replace(/\{\{(\w+)\}\}/g, (_, k) => champs[k]));
}, AIDE);
