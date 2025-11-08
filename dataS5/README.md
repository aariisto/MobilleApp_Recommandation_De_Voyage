# Collecte de données

## Processus de Traitement des Données(Dalla)

### 1. Collecte Initiale des Données
Dans un premier temps, j'ai récupéré le top des pays ainsi que leurs villes principales dans le monde. Ces données ont été sauvegardées dans le fichier `world_top_cities.csv`.

### 2. Géocodage des Villes
J'ai créé le script Python `geocode_cities.py` qui :
- Parcourt le fichier `world_top_cities.csv`
- Utilise l'API Geoapify pour chaque ville
- Récupère les coordonnées (longitude, latitude)
- Récupère les points d'intérêt (POI) contenus dans chaque ville

### 3. Optimisation du Traitement
Étant donné que l'exécution était longue, j'ai séparé le fichier `world_top_cities.csv` en deux parties :
- `world_top_cities.csv` : fichier complet
- `world_top_cities_part2.csv` : deuxième moitié du fichier

Cette séparation a permis de traiter les données en parallèle ou par étapes.

### 4. Résultats de Géocodage
Le script `geocode_cities.py` a généré plusieurs fichiers JSON :
- `cities_geocoded.json` : première partie avec les positions (lon, lat)
- `cities_geocoded_pois.json` : première partie avec les positions et les POI
- `cities_geocoded_poi_part2.json` : deuxième partie avec les positions et les POI

### 5. Fusion des Données
J'ai créé le script `merge_cities.py` pour fusionner les deux fichiers JSON correspondant aux deux parties du fichier `world_top_cities.csv`.

Résultat : `cities_geocoded_all.json`

### 6. Extraction des Catégories
Enfin, j'ai développé le script `extract_categories.py` pour extraire toutes les catégories de lieux présentes dans les données géocodées.

Résultat : `categories.json`
