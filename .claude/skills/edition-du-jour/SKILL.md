---
name: edition-du-jour
description: Produit l'édition quotidienne du journal — un agent-rédacteur par rubrique enquête et écrit son article, puis le rédacteur en chef écrit l'éditorial, le site est reconstruit et l'édition poussée. À utiliser quand on demande « l'édition du jour », « les articles du jour » ou depuis une routine planifiée.
---

# Édition du jour

Ce skill fait tourner toute la rédaction dans une seule session Claude Code
(par exemple depuis une routine planifiée sur claude.ai/code). La GitHub Action
`.github/workflows/edition-quotidienne.yml` fait la même chose côté CI.

1. Détermine la date du jour à Paris : `TZ=Europe/Paris date +%F` → `DATE`.
   Si `content/DATE/` contient déjà des articles, ne refais que les rubriques manquantes.
2. Lis `redaction/CONSIGNES.md` et `site.config.json`.
3. Lance **en parallèle un sous-agent par rubrique** de `site.config.json`
   (outil Agent, en arrière-plan). Chaque sous-agent reçoit : son nom d'agent,
   sa rubrique et sa consigne, la date, le chemin de `CONSIGNES.md`, l'obligation
   de rechercher avec WebSearch/WebFetch, de ne rien inventer, d'éviter les
   sujets déjà traités (en-têtes de `content/*/<id>.md`) et d'écrire uniquement
   `content/DATE/<id>.md`, sans opération git.
4. Quand tous ont rendu leur copie : `node scripts/verifier.mjs content/DATE/*.md`.
   Renvoie à son agent tout article refusé, avec les erreurs à corriger.
5. Écris toi-même l'éditorial `content/DATE/editorial.md` en suivant la section
   « Éditorial » de `CONSIGNES.md` (avec la clé `une:`).
6. `node scripts/build.mjs` doit réussir.
7. Commit `Édition du DATE` et push sur la branche de travail. Si la branche de
   publication (`main`) n'est pas celle de la session, indique-le dans le résumé.
8. Résume : titres de l'édition, article à la une, éventuels échecs.
