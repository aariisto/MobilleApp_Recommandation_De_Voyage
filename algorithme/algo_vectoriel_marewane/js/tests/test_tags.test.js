import { mapTags, vectorizeTags } from "../recoEngine/tags.js";

test("vectorizeTags renvoie bien un vecteur non vide", () => {
  const vec = vectorizeTags(["museum", "art"]);
  expect(Array.isArray(vec)).toBe(true);
  expect(vec.length).toBeGreaterThan(0);
});

test("mapTags unifie bien les tags", () => {
  const tags = mapTags(["museum", "art_museum"]);
  expect(tags.length).toBeGreaterThan(0);
});
