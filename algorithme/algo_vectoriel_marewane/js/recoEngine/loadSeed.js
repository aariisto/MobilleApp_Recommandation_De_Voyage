// js/recoEngine/loadSeed.js
import fs from "fs";

export function loadSeed(path) {
  const raw = JSON.parse(fs.readFileSync(path, "utf-8"));

  const items = [];

  // raw = array of cities
  for (const city of raw) {
    const cityName = city.city;
    const country = city.country;
    const cityTags = city.city_tags || [];

    for (const poi of city.pois) {
      items.push({
        city: cityName,
        country: country,
        lat: poi.lat ?? city.lat,
        lon: poi.lon ?? city.lon,
        tags: poi.categories || [],   // <-- ⚡️ LES 287 TAGS COMPLETS
        city_tags: cityTags
      });
    }
  }

  return { items };
}
