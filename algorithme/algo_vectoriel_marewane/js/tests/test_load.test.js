import { loadSeed } from "../recoEngine/loadSeed.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("loadSeed charge bien un seed JSON valide", () => {
  const seedPath = path.join(__dirname, "../../data/cities_cleaned_geo.json");
  const seed = loadSeed(seedPath);

  // On s'assure que le seed a bien un tableau "items"
  expect(seed.items).toBeDefined();
  expect(Array.isArray(seed.items)).toBe(true);
});
