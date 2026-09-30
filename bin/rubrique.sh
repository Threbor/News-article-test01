#!/usr/bin/env bash
# Rédige une rubrique de bout en bout : consigne → rédaction → liens → contrôle.
# usage : bin/rubrique.sh DATE RUBRIQUE [DEPECHES.jsonl]
#
# Réussite : content/DATE/RUBRIQUE.md est écrit.
# Échec    : le brouillon reste dans content/DATE/RUBRIQUE.rejete pour examen, code de sortie 1.
# VEILLEUR_LIENS=0 saute le test des liens (hors ligne, tests).
set -euo pipefail
cd "$(dirname "$0")/.."

date="$1" rubrique="$2" depeches="${3:-}"
dossier="content/$date"
brouillon="$dossier/$rubrique.brouillon"
mkdir -p "$dossier" journal

rejeter() {
  mv -f "$brouillon" "$dossier/$rubrique.rejete" 2>/dev/null || true
  echo "rubrique: $rubrique rejetée ($1), brouillon dans $dossier/$rubrique.rejete" >&2
  exit 1
}

node bin/dossier.mjs --date "$date" --rubrique "$rubrique" ${depeches:+--depeches "$depeches"} \
  | node bin/rediger.mjs --rubrique "$rubrique" --journal "journal/$date.jsonl" > "$brouillon" \
  || rejeter "rédaction"

[ "${VEILLEUR_LIENS:-1}" = 0 ] || node bin/liens.mjs --corriger "$brouillon" || true

node bin/verifier.mjs "$brouillon" || rejeter "contrôle"
mv "$brouillon" "$dossier/$rubrique.md"
