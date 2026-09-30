#!/usr/bin/env node
// Fait rédiger un texte par Claude (Claude Code en mode non interactif) à partir d'une consigne.
// Entrée : la consigne (sortie de dossier). Sortie : le fichier Markdown de l'article.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { dire, lireEntree, principal } from "../lib/cli.mjs";
import { chargerConfig } from "../lib/config.mjs";

const AIDE = `
usage : dossier … | rediger --rubrique ID [--journal fichier.jsonl] [-v] > article.md

Le modèle, le nombre de tours et les outils viennent du format de la rubrique (config/journal.json).
Variables d'environnement :
  VEILLEUR_MODELE   impose un modèle à tous les formats
  CLAUDE            commande à lancer (défaut : claude) — utile pour tester avec un substitut
  CLAUDE_CODE_OAUTH_TOKEN ou ANTHROPIC_API_KEY : authentification de Claude Code
--journal : ajoute une ligne de consommation (tokens, coût, durée) à ce fichier JSON Lines.
`;

principal(async (o) => {
  const config = chargerConfig();
  const r = config.rubrique(o.rubrique);
  if (!r) throw new Error(`rubrique inconnue : ${o.rubrique ?? "(absente, voir --aide)"}`);
  const f = config.format(r);
  const consigne = await lireEntree();
  if (!consigne.trim()) throw new Error("consigne vide sur l'entrée standard");

  const modele = process.env.VEILLEUR_MODELE || f.modele;
  const args = ["-p", "--model", modele, "--max-turns", String(f.tours ?? 10),
    "--tools", f.outils ?? "", "--output-format", "json", "--no-session-persistence"];
  if (f.outils) args.push("--allowedTools", f.outils);
  if (o.bavard) dire(`${r.id} : ${modele}, ${f.tours} tours, outils « ${f.outils || "aucun"} »`);

  const debut = Date.now();
  const p = spawnSync(process.env.CLAUDE || "claude", args, { input: consigne, encoding: "utf8", maxBuffer: 64 << 20 });
  if (p.error) throw new Error(`impossible de lancer Claude : ${p.error.message}`);
  let res;
  try { res = JSON.parse(p.stdout); }
  catch { throw new Error(`réponse illisible de Claude (code ${p.status}) : ${(p.stderr || p.stdout).slice(0, 400)}`); }

  if (o.journal) {
    const u = res.usage ?? {};
    fs.mkdirSync(path.dirname(path.resolve(o.journal)), { recursive: true });
    fs.appendFileSync(o.journal, JSON.stringify({
      rubrique: r.id, modele, tours: res.num_turns, cout_usd: res.total_cost_usd,
      entree: u.input_tokens, cache_lu: u.cache_read_input_tokens, cache_ecrit: u.cache_creation_input_tokens,
      sortie: u.output_tokens, recherches: u.server_tool_use?.web_search_requests,
      duree_s: Math.round((Date.now() - debut) / 1000), statut: res.subtype,
    }) + "\n");
  }
  if (res.is_error || res.subtype !== "success")
    throw new Error(`${r.id} : échec de la rédaction (${res.subtype ?? "?"}) ${String(res.result ?? "").slice(0, 300)}`);

  // Le texte utile commence au premier « --- » ; on retire un éventuel bloc de code autour.
  const texte = String(res.result).replace(/^[\s\S]*?(?=^---\s*$)/m, "").replace(/\n```\s*$/, "").trim();
  if (!texte.startsWith("---")) throw new Error(`${r.id} : la réponse ne commence pas par un en-tête « --- »`);
  process.stdout.write(texte + "\n");
}, AIDE);
