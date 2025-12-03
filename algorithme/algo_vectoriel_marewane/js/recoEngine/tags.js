// js/recoEngine/tags.js

//-----------------------------------------------------
// 1) Vocabulaire final (26 tags)
//-----------------------------------------------------
export const DIM_TAGS = [
  "museum", "art", "monument", "historical", "church",
  "attraction", "viewpoint",

  // nature
  "park", "lake", "river", "mountain", "beach", "tropical",

  // activités
  "hiking", "surfing", "ski", "cycling", "swimming",

  // nourriture
  "restaurant", "cafe", "vegan", "local_food",

  // shopping
  "shopping", "mall", "market",

  // confort
  "wifi", "accessible", "family_friendly",

  // climat
  "cold", "warm"
];

//-----------------------------------------------------
// 2) Mapping des tags bruts → tags normalisés
//-----------------------------------------------------
export const TAG_MAP = {
  "entertainment.museum": "museum",
  "tourism.museum": "museum",
  "heritage": "historical",
  "tourism.attraction": "attraction",
  "tourism.sights": "viewpoint",
  "religion.place_of_worship": "church",
  "building.historic": "historical",

  // Nature
  "leisure.park": "park",
  "natural.lake": "lake",
  "natural.river": "river",
  "mountain": "mountain",
  "beach": "beach",
  "tropical": "tropical",

  // activités
  "sport.hiking": "hiking",
  "sport.ski": "ski",
  "sport.surf": "surfing",

  // nourriture
  "catering.restaurant": "restaurant",
  "catering.fast_food": "restaurant",
  "catering.cafe": "cafe",
  "vegetarian": "vegan",
  "local_food": "local_food",

  // shopping
  "commercial.shopping_mall": "mall",
  "shop": "shopping",
  "marketplace": "market",

  // confort / climat
  "internet_access.free": "wifi",
  "wheelchair.yes": "accessible",
  "family_friendly": "family_friendly",

  "cold": "cold",
  "warm": "warm"
};

//-----------------------------------------------------
// 3) Pondération (comme en Python)
//-----------------------------------------------------
export const TAG_WEIGHTS = {
  museum: 1.2, art: 1.1, monument: 1.1,
  historical: 1.1, church: 0.9,
  attraction: 1.1, viewpoint: 0.9,

  park: 1.0, lake: 1.1, river: 0.8,
  mountain: 1.3, beach: 1.4, tropical: 1.3,

  hiking: 1.5, surfing: 1.4, ski: 1.5,
  cycling: 1.2, swimming: 1.0,

  restaurant: 1.0, cafe: 0.8, vegan: 0.9,
  local_food: 1.1,

  shopping: 0.6, mall: 0.5, market: 0.8,

  wifi: 0.3, accessible: 0.3, family_friendly: 0.5,
  cold: 0.2, warm: 0.2
};

//-----------------------------------------------------
// 4) Nettoyage des tags (comme Python map_tags)
//-----------------------------------------------------
export function mapTags(raw) {
  const out = [];

  for (const t of raw) {
    if (DIM_TAGS.includes(t)) {
      out.push(t);
    } else if (t in TAG_MAP) {
      out.push(TAG_MAP[t]);
    }
  }

  return out;
}

//-----------------------------------------------------
// 5) Vectorisation L2 normalisée (dim=26)
//-----------------------------------------------------
export function vectorizeTags(tags) {
  const v = new Array(DIM_TAGS.length).fill(0);
  const tagSet = new Set(tags);

  for (let i = 0; i < DIM_TAGS.length; i++) {
    const dim = DIM_TAGS[i];
    if (tagSet.has(dim)) {
      v[i] = TAG_WEIGHTS[dim] || 1.0;
    }
  }

  // normalisation L2
  const norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
  return norm === 0 ? v : v.map(x => x / norm);
}
