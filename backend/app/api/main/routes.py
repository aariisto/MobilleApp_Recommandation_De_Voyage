from flask import jsonify
from app.api.main import main_bp

@main_bp.route('/health', methods=['GET'])
def health_check():
    """Point de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'message': 'Travel Recommendation API is running',
        'version': '2.0.0',
        'type': 'anonymous_travel_app',
        'architecture': 'flask_blueprints'
    })

@main_bp.route('/info', methods=['GET'])
def api_info():
    """Informations sur l'API"""
    return jsonify({
        'api_name': 'Travel Recommendation API',
        'version': '2.0.0',
        'endpoints': {
            'health': '/api/health',
            'travel_photos': '/api/travel/photos/*',
            'travel_destinations': '/api/travel/destinations/*'
        },
        'features': [
            'unsplash_integration',
            'anonymous_access',
            'mobile_optimized',
            'cors_enabled'
        ]
    })