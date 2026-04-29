# Journal de bord — wtt-internship-training

> Résolution des problèmes rencontrés lors de la mise en place et l'exécution du projet.

---

## Problème 1 — `npm run build` échouait

**Erreur**
```
cp: dest is not a directory (too many sources)
cp: no such file or directory: .env
```

**Cause**

Deux causes combinées :
1. Le fichier `.env` n'existait pas — le renommer depuis l'Explorateur Windows avait produit `.env.example` au lieu de `.env` car Windows masque les extensions par défaut.
2. `tsc` échouait silencieusement (voir Problème 2), donc le dossier `build/` n'était jamais créé. Le script `postbuild` tentait d'y copier des fichiers et plantait.

**Solution**

Créer `.env` depuis le terminal (jamais depuis l'Explorateur) :

```bash
copy .env.example .env
```

Puis corriger le bug TypeScript qui empêchait `tsc` de générer le dossier `build/`.

**Leçon retenue**

> Sur Windows, toujours créer les fichiers commençant par un point (`.env`, `.gitignore`) depuis le terminal.
> L'Explorateur masque les extensions et peut induire en erreur.

---

## Problème 2 — Bug intentionnel dans `transfomer.service.ts`

**Erreur**
```
Cannot find module 'champanzini bananini'
Duplicate identifier '_'
```

**Fichier concerné** : `src/services/utils/transfomer.service.ts`

**Cause**

Deux imports en conflit sur les premières lignes du fichier :

```ts
import _ from 'lodash'              // ✅ package réel
import _ from 'champanzini bananini' // ❌ package inexistant + nom dupliqué
```

**Solution**

Supprimer la ligne 2 — `lodash` était déjà correctement importé à la ligne 1.

```ts
import _ from 'lodash'
```

**Leçon retenue**

> Lire les erreurs TypeScript attentivement : elles indiquent le fichier, la ligne et la colonne exacte du problème.
> `tsc` seul (sans `npm run build`) permet d'isoler les erreurs de compilation.

---

## Problème 3 — `npm run exe` échouait : `ts-node` introuvable

**Erreur**
```
'ts-node' n'est pas reconnu en tant que commande interne ou externe
```

**Cause**

Le script `exe` dans `package.json` utilise `ts-node` :
```json
"exe": "ts-node src/index"
```
Mais `ts-node` n'était pas déclaré dans les `devDependencies` bug dans le projet.
`npm install` n'installe que ce qui est déclaré dans `package.json`, donc `ts-node` n'était jamais téléchargé.

**Solution**

```bash
npm install --save-dev ts-node
```

Cette commande installe `ts-node` et l'ajoute automatiquement dans les `devDependencies` du `package.json`.

**Leçon retenue**

> Tout outil utilisé dans les scripts `package.json` doit être déclaré dans les dépendances.
> Sinon il ne sera jamais installé et le script échouera.

---

## Problème 4 — Bug dans `main.service.ts`

**Erreur**
```
ShellService: format must be one of xlsx,json,csv,txt,xml (given "jzon")
TypeError: Cannot read properties of undefined (reading 'length')
```

**Fichier concerné** : `src/services/main/main.service.ts` ligne 20

**Cause**

```ts
const file = `./inputs/piege.jzon`  // ❌ extension "jzon" invalide + fichier inexistant
```

Deux problèmes :
1. L'extension `.jzon` n'est pas supportée (faute de frappe volontaire sur `.json`)
2. Le fichier `piege.jzon` n'existe pas dans le dossier `inputs/`

Conséquence en chaîne :
```
readfile() échoue → retourne undefined → data.length → TypeError
```

**Solution**

```ts
const file = `./inputs/sample.json`  // ✅ fichier existant avec bonne extension
```

**Leçon retenue**

> Une erreur peut en cacher une autre. Ici le `TypeError` était une conséquence,
> pas la cause réelle. Toujours remonter à l'origine de la chaîne d'erreurs.

---

## Résultat final

| Commande | Résultat |
|---|---|
| `npm install` | ✅ 507 packages installés |
| `npm run build` | ✅ Compilation TypeScript sans erreur |
| `npm run exe` | ✅ `There is 788 elements in ./inputs/sample.json` |
| `npm test` | ✅ Tests unitaires passent |
