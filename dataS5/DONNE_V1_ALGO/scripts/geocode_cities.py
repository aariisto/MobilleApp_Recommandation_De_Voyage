import requests
import csv
import json
import time

API_KEY = "faccded3e510413eb95d55246b77aec1"
CSV_FILE = "world_top_cities_part2.csv"
OUTPUT_FILE = "cities_geocoded_poi_part2.json"
RADIUS = 10000  # 10 km autour de chaque ville

# Catégories à récupérer (catégories valides de l'API Geoapify)
CATEGORIES = "tourism.attraction,accommodation.hotel,catering.restaurant,catering.cafe,catering.bar,commercial.shopping_mall,entertainment.museum,entertainment.theme_park,beach,leisure.park,sport.swimming_pool"

cities_data = []

def get_pois(lat, lon, city_name):
    """Récupère les POIs autour d'une ville."""
    url = "https://api.geoapify.com/v2/places"
    params = {
        "categories": CATEGORIES,
        "filter": f"circle:{lon},{lat},{RADIUS}",
        "limit":30,
        "apiKey": API_KEY
    }
    
    # Debug: afficher l'URL complète
    from urllib.parse import urlencode
    full_url = f"{url}?{urlencode(params)}"
    print(f"    🔗 URL complète: {full_url}")
    
    try:
        response = requests.get(url, params=params, timeout=30)
        if response.status_code == 200:
            data = response.json()
            features = data.get("features", [])
            
            pois = []
            for feature in features:
                props = feature.get("properties", {})
                pois.append({
                    "name": props.get("name", "Unknown"),
                    "categories": props.get("categories", []),
                    "lat": props.get("lat"),
                    "lon": props.get("lon")
                })
            
            print(f"    → {len(pois)} POIs trouvés")
            return pois
        else:
            print(f"    → Erreur POIs: {response.status_code}")
            return []
    except Exception as e:
        print(f"    → Erreur POIs: {e}")
        return []

with open(CSV_FILE, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        country = row['country'].strip()
        city = row['city'].strip()
        
        # Ignorer les lignes génériques
        if country.startswith('Country_') or city.startswith('City_'):
            continue
        
        # Géocoder via Geoapify
        url = "https://api.geoapify.com/v1/geocode/search"
        params = {
            "text": f"{city}, {country}",
            "type": "city",
            "format": "json",
            "apiKey": API_KEY
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("results"):
                    result = data["results"][0]
                    lat = result["lat"]
                    lon = result["lon"]
                    
                    print(f"✓ {city}, {country}: {lat:.4f}, {lon:.4f}")
                    
                    # Récupérer les POIs
                    pois = get_pois(lat, lon, city)
                    
                    cities_data.append({
                        "country": country,
                        "city": city,
                        "lat": lat,
                        "lon": lon,
                        "pois": pois
                    })
                else:
                    print(f"✗ {city}, {country}: Non trouvé")
            else:
                print(f"✗ {city}, {country}: Erreur {response.status_code}")
        except Exception as e:
            print(f"✗ {city}, {country}: {e}")
        
        time.sleep(0.5)  # Rate limiting

# Sauvegarder en JSON
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(cities_data, f, indent=2, ensure_ascii=False)

print(f"\n✅ {len(cities_data)} villes géocodées → {OUTPUT_FILE}")
