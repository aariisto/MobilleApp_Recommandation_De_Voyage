"""
Extensions Flask
Initialisation des extensions pour éviter les imports circulaires
"""
from flask_cors import CORS

# Initialiser les extensions (sans les lier à une app)
cors = CORS()
