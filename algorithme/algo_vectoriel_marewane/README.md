🧭 Projet SAE 5 — Moteur de Recommandation Touristique

Algorithme vectoriel optimisé + version JavaScript embarquable (React Native)

Ce projet propose un moteur de recommandation pour destinations touristiques, basé sur les Points d’Intérêts (POI) issus d’OpenStreetMap, enrichis, nettoyés puis vectorisés.
L’objectif : fournir aux utilisateurs de l’application mobile un système rapide, léger et cohérent, utilisable hors-ligne et sur smartphone.

📂 1. Architecture du projet

algo/
│
├── data/                     → Données nettoyées et enrichies
│   ├── cities_cleaned_geo.json
│   ├── cities_enriched.json
│   └── cities_geocoded_pois.json
│
├── python/
│   ├── preprocessing/        → Scripts de préparation du dataset
│   │   ├── clean_seed.py
│   │   ├── fix_tags_geographically.py
│   │   ├── apply_city_tags.py
│   │   └── generate_city_types.py
│   ├── analysis/             → Analyses et statistiques
│   │   └── analyze_seed.py
│   └── engine/               → Moteur vectoriel Python (référence)
│       └── reco_engine.py
│
├── js/                       → Version JavaScript/React Native
│   ├── recoEngine/
│   │   ├── loadSeed.js
│   │   ├── tags.js
│   │   └── recoEngine.js
│   ├── tests/
│   │   ├── test_load.js
│   │   └── test_tags.js
│   └── package.json
│
└── notebooks/
    ├── prototype_vectoriel.ipynb
    └── prototype_vectoriel_v2.ipynb

🧹 2. Préprocessing des données

Les données brutes OpenStreetMap ne sont pas directement exploitables pour un moteur de recommandation.

Pipeline :

Nettoyage OSM brut

suppression des POI incomplets

uniformisation des tags

suppression du bruit

Enrichissement géographique

ajout de tags ville : plage, montagne, culture, gastronomie

classification automatique selon la géolocalisation

Correction manuelle par règles

détection de fausses plages / faux sommets
(ex: “Berlin → beach” supprimé)

Vectorisation possible dans Python et JavaScript

Résultat :
✔️ dataset propre
✔️ cohérent
✔️ lisible
✔️ léger (quelques Mo)

🧠 3. Moteur de recommandation

Le moteur repose sur un espace vectoriel de 26 dimensions représentant :

🏛 Culture

🌳 Nature

🥾 Activités

🍽 Nourriture

🛍 Shopping

♿ Confort

🌡 Climat

Chaque POI et chaque ville obtient un vecteur normalisé.
Recommandation = combinaison entre :

similarité POI (détails fins)

similarité ville (contexte global)

score = 0.7 * sim_poi + 0.3 * sim_city

Puis agrégation par ville :

max score

moyenne top 3

diversité des tags

score final ville

⚙️ 4. Utilisation du moteur (Python)

cd python/engine
python reco_engine.py

Vous verrez :

temps de calcul

top destinations pour plusieurs profils (plage, culture, etc.)

📱 5. Utilisation du moteur (JavaScript / React Native)

La version JS est strictement équivalente à la version Python.

Exemple :

import { loadSeed } from "./recoEngine/loadSeed.js";
import { buildMatrix, recommend, aggregateByCity } from "./recoEngine/recoEngine.js";
import { vectorizeTags } from "./recoEngine/tags.js";

const seed = loadSeed("../data/cities_cleaned_geo.json");
const { X_poi, X_city, meta } = buildMatrix(seed);

const userVec = vectorizeTags(["beach", "restaurant"]);
const recos = recommend(userVec, X_poi, X_city, meta, 300);
const cities = aggregateByCity(recos);

console.log(cities.slice(0, 5));

import { loadSeed } from "./recoEngine/loadSeed.js";
import { buildMatrix, recommend, aggregateByCity } from "./recoEngine/recoEngine.js";
import { vectorizeTags } from "./recoEngine/tags.js";

const seed = loadSeed("../data/cities_cleaned_geo.json");
const { X_poi, X_city, meta } = buildMatrix(seed);

const userVec = vectorizeTags(["beach", "restaurant"]);
const recos = recommend(userVec, X_poi, X_city, meta, 300);
const cities = aggregateByCity(recos);

console.log(cities.slice(0, 5));

🧪 6. Tests

Dans le dossier js/tests/ :

node test_load.js
node test_tags.js

🚀 7. Performances

Vectorisation ultra légère (26 dimensions)

Tout tient en mémoire mobile

Recommandation < 3 ms

Compatible offline

Pas besoin d'API externe → idéal pour Expo

🤖 8. Comparaison future (Phase B)

👉 La suite du projet consiste à comparer :

✓ Moteur vectoriel (actuel)

ultra léger (< 1 Mo)

instantané

parfait mobile

✓ Moteur LLM / embeddings

modèle ~30 Mo (MiniLM)

embeddings contextualisés

plus qualitatif mais plus lourd

Objectif final : afficher un benchmark clair et choisir le meilleur système pour l'app.

🙌 9. Auteurs

Projet réalisé par :

Marewane B. – Algo, nettoyage data, implémentation Python/JS

…

⭐ 10. Licence

MIT — libre utilisation.