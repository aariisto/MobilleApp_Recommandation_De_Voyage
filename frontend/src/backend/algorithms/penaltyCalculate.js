/**
 * Module de calcul des scores de pénalité basés sur les éléments détestés par l'utilisateur.
 * Port JavaScript du fichier penality_calculate.py
 */

import { Logger } from "../utils/Logger.js";
import UserCategoryRepository from "../repositories/UserCategoryRepository.js";
import CategoryRepository from "../repositories/CategoryRepository.js";

/**
 * Calcule un score de pénalité basé sur les éléments que l'utilisateur déteste.
 *
 * @param {string[]} cityTags - Liste des catégories de la ville
 *                              (ex: ['adult.nightclub', 'museum', 'heritage.unesco'])
 * @param {Object} userDislikes - Dictionnaire des catégories détestées avec poids
 *                               Clé: catégorie détestée
 *                               Valeur: poids du dégoût (1-5)
 *                               Exemple: {'adult.nightclub': 5, 'parking': 2}
 *
 * @returns {number} Score de pénalité à soustraire du score de similarité global
 *                  Formule: Penalty += 0.05 × Poids pour chaque catégorie détestée présente
 *
 * @example
 * const cityTags = ['adult.nightclub', 'museum', 'heritage.unesco'];
 * const userDislikes = {'adult.nightclub': 5, 'parking': 2};
 * const penalty = calculatePenaltyScore(cityTags, userDislikes);
 * // Résultat: 0.25
 * // Calcul: adult.nightclub présent → 0.05 × 5 = 0.25
 * //         parking absent → pas de pénalité
 */
export function calculatePenaltyScore(cityTags, userDislikes) {
  // Vérification des entrées
  if (
    !cityTags ||
    cityTags.length === 0 ||
    !userDislikes ||
    Object.keys(userDislikes).length === 0
  ) {
    return 0.0;
  }

  // Convertir cityTags en Set pour une recherche O(1) efficace
  const cityTagsSet = new Set(cityTags);

  let penalty = 0.0;

  // Parcourir chaque catégorie détestée
  for (const [dislikedCategory, weight] of Object.entries(userDislikes)) {
    // Vérifier si la catégorie détestée est présente dans la ville
    if (cityTagsSet.has(dislikedCategory)) {
      // Appliquer la formule : Penalty += 0.05 × Poids
      penalty += 0.05 * weight;
    }
  }

  return penalty;
}

/**
 * Calcule directement le score de pénalité pour une ville depuis la base de données.
 *
 * @param {number} cityId - ID de la ville
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<number>} Score de pénalité calculé
 *
 * @example
 * const penalty = await calculatePenaltyForCity(1, 123);
 * console.log(`Pénalité pour la ville ID 1 et utilisateur ID 123: ${penalty}`);
 */
export async function calculatePenaltyForCity(cityId, userId) {
  try {
    // Récupérer les catégories de la ville
    const cityTags = await CategoryRepository.getCityCategoriesByCity(cityId);

    if (!cityTags || cityTags.length === 0) {
      return 0.0;
    }

    // Récupérer les dislikes de l'utilisateur
    const userDislikesArray = await UserCategoryRepository.getUserDislikes(
      userId
    );

    // Préparer les données au format attendu par calculatePenaltyScore
    // Convertir le tableau [{category_name: 'xxx', points: 5}, ...]
    // en objet {'xxx': 5, ...}
    const userDislikes = {};
    for (const dislike of userDislikesArray) {
      userDislikes[dislike.category_name] = dislike.points;
    }

    // Calculer la pénalité
    return calculatePenaltyScore(cityTags, userDislikes);
  } catch (error) {
    Logger.error(
      `Erreur lors du calcul de la pénalité pour la ville ${cityId}:`,
      error
    );
    return 0.0;
  }
}
