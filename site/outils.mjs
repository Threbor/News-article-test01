// Pages d'outils : glossaire des notions, recherche (et son index), flux RSS.

import { echapper, inline, texteBrut } from "./composants.mjs";
import { page } from "./page.mjs";
import { dateCourte, domaine, majuscule, normaliser } from "../lib/texte.mjs";

// Toutes les notions de toutes les éditions, fusionnées par identifiant.
export function glossaire(editions) {
  const index = new Map();
  for (const e of editions) for (const a of e.articles) for (const n of a.notions) {
    if (!index.has(n.id)) index.set(n.id, { ...n, articles: [] });
    index.get(n.id).articles.push(a);
  }
  return [...index.values()].sort((x, y) => normaliser(x.terme).localeCompare(normaliser(y.terme), "fr"));
}

export function pageNotions(editions, config) {
  const notions = glossaire(editions);
  const lettre = (n) => normaliser(n.terme).charAt(0).toUpperCase();
  const lettres = [...new Set(notions.map(lettre))];
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Glossaire</p>
  <h1>Les notions de l’actualité</h1>
  <p class="chapo">Chaque article explique les concepts nécessaires pour le comprendre. Ils sont réunis ici, avec une ressource de référence pour approfondir et les articles où ils apparaissent.</p>
</header>
<div class="glossaire-outils">
  <label class="visuel-cache" for="filtre-notions">Filtrer les notions</label>
  <input id="filtre-notions" class="champ" type="search" placeholder="Filtrer les ${notions.length} notions" autocomplete="off">
  <p class="lettres">${lettres.map((l) => `<a href="#lettre-${l}">${l}</a>`).join("")}</p>
</div>
<p class="glossaire-etat"><span id="glossaire-compte" aria-live="polite">${notions.length} notions</span><button type="button" class="lien-bouton" data-tout-deplier aria-pressed="false">Tout déplier</button></p>
<div class="glossaire">
${lettres.map((l) => `<section id="lettre-${l}">
  <h2 class="lettre">${l}</h2>
  ${notions.filter((n) => lettre(n) === l).map((n) => `<div class="notion" id="${n.id}">
    <details open data-replie-mobile>
      <summary><span class="notion-terme">${inline(n.terme)}</span><span class="notion-apercu">${echapper(texteBrut(inline(majuscule(n.def))))}</span></summary>
      <div class="notion-corps">
        <p>${inline(majuscule(n.def))}</p>
        <p class="notion-liens">${n.url ? `<a class="ext" href="${n.url}" rel="noopener" target="_blank">Comprendre · ${echapper(domaine(n.url))}</a>` : ""}${n.articles.map((a) => `<a href="${a.url}">${inline(a.titre)}</a>`).join("")}</p>
      </div>
    </details>
  </div>`).join("")}
</section>`).join("\n")}
${notions.length ? "" : `<p class="vide">Le glossaire se remplira avec les prochaines éditions.</p>`}
</div>`;
  return page({ config, racine: "", contenu, edition: editions[0], corps: "page-liste", actif: "notions",
    titre: `Notions — ${config.nom}`, description: "Glossaire des notions de l’actualité", bandeau: "Glossaire" });
}

export function pageRecherche(editions, config) {
  const options = config.rubriques.map((r) => `<option value="${r.id}">${echapper(r.nom)}</option>`).join("");
  const filtres = [
    ...config.cahiers.map((c) => ({ nom: c.nom, rubs: config.rubriques.filter((r) => r.cahier === c.id).map((r) => r.id).join(" ") })),
    ...config.rubriques.filter((r) => !r.cahier).map((r) => ({ nom: r.court, rubs: r.id })),
  ];
  const suggestions = (editions[0]?.articles ?? []).map((a) => a.notions[0]?.terme).filter((t) => t && t.length <= 24).slice(0, 6);
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Recherche</p>
  <h1>Explorer les archives</h1>
</header>
<form class="recherche" role="search" action="recherche.html">
  <div class="recherche-champ">
    <label class="visuel-cache" for="q">Rechercher</label>
    <input id="q" name="q" type="search" placeholder="Un pays, une notion, une personnalité…" autocomplete="off">
    <button type="button" class="recherche-effacer" aria-label="Effacer la recherche" hidden>×</button>
  </div>
  <label class="visuel-cache" for="rub">Rubrique</label>
  <select id="rub"><option value="">Toutes les rubriques</option>${options}</select>
  <div class="filtres" role="group" aria-label="Filtrer par cahier">
    <button type="button" class="puce" data-rubs="" aria-pressed="true">Tout</button>
    ${filtres.map((f) => `<button type="button" class="puce" data-rubs="${f.rubs}" aria-pressed="false">${echapper(f.nom)}</button>`).join("")}
  </div>
</form>
<p class="recherche-etat" id="etat" aria-live="polite"></p>
<div class="suggestions">${suggestions.map((s) => `<button type="button" class="puce" data-q="${echapper(s)}">${echapper(s)}</button>`).join("")}</div>
<div class="grille" id="resultats"></div>`;
  return page({ config, racine: "", contenu, edition: editions[0], corps: "page-liste page-recherche", actif: "recherche",
    titre: `Recherche — ${config.nom}`, description: "Rechercher dans les articles", bandeau: "Recherche" });
}

// Index lu par assets/app.js : clés courtes pour un fichier léger.
export function indexRecherche(editions) {
  return editions.flatMap((e) => e.articles.map((a) => ({
    u: a.url, t: texteBrut(inline(a.titre)), c: texteBrut(inline(a.chapo)), s: a.surtitre ?? "",
    r: a.rubrique, rn: a.rubriqueNom, d: a.date, dl: dateCourte(a.date),
    n: a.notions.map((n) => n.terme).join(" · "), b: a.enBref.map((p) => texteBrut(inline(p))).join(" "),
    x: a.breves.map((b) => b.titre).join(" · "),
  })));
}

export function flux(editions, config, base = "") {
  const items = editions.flatMap((e) => e.articles).slice(0, 60).map((a) => `<item>
  <title>${echapper(texteBrut(inline(a.titre)))}</title>
  <link>${echapper(`${base}/${a.url}`)}</link>
  <guid>${echapper(`${base}/${a.url}`)}</guid>
  <category>${echapper(a.rubriqueNom)}</category>
  <pubDate>${new Date(`${a.date}T05:00:00Z`).toUTCString()}</pubDate>
  <description>${echapper(texteBrut(inline(a.chapo)))}</description>
</item>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<title>${echapper(config.nom)}</title>
<link>${echapper(base || "/")}</link>
<description>${echapper(config.devise)}</description>
<language>fr</language>
${items}
</channel></rss>
`;
}
