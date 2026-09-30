// Application installable : manifeste, service worker et page hors connexion.
//
// Le service worker garde en réserve la coquille du site et l'édition du jour : on peut lire le
// journal sans réseau. Pages : réseau d'abord (toujours à jour), réserve en secours. Ressources à
// empreinte (?v=…), icônes et polices : réserve d'abord (elles ne changent jamais sous la même URL).

import crypto from "node:crypto";
import { echapper } from "../lib/texte.mjs";
import { page } from "./page.mjs";

export function manifeste(config, dujour) {
  return JSON.stringify({
    id: "./",
    name: config.nom,
    short_name: config.nom,
    description: config.devise,
    lang: "fr",
    start_url: "./index.html",
    scope: "./",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf9f4",
    theme_color: "#fbf9f4",
    categories: ["news", "education"],
    icons: [
      { src: "assets/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "assets/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "assets/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      ...(dujour?.essentiel ? [{ name: "L’essentiel du jour", url: `./${dujour.essentiel.url}` }] : []),
      { name: "Notions", url: "./notions.html" },
      { name: "Recherche", url: "./recherche.html" },
    ],
  }, null, 2);
}

// reserve : URL (relatives à la racine du site) mises en réserve dès l'installation.
export function serviceWorker(reserve) {
  const version = crypto.createHash("sha256").update(JSON.stringify(reserve)).digest("hex").slice(0, 12);
  return `// Généré par site/pwa.mjs — ne pas modifier à la main.
const RESERVE = "veilleur-${version}";
const A_GARDER = ${JSON.stringify(reserve)};
const base = self.registration.scope;
const absolue = (u) => new URL(u, base).href;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(RESERVE).then((c) => c.addAll(A_GARDER.map(absolue))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((cles) => Promise.all(cles.filter((k) => k.startsWith("veilleur-") && k !== RESERVE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const immuable = (url) => url.searchParams.has("v") || url.pathname.includes("/assets/icones/")
  || /(^|\\.)fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname);

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  if (immuable(url)) e.respondWith(reserveDabord(r));
  else if (url.origin === location.origin) e.respondWith(reseauDabord(r, url));
});

async function reserveDabord(r) {
  const c = await caches.open(RESERVE);
  const garde = await c.match(r);
  if (garde) return garde;
  const rep = await fetch(r);
  if (rep.ok || rep.type === "opaque") c.put(r, rep.clone());
  return rep;
}

async function reseauDabord(r, url) {
  const c = await caches.open(RESERVE);
  try {
    const rep = await fetch(r);
    if (rep.ok) c.put(r, rep.clone());
    return rep;
  } catch (erreur) {
    const garde = await c.match(r, { ignoreSearch: true })
      || (url.pathname.endsWith("/") && await c.match(absolue(url.pathname.slice(1) + "index.html")));
    if (garde) return garde;
    if (r.mode === "navigate") return c.match(absolue("hors-ligne.html"));
    throw erreur;
  }
}
`;
}

export function pageHorsLigne(dujour, config) {
  const liste = dujour ? `<ol class="sommaire">${dujour.articles.map((a) => `<li class="sommaire-item"><a href="${a.url}"><span class="sommaire-rub">${echapper(a.rubriqueCourt)}</span><span class="sommaire-titre">${echapper(a.court)}</span></a></li>`).join("")}</ol>` : "";
  const contenu = `<header class="entete-liste">
  <p class="surtitre">Hors connexion</p>
  <h1>Pas de réseau pour l’instant</h1>
  <p class="chapo">Cette page n’a pas encore été lue sur cet appareil. L’édition du jour, elle, reste disponible : elle est gardée en réserve à chaque ouverture de l’application.</p>
</header>
${liste}`;
  return page({ config, racine: "", contenu, edition: dujour, corps: "page-liste", bandeau: "Hors connexion",
    titre: `Hors connexion — ${config.nom}`, description: config.devise });
}
