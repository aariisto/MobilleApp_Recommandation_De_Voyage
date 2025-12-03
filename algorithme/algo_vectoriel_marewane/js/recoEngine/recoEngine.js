// js/recoEngine/recoEngine.js
import { vectorizeTags300D } from "./tags300D.js";
import { NUM_TAGS } from "./tags300D.js";


/* ---------------------------------------------------------
   1) Poids de combinaison (identiques à Python)
--------------------------------------------------------- */
export const ALPHA = 0.7;   // importance du détail POI
export const BETA  = 0.3;   // importance du contexte ville


/* ---------------------------------------------------------
   2) Construction des matrices vectorielles
--------------------------------------------------------- */
export function buildMatrix(seed) {
  const X_poi = [];
  const X_city = [];
  const meta = [];

  for (const it of seed.items || []) {
    // Version 287 tags : utiliser directement les catégories brutes
  const rawPoiTags = it.tags || it.categories || [];
  const vecPoi = vectorizeTags300D(rawPoiTags);

  const rawCityTags = it.city_tags || [];
  const vecCity = vectorizeTags300D(rawCityTags);


    X_poi.push(vecPoi);
    X_city.push(vecCity);
    meta.push(it);
  }

  return { X_poi, X_city, meta };
}


/* ---------------------------------------------------------
   3) Similarité brute POI + ville
--------------------------------------------------------- */
export function recommend(userVec, X_poi, X_city, meta, k = 300) {
  const results = [];

  for (let i = 0; i < X_poi.length; i++) {
    const simPoi = dot(userVec, X_poi[i]);
    const simCity = dot(userVec, X_city[i]);

    const score = ALPHA * simPoi + BETA * simCity;

    results.push({
      item: meta[i],
      score
    });
  }

  // top k trié
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}


/* ---------------------------------------------------------
   4) Agrégation par ville (identique à Python)
--------------------------------------------------------- */
export function aggregateByCity(recos) {
  const grouped = new Map();

  // Grouper
  for (const r of recos) {
    if (!grouped.has(r.item.city)) grouped.set(r.item.city, []);
    grouped.get(r.item.city).push(r);
  }

  const out = [];

  for (const [city, items] of grouped.entries()) {
    const scores = items.map(r => r.score).sort((a, b) => b - a);
    const top3 = scores.slice(0, 3);

    const maxScore = top3[0];
    const meanTop3 = top3.reduce((s, v) => s + v, 0) / top3.length;

    // Diversité basée sur tous les tags bruts OSM (287 tags)
    const tagSet = new Set();

    for (const r of items) {
      const rawTags = r.item.tags || r.item.categories || [];
      for (const t of rawTags) {
        tagSet.add(t);
      }
    }

    // Normalisation : diversité / tags totaux
    const diversity = tagSet.size / NUM_TAGS;  // NUM_TAGS = 287


    const finalScore =
      0.6 * maxScore +
      0.3 * meanTop3 +
      0.1 * diversity;

    out.push({
      city,
      country: items[0].item.country,
      score: finalScore,
      tags: [...tagSet]
    });
  }

  // Tri final
  out.sort((a, b) => b.score - a.score);
  return out;
}


/* ---------------------------------------------------------
   5) Produit scalaire
--------------------------------------------------------- */
function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
  }
  return s;
}
