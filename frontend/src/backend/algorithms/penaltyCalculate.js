/**
 * Module de calcul des scores de pénalité basés sur les éléments détestés par l'utilisateur.
 * Port JavaScript du fichier penality_calculate.py
 */

import dbConnection from "../database/connection.js";
import { Logger } from "../utils/Logger.js";

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
  if (!cityTags || cityTags.length === 0 || !userDislikes || Object.keys(userDislikes).length === 0) {
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
 * Récupère les catégories d'une ville depuis la base de données SQLite.
 * 
 * @param {number} cityId - ID de la ville dans la base de données
 * @returns {Promise<string[]>} Liste des catégories de la ville
 *                              (ex: ['heritage.unesco', 'museum', 'restaurant.french'])
 * 
 * @example
 * const categories = await getCityCategoriesFromDb(1);
 * console.log(categories);
 * // ['heritage.unesco', 'tourism.sights.castle', 'catering.restaurant.french']
 */
export async function getCityCategoriesFromDb(cityId) {
  try {
    // Requête pour récupérer toutes les catégories d'une ville
    const query = `
      SELECT DISTINCT c.name as category_name
      FROM cities ci
      JOIN places p ON p.city_id = ci.id
      JOIN place_categories pc ON pc.place_id = p.id
      JOIN categories c ON c.id = pc.category_id
      WHERE ci.id = ?
      ORDER BY c.name
    `;

    const result = await dbConnection.executeSql(query, [cityId]);

    // Extraire les noms de catégories
    const categories = result.rows._array.map(row => row.category_name);

    Logger.debug(`✓ ${categories.length} catégories récupérées pour la ville ID ${cityId}`);

    return categories;

  } catch (error) {
    Logger.error(`Erreur lors de la récupération des catégories pour la ville ${cityId}:`, error);
    return [];
  }
}

/**
 * Calcule directement le score de pénalité pour une ville depuis la base de données.
 * 
 * @param {number} cityId - ID de la ville
 * @param {Object} userDislikes - Dictionnaire des catégories détestées avec poids
 * @returns {Promise<number>} Score de pénalité calculé
 * 
 * @example
 * const userDislikes = {'adult.nightclub': 5, 'parking': 2};
 * const penalty = await calculatePenaltyForCity(1, userDislikes);
 * console.log(`Pénalité pour la ville ID 1: ${penalty}`);
 */
export async function calculatePenaltyForCity(cityId, userDislikes) {
  try {
    // Récupérer les catégories de la ville
    const cityTags = await getCityCategoriesFromDb(cityId);

    if (!cityTags || cityTags.length === 0) {
      return 0.0;
    }

    // Calculer la pénalité
    return calculatePenaltyScore(cityTags, userDislikes);

  } catch (error) {
    Logger.error(`Erreur lors du calcul de la pénalité pour la ville ${cityId}:`, error);
    return 0.0;
  }
}
