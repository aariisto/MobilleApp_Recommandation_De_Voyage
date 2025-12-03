import json
from pathlib import Path

# Charger le seed géocodé
base = Path(__file__).resolve().parents[2]
path = base / "data" / "cities_geocoded_pois.json"

data = json.load(open(path))

unique_tags = set()

for city in data:
    for poi in city.get("pois", []):
        for tag in poi.get("categories", []):
            unique_tags.add(tag)

# Résultat trié
tags_sorted = sorted(unique_tags)

print(f"Nombre total de tags : {len(tags_sorted)}\n")

for t in tags_sorted[:50]:
    print(t)

# Sauvegarde JSON
out_path = base / "js" / "recoEngine" / "tag_index.json"
json.dump(tags_sorted, open(out_path, "w"), indent=2)

print(f"\n✓ tag_index.json généré dans {out_path}")
