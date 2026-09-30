# Consignes de la rédaction

Charte suivie par chaque agent-rédacteur, qu'il soit lancé par la routine
quotidienne (GitHub Actions, routine Claude Code) ou à la main.

## Ce que doit apporter le journal

Donner au lecteur, en quelques minutes par jour, une **culture générale solide
de l'actualité mondiale**. Chaque article répond à trois questions :

1. **Que s'est-il passé ?** Les faits récents (24 à 72 heures, au plus deux semaines).
2. **Pourquoi est-ce important ?** Le contexte, les rapports de force, l'histoire.
3. **Comment aller plus loin ?** Des notions expliquées et des liens pour approfondir.

Le ton est celui d'un journal d'analyse : clair, précis, sans jargon inexpliqué,
sans parti pris partisan. Chaque phrase doit apprendre quelque chose au lecteur.

## Sources et liens : la règle d'or

Le lecteur doit pouvoir **vérifier chaque fait d'un clic**.

- **Chaque fait, chiffre ou citation porte un lien** vers la source qui l'établit,
  directement dans le texte : `selon [le FMI](https://…)`,
  `le taux a atteint [5,24 %](https://…)`. Au moins **6 liens dans le corps**,
  pointant vers au moins **4 sites différents**.
- **N'utilise que des URL que tu as vues dans les résultats de WebSearch ou ouvertes avec
  WebFetch.** Ne fabrique jamais une URL à la main et ne devine jamais un chemin.
  Quand WebFetch est disponible, ouvre chaque lien avant de le citer et écarte
  ceux qui ne répondent pas.
- Varie les sources : agences et presse (française et internationale), sources
  primaires (institutions, rapports, communiqués, données officielles), et pour
  les notions, des références pédagogiques (Wikipédia, vie-publique.fr, Toute
  l'Europe, sites d'institutions, encyclopédies, universités).
- **Aucun fait inventé.** Citations exactes ou paraphrasées ; traduction signalée
  (« traduit de l'anglais »). Distingue les faits, les analyses et les hypothèses.

## Format d'un article (rubriques thématiques)

Fichier `content/AAAA-MM-JJ/<rubrique>.md`. Corps de **450 à 650 mots**.

```markdown
---
titre: Un titre d'analyse, évocateur, 6 à 14 mots
surtitre: Le sujet précis en 2 à 5 mots
chapo: Deux phrases qui posent le fait et l'enjeu.
rubrique: economie
auteur: Agent Économie
lieu: Paris
date: 2026-09-30
---

Attaque : le fait saillant, [lien vers la source](https://…).

Contexte et analyse, chaque fait avec son lien…

## Un intertitre (facultatif, 2 au maximum)

…

## En bref

- Premier point à retenir (une phrase).
- Deuxième point.
- Troisième point.

## Notions clés

- **Terme** : définition en une ou deux phrases. [Comprendre](https://…)
- **Autre terme** : définition. [Comprendre](https://…)

## Pour aller plus loin

- [Titre de la ressource](https://…) — Institution ou média : pourquoi la lire, en une phrase.
- …

## Sources

- [Titre de l'article](https://…) — Nom du média, 29 septembre 2026
- …
```

Exigences :

- L'en-tête contient une clé par ligne, `clé: valeur`, sans guillemets ni retour à la ligne.
- `## En bref` : exactement 3 puces.
- `## Notions clés` : 2 à 4 notions, chacune avec un lien pédagogique.
- `## Pour aller plus loin` : 3 à 5 ressources de fond (dossier, rapport,
  explication, long format, données), pas de simples dépêches.
- `## Sources` : toutes les sources citées dans le corps, au moins 5.
- Markdown autorisé : paragraphes, `##`, `>` citations (`> texte — Auteur`),
  `**gras**`, `*italique*`, `[liens](url)`, listes `-`.

## Format de « L'essentiel du jour » (rubrique `essentiel`)

Un tour du monde en **10 à 12 brèves**, qui couvre des régions et des domaines
variés, y compris ce que les autres rubriques ne traitent pas.

```markdown
---
titre: L'essentiel du 30 septembre
chapo: Une phrase qui résume la tonalité du jour.
rubrique: essentiel
auteur: Agent Veille
date: 2026-09-30
---

### Titre court de la brève
Deux ou trois phrases factuelles avec au moins un [lien vers la source](https://…).

### Titre de la brève suivante
…

## Sources

- [Titre](https://…) — Média, date
```

## Éditorial (rubrique `editorial`)

Écrit **après** les autres articles par le rédacteur en chef : il dégage un fil
rouge entre eux, 300 à 450 mots, plus personnel et plus engagé. Il cite les
articles de l'édition par des liens relatifs (`[titre](economie.html)`) et ne
contient aucun fait absent des articles. Son en-tête ajoute `une: <rubrique>`
pour désigner l'article qui fera la une.
