from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    """Réponse de succès standardisée"""
    response = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code

def error_response(message="An error occurred", status_code=400, error_code=None):
    """Réponse d'erreur standardisée"""
    response = {
        'success': False,
        'error': message
    }
    
    if error_code:
        response['error_code'] = error_code
    
    return jsonify(response), status_code

def validation_error_response(errors):
    """Réponse d'erreur de validation"""
    return error_response(
        message="Validation failed",
        status_code=422,
        error_code="VALIDATION_ERROR"
    )