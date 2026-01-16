from __future__ import annotations

from typing import Dict, Iterable, List, Mapping, Set, Tuple, Union


def _dedupe_keep_order(items: List[str]) -> List[str]:
    seen: Set[str] = set()
    out: List[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def _humanize_token(token: str) -> str:
    token = token.replace("_", " ")

    # Keep this aligned with dataS5/DONNEE_V2_ALGO/scripts/add_categories_gpt.py
    mapping = {
        "food and drink": "food and drink",
        "place of worship": "places of worship",
        "arts centre": "arts centres",
        "shopping mall": "shopping malls",
        "coffee shop": "coffee shops",
        "internet access": "internet access",
    }

    lower = token.lower()
    if lower in mapping:
        return mapping[lower]

    return token


def _join_natural(items: List[str]) -> str:
    items = [i for i in items if i]
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def _extract_leaf_values(categories: List[str], prefix: str) -> List[str]:
    values: List[str] = []
    for cat in categories:
        if not cat.startswith(prefix):
            continue
        leaf = cat[len(prefix) :]
        if leaf.startswith("."):
            leaf = leaf[1:]
        if not leaf:
            continue
        values.append(leaf.split(".")[-1])
    return _dedupe_keep_order(values)


def _clamp_weight(weight: int) -> int:
    try:
        w = int(weight)
    except Exception:
        return 3
    if w < 1:
        return 1
    if w > 5:
        return 5
    return w


def _normalize_weighted_input(
    user_preferences: Union[
        Mapping[str, int],
        Iterable[Tuple[str, int]],
        Iterable[Dict[str, object]],
    ]
) -> Dict[str, int]:
    """Normalize supported inputs to {tag: weight} with weights clamped to 1..5.

    Supported:
    - dict: {"beach": 5, "heritage.unesco": 3}
    - list[tuple]: [("beach", 5), ("heritage.unesco", 3)]
    - list[dict]: [{"tag": "beach", "weight": 5}, ...]
    """

    if user_preferences is None:
        return {}

    if isinstance(user_preferences, Mapping):
        out: Dict[str, int] = {}
        for k, v in user_preferences.items():
            tag = str(k).strip()
            if not tag:
                continue
            out[tag] = _clamp_weight(int(v))
        return out

    out = {}
    for item in user_preferences:
        if isinstance(item, tuple) and len(item) == 2:
            tag = str(item[0]).strip()
            if not tag:
                continue
            out[tag] = _clamp_weight(int(item[1]))
            continue

        if isinstance(item, dict):
            tag = str(item.get("tag", "")).strip()
            if not tag:
                continue
            weight_raw = item.get("weight", 3)
            out[tag] = _clamp_weight(int(weight_raw))

    return out


def _pick_by_weight(weight: int, options: List[str]) -> str:
    """Pick a phrase variant for weight 1..5 from a 5-item options list."""
    w = _clamp_weight(weight)
    if len(options) != 5:
        # Defensive fallback
        return options[-1] if options else ""
    return options[w - 1]


def generate_user_query_with_weights(
    user_categories: List[str], 
    weights: Dict[str, int] = None
) -> str:
    """Generate a neutral query sentence from categories with optional weights (1..5).

    Args:
        user_categories: List of category tags (e.g., ["beach", "heritage.unesco", "catering.restaurant.italian"])
        weights: Optional dict mapping category -> weight 1-5. If None or empty, uses generate_user_query.
                Categories not in weights dict are treated as neutral (weight 3).

    Strategy (semantic escalation): do NOT repeat keywords. Instead, keep the same
    key vocabulary as the city descriptions, and intensify the phrasing depending
    on the weight.

    Output template is aligned with city-side text:
      "A destination featuring ... ."
    """

    # If no weights provided, use simple generation
    if not weights:
        return generate_user_query(user_categories)

    # Build weighted preferences: category -> weight (default 3 if not in weights dict)
    weighted: Dict[str, int] = {}
    for cat in user_categories:
        cat_clean = str(cat).strip()
        if not cat_clean:
            continue
        weighted[cat_clean] = _clamp_weight(weights.get(cat_clean, 1))
    categories = list(weighted.keys())
    cats_set: Set[str] = set(categories)

    def weight_for_prefix(prefix: str) -> int:
        best = 0
        for tag, w in weighted.items():
            if tag == prefix or tag.startswith(prefix + "."):
                best = max(best, w)
        return best

    def weight_for_exact(value: str) -> int:
        return weighted.get(value, 0)

    def has_prefix(prefix: str) -> bool:
        return weight_for_prefix(prefix) > 0

    # --- Nature ---
    nature_weight = max(
        weight_for_prefix("natural"),
        weight_for_prefix("beach"),
        weight_for_prefix("island"),
        weight_for_prefix("national_park"),
    )
    has_nature = nature_weight > 0

    nature_items: List[str] = []
    nature_items.extend(_extract_leaf_values(categories, "natural"))
    if has_prefix("beach"):
        nature_items.append("beach")
        nature_items.extend(_extract_leaf_values(categories, "beach"))
    if has_prefix("island"):
        nature_items.append("island")
        nature_items.extend(_extract_leaf_values(categories, "island"))
    if has_prefix("national_park"):
        nature_items.append("national_park")
        nature_items.extend(_extract_leaf_values(categories, "national_park"))
    nature_items = [_humanize_token(x) for x in nature_items]
    nature_items = _dedupe_keep_order(nature_items)[:3]

    # --- History ---
    history_weight = max(
        weight_for_prefix("heritage"),
        weight_for_prefix("tourism.sights"),
        weight_for_prefix("religion"),
        weight_for_prefix("memorial"),
        weight_for_exact("building.historic"),
    )
    has_history = history_weight > 0

    sights_leaf = _extract_leaf_values(categories, "tourism.sights")
    sights_leaf = [_humanize_token(x) for x in sights_leaf]
    sights_leaf = _dedupe_keep_order(sights_leaf)
    preferred_sights = {
        "castle",
        "ruines",
        "monastery",
        "cathedral",
        "church",
        "chapel",
        "mosque",
        "synagogue",
        "temple",
        "archaeological site",
        "fort",
        "city gate",
    }
    sights_preferred = [s for s in sights_leaf if s.lower() in preferred_sights]
    sights_other = [s for s in sights_leaf if s.lower() not in preferred_sights]
    sights_final = (sights_preferred + sights_other)[:3]

    # --- Gastronomy ---
    gastronomy_weight = max(
        weight_for_prefix("catering.restaurant"),
        weight_for_prefix("production.winery"),
        weight_for_prefix("production.brewery"),
    )
    has_gastronomy = gastronomy_weight > 0

    cuisines = _extract_leaf_values(categories, "catering.restaurant")
    cuisines_blacklist = {"restaurant", "regional"}
    cuisines_clean = [_humanize_token(c) for c in cuisines if c not in cuisines_blacklist]
    cuisines_clean = _dedupe_keep_order(cuisines_clean)[:3]
    has_winery = has_prefix("production.winery")
    has_brewery = has_prefix("production.brewery")

    # --- Shopping ---
    shopping_weight = max(
        weight_for_exact("commercial.shopping_mall"),
        weight_for_exact("commercial.marketplace"),
        weight_for_exact("commercial.gift_and_souvenir"),
    )
    has_shopping = shopping_weight > 0

    has_shopping_mall = weight_for_exact("commercial.shopping_mall") > 0
    has_marketplace = weight_for_exact("commercial.marketplace") > 0
    has_souvenirs = weight_for_exact("commercial.gift_and_souvenir") > 0

    # --- Fun / Sport ---
    fun_weight = max(
        weight_for_prefix("ski"),
        weight_for_prefix("adult.nightclub"),
        weight_for_prefix("adult.casino"),
        weight_for_prefix("entertainment.theme_park"),
        weight_for_prefix("sport.stadium"),
    )
    has_fun = fun_weight > 0

    has_ski = has_prefix("ski")
    has_nightclub = has_prefix("adult.nightclub")
    has_casino = has_prefix("adult.casino")
    has_theme_park = has_prefix("entertainment.theme_park")
    has_stadium = has_prefix("sport.stadium")

    # Build weighted chunks
    weighted_chunks: List[Tuple[int, int, str]] = []  # (weight desc, stable_order, chunk)
    stable_order = {
        "nature": 1,
        "history": 2,
        "gastronomy": 3,
        "shopping": 4,
        "fun": 5,
    }

    if has_nature:
        if nature_items:
            base = f"beautiful landscapes like {_join_natural(nature_items)}"
        else:
            base = "beautiful landscapes for nature lovers"

        chunk = _pick_by_weight(
            nature_weight,
            [
                base,  # Poids 1 (défaut)
                f"{base} and outdoor activities",  # Poids 2
                f"{base} with great natural diversity",  # Poids 3
                f"{base} with a strong focus on nature",  # Poids 4
                f"{base} as a top priority",  # Poids 5
            ],
        )
        weighted_chunks.append((nature_weight, stable_order["nature"], chunk))

    if has_history:
        history_bits: List[str] = []
        if has_prefix("heritage"):
            history_bits.append("historical heritage")
        if sights_final:
            history_bits.append(f"landmarks like {_join_natural(sights_final)}")
        elif has_prefix("tourism.sights"):
            history_bits.append("iconic landmarks")
        if has_prefix("religion"):
            history_bits.append("religious sites")
        if has_prefix("memorial"):
            history_bits.append("memorials")
        if weight_for_exact("building.historic") > 0 and "historical heritage" not in history_bits:
            history_bits.append("historic architecture")

        history_bits = _dedupe_keep_order(history_bits)
        if history_bits:
            base = _join_natural(history_bits)
        else:
            base = "historical heritage"

        chunk = _pick_by_weight(
            history_weight,
            [
                base,  # Poids 1 (défaut)
                f"{base} and cultural experiences",  # Poids 2
                f"{base} with rich historical significance",  # Poids 3
                f"{base} with a strong focus on culture and history",  # Poids 4
                f"{base} as a top priority",  # Poids 5
            ],
        )
        weighted_chunks.append((history_weight, stable_order["history"], chunk))

    if has_gastronomy:
        food_bits: List[str] = []
        if has_prefix("catering.restaurant"):
            if cuisines_clean:
                food_bits.append(f"restaurants serving {_join_natural(cuisines_clean)} cuisine")
            else:
                food_bits.append("great local restaurants")
        if has_winery and has_brewery:
            food_bits.append("wineries and breweries")
        elif has_winery:
            food_bits.append("wineries")
        elif has_brewery:
            food_bits.append("breweries")

        food_bits = _dedupe_keep_order(food_bits)
        base = _join_natural(food_bits) if food_bits else "great local restaurants"

        chunk = _pick_by_weight(
            gastronomy_weight,
            [
                base,  # Poids 1 (défaut)
                f"{base} and local specialties",  # Poids 2
                f"{base} with diverse culinary offerings",  # Poids 3
                f"{base} with a strong food focus",  # Poids 4
                f"{base} as a top priority",  # Poids 5
            ],
        )
        weighted_chunks.append((gastronomy_weight, stable_order["gastronomy"], chunk))

    if has_shopping:
        shopping_bits: List[str] = []
        if has_shopping_mall:
            shopping_bits.append("shopping malls")
        if has_marketplace:
            shopping_bits.append("local marketplaces")
        if has_souvenirs:
            shopping_bits.append("souvenir shops")
        shopping_bits = _dedupe_keep_order(shopping_bits)
        base = _join_natural(shopping_bits) if shopping_bits else "local marketplaces"

        chunk = _pick_by_weight(
            shopping_weight,
            [
                base,  # Poids 1 (défaut)
                f"{base} and retail therapy",  # Poids 2
                f"{base} with great shopping variety",  # Poids 3
                f"{base} with a strong focus on shopping",  # Poids 4
                f"{base} as a top priority",  # Poids 5
            ],
        )
        weighted_chunks.append((shopping_weight, stable_order["shopping"], chunk))

    if has_fun:
        fun_bits: List[str] = []
        if has_theme_park:
            fun_bits.append("theme parks")
        if has_ski:
            fun_bits.append("skiing")
        if has_stadium:
            fun_bits.append("stadium events")
        if has_nightclub and has_casino:
            fun_bits.append("nightlife and casinos")
        elif has_nightclub:
            fun_bits.append("nightlife")
        elif has_casino:
            fun_bits.append("casinos")

        fun_bits = _dedupe_keep_order(fun_bits)
        base = _join_natural(fun_bits) if fun_bits else "nightlife"

        chunk = _pick_by_weight(
            fun_weight,
            [
                base,  # Poids 1 (défaut)
                f"{base} and entertainment options",  # Poids 2
                f"{base} with vibrant recreational activities",  # Poids 3
                f"{base} with a strong focus on fun",  # Poids 4
                f"{base} as a top priority",  # Poids 5
            ],
        )
        weighted_chunks.append((fun_weight, stable_order["fun"], chunk))

    if not weighted_chunks:
        return "A destination offering a mix of travel experiences and local atmosphere."

    # Prioritize strongest preferences; keep a maximum of 3 chunks for stability.
    weighted_chunks.sort(key=lambda x: (-x[0], x[1]))
    chunks = [c for _, _, c in weighted_chunks][:3]
    chunks = _dedupe_keep_order(chunks)

    return f"A destination featuring {_join_natural(chunks)}."


def generate_user_query(user_categories: List[str]) -> str:
    """Transform raw category tags into a natural English sentence.

    The goal is to maximize MiniLM similarity with city descriptions generated by
    dataS5/DONNEE_V2_ALGO/scripts/add_categories_gpt.py.

    Rules:
    - Only emit concepts from the same allowed themes (Nature, History, Gastronomy, Shopping, Fun/Sport).
    - Use the exact same vocabulary "keys" as the city-side generator when tags are detected.
    """

    categories = [str(c).strip() for c in (user_categories or []) if str(c).strip()]
    cats_set: Set[str] = set(categories)

    def has_exact(value: str) -> bool:
        return value in cats_set

    def has_prefix(prefix: str) -> bool:
        for c in cats_set:
            if c == prefix or c.startswith(prefix + "."):
                return True
        return False

    # --- Nature ---
    has_nature = has_prefix("natural") or has_prefix("beach") or has_prefix("island") or has_prefix("national_park")

    # BUG 1 fix: collect multiple relevant nature details (don't swallow 'beach').
    nature_items: List[str] = []
    nature_items.extend(_extract_leaf_values(categories, "natural"))
    if has_prefix("beach"):
        nature_items.append("beach")
        nature_items.extend(_extract_leaf_values(categories, "beach"))
    if has_prefix("island"):
        nature_items.append("island")
        nature_items.extend(_extract_leaf_values(categories, "island"))
    if has_prefix("national_park"):
        nature_items.append("national_park")
        nature_items.extend(_extract_leaf_values(categories, "national_park"))
    nature_items = [_humanize_token(x) for x in nature_items]
    nature_items = _dedupe_keep_order(nature_items)[:3]

    # --- History ---
    has_history = (
        has_prefix("heritage")
        or has_prefix("tourism.sights")
        or has_prefix("religion")
        or has_prefix("memorial")
        or has_exact("building.historic")
    )

    sights_leaf = _extract_leaf_values(categories, "tourism.sights")
    sights_leaf = [_humanize_token(x) for x in sights_leaf]
    sights_leaf = _dedupe_keep_order(sights_leaf)

    preferred_sights = {
        "castle",
        "ruines",
        "monastery",
        "cathedral",
        "church",
        "chapel",
        "mosque",
        "synagogue",
        "temple",
        "archaeological site",
        "fort",
        "city gate",
    }
    sights_preferred = [s for s in sights_leaf if s.lower() in preferred_sights]
    sights_other = [s for s in sights_leaf if s.lower() not in preferred_sights]
    sights_final = (sights_preferred + sights_other)[:3]

    # --- Gastronomy ---
    has_restaurants = has_prefix("catering.restaurant")
    cuisines = _extract_leaf_values(categories, "catering.restaurant")
    cuisines_blacklist = {"restaurant", "regional"}
    cuisines_clean = [_humanize_token(c) for c in cuisines if c not in cuisines_blacklist]
    cuisines_clean = _dedupe_keep_order(cuisines_clean)[:3]

    has_winery = has_exact("production.winery") or has_prefix("production.winery")
    has_brewery = has_exact("production.brewery") or has_prefix("production.brewery")

    # --- Shopping (strict) ---
    has_shopping_mall = has_exact("commercial.shopping_mall")
    has_marketplace = has_exact("commercial.marketplace")
    has_souvenirs = has_exact("commercial.gift_and_souvenir")

    # --- Fun / Sport ---
    # BUG 2 fix: use prefix checks to catch sub-tags like 'adult.nightclub.*'
    has_nightclub = has_prefix("adult.nightclub")
    has_casino = has_prefix("adult.casino")
    has_theme_park = has_prefix("entertainment.theme_park")
    has_ski = has_prefix("ski")
    has_stadium = has_prefix("sport.stadium")

    # Build desire chunks using the exact same "keys" vocabulary
    chunks: List[str] = []

    if has_nature:
        if nature_items:
            chunks.append(f"beautiful landscapes like {_join_natural(nature_items)}")
        else:
            chunks.append("beautiful landscapes for nature lovers")

    if has_history:
        history_bits: List[str] = []
        if has_prefix("heritage"):
            history_bits.append("historical heritage")
        if sights_final:
            history_bits.append(f"landmarks like {_join_natural(sights_final)}")
        elif has_prefix("tourism.sights"):
            history_bits.append("iconic landmarks")
        if has_prefix("religion"):
            history_bits.append("religious sites")
        if has_prefix("memorial"):
            history_bits.append("memorials")
        if has_exact("building.historic") and "historical heritage" not in history_bits:
            history_bits.append("historic architecture")

        history_bits = _dedupe_keep_order(history_bits)
        if history_bits:
            chunks.append(_join_natural(history_bits))

    if has_restaurants or has_winery or has_brewery:
        food_bits: List[str] = []
        if has_restaurants:
            if cuisines_clean:
                food_bits.append(f"restaurants serving {_join_natural(cuisines_clean)} cuisine")
            else:
                food_bits.append("great local restaurants")
        if has_winery and has_brewery:
            food_bits.append("wineries and breweries")
        elif has_winery:
            food_bits.append("wineries")
        elif has_brewery:
            food_bits.append("breweries")

        food_bits = _dedupe_keep_order(food_bits)
        if food_bits:
            chunks.append(_join_natural(food_bits))

    shopping_bits: List[str] = []
    if has_shopping_mall:
        shopping_bits.append("shopping malls")
    if has_marketplace:
        shopping_bits.append("local marketplaces")
    if has_souvenirs:
        shopping_bits.append("souvenir shops")
    if shopping_bits:
        chunks.append(_join_natural(_dedupe_keep_order(shopping_bits)))

    fun_bits: List[str] = []
    if has_theme_park:
        fun_bits.append("theme parks")
    if has_ski:
        fun_bits.append("skiing")
    if has_stadium:
        fun_bits.append("stadium events")
    if has_nightclub and has_casino:
        fun_bits.append("nightlife and casinos")
    elif has_nightclub:
        fun_bits.append("nightlife")
    elif has_casino:
        fun_bits.append("casinos")

    fun_bits = _dedupe_keep_order(fun_bits)
    if fun_bits:
        chunks.append(_join_natural(fun_bits))

    chunks = _dedupe_keep_order(chunks)
    if not chunks:
        return "A destination offering a mix of travel experiences and local atmosphere."

    chunks = chunks[:3]
    return f"A destination featuring {_join_natural(chunks)}."


if __name__ == "__main__":
    # Quick manual sanity check
    example = [
      "accommodation",
      "accommodation.hotel",
      "building",
      "building.historic",
      "building.place_of_worship",
      "building.tourism",
      "catering",
      "catering.cafe",
      "catering.cafe.coffee",
      "catering.cafe.coffee_shop",
      "catering.restaurant",
      "catering.restaurant.arab",
      "catering.restaurant.international",
      "catering.restaurant.regional",
      "entertainment",
      "entertainment.museum",
      "heritage",
      "heritage.unesco",
      "highway",
      "highway.footway",
      "highway.pedestrian",
      "internet_access",
      "internet_access.free",
      "man_made",
      "memorial",
      "memorial.cemetery",
      "tourism",
      "tourism.attraction",
      "tourism.sights",
      "tourism.sights.archaeological_site",
      "tourism.sights.memorial",
      "tourism.sights.memorial.necropolis",
      "tourism.sights.memorial.tomb",
      "tourism.sights.ruines",
      "wheelchair",
      "ski"
    ]
    # Test with weights
    print(generate_user_query_with_weights(example, {"ski":2}))
    
    # Test without weights (fallback)
    print(generate_user_query_with_weights(example))

