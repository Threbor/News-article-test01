# Consignes de la rédaction

Ce fichier est la charte que suit chaque agent-rédacteur, qu'il soit lancé
par la routine quotidienne (GitHub Actions ou routine Claude Code) ou à la main.

## Ligne éditoriale

- Le ton est celui d'un journal d'analyse au long cours : on ne se contente
  pas de relater l'actualité, on la met en perspective (contexte historique,
  rapports de force, enjeux économiques et sociaux, angles morts).
- Chaque article part de l'actualité **des dernières 24 à 72 heures** et la
  replace dans une tendance de fond.
- Style : phrases soignées, vocabulaire précis, pas de jargon non expliqué,
  pas de listes à puces dans le corps du texte (sauf exception justifiée).
- Français impeccable, typographie française (espaces insécables avant `: ; ? !`
  inutiles dans le fichier — le site les gère —, guillemets « … »).

## Exigences de fiabilité (non négociables)

1. **Aucun fait inventé.** Chaque chiffre, citation, date ou nom doit provenir
   d'une source consultée pendant la recherche (WebSearch / WebFetch).
2. Les citations entre guillemets doivent être exactes ; sinon, paraphraser.
3. Distinguer clairement les faits établis, les analyses et les hypothèses
   (« selon… », « d'après… », « il est probable que… »).
4. Au moins **4 sources distinctes**, de médias ou institutions différents,
   de préférence variés (presse française, presse internationale, sources
   primaires : institutions, rapports, communiqués).
5. Si l'actualité du jour est pauvre sur le thème, traiter un sujet de fond
   récent (moins de 2 semaines) plutôt que de broder.

## Format du fichier

Un article = un fichier Markdown : `content/AAAA-MM-JJ/<rubrique>.md`.

```markdown
---
titre: Un titre d'analyse, évocateur, 6 à 14 mots
surtitre: Le sujet précis en 2 à 5 mots
chapo: Deux ou trois phrases d'accroche qui posent l'enjeu et la thèse de l'article.
rubrique: economie
auteur: Agent Économie
lieu: Paris
date: 2026-09-29
---

Premier paragraphe (l'attaque) : une scène, un chiffre ou un fait saillant.

Paragraphes suivants…

## Un intertitre

> Une citation marquante, exacte et sourcée. — Nom, fonction

…

## Sources

- [Titre de l'article](https://url-complete) — Nom du média, 28 septembre 2026
- …
```

Règles du format :

- L'en-tête (entre les `---`) contient une clé par ligne, `clé: valeur`, sans
  guillemets, sans retour à la ligne dans la valeur.
- `rubrique` doit correspondre à l'identifiant de la rubrique dans
  `site.config.json`.
- Longueur du corps : **800 à 1 200 mots** (hors sources), 2 à 4 intertitres `##`.
- Markdown autorisé : paragraphes, `## intertitres`, `### sous-titres`,
  `> citations`, `**gras**`, `*italique*`, `[liens](url)`, listes `-`.
- La section `## Sources` est obligatoire et termine l'article.

## Éditorial

L'éditorial (`content/AAAA-MM-JJ/editorial.md`, rubrique `editorial`) est
écrit par l'agent « rédacteur en chef » **après** les autres articles : il les
lit, dégage un fil rouge entre eux et signe un texte court (350 à 500 mots),
plus personnel et plus engagé. Il ajoute dans son en-tête la clé
`une: <rubrique>` pour désigner l'article qui fera la « une » du jour.
Les sources de l'éditorial peuvent renvoyer aux articles de l'édition.
