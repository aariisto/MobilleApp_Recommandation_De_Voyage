#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
apply_city_tags.py

Fusionne :
- cities_cleaned_geo.json  (ville + POI)
- city_types.json          (city_tags globaux par ville)

→ produit cities_enriched_geo.json où :
- chaque ville contient "city_tags"
- chaque POI reçoit aussi "city_tags" (utile pour reco_engine.py)
"""

import json
from typing import Dict, Any, List

INPUT_SEED = "cities_cleaned_geo.json"
INPUT_CITY_TYPES = "city_types.json"
OUTPUT_ENRICHED = "cities_enriched_geo.json"


def main():
    print("=== Fusion des city_tags avec le seed ===")

    with open(INPUT_SEED, "r", encoding="utf-8") as f:
        cities = json.load(f)

    with open(INPUT_CITY_TYPES, "r", encoding="utf-8") as f:
        city_types = json.load(f)

    # index par (city, country) pour être plus robuste
    type_index: Dict[tuple, Dict[str, Any]] = {}
    for ct in city_types:
        key = (ct.get("city", ""), ct.get("country", ""))
        type_index[key] = ct

    enriched: List[Dict[str, Any]] = []

    for city_obj in cities:
        key = (city_obj.get("city", ""), city_obj.get("country", ""))
        info = type_index.get(key)

        city_tags = info.get("city_tags", []) if info else []

        # on ajoute city_tags au niveau ville
        city_obj["city_tags"] = city_tags

        # et on propage vers chaque POI (pour simplifier l'algo)
        for poi in city_obj.get("pois", []):
            poi["city_tags"] = city_tags

        enriched.append(city_obj)

    with open(OUTPUT_ENRICHED, "w", encoding="utf-8") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    print(f"✓ Nouveau seed enrichi écrit dans {OUTPUT_ENRICHED}")


if __name__ == "__main__":
    main()
