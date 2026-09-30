#!/usr/bin/env node
// Génère les icônes de l'application (site/assets/icones/) à partir d'un dessin SVG unique.
// Outil de développement, à relancer seulement si l'on change l'icône : il demande Playwright
// (npm i -g playwright) et la police Playfair Display (npm pack @fontsource/playfair-display).
//
// usage : node bin/generer-icones.mjs chemin/vers/playfair-display-latin-900-normal.woff2

import fs from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { principal } from "../lib/cli.mjs";
import { chemin } from "../lib/config.mjs";

const AIDE = `
usage : generer-icones POLICE.woff2

Écrit dans site/assets/icones/ : icone-192.png, icone-512.png, icone-masquable-512.png
(zone de sécurité de 80 % pour les icônes adaptatives d'Android), apple-touch-icon.png (180 px)
et favicon-32.png.
`;

const ENCRE = "#9b1c1f", PAPIER = "#fbf9f4";

// masquable : dessin réduit dans la zone de sécurité, fond à fond perdu.
const dessin = (masquable) => {
  const e = masquable ? 0.78 : 1;             // échelle du motif
  const t = (v) => 256 + (v - 256) * e;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${masquable ? 0 : 104}" fill="${ENCRE}"/>
  <text x="256" y="${t(352)}" text-anchor="middle" font-family="Titre" font-weight="900" font-size="${330 * e}" fill="${PAPIER}">V</text>
  <rect x="${t(150)}" y="${t(392)}" width="${212 * e}" height="${9 * e}" fill="${PAPIER}"/>
  <rect x="${t(150)}" y="${t(410)}" width="${212 * e}" height="${3.5 * e}" fill="${PAPIER}"/>
</svg>`;
};

principal(async (o) => {
  const [police] = o._;
  if (!police || !fs.existsSync(police)) throw new Error("fichier de police introuvable (voir --aide)");
  const requis = createRequire(import.meta.url);
  const { chromium } = requis(`${execSync("npm root -g").toString().trim()}/playwright`);
  const sortie = chemin("site", "assets", "icones");
  fs.mkdirSync(sortie, { recursive: true });

  const b = await chromium.launch();
  const p = await b.newPage();
  const rendre = async (masquable, taille, fichier) => {
    await p.setViewportSize({ width: taille, height: taille });
    await p.setContent(`<style>@font-face{font-family:Titre;font-weight:900;src:url(data:font/woff2;base64,${fs.readFileSync(police).toString("base64")})}
      html,body{margin:0;background:transparent}svg{width:${taille}px;height:${taille}px;display:block}</style>${dessin(masquable)}`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${sortie}/${fichier}`, omitBackground: true });
  };
  await rendre(false, 512, "icone-512.png");
  await rendre(false, 192, "icone-192.png");
  await rendre(true, 512, "icone-masquable-512.png");
  await rendre(true, 180, "apple-touch-icon.png");
  await rendre(false, 32, "favicon-32.png");
  await b.close();
  if (o.bavard) console.error(`icônes écrites dans ${sortie}`);
}, AIDE);
