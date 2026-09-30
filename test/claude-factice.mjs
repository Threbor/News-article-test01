#!/usr/bin/env node
// Substitut de la commande « claude » pour les tests : lit la consigne, renvoie le JSON que
// renverrait « claude -p --output-format json », avec pour texte un article du dossier test/fixtures.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
let consigne = "";
for await (const m of process.stdin) consigne += m;

const rubrique = consigne.match(/\(id : ([a-z-]+)\)/)?.[1] ?? "editorial";
const date = consigne.match(/`date: (\d{4}-\d{2}-\d{2})`/)?.[1] ?? "2099-01-05";
const fichier = path.join(ici, "fixtures", `${rubrique}.md`);
const texte = fs.existsSync(fichier) ? fs.readFileSync(fichier, "utf8").replaceAll("2099-01-05", date) : "pas d'en-tête";

process.stdout.write(JSON.stringify({
  type: "result", subtype: "success", is_error: false, num_turns: 3, total_cost_usd: 0.01,
  usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, server_tool_use: { web_search_requests: 1 } },
  result: "Voici l'article demandé :\n\n" + texte,
}));
