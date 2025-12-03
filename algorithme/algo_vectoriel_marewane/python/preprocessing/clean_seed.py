#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Nettoyage avancé du seed de Dalla :
- enrichissement automatique des tags
- suppression du bruit
- normalisation via regex
- ajout de tags "ville" cohérents
- création d'un fichier cities_cleaned.json prêt pour l'algo
"""

import json
import re
from collections import Counter, defaultdict
from math import radians, cos, sin, asin, sqrt


# ------------------------------------------------------------
# 1) Lexique final (DIM_TAGS)
# ------------------------------------------------------------

DIM_TAGS = [
    "museum", "art", "monument", "historical", "church",
    "attraction", "viewpoint",
    "park", "lake", "river", "mountain", "beach", "tropical",
    "hiking", "surfing", "ski", "cycling", "swimming",
    "restaurant", "cafe", "vegan", "local_food",
    "shopping", "mall", "market",
    "wifi", "accessible", "family_friendly",
    "cold", "warm", "lodging"
]


# ------------------------------------------------------------
# 2) Regex-based TAG_MAP
# ------------------------------------------------------------

TAG_MAP = [

    # --- Culture ---
    (r".*museum.*", "museum"),
    (r".*historic.*", "historical"),
    (r".*heritage.*", "historical"),
    (r".*church.*", "church"),
    (r"tourism.sights.*", "viewpoint"),
    (r"tourism.attraction.*", "attraction"),

    # --- Nature ---
    (r"leisure.park.*", "park"),
    (r"natural.lake.*", "lake"),
    (r"natural.river.*", "river"),
    (r".*mountain.*", "mountain"),
    (r".*beach.*", "beach"),

    # --- Activités ---
    (r"sport.hiking.*", "hiking"),
    (r"sport.ski.*", "ski"),
    (r"sport.surf.*", "surfing"),

    # --- Food ---
    (r"catering.restaurant.*", "restaurant"),
    (r"catering.cafe.*", "cafe"),
    (r"catering.bar.*", "restaurant"),
    (r".*vegan.*", "vegan"),
    (r".*local_food.*", "local_food"),

    # --- Commerce ---
    (r".*shopping_mall.*", "mall"),
    (r".*market.*", "market"),
    (r".*shop.*", "shopping"),

    # --- Confort ---
    (r"wheelchair.*", "accessible"),
    (r"internet_access.*", "wifi"),

    # --- Hébergement ---
    (r"accommodation.hotel.*", "lodging"),
    (r"accommodation.*", "lodging"),

    # --- Climat ---
    (r".*cold.*", "cold"),
    (r".*warm.*", "warm"),
]


# Tags totalement inutiles
DROP_TAGS = [
    "building", "fee", "no_fee", "leisure", "commercial",
    "building.*", "industrial.*", "religion.*",
    "public_transport.*",
]


def map_tag(tag: str):
    """Mappe un tag RAW vers un tag propre"""
    # Drop les tags nuisibles
    for pattern in DROP_TAGS:
        if re.match(pattern, tag):
            return None

    # Cherche dans TAG_MAP
    for pattern, clean in TAG_MAP:
        if re.match(pattern, tag):
            return clean

    # Déjà propre ?
    if tag in DIM_TAGS:
        return tag

    return None



# ------------------------------------------------------------
# 3) Util
# ------------------------------------------------------------

def clean_tags(raw_tags):
    """Nettoie tous les tags d’un POI."""
    out = set()
    for t in raw_tags:
        mapped = map_tag(t)
        if mapped:
            out.add(mapped)
    return list(out)



# ------------------------------------------------------------
# 4) Profil ville basé sur POI
# ------------------------------------------------------------

def generate_city_tags(city_obj):
    """Analyse les POI pour créer un tag profil ville."""
    counter = Counter()

    for poi in city_obj["pois"]:
        tags = clean_tags(poi["categories"])
        for t in tags:
            counter[t] += 1

    city_tags = []

    if counter["beach"] >= 3:
        city_tags.append("beach")
    if counter["mountain"] >= 3:
        city_tags.append("mountain")
    if counter["museum"] >= 5:
        city_tags.append("museum")
    if counter["restaurant"] >= 20:
        city_tags.append("food")
    if counter["shopping"] >= 10 or counter["mall"] >= 3:
        city_tags.append("shopping")

    return city_tags




# ------------------------------------------------------------
# 5) Programme principal
# ------------------------------------------------------------

def main():
    data = json.load(open("cities_geocoded_pois.json", "r"))

    cleaned = []

    for city in data:
        new_pois = []
        for poi in city["pois"]:
            new_tags = clean_tags(poi["categories"])
            if new_tags:  # ignore vecteurs vides
                poi["categories"] = new_tags
                new_pois.append(poi)

        city["pois"] = new_pois
        city["city_tags"] = generate_city_tags(city)
        cleaned.append(city)

    json.dump(cleaned, open("cities_cleaned.json", "w"), indent=2, ensure_ascii=False)
    print("✓ cities_cleaned.json généré avec tags nettoyés + city_tags.")


if __name__ == "__main__":
    main()
