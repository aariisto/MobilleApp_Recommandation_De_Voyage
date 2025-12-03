#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import math

INPUT = "cities_cleaned.json"
OUTPUT = "cities_cleaned_geo.json"

MAX_DIST_TO_COAST_KM = 50

COAST_POINTS = [
    # France
    (43.30, 5.37), (43.55, 7.01), (48.86, -1.56),
    # Portugal
    (38.72, -9.13), (41.15, -8.62), (37.02, -8.98),
    # Espagne
    (36.83, -2.47), (43.36, -8.41), (39.47, -0.38), (41.38, 2.17),
    # Italie
    (44.41, 8.93), (40.85, 14.27), (45.44, 12.33),
    # Allemagne
    (53.55, 9.99),
    # UK
    (50.82, -0.14),
]

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2-lat1)
    dlon = math.radians(lon2-lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(a))

def is_coastal(lat, lon):
    return any(haversine(lat, lon, clat, clon) < MAX_DIST_TO_COAST_KM
               for clat, clon in COAST_POINTS)

print("=== Nettoyage géographique des tags (plages, montagnes) ===")

data = json.load(open(INPUT))
cleaned = []

for city in data:
    lat, lon = city["lat"], city["lon"]
    coastal = is_coastal(lat, lon)

    new_pois = []

    for poi in city["pois"]:
        tags = poi["categories"]

        if not coastal:
            tags = [t for t in tags if t != "beach"]

        poi["categories"] = tags
        new_pois.append(poi)

    city["pois"] = new_pois
    cleaned.append(city)

json.dump(cleaned, open(OUTPUT, "w"), indent=2, ensure_ascii=False)
print("✓ Nettoyage terminé. Nouveau fichier :", OUTPUT)
