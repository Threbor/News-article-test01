// Gabarit commun à toutes les pages : tête, bandeau, en-tête, navigation, pied,
// barre du bas et feuille « Sommaire » (celle de l'édition du jour).

import { ICONES, echapper, entreeSommaire } from "./composants.mjs";
import { dateLongue, majuscule } from "../lib/texte.mjs";

// URL d'un fichier de site/assets, suivie de l'empreinte de son contenu : un navigateur ne peut
// ainsi jamais garder en cache une ancienne version d'un script avec des pages récentes.
const actif = (p, nom) => `${p.racine}assets/${nom}${p.config.empreintes?.[nom] ? `?v=${p.config.empreintes[nom]}` : ""}`;

const TETE_SCRIPT = `<script>try{var d=document.documentElement;d.classList.add("js");var t=localStorage.getItem("theme");if(t)d.dataset.theme=t;var s=localStorage.getItem("taille");if(s)d.dataset.taille=s}catch(e){}</script>`;

function barreBas(p) {
  const r = p.racine;
  if (p.barre?.type === "article") {
    const b = p.barre;
    return `<nav class="barre-bas barre-bas-article" aria-label="Navigation dans l’édition">
  <a class="bb-bouton" href="index.html" data-ouvrir="edition" aria-haspopup="dialog">${ICONES.sommaire}Sommaire</a>
  <p class="bb-etat"><span class="bb-position">${b.position}</span><span class="bb-reste">≈ ${b.minutes} min restante${b.minutes > 1 ? "s" : ""}</span></p>
  <a class="bb-suivant" href="${b.suivant.href}" aria-label="${echapper(b.suivant.aria)}">${b.suivant.label} →</a>
</nav>`;
  }
  const courant = (nom) => (p.actif === nom ? ' aria-current="page"' : "");
  return `<nav class="barre-bas" aria-label="Navigation">
  <a class="bb-bouton" href="${r}index.html#sommaire" data-ouvrir="edition" aria-haspopup="dialog">${ICONES.sommaire}Sommaire</a>
  <a class="bb-bouton" href="${r}cahier/${p.config.cahiers[0].id}.html" data-ouvrir="cahiers" aria-haspopup="dialog"${p.config.cahiers.some((c) => c.id === p.actif) ? ' aria-current="page"' : ""}>${ICONES.cahiers}Cahiers</a>
  <a class="bb-bouton" href="${r}recherche.html"${courant("recherche")}>${ICONES.recherche}Rechercher</a>
</nav>`;
}

function feuilleSommaire(p) {
  const r = p.racine, e = p.edition, c = p.config;
  if (!e) return "";
  return `<dialog class="feuille feuille-sommaire" id="feuille-sommaire" aria-label="Sommaire et navigation">
  <span class="feuille-poignee" aria-hidden="true"></span>
  <div class="feuille-entete"><p class="feuille-etiquette">N<sup>o</sup> ${e.numero} <span>· ${echapper(majuscule(dateLongue(e.date)))}</span></p><button type="button" class="feuille-fermer">Fermer <span aria-hidden="true">✕</span></button></div>
  <form class="feuille-recherche" action="${r}recherche.html" role="search">
    ${ICONES.recherche}
    <input class="champ" name="q" type="search" placeholder="Rechercher un article, une notion…" aria-label="Rechercher">
  </form>
  <div class="onglets" role="tablist" aria-label="Navigation">
    <button type="button" class="onglet" role="tab" id="onglet-edition" data-onglet="edition" aria-controls="panneau-edition" aria-selected="true">Cette édition</button>
    <button type="button" class="onglet" role="tab" id="onglet-cahiers" data-onglet="cahiers" aria-controls="panneau-cahiers" aria-selected="false">Cahiers &amp; outils</button>
  </div>
  <div class="panneau" id="panneau-edition" role="tabpanel" aria-labelledby="onglet-edition">
    <ol class="sommaire">${e.articles.map((a) => entreeSommaire(a, r, { courant: a.cle === p.courant, duree: true })).join("")}</ol>
  </div>
  <div class="panneau" id="panneau-cahiers" role="tabpanel" aria-labelledby="onglet-cahiers" hidden>
    <ul class="liste-cahiers">${c.cahiers.map((x) => `<li><a class="cahier-lien" href="${r}cahier/${x.id}.html">${echapper(x.nom)}</a><div class="cahier-rubs">${c.rubriques.filter((y) => y.cahier === x.id).map((y) => `<a class="puce" href="${r}rubrique/${y.id}.html">${echapper(y.nom)}</a>`).join("")}</div></li>`).join("")}</ul>
    <p class="panneau-titre">Outils</p>
    <ul class="liens-outils"><li><a href="${r}notions.html">Glossaire</a></li><li><a href="${r}recherche.html">Recherche</a></li><li><a href="${r}archives.html">Archives</a></li><li><a href="${r}flux.xml">Flux RSS</a></li></ul>
    <p class="panneau-titre">Lecture</p>
    <div class="reglages">
      <div class="reglage">Thème <div class="segmente" role="group" aria-label="Thème"><button type="button" data-theme-choix="light" aria-pressed="false">Clair</button><button type="button" data-theme-choix="dark" aria-pressed="false">Sombre</button><button type="button" data-theme-choix="auto" aria-pressed="true">Auto</button></div></div>
      <div class="reglage">Taille du texte <div class="segmente" role="group" aria-label="Taille du texte"><button type="button" data-taille-pas="-1" aria-label="Réduire le texte">A−</button><button type="button" data-taille-pas="1" aria-label="Agrandir le texte">A+</button></div></div>
    </div>
  </div>
</dialog>`;
}

// p : { config, titre, description, racine, contenu, corps, actif, bandeau, edition, dateEdition, numero, barre, courant }
export function page(p) {
  const r = p.racine, c = p.config;
  const nav = [
    `<a href="${r}index.html"${p.actif === "une" ? ' aria-current="page"' : ""}>La une</a>`,
    ...c.cahiers.map((x) => `<a href="${r}cahier/${x.id}.html"${p.actif === x.id ? ' aria-current="page"' : ""}>${echapper(x.nom)}</a>`),
    `<a href="${r}notions.html"${p.actif === "notions" ? ' aria-current="page"' : ""}>Notions</a>`,
  ].join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${echapper(p.titre)}</title>
<meta name="description" content="${echapper(p.description)}">
<meta name="theme-color" content="#fbf9f4">
${TETE_SCRIPT}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${actif(p, "style.css")}">
<link rel="stylesheet" href="${actif(p, "mobile.css")}">
<link rel="alternate" type="application/rss+xml" title="${echapper(c.nom)}" href="${r}flux.xml">
</head>
<body class="${p.corps}" data-racine="${r}">
<div class="progression" aria-hidden="true"><span></span></div>
<div class="bandeau"><a class="bandeau-nom" href="${r}index.html">${echapper(c.nom)}</a><span class="bandeau-info">${p.bandeau}</span></div>
<header class="masthead">
  <div class="barre">
    <span class="barre-date">${p.dateEdition ? echapper(majuscule(dateLongue(p.dateEdition))) : "&nbsp;"}${p.numero ? ` · N<sup>o</sup>&nbsp;${p.numero}` : ""}</span>
    <span class="barre-outils">
      <a href="${r}recherche.html" class="outil">${ICONES.recherche}<span>Rechercher</span></a>
      <a href="${r}archives.html" class="outil"><span>Archives</span></a>
      <button type="button" class="outil theme" aria-label="Changer de thème">${ICONES.theme}</button>
    </span>
  </div>
  <a class="titre-journal" href="${r}index.html">${echapper(c.nom)}</a>
  <p class="devise">${echapper(c.devise)}</p>
</header>
<nav class="cahiers" aria-label="Cahiers"><div class="cahiers-defil">${nav}</div></nav>
<main id="contenu">
${p.contenu}
</main>
<footer class="pied">
  <p class="pied-nom">${echapper(c.nom)}</p>
  <p>${echapper(c.devise)}.</p>
  <p>Articles rédigés chaque matin par des agents d’intelligence artificielle à partir des sources liées dans le texte. Chaque fait est cliquable : vérifiez, comparez, approfondissez.</p>
  <p><a href="${r}archives.html">Archives</a> · <a href="${r}notions.html">Glossaire des notions</a> · <a href="${r}recherche.html">Recherche</a> · <a href="${r}flux.xml">Flux RSS</a></p>
</footer>
${barreBas(p)}
${feuilleSommaire(p)}
<script src="${actif(p, "app.js")}" defer></script>
</body>
</html>
`;
}
