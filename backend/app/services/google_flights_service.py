<<<<<<< HEAD
"""
Service pour générer des liens Google Flights
"""
from urllib.parse import quote


class GoogleFlightsService:
    """Service pour construire des URLs de recherche Google Flights simples"""
    
    BASE_URL = "https://www.google.com/travel/flights"
    
    @staticmethod
    def validate_city_name(city_name):
        """
        Valide qu'un nom de ville est au format correct.
        
        Args:
            city_name (str): Nom de la ville
        
        Returns:
            bool: True si valide, False sinon
        """
        if not city_name or not isinstance(city_name, str):
            return False
        
        # Vérifie que le nom n'est pas vide après suppression des espaces
        city_name = city_name.strip()
        if len(city_name) == 0:
            return False
        
        # Vérifie que le nom contient au moins un caractère alphabétique
        if not any(c.isalpha() for c in city_name):
            return False
        
        return True
    
    @staticmethod
    def build_search_url(origin_city, destination_city):
        """
        Construit une URL de recherche Google Flights simple basée sur les noms de villes.
        
        Cette méthode génère une URL de type recherche naturelle qui permet à Google Flights
        de suggérer les aéroports et dates de manière interactive.
        
        Args:
            origin_city (str): Nom de la ville de départ (ex: "Paris", "New York")
            destination_city (str): Nom de la ville d'arrivée (ex: "Algiers", "Tokyo")
        
        Returns:
            str: URL complète Google Flights de recherche
        
        Raises:
            ValueError: Si les noms de villes sont invalides
        
        Example:
            >>> GoogleFlightsService.build_search_url("Paris", "Algiers")
            'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'
        """
        # Validation des noms de villes
        if not GoogleFlightsService.validate_city_name(origin_city):
            raise ValueError(f"Invalid origin city name: {origin_city}")
        
        if not GoogleFlightsService.validate_city_name(destination_city):
            raise ValueError(f"Invalid destination city name: {destination_city}")
        
        # Nettoyage des espaces multiples et trim
        origin_city = ' '.join(origin_city.strip().split())
        destination_city = ' '.join(destination_city.strip().split())
        
        # Construction de la requête de recherche
        search_query = f"{origin_city} to {destination_city}"
        
        # Encodage URL de la requête
        encoded_query = quote(search_query)
        
        # Construction de l'URL finale
        url = f"{GoogleFlightsService.BASE_URL}?q={encoded_query}"
        
        return url
=======
"""
Service pour générer des liens Google Flights
"""
from urllib.parse import quote


class GoogleFlightsService:
    """Service pour construire des URLs de recherche Google Flights simples"""
    
    BASE_URL = "https://www.google.com/travel/flights"
    
    @staticmethod
    def validate_city_name(city_name):
        """
        Valide qu'un nom de ville est au format correct.
        
        Args:
            city_name (str): Nom de la ville
        
        Returns:
            bool: True si valide, False sinon
        """
        if not city_name or not isinstance(city_name, str):
            return False
        
        # Vérifie que le nom n'est pas vide après suppression des espaces
        city_name = city_name.strip()
        if len(city_name) == 0:
            return False
        
        # Vérifie que le nom contient au moins un caractère alphabétique
        if not any(c.isalpha() for c in city_name):
            return False
        
        return True
    
    @staticmethod
    def build_search_url(origin_city, destination_city):
        """
        Construit une URL de recherche Google Flights simple basée sur les noms de villes.
        
        Cette méthode génère une URL de type recherche naturelle qui permet à Google Flights
        de suggérer les aéroports et dates de manière interactive.
        
        Args:
            origin_city (str): Nom de la ville de départ (ex: "Paris", "New York")
            destination_city (str): Nom de la ville d'arrivée (ex: "Algiers", "Tokyo")
        
        Returns:
            str: URL complète Google Flights de recherche
        
        Raises:
            ValueError: Si les noms de villes sont invalides
        
        Example:
            >>> GoogleFlightsService.build_search_url("Paris", "Algiers")
            'https://www.google.com/travel/flights?q=Paris%20to%20Algiers'
        """
        # Validation des noms de villes
        if not GoogleFlightsService.validate_city_name(origin_city):
            raise ValueError(f"Invalid origin city name: {origin_city}")
        
        if not GoogleFlightsService.validate_city_name(destination_city):
            raise ValueError(f"Invalid destination city name: {destination_city}")
        
        # Nettoyage des espaces multiples et trim
        origin_city = ' '.join(origin_city.strip().split())
        destination_city = ' '.join(destination_city.strip().split())
        
        # Construction de la requête de recherche
        search_query = f"{origin_city} to {destination_city}"
        
        # Encodage URL de la requête
        encoded_query = quote(search_query)
        
        # Construction de l'URL finale
        url = f"{GoogleFlightsService.BASE_URL}?q={encoded_query}"
        
        return url
>>>>>>> main
