from flask import jsonify
from app.api.main import main_bp
from flask import current_app
import logging
import os

try:
    from app.services.amadeus_client import AmadeusClient as AmadeusService
except Exception:
    AmadeusService = None

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


@main_bp.route('/health/amadeus', methods=['GET'])
def amadeus_health():
    """Debug endpoint: indique la présence du token Amadeus et des client credentials."""
    logger = logging.getLogger(__name__)
    try:
        # Check both app config (loaded at startup) and current environment variables
        has_token = bool(os.getenv('AMADEUS_ACCESS_TOKEN') or current_app.config.get('AMADEUS_ACCESS_TOKEN'))
        has_client = bool(os.getenv('AMADEUS_CLIENT_ID') and os.getenv('AMADEUS_CLIENT_SECRET')) or bool(current_app.config.get('AMADEUS_CLIENT_ID') and current_app.config.get('AMADEUS_CLIENT_SECRET'))

        token_masked = None
        token_expires = None

        if AmadeusService is not None:
            svc = AmadeusService()
            if getattr(svc, 'access_token', None):
                t = svc.access_token
                token_masked = f"{t[:4]}...{t[-4:]}" if len(t) > 8 else '***'
            token_expires = getattr(svc, '_token_expires_at', None)

        return jsonify({
            'success': True,
            'data': {
                'has_token_env': has_token,
                'has_client_credentials': has_client,
                'token_masked': token_masked,
                'token_expires_at': token_expires
            }
        })
    except Exception as e:
        logger.exception('Failed to evaluate Amadeus health')
        return jsonify({'success': False, 'error': str(e)}), 500


@main_bp.route('/travel/activities', methods=['GET'])
def travel_activities():
    """Search activities via Amadeus and return simplified results.

    Query params: `latitude` (required), `longitude` (required), `radius` (optional, default 1)
    """
    from flask import request

    logger = logging.getLogger(__name__)

    lat = request.args.get('latitude')
    lon = request.args.get('longitude')
    radius = request.args.get('radius', '1')

    if not lat or not lon:
        return jsonify({'success': False, 'error': 'Missing latitude or longitude parameters'}), 400

    try:
        # Initialize service (will use env or client credentials)
        svc = None
        if AmadeusService is not None:
            try:
                svc = AmadeusService()
            except Exception:
                logger.exception('Failed to instantiate AmadeusService')

        if svc is None:
            return jsonify({'success': False, 'error': 'Amadeus service not configured on server'}), 500

        items = svc.search_activities(latitude=lat, longitude=lon, radius=radius)
        return jsonify({'success': True, 'data': items})
    except Exception as e:
        logger.exception('Error while searching activities')
        return jsonify({'success': False, 'error': str(e)}), 500