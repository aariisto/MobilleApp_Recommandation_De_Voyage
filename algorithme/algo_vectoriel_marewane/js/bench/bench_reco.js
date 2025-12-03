// bench/bench_reco.js
import path from "path";
import { fileURLToPath } from "url";

import { loadSeed } from "../recoEngine/loadSeed.js";
import { buildMatrix, recommend, aggregateByCity } from "../recoEngine/recoEngine.js";
import { vectorizeTags } from "../recoEngine/tags.js";

// ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1) Charger le seed "cleaned"
const seedPath = path.join(__dirname, "../../data/cities_geocoded_pois.json");

console.log("📦 Seed utilisé :", seedPath);

console.time("loadSeed");
const seed = loadSeed(seedPath);
console.timeEnd("loadSeed");

console.log("Nombre d’items (POI) :", seed.items.length);

// 2) Construire les matrices
console.time("buildMatrix");
const { X_poi, X_city, meta } = buildMatrix(seed);
console.timeEnd("buildMatrix");

console.log("Vecteurs POI :", X_poi.length);
console.log("Vecteurs Ville :", X_city.length);

// 3) Profils utilisateur (avec les 3 tags existants)
const PROFILES = {
  // Profil 1 : Gastronomie
  food_lover: [
    "catering.restaurant",
    "catering.cafe",
    "catering.bar"
  ],

  // Profil 2 : Vie nocturne
  nightlife: [
    "adult.nightclub",
    "catering.bar"
  ],

  // Profil 3 : Activités sportives
  sports: [
    "activity.sport_club",
    "building.sport"
  ],

  // Profil 4 : Culture
  culture: [
    "tourism.museum",
    "building.historic",
    "tourism.attraction"
  ],

  // Profil 5 : Nature
  nature: [
    "beach",
    "beach.beach_resort",
    "natural.park",
    "natural.lake"
  ],

  // Profil 6 : Hébergement
  hotel_traveler: [
    "accommodation.hotel",
    "accommodation.hostel",
    "accommodation.guest_house"
  ]
};


console.log("\n========================");
console.log("📊 BENCHMARK PROFILS (seed actuel)");
console.log("========================\n");

for (const [name, tags] of Object.entries(PROFILES)) {
  console.log(`\n>>> Profil : ${name} (tags = ${tags.join(", ")})`);
  console.log("---------------------------------------");

  const userVec = vectorizeTags(tags);

  console.time("recommend");
  const recos = recommend(userVec, X_poi, X_city, meta, 300);
  console.timeEnd("recommend");

  console.time("aggregateByCity");
  const cities = aggregateByCity(recos);
  console.timeEnd("aggregateByCity");

  console.log("\nTop 5 villes :");
  cities.slice(0, 5).forEach((c, i) => {
    console.log(
      ` ${i + 1}. ${c.city} (${c.country}) — score=${c.score.toFixed(4)}`
    );
  });
}

console.log("\n🏁 Benchmark terminé.\n");
