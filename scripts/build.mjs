#!/usr/bin/env node
// Générateur statique du journal, sans dépendance.
// Lit content/AAAA-MM-JJ/*.md et produit _site/ (une, articles, archives, rubriques).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "_site");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));

const RUBRIQUES = new Map(config.rubriques.map((r) => [r.id, r]));
RUBRIQUES.set("editorial", { id: "editorial", nom: "Éditorial", agent: "Le rédacteur en chef" });

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// ---------- Utilitaires ----------

const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function dateLongue(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${JOURS[d.getUTCDay()]} ${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dateCourte = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// Typographie française : espaces fines insécables avant ; : ! ? et dans les guillemets.
function typo(html) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => part.startsWith("<") ? part : part
      .replace(/(?<!&[a-zA-Z0-9#]+) ?([;!?])(?=\s|$|<)/g, " $1")
      .replace(/ ([:»])/g, " $1")
      .replace(/« ?/g, "« ")
      .replace(/ ?»/g, " »")
      .replace(/\.\.\./g, "…")
      .replace(/'/g, "’"))
    .join("");
}

// ---------- Markdown minimal ----------

function inline(text) {
  let s = esc(text);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, t, u) => `<a href="${u}" rel="noopener" target="_blank">${t}</a>`);
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
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
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

// ---------- Lecture des articles ----------

function parseArticle(file, dateDossier) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`En-tête manquant : ${file}`);
  const meta = {};
  for (const l of m[1].split("\n")) {
    const kv = l.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  let corps = m[2].trim();
  let sources = "";
  const idx = corps.search(/^##\s+Sources\s*$/m);
  if (idx >= 0) {
    sources = corps.slice(idx).replace(/^##\s+Sources\s*$/m, "").trim();
    corps = corps.slice(0, idx).trim();
  }
  const slug = path.basename(file, ".md");
  const rubrique = meta.rubrique || slug;
  for (const k of ["titre", "chapo"]) if (!meta[k]) throw new Error(`Clé « ${k} » manquante : ${file}`);
  const mots = corps.replace(/[#>*_\[\]()]/g, " ").split(/\s+/).filter(Boolean).length;
  return {
    ...meta,
    slug,
    rubrique,
    date: dateDossier,
    rubriqueNom: RUBRIQUES.get(rubrique)?.nom ?? rubrique,
    auteur: meta.auteur || RUBRIQUES.get(rubrique)?.agent || "La rédaction",
    corpsHtml: markdown(corps),
    sourcesHtml: sources ? markdown(sources) : "",
    lecture: Math.max(1, Math.round(mots / 230)),
    url: `${dateDossier}/${slug}.html`,
  };
}

function lireEditions() {
  if (!fs.existsSync(CONTENT)) return [];
  const ordre = [...RUBRIQUES.keys()];
  return fs.readdirSync(CONTENT)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort().reverse()
    .map((date) => {
      const articles = fs.readdirSync(path.join(CONTENT, date))
        .filter((f) => f.endsWith(".md"))
        .map((f) => parseArticle(path.join(CONTENT, date, f), date))
        .sort((a, b) => ordre.indexOf(a.rubrique) - ordre.indexOf(b.rubrique));
      return { date, articles };
    })
    .filter((e) => e.articles.length);
}

// ---------- Gabarits ----------

function page({ titre, description, racine, contenu, dateEdition, numero }) {
  const nav = [...RUBRIQUES.values()].filter((r) => r.id !== "editorial")
    .map((r) => `<a href="${racine}rubrique/${r.id}.html">${esc(r.nom)}</a>`).join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${racine}assets/style.css">
<link rel="alternate" type="application/rss+xml" title="${esc(config.nom)}" href="${racine}flux.xml">
</head>
<body>
<header class="masthead">
  <div class="masthead-top">
    <span>${dateEdition ? esc(majuscule(dateLongue(dateEdition))) : ""}</span>
    <span>${numero ? `N<sup>o</sup> ${numero}` : ""}</span>
  </div>
  <a class="titre-journal" href="${racine}index.html">${esc(config.nom)}</a>
  <p class="devise">${esc(config.devise)}</p>
  <nav class="rubriques">${nav}<a href="${racine}archives.html">Archives</a></nav>
</header>
<main>
${contenu}
</main>
<footer class="pied">
  <p><strong>${esc(config.nom)}</strong> — ${esc(config.devise)}.</p>
  <p>Les articles sont des synthèses produites par des agents d'intelligence artificielle à partir des sources citées en fin de texte. Vérifiez les sources avant toute réutilisation.</p>
</footer>
</body>
</html>
`;
}

const byline = (a) => `<p class="byline">Par <span class="auteur">${esc(a.auteur)}</span>${a.lieu ? ` · ${esc(a.lieu)}` : ""} · ${a.lecture} min de lecture</p>`;

function carte(a, racine, variante = "") {
  return `<article class="carte ${variante}">
  <p class="surtitre"><a href="${racine}rubrique/${a.rubrique}.html">${esc(a.rubriqueNom)}</a>${a.surtitre ? ` · ${inline(a.surtitre)}` : ""}</p>
  <h2><a href="${racine}${a.url}">${inline(a.titre)}</a></h2>
  <p class="chapo">${inline(a.chapo)}</p>
  <p class="byline">Par <span class="auteur">${esc(a.auteur)}</span> · ${a.lecture} min</p>
</article>`;
}

function pageUne(edition, numero, precedente) {
  const racine = "";
  const edito = edition.articles.find((a) => a.rubrique === "editorial");
  const autres = edition.articles.filter((a) => a.rubrique !== "editorial");
  const uneId = edito?.une;
  const une = autres.find((a) => a.rubrique === uneId || a.slug === uneId) ?? autres[0];
  const reste = autres.filter((a) => a !== une);

  const contenu = `
<section class="une">
  ${une ? `<article class="principal">
    <p class="surtitre"><a href="rubrique/${une.rubrique}.html">${esc(une.rubriqueNom)}</a>${une.surtitre ? ` · ${inline(une.surtitre)}` : ""}</p>
    <h1><a href="${une.url}">${inline(une.titre)}</a></h1>
    <p class="chapo">${inline(une.chapo)}</p>
    ${byline(une)}
    <div class="extrait">${une.corpsHtml.split("\n").filter((l) => l.startsWith("<p>")).slice(0, 2).join("\n")}</div>
    <p class="lire"><a href="${une.url}">Lire la suite →</a></p>
  </article>` : ""}
  ${edito ? `<aside class="edito">
    <p class="surtitre">Éditorial</p>
    <h2><a href="${edito.url}">${inline(edito.titre)}</a></h2>
    <p class="chapo">${inline(edito.chapo)}</p>
    <p class="byline">Par <span class="auteur">${esc(edito.auteur)}</span></p>
    <p class="lire"><a href="${edito.url}">Lire l’éditorial →</a></p>
  </aside>` : ""}
</section>
<section class="grille">
${reste.map((a) => carte(a, racine)).join("\n")}
</section>
${precedente ? `<section class="precedent"><p>Édition précédente : <a href="${precedente.date}/index.html">${esc(dateLongue(precedente.date))}</a> · <a href="archives.html">Toutes les éditions</a></p></section>` : ""}`;
  return page({ titre: `${config.nom} — ${dateLongue(edition.date)}`, description: config.devise,
    racine, contenu, dateEdition: edition.date, numero });
}

function pageEditionArchivee(edition, numero) {
  const racine = "../";
  const contenu = `
<section class="entete-liste">
  <p class="surtitre">Édition du ${esc(dateLongue(edition.date))}</p>
  <h1>Sommaire de l’édition n<sup>o</sup> ${numero}</h1>
</section>
<section class="grille">
${edition.articles.map((a) => carte(a, racine)).join("\n")}
</section>`;
  return page({ titre: `${config.nom} — édition du ${dateCourte(edition.date)}`, description: config.devise,
    racine, contenu, dateEdition: edition.date, numero });
}

function pageArticle(a, edition, numero) {
  const racine = "../";
  const autres = edition.articles.filter((x) => x !== a);
  const contenu = `
<article class="article">
  <header>
    <p class="surtitre"><a href="${racine}rubrique/${a.rubrique}.html">${esc(a.rubriqueNom)}</a>${a.surtitre ? ` · ${inline(a.surtitre)}` : ""}</p>
    <h1>${inline(a.titre)}</h1>
    <p class="chapo">${inline(a.chapo)}</p>
    <p class="byline">Par <span class="auteur">${esc(a.auteur)}</span>${a.lieu ? ` · ${esc(a.lieu)}` : ""} · ${esc(dateLongue(a.date))} · ${a.lecture} min de lecture</p>
  </header>
  <div class="corps">
${a.corpsHtml}
  </div>
  ${a.sourcesHtml ? `<section class="sources"><h2>Sources</h2>${a.sourcesHtml}</section>` : ""}
</article>
<aside class="aussi">
  <h2>Dans la même édition</h2>
  <div class="grille compacte">${autres.map((x) => carte(x, racine, "petite")).join("\n")}</div>
</aside>`;
  return page({ titre: `${a.titre} — ${config.nom}`, description: a.chapo, racine, contenu,
    dateEdition: edition.date, numero });
}

function pageArchives(editions) {
  const contenu = `
<section class="entete-liste">
  <p class="surtitre">Archives</p>
  <h1>Toutes les éditions</h1>
</section>
<ol class="archives">
${editions.map((e, i) => `<li>
  <a class="date" href="${e.date}/index.html">N<sup>o</sup> ${editions.length - i} — ${esc(majuscule(dateLongue(e.date)))}</a>
  <ul>${e.articles.map((a) => `<li><span class="rub">${esc(a.rubriqueNom)}</span> <a href="${a.url}">${inline(a.titre)}</a></li>`).join("")}</ul>
</li>`).join("\n")}
</ol>`;
  return page({ titre: `Archives — ${config.nom}`, description: config.devise, racine: "", contenu });
}

function pageRubrique(r, articles) {
  const racine = "../";
  const contenu = `
<section class="entete-liste">
  <p class="surtitre">Rubrique</p>
  <h1>${esc(r.nom)}</h1>
  ${r.consigne ? `<p class="chapo">${inline(r.consigne)}</p>` : ""}
</section>
<section class="grille">
${articles.length ? articles.map((a) => carte(a, racine)).join("\n") : "<p>Aucun article pour l’instant.</p>"}
</section>`;
  return page({ titre: `${r.nom} — ${config.nom}`, description: r.consigne ?? config.devise, racine, contenu });
}

function flux(editions) {
  const base = (process.env.SITE_URL || "").replace(/\/$/, "");
  const items = editions.flatMap((e) => e.articles).slice(0, 50).map((a) => `<item>
  <title>${esc(a.titre)}</title>
  <link>${esc(`${base}/${a.url}`)}</link>
  <guid>${esc(`${base}/${a.url}`)}</guid>
  <category>${esc(a.rubriqueNom)}</category>
  <pubDate>${new Date(`${a.date}T06:00:00Z`).toUTCString()}</pubDate>
  <description>${esc(a.chapo)}</description>
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
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

if (!editions.length) {
  ecrire("index.html", page({ titre: config.nom, description: config.devise, racine: "",
    contenu: `<section class="entete-liste"><h1>Première édition en préparation</h1><p class="chapo">La rédaction travaille. Revenez demain matin.</p></section>` }));
} else {
  editions.forEach((e, i) => {
    const numero = editions.length - i;
    if (i === 0) ecrire("index.html", pageUne(e, numero, editions[1]));
    ecrire(`${e.date}/index.html`, pageEditionArchivee(e, numero));
    for (const a of e.articles) ecrire(a.url, pageArticle(a, e, numero));
  });
}
ecrire("archives.html", pageArchives(editions));
for (const r of RUBRIQUES.values()) {
  const liste = editions.flatMap((e) => e.articles.filter((a) => a.rubrique === r.id));
  ecrire(`rubrique/${r.id}.html`, pageRubrique(r, liste));
}
ecrire("flux.xml", flux(editions));

const total = editions.reduce((n, e) => n + e.articles.length, 0);
console.log(`✔ ${editions.length} édition(s), ${total} article(s) → ${path.relative(ROOT, OUT)}/`);
