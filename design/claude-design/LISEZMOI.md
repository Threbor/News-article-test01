# Export pour Claude Design — Le Veilleur

Cette archive sert à confier à Claude Design la refonte de l'expérience
smartphone du journal.

## Mode d'emploi

1. Ouvrez Claude Design et joignez cette archive, ou son contenu.
2. Collez le texte de `PROMPT_CLAUDE_DESIGN.md` comme première consigne.
3. Rapportez les maquettes et le prototype obtenus à Claude Code, qui les
   intégrera dans `scripts/build.mjs`, `assets/style.css` et `assets/app.js`.

## Contenu

| Élément | Rôle |
|---|---|
| `PROMPT_CLAUDE_DESIGN.md` | La consigne complète : contexte, diagnostic, parcours cible, direction artistique, contraintes, livrables |
| `captures/mobile-*-ecran1.png` | Premier écran de chaque page à 390 × 844 px (Retina ×2) |
| `captures/mobile-*-page-entiere.png` | Pages complètes sur mobile |
| `captures/bureau-*.png` | Version ordinateur actuelle, référence à ne pas dégrader |
| `site/` | Le site généré, en HTML statique, à ouvrir dans un navigateur |
| `source/build.mjs` | Générateur et gabarits HTML |
| `source/style.css`, `source/app.js` | Styles et comportements actuels |
| `source/site.config.json` | Cahiers et rubriques |
| `source/exemple-article.md`, `source/exemple-essentiel.md` | Données sources d'un article et des brèves |
| `source/CONSIGNES.md` | Charte éditoriale et format des contenus |

Pour que la recherche fonctionne, servez le dossier `site/` par un petit
serveur local, par exemple `python3 -m http.server --directory site` ; en
ouverture directe du fichier, le navigateur bloque le chargement de l'index.

L'archive se régénère avec `bash scripts/export-design.sh`.
