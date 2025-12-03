#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Analyse du seed de Dalla :
- statistiques sur les tags
- tags mappables vs non mappables
- détection des POI sans tags utiles
- préparation pour nettoyage niveau supérieur
"""

import json
from collections import Counter, defaultdict

# Importer DIM_TAGS et TAG_MAP depuis reco_engine.py si tu veux
# mais ici on les recopie pour être autonome

DIM_TAGS = [
    "museum", "art", "monument", "historical", "church",
    "attraction", "viewpoint",
    "park", "lake", "river", "mountain", "beach", "tropical",
    "hiking", "surfing", "ski", "cycling", "swimming",
    "restaurant", "cafe", "vegan", "local_food",
    "shopping", "mall", "market",
    "wifi", "accessible", "family_friendly",
    "cold", "warm"
]

TAG_MAP = {
    "entertainment.museum": "museum",
    "tourism.museum": "museum",
    "heritage": "historical",
    "tourism.attraction": "attraction",
    "tourism.sights": "viewpoint",
    "religion.place_of_worship": "church",
    "building.historic": "historical",

    "leisure.park": "park",
    "natural.lake": "lake",
    "natural.river": "river",
    "mountain": "mountain",
    "beach": "beach",
    "tropical": "tropical",

    "sport.hiking": "hiking",
    "sport.ski": "ski",
    "sport.surf": "surfing",

    "catering.restaurant": "restaurant",
    "catering.fast_food": "restaurant",
    "catering.cafe": "cafe",
    "vegetarian": "vegan",
    "local_food": "local_food",

    "commercial.shopping_mall": "mall",
    "shop": "shopping",
    "marketplace": "market",

    "internet_access.free": "wifi",
    "wheelchair.yes": "accessible",
    "family_friendly": "family_friendly",

    "cold": "cold",
    "warm": "warm"
}


def analyze_seed(path: str):
    print(f"=== Analyse du seed : {path} ===\n")
    data = json.load(open(path, "r"))

    all_raw_tags = Counter()
    mappable_tags = Counter()
    unmappable_tags = Counter()

    poi_without_valid_tags = 0
    total_poi = 0

    # analyse des POI
    for city in data:
        for poi in city.get("pois", []):
            total_poi += 1
            raw_tags = poi.get("categories", [])
            mapped = []

            for t in raw_tags:
                all_raw_tags[t] += 1

                if t in DIM_TAGS:  # déjà simplifié ?
                    mappable_tags[t] += 1
                    mapped.append(t)
                elif t in TAG_MAP:  # tag OSM mappable ?
                    mappable_tags[TAG_MAP[t]] += 1
                    mapped.append(TAG_MAP[t])
                else:
                    unmappable_tags[t] += 1

            if len(mapped) == 0:
                poi_without_valid_tags += 1

    print("---- Statistiques globales ----")
    print(f"Nombre total de POI : {total_poi}")
    print(f"POI sans tags exploitables (vecteurs vides) : {poi_without_valid_tags} "
          f"({poi_without_valid_tags/total_poi*100:.1f}%)")

    print("\n---- Top 30 tags RAW (non nettoyés) ----")
    for tag, count in all_raw_tags.most_common(30):
        print(f"{tag:30s} : {count}")

    print("\n---- Tags reconnus / mappés ----")
    for tag, count in mappable_tags.most_common(20):
        print(f"{tag:20s} : {count}")

    print("\n---- Tags non reconnus (PROBLÈMES) ----")
    for tag, count in unmappable_tags.most_common(30):
        print(f"{tag:30s} : {count}")

    print("\n=== Analyse terminée ===")


if __name__ == "__main__":
    analyze_seed("cities_geocoded_pois.json")
