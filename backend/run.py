from app import create_app
import os

if __name__ == '__main__':
    # Créer l'application avec l'architecture Flask classique
    app = create_app('development')
    
    host = os.getenv('HOST', '127.0.0.1')
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    print("🌍 Starting Travel Recommendation API...")
    print("🏗️  Architecture: Flask Blueprints (Classique)")
    print("🔓 Mode: Anonyme (Pas d'authentification)")
    print("📸 Service: Unsplash Photos API")
    print(f"🌐 Available at: http://{host}:{port}")
    print("\n📖 Endpoints disponibles:")
    print("   System:")
    print("   - GET /api/health")
    print("   - GET /api/info")
    print("   Travel Photos:")
    print("   - GET /api/travel/photos/random?type=beach")
    print("   - GET /api/travel/photos/search?q=paris")
    print("   - GET /api/travel/photos/image/random?type=mountain&size=regular")
    print("   Travel Destinations:")
    print("   - GET /api/travel/destinations/popular")
    print("   - GET /api/travel/categories")
    print("   - GET /api/travel/recommendations?category=nature")
    
    app.run(host=host, port=port, debug=debug, threaded=True)