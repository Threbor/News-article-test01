#!/usr/bin/env node
// Teste les liens externes des articles ; avec --corriger, retire les liens morts.

import fs from "node:fs";
import { dire, principal } from "../lib/cli.mjs";
import { RE_LIEN_EXTERNE } from "../lib/markdown.mjs";

const AIDE = `
usage : liens [--corriger] [-v] FICHIER…

Un lien est « mort » si le site répond 404/410 ou si son nom de domaine n'existe pas ;
« incertain » si le site refuse les robots (401, 403, 429…) ou ne répond pas.
Les liens morts sont signalés sur la sortie d'erreur. Avec --corriger, dans le texte le lien est
remplacé par son intitulé, et dans une liste la ligne est supprimée.
-v affiche aussi le bilan et les liens incertains.
`;

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";
const REFUS = [401, 403, 405, 406, 429, 451, 503, 999];
const lien = () => new RegExp(RE_LIEN_EXTERNE.source, "g");

async function tester(url) {
  for (const methode of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, { method: methode, redirect: "follow", signal: AbortSignal.timeout(15000),
        headers: { "user-agent": UA, "accept-language": "fr,en;q=0.8", accept: "text/html,*/*" } });
      if (r.status < 400) return { etat: "ok", code: r.status };
      if (methode === "HEAD") continue;
      return { etat: REFUS.includes(r.status) ? "incertain" : "mort", code: r.status };
    } catch (e) {
      if (methode === "HEAD") continue;
      const dns = /ENOTFOUND|EAI_AGAIN/.test(String(e.cause?.code ?? e.cause ?? e));
      return { etat: dns ? "mort" : "incertain", code: dns ? "DNS" : "réseau" };
    }
  }
  return { etat: "incertain", code: "?" };
}

async function parLots(items, n, fn) {
  const res = new Map(); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const it = items[i++]; res.set(it, await fn(it)); } }));
  return res;
}

principal(async (o) => {
  if (!o._.length) throw new Error("aucun fichier (voir --aide)");
  const urls = [...new Set(o._.flatMap((f) => [...fs.readFileSync(f, "utf8").matchAll(lien())].map((m) => m[2])))];
  const res = await parLots(urls, 8, tester);
  const morts = new Set([...res].filter(([, r]) => r.etat === "mort").map(([u]) => u));

  for (const [u, r] of res) {
    if (r.etat === "mort") dire(`lien mort [${r.code}] ${u}`);
    else if (r.etat === "incertain" && o.bavard) dire(`incertain [${r.code}] ${u}`);
  }
  if (o.bavard) dire(`${urls.length} liens, ${morts.size} mort(s)`);

  if (o.corriger && morts.size) {
    for (const f of o._) {
      const avant = fs.readFileSync(f, "utf8");
      const apres = avant.split("\n")
        .filter((l) => !(/^\s*[-*]\s+/.test(l) && [...l.matchAll(lien())].some((m) => morts.has(m[2]))))
        .join("\n")
        .replace(lien(), (tout, texte, url) => (morts.has(url) ? texte : tout));
      if (apres !== avant) fs.writeFileSync(f, apres);
    }
    return 0;
  }
  return morts.size ? 1 : 0;
}, AIDE);
