# wtt-internship-training

## 1. Objectifs du projet

Ce projet a pour vocation de familiariser progressivement le candidat avec :

- une codebase TypeScript classique ;
- les principaux outils de développement modernes ;
- les bonnes pratiques de collaboration (Git, revues de code, documentation).

À l’issue de ce parcours, le candidat devra être capable de :

- comprendre l’architecture d’un projet TypeScript standard ;
- cloner, configurer, lancer et tester une application ;
- travailler proprement avec Git (branches, commits, merge requests) ;
- utiliser de manière autonome les outils fournis (build, tests, scripts npm).

## 2. Prérequis techniques

Avant de commencer, il est nécessaire de s’assurer que les éléments suivants sont installés et configurés :

- **Node.js** (incluant npm) – version LTS recommandée ;
- **Git** – avec l’identité correctement configurée (`user.name`, `user.email`) ;
- **Visual Studio Code** – ou un IDE équivalent compatible TypeScript.

Il convient de vérifier que les commandes suivantes fonctionnent dans le terminal :

- `node -v`
- `npm -v`
- `git --version`

## 3. Bonnes pratiques Git et workflow

Ces règles sont à appliquer dès le début du projet. Elles sont attendues comme des réflexes professionnels.

### 3.1. Organisation des branches

- Il est recommandé de **ne jamais travailler directement sur la branche `main`**.
- Créer d’abord une branche personnelle depuis `main` :
  - **Nom conseillé** : `prenom_nom`  
    (cette branche constituera le "nouveau main" de travail au quotidien).
- Pour chaque nouvelle itération (par exemple, chaque semaine), créer une branche dédiée à partir de la branche personnelle :
  - **Pattern recommandé** : `week-1_28-april`, `week-2_05-may`, etc.

### 3.2. Commits

- Rédiger des messages de commit **clairs, concis et explicites** :
  - À éviter : `fix`, `wip`, `update`.
  - À privilégier : `feat: add Metis service for application domain`, `chore: update README with project setup steps`.
- Effectuer des commits **atomiques** : un petit groupe de changements cohérents par commit.

### 3.3. Synchronisation avec `main`

- Mettre régulièrement sa branche à jour par rapport à `main` :
  - Utiliser de préférence un **rebase** plutôt qu’un merge afin de conserver un historique lisible.
- Résoudre les conflits **au fur et à mesure**, et non après plusieurs jours de divergence.

## 4. Documentation et outils

Avant de tenter de "deviner" le fonctionnement d’une partie du code ou d’un outil :

1. **Lire la documentation existante** (`README.md`, `docs/ressources.md`, commentaires de code).
2. Consulter le fichier `package.json` pour comprendre les scripts disponibles.
3. Le cas échéant, utiliser un assistant (IA/LLM) pour :
   - obtenir des explications ;
   - proposer des corrections ou des refactorings ;
   - générer des exemples de code à adapter.

> Le candidat reste néanmoins responsable de **comprendre** le code et les modifications soumises.

## 5. Ressources utiles

Les ressources complémentaires (liens, tutoriels, bonnes pratiques spécifiques) sont listées dans :

- `docs/ressources.md`

Il est recommandé de lire ce document attentivement au début du parcours.

## 6. Rappel sur les contraintes de temps

L'objectif principal est **l'apprentissage**, mais dans un contexte **réaliste** :

- À l'université, un sujet d'examen doit être traité dans un temps défini.  
  Si le temps était infini, tout le monde réussirait l’épreuve.
- En entreprise, la logique est similaire : toute tâche doit être réalisée dans un délai raisonnable.

En conséquence :

- En cas de **blocage**, il est important de demander de l'aide **rapidement**, et non après plusieurs heures.
- Lors d’une demande d’aide, il convient de préciser :
  - ce qui a déjà été essayé ;
  - ce qui a été compris ;
  - le point de blocage précis.

## 7. Parcours guidé 🧭

> Checklist à suivre dans l'ordre. Chaque étape doit être validée avant de passer à la suivante.

### 7.1. Mise en place du projet

- [ ] Cloner ce repository en local (`git clone <URL_DU_REPO>`).
- [ ] Installer les dépendances du projet (`npm install`).
- [ ] Ouvrir le projet dans Visual Studio Code.

### 7.2. Découverte de la codebase

- [ ] Lister les fichiers et dossiers principaux du projet (pour usage personnel).
- [ ] Comprendre le rôle de chaque dossier/fichier principal :
  - `src/`
  - `tests/`
  - `package.json`
  - `tsconfig.json`
  - `docs/`
- [ ] Lire et comprendre le contenu du fichier `package.json`.
- [ ] Lister l’ensemble des commandes disponibles dans `package.json` (section `scripts`).

### 7.3. Build et exécution

- [ ] Lancer le build du projet (`npm run build`) et corriger les éventuelles erreurs.
- [ ] Lancer le projet en mode exécution/développement (`npm run exe`, ou le script documenté dans `package.json`).
- [ ] Vérifier que le programme se lance sans erreur dans le terminal.

### 7.4. Première modification de code

- [ ] Modifier un fichier TypeScript (par exemple `src/index.ts`) afin d’ajouter un `console.log('Hello World');`.
- [ ] Relancer le build du projet.
- [ ] Vérifier que le message apparaît bien dans la sortie du programme.

### 7.5. Travail collaboratif

- [ ] Pousser le travail réalisé sur une branche dédiée (cf. section 3).
- [ ] Ouvrir une Merge Request sur GitLab vers la branche cible définie par l’équipe.
- [ ] Comprendre la mécanique d'une Merge Request :
  - [ ] création de la MR ;
  - [ ] revue de code (commentaires, suggestions) ;
  - [ ] corrections éventuelles ;
  - [ ] validation et merge.

## 8. Attentes pédagogiques

Pour chaque étape, il est attendu :

- une brève documentation de ce qui a été compris (notes, commentaires, mini-README) ;
- des questions formulées lorsque quelque chose n’est pas clair, **après** une démarche de recherche personnelle minimale ;
- le respect des conventions du projet (formatage, nommage, structure des commits).

Ce projet doit être abordé comme un **énoncé de TP encadré** : le candidat est autonome, mais peut solliciter un encadrant en cas de blocage raisonnable.

