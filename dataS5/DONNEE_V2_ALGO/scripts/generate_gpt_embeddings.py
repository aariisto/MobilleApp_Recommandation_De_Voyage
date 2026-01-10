import psycopg2
import json
import os
from typing import List
from sentence_transformers import SentenceTransformer


def generate_embedding_from_text(text: str) -> List[float]:
    """
    Génère un embedding (vecteur) à partir d'un texte en utilisant
    le modèle sentence-transformers "all-MiniLM-L6-v2".
    
    Args:
        text: Le texte à encoder (categories_gpt)
        
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


def process_cities_gpt_embeddings():
    """
    Lit cities_categories_gpt.json et génère les embeddings pour chaque
    ville en se basant sur le texte categories_gpt.
    
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
    
    # Chemin vers le fichier JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    json_path = os.path.join(base_dir, "cities_categories_gpt.json")
    
    try:
        # Lecture du fichier JSON
        with open(json_path, "r", encoding="utf-8") as f:
            cities_data = json.load(f)
        
        print(f"✓ Fichier JSON lu: {len(cities_data)} villes")
        
        # Connexion à la base de données
        conn = psycopg2.connect(**conn_params)
        cursor = conn.cursor()
        
        # Compteurs pour les statistiques
        success_count = 0
        error_count = 0
        
        # Parcours de toutes les villes dans le JSON
        for city_data in cities_data:
            try:
                city_id = city_data.get("id")
                city_name = city_data.get("name", "Unknown")
                categories_gpt = city_data.get("categories_gpt", "")
                
                # Validation des données
                if not city_id or not categories_gpt.strip():
                    print(f"City {city_id} ({city_name}) : données manquantes, ignoré")
                    error_count += 1
                    continue
                
                # Génération de l'embedding à partir du texte categories_gpt
                embedding = generate_embedding_from_text(categories_gpt)
                
                # Si l'embedding est vide, passer au suivant
                if not embedding:
                    print(f"City {city_id} ({city_name}) : échec de génération de l'embedding")
                    error_count += 1
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
                print(f"✓ City {city_id} ({city_name}) : embedding updated ({len(embedding)} dims)")
                success_count += 1
                
            except Exception as e:
                print(f"✗ City {city_id} ({city_name}) : erreur - {e}")
                conn.rollback()
                error_count += 1
                continue
        
        # Fermeture des ressources
        cursor.close()
        conn.close()
        
        # Statistiques finales
        print(f"\n=== RÉSULTATS ===")
        print(f"✓ Embeddings générés avec succès: {success_count}")
        print(f"✗ Erreurs: {error_count}")
        print(f"Total traité: {success_count + error_count}")
        print("✓ Traitement terminé")
        
    except FileNotFoundError:
        print(f"✗ Erreur : fichier {json_path} non trouvé")
    except json.JSONDecodeError as e:
        print(f"✗ Erreur de lecture JSON : {e}")
    except psycopg2.Error as e:
        print(f"✗ Erreur de connexion à la base de données : {e}")
    except Exception as e:
        print(f"✗ Erreur inattendue : {e}")


def test_embedding_generation():
    """
    Test rapide de la génération d'embedding avec un exemple de texte categories_gpt.
    """
    test_text = "Paris is a great choice for travelers seeking historical heritage, landmarks like archaeological site, castle, and cathedral, and religious sites, restaurants serving fish, french, and italian cuisine, and shopping malls."
    
    print("=== TEST D'EMBEDDING ===")
    print(f"Texte de test: {test_text[:100]}...")
    
    embedding = generate_embedding_from_text(test_text)
    
    if embedding:
        print(f"✓ Embedding généré avec succès")
        print(f"Dimension: {len(embedding)}")
        print(f"Premiers éléments: {embedding[:5]}")
        print(f"Type: {type(embedding[0])}")
    else:
        print("✗ Échec de génération de l'embedding")


# Exemple d'utilisation
if __name__ == "__main__":
    # Option 1 : Test rapide
    # test_embedding_generation()
    
    # Option 2 : Traiter toutes les villes du fichier cities_categories_gpt.json
    process_cities_gpt_embeddings()