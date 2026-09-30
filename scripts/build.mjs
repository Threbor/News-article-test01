#!/usr/bin/env node
// Générateur statique du journal, sans dépendance.
// Lit content/AAAA-MM-JJ/*.md et produit _site/ : une, articles, cahiers, rubriques,
// glossaire des notions, recherche, archives et flux RSS.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { decouper } from "./verifier.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "_site");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));

const CAHIERS = config.cahiers ?? [];
const RUBRIQUES = new Map(config.rubriques.map((r) => [r.id, r]));
RUBRIQUES.set("editorial", { id: "editorial", nom: "Éditorial", agent: "Le rédacteur en chef" });
const ORDRE = ["editorial", "essentiel", ...config.rubriques.map((r) => r.id)];

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// ---------- Utilitaires ----------

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const slugifier = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const domaine = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const texteBrut = (html) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function dateLongue(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  const j = d.getUTCDate();
  return `${JOURS[d.getUTCDay()]} ${j === 1 ? "1er" : j} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const dateCourte = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// Typographie française : espaces insécables avant ; : ! ? et dans les guillemets.
function typo(html) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => part.startsWith("<") ? part : part
      .replace(/(?<!&[a-zA-Z0-9#]+)[ \u00A0\u202F]?([;!?])(?=\s|$|<)/g, "\u202F$1")
      .replace(/[ \u00A0\u202F]:/g, "\u00A0:")
      .replace(/«[ \u00A0\u202F]*/g, "«\u00A0")
      .replace(/[ \u00A0\u202F]*»/g, "\u00A0»")
      .replace(/\.\.\./g, "…")
      .replace(/'/g, "’"))
    .join("");
}

// ---------- Markdown minimal ----------

function lien(texte, url) {
  if (/^https?:\/\//.test(url)) {
    const d = domaine(url);
    return `<a class="ext" href="${url}" title="${esc(d)}" rel="noopener" target="_blank">${texte}</a>`;
  }
  if (/^(javascript|data):/i.test(url)) return texte;
  return `<a href="${url}">${texte}</a>`;
}

function inline(text) {
  let s = esc(text);
  s = s.replace(/\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g, (_, t, u) => lien(t, u.replace(/&amp;/g, "&")));
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return typo(s);
}

function markdown(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  const out = [];
  let para = [], list = null, quote = [];
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`); para = []; };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) {
      const [texte, auteur] = quote.join(" ").split(/\s+—\s+(?=[^—]+$)/);
      out.push(`<blockquote><p>${inline(texte)}</p>${auteur ? `<cite>${inline(auteur)}</cite>` : ""}</blockquote>`);
    }
    quote = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const line of lines) {
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = line.match(/^(#{2,4})\s+(.*)$/))) {
      flushAll();
      const lvl = m[1].length;
      out.push(`<h${lvl} id="${slugifier(m[2])}">${inline(m[2])}</h${lvl}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll(); out.push("<hr>");
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); flushList(); quote.push(m[1]);
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
      list.items.push(m[1]);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); flushQuote();
      if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
      list.items.push(m[1]);
    } else if (list && /^\s{2,}\S/.test(line)) {
      list.items[list.items.length - 1] += " " + line.trim();
    } else {
      flushList(); flushQuote(); para.push(line.trim());
    }
  }
  flushAll();
  return out.join("\n");
}

// ---------- Sections spéciales ----------

const puces = (src = "") => src.split("\n").filter((l) => /^\s*[-*]\s+/.test(l))
  .map((l) => l.replace(/^\s*[-*]\s+/, "").trim());

function parseNotions(src) {
  return puces(src).map((l) => {
    const m = l.match(/^\*\*(.+?)\*\*\s*[:：—–-]?\s*(.*)$/);
    const terme = m ? m[1].trim() : l.split(/[:：]/)[0].trim();
    const reste = m ? m[2] : l.slice(terme.length).replace(/^\s*[:：]\s*/, "");
    const url = (reste.match(/\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/) || [])[1] ?? "";
    // La définition sans le lien « Comprendre » final, qui est rendu à part.
    const def = majuscule(reste.replace(/\s*\[[^\]]+\]\(https?:\/\/(?:[^()\s]|\([^()\s]*\))+\)\s*\.?\s*$/, "").trim());
    return { terme, slug: slugifier(terme), defHtml: inline(def), url };
  });
}

function parseLiens(src) {
  return puces(src).map((l) => {
    const m = l.match(/^\[([^\]]+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)\s*[—–-]?\s*(.*)$/);
    if (!m) return { html: inline(l) };
    return { titre: m[1], url: m[2], detail: m[3], domaine: domaine(m[2]) };
  });
}

function parseBreves(corps) {
  return corps.split(/^###\s+/m).slice(1).map((b) => {
    const [titre, ...reste] = b.split("\n");
    return { titre: titre.trim(), html: markdown(reste.join("\n")) };
  });
}

// ---------- Lecture des articles ----------

function parseArticle(file, date) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r/g, "");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`En-tête manquant : ${file}`);
  const meta = {};
  for (const l of m[1].split("\n")) {
    const kv = l.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  for (const k of ["titre", "chapo"]) if (!meta[k]) throw new Error(`Clé « ${k} » manquante : ${file}`);

  const slug = path.basename(file, ".md");
  const rubrique = meta.rubrique || slug;
  const r = RUBRIQUES.get(rubrique);
  const { corps, sections } = decouper(m[2].trim());
  const estBreves = r?.format === "breves";
  const sources = parseLiens(sections.Sources);
  const mots = corps.replace(/\]\([^)]*\)/g, "]").split(/\s+/).filter(Boolean).length;
  const liensTotal = (raw.match(/\]\(https?:\/\//g) || []).length;

  return {
    ...meta,
    slug,
    rubrique,
    date,
    cahier: r?.cahier ?? null,
    rubriqueNom: r?.nom ?? rubrique,
    auteur: meta.auteur || r?.agent || "La rédaction",
    corpsHtml: estBreves ? "" : markdown(corps),
    breves: estBreves ? parseBreves(corps) : [],
    enBref: puces(sections["En bref"]).map(inline),
    notions: parseNotions(sections["Notions clés"]),
    plusLoin: parseLiens(sections["Pour aller plus loin"]),
    sources,
    nbSources: new Set(sources.map((s) => s.url).filter(Boolean)).size,
    liensTotal,
    lecture: Math.max(1, Math.round(mots / 230)),
    url: `${date}/${slug}.html`,
  };
}

function lireEditions() {
  if (!fs.existsSync(CONTENT)) return [];
  return fs.readdirSync(CONTENT)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort().reverse()
    .map((date) => {
      const articles = fs.readdirSync(path.join(CONTENT, date))
        .filter((f) => f.endsWith(".md"))
        .map((f) => parseArticle(path.join(CONTENT, date, f), date))
        .sort((a, b) => ORDRE.indexOf(a.rubrique) - ORDRE.indexOf(b.rubrique));
      return { date, articles };
    })
    .filter((e) => e.articles.length);
}

// ---------- Gabarit général ----------

const ICONE_THEME = `<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>`;
const ICONE_RECHERCHE = `<svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm5.5-2 5 5"/></svg>`;

function page({ titre, description, racine, contenu, dateEdition, numero, actif = "", corpsClasse = "" }) {
  const nav = [
    `<a href="${racine}index.html"${actif === "une" ? ' aria-current="page"' : ""}>La une</a>`,
    ...CAHIERS.map((c) => `<a href="${racine}cahier/${c.id}.html"${actif === c.id ? ' aria-current="page"' : ""}>${esc(c.nom)}</a>`),
    `<a href="${racine}notions.html"${actif === "notions" ? ' aria-current="page"' : ""}>Notions</a>`,
  ].join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fbf9f4">
<script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${racine}assets/style.css">
<link rel="alternate" type="application/rss+xml" title="${esc(config.nom)}" href="${racine}flux.xml">
</head>
<body class="${corpsClasse}" data-racine="${racine}">
<a class="evitement" href="#contenu">Aller au contenu</a>
<div class="progression" aria-hidden="true"><span></span></div>
<header class="masthead">
  <div class="barre">
    <span class="barre-date">${dateEdition ? esc(majuscule(dateLongue(dateEdition))) : "&nbsp;"}${numero ? ` · N<sup>o</sup>&nbsp;${numero}` : ""}</span>
    <span class="barre-outils">
      <a href="${racine}recherche.html" class="outil">${ICONE_RECHERCHE}<span>Rechercher</span></a>
      <a href="${racine}archives.html" class="outil"><span>Archives</span></a>
      <button type="button" class="outil theme" aria-label="Changer de thème">${ICONE_THEME}</button>
    </span>
  </div>
  <a class="titre-journal" href="${racine}index.html">${esc(config.nom)}</a>
  <p class="devise">${esc(config.devise)}</p>
</header>
<nav class="cahiers" aria-label="Cahiers"><div class="cahiers-defil">${nav}</div></nav>
<main id="contenu">
${contenu}
</main>
<footer class="pied">
  <p class="pied-nom">${esc(config.nom)}</p>
  <p>${esc(config.devise)}.</p>
  <p>Articles rédigés chaque matin par des agents d’intelligence artificielle à partir des sources liées dans le texte. Chaque fait est cliquable : vérifiez, comparez, approfondissez.</p>
  <p><a href="${racine}archives.html">Archives</a> · <a href="${racine}notions.html">Glossaire des notions</a> · <a href="${racine}recherche.html">Recherche</a> · <a href="${racine}flux.xml">Flux RSS</a></p>
</footer>
<script src="${racine}assets/app.js" defer></script>
</body>
</html>
`;
}

// ---------- Composants ----------

const surtitre = (a, racine) => `<p class="surtitre"><a href="${racine}rubrique/${a.rubrique}.html">${esc(a.rubriqueNom)}</a>${a.surtitre ? `<span class="sep">·</span>${inline(a.surtitre)}` : ""}</p>`;
const meta = (a) => `<p class="meta">Par <span class="auteur">${esc(a.auteur)}</span>${a.lieu ? ` · ${esc(a.lieu)}` : ""} · ${a.lecture} min${a.nbSources ? ` · <span class="nb-sources">${a.nbSources} sources</span>` : ""}</p>`;

function carte(a, racine, { variante = "", bref = false } = {}) {
  return `<article class="carte ${variante}">
  ${surtitre(a, racine)}
  <h3><a href="${racine}${a.url}">${inline(a.titre)}</a></h3>
  <p class="chapo">${inline(a.chapo)}</p>
  ${bref && a.enBref.length ? `<ul class="points">${a.enBref.map((p) => `<li>${p}</li>`).join("")}</ul>` : ""}
  ${meta(a)}
</article>`;
}

function blocBreves(breves, limite = Infinity) {
  return `<div class="breves">${breves.slice(0, limite).map((b) => `<article class="breve">
    <h3>${inline(b.titre)}</h3>
    ${b.html}
  </article>`).join("\n")}</div>`;
}

function blocEnBref(a) {
  if (!a.enBref.length) return "";
  return `<section class="en-bref" aria-label="En bref">
    <h2>En bref</h2>
    <ul>${a.enBref.map((p) => `<li>${p}</li>`).join("")}</ul>
  </section>`;
}

function blocNotions(a, racine) {
  if (!a.notions.length) return "";
  return `<section class="notions-cles">
    <h2>Notions clés</h2>
    <dl>${a.notions.map((n) => `<div>
      <dt><a href="${racine}notions.html#${n.slug}">${inline(n.terme)}</a></dt>
      <dd>${n.defHtml}${n.url ? ` <a class="ext comprendre" href="${n.url}" rel="noopener" target="_blank">Comprendre</a>` : ""}</dd>
    </div>`).join("")}</dl>
  </section>`;
}

function blocPlusLoin(a) {
  if (!a.plusLoin.length) return "";
  return `<section class="plus-loin">
    <h2>Pour aller plus loin</h2>
    <div class="ressources">${a.plusLoin.map((r) => r.url ? `<a class="ressource" href="${r.url}" rel="noopener" target="_blank">
      <span class="ressource-domaine">${esc(r.domaine)}</span>
      <span class="ressource-titre">${inline(r.titre)}</span>
      ${r.detail ? `<span class="ressource-detail">${inline(r.detail)}</span>` : ""}
    </a>` : `<div class="ressource">${r.html}</div>`).join("")}</div>
  </section>`;
}

function blocSources(a) {
  if (!a.sources.length) return "";
  return `<section class="sources" id="sources">
    <h2>Sources <span>${a.nbSources}</span></h2>
    <ol>${a.sources.map((s) => s.url ? `<li>
      <a class="ext" href="${s.url}" rel="noopener" target="_blank">${inline(s.titre)}</a>
      <span class="source-detail">${s.detail ? inline(s.detail) : ""}</span>
      <span class="domaine">${esc(s.domaine)}</span>
    </li>` : `<li>${s.html}</li>`).join("")}</ol>
  </section>`;
}

// ---------- Pages ----------

function pageUne(edition, numero, precedente) {
  const racine = "";
  const arts = edition.articles;
  const edito = arts.find((a) => a.rubrique === "editorial");
  const essentiel = arts.find((a) => a.rubrique === "essentiel");
  const autres = arts.filter((a) => a !== edito && a !== essentiel);
  const une = autres.find((a) => a.rubrique === edito?.une || a.slug === edito?.une) ?? autres[0];
  const reste = autres.filter((a) => a !== une);

  const sectionsCahiers = CAHIERS.map((c) => {
    const liste = reste.filter((a) => a.cahier === c.id);
    if (!liste.length) return "";
    return `<section class="section-cahier">
      <h2 class="titre-section"><a href="cahier/${c.id}.html">${esc(c.nom)}</a></h2>
      <div class="grille">${liste.map((a) => carte(a, racine)).join("\n")}</div>
    </section>`;
  }).join("\n");
  const horsCahier = reste.filter((a) => !a.cahier);

  const notionsDuJour = arts.flatMap((a) => a.notions);
  const contenu = `
<section class="une">
  ${une ? `<article class="principal">
    ${surtitre(une, racine)}
    <h1><a href="${une.url}">${inline(une.titre)}</a></h1>
    <p class="chapo">${inline(une.chapo)}</p>
    ${meta(une)}
    ${une.enBref.length ? `<ul class="points grands">${une.enBref.map((p) => `<li>${p}</li>`).join("")}</ul>` : `<div class="extrait">${une.corpsHtml.split("\n").filter((l) => l.startsWith("<p>")).slice(0, 2).join("\n")}</div>`}
    <p class="lire"><a href="${une.url}">Lire l’article →</a></p>
  </article>` : ""}
  ${edito ? `<aside class="edito">
    <p class="surtitre">Éditorial</p>
    <h2><a href="${edito.url}">${inline(edito.titre)}</a></h2>
    <p class="chapo">${inline(edito.chapo)}</p>
    <p class="meta">Par <span class="auteur">${esc(edito.auteur)}</span></p>
    <p class="lire"><a href="${edito.url}">Lire l’éditorial →</a></p>
  </aside>` : ""}
</section>
${essentiel ? `<section class="section-essentiel">
  <h2 class="titre-section"><a href="${essentiel.url}">L’essentiel du jour</a><span class="compte">${essentiel.breves.length} brèves · ${essentiel.nbSources} sources</span></h2>
  ${blocBreves(essentiel.breves, 9)}
  ${essentiel.breves.length > 9 ? `<p class="lire"><a href="${essentiel.url}">Toutes les brèves →</a></p>` : ""}
</section>` : ""}
${sectionsCahiers}
${horsCahier.length ? `<section class="section-cahier"><h2 class="titre-section">Également</h2><div class="grille">${horsCahier.map((a) => carte(a, racine)).join("\n")}</div></section>` : ""}
${notionsDuJour.length ? `<section class="section-notions">
  <h2 class="titre-section"><a href="notions.html">Les notions du jour</a></h2>
  <p class="intro">Les concepts à maîtriser pour comprendre l’actualité d’aujourd’hui, expliqués et reliés à des ressources de référence.</p>
  <ul class="puces-notions">${notionsDuJour.map((n) => `<li><a href="notions.html#${n.slug}">${inline(n.terme)}</a></li>`).join("")}</ul>
</section>` : ""}
${precedente ? `<p class="precedent">Édition précédente : <a href="${precedente.date}/index.html">${esc(dateLongue(precedente.date))}</a> · <a href="archives.html">Toutes les éditions</a></p>` : ""}`;
  return page({ titre: `${config.nom} — ${majuscule(dateLongue(edition.date))}`, description: config.devise,
    racine, contenu, dateEdition: edition.date, numero, actif: "une", corpsClasse: "accueil" });
}

function pageSommaire(edition, numero) {
  const racine = "../";
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Édition n<sup>o</sup> ${numero}</p>
  <h1>${esc(majuscule(dateLongue(edition.date)))}</h1>
</header>
<div class="grille">
${edition.articles.map((a) => carte(a, racine, { bref: true })).join("\n")}
</div>`;
  return page({ titre: `Édition du ${dateCourte(edition.date)} — ${config.nom}`, description: config.devise,
    racine, contenu, dateEdition: edition.date, numero });
}

function pageArticle(a, edition, numero) {
  const racine = "../";
  const idx = edition.articles.indexOf(a);
  const prec = edition.articles[idx - 1];
  const suiv = edition.articles[idx + 1];
  const estBreves = a.breves.length > 0;
  const contenu = `
<article class="article${estBreves ? " article-breves" : ""}${a.rubrique === "editorial" ? " article-edito" : ""}">
  <header class="article-entete">
    ${surtitre(a, racine)}
    <h1>${inline(a.titre)}</h1>
    <p class="chapo">${inline(a.chapo)}</p>
    <p class="meta">Par <span class="auteur">${esc(a.auteur)}</span>${a.lieu ? ` · ${esc(a.lieu)}` : ""} · ${esc(dateLongue(a.date))}${estBreves ? "" : ` · ${a.lecture} min de lecture`}${a.nbSources ? ` · <a href="#sources">${a.nbSources} sources</a>` : ""}</p>
  </header>
  <div class="article-grille">
    <div class="article-principal">
      ${blocEnBref(a)}
      ${estBreves ? blocBreves(a.breves) : `<div class="corps">\n${a.corpsHtml}\n</div>`}
      ${blocPlusLoin(a)}
      ${blocSources(a)}
    </div>
    <aside class="article-marge">
      ${blocNotions(a, racine)}
      <nav class="edition-nav" aria-label="Dans cette édition">
        <h2>Dans cette édition</h2>
        <ol>${edition.articles.map((x) => `<li${x === a ? ' aria-current="true"' : ""}><a href="${x.slug}.html"><span>${esc(x.rubriqueNom)}</span>${inline(x.titre)}</a></li>`).join("")}</ol>
      </nav>
    </aside>
  </div>
  <nav class="suite" aria-label="Article précédent et suivant">
    ${prec ? `<a class="suite-prec" href="${prec.slug}.html"><span>← ${esc(prec.rubriqueNom)}</span>${inline(prec.titre)}</a>` : "<span></span>"}
    ${suiv ? `<a class="suite-suiv" href="${suiv.slug}.html"><span>${esc(suiv.rubriqueNom)} →</span>${inline(suiv.titre)}</a>` : "<span></span>"}
  </nav>
</article>`;
  return page({ titre: `${texteBrut(inline(a.titre))} — ${config.nom}`, description: texteBrut(inline(a.chapo)), racine, contenu,
    dateEdition: edition.date, numero, actif: a.cahier ?? "", corpsClasse: "page-article" });
}

function pageCahier(c, editions) {
  const racine = "../";
  const rubs = config.rubriques.filter((r) => r.cahier === c.id);
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Cahier</p>
  <h1>${esc(c.nom)}</h1>
  <p class="rubriques-cahier">${rubs.map((r) => `<a href="${racine}rubrique/${r.id}.html">${esc(r.nom)}</a>`).join("")}</p>
</header>
${rubs.map((r) => {
    const liste = editions.flatMap((e) => e.articles.filter((a) => a.rubrique === r.id)).slice(0, 6);
    return `<section class="section-cahier">
      <h2 class="titre-section"><a href="${racine}rubrique/${r.id}.html">${esc(r.nom)}</a></h2>
      <p class="intro">${inline(r.consigne ?? "")}</p>
      <div class="grille">${liste.length ? liste.map((a) => carte(a, racine)).join("\n") : `<p class="vide">Premier article à la prochaine édition.</p>`}</div>
    </section>`;
  }).join("\n")}`;
  return page({ titre: `${c.nom} — ${config.nom}`, description: `Cahier ${c.nom}`, racine, contenu, actif: c.id });
}

function pageRubrique(r, articles) {
  const racine = "../";
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Rubrique${r.cahier ? ` · <a href="${racine}cahier/${r.cahier}.html">${esc(CAHIERS.find((c) => c.id === r.cahier)?.nom ?? "")}</a>` : ""}</p>
  <h1>${esc(r.nom)}</h1>
  ${r.consigne ? `<p class="chapo">${inline(r.consigne)}</p>` : ""}
</header>
<div class="grille">
${articles.length ? articles.map((a) => carte(a, racine, { bref: true })).join("\n") : `<p class="vide">Premier article à la prochaine édition.</p>`}
</div>`;
  return page({ titre: `${r.nom} — ${config.nom}`, description: r.consigne ?? config.devise, racine, contenu, actif: r.cahier ?? "" });
}

function pageArchives(editions) {
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Archives</p>
  <h1>Toutes les éditions</h1>
</header>
<ol class="archives">
${editions.map((e, i) => `<li>
  <a class="date" href="${e.date}/index.html">N<sup>o</sup> ${editions.length - i} — ${esc(majuscule(dateLongue(e.date)))}</a>
  <ul>${e.articles.map((a) => `<li><span class="rub">${esc(a.rubriqueNom)}</span> <a href="${a.url}">${inline(a.titre)}</a></li>`).join("")}</ul>
</li>`).join("\n")}
</ol>`;
  return page({ titre: `Archives — ${config.nom}`, description: config.devise, racine: "", contenu });
}

function pageNotions(editions) {
  const index = new Map();
  for (const e of editions) for (const a of e.articles) for (const n of a.notions) {
    if (!index.has(n.slug)) index.set(n.slug, { ...n, articles: [] });
    index.get(n.slug).articles.push(a);
  }
  const notions = [...index.values()].sort((x, y) => x.slug.localeCompare(y.slug));
  const lettres = [...new Set(notions.map((n) => n.slug[0]?.toUpperCase()))];
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Glossaire</p>
  <h1>Les notions de l’actualité</h1>
  <p class="chapo">Chaque article explique les concepts nécessaires pour le comprendre. Ils sont réunis ici, avec une ressource de référence pour approfondir et les articles où ils apparaissent.</p>
  <p class="lettres">${lettres.map((l) => `<a href="#lettre-${l}">${l}</a>`).join("")}</p>
</header>
<div class="glossaire">
${lettres.map((l) => `<section id="lettre-${l}">
  <h2 class="lettre">${l}</h2>
  <dl>${notions.filter((n) => n.slug[0]?.toUpperCase() === l).map((n) => `<div class="notion" id="${n.slug}">
    <dt>${inline(n.terme)}</dt>
    <dd>
      <p>${n.defHtml}</p>
      <p class="notion-liens">${n.url ? `<a class="ext" href="${n.url}" rel="noopener" target="_blank">Comprendre · ${esc(domaine(n.url))}</a>` : ""}
      ${n.articles.map((a) => `<a href="${a.url}">${inline(a.titre)}</a>`).join("")}</p>
    </dd>
  </div>`).join("")}</dl>
</section>`).join("\n")}
${notions.length ? "" : `<p class="vide">Le glossaire se remplira avec les prochaines éditions.</p>`}
</div>`;
  return page({ titre: `Notions — ${config.nom}`, description: "Glossaire des notions de l’actualité", racine: "", contenu, actif: "notions" });
}

function pageRecherche() {
  const options = [...RUBRIQUES.values()].map((r) => `<option value="${r.id}">${esc(r.nom)}</option>`).join("");
  const contenu = `
<header class="entete-liste">
  <p class="surtitre">Recherche</p>
  <h1>Explorer les archives</h1>
</header>
<form class="recherche" role="search" onsubmit="return false">
  <label class="visuel-cache" for="q">Rechercher</label>
  <input id="q" type="search" placeholder="Un pays, une notion, une personnalité…" autocomplete="off" autofocus>
  <label class="visuel-cache" for="rub">Rubrique</label>
  <select id="rub"><option value="">Toutes les rubriques</option>${options}</select>
</form>
<p class="recherche-etat" id="etat" aria-live="polite"></p>
<div class="grille" id="resultats"></div>`;
  return page({ titre: `Recherche — ${config.nom}`, description: "Rechercher dans les articles", racine: "", contenu, corpsClasse: "page-recherche" });
}

function indexRecherche(editions) {
  return editions.flatMap((e) => e.articles.map((a) => ({
    u: a.url, t: texteBrut(inline(a.titre)), c: texteBrut(inline(a.chapo)), s: a.surtitre ?? "",
    r: a.rubrique, rn: a.rubriqueNom, d: a.date, dl: dateCourte(a.date),
    n: a.notions.map((n) => n.terme).join(" · "), b: a.enBref.map(texteBrut).join(" "),
    x: a.breves.map((b) => b.titre).join(" · "),
  })));
}

function flux(editions) {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const base = (process.env.SITE_URL || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
  const items = editions.flatMap((e) => e.articles).slice(0, 60).map((a) => `<item>
  <title>${esc(texteBrut(inline(a.titre)))}</title>
  <link>${esc(`${base}/${a.url}`)}</link>
  <guid>${esc(`${base}/${a.url}`)}</guid>
  <category>${esc(a.rubriqueNom)}</category>
  <pubDate>${new Date(`${a.date}T05:00:00Z`).toUTCString()}</pubDate>
  <description>${esc(texteBrut(inline(a.chapo)))}</description>
</item>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<title>${esc(config.nom)}</title>
<link>${esc(base || "/")}</link>
<description>${esc(config.devise)}</description>
<language>fr</language>
${items}
</channel></rss>
`;
}

// ---------- Construction ----------

function ecrire(rel, contenu) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, contenu);
}

const editions = lireEditions();
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });

if (!editions.length) {
  ecrire("index.html", page({ titre: config.nom, description: config.devise, racine: "",
    contenu: `<header class="entete-liste"><h1>Première édition en préparation</h1><p class="chapo">La rédaction travaille. Revenez demain matin.</p></header>` }));
} else {
  editions.forEach((e, i) => {
    const numero = editions.length - i;
    if (i === 0) ecrire("index.html", pageUne(e, numero, editions[1]));
    ecrire(`${e.date}/index.html`, pageSommaire(e, numero));
    for (const a of e.articles) ecrire(a.url, pageArticle(a, e, numero));
  });
}
for (const c of CAHIERS) ecrire(`cahier/${c.id}.html`, pageCahier(c, editions));
for (const r of RUBRIQUES.values()) {
  ecrire(`rubrique/${r.id}.html`, pageRubrique(r, editions.flatMap((e) => e.articles.filter((a) => a.rubrique === r.id))));
}
ecrire("archives.html", pageArchives(editions));
ecrire("notions.html", pageNotions(editions));
ecrire("recherche.html", pageRecherche());
ecrire("recherche.json", JSON.stringify(indexRecherche(editions)));
ecrire("flux.xml", flux(editions));

const total = editions.reduce((n, e) => n + e.articles.length, 0);
const liens = editions.reduce((n, e) => n + e.articles.reduce((m, a) => m + a.liensTotal, 0), 0);
console.log(`✔ ${editions.length} édition(s), ${total} article(s), ${liens} liens → ${path.relative(ROOT, OUT)}/`);
