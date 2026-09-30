#!/usr/bin/env bash
# Produit l'édition d'un jour : collecte → rubriques en parallèle → éditorial → site.
# usage : bin/edition.sh [DATE] [RUBRIQUE,RUBRIQUE…]
#
#   DATE        défaut : aujourd'hui dans le fuseau du journal
#   RUBRIQUES   défaut : celles que prévoit le plan du jour (config/journal.json → frequence)
#   PARALLELE   nombre de rédactions simultanées (défaut 3)
#
# Les rubriques déjà présentes ne sont pas refaites. Une rubrique rejetée n'arrête pas l'édition,
# mais le programme se termine en échec pour que l'incident soit visible.
set -euo pipefail
cd "$(dirname "$0")/.."

date="${1:-$(node bin/plan.mjs --aujourdhui)}"
seulement="${2:-}"
travail="$(mktemp -d)"
trap 'rm -rf "$travail"' EXIT
statut=0

node bin/collecter.mjs > "$travail/depeches.jsonl" || { echo "edition: collecte impossible, les agents chercheront seuls" >&2; : > "$travail/depeches.jsonl"; }

node bin/plan.mjs --date "$date" --formats article,breves --sauf-existants ${seulement:+--seulement "$seulement"} \
  | xargs -r -P "${PARALLELE:-3}" -I{} bin/rubrique.sh "$date" {} "$travail/depeches.jsonl" || statut=1

if [ -z "$seulement" ] || [[ ",$seulement," == *",editorial,"* ]]; then
  if [ ! -e "content/$date/editorial.md" ] && ls "content/$date"/*.md >/dev/null 2>&1; then
    bin/rubrique.sh "$date" editorial || statut=1
  fi
fi

node bin/construire.mjs
node bin/journal.mjs "$date" >&2 || true
exit "$statut"
