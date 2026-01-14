/**
 * userQuery.js - Port JavaScript de user_query.py
 * Génère des requêtes en langage naturel à partir de catégories utilisateur
 */

// ===== Helper Functions =====

function _dedupeKeepOrder(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function _humanizeToken(token) {
  token = token.replace(/_/g, ' ');

  const mapping = {
    'food and drink': 'food and drink',
    'place of worship': 'places of worship',
    'arts centre': 'arts centres',
    'shopping mall': 'shopping malls',
    'coffee shop': 'coffee shops',
    'internet access': 'internet access',
  };

  const lower = token.toLowerCase();
  if (lower in mapping) {
    return mapping[lower];
  }

  return token;
}

function _joinNatural(items) {
  items = items.filter(i => i);
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return items.slice(0, -1).join(', ') + `, and ${items[items.length - 1]}`;
}

function _extractLeafValues(categories, prefix) {
  const values = [];
  for (const cat of categories) {
    if (!cat.startsWith(prefix)) continue;
    let leaf = cat.substring(prefix.length);
    if (leaf.startsWith('.')) {
      leaf = leaf.substring(1);
    }
    if (!leaf) continue;
    const parts = leaf.split('.');
    values.push(parts[parts.length - 1]);
  }
  return _dedupeKeepOrder(values);
}

function _clampWeight(weight) {
  try {
    const w = parseInt(weight);
    if (w < 1) return 1;
    if (w > 5) return 5;
    return w;
  } catch {
    return 3;
  }
}

function _normalizeWeightedInput(userPreferences) {
  if (!userPreferences) return {};

  // Si c'est un objet simple {tag: weight}
  if (!Array.isArray(userPreferences)) {
    const out = {};
    for (const [k, v] of Object.entries(userPreferences)) {
      const tag = String(k).trim();
      if (!tag) continue;
      out[tag] = _clampWeight(parseInt(v));
    }
    return out;
  }

  // Si c'est un array de tuples ou d'objets
  const out = {};
  for (const item of userPreferences) {
    if (Array.isArray(item) && item.length === 2) {
      const tag = String(item[0]).trim();
      if (!tag) continue;
      out[tag] = _clampWeight(parseInt(item[1]));
      continue;
    }

    if (typeof item === 'object') {
      const tag = String(item.tag || '').trim();
      if (!tag) continue;
      const weightRaw = item.weight || 3;
      out[tag] = _clampWeight(parseInt(weightRaw));
    }
  }
  return out;
}

function _pickByWeight(weight, options) {
  const w = _clampWeight(weight);
  if (options.length !== 5) {
    return options.length > 0 ? options[options.length - 1] : '';
  }
  return options[w - 1];
}

// ===== Main Functions =====

/**
 * Génère une requête utilisateur avec poids
 * @param {string[]} userCategories - Liste des catégories (ex: ["beach", "heritage.unesco"])
 * @param {Object} weights - Mapping catégorie -> poids 1-5 (optionnel)
 * @returns {string} Phrase en langage naturel
 */
export function generateUserQueryWithWeights(userCategories, weights = null) {
  // Si pas de poids, utilise la version simple
  if (!weights || Object.keys(weights).length === 0) {
    return generateUserQuery(userCategories);
  }

  // Build weighted preferences
  const weighted = {};
  for (const cat of userCategories) {
    const catClean = String(cat).trim();
    if (!catClean) continue;
    weighted[catClean] = _clampWeight(weights[catClean] || 1);
  }
  
  const categories = Object.keys(weighted);
  const catsSet = new Set(categories);

  function weightForPrefix(prefix) {
    let best = 0;
    for (const [tag, w] of Object.entries(weighted)) {
      if (tag === prefix || tag.startsWith(prefix + '.')) {
        best = Math.max(best, w);
      }
    }
    return best;
  }

  function weightForExact(value) {
    return weighted[value] || 0;
  }

  function hasPrefix(prefix) {
    return weightForPrefix(prefix) > 0;
  }

  // --- Nature ---
  const natureWeight = Math.max(
    weightForPrefix('natural'),
    weightForPrefix('beach'),
    weightForPrefix('island'),
    weightForPrefix('national_park')
  );
  const hasNature = natureWeight > 0;

  let natureItems = [];
  natureItems.push(..._extractLeafValues(categories, 'natural'));
  if (hasPrefix('beach')) {
    natureItems.push('beach');
    natureItems.push(..._extractLeafValues(categories, 'beach'));
  }
  if (hasPrefix('island')) {
    natureItems.push('island');
    natureItems.push(..._extractLeafValues(categories, 'island'));
  }
  if (hasPrefix('national_park')) {
    natureItems.push('national_park');
    natureItems.push(..._extractLeafValues(categories, 'national_park'));
  }
  natureItems = natureItems.map(_humanizeToken);
  natureItems = _dedupeKeepOrder(natureItems).slice(0, 3);

  // --- History ---
  const historyWeight = Math.max(
    weightForPrefix('heritage'),
    weightForPrefix('tourism.sights'),
    weightForPrefix('religion'),
    weightForPrefix('memorial'),
    weightForExact('building.historic')
  );
  const hasHistory = historyWeight > 0;

  let sightsLeaf = _extractLeafValues(categories, 'tourism.sights');
  sightsLeaf = sightsLeaf.map(_humanizeToken);
  sightsLeaf = _dedupeKeepOrder(sightsLeaf);
  
  const preferredSights = new Set([
    'castle', 'ruines', 'monastery', 'cathedral', 'church', 'chapel',
    'mosque', 'synagogue', 'temple', 'archaeological site', 'fort', 'city gate'
  ]);
  const sightsPreferred = sightsLeaf.filter(s => preferredSights.has(s.toLowerCase()));
  const sightsOther = sightsLeaf.filter(s => !preferredSights.has(s.toLowerCase()));
  const sightsFinal = [...sightsPreferred, ...sightsOther].slice(0, 3);

  // --- Gastronomy ---
  const gastronomyWeight = Math.max(
    weightForPrefix('catering.restaurant'),
    weightForPrefix('production.winery'),
    weightForPrefix('production.brewery')
  );
  const hasGastronomy = gastronomyWeight > 0;

  const cuisines = _extractLeafValues(categories, 'catering.restaurant');
  const cuisinesBlacklist = new Set(['restaurant', 'regional']);
  let cuisinesClean = cuisines.filter(c => !cuisinesBlacklist.has(c)).map(_humanizeToken);
  cuisinesClean = _dedupeKeepOrder(cuisinesClean).slice(0, 3);
  const hasWinery = hasPrefix('production.winery');
  const hasBrewery = hasPrefix('production.brewery');

  // --- Shopping ---
  const shoppingWeight = Math.max(
    weightForExact('commercial.shopping_mall'),
    weightForExact('commercial.marketplace'),
    weightForExact('commercial.gift_and_souvenir')
  );
  const hasShopping = shoppingWeight > 0;

  const hasShoppingMall = weightForExact('commercial.shopping_mall') > 0;
  const hasMarketplace = weightForExact('commercial.marketplace') > 0;
  const hasSouvenirs = weightForExact('commercial.gift_and_souvenir') > 0;

  // --- Fun / Sport ---
  const funWeight = Math.max(
    weightForPrefix('ski'),
    weightForPrefix('adult.nightclub'),
    weightForPrefix('adult.casino'),
    weightForPrefix('entertainment.theme_park'),
    weightForPrefix('sport.stadium')
  );
  const hasFun = funWeight > 0;

  const hasSki = hasPrefix('ski');
  const hasNightclub = hasPrefix('adult.nightclub');
  const hasCasino = hasPrefix('adult.casino');
  const hasThemePark = hasPrefix('entertainment.theme_park');
  const hasStadium = hasPrefix('sport.stadium');

  // Build weighted chunks
  const weightedChunks = []; // [weight, stableOrder, chunk]
  const stableOrder = { nature: 1, history: 2, gastronomy: 3, shopping: 4, fun: 5 };

  if (hasNature) {
    const base = natureItems.length > 0
      ? `beautiful landscapes like ${_joinNatural(natureItems)}`
      : 'beautiful landscapes for nature lovers';

    const chunk = _pickByWeight(natureWeight, [
      base,
      `${base} and outdoor activities`,
      `${base} with great natural diversity`,
      `${base} with a strong focus on nature`,
      `${base} as a top priority`,
    ]);
    weightedChunks.push([natureWeight, stableOrder.nature, chunk]);
  }

  if (hasHistory) {
    const historyBits = [];
    if (hasPrefix('heritage')) historyBits.push('historical heritage');
    if (sightsFinal.length > 0) {
      historyBits.push(`landmarks like ${_joinNatural(sightsFinal)}`);
    } else if (hasPrefix('tourism.sights')) {
      historyBits.push('iconic landmarks');
    }
    if (hasPrefix('religion')) historyBits.push('religious sites');
    if (hasPrefix('memorial')) historyBits.push('memorials');
    if (weightForExact('building.historic') > 0 && !historyBits.includes('historical heritage')) {
      historyBits.push('historic architecture');
    }

    const base = historyBits.length > 0 ? _joinNatural(_dedupeKeepOrder(historyBits)) : 'historical heritage';

    const chunk = _pickByWeight(historyWeight, [
      base,
      `${base} and cultural experiences`,
      `${base} with rich historical significance`,
      `${base} with a strong focus on culture and history`,
      `${base} as a top priority`,
    ]);
    weightedChunks.push([historyWeight, stableOrder.history, chunk]);
  }

  if (hasGastronomy) {
    const foodBits = [];
    if (hasPrefix('catering.restaurant')) {
      if (cuisinesClean.length > 0) {
        foodBits.push(`restaurants serving ${_joinNatural(cuisinesClean)} cuisine`);
      } else {
        foodBits.push('great local restaurants');
      }
    }
    if (hasWinery && hasBrewery) foodBits.push('wineries and breweries');
    else if (hasWinery) foodBits.push('wineries');
    else if (hasBrewery) foodBits.push('breweries');

    const base = foodBits.length > 0 ? _joinNatural(_dedupeKeepOrder(foodBits)) : 'great local restaurants';

    const chunk = _pickByWeight(gastronomyWeight, [
      base,
      `${base} and local specialties`,
      `${base} with diverse culinary offerings`,
      `${base} with a strong food focus`,
      `${base} as a top priority`,
    ]);
    weightedChunks.push([gastronomyWeight, stableOrder.gastronomy, chunk]);
  }

  if (hasShopping) {
    const shoppingBits = [];
    if (hasShoppingMall) shoppingBits.push('shopping malls');
    if (hasMarketplace) shoppingBits.push('local marketplaces');
    if (hasSouvenirs) shoppingBits.push('souvenir shops');
    
    const base = shoppingBits.length > 0 ? _joinNatural(_dedupeKeepOrder(shoppingBits)) : 'local marketplaces';

    const chunk = _pickByWeight(shoppingWeight, [
      base,
      `${base} and retail therapy`,
      `${base} with great shopping variety`,
      `${base} with a strong focus on shopping`,
      `${base} as a top priority`,
    ]);
    weightedChunks.push([shoppingWeight, stableOrder.shopping, chunk]);
  }

  if (hasFun) {
    const funBits = [];
    if (hasThemePark) funBits.push('theme parks');
    if (hasSki) funBits.push('skiing');
    if (hasStadium) funBits.push('stadium events');
    if (hasNightclub && hasCasino) funBits.push('nightlife and casinos');
    else if (hasNightclub) funBits.push('nightlife');
    else if (hasCasino) funBits.push('casinos');

    const base = funBits.length > 0 ? _joinNatural(_dedupeKeepOrder(funBits)) : 'nightlife';

    const chunk = _pickByWeight(funWeight, [
      base,
      `${base} and entertainment options`,
      `${base} with vibrant recreational activities`,
      `${base} with a strong focus on fun`,
      `${base} as a top priority`,
    ]);
    weightedChunks.push([funWeight, stableOrder.fun, chunk]);
  }

  if (weightedChunks.length === 0) {
    return 'A destination offering a mix of travel experiences and local atmosphere.';
  }

  // Sort by weight desc, then stable order
  weightedChunks.sort((a, b) => {
    if (b[0] !== a[0]) return b[0] - a[0];
    return a[1] - b[1];
  });

  const chunks = weightedChunks.map(x => x[2]).slice(0, 3);
  return `A destination featuring ${_joinNatural(_dedupeKeepOrder(chunks))}.`;
}

/**
 * Version simple sans poids (tous à 1)
 * @param {string[]} userCategories 
 * @returns {string}
 */
export function generateUserQuery(userCategories) {
  const categories = userCategories.map(c => String(c).trim()).filter(c => c);
  const catsSet = new Set(categories);

  function hasExact(value) {
    return catsSet.has(value);
  }

  function hasPrefix(prefix) {
    for (const c of catsSet) {
      if (c === prefix || c.startsWith(prefix + '.')) return true;
    }
    return false;
  }

  // --- Nature ---
  const hasNature = hasPrefix('natural') || hasPrefix('beach') || hasPrefix('island') || hasPrefix('national_park');

  let natureItems = [];
  natureItems.push(..._extractLeafValues(categories, 'natural'));
  if (hasPrefix('beach')) {
    natureItems.push('beach');
    natureItems.push(..._extractLeafValues(categories, 'beach'));
  }
  if (hasPrefix('island')) {
    natureItems.push('island');
    natureItems.push(..._extractLeafValues(categories, 'island'));
  }
  if (hasPrefix('national_park')) {
    natureItems.push('national_park');
    natureItems.push(..._extractLeafValues(categories, 'national_park'));
  }
  natureItems = natureItems.map(_humanizeToken);
  natureItems = _dedupeKeepOrder(natureItems).slice(0, 3);

  // --- History ---
  const hasHistoryPrefix = hasPrefix('heritage') || hasPrefix('tourism.sights') || 
                          hasPrefix('religion') || hasPrefix('memorial') || hasExact('building.historic');

  let sightsLeaf = _extractLeafValues(categories, 'tourism.sights');
  sightsLeaf = sightsLeaf.map(_humanizeToken);
  sightsLeaf = _dedupeKeepOrder(sightsLeaf);

  const preferredSights = new Set([
    'castle', 'ruines', 'monastery', 'cathedral', 'church', 'chapel',
    'mosque', 'synagogue', 'temple', 'archaeological site', 'fort', 'city gate'
  ]);
  const sightsPreferred = sightsLeaf.filter(s => preferredSights.has(s.toLowerCase()));
  const sightsOther = sightsLeaf.filter(s => !preferredSights.has(s.toLowerCase()));
  const sightsFinal = [...sightsPreferred, ...sightsOther].slice(0, 3);

  // --- Gastronomy ---
  const hasRestaurants = hasPrefix('catering.restaurant');
  const cuisines = _extractLeafValues(categories, 'catering.restaurant');
  const cuisinesBlacklist = new Set(['restaurant', 'regional']);
  let cuisinesClean = cuisines.filter(c => !cuisinesBlacklist.has(c)).map(_humanizeToken);
  cuisinesClean = _dedupeKeepOrder(cuisinesClean).slice(0, 3);

  const hasWinery = hasExact('production.winery') || hasPrefix('production.winery');
  const hasBrewery = hasExact('production.brewery') || hasPrefix('production.brewery');

  // --- Shopping ---
  const hasShoppingMall = hasExact('commercial.shopping_mall');
  const hasMarketplace = hasExact('commercial.marketplace');
  const hasSouvenirs = hasExact('commercial.gift_and_souvenir');

  // --- Fun / Sport ---
  const hasNightclub = hasPrefix('adult.nightclub');
  const hasCasino = hasPrefix('adult.casino');
  const hasThemePark = hasPrefix('entertainment.theme_park');
  const hasSki = hasPrefix('ski');
  const hasStadium = hasPrefix('sport.stadium');

  // Build chunks
  const chunks = [];

  if (hasNature) {
    if (natureItems.length > 0) {
      chunks.push(`beautiful landscapes like ${_joinNatural(natureItems)}`);
    } else {
      chunks.push('beautiful landscapes for nature lovers');
    }
  }

  if (hasHistoryPrefix) {
    const historyBits = [];
    if (hasPrefix('heritage')) historyBits.push('historical heritage');
    if (sightsFinal.length > 0) {
      historyBits.push(`landmarks like ${_joinNatural(sightsFinal)}`);
    } else if (hasPrefix('tourism.sights')) {
      historyBits.push('iconic landmarks');
    }
    if (hasPrefix('religion')) historyBits.push('religious sites');
    if (hasPrefix('memorial')) historyBits.push('memorials');
    if (hasExact('building.historic') && !historyBits.includes('historical heritage')) {
      historyBits.push('historic architecture');
    }

    if (historyBits.length > 0) {
      chunks.push(_joinNatural(_dedupeKeepOrder(historyBits)));
    }
  }

  if (hasRestaurants || hasWinery || hasBrewery) {
    const foodBits = [];
    if (hasRestaurants) {
      if (cuisinesClean.length > 0) {
        foodBits.push(`restaurants serving ${_joinNatural(cuisinesClean)} cuisine`);
      } else {
        foodBits.push('great local restaurants');
      }
    }
    if (hasWinery && hasBrewery) foodBits.push('wineries and breweries');
    else if (hasWinery) foodBits.push('wineries');
    else if (hasBrewery) foodBits.push('breweries');

    if (foodBits.length > 0) {
      chunks.push(_joinNatural(_dedupeKeepOrder(foodBits)));
    }
  }

  const shoppingBits = [];
  if (hasShoppingMall) shoppingBits.push('shopping malls');
  if (hasMarketplace) shoppingBits.push('local marketplaces');
  if (hasSouvenirs) shoppingBits.push('souvenir shops');
  if (shoppingBits.length > 0) {
    chunks.push(_joinNatural(_dedupeKeepOrder(shoppingBits)));
  }

  const funBits = [];
  if (hasThemePark) funBits.push('theme parks');
  if (hasSki) funBits.push('skiing');
  if (hasStadium) funBits.push('stadium events');
  if (hasNightclub && hasCasino) funBits.push('nightlife and casinos');
  else if (hasNightclub) funBits.push('nightlife');
  else if (hasCasino) funBits.push('casinos');

  if (funBits.length > 0) {
    chunks.push(_joinNatural(_dedupeKeepOrder(funBits)));
  }

  if (chunks.length === 0) {
    return 'A destination offering a mix of travel experiences and local atmosphere.';
  }

  return `A destination featuring ${_joinNatural(_dedupeKeepOrder(chunks).slice(0, 3))}.`;
}
