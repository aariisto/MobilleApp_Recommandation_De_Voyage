# 📱 Backend SQLite - Application Voyage

## 🎯 C'est quoi ?

Un système de base de données locale pour ton application mobile de recommandation de voyage. Toutes les données sont stockées sur le téléphone, pas besoin d'Internet pour consulter les infos !

## 📂 Organisation des fichiers

```
backend/
├── database/          # 🗄️  Base de données
│   ├── connection.js  # Connexion SQLite
│   └── schema.js      # Tables et structure
│
├── repositories/      # 📊 Accès aux données
│   ├── CityRepository.js      # Gestion des villes
│   ├── PlaceRepository.js     # Gestion des lieux
│   ├── CategoryRepository.js  # Gestion des catégories
│   └── UserRepository.js      # Profils utilisateurs
│
├── services/          # 🎯 Recommandations
│   └── RecommendationService.js
│
├── algorithms/        # 🧮 Calculs de similarité
│   ├── vectorUtils.js
│   └── similarity.js
│
├── data/             # 💾 Base de données
│   └── travel.db     # Toutes les données (après migration)
│
└── scripts/          # 🔧 Migration PostgreSQL → SQLite
    └── migratePostgresToSqlite.js
```

## 📊 Données disponibles

Une fois la migration faite, tu as :

- **20 pays** (France, UK, USA...)
- **200 villes** avec coordonnées GPS
- **321 catégories** (Restaurants, Musées, Parcs...)
- **11,624 lieux touristiques**
- **51,231 liens** entre lieux et catégories

## 🚀 Démarrage rapide

### 1. Migrer les données (une seule fois)

```bash
cd frontend/src/backend/scripts
node migratePostgresToSqlite.js
```

Ça crée le fichier `travel.db` avec toutes tes données.

### 2. Utiliser dans l'app

```javascript
import { initializeDatabase } from "./backend/database/schema";
import CityRepository from "./backend/repositories/CityRepository";

// Démarrer la base
await initializeDatabase();

// Récupérer les villes
const cities = await CityRepository.getAllCities();
console.log(`J'ai ${cities.length} villes`);
```

## 💡 Exemples d'utilisation

### Afficher les villes

```javascript
import CityRepository from "./backend/repositories/CityRepository";

// Toutes les villes
const villes = await CityRepository.getAllCities();

// Chercher Paris
const paris = await CityRepository.searchCitiesByName("Paris");

// Villes d'un pays
const villesFrance = await CityRepository.getCitiesByCountry(1);
```

### Afficher les lieux d'une ville

```javascript
import PlaceRepository from "./backend/repositories/PlaceRepository";

// Tous les lieux de Paris
const lieux = await PlaceRepository.getPlacesByCity(1);

// Lieux avec leurs catégories
const lieuxDetailles = await PlaceRepository.getPlacesWithCategories(1);

// Seulement les musées
const musees = await PlaceRepository.getPlacesByCategory("Museums");
```

### Obtenir des recommandations

```javascript
import RecommendationService from "./backend/services/RecommendationService";

// Villes similaires à Paris
const suggestions = await RecommendationService.recommendSimilarCities({
  cityId: 1, // Paris
  limit: 5, // Top 5
  minSimilarity: 0.7,
});

// Résultat :
// [
//   { name: 'London', similarity: 0.92 },
//   { name: 'Berlin', similarity: 0.88 },
//   ...
// ]
```

## 📚 Fonctions disponibles

### 🏙️ CityRepository

```javascript
getAllCities(); // Toutes les villes
getCityById(id); // Une ville précise
searchCitiesByName("Paris"); // Chercher par nom
getCitiesByCountry(countryId); // Villes d'un pays
getCityWithEmbedding(id); // Avec données de similarité
```

### 📍 PlaceRepository

```javascript
getPlacesByCity(cityId); // Lieux d'une ville
getPlacesWithCategories(cityId); // Avec leurs catégories
getPlacesByCategory("Museums"); // Par type de lieu
searchPlacesByName("Tour Eiffel"); // Chercher un lieu
```

### 🏷️ CategoryRepository

```javascript
getRootCategories(); // Catégories principales
getChildCategories(parentId); // Sous-catégories
getCategoryTree(); // Arbre complet
searchCategories("restaurant"); // Chercher une catégorie
```

### 👤 UserRepository

```javascript
getAllUsers(); // Tous les utilisateurs
createUser({ name, email }); // Créer un profil
getUserInterests(userId); // Préférences utilisateur
addUserInterest(userId, categoryId); // Ajouter un intérêt
```

### 🎯 RecommendationService

```javascript
// Villes similaires
recommendSimilarCities({
  cityId: 1,
  limit: 10,
  minSimilarity: 0.5,
});

// Calcul de similarité entre 2 villes
calculateCitySimilarity(cityId1, cityId2);
```

## 🔧 Configuration de la migration

Si besoin de refaire la migration, crée un fichier `.env` :

```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=test_dump
PG_USER=postgres
PG_PASSWORD=ton_mot_de_passe
```

## ⚠️ Points importants

### Deux bases différentes

- **Sur ton Mac** : `travel.db` avec toutes les données (migration)
- **Sur ton iPhone** : Base vide au début (se remplit avec l'app)

C'est normal ! Le fichier Mac ne se copie pas automatiquement sur le téléphone.

### Première utilisation sur mobile

L'app insère automatiquement 3 villes de test au premier lancement :

- Paris
- London
- New York

Pour charger toutes les données, il faudra créer un système d'import (à venir).

## 🐛 Problèmes courants

### "La base est vide"

C'est normal sur mobile au premier lancement. L'app ajoute des données de test automatiquement.

### "UNIQUE constraint failed"

Le fichier `travel.db` existe déjà. Pour recommencer :

```bash
rm frontend/src/backend/data/travel.db
node migratePostgresToSqlite.js
```

### "Module not found: expo-sqlite"

Installe la dépendance :

```bash
cd frontend
npm install expo-sqlite
```

## 📝 Prochaines étapes

- ✅ Migration PostgreSQL → SQLite : **Fait**
- ✅ Code backend complet : **Fait**
- ✅ Test avec données de démo : **Fait**
- ⏳ Import complet sur mobile : **À faire**
- ⏳ Interface utilisateur : **À faire**

## 💡 Exemple complet

```javascript
import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { initializeDatabase } from "./backend/database/schema";
import CityRepository from "./backend/repositories/CityRepository";

export default function ListeVilles() {
  const [villes, setVilles] = useState([]);

  useEffect(() => {
    chargerVilles();
  }, []);

  const chargerVilles = async () => {
    // 1. Démarrer la base
    await initializeDatabase();

    // 2. Charger les villes
    const data = await CityRepository.getAllCities();
    setVilles(data);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        {villes.length} villes disponibles
      </Text>

      <FlatList
        data={villes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: "gray" }}>
              {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
```

---

🎉 **Tout est prêt ! Tu peux maintenant utiliser la base de données dans ton app.**

## 🏗️ Architecture

```
backend/
├── database/           # Gestion de la base de données
│   ├── connection.js   # Connexion SQLite avec expo-sqlite
│   └── schema.js       # Schéma et initialisation des tables
├── repositories/       # Accès aux données
│   ├── CityRepository.js
│   ├── PlaceRepository.js
│   ├── CategoryRepository.js
│   └── UserRepository.js
├── services/          # Logique métier
│   └── RecommendationService.js
├── algorithms/        # Calculs vectoriels
│   ├── vectorUtils.js
│   └── similarity.js
├── data/             # Données embarquées
│   └── travel.db     # Base SQLite (générée après migration)
└── scripts/          # Scripts utilitaires
    └── migratePostgresToSqlite.js
```

## 📊 Structure de la base de données

### Tables

1. **countries** (20 pays)

   - id, name

2. **cities** (200 villes)

   - id, name, lat, lon, country_id, embedding (BLOB)

3. **categories** (321 catégories)

   - id, name, parent_id (hiérarchie)

4. **places** (11,624 lieux)

   - id, name, lat, lon, city_id

5. **place_categories** (51,231 relations)

   - place_id, category_id

6. **user_profiles**
   - id, preferences_vector (BLOB), created_at, updated_at

## 🚀 Installation

### 1. Installer les dépendances pour la migration (Node.js)

```bash
cd frontend/src/backend/scripts
npm install pg better-sqlite3
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans le dossier scripts :

```env
POSTGRES_PASSWORD=votre_mot_de_passe
```

### 3. Exécuter la migration PostgreSQL → SQLite

```bash
node migratePostgresToSqlite.js
```

Cela va créer le fichier `frontend/src/backend/data/travel.db` avec toutes les données.

### 4. Installer les dépendances React Native

Dans votre projet React Native :

```bash
npm install expo-sqlite
# ou
yarn add expo-sqlite
```

## 💡 Utilisation

### Initialiser la base de données

```javascript
import { initializeDatabase } from "./backend/database/schema";

// Au démarrage de l'app
await initializeDatabase();
```

### Utiliser les repositories

```javascript
import CityRepository from "./backend/repositories/CityRepository";
import PlaceRepository from "./backend/repositories/PlaceRepository";

// Récupérer toutes les villes
const cities = await CityRepository.getAllCities();

// Rechercher des villes par nom
const results = await CityRepository.searchCitiesByName("Paris");

// Récupérer les lieux d'une ville avec leurs catégories
const places = await PlaceRepository.getPlacesWithCategories(cityId);
```

### Utiliser le service de recommandation

```javascript
import RecommendationService from "./backend/services/RecommendationService";

// Recommander des villes similaires
const similarCities = await RecommendationService.recommendSimilarCities(
  cityId,
  10, // top 10
  {
    diversify: true,
    minSimilarityThreshold: 0.5,
  }
);

// Recommander des villes basées sur le profil utilisateur
const recommendations = await RecommendationService.recommendCitiesForUser(
  userId,
  10,
  {
    diversify: true,
    excludeCityIds: [1, 2, 3], // Villes déjà visitées
  }
);

// Mettre à jour les préférences utilisateur
await RecommendationService.updateUserPreferencesFromHistory(
  userId,
  [1, 5, 10], // Villes aimées
  [2, 8] // Villes non aimées
);
```

### Calculs de similarité

```javascript
import {
  cosineSimilarity,
  euclideanDistance,
} from "./backend/algorithms/similarity";

// Calculer la similarité entre deux vecteurs
const similarity = cosineSimilarity(vector1, vector2);

// Calculer la distance euclidienne
const distance = euclideanDistance(vector1, vector2);
```

## 🔧 API des Repositories

### CityRepository

- `getAllCities()` - Récupère toutes les villes
- `getCityById(id)` - Récupère une ville par ID
- `getCityWithEmbedding(id)` - Récupère une ville avec son embedding
- `getCitiesByCountry(countryId)` - Filtre par pays
- `searchCitiesByName(term)` - Recherche par nom
- `getAllCitiesWithEmbeddings()` - Pour les calculs de similarité

### PlaceRepository

- `getAllPlaces()` - Récupère tous les lieux
- `getPlaceById(id)` - Récupère un lieu par ID
- `getPlacesByCity(cityId)` - Filtre par ville
- `getPlacesWithCategories(cityId)` - Avec catégories
- `getPlacesByCategory(categoryId)` - Filtre par catégorie
- `searchPlacesByName(term, cityId)` - Recherche par nom

### CategoryRepository

- `getAllCategories()` - Récupère toutes les catégories
- `getCategoryById(id)` - Récupère une catégorie par ID
- `getRootCategories()` - Catégories racines (sans parent)
- `getSubCategories(parentId)` - Sous-catégories
- `getCategoryTree()` - Arbre hiérarchique complet
- `searchCategoriesByName(term)` - Recherche par nom
- `getCategoriesByPlace(placeId)` - Catégories d'un lieu

### UserRepository

- `getAllProfiles()` - Récupère tous les profils
- `getProfileById(userId)` - Récupère un profil par ID
- `createProfile(preferencesVector)` - Crée un nouveau profil
- `updatePreferences(userId, vector)` - Met à jour les préférences
- `getLatestProfile()` - Profil le plus récent

## 🎯 Fonctionnalités du RecommendationService

1. **Recommandations basées sur le profil utilisateur**

   - Utilise le vecteur de préférences
   - Calcul de similarité cosinus
   - Option de diversification des résultats

2. **Recommandations de villes similaires**

   - Basé sur les embeddings des villes
   - Ajustement du seuil de similarité

3. **Mise à jour des préférences**

   - Apprentissage depuis l'historique (villes aimées/non aimées)
   - Calcul automatique du vecteur de préférences

4. **Calcul de similarité entre villes**
   - Mesure directe de la similarité

## 📝 Notes techniques

### Embeddings

Les embeddings sont stockés sous forme de BLOB dans SQLite :

- Format : Float64Array (8 bytes par valeur)
- Conversion automatique : BLOB ↔ Array
- Normalisation avant calcul de similarité

### Performance

- Les requêtes utilisent des index sur les colonnes critiques
- Les transactions sont utilisées pour les opérations batch
- Les embeddings sont chargés uniquement quand nécessaire

### Compatibilité

- **React Native** : Utilise `expo-sqlite`
- **Migration Node.js** : Utilise `better-sqlite3`
- Les deux sont compatibles avec le même fichier SQLite

## 🔒 Sécurité

- Base de données locale (pas d'exposition réseau)
- Pas de données sensibles utilisateur stockées
- Embeddings pré-calculés (pas de calcul ML côté client)

adb shell
run-as com.aariisto.ExploreUs
rm /data/data/com.aariisto.ExploreUs/files/SQLite/travel.db
