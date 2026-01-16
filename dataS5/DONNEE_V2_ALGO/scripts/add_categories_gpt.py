import json
import os
from typing import Any, Dict, List, Optional, Set, Tuple


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

    # Small, safe normalizations to make sentences read naturally.
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


def _has_any(categories: Set[str], prefixes: List[str]) -> bool:
    for p in prefixes:
        for c in categories:
            if c == p or c.startswith(p + "."):
                return True
    return False


def generate_categories_gpt(city_name: str, categories: List[str]) -> str:
    cats_set: Set[str] = set(categories)

    # Strict filter goals:
    # - Include ONLY: Nature, History, Gastronomy, Shopping (limited), Fun/Sport
    # - Ignore: administrative/office/parking/highway/education/healthcare, technical attributes (fee/wifi/wheelchair/access),
    #   and vague categories (man_made, building) except building.historic.

    def has_exact(value: str) -> bool:
        return value in cats_set

    def has_prefix(prefix: str) -> bool:
        for c in cats_set:
            if c == prefix or c.startswith(prefix + "."):
                return True
        return False

    # --- Nature ---
    has_nature = has_prefix("natural") or has_prefix("beach") or has_prefix("island") or has_prefix("national_park")
    # Collect up to 3 nature details without losing tags like 'beach'.
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
    has_history = has_prefix("heritage") or has_prefix("tourism.sights") or has_prefix("religion") or has_prefix("memorial") or has_exact("building.historic")

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
    # Use prefix checks to avoid missing sub-tags like 'adult.nightclub.*'
    has_nightclub = has_prefix("adult.nightclub")
    has_casino = has_prefix("adult.casino")
    has_theme_park = has_prefix("entertainment.theme_park")
    has_ski = has_prefix("ski")
    has_stadium = has_prefix("sport.stadium")

    # Build sentence chunks (only from allowed themes)
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
        # Sights (castles/ruins/etc)
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

    # Keep the sentence concise and focused
    chunks = chunks[:3]
    return f"A destination featuring {_join_natural(chunks)}."


def main() -> None:
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)
    input_path = os.path.join(base_dir, "cities_categories.json")

    output_path = os.path.join(base_dir, "cities_categories_gpt.json")

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("Expected a JSON list at root.")

    output_list = []
    updated = 0
    for obj in data:
        if not isinstance(obj, dict):
            continue
        city_id = obj.get("id")
        city_name = str(obj.get("name", "")).strip() or "This city"
        categories = obj.get("categories", [])
        if not isinstance(categories, list):
            categories = []

        categories_gpt = generate_categories_gpt(city_name, [str(c) for c in categories])
        output_list.append({
            "id": city_id,
            "name": city_name,
            "categories_gpt": categories_gpt,
        })
        updated += 1

    tmp_path = os.path.join(base_dir, "cities_categories_gpt.tmp.json")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(output_list, f, ensure_ascii=False, indent=2)

    os.replace(tmp_path, output_path)
    print(f"✓ Generated {updated} cities -> {output_path}")


if __name__ == "__main__":
    main()
