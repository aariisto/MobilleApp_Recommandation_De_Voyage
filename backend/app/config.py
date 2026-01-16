import os

class Config:
    """Configuration de base - Version Travel API"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'travel-secret-key-dev')
    
    # API Unsplash
    UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY')
    UNSPLASH_BASE_URL = "https://api.unsplash.com"
    
    # API Amadeus (flight offers - test environment)
    AMADEUS_ACCESS_TOKEN = os.getenv('AMADEUS_ACCESS_TOKEN')
    AMADEUS_BASE_URL = os.getenv('AMADEUS_BASE_URL', 'https://test.api.amadeus.com')
    # Optional client credentials for token rotation (client_credentials)
    AMADEUS_CLIENT_ID = os.getenv('AMADEUS_CLIENT_ID')
    AMADEUS_CLIENT_SECRET = os.getenv('AMADEUS_CLIENT_SECRET')
    # Configuration API
    DEFAULT_PAGE_SIZE = int(os.getenv('DEFAULT_PAGE_SIZE', 20))
    MAX_PAGE_SIZE = int(os.getenv('MAX_PAGE_SIZE', 30))
    
    # CORS pour mobile
    CORS_ORIGINS = '*'


class DevelopmentConfig(Config):
    """Configuration de développement"""
    DEBUG = True

class ProductionConfig(Config):
    """Configuration de production"""
    DEBUG = False

class TestingConfig(Config):
    """Configuration de test"""
    DEBUG = True
    TESTING = True

# Dictionnaire des configurations
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
