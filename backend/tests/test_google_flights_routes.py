"""
Tests d'intégration pour les routes Google Flights
"""
import pytest
from app import create_app


@pytest.fixture
def client():
    """Fixture pour créer un client de test Flask"""
    app = create_app('testing')
    with app.test_client() as client:
        yield client


class TestGoogleFlightsRoutes:
    """Tests pour les routes de génération de liens de recherche Google Flights"""
    
    def test_generate_google_flights_link_success(self, client):
        """Test de génération d'un lien de recherche réussi"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': 'Paris',
                'destinationCity': 'Algiers'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        assert data['success'] is True
        assert 'data' in data
        assert 'url' in data['data']
        assert 'search_query' in data['data']
        
        # Vérifier l'URL générée
        url = data['data']['url']
        assert url == 'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'
        
        # Vérifier la query de recherche
        search = data['data']['search_query']
        assert search['origin_city'] == 'Paris'
        assert search['destination_city'] == 'Algiers'
    
    def test_generate_google_flights_link_with_spaces(self, client):
        """Test avec des noms de villes contenant des espaces"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': 'New York',
                'destinationCity': 'Los Angeles'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        url = data['data']['url']
        assert 'New%20York' in url
        assert 'Los%20Angeles' in url
        assert 'to' in url
    
    def test_generate_google_flights_link_trims_whitespace(self, client):
        """Test que les espaces en début et fin sont supprimés"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': '  Paris  ',
                'destinationCity': '  Tokyo  '
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        # Les espaces doivent être supprimés dans la réponse
        assert data['data']['search_query']['origin_city'] == 'Paris'
        assert data['data']['search_query']['destination_city'] == 'Tokyo'
    
    def test_generate_google_flights_link_missing_origin(self, client):
        """Test avec paramètre originCity manquant"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'destinationCity': 'Algiers'
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'Missing required params' in data['error']
    
    def test_generate_google_flights_link_missing_destination(self, client):
        """Test avec paramètre destinationCity manquant"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': 'Paris'
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'Missing required params' in data['error']
    
    def test_generate_google_flights_link_empty_city_names(self, client):
        """Test avec noms de villes vides"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': '',
                'destinationCity': 'Algiers'
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
    
    def test_generate_google_flights_link_whitespace_only(self, client):
        """Test avec noms de villes contenant uniquement des espaces"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': '   ',
                'destinationCity': 'Algiers'
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['success'] is False
        assert 'Invalid' in data['error']
    
    def test_generate_google_flights_link_no_advanced_params(self, client):
        """Test que l'URL ne contient pas de paramètres Google Flights avancés"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': 'Paris',
                'destinationCity': 'Algiers'
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        url = data['data']['url']
        
        # Vérifier qu'il n'y a PAS de paramètres avancés
        assert 'f=' not in url
        assert 'ap=' not in url
        assert 'tfs=' not in url
        assert 'd=' not in url
        assert 'r=' not in url
        assert 'p=' not in url
        assert 'c=' not in url
        
        # Vérifier qu'il y a seulement le paramètre q=
        assert '?q=' in url
    
    def test_generate_google_flights_link_ignores_extra_params(self, client):
        """Test que la route ignore les paramètres de date s'ils sont fournis"""
        response = client.get(
            '/api/travel/flights/google-link',
            query_string={
                'originCity': 'Paris',
                'destinationCity': 'Algiers',
                'departureDate': '2025-11-20',  # Doit être ignoré
                'returnDate': '2025-11-27',  # Doit être ignoré
                'passengers': 3  # Doit être ignoré
            }
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        url = data['data']['url']
        
        # Vérifier que les dates NE sont PAS dans l'URL
        assert '2025-11-20' not in url
        assert '2025-11-27' not in url
        assert 'passengers' not in url
        
        # Vérifier que c'est bien une URL de recherche simple
        assert url == 'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'
    
    def test_generate_google_flights_link_real_examples(self, client):
        """Test avec des exemples réels de villes"""
        examples = [
            ('Paris', 'Algiers', 'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'),
            ('London', 'New York', 'https://www.google.com/travel/flights?q=London%20to%20New%20York'),
            ('Tokyo', 'Seoul', 'https://www.google.com/travel/flights?q=Tokyo%20to%20Seoul'),
        ]
        
        for origin, destination, expected_url in examples:
            response = client.get(
                '/api/travel/flights/google-link',
                query_string={
                    'originCity': origin,
                    'destinationCity': destination
                }
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['data']['url'] == expected_url
