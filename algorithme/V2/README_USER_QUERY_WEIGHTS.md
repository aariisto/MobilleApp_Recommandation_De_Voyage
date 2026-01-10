# 🎯 Système de Pondération des Préférences Utilisateur

## 📋 Vue d'ensemble

Le système de **génération de requêtes utilisateur avec poids** permet de transformer les préférences de voyage en requêtes textuelles optimisées pour la similarité sémantique avec les descriptions de villes via MiniLM embeddings.

## 🏗️ Architecture du système

### Fonction principale

```python
def generate_user_query_with_weights(
    user_categories: List[str],     # Catégories obligatoires
    weights: Dict[str, int] = None  # Poids optionnels (1-5)
) -> str:
```

### Logique de fallback

- **Avec poids** → Génération avec escalation sémantique
- **Sans poids** → Appel automatique à `generate_user_query()` (version simple)

## ⚖️ Système de pondération (1-5)

### Échelle d'intensité

| Poids | Niveau       | Intensité        | Exemple                                                            |
| ----- | ------------ | ---------------- | ------------------------------------------------------------------ |
| **1** | **Défaut**   | Neutre           | `"historical heritage"`                                            |
| **2** | **Léger**    | Mention +        | `"historical heritage and cultural experiences"`                   |
| **3** | **Modéré**   | Enrichissement   | `"historical heritage with rich historical significance"`          |
| **4** | **Fort**     | Focus appuyé     | `"historical heritage with a strong focus on culture and history"` |
| **5** | **Priorité** | Priorité absolue | `"historical heritage as a top priority"`                          |

### Règles de poids

```python
# Poids par défaut = 1 (au lieu de 3)
weighted[cat_clean] = _clamp_weight(weights.get(cat_clean, 1))

# Fonction de limitation 1-5
def _clamp_weight(w: int) -> int:
    return max(1, min(5, w))
```

## 🗂️ Classification en 5 thèmes majeurs

### 1. 🌿 **Nature**

- **Détection :** `natural.*`, `beach.*`, `island.*`, `national_park.*`
- **Escalation :**
  1. `beautiful landscapes`
  2. `beautiful landscapes and outdoor activities`
  3. `beautiful landscapes with great natural diversity`
  4. `beautiful landscapes with a strong focus on nature`
  5. `beautiful landscapes as a top priority`

### 2. 🏛️ **Histoire**

- **Détection :** `heritage.*`, `tourism.sights.*`, `religion.*`, `memorial.*`, `building.historic`
- **Sites préférés :** castle, ruines, monastery, cathedral, mosque, temple, etc.
- **Escalation :**
  1. `historical heritage, landmarks like castle, ruines`
  2. `historical heritage, landmarks like castle, ruines and cultural experiences`
  3. `historical heritage, landmarks like castle, ruines with rich historical significance`
  4. `historical heritage, landmarks like castle, ruines with a strong focus on culture and history`
  5. `historical heritage, landmarks like castle, ruines as a top priority`

### 3. 🍽️ **Gastronomie**

- **Détection :** `catering.restaurant.*`, `production.winery`, `production.brewery`
- **Exclusions :** "restaurant", "regional" (mots génériques)
- **Escalation :**
  1. `restaurants serving italian cuisine`
  2. `restaurants serving italian cuisine and local specialties`
  3. `restaurants serving italian cuisine with diverse culinary offerings`
  4. `restaurants serving italian cuisine with a strong food focus`
  5. `restaurants serving italian cuisine as a top priority`

### 4. 🛍️ **Shopping**

- **Détection exacte :** `commercial.shopping_mall`, `commercial.marketplace`, `commercial.gift_and_souvenir`
- **Escalation :**
  1. `shopping malls, local marketplaces`
  2. `shopping malls, local marketplaces and retail therapy`
  3. `shopping malls, local marketplaces with great shopping variety`
  4. `shopping malls, local marketplaces with a strong focus on shopping`
  5. `shopping malls, local marketplaces as a top priority`

### 5. 🎪 **Divertissement**

- **Détection :** `ski.*`, `adult.nightclub.*`, `adult.casino.*`, `entertainment.theme_park.*`, `sport.stadium.*`
- **Escalation :**
  1. `theme parks, nightlife, casinos`
  2. `theme parks, nightlife, casinos and entertainment options`
  3. `theme parks, nightlife, casinos with vibrant recreational activities`
  4. `theme parks, nightlife, casinos with a strong focus on fun`
  5. `theme parks, nightlife, casinos as a top priority`

## 🔄 Algorithme de traitement

### 1. **Calcul des poids par préfixe**

```python
def weight_for_prefix(prefix: str) -> int:
    best = 0
    for tag, w in weighted.items():
        if tag == prefix or tag.startswith(prefix + "."):
            best = max(best, w)
    return best
```

**Exemple :** `heritage.unesco` (poids 5) + `heritage.world` (poids 3) → `heritage` = poids 5

### 2. **Génération de chunks pondérés**

```python
weighted_chunks: List[Tuple[int, int, str]] = []
# Format: (poids_desc, ordre_stable, texte)

# Ajout de chaque thème détecté
if has_nature:
    chunk = _pick_by_weight(nature_weight, nature_options)
    weighted_chunks.append((nature_weight, 1, chunk))
```

### 3. **Priorisation et assemblage**

```python
# Tri: poids décroissant, puis ordre stable (nature=1, history=2, etc.)
weighted_chunks.sort(key=lambda x: (-x[0], x[1]))
chunks = [c for _, _, c in weighted_chunks][:3]  # Max 3 chunks
return f"A destination featuring {_join_natural(chunks)}."
```

## 📝 Exemples concrets

### Exemple 1: Préférences équilibrées

```python
categories = ["heritage.unesco", "catering.restaurant.french", "beach"]
weights = {"heritage.unesco": 3, "catering.restaurant.french": 2, "beach": 1}

# Résultat:
# "A destination featuring historical heritage with rich historical significance,
#  restaurants serving french cuisine and local specialties,
#  and beautiful landscapes."
```

### Exemple 2: Priorité forte

```python
categories = ["heritage.world", "natural.forest"]
weights = {"heritage.world": 5, "natural.forest": 1}

# Résultat:
# "A destination featuring historical heritage as a top priority
#  and beautiful landscapes like forest."
```

### Exemple 3: Sans poids (fallback)

```python
categories = ["beach", "catering.restaurant.italian"]
weights = None  # ou {}

# Appelle automatiquement generate_user_query()
# "A destination featuring beautiful landscapes like beach
#  and restaurants serving italian cuisine."
```

## 🎯 Optimisation sémantique

### Template aligné

- **Utilisateur :** `"A destination featuring..."`
- **Villes :** `"A destination featuring..."` (générées par `add_categories_gpt.py`)
- **Objectif :** Maximiser la similarité cosinus MiniLM

### Vocabulaire identique

- Utilise exactement les mêmes termes que les descriptions de villes
- Configuration partagée via `categories_gpt_keys.json`
- Cohérence entre requêtes utilisateur et corpus de villes

## 🔧 Configuration

### Fichier de référence

```json
// categories_gpt_keys.json - Version 4
{
  "include_themes": {
    "nature": {
      "any_prefixes": ["natural", "beach", "island", "national_park"]
    },
    "history": {
      "any_prefixes": ["heritage", "tourism.sights", "religion", "memorial"]
    },
    "gastronomy": { "restaurants_prefix": "catering.restaurant" },
    "shopping": {
      "any_exact": ["commercial.shopping_mall", "commercial.marketplace"]
    },
    "fun_sport": { "any_prefixes": ["ski", "adult.nightclub", "adult.casino"] }
  }
}
```

### Règles d'extraction

- **Nature :** Extraction des feuilles (`natural.forest` → "forest")
- **Histoire :** Sites préférés (castle, ruines, cathedral)
- **Gastronomie :** Types de cuisine (exclusion "restaurant", "regional")
- **Shopping :** Types exacts seulement
- **Divertissement :** Détection par préfixes

## ⚡ Performance

### Limitations

- **Max 3 chunks** par requête (stabilité)
- **Max 3 éléments** par thème (lisibilité)
- **Déduplication** automatique

### Complexité

- **O(n)** où n = nombre de catégories
- **Tri stable** pour cohérence des résultats
- **Cache-friendly** avec préfixes pré-calculés

---

## 🚀 Utilisation

```python
from user_query import generate_user_query_with_weights

# Cas d'usage simple
result = generate_user_query_with_weights(
    ["heritage.unesco", "beach", "catering.restaurant.italian"],
    {"heritage.unesco": 5, "beach": 2}
)
print(result)
# "A destination featuring historical heritage as a top priority,
#  beautiful landscapes and outdoor activities,
#  and restaurants serving italian cuisine."
```
