"""
Tests unitaires pour le service Google Flights
"""
import pytest
from app.services.google_flights_service import GoogleFlightsService


class TestGoogleFlightsService:
    """Tests pour la génération de liens de recherche Google Flights"""
    
    def test_validate_city_name_valid(self):
        """Test la validation de noms de villes valides"""
        assert GoogleFlightsService.validate_city_name('Paris') is True
        assert GoogleFlightsService.validate_city_name('New York') is True
        assert GoogleFlightsService.validate_city_name('Tokyo') is True
        assert GoogleFlightsService.validate_city_name('São Paulo') is True
        assert GoogleFlightsService.validate_city_name('Saint-Petersburg') is True
    
    def test_validate_city_name_invalid(self):
        """Test la validation de noms de villes invalides"""
        assert GoogleFlightsService.validate_city_name('') is False  # Vide
        assert GoogleFlightsService.validate_city_name('   ') is False  # Espaces seulement
        assert GoogleFlightsService.validate_city_name(None) is False  # None
        assert GoogleFlightsService.validate_city_name(123) is False  # Pas une string
        assert GoogleFlightsService.validate_city_name('123') is False  # Que des chiffres
    
    def test_build_search_url_success(self):
        """Test la génération d'une URL de recherche valide"""
        url = GoogleFlightsService.build_search_url(
            origin_city='Paris',
            destination_city='Algiers'
        )
        
        # Vérifications de base
        assert isinstance(url, str)
        assert url.startswith('https://www.google.com/travel/flights?q=')
        assert 'Paris' in url
        assert 'Algiers' in url
        assert 'to' in url
        
        # Vérifier le format exact
        expected_url = 'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'
        assert url == expected_url
    
    def test_build_search_url_with_spaces(self):
        """Test avec des noms de villes contenant des espaces"""
        url = GoogleFlightsService.build_search_url(
            origin_city='New York',
            destination_city='Los Angeles'
        )
        
        assert 'New%20York' in url
        assert 'Los%20Angeles' in url
        assert 'to' in url
    
    def test_build_search_url_with_special_characters(self):
        """Test avec des caractères spéciaux"""
        url = GoogleFlightsService.build_search_url(
            origin_city='São Paulo',
            destination_city='Zürich'
        )
        
        assert 'S%C3%A3o%20Paulo' in url or 'São Paulo' in url
        assert 'Z%C3%BCrich' in url or 'Zürich' in url
    
    def test_build_search_url_trims_whitespace(self):
        """Test que les espaces en début et fin sont supprimés"""
        url = GoogleFlightsService.build_search_url(
            origin_city='  Paris  ',
            destination_city='  Tokyo  '
        )
        
        # Les espaces inutiles doivent être supprimés
        assert url == 'https://www.google.com/travel/flights?q=Paris%20to%20Tokyo'
    
    def test_build_search_url_handles_multiple_spaces(self):
        """Test que les espaces multiples sont normalisés"""
        url = GoogleFlightsService.build_search_url(
            origin_city='New    York',
            destination_city='Los    Angeles'
        )
        
        # Les espaces multiples doivent être réduits à un seul
        assert 'New%20York' in url
        assert 'Los%20Angeles' in url
    
    def test_build_search_url_invalid_origin(self):
        """Test avec nom de ville origine invalide"""
        with pytest.raises(ValueError, match='Invalid origin city name'):
            GoogleFlightsService.build_search_url(
                origin_city='',
                destination_city='Algiers'
            )
        
        with pytest.raises(ValueError, match='Invalid origin city name'):
            GoogleFlightsService.build_search_url(
                origin_city='   ',
                destination_city='Algiers'
            )
    
    def test_build_search_url_invalid_destination(self):
        """Test avec nom de ville destination invalide"""
        with pytest.raises(ValueError, match='Invalid destination city name'):
            GoogleFlightsService.build_search_url(
                origin_city='Paris',
                destination_city=''
            )
        
        with pytest.raises(ValueError, match='Invalid destination city name'):
            GoogleFlightsService.build_search_url(
                origin_city='Paris',
                destination_city=None
            )
    
    def test_build_search_url_no_encoded_params(self):
        """Test que l'URL ne contient pas de paramètres Google Flights avancés"""
        url = GoogleFlightsService.build_search_url(
            origin_city='Paris',
            destination_city='Algiers'
        )
        
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
        assert url.count('?') == 1  # Un seul point d'interrogation
    
    def test_build_search_url_real_examples(self):
        """Test avec des exemples réels de villes"""
        examples = [
            ('Paris', 'Algiers', 'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'),
            ('London', 'New York', 'https://www.google.com/travel/flights?q=London%20to%20New%20York'),
            ('Tokyo', 'Seoul', 'https://www.google.com/travel/flights?q=Tokyo%20to%20Seoul'),
            ('Dubai', 'Mumbai', 'https://www.google.com/travel/flights?q=Dubai%20to%20Mumbai'),
        ]
        
        for origin, destination, expected in examples:
            url = GoogleFlightsService.build_search_url(origin, destination)
            assert url == expected
