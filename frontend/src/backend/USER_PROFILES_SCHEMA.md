# 📋 Documentation - Table `user_profiles`

## 🗄️ Nom de la table
```
user_profiles
```

## 📊 Structure de la table

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Identifiant unique |
| `firstName` | TEXT | NOT NULL | Prénom de l'utilisateur |
| `lastName` | TEXT | NOT NULL | Nom de l'utilisateur |
| `email` | TEXT | UNIQUE NOT NULL | Email de l'utilisateur |
| `dateOfBirth` | TEXT | - | Date de naissance (format: YYYY-MM-DD) |
| `country` | TEXT | - | Pays de l'utilisateur |
| `preferences` | TEXT | - | Préférences (stockées en JSON) |
| `preferences_vector` | BLOB | - | Vecteur des préférences pour l'IA |
| `strengths` | TEXT | - | Points forts / Bonus (stockés en JSON) |
| `weaknesses` | TEXT | - | Points faibles / Malus (stockés en JSON) |
| `weaknesses_vector` | BLOB | - | Vecteur des points faibles pour l'IA |
| `updated` | INTEGER | DEFAULT 0 | Booléen : profil mis à jour ? |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Date de création |

## ⚠️ Note importante : Booléens en SQLite

SQLite **n'a pas de type booléen natif**. On utilise `INTEGER` avec :
- `0` = `false`
- `1` = `true`

**Exemple pour la colonne `updated` :**
```javascript
// Profil non mis à jour
updated: 0  // false

// Profil mis à jour
updated: 1  // true
```



## 📝 Exemple de données

```javascript
{
  id: 1,
  firstName: "Jean",
  lastName: "Lcx",
  email: "jean.lcx@gmail.com",
  dateOfBirth: "1995-05-15",
  country: "France",
  preferences: ["beach", "museum", "restaurant", "hotel"],
  preferences_vector: <BLOB>,  // Vecteur numérique pour l'IA
  strengths: ["beach", "museum"],  // Double-clic
  weaknesses: ["nightclub"],  // Appui long
  weaknesses_vector: <BLOB>,  // Vecteur numérique pour l'IA
  updated: 0,  // false = pas encore mis à jour
  created_at: "2025-11-26 12:00:00"
}
```

## 🔄 Fichiers modifiés

1. **`frontend/src/backend/database/schema.js`**
   - Ajout des colonnes dans `createUserProfilesTable()`

2. **`frontend/src/backend/scripts/migratePostgresToSqlite.js`**
   - Mise à jour du schéma de migration

3. **`frontend/src/backend/repositories/UserRepository.js`**
   - Méthodes CRUD pour `user_profiles`

## Comment relancer l'app : 

### Si c'est la première fois :
```bash
cd frontend
npm install
npx react-native run-android
```

### Si vous avez l'erreur "no column named firstName" :
```bash
# 1. Effacer les données de l'app sur l'émulateur, lancez le et faites : 
adb shell pm clear com.aariisto.ExploreUs

# 2. Relancer l'app
npx react-native run-android
```

### Alternative : Désinstaller complètement l'app
```bash
adb uninstall com.aariisto.ExploreUs
npx react-native run-android
```

## 📂 Emplacement de la base de données

| Emplacement | Chemin |
|-------------|--------|
| **Sur ton ordinateur** (assets) | `frontend/assets/travel.db` |
| **Sur l'émulateur Android** | `/data/data/com.aariisto.ExploreUs/databases/SQLite.db` |

## 🛠️ Commandes utiles

```bash
# Voir la base de données locale
sqlite3 frontend/assets/travel.db
.tables
.schema user_profiles
SELECT * FROM user_profiles;
.quit

# Effacer la BD sur l'émulateur (sans désinstaller l'app)
adb shell pm clear com.aariisto.ExploreUs
```
