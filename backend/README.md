# Travel Recommendation API

API backend Flask simple et efficace pour application mobile de recommandation voyage **anonyme**.

## 🌍 Fonctionnalités

- **Application anonyme** - Aucune authentification requise
- **API Photos Unsplash** - Photos de destinations intégrées
- **Architecture simple** - Un seul fichier `run.py`
- **CORS activé** - Support des applications mobiles
- **Images directes** - Endpoints JPEG pour les photos
- **Léger et rapide** - Dépendances minimales

## 📁 Structure du projet (Architecture Flask classique)

```
SAE_Backend/
├── app/                      # 🏗️ Application principale
│   ├── __init__.py          # Factory pattern Flask
│   ├── api/                 # Blueprints API
│   │   ├── main/           # Routes système (health, info)
│   │   └── travel/         # Routes voyage (photos, destinations)
│   ├── services/           # Services métier
│   │   └── unsplash_service.py # Intégration Unsplash API
│   └── utils/              # Utilitaires
│       ├── responses.py    # Réponses standardisées
│       └── validators.py   # Validation des données
├── config/                  # Configuration
│   └── config.py           # Classes de configuration
├── tests/                   # Tests unitaires
├── venv/                    # Environnement virtuel Python
├── run.py                   # ⭐ Point d'entrée principal
├── requirements.txt         # Dépendances minimales
├── deploy.py                # Script de déploiement
├── Dockerfile               # Configuration Docker
├── docker-compose.yml       # Services Docker
├── .env                     # Variables d'environnement
├── .env.example            # Template des variables
└── README.md               # Documentation
```

## 🛠 Installation et Démarrage

### Prérequis
- Python 3.8+
- Clé API Unsplash (gratuite)

### Installation

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd SAE_Backend
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configurer l'environnement**
```bash
cp .env.example .env
# Ajouter votre clé Unsplash dans .env :
# UNSPLASH_ACCESS_KEY=votre_cle_access_unsplash
```

5. **Démarrer l'application**
```bash
python run.py
```

L'API sera disponible à `http://127.0.0.1:5000`

### Test rapide
```bash
# Vérifier le statut de l'API
curl http://127.0.0.1:5000/api/health

# Destinations populaires
curl http://127.0.0.1:5000/api/travel/destinations/popular

# Photo voyage aléatoire (métadonnées JSON)
curl http://127.0.0.1:5000/api/travel/photos/random?type=beach

# Image JPEG directe
curl http://127.0.0.1:5000/api/travel/photos/image/random?type=mountain&size=regular

# Recherche d'images
curl http://127.0.0.1:5000/api/travel/photos/search?q=paris&page=1
```

### Avec Docker

```bash
# Construction et démarrage
docker-compose up --build

# En arrière-plan
docker-compose up -d
```

## 📚 API Endpoints

### 🏥 Système
- `GET /api/health` - Vérification de santé de l'API
- `GET /api/info` - Informations sur l'API

### 📸 Photos voyage (Métadonnées JSON)
- `GET /api/travel/photos/random?type=beach` - Photo aléatoire avec métadonnées
- `GET /api/travel/photos/search?q=paris&page=1` - Recherche de photos

### 🖼️ Images directes (Format JPEG)
- `GET /api/travel/photos/image/random?type=mountain&size=regular` - Image JPEG aléatoire
- `GET /api/travel/photos/image/search?q=tokyo&index=0&size=small` - Image d'une recherche

### 🌍 Destinations & Recommandations
- `GET /api/travel/destinations/popular?limit=8` - Destinations populaires
- `GET /api/travel/categories` - Catégories de voyage disponibles  
- `GET /api/travel/recommendations?category=nature&season=summer&budget=medium` - Recommandations

### 📋 Paramètres disponibles
- **type** : Type de destination (beach, mountain, city, nature, architecture...)
- **q** : Terme de recherche libre (paris, tokyo, etc.)
- **size** : Taille image (thumb, small, regular, full)
- **page** : Numéro de page (pagination)
- **index** : Index de l'image dans les résultats (0, 1, 2...)
## 🔓 Accès anonyme

**Aucune authentification requise !** Tous les endpoints sont publics et accessibles directement :

```bash
# Exemples d'utilisation
curl http://localhost:5000/api/travel/photos/random?type=paris
curl http://localhost:5000/api/travel/photos/image/random?type=beach&size=thumb
curl http://localhost:5000/api/travel/destinations/popular
curl http://localhost:5000/api/travel/recommendations?category=nature
```

## � Configuration

Variables d'environnement nécessaires :

```env
# Clé API Unsplash (obligatoire)
UNSPLASH_ACCESS_KEY=votre_cle_access_unsplash

# Configuration serveur (optionnel)
SECRET_KEY=travel-secret-key
HOST=127.0.0.1
PORT=5000
FLASK_DEBUG=True

# Pagination (optionnel)
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=30
```

## 🏗️ Architecture technique

### Blueprints Flask
- **`main`** : Routes système (health, info)
- **`travel`** : Routes voyage (photos, destinations, recommandations)

### Services
- **`UnsplashService`** : Intégration API Unsplash
- **Factory Pattern** : Configuration modulaire

### Utilitaires
- **`responses.py`** : Réponses JSON standardisées
- **`validators.py`** : Validation des paramètres

## 🚀 Déploiement

### Production avec Gunicorn
```bash
gunicorn --bind 0.0.0.0:5000 --workers 4 run:app
```

### Avec Docker
```bash
docker-compose -f docker-compose.yml up -d
```

## 📝 Exemples d'usage

### Dans une application mobile
```javascript
// Récupérer une photo de plage
fetch('http://localhost:5000/api/travel/photos/random?type=beach')
  .then(response => response.json())
  .then(data => console.log(data.photo.urls));

// Afficher directement une image
<img src="http://localhost:5000/api/travel/photos/image/random?type=mountain&size=small" />
```

### Intégration avec d'autres services
```bash
# Télécharger une image pour traitement
curl -o beach.jpg "http://localhost:5000/api/travel/photos/image/random?type=beach&size=regular"

# Obtenir des recommandations pour un chatbot
curl "http://localhost:5000/api/travel/recommendations?category=relax&budget=medium"
```

### Personnalisation

Pour ajouter de nouveaux endpoints :

1. **Nouveau service** : Créer dans `app/services/`
2. **Nouvelles routes** : Ajouter dans `app/api/travel/`
3. **Nouvelles validations** : Étendre `app/utils/validators.py`
4. **Configuration** : Modifier `config/config.py`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.