import json
import os
import time
import sys
import random

# Ajouter le dossier courant au path pour les imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from backend.app.services.amadeus_client import AmadeusClient
from backend.app import create_app

# CONFIGURATION
ORIGIN_CITY = "PAR" # Code IATA pour Paris (Tous aéroports)
FLIGHT_DATE = "2025-06-15" # Une date fixe pour l'exemple
INPUT_FILE = "dataS5/DONNEE_V2_ALGO/cities_categories_gpt_final.json"
OUTPUT_FILE = "backend/data/flight_prices.json"
DELAY_SECONDS = 0.5 # Pause pour respecter les limites API (gratuit = limité)

def load_cities():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_script():
    print("🚀 Démarrage du script de récupération des prix...")
    
    # Création de l'application Flask pour le contexte (Config, Env vars)
    app = create_app()
    
    with app.app_context():
        client = AmadeusClient()
        
        # Tentative d'auth, mais non bloquante
        api_available = False
        try:
            print("🔑 Authentification Amadeus...")
            client.fetch_token()
            api_available = True
        except Exception as e:
            print(f"⚠️ Erreur Auth Amadeus: {e}")
            print("👉 Passage en mode GÉNÉRATION DE DONNÉES SIMULÉES (MOCK)")
            print("Ceci permettra d'avoir des prix affichés dans l'application.")

        cities = load_cities()
        print(f"📦 {len(cities)} villes chargées depuis {INPUT_FILE}")

        # Charger l'existant ou créer nouveau
        existing_data = {}
        if os.path.exists(OUTPUT_FILE):
             with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                 try:
                    existing_data = json.load(f)
                 except: 
                    existing_data = {}
        
        count = 0
        
        for city in cities:
            dest_name = city['name']
            
            # Clé unique pour le stockage
            key = f"{'PARIS'}_{dest_name.upper()}"
            
            print(f"✈️  Traitement : Paris -> {dest_name}...")
            
            result = None
            
            if api_available:
                try:
                    offers = client.get_flight_offers(
                        origin=ORIGIN_CITY,
                        destination=dest_name, 
                        departure_date=FLIGHT_DATE,
                        adults=1,
                        max_results=1
                    )
                    
                    if offers and 'data' in offers and len(offers['data']) > 0:
                        best = offers['data'][0]
                        price = best['price']['grandTotal']
                        currency = best['price']['currency']
                        result = {
                            'timestamp': time.time(),
                            'price': {'amount': price, 'currency': currency},
                            'origin': 'Paris',
                            'destination': dest_name,
                            'found': True
                        }
                        print(f"   ✅ API: {price} {currency}")
                except Exception as e:
                    print(f"   ⚠️ Erreur API: {e}")
            
            # Fallback Mock si pas de résultat API
            if not result:
                mock_price = random.randint(50, 600) + (random.randint(0, 99) / 100)
                result = {
                    'timestamp': time.time(),
                    'price': {'amount': f"{mock_price:.2f}", 'currency': "EUR"},
                    'origin': 'Paris',
                    'destination': dest_name,
                    'found': True,
                    'is_mock': True
                }
                print(f"   🔮 Mock: {result['price']['amount']} EUR")

            existing_data[key] = result
            count += 1
            
            # Sauvegarde progressive
            if count % 20 == 0:
                with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(existing_data, f, indent=2)
            
            if api_available:
                time.sleep(DELAY_SECONDS) # Respecter les quotas si on utilise l'API

        # Sauvegarde finale
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2)

        print(f"\n🎉 Terminé ! {count} prix générés/récupérés.")
        print(f"📁 Fichier généré : {OUTPUT_FILE}")

if __name__ == "__main__":
    run_script()
