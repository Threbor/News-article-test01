---
name: edition-du-jour
description: Produit l'édition quotidienne du journal (collecte des flux, rédaction des rubriques du jour, éditorial, construction du site) avec bin/edition.sh, puis la publie. À utiliser quand on demande « l'édition du jour », « les articles du jour » ou depuis une routine planifiée.
---

# Édition du jour

Toute la chaîne est dans `bin/edition.sh`. Ce skill la lance et en rend compte.
Ne rédige pas les articles toi-même et ne lance pas de sous-agents : le script
s'en charge, avec les budgets de `config/journal.json`.

1. `npm test` doit passer. Sinon, arrête-toi et signale l'échec.
2. `bin/edition.sh` : sans argument, il prend la date du jour à Paris et les
   rubriques prévues par le plan. Il ne refait pas une rubrique déjà présente.
   Pour une seule rubrique : `bin/edition.sh "" economie`.
3. En cas d'échec d'une rubrique, lis la cause sur la sortie d'erreur et le
   brouillon `content/DATE/RUBRIQUE.rejete`. Ne le corrige pas à la main : signale-le.
4. Commit `Édition du DATE`, avec `content/` et `journal/`. Pousse sur `main` :
   Vercel redéploie le site. Si la session ne peut pousser que sur une autre
   branche, dis-le dans le résumé.
5. Résume l'édition : les titres, l'article à la une, les éventuels rejets et
   le bilan de consommation affiché par `node bin/journal.mjs DATE`.
