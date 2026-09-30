# Prompt pour Claude Design — refonte mobile du « Veilleur »

> Copiez tout ce qui suit dans Claude Design, avec l'archive jointe.

---

## Ton rôle

Tu es designer produit spécialisé dans la presse d'analyse numérique. Tu dois
**repenser l'expérience smartphone** du « Veilleur », un quotidien en ligne
dont la version ordinateur est satisfaisante mais dont la version mobile ne
l'est pas. L'objectif est un parcours **fluide, sans navigation excessive**,
une interface **affordante**, et une présentation inspirée de la **presse
d'analyse de référence, en particulier *Le Monde diplomatique***, réussie sur
un écran de téléphone.

## Le produit

« Le Veilleur » est un quotidien d'analyse écrit chaque matin par une
rédaction d'agents d'IA. Sa promesse : **comprendre l'actualité du monde en
quelques minutes par jour, avec des sources vérifiables d'un clic**.

Chaque édition quotidienne contient :

- un **éditorial**, qui dégage le fil rouge du jour et désigne l'article de une ;
- **L'essentiel du jour** : 10 à 12 brèves, chacune avec au moins un lien vers sa source ;
- **12 articles courts** (450 à 650 mots, 2 à 3 minutes de lecture), un par rubrique,
  répartis en **6 cahiers** : Monde (Géopolitique, Europe, Sud global),
  France (Politique, Société), Économie (Économie mondiale, Énergie),
  Planète & sciences (Climat, Sciences & santé), Numérique (Technologies & IA,
  Cybersécurité), Idées (Idées & culture).

Chaque article a toujours la même structure :

| Élément | Contenu |
|---|---|
| Surtitre | rubrique · sujet précis |
| Titre | 6 à 14 mots |
| Chapô | 2 phrases |
| Signature | agent, lieu, date, temps de lecture, nombre de sources |
| **En bref** | exactement 3 points à retenir |
| Corps | 450 à 650 mots, 2 intertitres au plus, **12 à 18 liens vers les sources dans le texte** |
| **Notions clés** | 2 à 4 notions : terme, définition d'une phrase, lien « Comprendre » |
| **Pour aller plus loin** | 3 à 5 ressources : titre, site, une phrase d'explication |
| **Sources** | 10 à 20 sources numérotées : titre, média, date, domaine |

Le site propose aussi un **glossaire** de toutes les notions (page Notions), une
**recherche** plein texte, des pages par **cahier** et par **rubrique**, les
**archives** par édition, un **mode sombre** et un flux RSS.

## Contenu de l'archive

- `captures/` : l'état actuel.
  - `mobile-*-ecran1.png` : le premier écran à 390 × 844 px (Retina ×2).
  - `mobile-*-page-entiere.png` : la page complète.
  - `bureau-*.png` : la version ordinateur, **qu'il ne faut pas dégrader**.
- `site/` : le site généré, en HTML statique. Ouvrez `site/index.html` dans un
  navigateur, en mode appareil mobile.
- `source/` : le générateur et les styles.
  - `build.mjs` : les gabarits HTML, chacun écrit comme une fonction JavaScript (`pageUne`,
    `pageArticle`, `pageCahier`, `pageNotions`, `pageRecherche`…).
  - `style.css` et `app.js` : la mise en forme et les comportements.
  - `site.config.json` : les cahiers et rubriques.
  - `exemple-article.md` : un article source, qui montre toutes les données disponibles.

## Diagnostic de l'existant sur smartphone

Mesures faites à 390 px de large :

| Page | Longueur | Cibles tactiles < 32 px | Remarques |
|---|---|---|---|
| Une | **12 écrans**, 114 liens | 33 | L'essentiel (9 brèves) s'empile avant les cahiers |
| Article | 8,6 écrans | 17 | Notions clés et sommaire relégués après 15 sources |
| L'essentiel | 8,6 écrans | 13 | Brèves en une seule longue colonne |
| Notions | **13,8 écrans** | 70 | Index alphabétique seulement en haut de page |

Problèmes constatés :

1. **Un en-tête trop haut.** Barre d'outils, grand titre et devise sur deux
   lignes occupent **223 px (26 % de l'écran)** avant tout contenu, et c'est
   le cas sur toutes les pages, articles compris.
2. **Une navigation par cahiers peu lisible.** La barre défile horizontalement
   (338 px cachés), mais rien ne le signale : le libellé « PLANÈTE & » est
   coupé net, sans dégradé, flèche ni amorce de l'élément suivant. Elle compte
   8 entrées en capitales espacées.
3. **Des outils peu affordants.** La recherche et le changement de thème sont
   de simples icônes sans libellé, et leurs cibles tactiles sont trop petites.
4. **Une une interminable.** Toutes les cartes ont le même poids visuel.
   Aucun sommaire ne permet de voir d'un coup d'œil ce que contient l'édition,
   et rien ne permet de sauter à un cahier ou de savoir où l'on en est.
5. **Des blocs d'en-tête d'article lourds.** Le surtitre en capitales
   espacées tient sur 2 lignes, et le chapô en italique en fait 7.
   Le texte commence au deuxième écran.
6. **Des éléments de marge relégués en fin d'article.** Sur ordinateur, la
   marge affiche les notions clés et le sommaire de l'édition. Sur mobile,
   elle est rejetée après les sources : pour lire la définition d'une notion,
   il faut descendre de 6 écrans puis remonter.
7. **Des liens de source qui interrompent la lecture.** Le signe ↗ est
   minuscule, chaque lien ouvre un nouvel onglet, et le lecteur ne sait pas
   quel média il va ouvrir avant d'avoir tapé.
8. **« Pour aller plus loin » et « Sources » très longues.** Ces sections sont
   dépliées en permanence, avec une carte par ligne et jusqu'à 20 sources.
9. **Peu de moyens de continuer.** En fin d'article, seuls « précédent » et
   « suivant » sont proposés. Aucun marquage n'indique les articles déjà lus.
10. **Un glossaire difficile à parcourir.** Il manque un index alphabétique
    qui reste accessible pendant le défilement, un filtre et des définitions
    repliables.

## Objectif : le parcours du matin en cinq minutes

Concevoir le parcours cible suivant, **sans retour obligatoire à l'accueil
et sans jamais plus de deux gestes pour atteindre un contenu** :

1. J'ouvre le site : je vois **immédiatement** la date, la une et le
   **sommaire de l'édition** (13 titres), sans défiler au-delà du premier écran.
2. Je parcours **L'essentiel** en quelques secondes, sous forme compacte
   (carrousel à cartes, liste repliable ou mode « brèves à la suite »).
3. J'ouvre un article. Je lis **En bref**, puis le texte dans des conditions
   de lecture longue confortables.
4. Je touche un **terme de notion** : sa définition s'affiche **sur place**
   (panneau inférieur ou infobulle), avec « Comprendre ↗ » et « Voir dans le glossaire ».
5. Je touche une **source** : je vois d'abord le média, le titre et la date,
   puis je choisis de l'ouvrir. Je ne quitte pas l'article par accident.
6. En fin d'article, je passe **à l'article suivant de l'édition** d'un seul
   geste : bouton fixe « Suivant », balayage ou fin de page qui enchaîne.
7. À tout moment, j'accède au sommaire, aux cahiers et à la recherche sans
   remonter en haut de page.

## Direction artistique : l'esprit du *Monde diplomatique*, adapté au téléphone

Inspire-toi de la presse d'analyse de référence, *Le Monde diplomatique* en
tête, **sans reprendre leur nom, leur logo ni leur charte**. Le journal garde
son nom et sa palette actuelle : papier crème, encre, **un seul accent
bordeaux**.

À retenir de cette tradition :

- la **sobriété** : peu de couleurs, beaucoup de blanc, des **filets fins**
  qui séparent et hiérarchisent à la place des cadres et des ombres ;
- la **typographie comme architecture** : grands titres en serif, surtitre
  court en petites capitales, chapô qui annonce la thèse, lettrine,
  intertitres, citations en exergue ;
- une **hiérarchie éditoriale nette** : une une qui domine, un éditorial
  signé, des cahiers identifiés, un sommaire d'édition comme celui d'un
  numéro imprimé ;
- le **sérieux de la lecture longue** : colonne confortable, interlignage
  généreux, aucune distraction pendant la lecture ;
- l'appareil critique, c'est-à-dire notes, sources et renvois, **intégré avec
  élégance** et non relégué en fin de page.

Le défi consiste à **traduire cette grammaire de l'imprimé sur un écran de
390 px**. Pistes possibles :

- en-tête **réduit et collant** une fois le défilement commencé (titre du journal en
  petit, date, bouton sommaire) ;
- **sommaire d'édition** façon table des matières numérotée ;
- **cahiers en onglets** ou en sections repliables ;
- notes de source sous forme d'**appels numérotés** discrets (¹ ² ³) plutôt
  que de liens soulignés partout, sans perdre la vérification en un geste.

Ces pistes sont des propositions. Tu peux en retenir d'autres si elles
servent mieux le parcours.

## Exigences d'affordance et d'accessibilité

- **Tout ce qui est interactif doit en avoir l'air** : cartes avec une
  indication explicite (« Lire · 3 min → » ou chevron), boutons avec un libellé
  et pas seulement une icône, liens externes clairement signalés, notions
  distinguées des liens de source par le style.
- **Cibles tactiles d'au moins 44 × 44 px**, espacées, et zones importantes
  à portée du pouce (bas de l'écran).
- **Un défilement horizontal doit se voir** : amorce de la carte suivante,
  indicateur de position, dégradé en bord.
- **États visibles** : appuyé, actif, article **déjà lu** (mémorisé dans le
  navigateur), section repliée ou dépliée.
- **Retour d'information** : barre de progression de lecture, temps restant
  estimé, position dans l'édition (par exemple « 4 / 13 »).
- **Accessibilité WCAG AA** : contrastes en clair et en sombre, taille de
  texte réglable ou respect du réglage système, lecteur d'écran, `prefers-reduced-motion`.
- Le **mode sombre** doit être aussi soigné que le mode clair.

## Contraintes techniques

- Le site est **statique**. Il est généré par `build.mjs` (Node.js, sans
  dépendance) et hébergé sur Vercel. Il n'utilise ni framework ni étape de
  compilation CSS ou JS.
- Tu as droit à du **HTML, du CSS et un JavaScript léger en JS natif**
  (`app.js`), en **amélioration progressive** : sans JavaScript, tout reste
  lisible et navigable, avec des sections dépliées et des liens classiques.
- Les polices viennent de Google Fonts : aujourd'hui Libre Caslon Text,
  Playfair Display et Source Sans 3. Tu peux proposer un autre trio, gratuit
  et hébergé sur Google Fonts.
- Les couleurs sont des variables CSS sur `:root`, avec les variantes sombres
  sous `[data-theme="dark"]` et `prefers-color-scheme`.
- **La version ordinateur (au-delà de 980 px) ne doit pas régresser.** Le
  travail porte sur la mise en page en dessous de 820 px, et la tablette doit
  rester cohérente.

## Livrables attendus

1. **Maquettes mobiles (390 px)**, en clair et en sombre, pour :
   - la une, avec son sommaire d'édition ;
   - l'article, dans ses états de lecture : notion ouverte, source ouverte, fin d'article ;
   - L'essentiel du jour ;
   - un cahier ;
   - le glossaire des notions ;
   - la recherche ;
   - le menu ou la navigation globale.
2. Le **parcours annoté** du matin en cinq minutes : écrans, gestes et transitions.
3. Un **mini système de design** : variables (couleurs, typographie, espacements,
   rayons), puis composants (en-tête réduit, barre de navigation, carte
   d'article, brève, appel de source, panneau de notion, accordéon, bouton
   « Suivant »), chacun avec ses états.
4. Un **prototype HTML/CSS/JS fonctionnel** que Claude Code pourra reporter
   dans `build.mjs`, `style.css` et `app.js`, sur la base des gabarits et des
   données de l'archive.
   - Garde les noms de classes existants quand c'est possible.
   - Signale explicitement toute nouvelle donnée dont le gabarit aurait besoin.
5. Une **liste de priorités** : ce qui apporte le plus pour le moins d'effort,
   à faire en premier.
