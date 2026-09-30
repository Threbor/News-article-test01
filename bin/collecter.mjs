#!/usr/bin/env node
// Collecte les dépêches du jour dans les flux de config/sources.json. Aucun appel à un modèle.

import { dire, principal } from "../lib/cli.mjs";
import { chargerConfig, chemin, lireJson } from "../lib/config.mjs";
import { classer, dedoublonner, lireFlux } from "../lib/flux.mjs";

const AIDE = `
usage : collecter [--tester] [-v]

Écrit sur la sortie standard une dépêche par ligne (JSON Lines) :
  {"rubrique","titre","url","resume","date","media"}
Seules les dépêches des dernières heures (collecte.fenetreHeures) et classées dans une rubrique sont gardées.
Un flux en échec est signalé sur la sortie d'erreur ; le programme échoue si aucun flux ne répond.
--tester : affiche l'état de chaque flux (nombre d'entrées ou erreur) et sort en échec si l'un est en panne.
`;

async function telecharger(url) {
  const r = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "user-agent": "LeVeilleur/1.0 (+https://github.com/Threbor/News-article-test01)", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

principal(async (o) => {
  const config = chargerConfig();
  const { flux } = lireJson(chemin("config", "sources.json"));
  const { fenetreHeures = 48, parRubrique = 25 } = config.collecte ?? {};
  const limite = Date.now() - fenetreHeures * 3600e3;
  const classables = config.rubriques.filter((r) => r.motsCles);

  const resultats = await Promise.all(flux.map(async (f) => {
    try { return { f, entrees: lireFlux(await telecharger(f.url)) }; }
    catch (e) { return { f, erreur: e.cause?.code ?? e.message }; }
  }));

  if (o.tester) {
    for (const { f, entrees, erreur } of resultats)
      console.log(`${erreur ? "✘" : "✔"} ${f.media.padEnd(18)} ${erreur ?? `${entrees.length} entrées`}  ${f.url}`);
    return resultats.some((x) => x.erreur) ? 1 : 0;
  }

  const enPanne = resultats.filter((x) => x.erreur);
  for (const { f, erreur } of enPanne) dire(`flux en échec (${erreur}) : ${f.url}`);
  if (enPanne.length === flux.length) throw new Error("aucun flux n'a répondu");

  const depeches = dedoublonner(resultats.flatMap(({ f, entrees = [] }) => entrees.map((d) => ({
    rubrique: classer(d, f, classables), ...d, media: f.media,
  }))))
    .filter((d) => d.rubrique && (!d.date || Date.parse(d.date) >= limite))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const parRub = new Map();
  for (const d of depeches) {
    const n = parRub.get(d.rubrique) ?? 0;
    if (n < parRubrique) { parRub.set(d.rubrique, n + 1); console.log(JSON.stringify(d)); }
  }
  if (o.bavard) dire([...parRub].map(([r, n]) => `${r}:${n}`).join(" "));
}, AIDE);
