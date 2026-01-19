import json
import os
import time
from backend.app.services.amadeus_client import AmadeusClient

class FlightPriceService:
    DATA_FILE = os.path.join(os.path.dirname(__file__), '../../data/flight_prices.json')

    @staticmethod
    def _load_data():
        if not os.path.exists(FlightPriceService.DATA_FILE):
            os.makedirs(os.path.dirname(FlightPriceService.DATA_FILE), exist_ok=True)
            return {}
        try:
            with open(FlightPriceService.DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}

    @staticmethod
    def _save_data(data):
        os.makedirs(os.path.dirname(FlightPriceService.DATA_FILE), exist_ok=True)
        with open(FlightPriceService.DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    @staticmethod
    def get_price(origin, destination):
        """
        Récupère un prix stocké localement.
        La clé est 'ORIGIN_DESTINATION'. Ne jamais expirer si présent.
        """
        data = FlightPriceService._load_data()
        key = f"{origin.upper()}_{destination.upper()}"
        
        entry = data.get(key)
        if entry:
            # On retourne l'entrée existante sans vérifier la date (Stockage définitif)
            print(f"✅ Prix permanent trouvé en local pour {key}: {entry['price']}")
            return entry
        
        return None

    @staticmethod
    def save_price(origin, destination, price_data):
        """
        Sauvegarde un prix en local.
        """
        data = FlightPriceService._load_data()
        key = f"{origin.upper()}_{destination.upper()}"
        
        data[key] = {
            'timestamp': time.time(),
            'price': price_data, # Peut inclure amount, currency
            'origin': origin,
            'destination': destination
        }
        
        FlightPriceService._save_data(data)
        print(f"💾 Prix sauvegardé pour {key}")

    @staticmethod
    def fetch_and_store_price(origin, destination, date):
        """
        Orchestrateur: Check local -> Si pas trouvé -> Fetch API -> Si erreur -> MOCK -> Save Local
        """
        # Nettoyage
        origin = origin.strip()
        destination = destination.strip()

        # 1. Check local
        cached = FlightPriceService.get_price(origin, destination)
        if cached:
            return cached['price']

        result = None
        try:
            # 2. Fetch API (Amadeus)
            service = AmadeusClient()
            offers = service.get_flight_offers(origin, destination, date, adults=1, max_results=1)

            if offers and 'data' in offers and len(offers['data']) > 0:
                best_offer = offers['data'][0]
                price_obj = best_offer.get('price', {})
                price_val = price_obj.get('grandTotal')
                currency = price_obj.get('currency')
                
                result = {'amount': price_val, 'currency': currency}
        except Exception as e:
            print(f"⚠️ API Amadeus échouée: {e}. Utilisation du MOCK.")
        
        # 3. Fallback MOCK si API échoue ou ne trouve rien
        if not result:
            import random
            # Génération d'un prix crédible (entre 100 et 800 EUR)
            mock_price = random.randint(100, 800)
            result = {'amount': f"{mock_price}.00", 'currency': "EUR"}
            print(f"🔮 Prix MOCK généré pour {origin}->{destination}: {result['amount']} EUR")

        # 4. Save Local (Définitif)
        FlightPriceService.save_price(origin, destination, result)
        return result
