import psycopg2
import json
import logging
import numpy as np
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

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


def get_user_embedding(text: str) -> List[float]:
    """
    Génère un embedding pour un texte utilisateur en utilisant le modèle MiniLM.
    
    Args:
        text: Le texte à encoder (ex: "plage restaurant shopping")
    
    Returns:
        Une liste de floats représentant le vecteur d'embedding
    """
    try:
        logger.info("Chargement du modèle sentence-transformers...")
        # Chargement du modèle "all-MiniLM-L6-v2"
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding
        logger.info(f"Génération de l'embedding pour: '{text}'")
        embedding = model.encode(text)
        
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


def rank_cities_by_similarity(user_text: str, cities: List[Dict[str, Any]], output_filename: str = "ranked_cities.json") -> List[Dict[str, Any]]:
    """
    Classe les villes par similarité avec le texte utilisateur.
    
    Args:
        user_text: Texte utilisateur (ex: "plage restaurant shopping")
        cities: Liste des villes avec leurs embeddings
        output_filename: Nom du fichier de sortie pour les résultats
    
    Returns:
        Liste des villes triées par similarité décroissante
    """
    try:
        logger.info(f"Calcul de la similarité pour: '{user_text}'")
        
        # Génération de l'embedding utilisateur
        user_embedding = get_user_embedding(user_text)
        logger.info(f"✓ Embedding utilisateur généré (dimension: {len(user_embedding)})")
        
        # Calcul de la similarité pour chaque ville
        ranked_cities = []
        for city in cities:
            city_id = city["id"]
            city_name = city["name"]
            city_embedding = city["embedding"]
            
            # Calcul de la similarité
            similarity = cosine_similarity(user_embedding, city_embedding)
            
            ranked_cities.append({
                "id": city_id,
                "name": city_name,
                "similarity": similarity
            })
        
        # Tri par similarité décroissante
        ranked_cities.sort(key=lambda x: x["similarity"], reverse=True)
        
        logger.info(f"✓ {len(ranked_cities)} villes classées par similarité")
        
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
    # Test de get_user_embedding
    print("=" * 60)
    print("TEST: get_user_embedding()")
    print("=" * 60)
    
    try:
        user_text = "plage restaurant shopping musée"
        print(f"Texte utilisateur: '{user_text}'")
        
        user_embedding = get_user_embedding(user_text)
        print(f"✓ Embedding généré avec succès")
        print(f"  Dimension: {len(user_embedding)}")
        print(f"  Premiers éléments: {user_embedding[:5]}")
        
    except Exception as e:
        print(f"Erreur: {e}")
    
    print("\n" + "=" * 60)
    print("TEST: rank_cities_by_similarity()")
    print("=" * 60)
    
    try:
        # Chargement des embeddings depuis le fichier JSON
        cities = load_embeddings_from_json("cities_embeddings.json")
        print(f"✓ {len(cities)} villes chargées")
        
        # Classement des villes par similarité
        user_text = "catering.restaurant accommodation catering.cafe wheelchair.limited catering no_fee.no internet_access.free wheelchair building catering.cafe.ice_cream catering.cafe.coffee_shop catering.bar catering.ice_cream catering.restaurant.pizza internet_access entertainment.museum accommodation.hotel catering.restaurant.sushi building.accommodation no_fee building.commercial catering.cafe.coffee commercial.shopping_mall wheelchair.yes internet_access.for_customers commercial building.tourism catering.restaurant.argentinian entertainment building.catering"
        ranked_cities = rank_cities_by_similarity(user_text, cities)
        
        # Affichage des top 10
        print(f"\nTop 10 villes les plus similaires à '{user_text}':")
        for i, city in enumerate(ranked_cities[:10], 1):
            print(f"  {i}. {city['name']} (ID: {city['id']}) - Similarité: {city['similarity']:.4f}")
    
    except Exception as e:
        print(f"Erreur lors du traitement: {e}")
    """
    # Paramètres de connexion
    conn_params = {
        "host": "localhost",
        "dbname": "cities",
        "user": "postgres",
        "password": "postgres",
        "port": 5432
    }
    
    try:
        # Récupération de tous les embeddings
        cities = get_all_city_embeddings(conn_params)
        print(f"\n{len(cities)} embeddings chargés avec succès")
        
        # Sauvegarde dans un fichier JSON
        save_embeddings_to_json(cities)
        
        # Affichage d'un exemple
        if cities:
            print(f"\nExemple (première ville):")
            print(f"  ID: {cities[0]['id']}")
            print(f"  Nom: {cities[0]['name']}")
            print(f"  Dimension embedding: {len(cities[0]['embedding'])}")
            print(f"  Premiers éléments: {cities[0]['embedding'][:5]}")
    
    except Exception as e:
        print(f"Erreur lors du traitement: {e}")
"""