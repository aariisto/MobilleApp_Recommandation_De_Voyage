import psycopg2
from psycopg2 import OperationalError
import json


def test_connection():
    """
    Teste la connexion à PostgreSQL
    """
    try:
        # Paramètres de connexion - à adapter selon votre configuration
        connection = psycopg2.connect(
            host="localhost",
            database="votre_base",
            user="votre_utilisateur",
            password="votre_mot_de_passe",
            port="5432"
        )
        
        # Créer un curseur pour exécuter des requêtes
        cursor = connection.cursor()
        
        # Exécuter une requête simple pour vérifier la connexion
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        
        print("✓ Connexion réussie à PostgreSQL!")
        print(f"Version de la base de données: {db_version[0]}")
        
        # Fermer le curseur et la connexion
        cursor.close()
        connection.close()
        print("✓ Connexion fermée correctement")
        
        return True
        
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False


def insert_countries_from_json(json_file_path, db_config):
    """
    Parcourt le fichier JSON et insère les pays dans la table countries sans duplication.
    
    Args:
        json_file_path (str): Chemin vers le fichier JSON
        db_config (dict): Configuration de la base de données
                         {'host': ..., 'database': ..., 'user': ..., 'password': ..., 'port': ...}
    
    Returns:
        bool: True si l'insertion réussit, False sinon
    """
    try:
        # Connexion à PostgreSQL
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        
        # Lire le fichier JSON
        print(f"📖 Lecture du fichier {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extraire les pays uniques
        countries = set()
        for city_data in data:
            if 'country' in city_data and city_data['country']:
                countries.add(city_data['country'])
        
        print(f"📊 {len(countries)} pays uniques trouvés: {sorted(countries)}")
        
        # Insérer les pays dans la base de données
        inserted_count = 0
        skipped_count = 0
        
        for country in sorted(countries):
            try:
                # Utiliser INSERT ... ON CONFLICT pour éviter les doublons
                cursor.execute(
                    "INSERT INTO countries (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id;",
                    (country,)
                )
                result = cursor.fetchone()
                
                if result:
                    inserted_count += 1
                    print(f"  ✓ Inséré: {country} (ID: {result[0]})")
                else:
                    skipped_count += 1
                    print(f"  ⊘ Déjà existant: {country}")
                    
            except Exception as e:
                print(f"  ✗ Erreur lors de l'insertion de '{country}': {e}")
                connection.rollback()
                continue
        
        # Valider les changements
        connection.commit()
        
        print(f"\n{'='*50}")
        print(f"✓ Insertion terminée!")
        print(f"  • {inserted_count} pays insérés")
        print(f"  • {skipped_count} pays déjà existants")
        print(f"{'='*50}")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        return True
        
    except FileNotFoundError:
        print(f"✗ Fichier non trouvé: {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Erreur lors de la lecture du JSON: {e}")
        return False
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False


def insert_cities_from_json(json_file_path, db_config):
    """
    Parcourt le fichier JSON et insère les villes dans la table cities 
    en les associant avec leur pays via country_id.
    
    Args:
        json_file_path (str): Chemin vers le fichier JSON
        db_config (dict): Configuration de la base de données
    
    Returns:
        bool: True si l'insertion réussit, False sinon
    """
    try:
        # Connexion à PostgreSQL
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        
        # Lire le fichier JSON
        print(f"📖 Lecture du fichier {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Récupérer tous les pays avec leurs IDs depuis la base de données
        cursor.execute("SELECT id, name FROM countries;")
        countries_map = {name: id for id, name in cursor.fetchall()}
        print(f"📊 {len(countries_map)} pays trouvés dans la base de données")
        
        # Insérer les villes
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        
        for city_data in data:
            # Vérifier que les données nécessaires sont présentes
            if not all(key in city_data for key in ['country', 'city', 'lat', 'lon']):
                continue
            
            country_name = city_data['country']
            city_name = city_data['city']
            lat = city_data['lat']
            lon = city_data['lon']
            
            # Vérifier que le pays existe dans la base
            if country_name not in countries_map:
                print(f"  ⚠️ Pays '{country_name}' non trouvé pour la ville '{city_name}'")
                error_count += 1
                continue
            
            country_id = countries_map[country_name]
            
            try:
                # Vérifier si la ville existe déjà (même nom et même pays)
                cursor.execute(
                    "SELECT id FROM cities WHERE name = %s AND country_id = %s;",
                    (city_name, country_id)
                )
                existing = cursor.fetchone()
                
                if existing:
                    skipped_count += 1
                    print(f"  ⊘ Déjà existante: {city_name} ({country_name})")
                else:
                    # Insérer la nouvelle ville
                    cursor.execute(
                        "INSERT INTO cities (name, lat, lon, country_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                        (city_name, lat, lon, country_id)
                    )
                    city_id = cursor.fetchone()[0]
                    inserted_count += 1
                    print(f"  ✓ Insérée: {city_name} ({country_name}) - ID: {city_id}, Coordonnées: ({lat}, {lon})")
                    
            except Exception as e:
                print(f"  ✗ Erreur lors de l'insertion de '{city_name}': {e}")
                connection.rollback()
                error_count += 1
                continue
        
        # Valider les changements
        connection.commit()
        
        print(f"\n{'='*50}")
        print(f"✓ Insertion des villes terminée!")
        print(f"  • {inserted_count} villes insérées")
        print(f"  • {skipped_count} villes déjà existantes")
        print(f"  • {error_count} erreurs")
        print(f"{'='*50}")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        return True
        
    except FileNotFoundError:
        print(f"✗ Fichier non trouvé: {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Erreur lors de la lecture du JSON: {e}")
        return False
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False


def insert_categories_from_json(json_file_path, db_config):
    """
    Parcourt le fichier categories.json et insère les catégories dans la table categories
    en respectant la hiérarchie parent-enfant (ex: "catering" -> "catering.restaurant" -> "catering.restaurant.french").
    
    Args:
        json_file_path (str): Chemin vers le fichier categories.json
        db_config (dict): Configuration de la base de données
    
    Returns:
        bool: True si l'insertion réussit, False sinon
    """
    try:
        # Connexion à PostgreSQL
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        
        # Lire le fichier JSON
        print(f"📖 Lecture du fichier {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        categories_list = data.get('categories_simple', [])
        print(f"📊 {len(categories_list)} catégories trouvées")
        
        # Map pour stocker les catégories déjà insérées {nom: id}
        categories_map = {}
        
        # Récupérer les catégories existantes dans la base
        cursor.execute("SELECT id, name FROM categories;")
        for cat_id, cat_name in cursor.fetchall():
            categories_map[cat_name] = cat_id
        
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        
        # Trier les catégories par nombre de niveaux (du parent vers l'enfant)
        # Ex: "catering" (1 niveau) avant "catering.restaurant" (2 niveaux)
        sorted_categories = sorted(categories_list, key=lambda x: x.count('.'))
        
        for category_name in sorted_categories:
            try:
                # Vérifier si la catégorie existe déjà
                if category_name in categories_map:
                    skipped_count += 1
                    print(f"  ⊘ Déjà existante: {category_name}")
                    continue
                
                # Déterminer le parent_id
                parent_id = None
                
                # Si la catégorie a un point, elle a un parent
                if '.' in category_name:
                    # Le parent est tout ce qui précède le dernier point
                    # Ex: "catering.restaurant.french" -> parent = "catering.restaurant"
                    parent_name = category_name.rsplit('.', 1)[0]
                    
                    if parent_name in categories_map:
                        parent_id = categories_map[parent_name]
                    else:
                        print(f"  ⚠️ Parent '{parent_name}' non trouvé pour '{category_name}'")
                        error_count += 1
                        continue
                
                # Insérer la catégorie
                cursor.execute(
                    "INSERT INTO categories (name, parent_id) VALUES (%s, %s) RETURNING id;",
                    (category_name, parent_id)
                )
                category_id = cursor.fetchone()[0]
                categories_map[category_name] = category_id
                inserted_count += 1
                
                if parent_id:
                    parent_name = category_name.rsplit('.', 1)[0]
                    print(f"  ✓ Insérée: {category_name} (ID: {category_id}, Parent: {parent_name})")
                else:
                    print(f"  ✓ Insérée: {category_name} (ID: {category_id}, Catégorie racine)")
                
            except Exception as e:
                print(f"  ✗ Erreur lors de l'insertion de '{category_name}': {e}")
                connection.rollback()
                error_count += 1
                continue
        
        # Valider les changements
        connection.commit()
        
        print(f"\n{'='*50}")
        print(f"✓ Insertion des catégories terminée!")
        print(f"  • {inserted_count} catégories insérées")
        print(f"  • {skipped_count} catégories déjà existantes")
        print(f"  • {error_count} erreurs")
        print(f"{'='*50}")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        return True
        
    except FileNotFoundError:
        print(f"✗ Fichier non trouvé: {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Erreur lors de la lecture du JSON: {e}")
        return False
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False


def insert_places_from_json(json_file_path, db_config):
    """
    Parcourt le fichier JSON et insère les POIs (points d'intérêt) dans la table places
    en les associant avec leur ville via city_id.
    
    Args:
        json_file_path (str): Chemin vers le fichier JSON
        db_config (dict): Configuration de la base de données
    
    Returns:
        bool: True si l'insertion réussit, False sinon
    """
    try:
        # Connexion à PostgreSQL
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        
        # Lire le fichier JSON
        print(f"📖 Lecture du fichier {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Récupérer toutes les villes avec leurs IDs depuis la base de données
        cursor.execute("SELECT id, name, country_id FROM cities;")
        cities_rows = cursor.fetchall()
        
        # Créer un map pour retrouver city_id à partir du nom de ville
        # Format: {(city_name, country_id): city_id}
        cursor.execute("SELECT id, name FROM countries;")
        countries_map = {name: id for id, name in cursor.fetchall()}
        
        cities_map = {}
        for city_id, city_name, country_id in cities_rows:
            cities_map[(city_name, country_id)] = city_id
        
        print(f"📊 {len(cities_map)} villes trouvées dans la base de données")
        
        # Insérer les POIs
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        total_pois = 0
        
        for city_data in data:
            # Vérifier que les données nécessaires sont présentes
            if not all(key in city_data for key in ['country', 'city', 'pois']):
                continue
            
            country_name = city_data['country']
            city_name = city_data['city']
            pois = city_data.get('pois', [])
            
            # Vérifier que le pays et la ville existent
            if country_name not in countries_map:
                print(f"  ⚠️ Pays '{country_name}' non trouvé")
                continue
            
            country_id = countries_map[country_name]
            city_key = (city_name, country_id)
            
            if city_key not in cities_map:
                print(f"  ⚠️ Ville '{city_name}' ({country_name}) non trouvée dans la base")
                continue
            
            city_id = cities_map[city_key]
            
            print(f"\n  📍 Traitement de {city_name} ({country_name}) - {len(pois)} POIs")
            total_pois += len(pois)
            
            for poi in pois:
                # Vérifier que le POI a les informations nécessaires
                if not all(key in poi for key in ['name', 'lat', 'lon']):
                    error_count += 1
                    continue
                
                poi_name = poi['name']
                poi_lat = poi['lat']
                poi_lon = poi['lon']
                
                try:
                    # Vérifier si le POI existe déjà (même nom, même ville)
                    cursor.execute(
                        "SELECT id FROM places WHERE name = %s AND city_id = %s;",
                        (poi_name, city_id)
                    )
                    existing = cursor.fetchone()
                    
                    if existing:
                        skipped_count += 1
                    else:
                        # Insérer le nouveau POI
                        cursor.execute(
                            "INSERT INTO places (name, lat, lon, city_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                            (poi_name, poi_lat, poi_lon, city_id)
                        )
                        place_id = cursor.fetchone()[0]
                        inserted_count += 1
                        
                        if inserted_count % 100 == 0:
                            print(f"    ✓ {inserted_count} POIs insérés...")
                        
                except Exception as e:
                    print(f"    ✗ Erreur lors de l'insertion de '{poi_name}': {e}")
                    connection.rollback()
                    error_count += 1
                    continue
            
            # Commit après chaque ville pour éviter de perdre tout en cas d'erreur
            connection.commit()
        
        print(f"\n{'='*50}")
        print(f"✓ Insertion des POIs terminée!")
        print(f"  • {total_pois} POIs totaux trouvés")
        print(f"  • {inserted_count} POIs insérés")
        print(f"  • {skipped_count} POIs déjà existants")
        print(f"  • {error_count} erreurs")
        print(f"{'='*50}")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        return True
        
    except FileNotFoundError:
        print(f"✗ Fichier non trouvé: {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Erreur lors de la lecture du JSON: {e}")
        return False
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False


def insert_place_categories_from_json(json_file_path, db_config):
    """
    Parcourt le fichier JSON et insère les associations entre places et catégories
    dans la table place_categories. Ignore les catégories qui n'existent pas dans la table categories.
    
    Args:
        json_file_path (str): Chemin vers le fichier JSON
        db_config (dict): Configuration de la base de données
    
    Returns:
        bool: True si l'insertion réussit, False sinon
    """
    try:
        # Connexion à PostgreSQL
        connection = psycopg2.connect(**db_config)
        cursor = connection.cursor()
        
        # Lire le fichier JSON
        print(f"📖 Lecture du fichier {json_file_path}...")
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Récupérer toutes les catégories avec leurs IDs depuis la base de données
        cursor.execute("SELECT id, name FROM categories;")
        categories_map = {name: id for id, name in cursor.fetchall()}
        print(f"📊 {len(categories_map)} catégories trouvées dans la base de données")
        
        # Récupérer toutes les villes et leurs pays pour retrouver les places
        cursor.execute("SELECT id, name FROM countries;")
        countries_map = {name: id for id, name in cursor.fetchall()}
        
        cursor.execute("SELECT id, name, country_id FROM cities;")
        cities_map = {}
        for city_id, city_name, country_id in cursor.fetchall():
            cities_map[(city_name, country_id)] = city_id
        
        # Compteurs
        inserted_count = 0
        skipped_count = 0
        error_count = 0
        category_not_found_count = 0
        total_associations = 0
        
        for city_data in data:
            # Vérifier que les données nécessaires sont présentes
            if not all(key in city_data for key in ['country', 'city', 'pois']):
                continue
            
            country_name = city_data['country']
            city_name = city_data['city']
            pois = city_data.get('pois', [])
            
            # Vérifier que le pays et la ville existent
            if country_name not in countries_map:
                continue
            
            country_id = countries_map[country_name]
            city_key = (city_name, country_id)
            
            if city_key not in cities_map:
                continue
            
            city_id = cities_map[city_key]
            
            print(f"\n  📍 Traitement des catégories pour {city_name} ({country_name}) - {len(pois)} POIs")
            
            for poi in pois:
                # Vérifier que le POI a un nom et des catégories
                if 'name' not in poi or 'categories' not in poi:
                    error_count += 1
                    continue
                
                poi_name = poi['name']
                poi_categories = poi['categories']
                
                # Récupérer l'ID du place depuis la base de données
                try:
                    cursor.execute(
                        "SELECT id FROM places WHERE name = %s AND city_id = %s;",
                        (poi_name, city_id)
                    )
                    place_result = cursor.fetchone()
                    
                    if not place_result:
                        error_count += 1
                        continue
                    
                    place_id = place_result[0]
                    
                    # Insérer chaque catégorie du POI
                    for category_name in poi_categories:
                        total_associations += 1
                        
                        # Vérifier si la catégorie existe dans la base
                        if category_name not in categories_map:
                            category_not_found_count += 1
                            continue
                        
                        category_id = categories_map[category_name]
                        
                        try:
                            # Vérifier si l'association existe déjà
                            cursor.execute(
                                "SELECT 1 FROM place_categories WHERE place_id = %s AND category_id = %s;",
                                (place_id, category_id)
                            )
                            existing = cursor.fetchone()
                            
                            if existing:
                                skipped_count += 1
                            else:
                                # Insérer la nouvelle association
                                cursor.execute(
                                    "INSERT INTO place_categories (place_id, category_id) VALUES (%s, %s);",
                                    (place_id, category_id)
                                )
                                inserted_count += 1
                                
                                if inserted_count % 500 == 0:
                                    print(f"    ✓ {inserted_count} associations insérées...")
                        
                        except Exception as e:
                            print(f"    ✗ Erreur lors de l'insertion de l'association ({poi_name} - {category_name}): {e}")
                            connection.rollback()
                            error_count += 1
                            continue
                
                except Exception as e:
                    print(f"    ✗ Erreur lors du traitement de '{poi_name}': {e}")
                    error_count += 1
                    continue
            
            # Commit après chaque ville pour éviter de perdre tout en cas d'erreur
            connection.commit()
        
        print(f"\n{'='*50}")
        print(f"✓ Insertion des associations place-catégories terminée!")
        print(f"  • {total_associations} associations totales trouvées")
        print(f"  • {inserted_count} associations insérées")
        print(f"  • {skipped_count} associations déjà existantes")
        print(f"  • {category_not_found_count} catégories non trouvées (ignorées)")
        print(f"  • {error_count} erreurs")
        print(f"{'='*50}")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        return True
        
    except FileNotFoundError:
        print(f"✗ Fichier non trouvé: {json_file_path}")
        return False
    except json.JSONDecodeError as e:
        print(f"✗ Erreur lors de la lecture du JSON: {e}")
        return False
    except OperationalError as e:
        print(f"✗ Erreur de connexion à PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False

if __name__ == "__main__":
    # Configuration de la base de données
    db_config = {
        'host': 'localhost',
        'database': 'cities',
        'user': 'postgres',
        'password': 'postgres',
        'port': '5432'
    }
    
    # Chemins vers les fichiers JSON
    cities_json_file = r'c:\Users\yanne\OneDrive\Bureau\SAE_BUT3\Traitement_donnee\cities_geocoded_all.json'
    categories_json_file = r'c:\Users\yanne\OneDrive\Bureau\SAE_BUT3\Traitement_donnee\categories.json'
  
    
    print("="*50)
    print("INSERTION DES DONNÉES DANS LA BASE")
    print("="*50)
    print()
    
    # 1. Insérer les pays
    print("Étape 1: Insertion des pays")
    print("-"*50)
    insert_countries_from_json(cities_json_file, db_config)
    print()
    
    # 2. Insérer les villes
    print("Étape 2: Insertion des villes")
    print("-"*50)
    insert_cities_from_json(cities_json_file, db_config)
    print()
    
    # 3. Insérer les catégories
    print("Étape 3: Insertion des catégories")
    print("-"*50)
    insert_categories_from_json(categories_json_file, db_config)
    print()
    
    # 4. Insérer les POIs (places)
    print("Étape 4: Insertion des POIs (points d'intérêt)")
    print("-"*50)
    insert_places_from_json(cities_json_file, db_config)
    print()
    
    # 5. Insérer les associations place-catégories
    print("Étape 5: Insertion des associations place-catégories")
    print("-"*50)
    insert_place_categories_from_json(cities_json_file, db_config)
    print()