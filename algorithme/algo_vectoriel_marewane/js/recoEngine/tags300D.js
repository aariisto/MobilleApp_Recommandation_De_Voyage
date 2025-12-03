// tags300D.js
// Vectorizer 287D basé sur tag_index.json

import tagList from "./tag_index.json" assert { type: "json" };

// Nombre total de tags (287 dans ton extrait)
export const NUM_TAGS = tagList.length;

// Mapping tag → index
export const TAG_TO_INDEX = Object.fromEntries(
  tagList.map((t, i) => [t, i])
);

// Fonction de vectorisation : one-hot multi-tag
export function vectorizeTags300D(tags) {
  const vec = new Array(NUM_TAGS).fill(0);

  for (const t of tags) {
    const idx = TAG_TO_INDEX[t];
    if (idx !== undefined) {
      vec[idx] = 1;
    }
  }

  return vec;
}
