import json

# Fichiers à fusionner
FILE1 = "cities_geocoded_pois.json"
FILE2 = "cities_geocoded_poi_part2.json"
OUTPUT = "cities_geocoded_all.json"

print("🔄 Fusion des fichiers JSON...")

# Charger les 2 fichiers
with open(FILE1, 'r', encoding='utf-8') as f:
    cities1 = json.load(f)
    
with open(FILE2, 'r', encoding='utf-8') as f:
    cities2 = json.load(f)

print(f"  📁 {FILE1}: {len(cities1)} villes")
print(f"  📁 {FILE2}: {len(cities2)} villes")

# Fusionner les 2 listes
all_cities = cities1 + cities2

# Dédupliquer par (country, city) au cas où
seen = set()
unique_cities = []
duplicates = 0

for city_data in all_cities:
    key = (city_data['country'], city_data['city'])
    if key not in seen:
        seen.add(key)
        unique_cities.append(city_data)
    else:
        duplicates += 1
        print(f"  ⚠️  Doublon ignoré: {city_data['city']}, {city_data['country']}")

# Sauvegarder
with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(unique_cities, f, indent=2, ensure_ascii=False)

print(f"\n✅ Fusion terminée !")
print(f"  📊 Total: {len(unique_cities)} villes uniques")
print(f"  🗑️  Doublons retirés: {duplicates}")
print(f"  💾 Fichier créé: {OUTPUT}")
