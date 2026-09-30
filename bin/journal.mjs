#!/usr/bin/env node
// Bilan de consommation des rédactions (journal/AAAA-MM-JJ.jsonl, écrit par rediger).

import fs from "node:fs";
import { principal } from "../lib/cli.mjs";
import { chemin } from "../lib/config.mjs";

const AIDE = `
usage : journal [DATE…]

Affiche, pour chaque date (défaut : toutes), les rédactions avec tokens, recherches et coût,
puis les totaux. Silencieux s'il n'y a rien à dire.
`;

const nombre = (n) => (n ?? 0).toLocaleString("fr-FR");

principal((o) => {
  const dossier = chemin("journal");
  if (!fs.existsSync(dossier)) return;
  const dates = o._.length ? o._ : fs.readdirSync(dossier).filter((f) => f.endsWith(".jsonl")).map((f) => f.slice(0, -6)).sort();
  const lignes = [];
  for (const d of dates) {
    const f = `${dossier}/${d}.jsonl`;
    if (!fs.existsSync(f)) continue;
    for (const l of fs.readFileSync(f, "utf8").split("\n").filter(Boolean)) lignes.push({ date: d, ...JSON.parse(l) });
  }
  if (!lignes.length) return;
  const tokens = (x) => (x.entree ?? 0) + (x.cache_lu ?? 0) + (x.cache_ecrit ?? 0) + (x.sortie ?? 0);
  console.log("date        rubrique          modèle                      tours   tokens  rech.  coût $  statut");
  for (const x of lignes)
    console.log(`${x.date}  ${x.rubrique.padEnd(16)}  ${String(x.modele).padEnd(26)}  ${String(x.tours ?? "").padStart(5)}  ${nombre(tokens(x)).padStart(7)}  ${String(x.recherches ?? 0).padStart(5)}  ${(x.cout_usd ?? 0).toFixed(2).padStart(6)}  ${x.statut}`);
  const total = lignes.reduce((t, x) => ({ tokens: t.tokens + tokens(x), cout: t.cout + (x.cout_usd ?? 0) }), { tokens: 0, cout: 0 });
  console.log(`total : ${lignes.length} rédaction(s), ${nombre(total.tokens)} tokens, ${total.cout.toFixed(2)} $`);
}, AIDE);
