def validate_query_param(param, required=True, param_type=str, default=None):
    """Valider un paramètre de requête"""
    if param is None:
        if required:
            raise ValueError(f"Parameter is required")
        return default
    
    if param_type == int:
        try:
            return int(param)
        except ValueError:
            raise ValueError(f"Parameter must be an integer")
    
    if param_type == str:
        return str(param).strip()
    
    return param

def validate_pagination_params(page, per_page, max_per_page=30):
    """Valider les paramètres de pagination"""
    try:
        page = int(page) if page else 1
        per_page = int(per_page) if per_page else 20
        
        if page < 1:
            page = 1
        
        if per_page < 1:
            per_page = 1
        elif per_page > max_per_page:
            per_page = max_per_page
        
        return page, per_page
    
    except ValueError:
        return 1, 20

def validate_image_size(size):
    """Valider la taille d'image Unsplash"""
    valid_sizes = ['thumb', 'small', 'regular', 'full']
    
    if size not in valid_sizes:
        return 'regular'
    
    return size