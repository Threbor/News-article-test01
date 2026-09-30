// Page d'un article, d'un éditorial ou de L'essentiel du jour.

import { blocEnBref, blocNotions, blocPlusLoin, blocSources, brevesPage, chapo, echapper, inline, pluriel, surtitre, texteBrut } from "./composants.mjs";
import { rendreCorps } from "./corps.mjs";
import { dessinerCarte } from "./carte.mjs";
import { page } from "./page.mjs";
import { dateCourte, dateLongue } from "../lib/texte.mjs";

const AIDE = `<p class="lecture-aide">Touchez un <span class="appel-exemple">chiffre<sup>3</sup></span> pour voir la source, un <span class="terme-exemple">terme en pointillé</span> pour sa définition.</p>`;

// Ce qui suit l'article dans l'ordre de lecture de l'édition.
function suite(a, edition) {
  const liste = edition.articles, i = liste.indexOf(a);
  const prec = liste[i - 1], suiv = liste[i + 1];
  const restants = liste.slice(i + 1).filter((x) => x.num);
  const minRest = restants.reduce((t, x) => t + x.minutes, 0);
  const position = a.num ? `${a.num} / ${edition.total}` : "L’essentiel";
  const bilan = a.num
    ? (restants.length ? `Article ${a.num} sur ${edition.total} · encore ${pluriel(restants.length, "article")}, ${minRest} min` : `Article ${a.num} sur ${edition.total} · dernier de l’édition`)
    : `L’essentiel · encore ${pluriel(restants.length, "article")}, ${minRest} min`;
  const suivant = suiv
    ? { href: `${suiv.slug}.html`, label: "Suivant", aria: `Article suivant : ${texteBrut(inline(suiv.titre))}`,
      etiquette: `À suivre · ${suiv.num ? `${suiv.num} / ${edition.total}` : "L’essentiel"} · ${suiv.rubriqueCourt} →`,
      titre: inline(suiv.titre),
      cta: suiv.format === "breves" ? `Parcourir l’essentiel · ${suiv.minutes} min` : `Lire l’article suivant · ${suiv.minutes} min` }
    : { href: "../index.html#sommaire", label: "Sommaire", aria: "Revenir au sommaire",
      etiquette: "Fin de l’édition", titre: `Vous avez parcouru toute l’édition du ${dateCourte(edition.date)}.`, cta: "Revenir au sommaire" };
  const html = `<nav class="suite" aria-label="Suite de l’édition">
    <p class="suite-bilan">${bilan}</p>
    ${prec ? `<a class="suite-prec" href="${prec.slug}.html"><span>← ${echapper(prec.rubriqueCourt)}</span><strong class="suite-titre">${inline(prec.titre)}</strong></a>` : ""}
    <a class="suite-suiv" href="${suivant.href}"><span>${suivant.etiquette}</span><strong class="suite-titre">${suivant.titre}</strong><em class="suite-cta">${suivant.cta} →</em></a>
    <a class="suite-retour" href="../index.html#sommaire">Voir tout le sommaire</a>
  </nav>`;
  return { html, barre: { type: "article", position, minutes: a.minutes, suivant } };
}

export function pageArticle(a, edition, config) {
  const r = "../";
  const breves = a.format === "breves";
  const { html: corps, sources } = breves ? { html: "", sources: a.sources } : rendreCorps(a, r);
  const { html: navSuite, barre } = suite(a, edition);
  const enTeteMeta = [
    `Par <span class="auteur">${echapper(a.auteur)}</span>`,
    a.lieu && echapper(a.lieu),
    dateLongue(a.date),
    !breves && `${a.minutes} min de lecture`,
    a.nbSources && `<a href="#sources">${a.nbSources} sources</a>`,
  ].filter(Boolean).join(" · ");

  const principal = breves
    ? `<div class="breves-outils">
        <span>${pluriel(a.breves.length, "brève")} · ${a.minutes} min</span>
        <div class="segmente" role="group" aria-label="Affichage des brèves">
          <button type="button" data-mode-breves="titres" aria-pressed="true">Titres</button>
          <button type="button" data-mode-breves="tout" aria-pressed="false">Tout lire</button>
        </div>
      </div>
      <div class="breves">${brevesPage(a)}</div>`
    : `${blocEnBref(a)}<div class="corps">\n${corps}\n</div>${blocPlusLoin(a)}`;

  const contenu = `<article class="article${breves ? " article-breves" : ""}${a.format === "editorial" ? " article-edito" : ""}" data-minutes="${a.minutes}" data-cle="${a.cle}">
  <header class="article-entete">
    ${surtitre(a, r, { double: true })}
    <h1>${inline(a.titre)}</h1>
    <p class="chapo">${chapo(a.chapo)}</p>
    <p class="meta">${enTeteMeta}</p>
    ${a.nbSources && !breves ? AIDE : ""}
  </header>
  ${a.carte ? dessinerCarte(a.carte, config.monde) : ""}
  <div class="article-grille">
    <div class="article-principal">
      ${principal}
      ${blocSources(sources)}
    </div>
    <aside class="article-marge">
      ${blocNotions(a, r)}
      <nav class="edition-nav" id="edition-nav" aria-label="Dans cette édition">
        <h2>Dans cette édition</h2>
        <ol>${edition.articles.map((x) => `<li${x === a ? ' aria-current="true"' : ""}><a href="${x.slug}.html"><span>${echapper(x.rubriqueNom)}</span>${inline(x.titre)}</a></li>`).join("")}</ol>
      </nav>
    </aside>
  </div>
  ${navSuite}
</article>`;

  return page({
    config, racine: r, contenu, edition, barre, courant: a.cle, corps: "page-article", actif: a.cahier ?? "",
    titre: `${texteBrut(inline(a.titre))} — ${config.nom}`, description: texteBrut(inline(a.chapo)),
    dateEdition: edition.date, numero: edition.numero,
    bandeau: `N<sup>o</sup> ${edition.numero} · ${echapper(a.rubriqueCourt)}`,
  });
}
