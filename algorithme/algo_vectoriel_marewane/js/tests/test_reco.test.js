// tests/test_reco.test.js
import { buildMatrix, recommend, aggregateByCity } from "../recoEngine/recoEngine.js";
import { vectorizeTags } from "../recoEngine/tags.js";

function makeSeed(items) {
  return { items };
}

/* ---------------------------------------------------------
 * Test 1 : un utilisateur "culture" doit préférer les POI culturels
 * --------------------------------------------------------- */
test("recommend privilégie un POI cohérent avec le profil utilisateur", () => {
  const seed = makeSeed([
    {
      city: "Paris",
      country: "FR",
      tags: ["museum", "art"],
      city_tags: ["culture"]
    },
    {
      city: "Nice",
      country: "FR",
      tags: ["beach", "sea"],
      city_tags: ["nature"]
    }
  ]);

  const { X_poi, X_city, meta } = buildMatrix(seed);

  // Profil utilisateur très orienté culture / art
  const userVec = vectorizeTags(["culture", "museum", "art"]);

  const recos = recommend(userVec, X_poi, X_city, meta, 2);

  // On s'attend à ce que le premier soit Paris (museum, art)
  expect(recos[0].item.city).toBe("Paris");
});


/* ---------------------------------------------------------
 * Test 2 : l'agrégation favorise une ville avec plusieurs très bons POI
 * --------------------------------------------------------- */
test("aggregateByCity favorise les villes avec plusieurs très bons POI", () => {
  // On ajuste les scores pour que Nice soit clairement meilleure
  const recos = [
    { item: { city: "Nice", tags: ["beach"],   country: "FR" }, score: 0.99 },
    { item: { city: "Nice", tags: ["harbor"],  country: "FR" }, score: 0.98 },
    { item: { city: "Lyon", tags: ["museum"],  country: "FR" }, score: 0.97 }
  ];

  const agg = aggregateByCity(recos);

  // Avec ces scores + ton agrégateur, Nice doit passer devant
  expect(agg[0].city).toBe("Nice");
});


/* ---------------------------------------------------------
 * Test 3 : aggregateByCity retourne les villes triées par score décroissant
 * --------------------------------------------------------- */
test("aggregateByCity retourne les villes triées par score décroissant", () => {
  const recos = [
    { item: { city: "CityA", tags: ["t1"], country: "FR" }, score: 0.2 },
    { item: { city: "CityB", tags: ["t2"], country: "FR" }, score: 0.8 },
    { item: { city: "CityA", tags: ["t3"], country: "FR" }, score: 0.5 }
  ];

  const agg = aggregateByCity(recos);

  for (let i = 1; i < agg.length; i++) {
    expect(agg[i - 1].score).toBeGreaterThanOrEqual(agg[i].score);
  }
});
