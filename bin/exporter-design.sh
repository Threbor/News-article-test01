#!/usr/bin/env bash
# Assemble l'archive destinée à Claude Design : prompt, captures, site généré et sources.
# usage : bin/exporter-design.sh   →   design/export-claude-design.zip
set -euo pipefail
cd "$(dirname "$0")/.."

node bin/construire.mjs

travail="$(mktemp -d)"
trap 'rm -rf "$travail"' EXIT
export_dir="$travail/export-claude-design"
mkdir -p "$export_dir/source"

cp design/claude-design/PROMPT_CLAUDE_DESIGN.md design/claude-design/LISEZMOI.md "$export_dir/"
cp -r design/claude-design/captures "$export_dir/captures"
cp -r _site "$export_dir/site"
cp -r site lib config redaction "$export_dir/source/"
derniere="$(ls -d content/*/ | sort | tail -1)"
cp "${derniere}international.md" "$export_dir/source/exemple-article.md"
cp "${derniere}essentiel.md" "$export_dir/source/exemple-essentiel.md"

rm -f design/export-claude-design.zip
(cd "$travail" && python3 -m zipfile -c "$OLDPWD/design/export-claude-design.zip" export-claude-design)
