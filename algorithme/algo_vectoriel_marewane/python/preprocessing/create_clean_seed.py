#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Pipeline – Étape 1 : Nettoyage du seed Dalla
 - Corrige les tags incohérents (beach, mountain, ski…)
 - Supprime les tags inutiles
 - Supprime les doublons
 - Normalise les catégories
 - Génère cities_cleaned.json

Ce fichier servira ensuite d'entrée au script d'enrichissement niveau 2.
"""

import json
import math
from typing import List, Dict
from pathlib import Path


# --------------------------------------------------------------
# 1. Chargement du seed
# --------------------------------------------------------------

def load_seed(path=None):
    if path is None:
        # Remonte à SAE5/algo/
        base = Path(__file__).resolve().parents[2]
        path = base / "data" / "cities_geocoded_pois.json"

    print(f"Chargement depuis : {path}")
    with open(path, "r") as f:
        return json.load(f)


# --------------------------------------------------------------
# 2. Fonctions géographiques
# --------------------------------------------------------------

def distance_to_coast(lat, lon):
    """
    APPROX VERY SIMPLE :
    Plus lon/lat sont extrêmes, plus c’est proche de la mer.
    But : juste identifier les villes complètement intérieures.
    """
    # "score mer" grossier
    sea_score = (
        abs(lat) < 70 and (
            abs(lon) > 170 or      # Pacifique
            lon < -60 or lon > 10 # Atlantique / Méditerranée
        )
    )
    return sea_score


def is_flat_country(country):
    return country in ["Belgium", "Netherlands", "Denmark"]


def is_mountain_country(country):
    return country in ["France", "Italy", "Austria", "Switzerland", "Spain"]


# --------------------------------------------------------------
# 3. Normalisation des catégories brutes OSM/Dalla
# --------------------------------------------------------------

NORMALIZE_MAP = {
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

    "catering.restaurant": "restaurant",
    "catering.fast_food": "restaurant",
    "catering.cafe": "cafe",
    "vegetarian": "vegan",

    "commercial.shopping_mall": "mall",
    "marketplace": "market",

    "wheelchair.yes": "accessible",
    "internet_access.free": "wifi",

    "cold": "cold",
    "warm": "warm"
}


def normalize_tags(tags):
    """
    Applique la normalisation des tags bruts → tags simplifiés
    """
    out = []
    for t in tags:
        if t in NORMALIZE_MAP:
            out.append(NORMALIZE_MAP[t])
        elif t.startswith("tourism."):
            out.append("attraction")
        elif t.startswith("historic."):
            out.append("historical")
    return out


# --------------------------------------------------------------
# 4. Nettoyage logique des villes
# --------------------------------------------------------------

def clean_city_pois(city):
    """
    > Supprime les tags incohérents selon la géographie
    > Supprime les doublons
    > Applique les normalisations
    """
    name = city["city"]
    country = city["country"]
    lat = float(city["lat"])
    lon = float(city["lon"])

    coastal = distance_to_coast(lat, lon)
    mountain_zone = is_mountain_country(country)
    flat_country = is_flat_country(country)

    cleaned_pois = []
    seen_names = set()

    for poi in city["pois"]:
        pname = poi.get("name", "").strip()
        if pname == "" or pname in seen_names:
            continue  # ignore doublons ou noms vides

        seen_names.add(pname)

        raw_tags = poi.get("categories", [])
        tags = normalize_tags(raw_tags)

        # === Suppression des tags incohérents ===
        new_tags = []

        for t in tags:

            # plage impossible si ville intérieure
            if t == "beach" and not coastal:
                continue

            # montagne impossible dans pays plats
            if t == "mountain" and flat_country:
                continue

            # ski seulement pays montagneux
            if t == "ski" and not mountain_zone:
                continue

            new_tags.append(t)

        if len(new_tags) == 0:
            continue  # éviter les POI sans tags après nettoyage

        cleaned_pois.append({
            "name": pname,
            "lat": float(poi.get("lat", lat)),
            "lon": float(poi.get("lon", lon)),
            "categories": new_tags
        })

    city_clean = {
        "city": name,
        "country": country,
        "lat": lat,
        "lon": lon,
        "pois": cleaned_pois
    }

    return city_clean


# --------------------------------------------------------------
# 5. Pipeline principal de nettoyage
# --------------------------------------------------------------

def clean_dataset(data):
    cleaned = []
    for city in data:
        cleaned.append(clean_city_pois(city))
    return cleaned


# --------------------------------------------------------------
# 6. Sauvegarde
# --------------------------------------------------------------

def save_seed(data, path="cities_cleaned.json"):
    json.dump(data, open(path, "w"), indent=2, ensure_ascii=False)
    print(f"✓ Seed nettoyé écrit dans {path}")


# --------------------------------------------------------------
# 7. Main
# --------------------------------------------------------------

def main():
    print("=== Nettoyage du seed (Étape 1 PRO) ===")
    original = load_seed()
    cleaned = clean_dataset(original)
    save_seed(cleaned)
    print("✓ Nettoyage terminé ! Vous pouvez maintenant lancer l'enrichissement.")


if __name__ == "__main__":
    main()
