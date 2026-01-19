# Système de Recommandation de Voyages

## 📌 Vue d'ensemble

Ce projet utilise l'**intelligence artificielle** pour recommander les meilleures villes en fonction de ce que vous recherchez. Par exemple, si vous aimez les plages et les restaurants, le système vous recommandera les villes côtières avec une bonne gastronomie.

---

## 🎯 Comment ça fonctionne ?

### **Étape 1 : Transformer le texte en nombres**

Chaque ville (Paris, Nice, Barcelona, etc.) possède des **catégories** comme :

- Plage 🏖️
- Restaurant 🍽️
- Musée 🏛️
- Shopping 🛍️
- etc.

Le système transforme ces catégories en **vecteur numérique** (une liste de nombres) appelé **embedding**. C'est comme une "signature" unique pour chaque ville.

**Exemple :**

```
Paris → "musée art galerie restaurant" → [0.045, 0.123, -0.087, ..., 0.234]
Nice  → "plage restaurant café soleil" → [0.234, 0.156, 0.045, ..., -0.123]
```

### **Étape 2 : Transformer votre recherche en nombres**

Quand vous dites "Je recherche une plage avec des restaurants", le système fait exactement la même chose :

```
Votre texte → "plage restaurant" → [0.089, 0.145, -0.056, ..., 0.198]
```

### **Étape 3 : Comparer et classer**

Le système calcule la **similarité** entre votre recherche et chaque ville. C'est comme mesurer combien votre souhait ressemble à chaque ville.

La similarité va de **-1 à 1** :

- ✅ **1.0** = Parfaite correspondance
- ✅ **0.5** = Bonne correspondance
- ⚠️ **0.0** = Aucun rapport
- ❌ **-1.0** = Complètement opposé

Le système classe alors les villes du meilleur au moins bon résultat.

### **Nouveauté : Gestion des préférences et aversions (Likes & Dislikes)**

Le système supporte maintenant les **dislikes** (ce que vous n'aimez PAS) !

**Formule :**

```
vecteur_final = embedding(likes) - embedding(dislikes)
```

**Comment ça marche :**

- `embedding(likes)` : Ce que vous recherchez (plage, restaurant)
- `embedding(dislikes)` : Ce que vous voulez éviter (montagne, froid)
- La **soustraction** repousse les résultats qui contiennent vos dislikes

**Exemple concret :**

```
Vous dites :
  ✅ J'aime : "plage restaurant shopping"
  ❌ Je n'aime pas : "montagne froid noir"

Résultat :
  ✅ Nice est recommandée (plage + restaurant)
  ❌ Chamonix est évitée (montagne + froid)
```

C'est comme si vous créiez un "profil de voyage" personnalisé où le système comprend non seulement ce que vous voulez, mais aussi ce que vous voulez éviter absolument.

---

## 🛠️ Architecture technique

### **Fichiers principaux**

#### 📄 `categorie_to_vecteur.py`

Crée les embeddings (vecteurs) de toutes les villes :

- Se connecte à la base de données PostgreSQL
- Récupère les catégories de chaque ville
- Génère les embeddings avec le modèle **MiniLM-L6-v2**
- Stocke les vecteurs dans la colonne `embedding` de la table `cities`

#### 📄 `teste_algo.py`

Contient l'algorithme de recommandation :

**Fonctions principales :**

1. **`get_all_city_embeddings(conn_params)`**

   - Récupère tous les embeddings depuis PostgreSQL
   - Retourne : `[{id, name, embedding}, ...]`

2. **`get_user_embedding(likes_text, dislikes_text="")`**

   - Convertit votre texte de recherche en embedding
   - Supporte les **likes** (ce que vous aimez) ET les **dislikes** (ce que vous n'aimez pas)
   - Formule : `embedding_final = embedding(likes) - embedding(dislikes)`
   - Exemple simple :
     - `get_user_embedding("plage restaurant")` → `[0.089, 0.145, ...]`
     - `get_user_embedding("plage restaurant", "montagne froid")` → `[0.189, 0.245, ...]` (repousse montagne/froid)

3. **`cosine_similarity(vec1, vec2)`**

   - Calcule la similarité entre deux vecteurs
   - Formule : `dot(v1, v2) / (||v1|| × ||v2||)`
   - Retourne un score de -1 à 1

4. **`rank_cities_by_similarity(user_text, cities, dislikes_text="")`**
   - Génère votre embedding (avec likes et optionnellement dislikes)
   - Compare avec chaque ville
   - Classe les villes par similarité décroissante
   - Sauvegarde dans `ranked_cities.json`

### **Fichiers de données**

#### 📊 `cities_embeddings.json`

Contient les embeddings de toutes les villes (200 villes).

**Format :**

```json
[
  {
    "id": 1,
    "name": "Paris",
    "embedding": [0.061, 0.054, 0.008, -0.125, ...]
  },
  {
    "id": 2,
    "name": "Nice",
    "embedding": [0.234, 0.156, 0.045, -0.089, ...]
  },
  ...
]
```

#### 📊 `ranked_cities.json`

Contient le résultat des recommandations triées.

**Format :**

```json
[
  {
    "id": 1,
    "name": "Paris",
    "similarity": 0.8234
  },
  {
    "id": 63,
    "name": "The Hague",
    "similarity": 0.7891
  },
  ...
]
```

---

## 🧠 Concepts clés expliqués simplement

### **Embedding (Vecteur)**

C'est un moyen de représenter du texte avec des nombres pour que l'ordinateur puisse le comprendre et le comparer.

**Analogie :**
Un vecteur est comme les coordonnées GPS d'une ville, mais dans un espace à 384 dimensions au lieu de 2 (latitude/longitude).

### **Similarité Cosinus**

Mesure l'angle entre deux vecteurs.

- Angle de 0° = Vecteurs identiques → Similarité = 1.0
- Angle de 90° = Vecteurs indépendants → Similarité = 0.0
- Angle de 180° = Vecteurs opposés → Similarité = -1.0

**Analogie visuelle :**

```
Vecteur A →
               ← Vecteur B (Angle petit = Similarité haute)

Vecteur A →
            ↑ Vecteur B (Angle grand = Similarité basse)
```

### **Modèle MiniLM-L6-v2**

Un petit modèle d'IA pré-entraîné qui transforme du texte en vecteurs (embeddings).

- Léger et rapide ⚡
- Produit des vecteurs de 384 dimensions
- Comprend la signification des mots, pas juste les lettres

---

## 📊 Exemple complet : Pas à pas

**Vous cherchez :** `"plage shopping culture"`

### Étape 1️⃣ : Votre recherche devient un vecteur

```
"plage shopping culture"
  ↓
[0.089, 0.145, -0.056, 0.234, ..., 0.198]  (384 nombres)
```

### Étape 2️⃣ : Comparaison avec Nice

```
Nice a comme catégories : "plage restaurant café"
Nice = [0.234, 0.156, 0.045, 0.123, ..., -0.123]

Similarité = dot(votre_vecteur, nice_vecteur) / (norm(votre) × norm(nice))
           = 0.85  ✅ Très bon match !
```

### Étape 3️⃣ : Comparaison avec Berlin

```
Berlin a comme catégories : "musée art galerie"
Berlin = [0.012, 0.456, 0.789, 0.345, ..., 0.567]

Similarité = 0.62  ✅ Correct match
```

### Résultat final

```
1. Nice       - 0.85  ← Plage + Shopping + Culture (tous les trois !)
2. Barcelona  - 0.82  ← Plage + Shopping
3. Berlin     - 0.62  ← Culture + Art (pas de plage)
```

---

## 🔧 Dépendances

```
psycopg2          # Connexion PostgreSQL
sentence-transformers  # Génération d'embeddings
numpy             # Calculs mathématiques
json              # Stockage des résultats
```

### Installation

```bash
pip install psycopg2-binary sentence-transformers numpy
```

---

## 💡 Points forts de cette approche

✅ **Sémantique** : Comprend le sens, pas juste les mots-clés  
✅ **Scalable** : Fonctionne avec 100 ou 10 000 villes  
✅ **Rapide** : Embeddings pré-calculés, pas de calcul à chaque requête  
✅ **Flexibilité** : Marche avec n'importe quel texte de recherche  
✅ **Explicable** : Chaque résultat a un score de similarité

---

## 🎓 Pour aller plus loin

- **Modèles plus grands** : Utiliser `all-mpnet-base-v2` pour plus de précision
- **Filtrage** : Ajouter des critères (budget, climat, distance)
- **Poids personnalisés** : Donner plus d'importance à certaines catégories
- **Clustering** : Grouper les villes similaires
