"""
Routes pour les vols (Travel/Flights)
"""
from flask import Blueprint, request
from app.services.amadeus_client import AmadeusClient
from app.services.google_flights_service import GoogleFlightsService
from app.utils.responses import success_response, error_response

travel_bp = Blueprint('travel', __name__)


@travel_bp.route('/flights/search', methods=['GET'])
def search_flights():
    """Recherche des offres de vol via Amadeus (proxy simple).

    Query params attendus :
    - `origin` ou `originLocationCode` (ex: PAR)
    - `destination` ou `destinationLocationCode` (ex: MAD)
    - `departureDate` (ex: 2025-11-20)
    - `adults` (optionnel, défaut 1)
    - `max` (optionnel, nombre max de résultats)
    """
    origin = request.args.get('origin') or request.args.get('originLocationCode')
    destination = request.args.get('destination') or request.args.get('destinationLocationCode')
    departure = request.args.get('departureDate')

    if not origin or not destination or not departure:
        return error_response('Missing required params: origin, destination, departureDate', 400)

    adults = request.args.get('adults', 1, type=int)
    max_results = request.args.get('max', 1, type=int)

    try:
        service = AmadeusClient()
        data = service.get_flight_offers(origin, destination, departure, adults, max_results)

        if not data:
            return error_response('Empty response from Amadeus', 502)

        if 'error' in data:
            # forward error message and status if available
            msg = data.get('error')
            return error_response(msg, data.get('status_code', 500))

        # `data` contient le payload complet d'Amadeus. Ici on réduit la réponse
        # pour ne renvoyer que : origine, destination, prix, baggage, nombre de personnes
        offers = []
        for offer in data.get('data', []):
            # origine / destination depuis le premier segment de la première itineraire
            try:
                first_itin = offer.get('itineraries', [])[0]
                first_seg = first_itin.get('segments', [])[0]
                origin_code = first_seg.get('departure', {}).get('iataCode')
                dest_code = first_seg.get('arrival', {}).get('iataCode')
                departure_time = first_seg.get('departure', {}).get('at')
            except Exception:
                origin_code = None
                dest_code = None
                departure_time = None

            # prix
            price_obj = offer.get('price', {})
            price_amount = price_obj.get('grandTotal') or price_obj.get('total') or price_obj.get('base')
            price_currency = price_obj.get('currency')

            # baggage : essayer d'extraire includedCheckedBags.quantity du premier traveler
            baggage_qty = None
            travelers = offer.get('travelerPricings', [])
            if travelers:
                try:
                    first_trav = travelers[0]
                    fare_details = first_trav.get('fareDetailsBySegment', [])[0]
                    included = fare_details.get('includedCheckedBags', {})
                    baggage_qty = included.get('quantity')
                except Exception:
                    baggage_qty = None

            # nombre de personnes : on renvoie le param `adults` demandé ou le nombre de travelerPricings
            passengers = int(adults) if adults else len(travelers) if travelers else 1

            offers.append({
                'id': offer.get('id'),
                'origin': origin_code,
                'destination': dest_code,
                'departure_time': departure_time,
                'price': {'currency': price_currency, 'amount': price_amount},
                'baggage_included_checked_bags': baggage_qty,
                'passengers': passengers
            })

        return success_response({'offers': offers}, message='Flight offers (minimal)')

    except Exception as e:
        return error_response(str(e), 500)


@travel_bp.route('/flights/google-link', methods=['GET'])
def generate_google_flights_link():
    """Génère un lien de recherche Google Flights simple basé sur les noms de villes.

    Query params attendus :
    - `originCity` (obligatoire) : Nom de la ville de départ (ex: "Paris", "New York")
    - `destinationCity` (obligatoire) : Nom de la ville d'arrivée (ex: "Algiers", "Tokyo")
    
    Note: Cette route génère une URL de recherche simple de type:
    https://www.google.com/travel/flights?q=Paris%20to%20Algiers
    
    Les dates et autres paramètres sont ignorés et doivent être saisis directement
    sur Google Flights par l'utilisateur.
    """
    # Récupération des paramètres
    origin_city = request.args.get('originCity')
    destination_city = request.args.get('destinationCity')
    
    # Validation des paramètres obligatoires
    if not origin_city or not destination_city:
        return error_response(
            'Missing required params: originCity, destinationCity',
            400
        )
    
    try:
        # Génération du lien de recherche via le service
        google_flights_url = GoogleFlightsService.build_search_url(
            origin_city=origin_city,
            destination_city=destination_city
        )
        
        return success_response(
            {
                'url': google_flights_url,
                'search_query': {
                    'origin_city': origin_city.strip(),
                    'destination_city': destination_city.strip()
                }
            },
            message='Google Flights search link generated successfully'
        )
    
    except ValueError as e:
        # Erreur de validation des paramètres
        return error_response(str(e), 400)
    
    except Exception as e:
        # Erreur inattendue
        return error_response(f'Failed to generate Google Flights link: {str(e)}', 500)
