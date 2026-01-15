import { cosineSimilarity } from "./vectorUtils.js";
import CityRepository from "../repositories/CityRepository.js";
import InferenceService from "../services/InferenceService.js";
import { Logger } from "../utils/Logger.js";
import { calculatePenaltyForCity } from "./penaltyCalculate.js";

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
        const penalty = await calculatePenaltyForCity(city.id, userId);
        const score = similarity - penalty;

        return {
          id: city.id,
          name: city.name,
          similarity: similarity,
          penalty: penalty,
          score: score,
        };
      })
    );

    // Tri par score décroissant
    rankedCities.sort((a, b) => b.score - a.score);

    const topN = rankedCities.slice(0, limit);

    Logger.debug(`Top ${limit} villes (avec pénalité):`);
    topN.forEach((city, index) => {
      Logger.debug(
        `  ${index + 1}. ${city.name} - Score: ${city.score.toFixed(
          4
        )} (sim: ${city.similarity.toFixed(4)} - pen: ${city.penalty.toFixed(
          4
        )})`
      );
    });

    return topN;
  } catch (error) {
    Logger.error("Erreur classement avec pénalité:", error);
    throw error;
  }
}
