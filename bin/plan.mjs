#!/usr/bin/env node
// Liste les rubriques à produire pour une date, d'après leur fréquence (config/journal.json).

import fs from "node:fs";
import { principal } from "../lib/cli.mjs";
import { chargerConfig, chemin } from "../lib/config.mjs";
import { aujourdhui } from "../lib/texte.mjs";

const AIDE = `
usage : plan [--date AAAA-MM-JJ] [--formats article,breves] [--seulement id,id] [--sauf-existants]
       plan --aujourdhui

Écrit un identifiant de rubrique par ligne, dans l'ordre de lecture.
--formats        ne garder que ces formats (article, breves, editorial)
--seulement      restreindre à ces rubriques (vide = toutes celles du jour)
--sauf-existants ignorer les rubriques déjà présentes dans content/DATE/
--aujourdhui     écrire seulement la date du jour dans le fuseau du journal
`;

principal((o) => {
  const config = chargerConfig();
  const date = typeof o.date === "string" ? o.date : aujourdhui(config.fuseau);
  if (o.aujourdhui) { console.log(date); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`date invalide : ${date}`);
  const formats = typeof o.formats === "string" ? o.formats.split(",") : null;
  const seulement = typeof o.seulement === "string" && o.seulement.trim() ? o.seulement.split(",").map((s) => s.trim()) : null;
  for (const id of seulement ?? []) if (!config.rubrique(id)) throw new Error(`rubrique inconnue : ${id}`);

  const rubriques = (seulement ? config.rubriques.filter((r) => seulement.includes(r.id)) : config.rubriquesDu(date))
    .filter((r) => !formats || formats.includes(r.format))
    .filter((r) => !o["sauf-existants"] || !fs.existsSync(chemin("content", date, `${r.id}.md`)));
  for (const r of rubriques) console.log(r.id);
}, AIDE);
