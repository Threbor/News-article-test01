// Assemble le site : éditions → table { chemin de fichier : contenu }.
// Fonction pure ; l'écriture sur disque est l'affaire de bin/construire.mjs.

import { pageArticle } from "./article.mjs";
import { pageArchives, pageCahier, pageRubrique, pageSommaire } from "./listes.mjs";
import { flux, indexRecherche, pageNotions, pageRecherche } from "./outils.mjs";
import { pageUne } from "./une.mjs";
import { page } from "./page.mjs";
import { dessinerMonde } from "./carte.mjs";
import crypto from "node:crypto";

// empreintes : { "app.js": "3f2a…" } — voir bin/construire.mjs.
export function construireSite(editions, configuration, { base = "", empreintes = {} } = {}) {
  const fichiers = new Map();
  const monde = dessinerMonde();
  fichiers.set("assets/monde.svg", monde);
  const config = { ...configuration, empreintes,
    monde: `../assets/monde.svg?v=${crypto.createHash("sha256").update(monde).digest("hex").slice(0, 10)}` };
  const [dujour] = editions;

  if (!dujour) {
    fichiers.set("index.html", page({ config, racine: "", corps: "page-une", bandeau: "", titre: config.nom, description: config.devise,
      contenu: `<header class="entete-liste"><h1>Première édition en préparation</h1><p class="chapo">La rédaction travaille. Revenez demain matin.</p></header>` }));
  } else {
    fichiers.set("index.html", pageUne(dujour, editions[1], config));
  }
  for (const e of editions) {
    fichiers.set(`${e.date}/index.html`, pageSommaire(e, config, dujour));
    for (const a of e.articles) fichiers.set(a.url, pageArticle(a, e, config));
  }
  for (const c of config.cahiers) fichiers.set(`cahier/${c.id}.html`, pageCahier(c, editions, config));
  for (const r of config.rubriques) fichiers.set(`rubrique/${r.id}.html`, pageRubrique(r, editions, config));
  fichiers.set("archives.html", pageArchives(editions, config));
  fichiers.set("notions.html", pageNotions(editions, config));
  fichiers.set("recherche.html", pageRecherche(editions, config));
  fichiers.set("recherche.json", JSON.stringify(indexRecherche(editions)));
  fichiers.set("flux.xml", flux(editions, config, base));
  return fichiers;
}
