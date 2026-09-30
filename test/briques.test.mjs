// Tests des briques : markdown, lecture d'article, règles, corps, flux. Aucun réseau.
// Lancer : npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { blocs, inline, liensDe } from "../lib/markdown.mjs";
import { lireArticle } from "../lib/article.mjs";
import { controler } from "../lib/regles.mjs";
import { chargerConfig } from "../lib/config.mjs";
import { rendreCorps, marquerTermes } from "../site/corps.mjs";
import { classer, dedoublonner, lireFlux } from "../lib/flux.mjs";
import { couperChapo, titreCourt, typographier } from "../lib/texte.mjs";

const fixture = (f) => fs.readFileSync(new URL(`fixtures/${f}`, import.meta.url), "utf8");
const config = chargerConfig();

test("markdown : liens à parenthèses, typographie, termes balisés", () => {
  const md = "Voir [la crise](https://fr.wikipedia.org/wiki/Crise_(2026)) : « finale ».";
  assert.deepEqual(liensDe(md), ["https://fr.wikipedia.org/wiki/Crise_(2026)"]);
  const html = inline(md);
  assert.match(html, /href="https:\/\/fr\.wikipedia\.org\/wiki\/Crise_\(2026\)"/);
  assert.match(html, / :/);
  assert.match(html, /« finale »/);
  assert.equal(typographier("« a »"), typographier(typographier("« a »")), "la typographie est idempotente");
  assert.match(inline("le [[détroit|detroit-d-ormuz]] est fermé", { terme: (t, id) => `<T ${id}>${t}</T>` }), /<T detroit-d-ormuz>détroit<\/T>/);
  assert.match(blocs("## Titre\n\nTexte\n\n> Citation — Auteur"), /<h2 id="titre">Titre<\/h2>[\s\S]*<cite>Auteur<\/cite>/);
});

test("texte : chapô et titre court", () => {
  assert.deepEqual(couperChapo("Une phrase. Une autre phrase."), ["Une phrase.", "Une autre phrase."]);
  assert.equal(titreCourt("Ormuz contre l'uranium, le marchandage impossible"), "Ormuz contre l'uranium");
  assert.equal(titreCourt("Court, vraiment"), "Court, vraiment");
  assert.equal(titreCourt("Titre long", "Explicite"), "Explicite");
});

test("article : lecture des sections", () => {
  const a = lireArticle(fixture("international.md"), { date: "2099-01-05", slug: "international" });
  assert.equal(a.rubrique, "international");
  assert.equal(a.enBref.length, 3);
  assert.ok(a.notions.length >= 2 && a.notions.every((n) => n.id && n.url));
  assert.ok(a.sources.length >= 5 && a.sources.every((s) => s.url));
  assert.ok(!/^## (Sources|En bref)/m.test(a.corps), "le corps ne contient plus les sections spéciales");
  const b = lireArticle(fixture("essentiel.md"), { date: "2099-01-05", slug: "essentiel", format: "breves" });
  assert.ok(b.breves.length >= 8 && b.breves[0].n === 1);
});

test("règles : conforme, puis défauts détectés", () => {
  const a = lireArticle(fixture("international.md"), { date: "2099-01-05", slug: "international" });
  const regles = config.formats.article.regles;
  assert.deepEqual(controler(a, regles), []);
  const abime = { ...a, enBref: a.enBref.slice(0, 2), notions: [], brut: a.brut + "\n[[x|inconnue]]" };
  const p = controler(abime, regles);
  assert.ok(p.some((x) => x.includes("En bref")));
  assert.ok(p.some((x) => x.includes("Notions clés")));
  assert.ok(p.some((x) => x.includes("inconnue")));
});

test("corps : appels numérotés comme la liste des sources, lien inconnu ajouté", () => {
  const a = {
    corps: "Selon [Reuters](https://r.com/a), puis [un inédit](https://x.org/b), puis [Reuters encore](https://r.com/a).",
    sources: [{ titre: "Autre", url: "https://z.com" }, { titre: "Reuters", url: "https://r.com/a" }],
    notions: [],
  };
  const { html, sources } = rendreCorps(a, "../");
  assert.deepEqual([...html.matchAll(/data-source="(\d+)"/g)].map((m) => m[1]), ["2", "3", "2"]);
  assert.equal(sources.length, 3);
  assert.equal(sources[2].url, "https://x.org/b");
});

test("corps : notion reliée à sa première occurrence, hors liens et intertitres", () => {
  const html = "<h2>Le détroit d’Ormuz</h2><p>Un <a href='#'>détroit d’Ormuz</a> puis le Détroit d'Ormuz, encore le détroit d’Ormuz.</p>";
  const out = marquerTermes(html, [{ id: "detroit-d-ormuz", terme: "Détroit d’Ormuz (Golfe)" }], "../");
  assert.equal((out.match(/class="terme"/g) || []).length, 1);
  assert.match(out, /puis le <a class="terme" href="\.\.\/notions\.html#detroit-d-ormuz" data-notion="detroit-d-ormuz">Détroit d'Ormuz<\/a>/);
  assert.ok(out.startsWith("<h2>Le détroit d’Ormuz</h2>"));
});

test("flux : RSS et Atom, classement, doublons", () => {
  const rss = lireFlux(fixture("flux.rss"));
  assert.equal(rss.length, 2, "l'entrée sans lien est ignorée");
  assert.equal(rss[1].titre, "La BCE maintient ses taux & surveille l’inflation");
  assert.equal(rss[0].resume, "Les services d'urgence sont perturbés.");
  assert.equal(rss[0].date, "2099-01-04T08:00:00.000Z");
  const atom = lireFlux(fixture("flux.atom"));
  assert.equal(atom[0].url, "https://exemple.eu/texte");

  const rubs = config.rubriques.filter((r) => r.motsCles);
  assert.equal(classer(rss[0], { rubriques: [] }, rubs), "cybersecurite");
  assert.equal(classer(rss[1], { rubriques: [] }, rubs), "economie");
  assert.equal(classer(rss[1], { rubriques: ["europe"] }, rubs), "europe", "un flux thématique impose sa rubrique");
  assert.equal(dedoublonner([...rss, ...rss]).length, 2);
});
