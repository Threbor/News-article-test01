#!/usr/bin/env node
// Teste chaque lien externe des articles et, avec --corriger, retire les liens morts :
// dans le texte, le lien est remplacé par son intitulé ; dans une liste, la ligne est supprimée.
// Usage : node scripts/verifier-liens.mjs [--corriger] content/2026-09-30/*.md

import fs from "node:fs";

const args = process.argv.slice(2);
const corriger = args.includes("--corriger");
const fichiers = args.filter((a) => !a.startsWith("--"));
const LIEN = /\[([^\]]+)\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)\)/g;
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

async function tester(url) {
  for (const methode of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, {
        method: methode, redirect: "follow", signal: AbortSignal.timeout(15000),
        headers: { "user-agent": UA, "accept-language": "fr,en;q=0.8", accept: "text/html,*/*" },
      });
      if (r.status < 400) return { etat: "ok", code: r.status };
      // Beaucoup de médias refusent les robots : on ne peut pas conclure.
      if ([401, 403, 405, 406, 429, 451, 503, 999].includes(r.status)) {
        if (methode === "HEAD") continue;
        return { etat: "incertain", code: r.status };
      }
      if (methode === "HEAD") continue;
      return { etat: "mort", code: r.status };
    } catch (e) {
      if (methode === "HEAD") continue;
      const dns = /ENOTFOUND|EAI_AGAIN|getaddrinfo/.test(String(e.cause?.code ?? e.cause ?? e));
      return { etat: dns ? "mort" : "incertain", code: dns ? "DNS" : "réseau" };
    }
  }
  return { etat: "incertain", code: "?" };
}

async function parLots(items, n, fn) {
  const res = new Map();
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const it = items[i++]; res.set(it, await fn(it)); }
  }));
  return res;
}

const urls = [...new Set(fichiers.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(LIEN)].map((m) => m[2])))];
const resultats = await parLots(urls, 8, tester);
const morts = new Set([...resultats].filter(([, r]) => r.etat === "mort").map(([u]) => u));
const compte = (e) => [...resultats.values()].filter((r) => r.etat === e).length;

console.log(`Liens testés : ${urls.length} — valides ${compte("ok")}, incertains ${compte("incertain")}, morts ${morts.size}`);
for (const [u, r] of resultats) if (r.etat !== "ok") console.log(`  ${r.etat === "mort" ? "✘" : "?"} [${r.code}] ${u}`);

if (corriger && morts.size) {
  for (const f of fichiers) {
    const avant = fs.readFileSync(f, "utf8");
    const apres = avant.split("\n")
      .filter((l) => !(/^\s*[-*]\s+/.test(l) && [...l.matchAll(LIEN)].some((m) => morts.has(m[2]))))
      .join("\n")
      .replace(LIEN, (tout, texte, url) => morts.has(url) ? texte : tout);
    if (apres !== avant) { fs.writeFileSync(f, apres); console.log(`  → liens morts retirés de ${f}`); }
  }
}
