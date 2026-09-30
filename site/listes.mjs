// Pages de liste : sommaire d'une édition, cahier, rubrique, archives.

import { carte, echapper, inline, pluriel } from "./composants.mjs";
import { page } from "./page.mjs";
import { dateAbregee, dateCourte, dateLongue, majuscule } from "../lib/texte.mjs";

const bandeauDu = (e) => (e ? `N<sup>o</sup> ${e.numero} · ${dateAbregee(e.date)}` : "");

export function pageSommaire(edition, config, dujour) {
  const r = "../";
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Édition n<sup>o</sup> ${edition.numero}</p>
  <h1>${echapper(majuscule(dateLongue(edition.date)))}</h1>
</header>
<div class="grille">${edition.articles.map((a) => carte(a, r, { bref: true })).join("\n")}</div>`;
  return page({ config, racine: r, contenu, edition: dujour, corps: "page-liste",
    titre: `Édition du ${dateCourte(edition.date)} — ${config.nom}`, description: config.devise,
    dateEdition: edition.date, numero: edition.numero, bandeau: bandeauDu(edition) });
}

export function pageCahier(cahier, editions, config) {
  const r = "../";
  const rubs = config.rubriques.filter((x) => x.cahier === cahier.id);
  const sections = rubs.map((rub) => {
    const liste = editions.flatMap((e) => e.articles.filter((a) => a.rubrique === rub.id)).slice(0, 6);
    return `<section class="section-cahier" id="${rub.id}">
      <h2 class="titre-section"><a href="${r}rubrique/${rub.id}.html">${echapper(rub.nom)}</a><span class="compte">${pluriel(liste.length, "article")}</span></h2>
      <p class="intro">${inline(rub.consigne)}</p>
      <div class="grille">${liste.length ? liste.map((a) => carte(a, r)).join("\n") : `<p class="vide">Premier article à la prochaine édition.</p>`}</div>
    </section>`;
  }).join("\n");
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Cahier</p>
  <h1>${echapper(cahier.nom)}</h1>
</header>
<p class="rubriques-cahier">${rubs.map((x) => `<a href="#${x.id}">${echapper(x.nom)}</a>`).join("")}</p>
${sections}`;
  return page({ config, racine: r, contenu, edition: editions[0], corps: "page-liste", actif: cahier.id,
    titre: `${cahier.nom} — ${config.nom}`, description: `Cahier ${cahier.nom}`,
    bandeau: `Cahier ${echapper(cahier.nom)}` });
}

export function pageRubrique(rub, editions, config) {
  const r = "../";
  const articles = editions.flatMap((e) => e.articles.filter((a) => a.rubrique === rub.id));
  const cahier = config.cahier(rub.cahier);
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Rubrique${cahier ? ` · <a href="${r}cahier/${cahier.id}.html">${echapper(cahier.nom)}</a>` : ""}</p>
  <h1>${echapper(rub.nom)}</h1>
  <p class="chapo">${inline(rub.consigne)}</p>
</header>
<div class="grille">${articles.length ? articles.map((a) => carte(a, r, { bref: true })).join("\n") : `<p class="vide">Premier article à la prochaine édition.</p>`}</div>`;
  return page({ config, racine: r, contenu, edition: editions[0], corps: "page-liste", actif: rub.cahier ?? "",
    titre: `${rub.nom} — ${config.nom}`, description: rub.consigne, bandeau: echapper(rub.court) });
}

export function pageArchives(editions, config) {
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Archives</p>
  <h1>Toutes les éditions</h1>
</header>
<ol class="archives">
${editions.map((e) => `<li>
  <a class="date" href="${e.date}/index.html">N<sup>o</sup> ${e.numero} — ${echapper(majuscule(dateLongue(e.date)))}</a>
  <ul>${e.articles.map((a) => `<li><span class="rub">${echapper(a.rubriqueNom)}</span> <a href="${a.url}">${inline(a.titre)}</a></li>`).join("")}</ul>
</li>`).join("\n")}
</ol>`;
  return page({ config, racine: "", contenu, edition: editions[0], corps: "page-liste",
    titre: `Archives — ${config.nom}`, description: config.devise, bandeau: "Archives" });
}
