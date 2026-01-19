<<<<<<< HEAD
import psycopg2
from typing import Optional, List
from sentence_transformers import SentenceTransformer


def get_city_categories_text(city_id: int) -> str:
    """
    Récupère toutes les catégories distinctes d'une ville et les retourne
    sous forme de texte concaténé avec des espaces.
    
    Args:
        city_id: L'ID de la ville dans la base de données
        
    Returns:
        Une chaîne contenant toutes les catégories séparées par des espaces
        Exemple: "plage restaurant shopping musée"
    """
    # Paramètres de connexion à PostgreSQL
    conn_params = {
        'dbname': 'cities',
        'user': 'postgres',
        'password': 'postgres',
        'host': 'localhost',
        'port': 5432
    }
    
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Requête SQL pour récupérer les catégories distinctes
        query = """
            SELECT DISTINCT c.name AS category_name
            FROM cities ci
            JOIN places p ON ci.id = p.city_id
            JOIN place_categories pc ON p.id = pc.place_id
            JOIN categories c ON pc.category_id = c.id
            WHERE ci.id = %s
            ORDER BY c.name;
        """
        
        # Exécution de la requête
        cursor.execute(query, (city_id,))
        
        # Récupération des résultats
        results = cursor.fetchall()
        
        # Extraction des noms de catégories et concaténation
        categories = [row[0] for row in results]
        categories_text = ' '.join(categories)
        
        # Fermeture des ressources
        cursor.close()
        conn.close()
        
        return categories_text
        
    except psycopg2.Error as e:
        print(f"Erreur de base de données: {e}")
        return ""
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        return ""


def generate_embedding_from_text(text: str) -> List[float]:
    """
    Génère un embedding (vecteur) à partir d'un texte en utilisant
    le modèle sentence-transformers "all-MiniLM-L6-v2".
    
    Args:
        text: Le texte à encoder (ex: "plage restaurant shopping musée")
        
    Returns:
        Une liste de floats représentant le vecteur d'embedding
    """
    try:
        # Chargement du modèle MiniLM
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding
        embedding = model.encode(text)
        
        # Conversion en liste Python
        return embedding.tolist()
        
    except Exception as e:
        print(f"Erreur lors de la génération de l'embedding: {e}")
        return []


def process_all_city_embeddings():
    """
    Parcourt tous les city_id de 1 à 200 et génère les embeddings
    pour chaque ville en se basant sur ses catégories.
    
    Les embeddings sont stockés dans la colonne 'embedding' de la table 'cities'.
    """
    # Paramètres de connexion à PostgreSQL
    conn_params = {
        'dbname': 'cities',
        'user': 'postgres',
        'password': 'postgres',
        'host': 'localhost',
        'port': 5432
    }
    
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Parcours de tous les city_id de 1 à 200
        for city_id in range(1, 201):
            try:
                # Récupération des catégories sous forme de texte
                categories_text = get_city_categories_text(city_id)
                
                # Si le texte est vide ou None, passer au suivant
                if not categories_text or categories_text.strip() == "":
                    print(f"City {city_id} : pas de catégories trouvées, ignoré")
                    continue
                
                # Génération de l'embedding en utilisant generate_embedding_from_text
                embedding = generate_embedding_from_text(categories_text)
                
                # Si l'embedding est vide, passer au suivant
                if not embedding:
                    print(f"City {city_id} : échec de génération de l'embedding")
                    continue
                
                # Mise à jour de la colonne embedding dans la table cities
                update_query = """
                    UPDATE cities 
                    SET embedding = %s 
                    WHERE id = %s;
                """
                cursor.execute(update_query, (embedding, city_id))
                conn.commit()
                
                # Log de confirmation
                print(f"City {city_id} : embedding updated ({len(embedding)} dims)")
                
            except Exception as e:
                print(f"City {city_id} : erreur - {e}")
                conn.rollback()
                continue
        
        # Fermeture des ressources
        cursor.close()
        conn.close()
        
        print("\n✓ Traitement terminé pour toutes les villes (1-200)")
        
    except psycopg2.Error as e:
        print(f"Erreur de connexion à la base de données: {e}")
    except Exception as e:
        print(f"Erreur inattendue: {e}")


# Exemple d'utilisation
if __name__ == "__main__":
    # Option 1 : Tester une seule ville
    # city_id = 1
    # categories_text = get_city_categories_text(city_id)
    # print(f"Catégories de la ville {city_id}: {categories_text}")
    # if categories_text:
    #     embedding = generate_embedding_from_text(categories_text)
    #     print(f"\nEmbedding généré (dimension: {len(embedding)})")
    #     print(f"Premiers éléments: {embedding[:5]}")
    
    # Option 2 : Traiter toutes les villes (1 à 200)
    # print(get_city_categories_text(50))
=======
import psycopg2
from typing import Optional, List
from sentence_transformers import SentenceTransformer


def get_city_categories_text(city_id: int) -> str:
    """
    Récupère toutes les catégories distinctes d'une ville et les retourne
    sous forme de texte concaténé avec des espaces.
    
    Args:
        city_id: L'ID de la ville dans la base de données
        
    Returns:
        Une chaîne contenant toutes les catégories séparées par des espaces
        Exemple: "plage restaurant shopping musée"
    """
    # Paramètres de connexion à PostgreSQL
    conn_params = {
        'dbname': 'cities',
        'user': 'postgres',
        'password': 'postgres',
        'host': 'localhost',
        'port': 5432
    }
    
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Requête SQL pour récupérer les catégories distinctes
        query = """
            SELECT DISTINCT c.name AS category_name
            FROM cities ci
            JOIN places p ON ci.id = p.city_id
            JOIN place_categories pc ON p.id = pc.place_id
            JOIN categories c ON pc.category_id = c.id
            WHERE ci.id = %s
            ORDER BY c.name;
        """
        
        # Exécution de la requête
        cursor.execute(query, (city_id,))
        
        # Récupération des résultats
        results = cursor.fetchall()
        
        # Extraction des noms de catégories et concaténation
        categories = [row[0] for row in results]
        categories_text = ' '.join(categories)
        
        # Fermeture des ressources
        cursor.close()
        conn.close()
        
        return categories_text
        
    except psycopg2.Error as e:
        print(f"Erreur de base de données: {e}")
        return ""
    except Exception as e:
        print(f"Erreur inattendue: {e}")
        return ""


def generate_embedding_from_text(text: str) -> List[float]:
    """
    Génère un embedding (vecteur) à partir d'un texte en utilisant
    le modèle sentence-transformers "all-MiniLM-L6-v2".
    
    Args:
        text: Le texte à encoder (ex: "plage restaurant shopping musée")
        
    Returns:
        Une liste de floats représentant le vecteur d'embedding
    """
    try:
        # Chargement du modèle MiniLM
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Génération de l'embedding
        embedding = model.encode(text)
        
        # Conversion en liste Python
        return embedding.tolist()
        
    except Exception as e:
        print(f"Erreur lors de la génération de l'embedding: {e}")
        return []


def process_all_city_embeddings():
    """
    Parcourt tous les city_id de 1 à 200 et génère les embeddings
    pour chaque ville en se basant sur ses catégories.
    
    Les embeddings sont stockés dans la colonne 'embedding' de la table 'cities'.
    """
    # Paramètres de connexion à PostgreSQL
    conn_params = {
        'dbname': 'cities',
        'user': 'postgres',
        'password': 'postgres',
        'host': 'localhost',
        'port': 5432
    }
    
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Parcours de tous les city_id de 1 à 200
        for city_id in range(1, 201):
            try:
                # Récupération des catégories sous forme de texte
                categories_text = get_city_categories_text(city_id)
                
                # Si le texte est vide ou None, passer au suivant
                if not categories_text or categories_text.strip() == "":
                    print(f"City {city_id} : pas de catégories trouvées, ignoré")
                    continue
                
                # Génération de l'embedding en utilisant generate_embedding_from_text
                embedding = generate_embedding_from_text(categories_text)
                
                # Si l'embedding est vide, passer au suivant
                if not embedding:
                    print(f"City {city_id} : échec de génération de l'embedding")
                    continue
                
                # Mise à jour de la colonne embedding dans la table cities
                update_query = """
                    UPDATE cities 
                    SET embedding = %s 
                    WHERE id = %s;
                """
                cursor.execute(update_query, (embedding, city_id))
                conn.commit()
                
                # Log de confirmation
                print(f"City {city_id} : embedding updated ({len(embedding)} dims)")
                
            except Exception as e:
                print(f"City {city_id} : erreur - {e}")
                conn.rollback()
                continue
        
        # Fermeture des ressources
        cursor.close()
        conn.close()
        
        print("\n✓ Traitement terminé pour toutes les villes (1-200)")
        
    except psycopg2.Error as e:
        print(f"Erreur de connexion à la base de données: {e}")
    except Exception as e:
        print(f"Erreur inattendue: {e}")


# Exemple d'utilisation
if __name__ == "__main__":
    # Option 1 : Tester une seule ville
    # city_id = 1
    # categories_text = get_city_categories_text(city_id)
    # print(f"Catégories de la ville {city_id}: {categories_text}")
    # if categories_text:
    #     embedding = generate_embedding_from_text(categories_text)
    #     print(f"\nEmbedding généré (dimension: {len(embedding)})")
    #     print(f"Premiers éléments: {embedding[:5]}")
    
    # Option 2 : Traiter toutes les villes (1 à 200)
    # print(get_city_categories_text(50))
>>>>>>> main
    print(generate_embedding_from_text("Luxor is a great choice for travelers seeking historical heritage, landmarks like archaeological site, ruines, and memorial, and memorials and restaurants serving arab and international cuisine."))  # Test de la fonction avant le traitement en masse