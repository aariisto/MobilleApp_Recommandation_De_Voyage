#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
create_enriched_seed.py
------------------------

Crée un seed enrichi destiné au moteur de recommandation.

Fonctionnalités :
- Lit le fichier cities_geocoded_pois.json
- Nettoie les tags POI
- Ajoute city_tags à chaque POI
- Enrichit les villes (climat, nature, tourisme)
- Produit cities_enriched.json

Compatible avec reco_engine.py (version mixte POI + VILLE).
"""

import json

INPUT_SEED = "cities_geocoded_pois.json"
OUTPUT_SEED = "cities_enriched.json"


# -------------------------------------------------------------------
# 1) Mots-clés détectés dans le nom + description de villes
# -------------------------------------------------------------------

CITY_KEYWORDS = {
    "mont": ["mountain", "cold", "hiking"],
    "alpes": ["mountain", "cold", "ski"],
    "alp": ["mountain", "cold"],
    "montana": ["mountain", "cold"],
    "beach": ["beach", "warm"],
    "sea": ["beach", "warm", "swimming"],
    "mar": ["beach", "warm"],
    "trop": ["tropical", "warm"],
    "ski": ["ski", "cold"],
}


# -------------------------------------------------------------------
# 2) POI-level keywords → tags (détection dans categories si vide)
# -------------------------------------------------------------------

POI_KEYWORDS = {
    "museum": "museum",
    "art": "art",
    "church": "church",
    "temple": "church",
    "historic": "historical",
    "monument": "monument",
    "shopping": "shopping",
    "mall": "mall",
    "market": "market",
    "park": "park",
    "lake": "lake",
    "river": "river",
}


# -------------------------------------------------------------------
# 3) Détection automatisée des tags pour une ville
# -------------------------------------------------------------------

def infer_city_tags(city_name: str) -> list:
    name_lower = city_name.lower()
    found = []

    for key, tags in CITY_KEYWORDS.items():
        if key in name_lower:
            found.extend(tags)

    return list(set(found))  # unique


# -------------------------------------------------------------------
# 4) Détection automatique pour les POI
# -------------------------------------------------------------------

def infer_poi_tags(poi_name: str) -> list:
    name_lower = poi_name.lower()
    out = []

    for key, tag in POI_KEYWORDS.items():
        if key in name_lower:
            out.append(tag)

    return list(set(out))


# -------------------------------------------------------------------
# 5) Pipeline principal de nettoyage et enrichissement
# -------------------------------------------------------------------

def build_enriched_seed():
    raw = json.load(open(INPUT_SEED, "r"))
    out = []

    for city_obj in raw:
        city = city_obj.get("city", "")
        country = city_obj.get("country", "")
        lat = city_obj.get("lat")
        lon = city_obj.get("lon")

        # Tags ville → détection automatique
        city_tags = infer_city_tags(city)

        new_city = {
            "city": city,
            "country": country,
            "lat": lat,
            "lon": lon,
            "city_tags": city_tags,
            "pois": []
        }

        # Traitement des POI
        for poi in city_obj.get("pois", []):
            name = poi.get("name", "").strip()
            categories = list(set(poi.get("categories", [])))  # unique
            poi_lat = poi.get("lat", lat)
            poi_lon = poi.get("lon", lon)

            # Si POI sans tags → on tente une inférence automatique
            if len(categories) == 0:
                inferred = infer_poi_tags(name)
                categories = inferred

            new_city["pois"].append({
                "name": name,
                "lat": poi_lat,
                "lon": poi_lon,
                "categories": categories,
                "city_tags": city_tags  # ← clé nécessaire pour reco_engine.py
            })

        out.append(new_city)

    # Écriture
    json.dump(out, open(OUTPUT_SEED, "w"), indent=2, ensure_ascii=False)


# -------------------------------------------------------------------
# Main
# ----------------------------------------------------------------
