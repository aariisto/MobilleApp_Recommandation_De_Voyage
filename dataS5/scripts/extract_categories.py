import json
from collections import Counter

INPUT_FILE = "cities_geocoded_all.json"
OUTPUT_FILE = "categories.json"

print("🔍 Extraction des catégories...\n")

# Charger le fichier JSON
with open(INPUT_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"📊 {len(data)} villes chargées")

# Extraire toutes les catégories
all_categories = []
cities_with_pois = 0
total_pois = 0

for city in data:
    pois = city.get('pois', [])
    if pois:
        cities_with_pois += 1
        total_pois += len(pois)
        
        for poi in pois:
            categories = poi.get('categories', [])
            all_categories.extend(categories)

print(f"🏙️  {cities_with_pois} villes avec des POIs")
print(f"📍 {total_pois} POIs au total")
print(f"🏷️  {len(all_categories)} catégories (avec doublons)\n")

# Compter les occurrences
category_counter = Counter(all_categories)

# Créer la liste unique triée
unique_categories = sorted(category_counter.keys())

print(f"✅ {len(unique_categories)} catégories uniques trouvées\n")

# Créer le fichier de sortie avec statistiques
output_data = {
    "total_categories": len(unique_categories),
    "total_occurrences": len(all_categories),
    "categories": [
        {
            "name": cat,
            "count": category_counter[cat]
        }
        for cat in sorted(category_counter.keys(), key=lambda x: category_counter[x], reverse=True)
    ],
    "categories_simple": unique_categories
}

# Sauvegarder
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"💾 Fichier créé: {OUTPUT_FILE}\n")

# Afficher les 20 catégories les plus fréquentes
print("📈 Top 20 catégories les plus fréquentes:")
print("-" * 60)
for i, (cat, count) in enumerate(category_counter.most_common(20), 1):
    print(f"{i:2d}. {cat:50s} {count:6,d}")

print("\n" + "=" * 60)
print(f"✅ Terminé ! {len(unique_categories)} catégories sauvegardées dans {OUTPUT_FILE}")
