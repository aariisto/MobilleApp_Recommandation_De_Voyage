from flask import Flask
from dotenv import load_dotenv

def create_app(config_name='default'):
    """Factory Pattern pour créer l'application Flask"""
    
    # Charger les variables d'environnement
    load_dotenv()
    
    app = Flask(__name__)
    
    # Configuration
    from .config import config
    app.config.from_object(config[config_name])
    
    # Extensions
    from .extensions import cors
    cors.init_app(app)
    
    # Enregistrement des blueprints
    from .routes.main_routes import main_bp
    from .routes.travel_routes import travel_bp
    from .routes.photo_routes import photo_bp
    
    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(travel_bp, url_prefix='/api/travel')
    app.register_blueprint(photo_bp, url_prefix='/api/photos')
    
    return app