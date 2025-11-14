from flask import Blueprint

# Blueprint principal pour les routes système
main_bp = Blueprint('main', __name__)

from . import routes