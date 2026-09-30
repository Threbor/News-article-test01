# Intégration de la refonte mobile — notes pour Claude Code

Référence visuelle : `Veilleur Maquettes.dc.html`. Balisage de référence de chaque gabarit : `Veilleur Prototype.dc.html` (les `<sc-for>` / `{{ }}` correspondent aux boucles de `build.mjs`).

## Fichiers

- `prototype/mobile.css` : à coller **à la fin** de `assets/style.css`. Contient les jetons (dont la correction de `--gris`), les composants nouveaux et un bloc `@media (max-width: 820px)`. Au-delà de 820 px, rien ne change sauf la feuille de notion (voir plus bas).
- `prototype/app.js` : remplace `assets/app.js`. Reprend thème, barre de progression et recherche. Tout passe par délégation d'événements ; `window.Veilleur.rafraichir()` n'est utile qu'au prototype.
- `prototype/style.css` : copie inchangée de la feuille actuelle, pour que le prototype tourne.

## Script de tête (`page()`)

```html
<script>try{var d=document.documentElement;d.classList.add("js");var t=localStorage.getItem("theme");if(t)d.dataset.theme=t;var s=localStorage.getItem("taille");if(s)d.dataset.taille=s}catch(e){}</script>
```

## `page()` — pour toutes les pages

1. Paramètre nouveau `edition` (l'édition du jour) passé par **toutes** les pages, y compris cahiers, rubriques, glossaire, recherche, archives.
2. Avant `<header class="masthead">`, ajouter le bandeau :
   `<div class="bandeau"><a class="bandeau-nom" href="…index.html">Le Veilleur</a><span class="bandeau-info">N° 2 · Géopolitique</span></div>`
3. `corpsClasse` : `page-une` pour la une (à ajouter), `page-article` déjà en place, `page-liste` ailleurs.
4. Après `</footer>` : la barre du bas et la feuille Sommaire (copier depuis le prototype).
   - Article et L'essentiel : `nav.barre-bas.barre-bas-article` avec `a.bb-bouton[href="#edition-nav"][data-ouvrir="edition"]`, `p.bb-etat` (`.bb-position` « 2 / 13 », `.bb-reste`), `a.bb-suivant`.
   - Autres pages : trois `a.bb-bouton` (Sommaire → `index.html#sommaire`, Cahiers → `cahier/monde.html` avec `data-ouvrir="cahiers"`, Rechercher → `recherche.html`, `aria-current="page"` sur la page active).
   - `dialog#feuille-sommaire.feuille` : `form.feuille-recherche[action=recherche.html]` + `input[name=q]`, onglets `[role=tab][data-onglet]`, `ol.sommaire` (une `li.sommaire-item` par entrée, `aria-current="true"` sur l'article courant), `ul.liste-cahiers`, `ul.liens-outils`, `.reglages` (`[data-theme-choix]`, `[data-taille-pas]`).
   Sans JavaScript, le dialogue reste fermé et les liens des boutons mènent au sommaire de la une ou de l'article.

## `carte()`

- Surtitre : `<span class="sujet">` autour du sujet (aujourd'hui un nœud texte).
- Chapô : `<span class="chapo-1">phrase 1</span> <span class="chapo-2">suite</span>` (découpe au build sur la première fin de phrase suivie d'une majuscule).
- Dans `.meta`, à la fin : `<span class="carte-lire" aria-hidden="true"><span class="a-lire">Lire →</span><span class="lu">Lu ✓</span></span>`.

## `pageUne()`

- Surtitre de la une : `<span class="rub-long">Géopolitique &amp; conflits</span><span class="rub-court">Géopolitique</span>`.
- `.lire` : ajouter `<span class="lire-duree">· 3 min · 15 sources</span>`.
- Nouvelle section, n'importe où dans `main` (l'ordre mobile est fixé par CSS) :
  `<section class="section-sommaire" id="sommaire"><h2 class="titre-section"><span>Au sommaire du N° 2</span><span class="compte">13 articles · 31 min</span></h2><ol class="sommaire sommaire-une">…</ol></section>` — 13 entrées numérotées : éditorial + 12 articles (L'essentiel n'y figure pas, il a son carrousel). Masquée sur ordinateur.
- L'essentiel : envelopper `.breves` dans `<div class="carrousel">`, ajouter à chaque brève `<a class="breve-lien" href="AAAA-MM-JJ/essentiel.html#breve-N">Lire la brève →</a>`, puis après `.breves` le bloc `.carrousel-nav` du prototype.

## `pageArticle()`

- `<article class="article" data-minutes="3" data-cle="2026-09-30/international">`.
- Surtitre : `rub-long` / `rub-court` et `span.sujet`.
- Après `.meta` : `<p class="lecture-aide">…</p>` (seulement si l'article a des sources).
- Corps (`lien()` / `markdown()`) :
  - **Appels de source** : chaque `a.ext` du corps reçoit `class="ext appel" data-source="N"` et `<sup class="appel-num"><span class="visuel-cache">source </span>N</sup>` en dernier enfant ; `N` = rang de l'URL dans la liste Sources (dédoublonnée). Un lien absent de la liste y est ajouté à la fin. Retirer l'attribut `title`.
  - **Termes de notion** : première occurrence de chaque notion clé dans les paragraphes (comparaison sans casse ni accents, apostrophes unifiées, parenthèse finale ignorée), hors liens et intertitres → `<a class="terme" href="../notions.html#ID" data-notion="ID">…</a>`. Le repérage automatique trouve 20 notions sur 40 dans l'édition du 30 septembre ; prévoir une syntaxe `[[texte|id-notion]]` dans `CONSIGNES.md` pour les autres.
- `blocPlusLoin()` : `<details class="plus-loin" open data-replie-mobile><summary><h2>Pour aller plus loin</h2><span class="resume-sources">5 ressources · …</span><span class="bascule" aria-hidden="true"></span></summary>…</details>`.
- `blocSources()` : même principe sur `<details class="sources" id="sources">` ; résumé = trois premiers médias + « et N autres médias » ; chaque `li` reçoit `id="source-N"`. `h2 > span` compte inchangé.
- `blocNotions()` : chaque `div` reçoit `id="nc-ID"` (optionnel, utile pour `:target`).
- `nav.suite` :
  ```html
  <nav class="suite" aria-label="Suite de l’édition">
    <p class="suite-bilan">Article 2 sur 13 · encore 11 articles, 27 min</p>
    <a class="suite-prec" href="…"><span>← Éditorial</span><strong class="suite-titre">…</strong></a>
    <a class="suite-suiv" href="…"><span>À suivre · 3 / 13 · Europe →</span><strong class="suite-titre">…</strong><em class="suite-cta">Lire l’article suivant · 3 min →</em></a>
    <a class="suite-retour" href="../index.html#sommaire">Voir tout le sommaire</a>
  </nav>
  ```
  Ordre de lecture : éditorial → L'essentiel → articles dans l'ordre des cahiers. Dernier article : `suite-suiv` pointe vers `index.html#sommaire` (« Fin de l’édition »).

## Brèves (`blocBreves()`, page L'essentiel)

Chaque brève devient `<details class="breve" id="breve-N" open data-replie-mobile><summary><span class="breve-num">N</span><h3>…</h3></summary><div class="breve-texte">…</div></details>`, précédée de `.breves-outils` (compte + boutons `[data-mode-breves="titres|tout"]`). Sur la une, garder `article.breve` simple (pas de `details`).

## `pageCahier()`

Sortir `.rubriques-cahier` de `header.entete-liste` (sinon il ne peut pas coller) et faire pointer ses liens vers des ancres internes `#international`, `#europe`… ; chaque `section.section-cahier` reçoit l'`id` de sa rubrique. Le lien du `h2.titre-section` continue de mener à la page de rubrique.

## `pageNotions()`

- Après l'en-tête : `div.glossaire-outils` (champ `#filtre-notions.champ` + `p.lettres`, sorti de l'en-tête), puis `p.glossaire-etat` (`#glossaire-compte`, bouton `[data-tout-deplier]`).
- Chaque notion : `<div class="notion" id="ID"><details open data-replie-mobile><summary><span class="notion-terme">…</span><span class="notion-apercu">définition</span></summary><div class="notion-corps"><p>…</p><p class="notion-liens">…</p></div></details></div>` (le `dl` disparaît ; `.notion-terme` reprend le style de `.notion dt`).

## `pageRecherche()`

- `form.recherche` : retirer `onsubmit="return false"`, ajouter `action="recherche.html"` et `name="q"` (fonctionne sans JS avec `?q=`).
- Envelopper le champ dans `.recherche-champ` avec `<button type="button" class="recherche-effacer" aria-label="Effacer la recherche" hidden>×</button>`.
- Après le `select` : `div.filtres` avec `button.puce[data-rubs="international europe sud-global"]` par cahier, plus L'essentiel et Éditoriaux.
- Après `#etat` : `div.suggestions` (notions ou sujets du jour en `button.puce[data-q]`).

## Configuration

`site.config.json` → `rubriques[].court` : Géopolitique, Europe, Sud global, Politique, Société, Économie, Énergie, Climat, Sciences, Technologies, Cybersécurité, Idées. Front-matter d'article → `titre_court` (2 à 6 mots). Repli si absent : segment avant « : » ou « , » (au moins 3 mots), sinon titre complet, coupé à deux lignes par CSS.

## Comportement ordinateur

- Les appels de source ne sont interceptés que sous 820 px ; au-delà, le lien s'ouvre comme aujourd'hui et le chiffre reste masqué.
- Les termes de notion ouvrent la feuille à toutes les tailles (centrée, 560 px max). Pour garder strictement le comportement actuel, restreindre la ligne `terme` de la délégation à `mobile.matches`.
- Les `details` restent ouverts au-delà de 820 px.

## Vérifications

Tester à 390 × 844 en clair et en sombre, JavaScript coupé (tout déplié, liens classiques, sommaire en fin d'article), `prefers-reduced-motion`, VoiceOver sur les feuilles (`dialog` modal, retour du focus), et relancer `verifier.mjs`.
