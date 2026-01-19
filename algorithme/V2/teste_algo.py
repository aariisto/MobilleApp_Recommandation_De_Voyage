<<<<<<< HEAD
import psycopg2
import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

# Build a MiniLM-friendly query from raw category tags
from user_query import generate_user_query
from user_query import generate_user_query_with_weights

# Import penalty calculation function
from penality_calculate import calculate_penalty_for_city


# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_all_city_embeddings(conn_params: dict) -> List[Dict[str, Any]]:
    """
    Récupère tous les embeddings des villes stockés dans la base de données PostgreSQL.
    
    Args:
        conn_params: Dictionnaire contenant les paramètres de connexion :
                    {"host": str, "dbname": str, "user": str, "password": str, "port": int (optionnel)}
    
    Returns:
        Une liste de dictionnaires contenant id, name et embedding :
        [{"id": 1, "name": "Paris", "embedding": [0.1, 0.2, ...]}, ...]
    
    Raises:
        psycopg2.Error: En cas d'erreur de connexion ou de requête SQL
        Exception: En cas d'autre erreur
    """
    conn = None
    cursor = None
    
    try:
        # Ajout du port par défaut s'il n'est pas fourni
        if 'port' not in conn_params:
            conn_params['port'] = 5432
        
        logger.info(f"Connexion à PostgreSQL : {conn_params['host']}:{conn_params['port']}/{conn_params['dbname']}")
        
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Requête SQL
        query = """
            SELECT id, name, embedding 
            FROM cities 
            WHERE embedding IS NOT NULL
            ORDER BY id;
        """
        
        logger.info("Exécution de la requête SQL...")
        cursor.execute(query)
        
        # Récupération de tous les résultats
        results = cursor.fetchall()
        logger.info(f"{len(results)} villes trouvées avec embeddings")
        
        # Construction de la liste de dictionnaires
        cities = []
        for row in results:
            city_id, name, embedding = row
            
            # Conversion de l'embedding float8[] en liste Python
            if embedding is not None:
                # PostgreSQL retourne les arrays comme des listes Python
                if isinstance(embedding, list):
                    embedding_list = embedding
                else:
                    # En cas de chaîne, la parser
                    embedding_list = list(embedding) if embedding else []
            else:
                embedding_list = []
            
            city_dict = {
                "id": city_id,
                "name": name,
                "embedding": embedding_list
            }
            cities.append(city_dict)
        
        logger.info(f"✓ {len(cities)} embeddings récupérés avec succès")
        
        return cities
        
    except psycopg2.Error as e:
        logger.error(f"Erreur PostgreSQL: {e}")
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        raise
    finally:
        # Fermeture propre du curseur et de la connexion
        if cursor is not None:
            cursor.close()
            logger.debug("Curseur fermé")
        if conn is not None:
            conn.close()
            logger.debug("Connexion fermée")


def save_embeddings_to_json(cities: List[Dict[str, Any]], filename: str = "cities_embeddings.json"):
    """
    Sauvegarde la liste des embeddings dans un fichier JSON au dossier /algorithme.
    
    Args:
        cities: Liste de dictionnaires contenant les embeddings
        filename: Nom du fichier de sortie
    """
    try:
        # Chemin du dossier algorithme
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cities, f, ensure_ascii=False, indent=2)
        logger.info(f"✓ Embeddings sauvegardés dans '{filepath}'")
    except IOError as e:
        logger.error(f"Erreur lors de l'écriture du fichier: {e}")
        raise


def get_user_embedding(user_text: str) -> List[float]:
    """
    Génère un embedding pour le texte utilisateur.
    
    Args:
        user_text: Le texte représentant les préférences utilisateur
                  (ex: "plage restaurant shopping")
    
    Returns:
        Une liste de floats représentant le vecteur d'embedding
    """
    try:
        logger.info("Chargement du modèle sentence-transformers...")
        # Chargement du modèle "all-MiniLM-L6-v2"
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding pour le texte utilisateur
        logger.info(f"Génération de l'embedding pour: '{user_text}'")
        embedding = model.encode(user_text)
        
        # Conversion en liste Python
        return embedding.tolist()
    
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'embedding utilisateur: {e}")
        raise


def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    Calcule la similarité cosinus entre deux vecteurs.
    
    Args:
        vec1: Premier vecteur (liste de floats)
        vec2: Deuxième vecteur (liste de floats)
    
    Returns:
        Un float entre -1 et 1 représentant la similarité cosinus
        - 1.0 : vecteurs identiques
        - 0.0 : vecteurs orthogonaux
        - -1.0 : vecteurs opposés
    """
    try:
        # Conversion en arrays numpy
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        # Calcul du produit scalaire
        dot_product = np.dot(v1, v2)
        
        # Calcul des normes
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        # Vérification pour éviter la division par zéro
        if norm_v1 == 0 or norm_v2 == 0:
            logger.warning("Un des vecteurs a une norme nulle")
            return 0.0
        
        # Calcul de la similarité cosinus
        similarity = dot_product / (norm_v1 * norm_v2)
        
        return float(similarity)
    
    except Exception as e:
        logger.error(f"Erreur lors du calcul de la similarité cosinus: {e}")
        raise


def load_embeddings_from_json(filename: str = "cities_embeddings.json") -> List[Dict[str, Any]]:
    """
    Charge les embeddings des villes depuis un fichier JSON.
    
    Args:
        filename: Nom du fichier JSON à charger
    
    Returns:
        Liste de dictionnaires contenant id, name et embedding
    """
    try:
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        logger.info(f"Chargement des embeddings depuis '{filepath}'...")
        with open(filepath, 'r', encoding='utf-8') as f:
            cities = json.load(f)
        
        logger.info(f"✓ {len(cities)} villes chargées avec succès")
        return cities
    
    except IOError as e:
        logger.error(f"Erreur lors de la lecture du fichier: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Erreur de décodage JSON: {e}")
        raise


def rank_cities_by_similarity(user_text: str, cities: List[Dict[str, Any]], dislikes: Dict[str, int] = None, conn_params: Dict[str, Any] = None, output_filename: str = "ranked_cities.json") -> List[Dict[str, Any]]:
    """
    Classe les villes par similarité avec le texte utilisateur en appliquant des pénalités pour les dislikes.
    
    Args:
        user_text: Texte utilisateur (ex: "plage restaurant shopping")
        cities: Liste des villes avec leurs embeddings
        dislikes: Dictionnaire des catégories détestées avec poids (ex: {'adult.nightclub': 5, 'parking': 2})
        conn_params: Paramètres de connexion PostgreSQL pour récupérer les catégories des villes
        output_filename: Nom du fichier de sortie pour les résultats
    
    Returns:
        Liste des villes triées par score final décroissant (similarité - pénalité)
    """
    try:
        logger.info(f"Calcul de la similarité pour: '{user_text}'")
        
        # Génération de l'embedding utilisateur
        user_embedding = get_user_embedding(user_text)
        logger.info(f"✓ Embedding utilisateur généré (dimension: {len(user_embedding)})")
        
        # Calcul de la similarité pour chaque ville avec pénalités
        ranked_cities = []
        for city in cities:
            city_id = city["id"]
            city_name = city["name"]
            city_embedding = city["embedding"]
            
            # Calcul de la similarité de base
            similarity = cosine_similarity(user_embedding, city_embedding)
            
            # Calcul de la pénalité si dislikes et conn_params sont fournis
            penalty = 0.0
            if dislikes and conn_params:
                penalty = calculate_penalty_for_city(city_id, dislikes, conn_params)
                
            
            # Score final = similarité - pénalité
            final_score = similarity - penalty
            
            ranked_cities.append({
                "id": city_id,
                "name": city_name,
                "similarity": similarity,
                "penalty": penalty,
                "final_score": final_score
            })
        
        # Tri par score final décroissant
        ranked_cities.sort(key=lambda x: x["final_score"], reverse=True)
        
        logger.info(f"✓ {len(ranked_cities)} villes classées par score final (similarité - pénalité)")
        
        # Sauvegarde dans un fichier JSON
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        output_filepath = os.path.join(algorithme_dir, output_filename)
        
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(ranked_cities, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✓ Résultats sauvegardés dans '{output_filepath}'")
        
        return ranked_cities
    
    except Exception as e:
        logger.error(f"Erreur lors du classement des villes: {e}")
        raise


# Exemple d'utilisation
if __name__ == "__main__":
    
    
    try:
        # Paramètres de connexion à PostgreSQL
        conn_params = {
            "host": "localhost",
            "dbname": "cities",
            "user": "postgres",
            "password": "postgres",
            "port": 5432
        }
        
        # Chargement des embeddings directement depuis la base de données
        cities = get_all_city_embeddings(conn_params)
        print(f"✓ {len(cities)} villes chargées depuis la base de données")
        
        # Classement des villes par similarité
        user_categories = [
      "building",
      "building.commercial",
      "building.entertainment",
      "building.place_of_worship",
      "building.public_and_civil",
      "building.tourism",
      "commercial",
      "commercial.shopping_mall",
      "education",
      "education.library",
      "entertainment",
      "entertainment.culture",
      "entertainment.culture.theatre",
      "entertainment.museum",
      "fee",
      "heritage",
      "internet_access",
      "leisure",
      "leisure.park",
      "no_fee",
      "no_fee.no",
      "religion",
      "religion.place_of_worship",
      "religion.place_of_worship.christianity",
      "tourism",
      "tourism.attraction",
      "tourism.sights",
      "tourism.sights.memorial",
      "tourism.sights.memorial.ship",
      "tourism.sights.place_of_worship",
      "wheelchair",
      "wheelchair.limited",
      "wheelchair.yes"
    ]
        user_text1 = generate_user_query(user_categories)
        user_text2 = generate_user_query_with_weights(user_categories, {
    "tourism.attraction": 5,
    "leisure.park": 5,
    "commercial.shopping_mall": 5,
    "entertainment": 5,
    "heritage": 5
})
        user_text = user_text1
        
        # Exemple de dislikes pour tester le système de pénalités
        user_dislikes = {
            "building.historic": 1
        }
        
        ranked_cities = rank_cities_by_similarity(user_text, cities, dislikes=user_dislikes, conn_params=conn_params)
        
        # Affichage des top 10
        print(f"\nTop 10 villes les mieux classées pour '{user_text}':")
        for i, city in enumerate(ranked_cities[:10], 1):
            print(f"  {i}. {city['name']} (ID: {city['id']}) - Score: {city['final_score']:.4f} (Sim: {city['similarity']:.4f}, Pén: {city['penalty']:.4f})")
        
    except Exception as e:
        logger.error(f"Erreur dans l'exécution principale: {e}")
    
=======
import psycopg2
import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

# Build a MiniLM-friendly query from raw category tags
from user_query import generate_user_query
from user_query import generate_user_query_with_weights

# Import penalty calculation function
from penality_calculate import calculate_penalty_for_city


# Configuration du logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_all_city_embeddings(conn_params: dict) -> List[Dict[str, Any]]:
    """
    Récupère tous les embeddings des villes stockés dans la base de données PostgreSQL.
    
    Args:
        conn_params: Dictionnaire contenant les paramètres de connexion :
                    {"host": str, "dbname": str, "user": str, "password": str, "port": int (optionnel)}
    
    Returns:
        Une liste de dictionnaires contenant id, name et embedding :
        [{"id": 1, "name": "Paris", "embedding": [0.1, 0.2, ...]}, ...]
    
    Raises:
        psycopg2.Error: En cas d'erreur de connexion ou de requête SQL
        Exception: En cas d'autre erreur
    """
    conn = None
    cursor = None
    
    try:
        # Ajout du port par défaut s'il n'est pas fourni
        if 'port' not in conn_params:
            conn_params['port'] = 5432
        
        logger.info(f"Connexion à PostgreSQL : {conn_params['host']}:{conn_params['port']}/{conn_params['dbname']}")
        
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Requête SQL
        query = """
            SELECT id, name, embedding 
            FROM cities 
            WHERE embedding IS NOT NULL
            ORDER BY id;
        """
        
        logger.info("Exécution de la requête SQL...")
        cursor.execute(query)
        
        # Récupération de tous les résultats
        results = cursor.fetchall()
        logger.info(f"{len(results)} villes trouvées avec embeddings")
        
        # Construction de la liste de dictionnaires
        cities = []
        for row in results:
            city_id, name, embedding = row
            
            # Conversion de l'embedding float8[] en liste Python
            if embedding is not None:
                # PostgreSQL retourne les arrays comme des listes Python
                if isinstance(embedding, list):
                    embedding_list = embedding
                else:
                    # En cas de chaîne, la parser
                    embedding_list = list(embedding) if embedding else []
            else:
                embedding_list = []
            
            city_dict = {
                "id": city_id,
                "name": name,
                "embedding": embedding_list
            }
            cities.append(city_dict)
        
        logger.info(f"✓ {len(cities)} embeddings récupérés avec succès")
        
        return cities
        
    except psycopg2.Error as e:
        logger.error(f"Erreur PostgreSQL: {e}")
        raise
    except Exception as e:
        logger.error(f"Erreur inattendue: {e}")
        raise
    finally:
        # Fermeture propre du curseur et de la connexion
        if cursor is not None:
            cursor.close()
            logger.debug("Curseur fermé")
        if conn is not None:
            conn.close()
            logger.debug("Connexion fermée")


def save_embeddings_to_json(cities: List[Dict[str, Any]], filename: str = "cities_embeddings.json"):
    """
    Sauvegarde la liste des embeddings dans un fichier JSON au dossier /algorithme.
    
    Args:
        cities: Liste de dictionnaires contenant les embeddings
        filename: Nom du fichier de sortie
    """
    try:
        # Chemin du dossier algorithme
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(cities, f, ensure_ascii=False, indent=2)
        logger.info(f"✓ Embeddings sauvegardés dans '{filepath}'")
    except IOError as e:
        logger.error(f"Erreur lors de l'écriture du fichier: {e}")
        raise


def get_user_embedding(user_text: str) -> List[float]:
    """
    Génère un embedding pour le texte utilisateur.
    
    Args:
        user_text: Le texte représentant les préférences utilisateur
                  (ex: "plage restaurant shopping")
    
    Returns:
        Une liste de floats représentant le vecteur d'embedding
    """
    try:
        logger.info("Chargement du modèle sentence-transformers...")
        # Chargement du modèle "all-MiniLM-L6-v2"
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding pour le texte utilisateur
        logger.info(f"Génération de l'embedding pour: '{user_text}'")
        embedding = model.encode(user_text)
        
        # Conversion en liste Python
        return embedding.tolist()
    
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'embedding utilisateur: {e}")
        raise


def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    Calcule la similarité cosinus entre deux vecteurs.
    
    Args:
        vec1: Premier vecteur (liste de floats)
        vec2: Deuxième vecteur (liste de floats)
    
    Returns:
        Un float entre -1 et 1 représentant la similarité cosinus
        - 1.0 : vecteurs identiques
        - 0.0 : vecteurs orthogonaux
        - -1.0 : vecteurs opposés
    """
    try:
        # Conversion en arrays numpy
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        # Calcul du produit scalaire
        dot_product = np.dot(v1, v2)
        
        # Calcul des normes
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        # Vérification pour éviter la division par zéro
        if norm_v1 == 0 or norm_v2 == 0:
            logger.warning("Un des vecteurs a une norme nulle")
            return 0.0
        
        # Calcul de la similarité cosinus
        similarity = dot_product / (norm_v1 * norm_v2)
        
        return float(similarity)
    
    except Exception as e:
        logger.error(f"Erreur lors du calcul de la similarité cosinus: {e}")
        raise


def load_embeddings_from_json(filename: str = "cities_embeddings.json") -> List[Dict[str, Any]]:
    """
    Charge les embeddings des villes depuis un fichier JSON.
    
    Args:
        filename: Nom du fichier JSON à charger
    
    Returns:
        Liste de dictionnaires contenant id, name et embedding
    """
    try:
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        filepath = os.path.join(algorithme_dir, filename)
        
        logger.info(f"Chargement des embeddings depuis '{filepath}'...")
        with open(filepath, 'r', encoding='utf-8') as f:
            cities = json.load(f)
        
        logger.info(f"✓ {len(cities)} villes chargées avec succès")
        return cities
    
    except IOError as e:
        logger.error(f"Erreur lors de la lecture du fichier: {e}")
        raise
    except json.JSONDecodeError as e:
        logger.error(f"Erreur de décodage JSON: {e}")
        raise


def rank_cities_by_similarity(user_text: str, cities: List[Dict[str, Any]], dislikes: Dict[str, int] = None, conn_params: Dict[str, Any] = None, output_filename: str = "ranked_cities.json") -> List[Dict[str, Any]]:
    """
    Classe les villes par similarité avec le texte utilisateur en appliquant des pénalités pour les dislikes.
    
    Args:
        user_text: Texte utilisateur (ex: "plage restaurant shopping")
        cities: Liste des villes avec leurs embeddings
        dislikes: Dictionnaire des catégories détestées avec poids (ex: {'adult.nightclub': 5, 'parking': 2})
        conn_params: Paramètres de connexion PostgreSQL pour récupérer les catégories des villes
        output_filename: Nom du fichier de sortie pour les résultats
    
    Returns:
        Liste des villes triées par score final décroissant (similarité - pénalité)
    """
    try:
        logger.info(f"Calcul de la similarité pour: '{user_text}'")
        
        # Génération de l'embedding utilisateur
        user_embedding = get_user_embedding(user_text)
        logger.info(f"✓ Embedding utilisateur généré (dimension: {len(user_embedding)})")
        
        # Calcul de la similarité pour chaque ville avec pénalités
        ranked_cities = []
        for city in cities:
            city_id = city["id"]
            city_name = city["name"]
            city_embedding = city["embedding"]
            
            # Calcul de la similarité de base
            similarity = cosine_similarity(user_embedding, city_embedding)
            
            # Calcul de la pénalité si dislikes et conn_params sont fournis
            penalty = 0.0
            if dislikes and conn_params:
                penalty = calculate_penalty_for_city(city_id, dislikes, conn_params)
                
            
            # Score final = similarité - pénalité
            final_score = similarity - penalty
            
            ranked_cities.append({
                "id": city_id,
                "name": city_name,
                "similarity": similarity,
                "penalty": penalty,
                "final_score": final_score
            })
        
        # Tri par score final décroissant
        ranked_cities.sort(key=lambda x: x["final_score"], reverse=True)
        
        logger.info(f"✓ {len(ranked_cities)} villes classées par score final (similarité - pénalité)")
        
        # Sauvegarde dans un fichier JSON
        import os
        algorithme_dir = os.path.dirname(os.path.abspath(__file__))
        output_filepath = os.path.join(algorithme_dir, output_filename)
        
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(ranked_cities, f, ensure_ascii=False, indent=2)
        
        logger.info(f"✓ Résultats sauvegardés dans '{output_filepath}'")
        
        return ranked_cities
    
    except Exception as e:
        logger.error(f"Erreur lors du classement des villes: {e}")
        raise


# Exemple d'utilisation
if __name__ == "__main__":
    
    
    try:
        # Paramètres de connexion à PostgreSQL
        conn_params = {
            "host": "localhost",
            "dbname": "cities",
            "user": "postgres",
            "password": "postgres",
            "port": 5432
        }
        
        # Chargement des embeddings directement depuis la base de données
        cities = get_all_city_embeddings(conn_params)
        print(f"✓ {len(cities)} villes chargées depuis la base de données")
        
        # Classement des villes par similarité
        user_categories = [
      "building",
      "building.commercial",
      "building.entertainment",
      "building.place_of_worship",
      "building.public_and_civil",
      "building.tourism",
      "commercial",
      "commercial.shopping_mall",
      "education",
      "education.library",
      "entertainment",
      "entertainment.culture",
      "entertainment.culture.theatre",
      "entertainment.museum",
      "fee",
      "heritage",
      "internet_access",
      "leisure",
      "leisure.park",
      "no_fee",
      "no_fee.no",
      "religion",
      "religion.place_of_worship",
      "religion.place_of_worship.christianity",
      "tourism",
      "tourism.attraction",
      "tourism.sights",
      "tourism.sights.memorial",
      "tourism.sights.memorial.ship",
      "tourism.sights.place_of_worship",
      "wheelchair",
      "wheelchair.limited",
      "wheelchair.yes"
    ]
        user_text1 = generate_user_query(user_categories)
        user_text2 = generate_user_query_with_weights(user_categories, {
    "tourism.attraction": 5,
    "leisure.park": 5,
    "commercial.shopping_mall": 5,
    "entertainment": 5,
    "heritage": 5
})
        user_text = user_text1
        
        # Exemple de dislikes pour tester le système de pénalités
        user_dislikes = {
            "building.historic": 1
        }
        
        ranked_cities = rank_cities_by_similarity(user_text, cities, dislikes=user_dislikes, conn_params=conn_params)
        
        # Affichage des top 10
        print(f"\nTop 10 villes les mieux classées pour '{user_text}':")
        for i, city in enumerate(ranked_cities[:10], 1):
            print(f"  {i}. {city['name']} (ID: {city['id']}) - Score: {city['final_score']:.4f} (Sim: {city['similarity']:.4f}, Pén: {city['penalty']:.4f})")
        
    except Exception as e:
        logger.error(f"Erreur dans l'exécution principale: {e}")
    
>>>>>>> main
    