// Petites fonctions de texte, pures et sans dépendance.

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.",
  "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const CODES_JOURS = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

export const echapper = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const majuscule = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

export const texteBrut = (html = "") => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// Forme de comparaison : sans casse, sans accents, apostrophes unifiées.
export const normaliser = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[’‘`]/g, "'").toLowerCase();

export const slugifier = (s = "") => normaliser(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function domaine(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

const jour = (iso) => new Date(`${iso}T12:00:00Z`);

export function dateLongue(iso) {
  const d = jour(iso), j = d.getUTCDate();
  return `${JOURS[d.getUTCDay()]} ${j === 1 ? "1er" : j} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function dateCourte(iso) {
  const d = jour(iso);
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export function dateAbregee(iso) {
  const d = jour(iso);
  return `${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export const codeJour = (iso) => CODES_JOURS[jour(iso).getUTCDay()];

// Date du jour dans un fuseau donné, au format AAAA-MM-JJ.
export function aujourdhui(fuseau = "Europe/Paris") {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: fuseau, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
}

// Typographie française sur du HTML : espaces insécables avant ; : ! ? et dans les guillemets.
export function typographier(html) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => part.startsWith("<") ? part : part
      .replace(/(?<!&[a-zA-Z0-9#]+)[   ]?([;!?])(?=\s|$|<)/g, " $1")
      .replace(/[   ]:/g, " :")
      .replace(/«[   ]*/g, "« ")
      .replace(/[   ]*»/g, " »")
      .replace(/\.\.\./g, "…")
      .replace(/'/g, "’"))
    .join("");
}

// Découpe un chapô en première phrase et suite (sur la première fin de phrase suivie d'une majuscule).
export function couperChapo(chapo = "") {
  const m = chapo.match(/^(.+?[.!?])\s+([A-ZÀ-ÖØ-Þ«].*)$/s);
  return m ? [m[1], m[2]] : [chapo, ""];
}

// Titre court : clé explicite, sinon segment avant « : » ou « , » s'il fait au moins 3 mots.
export function titreCourt(titre, explicite) {
  if (explicite) return explicite;
  const seg = titre.split(/\s*[:,]\s+/)[0];
  return seg !== titre && seg.split(/\s+/).length >= 3 ? seg : titre;
}
