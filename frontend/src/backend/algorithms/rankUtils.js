import { cosineSimilarity } from "./vectorUtils.js";
import CityRepository from "../repositories/CityRepository.js";
import UserCategoryRepository from "../repositories/UserCategoryRepository.js";
import InferenceService from "../services/InferenceService.js";
import { Logger } from "../utils/Logger.js";
import dbConnection from "../database/connection.js";

// Facteur de pénalité par point de dislike (max 5 points × 0.05 = 0.25 de pénalité max)
const DISLIKE_PENALTY_FACTOR = 0.05;

/**
 * Classe les villes par similarité avec une requête utilisateur (texte en langage naturel).
 *
 * @param {string} userQuery - Requête utilisateur en langage naturel
 * @param {number} [limit=10] - Nombre de villes à retourner
 * @returns {Promise<Array>} - Top N des villes triées par similarité décroissante
 */
export async function rankCitiesBySimilarity(userQuery, limit = 10) {
  try {
    Logger.debug("Classement des villes par similarité...");
    Logger.debug(`Requête utilisateur: "${userQuery}"`);

    // Générer l'embedding de la requête utilisateur
    const userEmbedding = await InferenceService.generateEmbedding(userQuery);
    Logger.debug(`Embedding généré (${userEmbedding.length} dimensions)`);

    // Récupération de toutes les villes avec leurs embeddings
    const cities = await CityRepository.getAllCityEmbeddings();
    Logger.debug(`${cities.length} villes récupérées`);

    // Calcul de la similarité pour chaque ville
    const rankedCities = cities.map((city) => {
      const similarity = cosineSimilarity(userEmbedding, city.embedding);
      return {
        id: city.id,
        name: city.name,
        similarity: similarity,
      };
    });

    // Tri par similarité décroissante
    rankedCities.sort((a, b) => b.similarity - a.similarity);

    // Retourner le top N
    const topN = rankedCities.slice(0, limit);

    Logger.debug(`Top ${limit} villes les plus similaires:`);
    topN.forEach((city, index) => {
      Logger.debug(
        `  ${index + 1}. ${city.name} (ID: ${city.id}) - Similarité: ${city.similarity.toFixed(4)}`
      );
    });

    return topN;
  } catch (error) {
    Logger.error("Erreur lors du classement des villes:", error);
    throw error;
  }
}

/**
 * Récupère les noms de catégories présentes dans une ville via place_categories
 * @param {number} cityId - ID de la ville
 * @returns {Promise<string[]>} - Liste des noms de catégories
 */
export async function getCityCategoryNames(cityId) {
  try {
    const result = await dbConnection.executeSql(
      `SELECT DISTINCT c.name 
       FROM categories c
       JOIN place_categories pc ON c.id = pc.category_id
       JOIN places p ON pc.place_id = p.id
       WHERE p.city_id = ?;`,
      [cityId]
    );
    return result.rows._array.map((row) => row.name);
  } catch (error) {
    Logger.error("Erreur récupération catégories ville:", error);
    return [];
  }
}

/**
 * Calcule la pénalité totale pour une ville basée sur les dislikes de l'utilisateur
 * Formule: Σ(points × DISLIKE_PENALTY_FACTOR) pour chaque catégorie dislikée présente dans la ville
 * 
 * @param {number} cityId - ID de la ville
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Pénalité totale (0 si aucune catégorie dislikée)
 */
export async function calculateCityPenalty(cityId, userId) {
  try {
    // Récupérer les catégories présentes dans la ville
    const cityCategories = await getCityCategoryNames(cityId);
    
    // Récupérer les dislikes de l'utilisateur
    const userDislikes = await UserCategoryRepository.getUserDislikes(userId);
    
    // Calculer la pénalité totale
    let totalPenalty = 0;
    for (const dislike of userDislikes) {
      if (cityCategories.includes(dislike.category_name)) {
        totalPenalty += dislike.points * DISLIKE_PENALTY_FACTOR;
      }
    }
    
    return totalPenalty;
  } catch (error) {
    Logger.error("Erreur calcul pénalité ville:", error);
    return 0;
  }
}

/**
 * Classe les villes avec pénalité pour les dislikes
 */
export async function rankCitiesWithPenalty(userQuery, userId, limit = 10) {
  try {
    Logger.debug("Classement des villes avec pénalité...");
    
    // Générer l'embedding de la requête
    const userEmbedding = await InferenceService.generateEmbedding(userQuery);
    Logger.debug(`Embedding généré (${userEmbedding.length} dimensions)`);
    
    const cities = await CityRepository.getAllCityEmbeddings();
    Logger.debug(`${cities.length} villes récupérées`);
    
    // Calcul similarité + pénalité pour chaque ville
    const rankedCities = await Promise.all(
      cities.map(async (city) => {
        const similarity = cosineSimilarity(userEmbedding, city.embedding);
        const penalty = await calculateCityPenalty(city.id, userId);
        const score = similarity - penalty;
        
        return {
          id: city.id,
          name: city.name,
          similarity: similarity,
          penalty: penalty,
          score: score
        };
      })
    );
    
    // Tri par score décroissant
    rankedCities.sort((a, b) => b.score - a.score);
    
    const topN = rankedCities.slice(0, limit);
    
    Logger.debug(`Top ${limit} villes (avec pénalité):`);
    topN.forEach((city, index) => {
      Logger.debug(
        `  ${index + 1}. ${city.name} - Score: ${city.score.toFixed(4)} (sim: ${city.similarity.toFixed(4)} - pen: ${city.penalty.toFixed(4)})`
      );
    });
    
    return topN;
  } catch (error) {
    Logger.error("Erreur classement avec pénalité:", error);
    throw error;
  }
}
