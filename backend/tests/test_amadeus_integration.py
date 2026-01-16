import json
from unittest.mock import patch

from app import create_app
from app.services.amadeus_service import AmadeusService


SAMPLE_AMADEUS_RESPONSE = {
    "meta": {"count": 1},
    "data": [
        {
            "id": "1",
            "itineraries": [
                {
                    "segments": [
                        {
                            "departure": {"iataCode": "ORY", "at": "2025-11-20T10:55:00"},
                            "arrival": {"iataCode": "MAD", "at": "2025-11-20T12:55:00"},
                            "carrierCode": "UX",
                            "number": "1028"
                        }
                    ]
                }
            ],
            "price": {"currency": "EUR", "total": "202.32", "grandTotal": "202.32", "base": "126.00"},
            "travelerPricings": [
                {
                    "travelerId": "1",
                    "price": {"currency": "EUR", "total": "101.16", "base": "63.00"},
                    "fareDetailsBySegment": [
                        {"segmentId": "1", "includedCheckedBags": {"quantity": 0}}
                    ]
                },
                {
                    "travelerId": "2",
                    "price": {"currency": "EUR", "total": "101.16", "base": "63.00"},
                    "fareDetailsBySegment": [
                        {"segmentId": "1", "includedCheckedBags": {"quantity": 0}}
                    ]
                }
            ]
        }
    ]
}


class MockResponse:
    def __init__(self, json_data, status_code=200):
        self._json = json_data
        self.status_code = status_code
        self.text = json.dumps(json_data)

    def json(self):
        return self._json


def test_amadeus_service_returns_data():
    app = create_app('testing')
    app.config['AMADEUS_ACCESS_TOKEN'] = 'test-token'
    app.config['AMADEUS_BASE_URL'] = 'https://test.api.amadeus.com'

    with app.app_context():
        service = AmadeusService()

        with patch('requests.get') as mock_get:
            mock_get.return_value = MockResponse(SAMPLE_AMADEUS_RESPONSE, 200)

            result = service.get_flight_offers('PAR', 'MAD', '2025-11-20', adults=2, max_results=1)

            assert isinstance(result, dict)
            assert 'data' in result
            assert len(result['data']) == 1


def test_flights_route_returns_minimal_offers():
    app = create_app('testing')
    app.config['AMADEUS_ACCESS_TOKEN'] = 'test-token'
    app.config['AMADEUS_BASE_URL'] = 'https://test.api.amadeus.com'

    client = app.test_client()

    with patch('requests.get') as mock_get:
        mock_get.return_value = MockResponse(SAMPLE_AMADEUS_RESPONSE, 200)

        resp = client.get('/api/travel/flights/search?origin=PAR&destination=MAD&departureDate=2025-11-20&adults=2&max=1')

        assert resp.status_code == 200
        body = resp.get_json()
        assert body['success'] is True
        assert 'data' in body and 'offers' in body['data']
        offers = body['data']['offers']
        assert len(offers) == 1
        offer = offers[0]
        assert offer['origin'] == 'ORY'
        assert offer['destination'] == 'MAD'
        assert 'price' in offer and 'amount' in offer['price']
        assert offer['passengers'] == 2
