# 🏗️ Architecture Backend - Travel Recommendation API

## 📋 Vue d'ensemble

API Flask backend pour une application mobile de recommandation de voyages, utilisant une architecture en couches (layer-based) pour une meilleure maintenabilité.

**Version:** 2.0.0  
**Type:** Architecture layer-based Flask  
**Intégrations:** Amadeus (vols/activités), Unsplash (photos)

---

## 📂 Structure du Projet

```
backend/
├── server.py                    # Point d'entrée de l'application
├── requirements.txt             # Dépendances Python
├── .env.example                 # Template des variables d'environnement
├── README.md                    # Documentation générale
├── ARCHITECTURE.md              # Ce fichier
│
├── app/                         # Package principal de l'application
│   ├── __init__.py              # Application Factory (create_app)
│   ├── config.py                # Configuration (Dev/Prod/Test)
│   ├── extensions.py            # Extensions Flask (CORS)
│   │
│   ├── routes/                  # 🛣️ Couche Routes (Blueprints)
│   │   ├── __init__.py
│   │   ├── main_routes.py       # Routes principales (health, info)
│   │   ├── travel_routes.py     # Routes vols (Amadeus)
│   │   └── photo_routes.py      # Routes photos (Unsplash)
│   │
│   ├── services/                # 🔧 Couche Services (Logique métier)
│   │   ├── amadeus_client.py    # Client Amadeus (auth + API calls)
│   │   ├── amadeus_service.py   # Service métier Amadeus
│   │   ├── google_flights_service.py  # Service Google Flights URL generator
│   │   └── unsplash_service.py  # Service Unsplash
│   │
│   └── utils/                   # 🛠️ Utilitaires
│       ├── responses.py         # Formateurs de réponses JSON
│       └── validators.py        # Validateurs de données
│
└── tests/                       # Tests unitaires
    └── test_amadeus_integration.py
```

---

## 🏛️ Architecture en Couches

### 1. **Couche Routes** (`app/routes/`)

- **Responsabilité:** Gestion des endpoints HTTP, validation des paramètres de requête
- **Pattern:** Flask Blueprints
- **Principe:** Fine-grained routing, séparation par domaine fonctionnel

### 2. **Couche Services** (`app/services/`)

- **Responsabilité:** Logique métier, communication avec APIs externes
- **Pattern:** Service Layer
- **Principe:** Encapsulation de la logique complexe, réutilisabilité

### 3. **Couche Utilitaires** (`app/utils/`)

- **Responsabilité:** Fonctions communes, formateurs, validateurs
- **Pattern:** Helper modules
- **Principe:** DRY (Don't Repeat Yourself)

### 4. **Configuration** (`app/config.py`)

- **Responsabilité:** Gestion des configurations par environnement
- **Pattern:** Configuration classes (Development, Production, Testing)

### 5. **Extensions** (`app/extensions.py`)

- **Responsabilité:** Initialisation des extensions Flask (CORS)
- **Pattern:** Extension initialization pattern

---

## 🔧 Configuration

### Variables d'environnement requises

Créer un fichier `.env` à partir de `.env.example`:

```bash
# Amadeus API (obligatoire)
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
AMADEUS_BASE_URL=https://test.api.amadeus.com  # ou production

# Unsplash API (obligatoire)
UNSPLASH_ACCESS_KEY=your_access_key

# Flask (optionnel)
FLASK_ENV=development  # ou production
FLASK_DEBUG=1          # 0 en production
```

### Environnements disponibles

- **Development:** Debug activé, CORS permissif
- **Production:** Optimisations, sécurité renforcée
- **Testing:** Configuration pour tests unitaires

---

## 🚀 Démarrage

### Installation

```bash
cd backend
pip install -r requirements.txt
```

### Lancement

```bash
# Développement
python server.py

# Le serveur démarre sur http://127.0.0.1:5000
```

### Tests

```bash
pytest tests/
```

---

## 🛣️ Routes API Disponibles

### 📊 Routes Principales (`/api`)

#### 1. Health Check

```http
GET /api/health
```

**Description:** Vérifie l'état de santé de l'API  
**Authentification:** Aucune  
**Réponse:**

```json
{
  "status": "healthy",
  "message": "Travel Recommendation API is running",
  "version": "2.0.0",
  "type": "anonymous_travel_app",
  "architecture": "flask_layer_based"
}
```

---

#### 2. Informations API

```http
GET /api/info
```

**Description:** Informations détaillées sur l'API  
**Authentification:** Aucune  
**Réponse:**

```json
{
  "api_name": "Travel Recommendation API",
  "version": "2.0.0",
  "endpoints": {
    "health": "/api/health",
    "travel_photos": "/api/photos/*",
    "travel_flights": "/api/travel/*"
  },
  "features": [
    "unsplash_integration",
    "amadeus_integration",
    "anonymous_access",
    "mobile_optimized",
    "cors_enabled"
  ]
}
```

---

#### 3. Health Check Amadeus (Debug)

```http
GET /api/health/amadeus
```

**Description:** Vérifie la configuration Amadeus (tokens, credentials)  
**Authentification:** Aucune  
**Réponse:**

```json
{
  "success": true,
  "data": {
    "has_token_env": true,
    "has_client_credentials": true,
    "token_masked": "1a2b...xy9z",
    "token_expires_at": 1700000000
  }
}
```

---

### ✈️ Routes Vols (`/api/travel`)

#### 4. Recherche de Vols

```http
GET /api/travel/flights/search
```

**Description:** Recherche d'offres de vols via Amadeus  
**Authentification:** Aucune

**Paramètres Query (obligatoires):**

- `origin` ou `originLocationCode` (string): Code IATA de l'aéroport de départ (ex: `PAR`)
- `destination` ou `destinationLocationCode` (string): Code IATA de l'aéroport d'arrivée (ex: `MAD`)
- `departureDate` (string): Date de départ au format `YYYY-MM-DD` (ex: `2025-11-20`)

**Paramètres Query (optionnels):**

- `adults` (int): Nombre de passagers adultes (défaut: `1`)
- `max` (int): Nombre maximum de résultats (défaut: `1`)

**Exemple de requête:**

```http
GET /api/travel/flights/search?origin=PAR&destination=MAD&departureDate=2025-11-20&adults=2&max=5
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Flight offers (minimal)",
  "data": {
    "offers": [
      {
        "id": "1",
        "origin": "ORY",
        "destination": "MAD",
        "departure_time": "2025-11-20T10:55:00",
        "price": {
          "currency": "EUR",
          "amount": "202.32"
        },
        "baggage_included_checked_bags": 0,
        "passengers": 2
      }
    ]
  }
}
```

**Réponse (erreur):**

```json
{
  "success": false,
  "error": "Missing required params: origin, destination, departureDate",
  "status": 400
}
```

---

#### 5. Génération de Lien de Recherche Google Flights

```http
GET /api/travel/flights/google-link
```

**Description:** Génère un lien de recherche Google Flights simple basé sur les noms de villes  
**Authentification:** Aucune

**Note:** Cette route génère une URL de recherche simplifiée qui ouvre Google Flights avec une requête de type "Paris to Algiers". Les dates et autres paramètres doivent être saisis directement par l'utilisateur sur Google Flights.

**Paramètres Query (obligatoires):**

- `originCity` (string): Nom de la ville de départ (ex: `Paris`, `New York`)
- `destinationCity` (string): Nom de la ville d'arrivée (ex: `Algiers`, `Tokyo`)

**Exemple de requête:**

```http
GET /api/travel/flights/google-link?originCity=Paris&destinationCity=Algiers
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Google Flights search link generated successfully",
  "data": {
    "url": "https://www.google.com/travel/flights?q=Paris%20to%20Algiers",
    "search_query": {
      "origin_city": "Paris",
      "destination_city": "Algiers"
    }
  }
}
```

**Exemple avec espaces:**

```http
GET /api/travel/flights/google-link?originCity=New York&destinationCity=Los Angeles
```

Réponse :
```json
{
  "success": true,
  "message": "Google Flights search link generated successfully",
  "data": {
    "url": "https://www.google.com/travel/flights?q=New%20York%20to%20Los%20Angeles",
    "search_query": {
      "origin_city": "New York",
      "destination_city": "Los Angeles"
    }
  }
}
```

**Réponse (erreur - paramètres manquants):**

```json
{
  "success": false,
  "error": "Missing required params: originCity, destinationCity",
  "status": 400
}
```

**Réponse (erreur - nom de ville invalide):**

```json
{
  "success": false,
  "error": "Invalid origin city name: ",
  "status": 400
}
```

**Caractéristiques:**
- ✅ Simple et robuste : utilise uniquement le paramètre `q=` de Google Flights
- ✅ Pas de dates encodées : l'utilisateur choisit ses dates sur Google Flights
- ✅ Pas de codes IATA requis : accepte les noms de villes directement
- ✅ Compatibilité maximale : fonctionne avec tous les noms de villes
- ✅ URL lisible : format `?q=Paris%20to%20Algiers`

---

#### 6. Recherche d'Activités

```http
GET /api/travel/activities
```

**Description:** Recherche d'activités touristiques à proximité via Amadeus  
**Authentification:** Aucune

**Paramètres Query (obligatoires):**

- `latitude` (float): Latitude du point de recherche
- `longitude` (float): Longitude du point de recherche

**Paramètres Query (optionnels):**

- `radius` (int): Rayon de recherche en km (défaut: `1`)

**Exemple de requête:**

```http
GET /api/travel/activities?latitude=48.8566&longitude=2.3522&radius=5
```

**Réponse (succès):**

```json
{
  "success": true,
  "data": [
    {
      "id": "ACT123",
      "name": "Tour Eiffel",
      "type": "attraction",
      "rating": 4.8,
      "price": {
        "currency": "EUR",
        "amount": "25.00"
      }
    }
  ]
}
```

---

### 📸 Routes Photos (`/api/photos`)

#### 7. Recherche de Photos

```http
GET /api/photos/search
```

**Description:** Recherche de photos de voyage via Unsplash  
**Authentification:** Aucune

**Paramètres Query (obligatoires):**

- `q` (string): Terme de recherche (ex: `Paris`, `Tokyo`)

**Paramètres Query (optionnels):**

- `page` (int): Numéro de page (défaut: `1`)
- `per_page` (int): Nombre de résultats par page (défaut: `10`, max: `20`)

**Exemple de requête:**

```http
GET /api/photos/search?q=Paris&page=1&per_page=5
```

**Réponse (succès):**

```json
{
  "success": true,
  "message": "Travel photos found",
  "data": {
    "photos": [
      {
        "id": "abc123",
        "description": "Eiffel Tower at sunset",
        "urls": {
          "raw": "https://images.unsplash.com/...",
          "full": "https://images.unsplash.com/...",
          "regular": "https://images.unsplash.com/...",
          "small": "https://images.unsplash.com/...",
          "thumb": "https://images.unsplash.com/..."
        },
        "photographer": {
          "name": "John Doe",
          "username": "johndoe"
        }
      }
    ],
    "query": "Paris",
    "pagination": {
      "page": 1,
      "per_page": 5,
      "total": 1250
    }
  }
}
```

---

#### 8. Téléchargement d'Image

```http
GET /api/photos/image/search
```

**Description:** Retourne directement l'image JPEG d'une recherche (pas de JSON)  
**Authentification:** Aucune

**Paramètres Query (obligatoires):**

- `q` (string): Terme de recherche (ex: `Tokyo`)

**Paramètres Query (optionnels):**

- `size` (string): Taille de l'image (`raw`, `full`, `regular`, `small`, `thumb`) (défaut: `regular`)
- `index` (int): Index de l'image dans les résultats (défaut: `0`)

**Exemple de requête:**

```http
GET /api/photos/image/search?q=Tokyo&size=regular&index=0
```

**Réponse (succès):**

- **Content-Type:** `image/jpeg`
- **Headers:**
  - `Content-Disposition: inline; filename="search_Tokyo.jpg"`
  - `Cache-Control: public, max-age=3600`
  - `X-Photo-ID: abc123`
  - `X-Search-Query: Tokyo`
  - `X-Result-Index: 0`
- **Body:** Données binaires JPEG

**Réponse (erreur):**

```json
{
  "success": false,
  "error": "No image found at specified index"
}
```

---

## 📊 Format de Réponses

### Réponse Succès Standard

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    /* données */
  }
}
```

### Réponse Erreur Standard

```json
{
  "success": false,
  "error": "Error message description",
  "status": 400 // Code HTTP
}
```

---

## 🔒 Sécurité

- **CORS:** Configuré pour accepter les requêtes cross-origin (mobile)
- **Environnement:** Variables sensibles dans `.env` (non versionné)
- **Validation:** Tous les paramètres de requête sont validés
- **Rate Limiting:** À implémenter selon les besoins (recommandé pour production)

---

## 📈 Évolutions Futures

- [ ] Authentification JWT pour utilisateurs
- [ ] Cache Redis pour améliorer les performances
- [ ] Rate limiting par IP
- [ ] Logging structuré (JSON)
- [ ] Monitoring avec Prometheus/Grafana
- [ ] Documentation OpenAPI/Swagger
- [ ] Tests d'intégration complets
- [ ] CI/CD avec GitHub Actions

---

## 📝 Notes de Migration

Cette architecture a été refactorisée depuis une structure nested (v1.0) vers une architecture layer-based (v2.0):

**Avant (v1.0):**

```
app/
  api/
    main/routes.py
    travel/flights.py, photos.py
config/config.py
run.py
```

**Après (v2.0):**

```
app/
  routes/main_routes.py, travel_routes.py, photo_routes.py
  services/amadeus_client.py, unsplash_service.py
  config.py
server.py
```

**Avantages:**

- Structure plus plate et lisible
- Séparation claire des responsabilités
- Meilleure testabilité
- Facilite l'onboarding des nouveaux développeurs

---

## 🤝 Contribuer

1. Créer une branche feature (`git checkout -b feature/new-feature`)
2. Commit les changements (`git commit -m 'Add new feature'`)
3. Push vers la branche (`git push origin feature/new-feature`)
4. Créer une Pull Request

---

## 📄 Licence

Ce projet est développé dans le cadre d'un projet académique (SAE BUT3).

---

**Dernière mise à jour:** 22 novembre 2025  
**Maintenu par:** Équipe SAE BUT3
