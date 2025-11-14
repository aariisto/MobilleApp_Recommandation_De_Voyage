from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app(config_name='default'):
    """Factory Pattern pour créer l'application Flask"""
    
    # Charger les variables d'environnement
    load_dotenv()
    
    app = Flask(__name__)
    
    # Configuration
    from config.config import config
    app.config.from_object(config[config_name])
    
    # Extensions
    CORS(app)
    
    # Enregistrement des blueprints
    from app.api.main import main_bp
    from app.api.travel import travel_bp
    
    app.register_blueprint(main_bp, url_prefix='/api')
    app.register_blueprint(travel_bp, url_prefix='/api/travel')
    
    return app