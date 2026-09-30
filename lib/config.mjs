// Chargement et validation de la configuration (config/journal.json).
// Toute incohérence arrête le programme immédiatement, avec un message précis.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { codeJour } from "./texte.mjs";

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const chemin = (...p) => path.join(RACINE, ...p);

export class ErreurConfig extends Error {}
const exiger = (cond, msg) => { if (!cond) throw new ErreurConfig(`config/journal.json : ${msg}`); };

export function lireJson(fichier) {
  try { return JSON.parse(fs.readFileSync(fichier, "utf8")); }
  catch (e) { throw new ErreurConfig(`${path.relative(RACINE, fichier)} : ${e.message}`); }
}

export function chargerConfig(fichier = chemin("config", "journal.json")) {
  const c = lireJson(fichier);
  for (const k of ["nom", "devise", "cahiers", "rubriques", "formats"]) exiger(c[k], `clé « ${k} » manquante`);
  const cahiers = new Set(c.cahiers.map((x) => x.id));
  const ids = new Set();
  for (const r of c.rubriques) {
    for (const k of ["id", "nom", "court", "agent", "consigne"]) exiger(r[k], `rubrique ${r.id ?? "?"} : clé « ${k} » manquante`);
    exiger(!ids.has(r.id), `rubrique « ${r.id} » en double`);
    ids.add(r.id);
    r.format ??= "article";
    exiger(c.formats[r.format], `rubrique ${r.id} : format « ${r.format} » inconnu`);
    exiger(!r.cahier || cahiers.has(r.cahier), `rubrique ${r.id} : cahier « ${r.cahier} » inconnu`);
    r.frequence ??= "quotidien";
    exiger(r.frequence === "quotidien" || Array.isArray(r.frequence), `rubrique ${r.id} : fréquence invalide`);
  }
  for (const [nom, f] of Object.entries(c.formats)) {
    exiger(f.consigne && fs.existsSync(chemin(f.consigne)), `format ${nom} : fichier de consigne introuvable (${f.consigne})`);
    exiger(f.modele, `format ${nom} : modèle manquant`);
  }
  return {
    ...c,
    rubrique: (id) => c.rubriques.find((r) => r.id === id),
    cahier: (id) => c.cahiers.find((x) => x.id === id),
    format: (r) => c.formats[r.format],
    // Rubriques à produire à une date donnée, dans l'ordre de la configuration.
    rubriquesDu: (date) => c.rubriques.filter((r) => r.frequence === "quotidien" || r.frequence.includes(codeJour(date))),
  };
}
