#!/usr/bin/env node
// Vérifie que des articles respectent les règles de leur format (config/journal.json → formats.*.regles).

import fs from "node:fs";
import path from "node:path";
import { lireArticle } from "../lib/article.mjs";
import { dire, principal } from "../lib/cli.mjs";
import { chargerConfig } from "../lib/config.mjs";
import { controler } from "../lib/regles.mjs";

const AIDE = `
usage : verifier [-v] FICHIER…

Contrôle chaque fichier et écrit les problèmes sur la sortie d'erreur.
Code de sortie : 0 si tout est conforme, 1 sinon. Silencieux si tout va bien ; -v confirme chaque fichier.
La date attendue est celle du dossier (content/AAAA-MM-JJ/).
`;

principal((o) => {
  if (!o._.length) throw new Error("aucun fichier à vérifier (voir --aide)");
  const config = chargerConfig();
  let echecs = 0;
  for (const f of o._) {
    const texte = fs.readFileSync(f, "utf8");
    const dossier = path.basename(path.dirname(path.resolve(f)));
    const slug = path.basename(f).replace(/\.[^.]+$/, "");
    const id = texte.match(/^rubrique:\s*(\S+)/m)?.[1] ?? slug;
    const rub = config.rubrique(id);
    let problemes;
    try {
      if (!rub) throw new Error(`rubrique « ${id} » absente de config/journal.json`);
      const a = lireArticle(texte, { date: dossier, slug, format: rub.format });
      a.dateDossier = /^\d{4}-\d{2}-\d{2}$/.test(dossier) ? dossier : undefined;
      problemes = controler(a, config.format(rub).regles);
      if (a.une && !fs.existsSync(path.join(path.dirname(f), `${a.une}.md`)))
        problemes.push(`la une désigne « ${a.une} », absent de l'édition`);
    } catch (e) {
      problemes = [e.message];
    }
    if (problemes.length) {
      echecs++;
      dire(`${f}\n  - ${problemes.join("\n  - ")}`);
    } else if (o.bavard) console.error(`✔ ${f}`);
  }
  return echecs ? 1 : 0;
}, AIDE);
