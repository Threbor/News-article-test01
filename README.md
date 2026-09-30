# Le Veilleur

Un quotidien d'analyse en ligne, écrit chaque matin par une **rédaction
d'agents Claude**. Son but est de donner, en quelques minutes par jour, une
culture générale solide de l'actualité mondiale. Chaque fait est relié à sa
source par un lien cliquable, et chaque notion importante est expliquée.

## Les axes de connaissance

| Cahier | Rubrique | Ce qu'on y apprend |
|---|---|---|
| — | L'essentiel du jour | Tour du monde en 10 à 12 brèves sourcées |
| Monde | Géopolitique & conflits | Guerres, diplomatie, puissances |
| Monde | Europe | UE, institutions, pays européens |
| Monde | Sud global | Afrique, Asie, Amérique latine, émergents |
| France | Politique française | Gouvernement, Parlement, institutions |
| France | Société & droits | Travail, éducation, justice, migrations, inégalités |
| Économie | Économie mondiale | Marchés, banques centrales, commerce |
| Économie | Énergie & ressources | Pétrole, gaz, électricité, métaux, alimentation |
| Planète & sciences | Climat & biodiversité | Science du climat, COP, transition |
| Planète & sciences | Sciences & santé | Recherche, médecine, espace |
| Numérique | Technologies & IA | IA, plateformes, puces, régulation |
| Numérique | Cybersécurité | Attaques, failles, cyberconflits |
| Idées | Idées & culture | Livres, débats, arts, médias |
| — | Éditorial | Le fil rouge du jour et le choix de la une |

## Ce que contient chaque article

- un texte court (450 à 650 mots) où **chaque fait porte son lien** vers la
  source, avec au moins 6 liens vers au moins 4 sites ;
- **En bref** : les trois points à retenir ;
- **Notions clés** : les concepts expliqués, chacun avec une ressource
  pédagogique. Elles alimentent le glossaire du site ;
- **Pour aller plus loin** : 3 à 5 dossiers, rapports ou explications de fond ;
- **Sources** : la liste complète, numérotée, avec le nom de chaque site.

Le site propose aussi une une avec l'éditorial, des pages par cahier et par
rubrique, un **glossaire des notions**, une **recherche** plein texte, les
archives, un flux RSS et un mode sombre.

## Organisation du dépôt

```
site.config.json               nom du journal, devise, rubriques et consignes des agents
redaction/CONSIGNES.md         charte éditoriale et format des articles
content/AAAA-MM-JJ/*.md        les articles, une édition par dossier
assets/style.css               mise en page
scripts/build.mjs              générateur du site statique (sans dépendance) → _site/
scripts/verifier.mjs           contrôle du format des articles
scripts/verifier-liens.mjs     test des liens ; --corriger retire les liens morts
assets/app.js                  thème, barre de lecture, recherche
vercel.json                    configuration de l'hébergement Vercel
.github/workflows/
  edition-quotidienne.yml      la routine : agents → éditorial → commit sur main
.claude/skills/edition-du-jour la même routine, lançable depuis Claude Code
```

## Consulter le site en local

```bash
npm run serve        # puis ouvrir http://localhost:8000
```

## Mise en route de la routine quotidienne

1. **Branche principale** : la routine publie sur `main`, qui doit être la
   branche par défaut du dépôt. Les tâches planifiées de GitHub
   s'exécutent uniquement sur la branche par défaut.
2. **Vercel** : sur vercel.com, *Add New → Project*, importer ce dépôt et
   garder les réglages proposés, qui sont lus depuis `vercel.json` : build
   `node scripts/build.mjs`, dossier de sortie `_site`, pas de framework.
   Chaque push sur `main` redéploie le site, y compris le commit quotidien
   de la rédaction.
   Si Vercel bloque les déploiements déclenchés par le bot GitHub (cas des
   dépôts privés sur l'offre Hobby), créer un *Deploy Hook* dans *Settings →
   Git* du projet Vercel et l'enregistrer comme secret GitHub
   `VERCEL_DEPLOY_HOOK`. La routine l'appellera après chaque édition.
3. **Accès à Claude** : dans *Settings → Secrets and variables → Actions*,
   ajouter **un seul** de ces secrets :
   - `CLAUDE_CODE_OAUTH_TOKEN`, pour utiliser un abonnement Claude Pro ou Max.
     Le jeton s'obtient avec `claude setup-token` ;
   - ou `ANTHROPIC_API_KEY`, une clé API de console.anthropic.com
     (facturation à l'usage).
4. **Premier essai** : *Actions → Édition quotidienne → Run workflow*.
   On peut ne produire que certaines rubriques, par exemple `economie,cybersecurite`.

L'édition part ensuite chaque jour vers 6 h 17, heure de Paris. L'horaire se
change dans la ligne `cron` du workflow, en heure UTC. Le modèle utilisé se
règle avec la variable de dépôt `MODELE_REDACTION`, qui vaut
`claude-sonnet-5-5` par défaut.

## Ajouter ou modifier une rubrique

Tout se fait dans `site.config.json`. Il suffit d'ajouter une entrée
`{ id, cahier, nom, agent, consigne }`. La page de rubrique, sa place dans son
cahier et l'agent-rédacteur correspondant sont créés automatiquement à
l'édition suivante. Chaque rubrique ajoute un agent, donc une exécution de
Claude, à la routine quotidienne.

## Alternative : une routine Claude Code

Sans GitHub Actions, on peut planifier une routine sur claude.ai/code qui
exécute chaque matin le skill `edition-du-jour`. Ce skill lance un sous-agent
par rubrique, écrit l'éditorial, reconstruit le site et pousse l'édition.

## Avertissement

Les articles sont des synthèses produites par une IA à partir des sources
qu'elle cite. La charte interdit l'invention de faits et d'URL, et la
routine teste chaque lien avant publication. Une relecture humaine reste
toutefois recommandée avant toute diffusion.
