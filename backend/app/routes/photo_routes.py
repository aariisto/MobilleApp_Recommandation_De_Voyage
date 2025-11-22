"""
Routes pour les photos Unsplash
"""
from flask import Blueprint, request, jsonify, Response
from app.services.unsplash_service import UnsplashService

photo_bp = Blueprint('photos', __name__)


@photo_bp.route('/search', methods=['GET'])
def search_travel_photos():
    """Recherche de photos par destination"""
    query = request.args.get('q')
    if not query:
        return jsonify({'success': False, 'error': 'Query parameter required'}), 400
    
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 20)
    
    try:
        unsplash = UnsplashService()
        # Ajouter 'travel' au query pour de meilleurs résultats
        travel_query = f"{query} travel destination"
        data = unsplash.search_photos(travel_query, page, per_page)
        
        if 'error' in data:
            return jsonify({'success': False, 'error': data['error']}), 500
        
        photos = []
        for photo_data in data.get('results', []):
            photos.append({
                'id': photo_data.get('id'),
                'description': photo_data.get('description') or photo_data.get('alt_description'),
                'urls': photo_data.get('urls', {}),
                'photographer': {
                    'name': photo_data.get('user', {}).get('name'),
                    'username': photo_data.get('user', {}).get('username')
                }
            })
        
        return jsonify({
            'success': True,
            'message': 'Travel photos found',
            'data': {
                'photos': photos, 
                'query': query,
                'pagination': {'page': page, 'per_page': per_page, 'total': data.get('total', 0)}
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@photo_bp.route('/image/search', methods=['GET'])
def get_search_travel_image():
    """Retourne directement l'image JPEG d'une recherche"""
    query = request.args.get('q')
    if not query:
        return jsonify({'success': False, 'error': 'Query parameter required'}), 400
    
    size = request.args.get('size', 'regular')
    index = request.args.get('index', 0, type=int)
    
    try:
        unsplash = UnsplashService()
        travel_query = f"{query} travel destination"
        data = unsplash.search_photos(travel_query, 1, max(index + 1, 5))
        
        if 'error' in data or not data:
            return jsonify({'success': False, 'error': 'Unable to fetch search results'}), 500
        
        results = data.get('results', [])
        if not results or len(results) <= index:
            return jsonify({'success': False, 'error': 'No image found at specified index'}), 404
        
        photo_data = results[index]
        urls = photo_data.get('urls', {})
        image_url = urls.get(size) or urls.get('regular') or urls.get('small')
        
        if not image_url:
            return jsonify({'success': False, 'error': 'No image URL available'}), 500
        
        # Télécharger et servir l'image
        image_response = unsplash.download_image(image_url)
        
        if image_response.status_code == 200:
            return Response(
                image_response.content,
                mimetype='image/jpeg',
                headers={
                    'Content-Disposition': f'inline; filename="search_{query}.jpg"',
                    'Cache-Control': 'public, max-age=3600',
                    'X-Photo-ID': photo_data.get('id', ''),
                    'X-Search-Query': query,
                    'X-Result-Index': str(index)
                }
            )
        else:
            return jsonify({'success': False, 'error': 'Failed to download image'}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
