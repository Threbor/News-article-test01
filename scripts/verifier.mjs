#!/usr/bin/env node
// Vérifie qu'un ou plusieurs articles respectent le format de redaction/CONSIGNES.md.
// Usage : node scripts/verifier.mjs content/2026-09-30/*.md

import fs from "node:fs";
import path from "node:path";

const OBLIGATOIRES = ["titre", "chapo", "rubrique", "auteur", "date"];
const LIEN = /\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g;

const liens = (txt) => [...txt.matchAll(LIEN)].map((m) => m[1]);
const domaines = (urls) => new Set(urls.map((u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } }));
const mots = (txt) => txt.replace(/\]\([^)]*\)/g, "]").split(/\s+/).filter(Boolean).length;

// Découpe le corps en { corps, sections: { "Sources": "…", … } } selon les intertitres spéciaux.
export function decouper(corps) {
  const SPECIALES = ["En bref", "Notions clés", "Pour aller plus loin", "Sources"];
  const sections = {};
  const reste = [];
  let courante = null;
  for (const ligne of corps.split("\n")) {
    const h = ligne.match(/^##\s+(.+?)\s*$/);
    if (h) {
      const nom = SPECIALES.find((s) => s.toLowerCase() === h[1].toLowerCase());
      courante = nom ?? null;
      if (nom) { sections[nom] = ""; continue; }
    }
    if (courante) sections[courante] += ligne + "\n";
    else reste.push(ligne);
  }
  return { corps: reste.join("\n").trim(), sections };
}

function verifier(fichier) {
  const probs = [];
  const raw = fs.readFileSync(fichier, "utf8").replace(/\r/g, "");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return ["en-tête --- … --- absent ou mal formé"];
  const meta = Object.fromEntries(m[1].split("\n")
    .map((l) => l.match(/^([\w-]+)\s*:\s*(.*)$/)).filter(Boolean).map((x) => [x[1], x[2].trim()]));
  for (const k of OBLIGATOIRES) if (!meta[k]) probs.push(`clé « ${k} » manquante`);
  const dossier = path.basename(path.dirname(fichier));
  if (meta.date && /^\d{4}-\d{2}-\d{2}$/.test(dossier) && meta.date !== dossier)
    probs.push(`date ${meta.date} ≠ dossier ${dossier}`);

  const { corps, sections } = decouper(m[2]);
  const n = mots(corps);
  const liensCorps = liens(corps);
  const puces = (s) => (sections[s] || "").split("\n").filter((l) => /^\s*[-*]\s+/.test(l));

  if (meta.rubrique === "editorial") {
    if (n < 250) probs.push(`éditorial trop court (${n} mots, minimum 250)`);
    if (!meta.une) probs.push("clé « une » manquante");
  } else if (meta.rubrique === "essentiel") {
    const breves = corps.split(/^###\s+/m).slice(1);
    if (breves.length < 8) probs.push(`${breves.length} brève(s), minimum 8`);
    breves.forEach((b, i) => { if (!liens(b).length) probs.push(`brève ${i + 1} sans lien`); });
    if (!sections.Sources) probs.push("section « ## Sources » absente");
  } else {
    if (n < 380) probs.push(`corps trop court (${n} mots, visé 450–650)`);
    if (n > 800) probs.push(`corps trop long (${n} mots, visé 450–650)`);
    if (liensCorps.length < 6) probs.push(`${liensCorps.length} lien(s) dans le corps, minimum 6`);
    if (domaines(liensCorps).size < 4) probs.push(`liens du corps vers ${domaines(liensCorps).size} site(s), minimum 4`);
    if (puces("En bref").length !== 3) probs.push(`« ## En bref » doit contenir 3 puces (${puces("En bref").length})`);
    const notions = puces("Notions clés");
    if (notions.length < 2) probs.push(`« ## Notions clés » : ${notions.length} notion(s), minimum 2`);
    if (notions.some((l) => !liens(l).length)) probs.push("une notion clé n'a pas de lien");
    if (liens(sections["Pour aller plus loin"] || "").length < 3) probs.push("« ## Pour aller plus loin » : minimum 3 liens");
    if (liens(sections.Sources || "").length < 5) probs.push("« ## Sources » : minimum 5 liens");
  }

  const tous = liens(raw);
  const douteux = tous.filter((u) => /example\.(com|org)|\.\.\.|…|\s/.test(u));
  if (douteux.length) probs.push(`URL suspectes : ${douteux.join(", ")}`);
  if (!probs.length) console.log(`✔ ${fichier} — ${n} mots, ${tous.length} liens vers ${domaines(tous).size} sites`);
  return probs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let erreurs = 0;
  for (const f of process.argv.slice(2)) {
    const probs = verifier(f);
    if (probs.length) { erreurs++; console.error(`✘ ${f}\n  - ${probs.join("\n  - ")}`); }
  }
  process.exit(erreurs ? 1 : 0);
}
