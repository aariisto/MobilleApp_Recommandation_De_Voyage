import json
import psycopg2

# Chemin du fichier JSON
json_file = "c:/Users/yanne/OneDrive/Bureau/SAE_BUT3/SAEE_BUT/dataS5/DONNEE_V2_ALGO/cities_categories_gpt_fr.json"

# Charger les données JSON
with open(json_file, 'r', encoding='utf-8') as f:
    cities = json.load(f)

# Connexion à PostgreSQL
try:
    conn = psycopg2.connect(
        host="localhost",
        database="cities",
        user="postgres",
        password="postgres",
        port="5432"
    )
    cursor = conn.cursor()
    print("✅ Connexion à PostgreSQL réussie!")

    # Mettre à jour les descriptions
    updated_count = 0
    for city in cities:
        cursor.execute(
            "UPDATE cities SET description = %s WHERE id = %s",
            (city["categories_gpt"], city["id"])
        )
        updated_count += cursor.rowcount

    # Valider et fermer
    conn.commit()
    cursor.close()
    conn.close()

    print(f"✅ {updated_count} descriptions mises à jour dans PostgreSQL!")

except psycopg2.Error as e:
    print(f"❌ Erreur PostgreSQL: {e}")
