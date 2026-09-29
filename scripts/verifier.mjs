#!/usr/bin/env node
// Vérifie qu'un ou plusieurs articles respectent le format de redaction/CONSIGNES.md.
// Usage : node scripts/verifier.mjs content/2026-09-29/*.md

import fs from "node:fs";
import path from "node:path";

const OBLIGATOIRES = ["titre", "chapo", "rubrique", "auteur", "date"];
let erreurs = 0;

for (const fichier of process.argv.slice(2)) {
  const probs = [];
  const raw = fs.readFileSync(fichier, "utf8").replace(/\r/g, "");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) {
    probs.push("en-tête --- … --- absent ou mal formé");
  } else {
    const meta = Object.fromEntries(m[1].split("\n")
      .map((l) => l.match(/^([\w-]+)\s*:\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2].trim()]));
    for (const k of OBLIGATOIRES) if (!meta[k]) probs.push(`clé « ${k} » manquante`);
    const dossier = path.basename(path.dirname(fichier));
    if (meta.date && /^\d{4}-\d{2}-\d{2}$/.test(dossier) && meta.date !== dossier)
      probs.push(`date ${meta.date} ≠ dossier ${dossier}`);

    const corps = m[2];
    const i = corps.search(/^##\s+Sources\s*$/m);
    if (i < 0) probs.push("section « ## Sources » absente");
    const texte = i < 0 ? corps : corps.slice(0, i);
    const mots = texte.split(/\s+/).filter(Boolean).length;
    const min = meta.rubrique === "editorial" ? 250 : 600;
    if (mots < min) probs.push(`corps trop court (${mots} mots, minimum ${min})`);
    const liens = i < 0 ? 0 : (corps.slice(i).match(/\]\(https?:\/\//g) || []).length;
    const minLiens = meta.rubrique === "editorial" ? 0 : 3;
    if (liens < minLiens) probs.push(`seulement ${liens} source(s) avec URL (minimum ${minLiens})`);
    if (!probs.length) console.log(`✔ ${fichier} — ${mots} mots, ${liens} sources`);
  }
  if (probs.length) {
    erreurs++;
    console.error(`✘ ${fichier}\n  - ${probs.join("\n  - ")}`);
  }
}

process.exit(erreurs ? 1 : 0);
