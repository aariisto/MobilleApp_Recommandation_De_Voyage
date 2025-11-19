from app import create_app
import os
import sys
import logging


def check_env_vars():
    missing = []
    # Optional but useful to warn
    if not os.getenv('UNSPLASH_ACCESS_KEY'):
        missing.append('UNSPLASH_ACCESS_KEY')
    if not os.getenv('AMADEUS_ACCESS_TOKEN'):
        missing.append('AMADEUS_ACCESS_TOKEN')
    return missing


if __name__ == '__main__':
    # Configure logging to show more helpful startup info
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

    # Check environment variables
    missing = check_env_vars()
    if missing:
        logging.warning('Missing environment variables: %s', ', '.join(missing))
        logging.warning('The app can still start but some integrations may fail (check tokens in .env).')

    try:
        # Créer l'application avec l'architecture Flask classique
        app = create_app('development')

        host = os.getenv('HOST', '127.0.0.1')
        port = int(os.getenv('PORT', 5000))
        debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

        logging.info('🌍 Starting Travel Recommendation API...')
        logging.info('🏗️  Architecture: Flask Blueprints (Classique)')
        logging.info('🔓 Mode: Anonyme (Pas d\'authentification)')
        logging.info('📸 Service: Unsplash Photos API')
        logging.info('🌐 Available at: http://%s:%s', host, port)

        app.run(host=host, port=port, debug=debug, threaded=True)

    except Exception as e:
        logging.exception('Application failed to start: %s', e)
        # Print the error to stdout as well for the user running python directly
        print('Application failed to start:', e, file=sys.stderr)
        sys.exit(1)