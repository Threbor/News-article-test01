// Markdown minimal → HTML. Le rendu des liens et des termes est délégué à des fonctions
// fournies par l'appelant (règle de séparation : le mécanisme ici, la présentation ailleurs).

import { echapper, typographier } from "./texte.mjs";

// URL : caractères sans espace ni parenthèse, ou groupe (…) équilibré (liens Wikipédia).
const URL_MD = String.raw`(?:[^()\s]|\([^()\s]*\))+`;
export const RE_LIEN = new RegExp(String.raw`\[([^\]]+)\]\((${URL_MD})\)`, "g");
export const RE_LIEN_EXTERNE = new RegExp(String.raw`\[([^\]]+)\]\((https?:\/\/${URL_MD})\)`, "g");
const RE_TERME = /\[\[([^\]|]+)\|([a-z0-9-]+)\]\]/g;

export const liensDe = (md = "") => [...md.matchAll(RE_LIEN_EXTERNE)].map((m) => m[2]);

const RENDU_PAR_DEFAUT = {
  lien: (texte, url) => /^https?:\/\//.test(url)
    ? `<a class="ext" href="${url}" rel="noopener" target="_blank">${texte}</a>`
    : `<a href="${url}">${texte}</a>`,
  terme: (texte) => texte,
};

export function inline(md, rendu = {}) {
  const r = { ...RENDU_PAR_DEFAUT, ...rendu };
  let s = echapper(md);
  s = s.replace(RE_TERME, (_, texte, id) => r.terme(texte, id));
  s = s.replace(new RegExp(RE_LIEN.source, "g"), (_, texte, url) => {
    const u = url.replace(/&amp;/g, "&");
    return /^(javascript|data):/i.test(u) ? texte : r.lien(texte, u);
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<em>$2</em>");
  return typographier(s);
}

const ancre = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function blocs(md = "", rendu = {}) {
  const out = [];
  let para = [], liste = null, citation = [];
  const fermerPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "), rendu)}</p>`); para = []; };
  const fermerListe = () => {
    if (liste) out.push(`<${liste.tag}>${liste.items.map((i) => `<li>${inline(i, rendu)}</li>`).join("")}</${liste.tag}>`);
    liste = null;
  };
  const fermerCitation = () => {
    if (citation.length) {
      const [texte, auteur] = citation.join(" ").split(/\s+—\s+(?=[^—]+$)/);
      out.push(`<blockquote><p>${inline(texte, rendu)}</p>${auteur ? `<cite>${inline(auteur, rendu)}</cite>` : ""}</blockquote>`);
    }
    citation = [];
  };
  const fermer = () => { fermerPara(); fermerListe(); fermerCitation(); };

  for (const ligne of md.replace(/\r/g, "").split("\n")) {
    let m;
    if (!ligne.trim()) { fermer(); continue; }
    if ((m = ligne.match(/^(#{2,4})\s+(.*)$/))) {
      fermer();
      out.push(`<h${m[1].length} id="${ancre(m[2])}">${inline(m[2], rendu)}</h${m[1].length}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(ligne.trim())) {
      fermer(); out.push("<hr>");
    } else if ((m = ligne.match(/^>\s?(.*)$/))) {
      fermerPara(); fermerListe(); citation.push(m[1]);
    } else if ((m = ligne.match(/^\s*[-*]\s+(.*)$/))) {
      fermerPara(); fermerCitation();
      if (liste?.tag !== "ul") { fermerListe(); liste = { tag: "ul", items: [] }; }
      liste.items.push(m[1]);
    } else if ((m = ligne.match(/^\s*\d+[.)]\s+(.*)$/))) {
      fermerPara(); fermerCitation();
      if (liste?.tag !== "ol") { fermerListe(); liste = { tag: "ol", items: [] }; }
      liste.items.push(m[1]);
    } else if (liste && /^\s{2,}\S/.test(ligne)) {
      liste.items[liste.items.length - 1] += " " + ligne.trim();
    } else {
      fermerListe(); fermerCitation(); para.push(ligne.trim());
    }
  }
  fermer();
  return out.join("\n");
}
