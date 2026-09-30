// La une : article principal, éditorial, sommaire du numéro, carrousel des brèves, cahiers.

import { brevesUne, carte, chapo, echapper, entreeSommaire, inline, meta, pluriel, surtitre } from "./composants.mjs";
import { page } from "./page.mjs";
import { dateAbregee, dateLongue, majuscule } from "../lib/texte.mjs";

export function pageUne(edition, precedente, config) {
  const r = "";
  const { une, edito, essentiel } = edition;
  const reste = edition.articles.filter((a) => a.format === "article" && a !== une);

  const principal = une ? `<div class="principal">
    ${surtitre(une, r, { double: true })}
    <h1><a href="${une.url}">${inline(une.titre)}</a></h1>
    <p class="chapo">${chapo(une.chapo)}</p>
    ${meta(une)}
    ${une.enBref.length ? `<ul class="points grands">${une.enBref.map((p) => `<li>${inline(p)}</li>`).join("")}</ul>` : ""}
    <p class="lire"><a href="${une.url}">Lire l’article <span class="lire-duree">· ${une.minutes} min${une.nbSources ? ` · ${une.nbSources} sources` : ""}</span> →</a></p>
  </div>` : "";

  const aside = edito ? `<aside class="edito">
    <p class="surtitre">Éditorial</p>
    <h2><a href="${edito.url}">${inline(edito.titre)}</a></h2>
    <p class="chapo">${inline(edito.chapo)}</p>
    <p class="meta">Par <span class="auteur">${echapper(edito.auteur)}</span></p>
    <p class="lire"><a href="${edito.url}">Lire l’éditorial <span class="lire-duree">· ${edito.minutes} min</span> →</a></p>
  </aside>` : "";

  const sommaire = `<section class="section-sommaire" id="sommaire" aria-labelledby="t-sommaire">
    <h2 class="titre-section" id="t-sommaire"><span>Au sommaire du N<sup>o</sup> ${edition.numero}</span><span class="compte">${pluriel(edition.total, "article")} · ${edition.minutes} min</span></h2>
    <ol class="sommaire sommaire-une">${edition.articles.filter((a) => a.num).map((a) => entreeSommaire(a, r)).join("")}</ol>
  </section>`;

  const breves = essentiel ? `<section class="section-essentiel" aria-labelledby="t-ess">
    <h2 class="titre-section" id="t-ess"><a href="${essentiel.url}">L’essentiel du jour</a><span class="compte">${pluriel(essentiel.breves.length, "brève")} · ${essentiel.minutes} min</span></h2>
    <div class="carrousel">
      <div class="breves" tabindex="0" aria-label="Les ${essentiel.breves.length} brèves du jour, à faire défiler horizontalement">
        ${brevesUne(essentiel, r)}
      </div>
      <div class="carrousel-nav">
        <button type="button" class="carrousel-prec" aria-label="Brève précédente">←</button>
        <span class="carrousel-position" aria-live="polite">1 / ${essentiel.breves.length}</span>
        <button type="button" class="carrousel-suiv" aria-label="Brève suivante">→</button>
        <a class="carrousel-tout" href="${essentiel.url}">Tout lire à la suite →</a>
      </div>
    </div>
  </section>` : "";

  const cahiers = config.cahiers.map((c) => {
    const liste = reste.filter((a) => a.cahier === c.id);
    return liste.length ? `<section class="section-cahier">
      <h2 class="titre-section"><a href="cahier/${c.id}.html">${echapper(c.nom)}</a><span class="compte">${pluriel(liste.length, "article")}</span></h2>
      <div class="grille">${liste.map((a) => carte(a, r)).join("\n")}</div>
    </section>` : "";
  }).join("\n");

  const notions = edition.articles.map((a) => a.notions[0]).filter(Boolean);
  const blocNotions = notions.length ? `<section class="section-notions">
    <h2 class="titre-section"><a href="notions.html">Les notions du jour</a></h2>
    <p class="intro">Les concepts à maîtriser pour comprendre l’actualité d’aujourd’hui, expliqués et reliés à des ressources de référence.</p>
    <ul class="puces-notions">${notions.map((n) => `<li><a href="notions.html#${n.id}">${inline(n.terme)}</a></li>`).join("")}</ul>
  </section>` : "";

  const contenu = `<section class="une">${principal}${aside}</section>
${sommaire}
${breves}
${cahiers}
${blocNotions}
${precedente ? `<p class="precedent">Édition précédente : <a href="${precedente.date}/index.html">${echapper(dateLongue(precedente.date))}</a> · <a href="archives.html">Toutes les éditions</a></p>` : ""}`;

  return page({
    config, racine: r, contenu, edition, corps: "page-une", actif: "une",
    titre: `${config.nom} — ${majuscule(dateLongue(edition.date))}`, description: config.devise,
    dateEdition: edition.date, numero: edition.numero,
    bandeau: `N<sup>o</sup> ${edition.numero} · ${dateAbregee(edition.date)}`,
  });
}
