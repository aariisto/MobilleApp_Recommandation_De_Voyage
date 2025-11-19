from flask import Blueprint

# Blueprint pour les fonctionnalités voyage
travel_bp = Blueprint('travel', __name__)

from . import photos
from . import flights