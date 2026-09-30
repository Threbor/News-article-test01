#!/usr/bin/env node
// Génère donnees/pays.json (fond de carte) à partir de données publiques :
//   - world-atlas (npm, licence ISC) : countries-50m.json, contours Natural Earth (domaine public) ;
//   - i18n-iso-countries (npm, licence MIT) : codes.json et langs/fr.json (codes ISO et noms français).
// À relancer seulement pour changer de résolution ou de source.
//
// usage : npm pack world-atlas@2 i18n-iso-countries@7   (puis extraire les deux archives)
//         node bin/preparer-carto.mjs world-atlas/countries-50m.json i18n/codes.json i18n/langs/fr.json

import fs from "node:fs";
import { principal } from "../lib/cli.mjs";
import { chemin } from "../lib/config.mjs";

const AIDE = `
usage : preparer-carto COUNTRIES.json CODES.json FR.json

Écrit donnees/pays.json : [{ "c": code ISO alpha-3, "n": nom français, "p": [[lon,lat,lon,lat…], …] }]
Coordonnées arrondies au centième de degré (environ 1 km).
`;

// Décode les arcs TopoJSON (quantifiés, en différences) en coordonnées [lon, lat].
function decoderArcs(topo) {
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0, y = 0;
    return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
  });
}

function anneau(indices, arcs) {
  const pts = [];
  for (const i of indices) {
    const a = i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    pts.push(...(pts.length ? a.slice(1) : a));
  }
  return pts.flatMap(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
}

principal((o) => {
  const [fTopo, fCodes, fNoms] = o._;
  if (!fNoms) throw new Error("trois fichiers attendus (voir --aide)");
  const topo = JSON.parse(fs.readFileSync(fTopo, "utf8"));
  const codes = JSON.parse(fs.readFileSync(fCodes, "utf8"));           // [[alpha2, alpha3, numérique], …]
  const noms = JSON.parse(fs.readFileSync(fNoms, "utf8")).countries;  // { alpha2: nom | [noms] }
  const parNumerique = new Map(codes.map(([a2, a3, num]) => [String(num).padStart(3, "0"), { a2, a3 }]));
  const arcs = decoderArcs(topo);

  const pays = [];
  for (const g of topo.objects.countries.geometries) {
    if (!g.arcs) continue;
    const code = parNumerique.get(String(g.id).padStart(3, "0"));
    const polygones = g.type === "Polygon" ? [g.arcs] : g.arcs;
    const nom = code ? noms[code.a2] : null;
    pays.push({
      c: code?.a3 ?? `X${g.id ?? pays.length}`,
      n: (Array.isArray(nom) ? nom[0] : nom) ?? g.properties?.name ?? "",
      p: polygones.flatMap((poly) => poly.map((r) => anneau(r, arcs))),
    });
  }
  fs.mkdirSync(chemin("donnees"), { recursive: true });
  fs.writeFileSync(chemin("donnees", "pays.json"), JSON.stringify(pays));
  if (o.bavard) console.error(`${pays.length} pays, ${pays.reduce((n, p) => n + p.p.reduce((m, r) => m + r.length / 2, 0), 0)} points`);
}, AIDE);
