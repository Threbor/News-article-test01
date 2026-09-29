# Le Veilleur

Un quotidien d'analyse en ligne, sur le modèle des grands mensuels
d'analyse, écrit chaque matin par une **rédaction d'agents Claude** :

| Rubrique | Agent |
|---|---|
| Économie mondiale | Agent Économie |
| Cybersécurité | Agent Cyber |
| Politique française | Agent Politique |
| Géopolitique | Agent International |
| Écologie & climat | Agent Écologie |
| Sciences & techniques | Agent Sciences |
| Éditorial + choix de la une | Le rédacteur en chef |

Chaque agent recherche l'actualité des dernières 24 à 72 heures sur le web,
choisit un sujet, écrit une analyse de 800 à 1 200 mots et cite ses sources.
Le rédacteur en chef lit ensuite l'édition, écrit l'éditorial et choisit
l'article de une.

## Organisation du dépôt

```
site.config.json               nom du journal, devise, rubriques et consignes des agents
redaction/CONSIGNES.md         charte éditoriale et format des articles
content/AAAA-MM-JJ/*.md        les articles, une édition par dossier
assets/style.css               mise en page
scripts/build.mjs              générateur du site statique (sans dépendance) → _site/
scripts/verifier.mjs           contrôle du format des articles
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
`{ id, nom, agent, consigne }`. La navigation du site, la page de rubrique et
l'agent-rédacteur correspondant sont créés automatiquement à l'édition suivante.

## Alternative : une routine Claude Code

Sans GitHub Actions, on peut planifier une routine sur claude.ai/code qui
exécute chaque matin le skill `edition-du-jour`. Ce skill lance un sous-agent
par rubrique, écrit l'éditorial, reconstruit le site et pousse l'édition.

## Avertissement

Les articles sont des synthèses produites par une IA à partir des sources
qu'elle cite. La charte interdit l'invention de faits et impose au moins
quatre sources par article, mais une relecture humaine reste recommandée
avant toute diffusion.
