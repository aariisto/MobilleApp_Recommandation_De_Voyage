/**
 * Utilitaires pour la manipulation de vecteurs
 * Conversion BLOB <-> Array et opérations vectorielles
 */

/**
 * Convertit un BLOB SQLite en tableau de nombres (Float64Array)
 * @param {Uint8Array} blob - BLOB depuis SQLite
 * @returns {Float64Array}
 */
export const blobToVector = (blob) => {
  if (!blob) return null;
  
  try {
    // Convertir Uint8Array en Float64Array
    const buffer = blob.buffer || blob;
    const float64Array = new Float64Array(buffer);
    return float64Array;
  } catch (error) {
    console.error('Error converting blob to vector:', error);
    return null;
  }
};

/**
 * Convertit un tableau de nombres en BLOB pour SQLite
 * @param {Array<number>|Float64Array} vector - Vecteur à convertir
 * @returns {Uint8Array}
 */
export const vectorToBlob = (vector) => {
  if (!vector || vector.length === 0) return null;
  
  try {
    // Créer un Float64Array si ce n'est pas déjà le cas
    const float64Array = vector instanceof Float64Array 
      ? vector 
      : new Float64Array(vector);
    
    // Convertir en Uint8Array (BLOB)
    const uint8Array = new Uint8Array(float64Array.buffer);
    return uint8Array;
  } catch (error) {
    console.error('Error converting vector to blob:', error);
    return null;
  }
};

/**
 * Normalise un vecteur (norme L2 = 1)
 * @param {Array<number>|Float64Array} vector
 * @returns {Float64Array}
 */
export const normalizeVector = (vector) => {
  if (!vector || vector.length === 0) return null;
  
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  
  if (norm === 0) return new Float64Array(vector.length);
  
  return new Float64Array(vector.map(val => val / norm));
};

/**
 * Calcule la magnitude (norme) d'un vecteur
 * @param {Array<number>|Float64Array} vector
 * @returns {number}
 */
export const vectorMagnitude = (vector) => {
  if (!vector || vector.length === 0) return 0;
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
};

/**
 * Additionne deux vecteurs
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {Float64Array}
 */
export const addVectors = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return new Float64Array(v1.map((val, i) => val + v2[i]));
};

/**
 * Soustrait deux vecteurs (v1 - v2)
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {Float64Array}
 */
export const subtractVectors = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return new Float64Array(v1.map((val, i) => val - v2[i]));
};

/**
 * Multiplie un vecteur par un scalaire
 * @param {Array<number>|Float64Array} vector
 * @param {number} scalar
 * @returns {Float64Array}
 */
export const scaleVector = (vector, scalar) => {
  if (!vector) return null;
  return new Float64Array(vector.map(val => val * scalar));
};

/**
 * Produit scalaire (dot product) de deux vecteurs
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {number}
 */
export const dotProduct = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return v1.reduce((sum, val, i) => sum + val * v2[i], 0);
};

/**
 * Moyenne de plusieurs vecteurs
 * @param {Array<Array<number>|Float64Array>} vectors
 * @returns {Float64Array}
 */
export const averageVectors = (vectors) => {
  if (!vectors || vectors.length === 0) return null;
  
  const length = vectors[0].length;
  const sum = new Float64Array(length);
  
  vectors.forEach(vector => {
    if (vector.length !== length) {
      throw new Error('All vectors must have the same length');
    }
    vector.forEach((val, i) => {
      sum[i] += val;
    });
  });
  
  return new Float64Array(sum.map(val => val / vectors.length));
};

/**
 * Vérifie si un vecteur est normalisé (norme ≈ 1)
 * @param {Array<number>|Float64Array} vector
 * @param {number} epsilon - Tolérance (défaut: 0.001)
 * @returns {boolean}
 */
export const isNormalized = (vector, epsilon = 0.001) => {
  if (!vector || vector.length === 0) return false;
  const magnitude = vectorMagnitude(vector);
  return Math.abs(magnitude - 1.0) < epsilon;
};

/**
 * Crée un vecteur zéro de dimension donnée
 * @param {number} dimension
 * @returns {Float64Array}
 */
export const zeroVector = (dimension) => {
  return new Float64Array(dimension);
};

/**
 * Crée un vecteur aléatoire normalisé
 * @param {number} dimension
 * @returns {Float64Array}
 */
export const randomNormalizedVector = (dimension) => {
  const vector = new Float64Array(dimension);
  
  // Générer des valeurs aléatoires
  for (let i = 0; i < dimension; i++) {
    vector[i] = Math.random() * 2 - 1; // Valeurs entre -1 et 1
  }
  
  // Normaliser
  return normalizeVector(vector);
};
