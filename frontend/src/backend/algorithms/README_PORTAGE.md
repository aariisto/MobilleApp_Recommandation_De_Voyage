# Portage Python → JavaScript

## Fichiers créés

### 1. `userQuery.js` (Port complet de `user_query.py`)
**Objectif**: Génère des requêtes en langage naturel à partir de catégories utilisateur.

**Fonctions principales**:
- `generateUserQuery(userCategories)` - Version simple sans poids
- `generateUserQueryWithWeights(userCategories, weights)` - Version avec poids 1-5

**Logique**:
1. Extrait les catégories par domaine (nature, history, gastronomy, shopping, fun)
2. Construit des chunks en langage naturel
3. Avec poids: adapte les phrases selon l'intensité (1-5)
   - Weight 1: phrase de base
   - Weight 5: "as a top priority"
4. Retourne: `"A destination featuring X, Y, and Z."`

**Exemple**:
```javascript
const categories = ["beach", "catering.restaurant.italian", "heritage.unesco"];
const weights = { "beach": 5, "catering.restaurant.italian": 3, "heritage.unesco": 4 };

const query = generateUserQueryWithWeights(categories, weights);
// → "A destination featuring beautiful landscapes like beach as a top priority, 
//    historical heritage with rich historical significance, 
//    and restaurants serving italian cuisine."
```

---

### 2. `rankCities.js` (Port de `rank_cities_by_similarity` de `teste_algo.py`)
**Objectif**: Classe les villes par similarité avec les préférences utilisateur.

**Fonctions principales**:
- `cosineSimilarity(vec1, vec2)` - Calcul similarité cosinus
- `getUserEmbedding(likesText, dislikesText)` - Génère embedding utilisateur
- `rankCitiesBySimilarity(userText, cities, dislikesText)` - Classe les villes

**Logique**:
1. **getUserEmbedding**:
   - Génère `embedding_likes` via ONNX (InferenceService)
   - Si `dislikesText` fourni, génère `embedding_dislikes`
   - Retourne: `embedding_likes - embedding_dislikes`
   - Cela "repousse" les résultats contenant les dislikes

2. **rankCitiesBySimilarity**:
   - Génère l'embedding utilisateur
   - Pour chaque ville: calcule `cosineSimilarity(userEmbedding, cityEmbedding)`
   - Trie par similarité décroissante
   - Retourne: `[{id, name, similarity}, ...]`

**Différence avec Python**:
- Python: `SentenceTransformer('all-MiniLM-L6-v2')`
- JavaScript: `InferenceService` (ONNX model_qint8_arm64.onnx)
- Même dimension d'embedding: 384
- Même logique de calcul

**Exemple**:
```javascript
const userText = "A destination featuring beautiful landscapes like beach.";
const cities = await CityRepository.getAllCityEmbeddings();

const ranked = await rankCitiesBySimilarity(userText, cities, "");
// → [{id: 5, name: "Bali", similarity: 0.8732}, ...]
```

---

## Intégration dans l'app

### Dans `App.js`:

```javascript
import { rankCitiesBySimilarity } from "./src/backend/algorithms/rankCities.js";
import { generateUserQuery, generateUserQueryWithWeights } from "./src/backend/algorithms/userQuery.js";

// Test du nouvel algorithme
const testNewAlgorithm = async () => {
  const userId = 1;
  
  // 1. Récupérer préférences du QCM
  const profile = await UserCategoryRepository.getUserPreferencesProfile(userId);
  
  // 2. Construire catégories et poids
  const userCategories = profile.likes.map(l => l.category_name);
  const weights = {};
  profile.likes.forEach(like => {
    weights[like.category_name] = like.points;
  });
  
  // 3. Générer requête en langage naturel
  const userQuery = generateUserQueryWithWeights(userCategories, weights);
  // → "A destination featuring beautiful landscapes as a top priority, ..."
  
  // 4. Charger villes avec embeddings
  const cities = await CityRepository.getAllCityEmbeddings();
  
  // 5. Ranking
  const ranked = await rankCitiesBySimilarity(userQuery, cities, "");
  
  // 6. Top 10
  console.log(ranked.slice(0, 10));
};
```

---

## Flux complet

```
QCM → user_category_likes/dislikes (BDD)
       ↓
getUserPreferencesProfile(userId)
       ↓
{likes: [{category_name, points}, ...], dislikes: [...]}
       ↓
generateUserQueryWithWeights(categories, weights)
       ↓
"A destination featuring X, Y, and Z."
       ↓
rankCitiesBySimilarity(userQuery, cities, "")
       ↓
InferenceService.generateEmbedding(userQuery)
       ↓
embedding utilisateur (384 dims)
       ↓
Pour chaque ville: cosineSimilarity(userEmbedding, cityEmbedding)
       ↓
Tri par similarité décroissante
       ↓
[{id, name, similarity}, ...]
       ↓
Top 10 villes recommandées
```

---

## Différences Python ↔ JavaScript

| Aspect | Python (teste_algo.py) | JavaScript (rankCities.js) |
|--------|------------------------|----------------------------|
| Modèle ML | `SentenceTransformer('all-MiniLM-L6-v2')` | `InferenceService` (ONNX) |
| Embedding | `model.encode(text)` | `InferenceService.generateEmbedding(text)` |
| Dimension | 384 | 384 |
| Similarité | `numpy` cosine | Implémentation JS native |
| Logique | `embedding_likes - embedding_dislikes` | Identique |
| Output | `[{id, name, similarity}]` | Identique |

---

## Tests

### Test 1: Génération de requête simple
```javascript
const categories = ["beach", "museum", "restaurant"];
const query = generateUserQuery(categories);
// → "A destination featuring beautiful landscapes like beach and great local restaurants."
```

### Test 2: Génération avec poids
```javascript
const weights = { "beach": 5, "museum": 2 };
const query = generateUserQueryWithWeights(categories, weights);
// → "A destination featuring beautiful landscapes like beach as a top priority."
```

### Test 3: Ranking complet
```javascript
await testNewAlgorithm(); // Voir App.js
```

---

## Prochaines étapes

1. ✅ **Port Python → JS complet**
2. ⏳ **Test avec données réelles du QCM**
3. ⏳ **Intégration dans PreferencesScreen**
4. ⏳ **Affichage du top 10 dans l'interface**
5. ⏳ **Nettoyage du code de pénalité (deprecated)**

---

## Notes importantes

- **Tables BDD**: `user_category_likes` et `user_category_dislikes` restent valides
- **Points**: 1-5 (utilisés comme poids)
- **ONNX model**: Déjà présent dans `assets/models/`
- **Dimension embedding**: 384 (cohérent Python/JS)
- **Logique dislikes**: `embedding_likes - embedding_dislikes` (repousse les dislikes)
