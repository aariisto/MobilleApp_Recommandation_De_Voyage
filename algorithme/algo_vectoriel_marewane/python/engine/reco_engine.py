#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Moteur de recommandation vectoriel – Version optimisée (Python)
Compatible avec le seed : cities_geocoded_pois.json

Idée générale :
- on charge les POI (points d'intérêt) de Dalla
- on simplifie leurs tags
- on les transforme en vecteurs pondérés
- on calcule la similarité cosinus avec un profil utilisateur
- on agrège par ville pour obtenir des recommandations lisibles
"""

import json
import time
from typing import List, TypedDict
from collections import defaultdict, Counter

import numpy as np


# ------------------------------------------------------------
# 1) Définition des types (lisibilité + robustesse)
# ------------------------------------------------------------

class Item(TypedDict):
    item_id: str
    city: str
    country: str
    lat: float
    lon: float
    tags: List[str]
    kind: str   # "poi", "lodging", "destination", ...


class Dataset(TypedDict):
    items: List[Item]


# ------------------------------------------------------------
# 2) Chargement du seed Dalla
# ------------------------------------------------------------

def load_dalla_seed(path: str) -> Dataset:
    raw = json.load(open(path, "r"))
    items: List[Item] = []

    for city_obj in raw:
        city = city_obj.get("city", "")
        country = city_obj.get("country", "")
        clat = float(city_obj.get("lat", 0.0))
        clon = float(city_obj.get("lon", 0.0))

        city_tags = city_obj.get("city_tags", [])

        for poi in city_obj.get("pois", []):
            items.append({
                "item_id": f"{city}:{poi.get('name', '')}",
                "city": city,
                "country": country,
                "lat": float(poi.get("lat", clat)),
                "lon": float(poi.get("lon", clon)),
                "tags": list(poi.get("categories", [])),
                "kind": "poi",
                "city_tags": list(city_tags),  # <-- AJOUT
            })

    return {"items": items}



# ------------------------------------------------------------
# 3) Vocabulaire réduit pour optimiser mobile
#    (26 dimensions : compact, lisible, suffisant pour un voyage)
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# 4) Mapping OSM → tags simplifiés
#    (On passe de tags "techniques" à des concepts simples)
# ------------------------------------------------------------

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
    "warm": "warm"
}


def map_tags(raw_tags: List[str]) -> List[str]:
    """
    Convertit une liste de tags bruts en tags simplifiés cohérents.

    Cas gérés :
    - si le tag est déjà simplifié (présent dans DIM_TAGS) → on le garde tel quel
    - sinon, si le tag est dans TAG_MAP (style OSM)       → on applique le mapping
    - sinon                                              → on l’ignore
    """
    out: list[str] = []

    for t in raw_tags:
        # 1) Déjà simplifié (cas cities_cleaned / cities_enriched)
        if t in DIM_TAGS:
            out.append(t)
            continue

        # 2) Tag OSM brut (cas seed d'origine)
        if t in TAG_MAP:
            out.append(TAG_MAP[t])
            continue

        # 3) Sinon : on ignore
        # (éventuellement tu peux logger ou compter pour debug)

    return out



# ------------------------------------------------------------
# 5) Pondération des tags
#    (certains critères comptent plus que d'autres)
# ------------------------------------------------------------

TAG_WEIGHTS = {
    # culture
    "museum": 1.2, "art": 1.1, "monument": 1.1,
    "historical": 1.1, "church": 0.9,
    "attraction": 1.1, "viewpoint": 0.9,

    # nature
    "park": 1.0, "lake": 1.1, "river": 0.8,
    "mountain": 1.3, "beach": 1.4, "tropical": 1.3,

    # activités
    "hiking": 1.5, "surfing": 1.4, "ski": 1.5,
    "cycling": 1.2, "swimming": 1.0,

    # nourriture
    "restaurant": 1.0, "cafe": 0.8, "vegan": 0.9,
    "local_food": 1.1,

    # shopping
    "shopping": 0.6, "mall": 0.5, "market": 0.8,

    # confort / climat
    "wifi": 0.3, "accessible": 0.3, "family_friendly": 0.5,
    "cold": 0.2, "warm": 0.2
}


# ------------------------------------------------------------
# 6) Vectorisation pondérée + normalisation
# ------------------------------------------------------------

def vectorize_tags(tags: List[str]) -> np.ndarray:
    """
    Transforme un ensemble de tags simplifiés en vecteur pondéré.
    - dimension : len(DIM_TAGS)
    - normalisation L2 pour utiliser le produit scalaire comme cosinus
    """
    v = np.zeros(len(DIM_TAGS), dtype=np.float32)
    s = set(tags)

    for i, dim in enumerate(DIM_TAGS):
        if dim in s:
            v[i] = TAG_WEIGHTS.get(dim, 1.0)

    n = np.linalg.norm(v)
    return v if n == 0 else v / n


# ------------------------------------------------------------
# 7) Construction de la matrice, similarité, recommandation
# ------------------------------------------------------------


def build_matrix(dataset: Dataset):
    """
    Construit deux matrices :
    - X_poi : vecteurs des POI
    - X_city : vecteurs ville (tags enrichis niveau ville)
    """
    X_poi = []
    X_city = []
    meta = []

    for it in dataset["items"]:
        # 1) POI → vectorisation classique
        mapped_poi = map_tags(it["tags"])
        vec_poi = vectorize_tags(mapped_poi)

        # 2) Ville → tags enrichis que TU as ajoutés
        city_tags = it.get("city_tags", [])  # injecté via seed enrichi
        mapped_city = map_tags(city_tags)
        vec_city = vectorize_tags(mapped_city)

        X_poi.append(vec_poi)
        X_city.append(vec_city)
        meta.append(it)

    return np.vstack(X_poi), np.vstack(X_city), meta


def cosine_sim(a: np.ndarray, B: np.ndarray) -> np.ndarray:
    """
    Produit scalaire car a et B sont supposés normalisés.
    Retourne un vecteur (nb_items,) de similarités.
    """
    return B @ a

# ------------------------------------------------------------
# Poids de combinaison POI / ville
# ------------------------------------------------------------
ALPHA = 0.7   # poids des POI (détail)
BETA  = 0.3   # poids des tags de la ville (contexte global)


def recommend(user_vec, X_poi, X_city, meta, k=10):
    """
    Combine la similarité POI + celle de la ville.
    """
    sims_poi = X_poi @ user_vec            # shape = (N,)
    sims_city = X_city @ user_vec          # shape = (N,)
    
    score = ALPHA * sims_poi + BETA * sims_city

    idx = np.argsort(-score)[:k]

    return [(meta[i], float(score[i])) for i in idx]


# ------------------------------------------------------------
# 8) Agrégation par ville (plus lisible pour l'utilisateur)
# ------------------------------------------------------------

def aggregate_by_city(recos, top_pois_per_city=3):
    """
    Nouveau scoring ville :
    - max(score) compte le plus → ville avec au moins 1 POI pertinent
    - moyenne des 3 meilleurs POI
    - diversité des tags (bonus léger)
    """

    by_city = defaultdict(list)
    for it, score in recos:
        by_city[it["city"]].append((it, score))

    results = []

    for city, items in by_city.items():
        scores = [s for _, s in items]
        top_scores = sorted(scores, reverse=True)[:3]
    
        # Filtre de pertinence : si tous les scores sont quasi nuls → ville non pertinente
        if max(scores) < 0.05:
            continue   # on ignore cette ville
            
        max_score = top_scores[0]
        mean_top3 = sum(top_scores) / len(top_scores)

        # diversite des tags
        all_tags = []
        for it, _ in items:
            all_tags.extend(map_tags(it["tags"]))
        diversity = len(set(all_tags)) / 20.0  # normalisation grossière

        city_score = (
            0.6 * max_score +
            0.3 * mean_top3 +
            0.1 * diversity
        )

        country = items[0][0]["country"]

        results.append({
            "city": city,
            "country": country,
            "score": city_score,
            "tags": list(set(all_tags)),
        })

    # trier selon le score final
    results.sort(key=lambda x: x["score"], reverse=True)
    return results



# ------------------------------------------------------------
# 9) Tests de profils (pertinence + performance)
# ------------------------------------------------------------

def test_profiles():
    """
    Lance plusieurs profils utilisateurs et affiche :
    - le temps de calcul
    - les top villes recommandées
    """

    profiles = {
        "Plage & resto": ["beach", "restaurant", "tropical"],
        "Montagne & rando": ["mountain", "hiking", "cold"],
        "Culture & musées": ["museum", "historical", "art", "restaurant"],
        "Shopping city trip": ["shopping", "mall", "restaurant", "cafe"],
    }

    print("=== Tests de profils ===")

    ds = load_dalla_seed("cities_enriched_geo.json")
    X_poi, X_city, meta = build_matrix(ds)

    for label, tags in profiles.items():
        print("\n--------------------------------------------")
        print(f"Profil : {label}")
        print(f"Tags   : {tags}")

        user_vec = vectorize_tags(tags)

        t0 = time.perf_counter()

        # On prend plus d’items pour une comparaison fiable
        recos = recommend(
            user_vec,
            X_poi,
            X_city,
            meta,
            k=300  # <-- Important : plus de matière pour regrouper par ville
        )

        agg = aggregate_by_city(recos, top_pois_per_city=3)
        t1 = time.perf_counter()

        print(f"Temps de calcul : {(t1 - t0) * 1000:.3f} ms")
        print("Top 5 villes :")
        for city in agg[:5]:
            print(f"  - {city['city']} ({city['country']}) "
                  f"| score={city['score']:.3f} "
                  f"| tags={city['tags']}")



# ------------------------------------------------------------
# 10) Programme principal
# ------------------------------------------------------------

def main():
    print("=== Moteur de recommandation optimisé (Python) ===\n")
    test_profiles()


if __name__ == "__main__":
    main()
