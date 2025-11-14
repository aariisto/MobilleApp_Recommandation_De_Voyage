import os

class Config:
    """Configuration de base - Version Travel API"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'travel-secret-key-dev')
    
    # API Unsplash
    UNSPLASH_ACCESS_KEY = os.getenv('UNSPLASH_ACCESS_KEY')
    UNSPLASH_BASE_URL = "https://api.unsplash.com"
    
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