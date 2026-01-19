<<<<<<< HEAD
"""
Module de calcul des scores de pénalité basés sur les éléments détestés par l'utilisateur.
"""

from typing import List, Dict, Optional
import psycopg2
import psycopg2.extras


def calculate_penalty_score(city_tags: List[str], user_dislikes: Dict[str, int]) -> float:
    """
    Calcule un score de pénalité basé sur les éléments que l'utilisateur déteste.
    
    Args:
        city_tags (List[str]): Liste des catégories de la ville 
                              (ex: ['adult.nightclub', 'museum', 'heritage.unesco'])
        user_dislikes (Dict[str, int]): Dictionnaire des catégories détestées avec poids
                                       Clé: catégorie détestée
                                       Valeur: poids du dégoût (2-5)
                                       Exemple: {'adult.nightclub': 5, 'parking': 2}
    
    Returns:
        float: Score de pénalité à soustraire du score de similarité global
               Formule: Penalty += 0.05 × Poids pour chaque catégorie détestée présente
    
    Example:
        >>> city_tags = ['adult.nightclub', 'museum', 'heritage.unesco']
        >>> user_dislikes = {'adult.nightclub': 5, 'parking': 2}
        >>> calculate_penalty_score(city_tags, user_dislikes)
        0.25
        # Calcul: adult.nightclub présent → 0.05 × 5 = 0.25
        #         parking absent → pas de pénalité
    """
    
    # Vérification des entrées
    if not city_tags or not user_dislikes:
        return 0.0
    
    # Convertir city_tags en set pour une recherche O(1) efficace
    city_tags_set = set(city_tags)
    
    penalty = 0.0
    
    # Parcourir chaque catégorie détestée
    for disliked_category, weight in user_dislikes.items():
        # Vérifier si la catégorie détestée est présente dans la ville
        if disliked_category in city_tags_set:
            # Appliquer la formule : Penalty += 0.05 × Poids
            penalty += 0.05 * weight
    
    return penalty


def get_city_categories_from_db(city_id: int, conn_params: Dict[str, str]) -> List[str]:
    """
    Récupère les catégories d'une ville depuis la base de données PostgreSQL.
    
    Args:
        city_id (int): ID de la ville dans la base de données
        conn_params (Dict[str, str]): Paramètres de connexion PostgreSQL
                                     {'host': 'localhost', 'dbname': 'cities', 
                                      'user': 'postgres', 'password': 'postgres', 'port': 5432}
    
    Returns:
        List[str]: Liste des catégories de la ville
                  (ex: ['heritage.unesco', 'museum', 'restaurant.french'])
    
    Example:
        >>> conn_params = {"host": "localhost", "dbname": "cities", "user": "postgres", "password": "postgres"}
        >>> categories = get_city_categories_from_db(1, conn_params)
        >>> print(categories)
        ['heritage.unesco', 'tourism.sights.castle', 'catering.restaurant.french']
    """
    
    try:
        # Connexion à la base de données
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                
                # Requête pour récupérer toutes les catégories d'une ville
                query = """
                    SELECT DISTINCT c.name as category_name
                    FROM cities ci
                    JOIN places p ON p.city_id = ci.id
                    JOIN place_categories pc ON pc.place_id = p.id
                    JOIN categories c ON c.id = pc.category_id
                    WHERE ci.id = %s
                    ORDER BY c.name
                """
                
                cursor.execute(query, (city_id,))
                results = cursor.fetchall()
                
                # Extraire les noms de catégories
                categories = [row['category_name'] for row in results]
                
                return categories
                
    except psycopg2.Error as e:
        print(f"Erreur PostgreSQL lors de la récupération des catégories pour la ville {city_id}: {e}")
        return []
    except Exception as e:
        print(f"Erreur lors de la récupération des catégories pour la ville {city_id}: {e}")
        return []


def calculate_penalty_for_city(city_id: int, user_dislikes: Dict[str, int], conn_params: Dict[str, str]) -> float:
    """
    Calcule directement le score de pénalité pour une ville depuis la base de données.
    
    Args:
        city_id (int): ID de la ville
        user_dislikes (Dict[str, int]): Dictionnaire des catégories détestées avec poids
        conn_params (Dict[str, str]): Paramètres de connexion PostgreSQL
    
    Returns:
        float: Score de pénalité calculé
    
    Example:
        >>> user_dislikes = {'adult.nightclub': 5, 'parking': 2}
        >>> penalty = calculate_penalty_for_city(1, user_dislikes, conn_params)
        >>> print(f"Pénalité pour la ville ID 1: {penalty}")
    """
    
    # Récupérer les catégories de la ville
    city_tags = get_city_categories_from_db(city_id, conn_params)
    
    if not city_tags:
        return 0.0
    
    # Calculer la pénalité
    return calculate_penalty_score(city_tags, user_dislikes)


# Tests unitaires
if __name__ == "__main__":
    # Test 1: Cas basique
    city_tags_1 = ['adult.nightclub', 'museum', 'heritage.unesco']
    user_dislikes_1 = {'adult.nightclub': 5, 'parking': 2}
    penalty_1 = calculate_penalty_score(city_tags_1, user_dislikes_1)
    print(f"Test 1 - Pénalité: {penalty_1}")
    print(f"  Attendu: 0.25 (0.05 × 5)")
    print(f"  Résultat: {penalty_1 == 0.25}")
    
    # Test 2: Aucune catégorie détestée présente
    city_tags_2 = ['museum', 'heritage.unesco', 'restaurant']
    user_dislikes_2 = {'adult.nightclub': 5, 'parking': 3}
    penalty_2 = calculate_penalty_score(city_tags_2, user_dislikes_2)
    print(f"\nTest 2 - Pénalité: {penalty_2}")
    print(f"  Attendu: 0.0 (aucune correspondance)")
    print(f"  Résultat: {penalty_2 == 0.0}")
    
    # Test 3: Plusieurs catégories détestées présentes
    city_tags_3 = ['adult.nightclub', 'parking', 'museum', 'commercial.shopping_mall']
    user_dislikes_3 = {'adult.nightclub': 5, 'parking': 2, 'commercial.shopping_mall': 4}
    penalty_3 = calculate_penalty_score(city_tags_3, user_dislikes_3)
    expected_3 = 0.05 * 5 + 0.05 * 2 + 0.05 * 4  # 0.25 + 0.10 + 0.20 = 0.55
    print(f"\nTest 3 - Pénalité: {penalty_3}")
    print(f"  Attendu: {expected_3} (0.05×5 + 0.05×2 + 0.05×4)")
    print(f"  Résultat: {penalty_3 == expected_3}")
    
    # Test 4: Validation des poids
    user_dislikes_invalid = {'adult.nightclub': 10, 'parking': 1}
    user_dislikes_valid = validate_user_dislikes(user_dislikes_invalid)
    print(f"\nTest 4 - Validation des poids:")
    print(f"  Entrée: {user_dislikes_invalid}")
    print(f"  Validé: {user_dislikes_valid}")
    print(f"  Attendu: {{'adult.nightclub': 5, 'parking': 2}}")
    
    # Test 5: Test de connexion à la base de données (optionnel)
    print(f"\nTest 5 - Test DB (décommentez pour tester avec votre BD):")
    print(f"  # conn_params = {{'host': 'localhost', 'dbname': 'cities', 'user': 'postgres', 'password': 'postgres', 'port': 5432}}")
    print(f"  # categories = get_city_categories_from_db(1, conn_params)")
    print(f"  # print(f'Catégories ville ID 1: {{categories}}')")
    print(f"  # penalty = calculate_penalty_for_city(1, {{'adult.nightclub': 5}}, conn_params)")
    print(f"  # print(f'Pénalité ville ID 1: {{penalty}}')")
    city_tags_3 = ['adult.nightclub', 'parking', 'museum', 'commercial.shopping_mall']
    user_dislikes_3 = {'adult.nightclub': 5, 'parking': 2, 'commercial.shopping_mall': 4}
    penalty_3 = calculate_penalty_score(city_tags_3, user_dislikes_3)
    expected_3 = 0.05 * 5 + 0.05 * 2 + 0.05 * 4  # 0.25 + 0.10 + 0.20 = 0.55
    print(f"\nTest 3 - Pénalité: {penalty_3}")
    print(f"  Attendu: {expected_3} (0.05×5 + 0.05×2 + 0.05×4)")
    print(f"  Résultat: {penalty_3 == expected_3}")
    
=======
"""
Module de calcul des scores de pénalité basés sur les éléments détestés par l'utilisateur.
"""

from typing import List, Dict, Optional
import psycopg2
import psycopg2.extras


def calculate_penalty_score(city_tags: List[str], user_dislikes: Dict[str, int]) -> float:
    """
    Calcule un score de pénalité basé sur les éléments que l'utilisateur déteste.
    
    Args:
        city_tags (List[str]): Liste des catégories de la ville 
                              (ex: ['adult.nightclub', 'museum', 'heritage.unesco'])
        user_dislikes (Dict[str, int]): Dictionnaire des catégories détestées avec poids
                                       Clé: catégorie détestée
                                       Valeur: poids du dégoût (2-5)
                                       Exemple: {'adult.nightclub': 5, 'parking': 2}
    
    Returns:
        float: Score de pénalité à soustraire du score de similarité global
               Formule: Penalty += 0.05 × Poids pour chaque catégorie détestée présente
    
    Example:
        >>> city_tags = ['adult.nightclub', 'museum', 'heritage.unesco']
        >>> user_dislikes = {'adult.nightclub': 5, 'parking': 2}
        >>> calculate_penalty_score(city_tags, user_dislikes)
        0.25
        # Calcul: adult.nightclub présent → 0.05 × 5 = 0.25
        #         parking absent → pas de pénalité
    """
    
    # Vérification des entrées
    if not city_tags or not user_dislikes:
        return 0.0
    
    # Convertir city_tags en set pour une recherche O(1) efficace
    city_tags_set = set(city_tags)
    
    penalty = 0.0
    
    # Parcourir chaque catégorie détestée
    for disliked_category, weight in user_dislikes.items():
        # Vérifier si la catégorie détestée est présente dans la ville
        if disliked_category in city_tags_set:
            # Appliquer la formule : Penalty += 0.05 × Poids
            penalty += 0.05 * weight
    
    return penalty


def get_city_categories_from_db(city_id: int, conn_params: Dict[str, str]) -> List[str]:
    """
    Récupère les catégories d'une ville depuis la base de données PostgreSQL.
    
    Args:
        city_id (int): ID de la ville dans la base de données
        conn_params (Dict[str, str]): Paramètres de connexion PostgreSQL
                                     {'host': 'localhost', 'dbname': 'cities', 
                                      'user': 'postgres', 'password': 'postgres', 'port': 5432}
    
    Returns:
        List[str]: Liste des catégories de la ville
                  (ex: ['heritage.unesco', 'museum', 'restaurant.french'])
    
    Example:
        >>> conn_params = {"host": "localhost", "dbname": "cities", "user": "postgres", "password": "postgres"}
        >>> categories = get_city_categories_from_db(1, conn_params)
        >>> print(categories)
        ['heritage.unesco', 'tourism.sights.castle', 'catering.restaurant.french']
    """
    
    try:
        # Connexion à la base de données
        with psycopg2.connect(**conn_params) as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                
                # Requête pour récupérer toutes les catégories d'une ville
                query = """
                    SELECT DISTINCT c.name as category_name
                    FROM cities ci
                    JOIN places p ON p.city_id = ci.id
                    JOIN place_categories pc ON pc.place_id = p.id
                    JOIN categories c ON c.id = pc.category_id
                    WHERE ci.id = %s
                    ORDER BY c.name
                """
                
                cursor.execute(query, (city_id,))
                results = cursor.fetchall()
                
                # Extraire les noms de catégories
                categories = [row['category_name'] for row in results]
                
                return categories
                
    except psycopg2.Error as e:
        print(f"Erreur PostgreSQL lors de la récupération des catégories pour la ville {city_id}: {e}")
        return []
    except Exception as e:
        print(f"Erreur lors de la récupération des catégories pour la ville {city_id}: {e}")
        return []


def calculate_penalty_for_city(city_id: int, user_dislikes: Dict[str, int], conn_params: Dict[str, str]) -> float:
    """
    Calcule directement le score de pénalité pour une ville depuis la base de données.
    
    Args:
        city_id (int): ID de la ville
        user_dislikes (Dict[str, int]): Dictionnaire des catégories détestées avec poids
        conn_params (Dict[str, str]): Paramètres de connexion PostgreSQL
    
    Returns:
        float: Score de pénalité calculé
    
    Example:
        >>> user_dislikes = {'adult.nightclub': 5, 'parking': 2}
        >>> penalty = calculate_penalty_for_city(1, user_dislikes, conn_params)
        >>> print(f"Pénalité pour la ville ID 1: {penalty}")
    """
    
    # Récupérer les catégories de la ville
    city_tags = get_city_categories_from_db(city_id, conn_params)
    
    if not city_tags:
        return 0.0
    
    # Calculer la pénalité
    return calculate_penalty_score(city_tags, user_dislikes)


# Tests unitaires
if __name__ == "__main__":
    # Test 1: Cas basique
    city_tags_1 = ['adult.nightclub', 'museum', 'heritage.unesco']
    user_dislikes_1 = {'adult.nightclub': 5, 'parking': 2}
    penalty_1 = calculate_penalty_score(city_tags_1, user_dislikes_1)
    print(f"Test 1 - Pénalité: {penalty_1}")
    print(f"  Attendu: 0.25 (0.05 × 5)")
    print(f"  Résultat: {penalty_1 == 0.25}")
    
    # Test 2: Aucune catégorie détestée présente
    city_tags_2 = ['museum', 'heritage.unesco', 'restaurant']
    user_dislikes_2 = {'adult.nightclub': 5, 'parking': 3}
    penalty_2 = calculate_penalty_score(city_tags_2, user_dislikes_2)
    print(f"\nTest 2 - Pénalité: {penalty_2}")
    print(f"  Attendu: 0.0 (aucune correspondance)")
    print(f"  Résultat: {penalty_2 == 0.0}")
    
    # Test 3: Plusieurs catégories détestées présentes
    city_tags_3 = ['adult.nightclub', 'parking', 'museum', 'commercial.shopping_mall']
    user_dislikes_3 = {'adult.nightclub': 5, 'parking': 2, 'commercial.shopping_mall': 4}
    penalty_3 = calculate_penalty_score(city_tags_3, user_dislikes_3)
    expected_3 = 0.05 * 5 + 0.05 * 2 + 0.05 * 4  # 0.25 + 0.10 + 0.20 = 0.55
    print(f"\nTest 3 - Pénalité: {penalty_3}")
    print(f"  Attendu: {expected_3} (0.05×5 + 0.05×2 + 0.05×4)")
    print(f"  Résultat: {penalty_3 == expected_3}")
    
    # Test 4: Validation des poids
    user_dislikes_invalid = {'adult.nightclub': 10, 'parking': 1}
    user_dislikes_valid = validate_user_dislikes(user_dislikes_invalid)
    print(f"\nTest 4 - Validation des poids:")
    print(f"  Entrée: {user_dislikes_invalid}")
    print(f"  Validé: {user_dislikes_valid}")
    print(f"  Attendu: {{'adult.nightclub': 5, 'parking': 2}}")
    
    # Test 5: Test de connexion à la base de données (optionnel)
    print(f"\nTest 5 - Test DB (décommentez pour tester avec votre BD):")
    print(f"  # conn_params = {{'host': 'localhost', 'dbname': 'cities', 'user': 'postgres', 'password': 'postgres', 'port': 5432}}")
    print(f"  # categories = get_city_categories_from_db(1, conn_params)")
    print(f"  # print(f'Catégories ville ID 1: {{categories}}')")
    print(f"  # penalty = calculate_penalty_for_city(1, {{'adult.nightclub': 5}}, conn_params)")
    print(f"  # print(f'Pénalité ville ID 1: {{penalty}}')")
    city_tags_3 = ['adult.nightclub', 'parking', 'museum', 'commercial.shopping_mall']
    user_dislikes_3 = {'adult.nightclub': 5, 'parking': 2, 'commercial.shopping_mall': 4}
    penalty_3 = calculate_penalty_score(city_tags_3, user_dislikes_3)
    expected_3 = 0.05 * 5 + 0.05 * 2 + 0.05 * 4  # 0.25 + 0.10 + 0.20 = 0.55
    print(f"\nTest 3 - Pénalité: {penalty_3}")
    print(f"  Attendu: {expected_3} (0.05×5 + 0.05×2 + 0.05×4)")
    print(f"  Résultat: {penalty_3 == expected_3}")
    
>>>>>>> main
