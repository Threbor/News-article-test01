// Composants HTML partagés par les gabarits. Fonctions pures : données → chaîne HTML.

import { inline, blocs } from "../lib/markdown.mjs";
import { couperChapo, domaine, echapper, majuscule, texteBrut } from "../lib/texte.mjs";

export { inline, blocs, echapper, texteBrut };

export const ICONES = {
  theme: `<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>`,
  recherche: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>`,
  sommaire: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>`,
  cahiers: `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>`,
};

export const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const num2 = (n) => String(n).padStart(2, "0");

export function chapo(md) {
  const [un, deux] = couperChapo(md);
  return `<span class="chapo-1">${inline(un)}</span>${deux ? ` <span class="chapo-2">${inline(deux)}</span>` : ""}`;
}

export function surtitre(a, racine, { double = false } = {}) {
  const nom = double
    ? `<span class="rub-long">${echapper(a.rubriqueNom)}</span><span class="rub-court">${echapper(a.rubriqueCourt)}</span>`
    : echapper(a.rubriqueNom);
  const sujet = a.surtitre ? `<span class="sep">·</span><span class="sujet">${inline(a.surtitre)}</span>` : "";
  return `<p class="surtitre"><a href="${racine}rubrique/${a.rubrique}.html">${nom}</a>${sujet}</p>`;
}

export const meta = (a, { lire = false } = {}) => `<p class="meta">Par <span class="auteur">${echapper(a.auteur)}</span>${a.lieu ? ` · ${echapper(a.lieu)}` : ""} · ${a.minutes} min${a.nbSources ? ` · <span class="nb-sources">${a.nbSources} sources</span>` : ""}${lire ? `<span class="carte-lire" aria-hidden="true"><span class="a-lire">Lire →</span><span class="lu">Lu ✓</span></span>` : ""}</p>`;

export function carte(a, racine, { bref = false } = {}) {
  return `<article class="carte">
  ${surtitre(a, racine)}
  <h3><a href="${racine}${a.url}">${inline(a.titre)}</a></h3>
  <p class="chapo">${chapo(a.chapo)}</p>
  ${bref && a.enBref.length ? `<ul class="points">${a.enBref.map((p) => `<li>${inline(p)}</li>`).join("")}</ul>` : ""}
  ${meta(a, { lire: true })}
</article>`;
}

// Une entrée de sommaire d'édition (une, feuille, marge d'article).
export function entreeSommaire(a, racine, { courant = false, duree = false } = {}) {
  const numero = a.num ? num2(a.num) : "—";
  const d = a.format === "breves" ? pluriel(a.breves.length, "brève") : `${a.minutes} min`;
  return `<li class="sommaire-item"${courant ? ' aria-current="true"' : ""}><a href="${racine}${a.url}"><span class="sommaire-num">${numero}</span><span class="sommaire-rub">${echapper(a.rubriqueCourt)}</span><span class="sommaire-titre">${inline(a.court)}</span>${duree ? `<span class="sommaire-duree">${d}</span>` : ""}</a></li>`;
}

export function blocEnBref(a) {
  if (!a.enBref.length) return "";
  return `<section class="en-bref" aria-label="En bref">
    <h2>En bref</h2>
    <ul>${a.enBref.map((p) => `<li>${inline(p)}</li>`).join("")}</ul>
  </section>`;
}

export function blocNotions(a, racine) {
  if (!a.notions.length) return "";
  return `<section class="notions-cles">
    <h2>Notions clés</h2>
    <dl>${a.notions.map((n) => `<div id="nc-${n.id}">
      <dt><a href="${racine}notions.html#${n.id}">${inline(n.terme)}</a></dt>
      <dd>${inline(majuscule(n.def))}${n.url ? ` <a class="ext comprendre" href="${n.url}" rel="noopener" target="_blank">Comprendre</a>` : ""}</dd>
    </div>`).join("")}</dl>
  </section>`;
}

// Résumé d'une liste repliée : les trois premiers noms, puis le reste compté.
function resume(noms, mot) {
  const uniques = [...new Set(noms.filter(Boolean))];
  const reste = uniques.length - 3;
  return uniques.slice(0, 3).join(", ") + (reste > 0 ? ` et ${reste} autres ${mot}` : "");
}
const media = (s) => (s.detail || "").replace(/,\s*[^,]*\d{4}[^,]*$/, "").trim() || domaine(s.url);

export function blocPlusLoin(a) {
  if (!a.plusLoin.length) return "";
  const noms = a.plusLoin.map((r) => (r.detail || "").split(/\s*:\s*/)[0] || r.domaine || domaine(r.url));
  return `<details class="plus-loin" open data-replie-mobile>
    <summary><h2>Pour aller plus loin</h2><span class="resume-sources">${pluriel(a.plusLoin.length, "ressource")} · ${echapper(resume(noms, "ressources"))}</span><span class="bascule" aria-hidden="true"></span></summary>
    <div class="ressources">${a.plusLoin.map((r) => r.url ? `<a class="ressource" href="${r.url}" rel="noopener" target="_blank">
      <span class="ressource-domaine">${echapper(domaine(r.url))}</span>
      <span class="ressource-titre">${inline(r.titre)}</span>
      ${r.detail ? `<span class="ressource-detail">${inline(r.detail)}</span>` : ""}
    </a>` : `<div class="ressource">${inline(r.md)}</div>`).join("")}</div>
  </details>`;
}

export function blocSources(sources) {
  if (!sources.length) return "";
  const nb = new Set(sources.map((s) => s.url).filter(Boolean)).size || sources.length;
  return `<details class="sources" id="sources" open data-replie-mobile>
    <summary><h2>Sources <span>${nb}</span></h2><span class="resume-sources">${echapper(resume(sources.filter((s) => s.url).map(media), "médias"))}</span><span class="bascule" aria-hidden="true"></span></summary>
    <ol>${sources.map((s, i) => s.url ? `<li id="source-${i + 1}">
      <a class="ext" href="${s.url}" rel="noopener" target="_blank">${inline(s.titre)}</a>
      <span class="source-detail">${s.detail ? inline(s.detail) : ""}</span>
      <span class="domaine">${echapper(domaine(s.url))}</span>
    </li>` : `<li id="source-${i + 1}">${inline(s.md)}</li>`).join("")}</ol>
  </details>`;
}

// Brèves : cartes simples pour le carrousel de la une, accordéons pour la page L'essentiel.
export function brevesUne(a, racine) {
  return a.breves.map((b) => `<article class="breve">
    <h3>${inline(b.titre)}</h3>
    <p>${echapper(texteBrut(blocs(b.md)))}</p>
    <a class="breve-lien" href="${racine}${a.url}#breve-${b.n}">Lire la brève →</a>
  </article>`).join("\n");
}

export function brevesPage(a) {
  return a.breves.map((b) => `<details class="breve" id="breve-${b.n}" open data-replie-mobile>
    <summary><span class="breve-num">${b.n}</span><h3>${inline(b.titre)}</h3></summary>
    <div class="breve-texte">${blocs(b.md)}</div>
  </details>`).join("\n");
}
