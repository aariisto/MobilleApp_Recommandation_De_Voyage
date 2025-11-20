/**
 * Algorithmes de calcul de similarité vectorielle
 * Pour les recommandations basées sur les embeddings
 */

import { dotProduct, vectorMagnitude, normalizeVector } from './vectorUtils';

/**
 * Calcule la similarité cosinus entre deux vecteurs
 * Retourne une valeur entre -1 et 1 (1 = identiques, 0 = orthogonaux, -1 = opposés)
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {number}
 */
export const cosineSimilarity = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const dot = dotProduct(v1, v2);
  const mag1 = vectorMagnitude(v1);
  const mag2 = vectorMagnitude(v2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dot / (mag1 * mag2);
};

/**
 * Calcule la distance euclidienne entre deux vecteurs
 * Plus la distance est petite, plus les vecteurs sont similaires
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {number}
 */
export const euclideanDistance = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const sumSquares = v1.reduce((sum, val, i) => {
    const diff = val - v2[i];
    return sum + diff * diff;
  }, 0);
  
  return Math.sqrt(sumSquares);
};

/**
 * Calcule la distance de Manhattan entre deux vecteurs
 * @param {Array<number>|Float64Array} v1
 * @param {Array<number>|Float64Array} v2
 * @returns {number}
 */
export const manhattanDistance = (v1, v2) => {
  if (!v1 || !v2 || v1.length !== v2.length) {
    throw new Error('Vectors must have the same length');
  }
  
  return v1.reduce((sum, val, i) => sum + Math.abs(val - v2[i]), 0);
};

/**
 * Trouve les k vecteurs les plus similaires à un vecteur de référence
 * @param {Array<number>|Float64Array} targetVector - Vecteur de référence
 * @param {Array<{id: any, vector: Array<number>|Float64Array}>} candidates - Liste des candidats
 * @param {number} k - Nombre de résultats à retourner
 * @param {string} metric - Métrique à utiliser ('cosine', 'euclidean', 'manhattan')
 * @returns {Array<{id: any, score: number}>}
 */
export const findTopKSimilar = (targetVector, candidates, k = 10, metric = 'cosine') => {
  if (!targetVector || !candidates || candidates.length === 0) {
    return [];
  }
  
  // Calculer les scores de similarité
  const scored = candidates.map(candidate => {
    let score;
    
    switch (metric) {
      case 'euclidean':
        // Pour la distance euclidienne, inverser pour que plus grand = plus similaire
        score = 1 / (1 + euclideanDistance(targetVector, candidate.vector));
        break;
      
      case 'manhattan':
        // Pour la distance de Manhattan, inverser pour que plus grand = plus similaire
        score = 1 / (1 + manhattanDistance(targetVector, candidate.vector));
        break;
      
      case 'cosine':
      default:
        score = cosineSimilarity(targetVector, candidate.vector);
        break;
    }
    
    return {
      id: candidate.id,
      score: score,
      ...candidate.metadata // Inclure les métadonnées supplémentaires si présentes
    };
  });
  
  // Trier par score décroissant et prendre les k premiers
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, k);
};

/**
 * Filtre les résultats en dessous d'un seuil de similarité
 * @param {Array<{id: any, score: number}>} results
 * @param {number} threshold - Seuil minimum (0-1 pour cosine)
 * @returns {Array<{id: any, score: number}>}
 */
export const filterByThreshold = (results, threshold = 0.5) => {
  return results.filter(result => result.score >= threshold);
};

/**
 * Normalise les scores entre 0 et 1
 * @param {Array<{id: any, score: number}>} results
 * @returns {Array<{id: any, score: number, normalizedScore: number}>}
 */
export const normalizeScores = (results) => {
  if (results.length === 0) return results;
  
  const scores = results.map(r => r.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;
  
  if (range === 0) {
    return results.map(r => ({ ...r, normalizedScore: 1 }));
  }
  
  return results.map(r => ({
    ...r,
    normalizedScore: (r.score - minScore) / range
  }));
};

/**
 * Calcule la diversité d'un ensemble de vecteurs (moyenne des distances par paires)
 * Plus le score est élevé, plus les vecteurs sont divers
 * @param {Array<Array<number>|Float64Array>} vectors
 * @returns {number}
 */
export const calculateDiversity = (vectors) => {
  if (!vectors || vectors.length < 2) return 0;
  
  let totalDistance = 0;
  let count = 0;
  
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      totalDistance += euclideanDistance(vectors[i], vectors[j]);
      count++;
    }
  }
  
  return count > 0 ? totalDistance / count : 0;
};

/**
 * Ré-ordonne les résultats pour maximiser la diversité (MMR - Maximal Marginal Relevance)
 * @param {Array<{id: any, score: number, vector: Array<number>}>} results
 * @param {number} lambda - Balance entre pertinence et diversité (0-1, défaut 0.5)
 * @returns {Array<{id: any, score: number}>}
 */
export const diversifyResults = (results, lambda = 0.5) => {
  if (!results || results.length <= 1) return results;
  
  const diversified = [];
  const remaining = [...results];
  
  // Commencer par le résultat le plus pertinent
  diversified.push(remaining.shift());
  
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      
      // Calculer la similarité minimale avec les éléments déjà sélectionnés
      const minSimilarity = Math.min(
        ...diversified.map(selected => 
          cosineSimilarity(candidate.vector, selected.vector)
        )
      );
      
      // Score MMR = lambda * pertinence - (1 - lambda) * similarité_max
      const mmrScore = lambda * candidate.score - (1 - lambda) * minSimilarity;
      
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }
    
    diversified.push(remaining.splice(bestIndex, 1)[0]);
  }
  
  return diversified;
};
