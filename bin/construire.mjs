#!/usr/bin/env node
// Construit le site statique à partir des éditions.

import fs from "node:fs";
import path from "node:path";
import { principal } from "../lib/cli.mjs";
import { chargerConfig, chemin } from "../lib/config.mjs";
import { chargerEditions } from "../lib/edition.mjs";
import { construireSite } from "../site/index.mjs";

const AIDE = `
usage : construire [--contenu content] [--sortie _site] [-v]

Lit content/AAAA-MM-JJ/*.md et écrit le site dans --sortie.
Silencieux en cas de succès ; -v affiche un bilan.
URL absolue du site (flux RSS) : variable SITE_URL, ou VERCEL_PROJECT_PRODUCTION_URL.
`;

principal((o) => {
  const config = chargerConfig();
  const contenu = path.resolve(o.contenu ?? chemin("content"));
  const sortie = path.resolve(o.sortie ?? chemin("_site"));
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const base = (process.env.SITE_URL || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");

  const editions = chargerEditions(contenu, config);
  const fichiers = construireSite(editions, config, { base });

  fs.rmSync(sortie, { recursive: true, force: true });
  fs.cpSync(chemin("site", "assets"), path.join(sortie, "assets"), { recursive: true });
  for (const [rel, texte] of fichiers) {
    const f = path.join(sortie, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, texte);
  }
  if (o.bavard) {
    const n = editions.reduce((t, e) => t + e.articles.length, 0);
    console.error(`${editions.length} édition(s), ${n} article(s), ${fichiers.size} fichiers → ${path.relative(process.cwd(), sortie) || "."}`);
  }
}, AIDE);
