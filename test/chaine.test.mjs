// Test de la chaîne complète dans une copie jetable du dépôt : plan → dossier → rédaction
// (Claude remplacé par test/claude-factice.mjs) → contrôle → éditorial → site. Aucun réseau, aucun token.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATE = "2099-01-05"; // un lundi

function copie() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "veilleur-"));
  for (const x of ["bin", "lib", "site", "config", "redaction", "donnees", "test", "package.json"]) fs.cpSync(path.join(RACINE, x), path.join(d, x), { recursive: true });
  fs.mkdirSync(path.join(d, "content"));
  return d;
}
const env = { ...process.env, CLAUDE: path.join(RACINE, "test", "claude-factice.mjs"), VEILLEUR_LIENS: "0" };
const lancer = (d, cmd, args, opts = {}) => execFileSync(cmd, args, { cwd: d, env, encoding: "utf8", ...opts });

test("plan : fréquences du jour, filtres", () => {
  const d = copie();
  const lundi = lancer(d, "node", ["bin/plan.mjs", "--date", DATE]).trim().split("\n");
  assert.ok(lundi.includes("europe") && lundi.includes("climat") && !lundi.includes("culture"));
  assert.equal(lundi[0], "editorial");
  assert.deepEqual(lancer(d, "node", ["bin/plan.mjs", "--date", DATE, "--formats", "breves"]).trim(), "essentiel");
  const r = spawnSync("node", ["bin/plan.mjs", "--seulement", "inconnue"], { cwd: d, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /rubrique inconnue/);
});

test("dossier : consigne générée, champ inconnu refusé", () => {
  const d = copie();
  fs.writeFileSync(path.join(d, "dep.jsonl"), JSON.stringify({ rubrique: "international", titre: "Titre test", url: "https://exemple.fr/t", resume: "Résumé", date: `${DATE}T08:00:00Z`, media: "Test" }) + "\n");
  const c = lancer(d, "node", ["bin/dossier.mjs", "--rubrique", "international", "--date", DATE, "--depeches", "dep.jsonl"]);
  assert.match(c, /\[Titre test\]\(https:\/\/exemple\.fr\/t\) — Test/);
  assert.match(c, /Tu as droit à 5 recherches/);
  assert.doesNotMatch(c, /\{\{\w+\}\}/);
  fs.appendFileSync(path.join(d, "redaction/consignes/article.md"), "{{inexistant}}");
  const r = spawnSync("node", ["bin/dossier.mjs", "--rubrique", "international", "--date", DATE], { cwd: d, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\{\{inexistant\}\}/);
});

test("chaîne : rubrique, éditorial, journal de consommation, site", () => {
  const d = copie();
  lancer(d, "bash", ["bin/rubrique.sh", DATE, "international"]);
  lancer(d, "bash", ["bin/rubrique.sh", DATE, "essentiel"]);
  lancer(d, "bash", ["bin/rubrique.sh", DATE, "editorial"]);
  for (const f of ["international.md", "essentiel.md", "editorial.md"]) assert.ok(fs.existsSync(path.join(d, "content", DATE, f)), f);
  const journal = fs.readFileSync(path.join(d, "journal", `${DATE}.jsonl`), "utf8").trim().split("\n").map(JSON.parse);
  assert.equal(journal.length, 3);
  assert.equal(journal[0].statut, "success");

  const sortie = lancer(d, "node", ["bin/construire.mjs"]);
  assert.equal(sortie, "", "construire est silencieux en cas de succès");
  const une = fs.readFileSync(path.join(d, "_site/index.html"), "utf8");
  assert.match(une, /id="sommaire"/);
  assert.match(une, /class="carrousel"/);
  const art = fs.readFileSync(path.join(d, `_site/${DATE}/international.html`), "utf8");
  assert.match(art, /class="ext appel"/);
  assert.match(art, /class="terme"/);
  assert.match(art, /id="feuille-sommaire"/);
  assert.match(art, /assets\/app\.js\?v=[0-9a-f]{10}"/, "les ressources portent l'empreinte de leur contenu");
  assert.match(art, /class="bb-bouton" href="index\.html" data-ouvrir="edition"/, "sans script, Sommaire mène au sommaire de l'édition");
  assert.doesNotMatch(art, /Aller au contenu/);
  assert.match(art, /<\/h1>\s*<figure class="carte">/, "la carte suit immédiatement le titre");
  assert.ok(fs.existsSync(path.join(d, "_site/assets/monde.svg")));

  // Application installable : manifeste valide, icônes présentes, réserve du service worker complète.
  const manifeste = JSON.parse(fs.readFileSync(path.join(d, "_site/manifest.webmanifest"), "utf8"));
  assert.equal(manifeste.display, "standalone");
  for (const i of manifeste.icons) assert.ok(fs.existsSync(path.join(d, "_site", i.src)), i.src);
  const sw = fs.readFileSync(path.join(d, "_site/sw.js"), "utf8");
  const reserve = JSON.parse(sw.match(/const A_GARDER = (\[.*\]);/)[1]);
  assert.ok(reserve.includes(`${DATE}/international.html`), "l'édition du jour est gardée pour la lecture hors connexion");
  for (const u of reserve) assert.ok(fs.existsSync(path.join(d, "_site", u.split("?")[0])), `réserve : ${u} introuvable`);
  assert.match(une, /<link rel="manifest" href="manifest\.webmanifest">/);
});

test("chaîne : une réponse sans en-tête est rejetée bruyamment", () => {
  const d = copie();
  const r = spawnSync("bash", ["bin/rubrique.sh", DATE, "europe"], { cwd: d, env, encoding: "utf8" });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /en-tête/);
  assert.ok(!fs.existsSync(path.join(d, "content", DATE, "europe.md")));
});
