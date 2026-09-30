#!/usr/bin/env bash
# Assemble l'archive destinée à Claude Design : prompt, captures, site généré et sources.
# Usage : bash scripts/export-design.sh   →   design/export-claude-design.zip
set -euo pipefail

racine="$(cd "$(dirname "$0")/.." && pwd)"
cd "$racine"

node scripts/build.mjs

travail="$(mktemp -d)"
export_dir="$travail/export-claude-design"
mkdir -p "$export_dir/source"

cp design/claude-design/PROMPT_CLAUDE_DESIGN.md design/claude-design/LISEZMOI.md "$export_dir/"
cp -r design/claude-design/captures "$export_dir/captures"
cp -r _site "$export_dir/site"
cp scripts/build.mjs scripts/verifier.mjs assets/style.css assets/app.js site.config.json \
   redaction/CONSIGNES.md "$export_dir/source/"
derniere="$(ls -d content/*/ | sort | tail -1)"
cp "${derniere}international.md" "$export_dir/source/exemple-article.md"
cp "${derniere}essentiel.md" "$export_dir/source/exemple-essentiel.md"

rm -f design/export-claude-design.zip
(cd "$travail" && python3 -m zipfile -c "$racine/design/export-claude-design.zip" export-claude-design)
rm -rf "$travail"
echo "✔ design/export-claude-design.zip ($(du -h design/export-claude-design.zip | cut -f1))"
