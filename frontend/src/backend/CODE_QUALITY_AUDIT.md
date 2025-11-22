# 🕵️ Audit de Qualité du Code Backend

Ce document analyse la qualité du code dans le dossier `frontend/src/backend` et propose des améliorations pour le rendre plus robuste, maintenable et performant ("Smell Good").

## 📊 Note Globale : B+

Le code est bien structuré, modulaire et documenté. L'architecture en couches (Repositories, Services, Database) est respectée. Cependant, quelques "code smells" (mauvaises pratiques) subsistent, principalement liés à la gestion des erreurs, aux logs et à la performance potentielle.

---

## 🏗️ Architecture & Patterns

### ✅ Points Forts

- **Séparation des responsabilités** : `DatabaseConnection` gère la connexion, `Repositories` gèrent le SQL, `Services` gèrent la logique métier.
- **Singleton Pattern** : Utilisé correctement pour la connexion DB et les repositories (évite d'ouvrir 50 connexions).
- **JSDoc** : La documentation des fonctions est présente et claire.

### ⚠️ Points d'Attention (Code Smells)

2.  **Mélange de responsabilités dans `vectorUtils.js`** : Ce fichier gère à la fois les maths pures (cosinus, blob) ET le chargement du modèle ONNX/Vocabulaire.
    - _Solution_ : Séparer la logique ONNX dans un `ModelService.js`.

---

## 🚀 Performance & Optimisation

### ⚠️ Problèmes Potentiels

1.  **Chargement massif en mémoire** :

    - `rankCitiesBySimilarity` (dans `rankUtils.js`) et `recommendCitiesForUser` (dans `RecommendationService.js`) chargent **TOUTES** les villes et leurs vecteurs en mémoire JS pour faire le tri.
    - _Impact_ : Avec 200 villes, c'est OK. Avec 10 000 villes, l'application va crasher ou ramer sévèrement.
    - _Solution_ : SQLite ne supporte pas nativement la recherche vectorielle, mais on pourrait pré-filtrer par pays ou région avant de charger les vecteurs.

2.  **Conversion BLOB <-> Vecteur répétitive** :
    - La conversion `blobToVector` est coûteuse en CPU si faite sur des milliers d'éléments à chaque requête.

---

## 🧹 Code Style & Cleanliness

### ❌ Code Smells (À corriger)

1.  **Pollution de `console.log`** :

    - Le code est rempli de `console.log` ("✅ Embedding likes généré", "👤 Génération...", etc.).
    - _Pourquoi c'est mal_ : Ça ralentit l'app en production et pollue les logs natifs.
    - _Solution_ : Utiliser un vrai logger ou supprimer les logs de debug.

2.  **Gestion des erreurs générique** :

    - Beaucoup de `try/catch` qui font juste `console.error` et `throw error`.
    - _Solution_ : Créer des classes d'erreur personnalisées (`DatabaseError`, `ModelError`) pour mieux gérer les cas (ex: afficher une alerte à l'utilisateur si le modèle ne charge pas).

3.  **Hardcoded Strings (Chaînes magiques)** :
    - Le nom de la DB `"travel.db"` est en dur dans `connection.js`.
    - Les requêtes SQL sont en dur dans les méthodes.

---

## 🛠️ Plan d'Action (Pour rendre le code "Smell Good")

Voici les étapes recommandées pour améliorer le code :

### 1. Nettoyage (Immédiat) ✅ COMPLÉTÉ

- [x] ~~Supprimer les `console.log` inutiles dans `rankUtils.js` et `vectorUtils.js`.~~
  - Remplacés par `Logger.debug()` qui sont désactivés en production
- [x] ~~Extraire le nom de la base de données dans une constante ou un fichier de config (`config.js`).~~
  - Créé `config/database.config.js` avec `DATABASE_CONFIG`

### 2. Refactoring (Moyen terme) ✅ COMPLÉTÉ

- [x] ~~**Séparer la logique ONNX**~~ : Créé `services/InferenceService.js` pour gérer le chargement du modèle et la tokenisation.
  - `vectorUtils.js` ne contient plus que les fonctions mathématiques pures
  - `InferenceService` gère tout le ML (ONNX, tokenisation, normalisation)

### 3. Robustesse (Long terme)

- [ ] **Tests Unitaires** : Ajouter des tests Jest pour `vectorUtils.js` (maths) et `rankUtils.js` (logique de tri).
- [ ] **Typage** : Migrer vers TypeScript ou utiliser JSDoc plus strict pour garantir que les vecteurs ont bien la bonne dimension (384).

---

## 📝 Exemple de Refactoring (Logger)

Au lieu de :

```javascript
console.log("✅ Embedding likes généré");
```

Créer `src/utils/Logger.js` :

```javascript
const isDev = __DEV__;

export const Logger = {
  debug: (...args) => isDev && console.log("🐛", ...args),
  info: (...args) => console.log("ℹ️", ...args),
  error: (...args) => console.error("❌", ...args),
};
```

Et utiliser :

```javascript
Logger.debug("Embedding likes généré");
```
