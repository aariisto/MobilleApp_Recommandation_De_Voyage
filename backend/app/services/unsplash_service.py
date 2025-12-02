import requests
from flask import current_app

class UnsplashService:
    """Service pour interagir avec l'API Unsplash"""
    
    def __init__(self):
        self.base_url = current_app.config['UNSPLASH_BASE_URL']
        self.access_key = current_app.config['UNSPLASH_ACCESS_KEY']
    
    def get_headers(self):
        """Headers pour les requêtes Unsplash"""
        return {
            'Authorization': f'Client-ID {self.access_key}',
            'Accept': 'application/json'
        }
    
    def make_request(self, endpoint, params=None):
        """Effectuer une requête à l'API Unsplash"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.get(url, headers=self.get_headers(), params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {'error': f'API error: {response.status_code}'}
        except Exception as e:
            return {'error': str(e)}
    
    def get_random_photo(self, query=None):
        """Obtenir une photo aléatoire"""
        params = {}
        if query:
            params['query'] = query
        
        return self.make_request('/photos/random', params)
    
    def search_photos(self, query, page=1, per_page=20):
        """Rechercher des photos"""
        params = {
            'query': query,
            'page': page,
            'per_page': min(per_page, current_app.config['MAX_PAGE_SIZE'])
        }
        
        return self.make_request('/search/photos', params)
    
    def get_featured_photos(self, page=1, per_page=20):
        """Obtenir des photos en vedette"""
        params = {
            'page': page,
            'per_page': min(per_page, current_app.config['MAX_PAGE_SIZE'])
        }
        
        return self.make_request('/photos', params)
    
    def download_image(self, image_url):
        """Télécharger une image depuis Unsplash"""
        try:
            response = requests.get(image_url, timeout=30)
            return response
        except Exception as e:
            raise Exception(f"Error downloading image: {str(e)}")