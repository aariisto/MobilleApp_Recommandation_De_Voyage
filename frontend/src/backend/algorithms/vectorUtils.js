/**
 * Convertit un BLOB SQLite en array de nombres (vecteur)
 * @param {Uint8Array|ArrayBuffer} blob - Les données BLOB du vecteur
 * @returns {number[]} - Le vecteur sous forme d'array
 */
export function blobToVector(blob) {
  if (!blob) return [];

  // Convertir en Uint8Array si nécessaire
  const uint8Array = blob instanceof Uint8Array ? blob : new Uint8Array(blob);

  // Créer un DataView pour lire les float64
  const dataView = new DataView(
    uint8Array.buffer,
    uint8Array.byteOffset,
    uint8Array.byteLength
  );

  // Lire les valeurs float64 (8 octets chacun)
  const vector = [];
  for (let i = 0; i < uint8Array.length; i += 8) {
    vector.push(dataView.getFloat64(i, true)); // true = little-endian
  }

  return vector;
}

/**
 * Convertit un array de nombres en BLOB SQLite
 * @param {number[]} vector - Le vecteur sous forme d'array
 * @returns {Uint8Array} - Les données BLOB
 */
export function vectorToBlob(vector) {
  if (!Array.isArray(vector) || vector.length === 0) {
    return new Uint8Array(0);
  }

  // Créer un ArrayBuffer pour 8 octets par nombre (float64)
  const buffer = new ArrayBuffer(vector.length * 8);
  const dataView = new DataView(buffer);

  // Écrire chaque nombre en float64 (little-endian)
  for (let i = 0; i < vector.length; i++) {
    dataView.setFloat64(i * 8, vector[i], true); // true = little-endian
  }

  return new Uint8Array(buffer);
}

/**
 * Calcule la similitude cosinus entre deux vecteurs
 * @param {number[]} vec1 - Premier vecteur
 * @param {number[]} vec2 - Deuxième vecteur
 * @returns {number} - Similitude cosinus (0-1)
 */
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length || vec1.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}
