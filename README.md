# Le Veilleur

Un quotidien d'analyse en ligne, écrit chaque matin par une **rédaction
d'agents Claude**. Son but est de donner, en quelques minutes par jour, une
culture générale solide de l'actualité mondiale. Chaque fait est relié à sa
source par un lien cliquable, et chaque notion importante est expliquée.

## Les axes de connaissance

| Cahier | Rubrique | Parution | Ce qu'on y apprend |
|---|---|---|---|
| — | Éditorial | chaque jour | Le fil rouge du jour et le choix de la une |
| — | L'essentiel du jour | chaque jour | Tour du monde en 10 à 12 brèves sourcées |
| Monde | Géopolitique & conflits | chaque jour | Guerres, diplomatie, puissances |
| Monde | Europe | lundi, jeudi | UE, institutions, pays européens |
| Monde | Sud global | mardi, vendredi | Afrique, Asie, Amérique latine, émergents |
| France | Politique française | chaque jour | Gouvernement, Parlement, institutions |
| France | Société & droits | mercredi, samedi | Travail, éducation, justice, migrations |
| Économie | Économie mondiale | chaque jour | Marchés, banques centrales, commerce |
| Économie | Énergie & ressources | mercredi, dimanche | Pétrole, gaz, électricité, métaux |
| Planète & sciences | Climat & biodiversité | lundi, vendredi | Science du climat, COP, transition |
| Planète & sciences | Sciences & santé | jeudi, dimanche | Recherche, médecine, espace |
| Numérique | Technologies & IA | mardi, samedi | IA, plateformes, puces, régulation |
| Numérique | Cybersécurité | chaque jour | Attaques, failles, cyberconflits |
| Idées | Idées & culture | mercredi, samedi | Livres, débats, arts, médias |

Chaque article contient un texte court (450 à 650 mots) où **chaque fait porte
son lien**, puis quatre sections :
- **En bref** : trois points à retenir ;
- **Notions clés** : les concepts expliqués, chacun avec un lien pour approfondir ;
- **Pour aller plus loin** : des ressources de fond ;
- **Sources** : la liste numérotée des sources.

## Architecture

Le projet est un ensemble de **petits programmes**, reliés par des fichiers
texte et par l'entrée et la sortie standard. **Les règles** (ce que fait le
journal) sont dans des données ; **le mécanisme** (comment il le fait) est
dans du code court et sans dépendance.

```
config/                LES RÈGLES, en données
  journal.json           identité, cahiers, rubriques (fréquence, mots-clés, consigne),
                         formats (modèle, budget, règles de contrôle), collecte
  sources.json           flux RSS/Atom lus chaque matin
redaction/             LES CONSIGNES, en texte
  CONSIGNES.md           charte éditoriale et format des articles
  consignes/*.md         gabarit de consigne par format ({{champs}} remplis par bin/dossier)
content/AAAA-MM-JJ/    LES ARTICLES (Markdown à en-tête), une édition par dossier
journal/AAAA-MM-JJ.jsonl  consommation de chaque rédaction (tokens, coût, durée)

bin/                   LES PROGRAMMES (chacun répond à --aide)
  collecter.mjs          flux RSS → dépêches du jour (JSON Lines), sans IA
  plan.mjs               date → rubriques à produire, une par ligne
  dossier.mjs            rubrique + dépêches → consigne complète pour le modèle
  rediger.mjs            consigne → article, via « claude -p » ; journalise la consommation
  liens.mjs              teste les liens et retire les liens morts (--corriger)
  verifier.mjs           contrôle un article selon les règles de son format
  rubrique.sh            dossier | rediger > brouillon ; liens ; verifier → .md ou .rejete
  edition.sh             collecter ; plan | xargs -P rubrique.sh ; éditorial ; construire
  construire.mjs         content/ → _site/
  journal.mjs            bilan de consommation
  exporter-design.sh     archive pour Claude Design

lib/                   LE MÉCANISME, en fonctions pures (texte, markdown, article,
                       edition, regles, flux, config, cli)
site/                  LA PRÉSENTATION : gabarits (page, une, article, listes, outils),
                       corps.mjs (appels de source, termes de notion), assets/
test/                  npm test : les briques et la chaîne complète, sans réseau ni token
```

### La chaîne d'une édition

```
collecter ──► dépêches.jsonl
plan ──► rubriques du jour ──► pour chacune, en parallèle :
    dossier | rediger > brouillon ──► liens --corriger ──► verifier ──► RUBRIQUE.md (ou .rejete)
éditorial (même chaîne, sans outil) ──► construire ──► _site/ ──► Vercel
```

Chaque étape se lance seule, ce qui facilite l'inspection et le débogage :

```bash
node bin/collecter.mjs > /tmp/dep.jsonl                  # ce qui remonte des flux
node bin/plan.mjs --date 2026-10-01                      # ce qui sera écrit ce jour-là
node bin/dossier.mjs --rubrique economie --depeches /tmp/dep.jsonl | less   # ce que lira le modèle
bin/rubrique.sh 2026-10-01 economie /tmp/dep.jsonl       # une rubrique de bout en bout
node bin/verifier.mjs content/2026-10-01/*.md            # silencieux si tout est conforme
node bin/journal.mjs                                     # ce que ça a coûté
```

### Les principes Unix appliqués

| Principe | Application |
|---|---|
| Modularité, composition | Un programme par tâche, branchés par des tubes (`dossier \| rediger`) et des fichiers JSON Lines |
| Séparation | Les règles vivent dans `config/` et `redaction/`, le mécanisme dans `lib/` et `bin/`, la présentation dans `site/` |
| Représentation | Fréquences, mots-clés, budgets, modèles et règles de contrôle sont des données : ajouter une rubrique ne demande aucun code |
| Simplicité, parcimonie | Aucune dépendance npm ; aucun module JavaScript du générateur ne dépasse 120 lignes |
| Transparence | Chaque étape s'inspecte seule ; la consommation de chaque rédaction est journalisée |
| Silence | `construire` et `verifier` n'écrivent rien quand tout va bien (`-v` pour un bilan) |
| Dépannage | Configuration invalide, champ de gabarit inconnu, réponse sans en-tête : arrêt immédiat avec un message précis ; un article refusé est gardé en `.rejete` |
| Génération | `dossier` génère les consignes, `construire` génère le site |
| Robustesse | Une rubrique en échec n'empêche pas l'édition ; si la collecte tombe en panne, les agents cherchent seuls |
| Extensibilité | Un nouveau format (par exemple un dossier hebdomadaire) = une entrée dans `formats` et un gabarit dans `redaction/consignes/` |

## Économie de tokens

L'ancienne chaîne laissait chaque agent tout chercher seul, en 20 à 30 tours.
La nouvelle procède autrement :

1. **Collecte sans IA.** Les agents reçoivent un dossier de dépêches déjà
   triées, avec des liens réels.
2. **Budgets explicites** par format : tours, recherches et lectures (`config/journal.json`).
3. **Outils au plus juste.** L'éditorial n'en a aucun : il travaille à partir
   des articles du jour.
4. **Le bon modèle pour chaque tâche.** Haiku écrit les brèves, Sonnet les articles.
5. **Rotation des rubriques.** 8 à 9 rédactions par jour au lieu de 14.

Mesure réelle du 30 septembre, sur la rubrique Cybersécurité et sans dossier de
dépêches : **environ 64 000 tokens, 10 tours, 58 secondes**. L'ancienne chaîne
consommait 75 000 à 110 000 tokens par article. Là où le réseau permet la
collecte, comme sur GitHub, le dossier de dépêches réduit encore les recherches.
`node bin/journal.mjs` permet de suivre la consommation au fil des jours.

## Expérience smartphone

L'interface mobile a été conçue avec Claude Design ; la livraison est archivée
dans `design/claude-design/livraison/`. Elle comprend :
- un bandeau réduit et une barre de navigation en bas de l'écran ;
- un sommaire du numéro, présenté en feuille qui glisse du bas ;
- des appels de source numérotés, et les définitions des notions affichées sur place ;
- des sections repliables, un carrousel de brèves et le marquage des articles lus ;
- le passage d'un article à l'autre sans revenir à l'accueil ;
- une taille de texte réglable.

La version ordinateur est inchangée.

## Mise en route

1. **Vercel** : importer le dépôt. Les réglages sont lus dans `vercel.json`
   (build `node bin/construire.mjs`, sortie `_site`).
2. **Accès à Claude** : dans les secrets GitHub (*Settings → Secrets and
   variables → Actions*), ajouter `CLAUDE_CODE_OAUTH_TOKEN` (obtenu avec
   `claude setup-token`) ou `ANTHROPIC_API_KEY`.
3. **Premier essai** : *Actions → Édition quotidienne → Run workflow*. On peut y
   choisir une date et des rubriques.
4. **Facultatif** :
   - la variable `MODELE_REDACTION`, qui impose un modèle à tous les formats ;
   - le secret `VERCEL_DEPLOY_HOOK`, si Vercel ne redéploie pas les commits du robot ;
   - la commande `node bin/collecter.mjs --tester`, qui vérifie chaque flux.

L'édition part chaque jour vers 6 h 17, heure de Paris : c'est la ligne
`cron` du workflow, exprimée en heure UTC.

En local : `npm test`, puis `npm run serve` (http://localhost:8000). Pour
produire une édition, lancer `bin/edition.sh` ; Claude Code doit être installé
et connecté. Depuis Claude Code, le skill `edition-du-jour` fait la même chose.

## Modifier le journal

| Pour changer… | Modifier |
|---|---|
| une rubrique (fréquence, consigne, mots-clés) | `config/journal.json` → `rubriques` |
| un modèle, un budget, une règle de contrôle | `config/journal.json` → `formats` |
| les sources collectées | `config/sources.json` |
| la ligne éditoriale | `redaction/CONSIGNES.md` |
| ce qu'on demande au modèle | `redaction/consignes/*.md` |
| l'apparence | `site/assets/*.css` |

## Avertissement

Les articles sont des synthèses produites par une IA à partir des sources
qu'elle cite. La chaîne vérifie le format et les liens, mais une relecture
humaine reste recommandée avant toute diffusion.
