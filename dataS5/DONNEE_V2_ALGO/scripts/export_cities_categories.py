import psycopg2
import json
import os
from collections import defaultdict

# Configuration de la base de données
db_config = {
    'host': 'localhost',
    'database': 'cities',
    'user': 'postgres',
    'password': 'postgres',
    'port': '5432'
}

try:
    # Connexion à la base de données
    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()
    print("✓ Connexion à la base de données réussie")
    
    # Requête pour récupérer villes et leurs catégories
    query = """
    SELECT DISTINCT
        c.id,
        c.name,
        cat.name as category_name
    FROM cities c
    LEFT JOIN places p ON c.id = p.city_id
    LEFT JOIN place_categories pc ON p.id = pc.place_id
    LEFT JOIN categories cat ON pc.category_id = cat.id
    ORDER BY c.id, cat.name
    """
    
    cursor.execute(query)
    results = cursor.fetchall()
    print(f"✓ Requête exécutée ({len(results)} lignes)")
    
    # Traitement des résultats
    cities_dict = defaultdict(lambda: {"id": None, "name": None, "categories": set()})
    
    for city_id, city_name, category_name in results:
        if city_id not in cities_dict:
            cities_dict[city_id]["id"] = city_id
            cities_dict[city_id]["name"] = city_name
        
        # Ajouter la catégorie si elle existe (pas de None)
        if category_name:
            cities_dict[city_id]["categories"].add(category_name)
    
    # Convertir les sets en listes et créer la structure finale
    cities_list = []
    for city_id in sorted(cities_dict.keys()):
        city_data = cities_dict[city_id]
        cities_list.append({
            "id": city_data["id"],
            "name": city_data["name"],
            "categories": sorted(list(city_data["categories"]))
        })
    
    # Sauvegarder en JSON
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    output_file = os.path.join(parent_dir, "cities_categories.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cities_list, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Fichier '{output_file}' créé avec succès")
    print(f"✓ {len(cities_list)} villes exportées")
    
    # Afficher un aperçu
    if cities_list:
        print("\nAperçu des premiers résultats:")
        for city in cities_list[:3]:
            print(f"  - ID: {city['id']}, Nom: {city['name']}, Catégories: {len(city['categories'])}")
    
    cursor.close()
    conn.close()
    print("\n✓ Déconnexion réussie")

except (Exception, psycopg2.Error) as error:
    print(f"✗ Erreur: {error}")
finally:
    if conn:
        cursor.close()
        conn.close()
