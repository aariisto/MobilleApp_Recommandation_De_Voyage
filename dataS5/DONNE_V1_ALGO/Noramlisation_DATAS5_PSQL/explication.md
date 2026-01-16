# Documentation de la Base de Données - Cities & POIs\*

## 📋 Vue d'ensemble

Cette base de données PostgreSQL a été conçue pour stocker et organiser des informations géographiques sur les villes européennes et leurs points d'intérêt (POIs - Points of Interest). Elle permet de gérer les relations entre les pays, les villes, les lieux touristiques et leurs catégories.

## 🏗️ Architecture de la Base de Données

### Schéma des Tables

```
┌─────────────────┐
│   countries     │
│─────────────────│
│ id (PK)         │
│ name            │
└────────┬────────┘
         │
         │ 1
         │
         │ N
┌────────┴────────┐
│     cities      │
│─────────────────│
│ id (PK)         │
│ name            │
│ lat             │
│ lon             │
│ country_id (FK) │
└────────┬────────┘
         │
         │ 1
         │
         │ N
┌────────┴────────┐         ┌─────────────────┐
│     places      │    N:N  │   categories    │
│─────────────────│◄────────┤─────────────────│
│ id (PK)         │         │ id (PK)         │
│ name            │         │ name            │
│ lat             │         │ parent_id (FK)  │◄─┐
│ lon             │         └─────────────────┘  │
│ city_id (FK)    │                              │
└─────────────────┘                              │
         ▲                                       │
         │                                       │
         │                                  Auto-référence
         │                                  (hiérarchie)
         │
┌────────┴──────────────┐
│  place_categories     │
│───────────────────────│
│ place_id (PK, FK)     │
│ category_id (PK, FK)  │
└───────────────────────┘
```

## 📊 Description des Tables

### 1. **countries** - Pays

Stocke les pays uniques présents dans le système.

| Colonne | Type         | Description                       |
| ------- | ------------ | --------------------------------- |
| `id`    | SERIAL       | Identifiant unique (clé primaire) |
| `name`  | VARCHAR(100) | Nom du pays (UNIQUE)              |

**Exemples de données :**

- France
- Spain
- Italy
- Germany
- United Kingdom

**Relation :**

- Un pays peut avoir plusieurs villes (1:N)

---

### 2. **cities** - Villes

Contient les villes avec leurs coordonnées géographiques.

| Colonne      | Type             | Description                            |
| ------------ | ---------------- | -------------------------------------- |
| `id`         | SERIAL           | Identifiant unique (clé primaire)      |
| `name`       | VARCHAR(100)     | Nom de la ville                        |
| `lat`        | DOUBLE PRECISION | Latitude (coordonnée GPS)              |
| `lon`        | DOUBLE PRECISION | Longitude (coordonnée GPS)             |
| `country_id` | INT              | Référence vers le pays (clé étrangère) |

**Exemples de données :**

- Paris (France) - lat: 48.8534951, lon: 2.3483915
- Madrid (Spain) - lat: 40.4167047, lon: -3.7035825
- Rome (Italy) - lat: 41.8933203, lon: 12.4829321

**Relations :**

- Appartient à un pays (N:1)
- Peut avoir plusieurs POIs/places (1:N)

**Contraintes :**

- `ON DELETE CASCADE` : Si un pays est supprimé, toutes ses villes sont également supprimées

---

### 3. **categories** - Catégories

Système de catégorisation hiérarchique pour classer les POIs.

| Colonne     | Type         | Description                                                  |
| ----------- | ------------ | ------------------------------------------------------------ |
| `id`        | SERIAL       | Identifiant unique (clé primaire)                            |
| `name`      | VARCHAR(100) | Nom de la catégorie (UNIQUE)                                 |
| `parent_id` | INT          | Référence vers la catégorie parent (clé étrangère, nullable) |

**Hiérarchie des catégories :**

```
catering (parent_id: NULL)
├── catering.restaurant (parent_id: ID de "catering")
│   ├── catering.restaurant.french (parent_id: ID de "catering.restaurant")
│   ├── catering.restaurant.italian (parent_id: ID de "catering.restaurant")
│   └── catering.restaurant.chinese (parent_id: ID de "catering.restaurant")
├── catering.cafe (parent_id: ID de "catering")
│   ├── catering.cafe.coffee (parent_id: ID de "catering.cafe")
│   └── catering.cafe.tea (parent_id: ID de "catering.cafe")
└── catering.bar (parent_id: ID de "catering")
```

**Relations :**

- Auto-référence : Une catégorie peut avoir une catégorie parent (hiérarchie)
- Peut être associée à plusieurs POIs via `place_categories` (N:N)

**Contraintes :**

- `ON DELETE SET NULL` : Si une catégorie parent est supprimée, `parent_id` devient NULL pour ses enfants

---

### 4. **places** - Points d'Intérêt (POIs)

Stocke tous les lieux d'intérêt avec leurs coordonnées.

| Colonne   | Type             | Description                             |
| --------- | ---------------- | --------------------------------------- |
| `id`      | SERIAL           | Identifiant unique (clé primaire)       |
| `name`    | VARCHAR(150)     | Nom du lieu                             |
| `lat`     | DOUBLE PRECISION | Latitude (coordonnée GPS)               |
| `lon`     | DOUBLE PRECISION | Longitude (coordonnée GPS)              |
| `city_id` | INT              | Référence vers la ville (clé étrangère) |

**Exemples de données :**

- Fondation Cartier pour l'art contemporain (Paris)
- Sainte-Chapelle (Paris)
- Sagrada Familia (Barcelona)
- Colosseum (Rome)

**Relations :**

- Appartient à une ville (N:1)
- Peut avoir plusieurs catégories via `place_categories` (N:N)

**Contraintes :**

- `ON DELETE CASCADE` : Si une ville est supprimée, tous ses POIs sont également supprimés

---

### 5. **place_categories** - Table de Liaison

Table d'association many-to-many entre les places et les catégories.

| Colonne       | Type | Description                                  |
| ------------- | ---- | -------------------------------------------- |
| `place_id`    | INT  | Référence vers un POI (clé étrangère)        |
| `category_id` | INT  | Référence vers une catégorie (clé étrangère) |

**Clé primaire composite :** (`place_id`, `category_id`)

**Exemple :**

```
Place: "Fondation Cartier pour l'art contemporain"
├── entertainment
├── entertainment.museum
├── fee
├── wheelchair
└── wheelchair.yes
```

**Contraintes :**

- `ON DELETE CASCADE` : Si un POI ou une catégorie est supprimé, les associations sont automatiquement supprimées

---

## 🔍 Index pour les Performances

Pour optimiser les requêtes, plusieurs index ont été créés :

| Index                | Table            | Colonne     | Utilité                                 |
| -------------------- | ---------------- | ----------- | --------------------------------------- |
| `idx_city_id`        | places           | city_id     | Recherche rapide des POIs par ville     |
| `idx_place_category` | place_categories | category_id | Recherche rapide des POIs par catégorie |
| `idx_category_name`  | categories       | name        | Recherche rapide de catégories par nom  |

---

## 📁 Structure des Fichiers

```
Traitement_donnee/
├── Cities_BD.sql              # Script SQL de création des tables
├── cities_geocoded_all.json   # Données des villes et POIs
├── categories.json            # Liste hiérarchique des catégories
├── test.py                    # Script Python d'insertion des données
└── README.md                  # Cette documentation
```

---

## 🚀 Utilisation du Script d'Insertion

Le script `test.py` permet d'insérer automatiquement toutes les données dans PostgreSQL.

### Prérequis

```bash
pip install psycopg2-binary
```

### Configuration

Modifiez les paramètres de connexion dans `test.py` :

```python
db_config = {
    'host': 'localhost',
    'database': 'cities',
    'user': 'postgres',
    'password': 'postgres',
    'port': '5432'
}
```

### Exécution

```bash
python test.py
```

### Ordre d'insertion

Le script respecte l'ordre des dépendances :

1. **Pays** (`countries`) - Données de base
2. **Villes** (`cities`) - Nécessite les pays
3. **Catégories** (`categories`) - Hiérarchie indépendante
4. **POIs** (`places`) - Nécessite les villes
5. **Associations** (`place_categories`) - Nécessite les places et catégories

---

## 📈 Statistiques de Données

Après insertion complète :

- **Pays** : ~15 pays européens
- **Villes** : ~100 villes majeures
- **Catégories** : 324 catégories hiérarchiques
- **POIs** : ~11,000+ points d'intérêt
- **Associations** : Plusieurs milliers de relations place-catégorie

---

## 🔗 Exemples de Requêtes Utiles

### 1. Lister tous les POIs d'une ville

```sql
SELECT p.name, p.lat, p.lon
FROM places p
JOIN cities c ON p.city_id = c.id
WHERE c.name = 'Paris';
```

### 2. Trouver tous les restaurants français à Paris

```sql
SELECT DISTINCT p.name, p.lat, p.lon
FROM places p
JOIN cities c ON p.city_id = c.id
JOIN place_categories pc ON p.id = pc.place_id
JOIN categories cat ON pc.category_id = cat.id
WHERE c.name = 'Paris'
  AND cat.name = 'catering.restaurant.french';
```

### 3. Compter les POIs par pays

```sql
SELECT co.name AS country, COUNT(p.id) AS nb_pois
FROM countries co
JOIN cities ci ON co.id = ci.country_id
JOIN places p ON ci.id = p.city_id
GROUP BY co.name
ORDER BY nb_pois DESC;
```

### 4. Obtenir la hiérarchie complète d'une catégorie

```sql
WITH RECURSIVE category_hierarchy AS (
  SELECT id, name, parent_id, 0 AS level
  FROM categories
  WHERE name = 'catering.restaurant.french'

  UNION ALL

  SELECT c.id, c.name, c.parent_id, ch.level + 1
  FROM categories c
  JOIN category_hierarchy ch ON c.id = ch.parent_id
)
SELECT name, level FROM category_hierarchy
ORDER BY level DESC;
```

### 5. Trouver les POIs ayant plusieurs catégories

```sql
SELECT p.name, COUNT(pc.category_id) AS nb_categories
FROM places p
JOIN place_categories pc ON p.id = pc.place_id
GROUP BY p.id, p.name
HAVING COUNT(pc.category_id) > 1
ORDER BY nb_categories DESC;
```

### 6. Lister les nom de ville + pays + nom des PIO pour restaurant halal + vegetarien

```sql

SELECT
    ci.name AS city_name,
    co.name AS country_name,
    p.name AS place_name,
    STRING_AGG(c.name, ', ') AS categories
FROM places p
JOIN cities ci ON p.city_id = ci.id
JOIN countries co ON ci.country_id = co.id
JOIN place_categories pc ON pc.place_id = p.id
JOIN categories c ON c.id = pc.category_id
WHERE c.name LIKE 'halal%' OR c.name LIKE 'vegetarian%'
GROUP BY ci.id, ci.name, co.id, co.name, p.id, p.name
HAVING COUNT(DISTINCT CASE
                        WHEN c.name LIKE 'halal%' THEN 'halal'
                        WHEN c.name LIKE 'vegetarian%' THEN 'vegetarian'
                      END) = 2
ORDER BY ci.name, p.name;

```

## ⚠️ Notes Importantes

1. **Intégrité référentielle** : Toutes les clés étrangères sont protégées avec des contraintes
2. **Cascade DELETE** : La suppression d'un pays supprime automatiquement ses villes, puis ses POIs
3. **Unicité** : Les noms de pays et catégories sont uniques
4. **Géolocalisation** : Toutes les coordonnées sont en format WGS84 (latitude/longitude)
5. **Hiérarchie** : Les catégories utilisent un système de points (`.`) pour indiquer la profondeur

---

## 📝 Maintenance

### Sauvegarder la base de données

```bash
pg_dump -U postgres cities > backup_cities.sql
```

### Restaurer la base de données

```bash
psql -U postgres cities < backup_cities.sql
```

### Vérifier l'intégrité

```sql
-- Vérifier les orphelins
SELECT COUNT(*) FROM cities WHERE country_id NOT IN (SELECT id FROM countries);
SELECT COUNT(*) FROM places WHERE city_id NOT IN (SELECT id FROM cities);
```

---

## 👨‍💻 Auteur

Projet développé dans le cadre d'une SAE (Situation d'Apprentissage et d'Évaluation) - BUT 3

# Restaurer la base chez vous

Sur votre machine :

Créer une base vide (nom à son choix) :

powershell / bash:

createdb -U votre_user -h localhost nouvelle_db

Restaurer le dump :

pg_restore -U votre_user -h localhost -d nouvelle_db -v full_backup.dump

Après ça, vous aurez exactement la même base que moi, avec toutes les tables et données.
