#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
generate_city_types.py

Analyse cities_cleaned_geo.json et génère un fichier city_types.json
avec des tags "globaux" par ville (city_tags) basés sur :
- les POI (musées, restaurants, parcs, etc.)
- la latitude (climat : cold / warm / tropical)
- la présence de plages / montagne / ski
- la densité de certains types de lieux

Ce fichier sera ensuite fusionné avec le seed via un autre script.
"""

import json
from collections import Counter
from typing import List, Dict, Any

# Fichiers d'entrée / sortie
INPUT_SEED = "cities_cleaned_geo.json"
OUTPUT_CITY_TYPES = "city_types.json"


# --- Mapping / vocabulaire cohérent avec reco_engine.py ----------------------

DIM_TAGS = [
    # Culture / visite
    "museum", "art", "monument", "historical", "church",
    "attraction", "viewpoint",

    # Nature
    "park", "lake", "river", "mountain", "beach", "tropical",

    # Activités
    "hiking", "surfing", "ski", "cycling", "swimming",

    # Nourriture
    "restaurant", "cafe", "vegan", "local_food",

    # Shopping
    "shopping", "mall", "market",

    # Confort
    "wifi", "accessible", "family_friendly",

    # Climat
    "cold", "warm"
]

TAG_MAP = {
    # Culture
    "entertainment.museum": "museum",
    "tourism.museum": "museum",
    "heritage": "historical",
    "tourism.attraction": "attraction",
    "tourism.sights": "viewpoint",
    "religion.place_of_worship": "church",
    "building.historic": "historical",

    # Nature
    "leisure.park": "park",
    "natural.lake": "lake",
    "natural.river": "river",
    "mountain": "mountain",
    "beach": "beach",
    "tropical": "tropical",

    # Activités
    "sport.hiking": "hiking",
    "sport.ski": "ski",
    "sport.surf": "surfing",

    # Nourriture
    "catering.restaurant": "restaurant",
    "catering.fast_food": "restaurant",
    "catering.cafe": "cafe",
    "vegetarian": "vegan",
    "local_food": "local_food",

    # Shopping
    "commercial.shopping_mall": "mall",
    "shop": "shopping",
    "marketplace": "market",

    # Confort
    "internet_access.free": "wifi",
    "wheelchair.yes": "accessible",
    "family_friendly": "family_friendly",

    # Climat
    "cold": "cold",
    "warm": "warm",
}


def map_tags(raw_tags: List[str]) -> List[str]:
    """
    Même logique que dans reco_engine.py :
    - si déjà dans DIM_TAGS, on garde
    - sinon si dans TAG_MAP, on traduit
    - sinon on ignore
    """
    out: List[str] = []
    for t in raw_tags:
        if t in DIM_TAGS:
            out.append(t)
        elif t in TAG_MAP:
            out.append(TAG_MAP[t])
    return out


# --- Règles heuristiques par ville -------------------------------------------

def infer_climate_tags(lat: float) -> List[str]:
    """
    Déduit des tags de climat à partir de la latitude.
    Règles simples mais crédibles pour l'Europe / Méditerranée.
    """
    tags = []
    if lat >= 50:
        tags.append("cold")
    elif lat <= 40:
        tags.append("warm")

    # On considère "tropical" pour lat < 30 (très approximatif, mais OK pour démo)
    if lat <= 30:
        tags.append("tropical")

    return tags


def infer_city_tags_for_one_city(city_obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyse une ville :
    - compte les tags des POI
    - applique des règles pour décider des city_tags
    """
    city_name = city_obj.get("city", "")
    country = city_obj.get("country", "")
    lat = float(city_obj.get("lat", 0.0))
    lon = float(city_obj.get("lon", 0.0))  # actuellement peu utilisé

    pois = city_obj.get("pois", [])
    tag_counter = Counter()
    poi_with_any_tag = 0

    for poi in pois:
        raw = poi.get("categories", [])
        mapped = map_tags(raw)
        if mapped:
            poi_with_any_tag += 1
            tag_counter.update(mapped)

    total_poi = len(pois)
    city_tags = set()

    # --- Climat via latitude ---
    city_tags.update(infer_climate_tags(lat))

    # --- Héuristiques basées sur les POI ---

    # Culture : ville vraiment culturelle si beaucoup de musées / historique
    museum_count = tag_counter["museum"]
    hist_count = tag_counter["historical"]

    if museum_count >= 5 or (museum_count >= 2 and museum_count >= 0.05 * total_poi):
        city_tags.add("museum")
    if hist_count >= 5 or (hist_count >= 2 and hist_count >= 0.05 * total_poi):
        city_tags.add("historical")

    # On ajoute "art" plutôt si beaucoup de museums + historical
    if museum_count >= 3 and hist_count >= 3:
        city_tags.add("art")

    # Nature : parcs, lac, rivière
    park_count = tag_counter["park"]
    lake_count = tag_counter["lake"]
    river_count = tag_counter["river"]

    # Ville "green" si beaucoup de parcs
    if park_count >= 3 and park_count >= 0.05 * total_poi:
        city_tags.add("park")

    # Plage : au moins quelques POI "beach"
    beach_count = tag_counter["beach"]
    if beach_count >= 2:
        city_tags.add("beach")

    # Montagne / ski
    mountain_count = tag_counter["mountain"]
    ski_count = tag_counter["ski"]
    if mountain_count >= 2 or ski_count >= 1:
        city_tags.add("mountain")

    # Activités outdoor : rando
    hiking_count = tag_counter["hiking"]
    if hiking_count >= 2:
        city_tags.add("hiking")

    # Food : ville de bouffe
    resto_count = tag_counter["restaurant"]
    cafe_count = tag_counter["cafe"]
    vegan_count = tag_counter["vegan"]

    if resto_count >= 10 or resto_count >= 0.15 * total_poi:
        city_tags.add("restaurant")
    if cafe_count >= 5 or cafe_count >= 0.08 * total_poi:
        city_tags.add("cafe")
    if vegan_count >= 3:
        city_tags.add("vegan")

    # Shopping
    shopping_count = tag_counter["shopping"]
    mall_count = tag_counter["mall"]
    market_count = tag_counter["market"]

    if mall_count >= 2 or shopping_count >= 5 or market_count >= 4:
        city_tags.add("shopping")
    if mall_count >= 1:
        city_tags.add("mall")

    # Confort
    wifi_count = tag_counter["wifi"]
    accessible_count = tag_counter["accessible"]

    if wifi_count >= 5 or wifi_count >= 0.08 * total_poi:
        city_tags.add("wifi")
    if accessible_count >= 5 or accessible_count >= 0.08 * total_poi:
        city_tags.add("accessible")

    # Family friendly : parcs + musées = ville sympa pour famille
    if park_count >= 3 and museum_count >= 2:
        city_tags.add("family_friendly")

    # Nettoyage final : on ne garde que ce qui est dans DIM_TAGS ou climat
    final_tags = [t for t in city_tags if t in DIM_TAGS or t in ("cold", "warm", "tropical")]

    return {
        "city": city_name,
        "country": country,
        "lat": lat,
        "lon": lon,
        "city_tags": sorted(final_tags),
        "stats": {
            "total_poi": total_poi,
            "poi_with_any_tag": poi_with_any_tag,
            "top_tags": tag_counter.most_common(10)
        }
    }


def main():
    print(f"=== Génération de city_types à partir de {INPUT_SEED} ===")

    with open(INPUT_SEED, "r", encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for city_obj in data:
        res = infer_city_tags_for_one_city(city_obj)
        results.append(res)

    with open(OUTPUT_CITY_TYPES, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✓ Fichier {OUTPUT_CITY_TYPES} généré.")
    print("Exemple d'une ville :")
    if results:
        example = results[0]
        print(json.dumps(example, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
