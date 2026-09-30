// Fond de carte : donnees/pays.json (généré par bin/preparer-carto.mjs), chargé à la demande.

import fs from "node:fs";
import { chemin } from "./config.mjs";

let cache = null;
export function pays() {
  cache ??= JSON.parse(fs.readFileSync(chemin("donnees", "pays.json"), "utf8"));
  return cache;
}

export const codePays = (c) => pays().find((p) => p.c === c);

// Lit les clés « carte_* » d'un en-tête d'article. Renvoie null s'il n'y a pas de carte,
// lève une erreur si la description est invalide.
export function lireCarte(meta) {
  if (!meta.carte_lieu && !meta.carte_coord) return null;
  const m = String(meta.carte_coord ?? "").match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!meta.carte_lieu) throw new Error("clé « carte_lieu » manquante");
  if (!m) throw new Error(`« carte_coord » doit être « latitude, longitude » (reçu : ${meta.carte_coord ?? "rien"})`);
  const [lat, lon] = [+m[1], +m[2]];
  if (Math.abs(lat) > 85 || Math.abs(lon) > 180) throw new Error(`coordonnées hors limites : ${meta.carte_coord}`);
  const rayon = meta.carte_rayon ? +meta.carte_rayon : 900;
  if (!(rayon >= 50 && rayon <= 10000)) throw new Error(`« carte_rayon » doit être un nombre de km entre 50 et 10 000`);
  const codes = String(meta.carte_pays ?? "").split(/[\s,]+/).filter(Boolean).map((c) => c.toUpperCase());
  const inconnus = codes.filter((c) => !codePays(c));
  if (inconnus.length) throw new Error(`« carte_pays » : code(s) ISO inconnu(s) ${inconnus.join(", ")}`);
  return { lieu: meta.carte_lieu, lat, lon, rayon, pays: codes };
}
