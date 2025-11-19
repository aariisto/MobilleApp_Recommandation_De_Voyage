from flask import request
from app.api.travel import travel_bp
from app.services.amadeus_client import AmadeusClient
from app.utils.responses import success_response, error_response


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
