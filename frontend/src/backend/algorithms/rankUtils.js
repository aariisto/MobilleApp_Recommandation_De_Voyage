import { cosineSimilarity } from "./vectorUtils.js";
import CityRepository from "../repositories/CityRepository.js";
import InferenceService from "../services/InferenceService.js";
import { Logger } from "../utils/Logger.js";

/**
 * Génère un embedding pour un utilisateur en tenant compte de ses préférences (likes) et aversions (dislikes).
 *
 * La logique fonctionne ainsi :
 * - On calcule un vecteur pour ce que l'utilisateur AIME
 * - On calcule un vecteur pour ce que l'utilisateur N'AIME PAS
 * - Le vecteur final = embedding_likes - embedding_dislikes
 *
 * @param {string} likesText - Texte décrivant les préférences de l'utilisateur
 * @param {string} dislikesText - Texte décrivant les aversions de l'utilisateur
 * @returns {Promise<number[]>} - L'embedding utilisateur final (384 dimensions)
 */
export async function getUserEmbedding(likesText, dislikesText = "") {
  try {
    Logger.debug("Génération de l'embedding utilisateur...");
    Logger.debug("Likes:", likesText);
    Logger.debug("Dislikes:", dislikesText);

    // Générer l'embedding pour les préférences (likes)
    const embeddingLikes = await InferenceService.generateEmbedding(likesText);
    Logger.debug("Embedding likes généré");

    let userEmbedding;

    // Si dislikes_text est fourni, générer son embedding
    if (dislikesText && dislikesText.trim()) {
      Logger.debug("Génération de l'embedding pour les aversions (dislikes)");
      const embeddingDislikes = await InferenceService.generateEmbedding(
        dislikesText
      );
      Logger.debug("Embedding dislikes généré");

      // Calculer le vecteur final : likes - dislikes
      // Cette soustraction "repousse" les résultats qui correspondent aux dislikes
      userEmbedding = embeddingLikes.map((value, index) => {
        return value - embeddingDislikes[index];
      });
      Logger.debug(
        "Calcul du vecteur final : embedding_likes - embedding_dislikes"
      );
    } else {
      // Si pas de dislikes, on utilise juste l'embedding des likes
      Logger.debug(
        "Pas de dislikes fourni, utilisation directe de l'embedding des likes"
      );
      userEmbedding = embeddingLikes;
    }

    return userEmbedding;
  } catch (error) {
    Logger.error(
      "Erreur lors de la génération de l'embedding utilisateur:",
      error
    );
    throw error;
  }
}

/**
 * Classe les villes par similarité avec l'embedding utilisateur.
 *
 * @param {number[]} userEmbedding - Embedding utilisateur (384 dimensions), récupéré depuis la BD
 * @param {number} [limit=10] - Nombre de villes à retourner
 * @returns {Promise<Array>} - Top N des villes triées par similarité décroissante
 *                              Format: [{id, name, similarity}, ...]
 */
export async function rankCitiesBySimilarity(userEmbedding, limit = 10) {
  try {
    Logger.debug("Classement des villes par similarité...");

    // Récupération de toutes les villes avec leurs embeddings
    const cities = await CityRepository.getAllCityEmbeddings();
    Logger.debug(`${cities.length} villes récupérées`);

    Logger.debug(
      `Embedding utilisateur fourni (dimension: ${userEmbedding.length})`
    );

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
        `  ${index + 1}. ${city.name} (ID: ${
          city.id
        }) - Similarité: ${city.similarity.toFixed(4)}`
      );
    });

    return topN;
  } catch (error) {
    Logger.error("Erreur lors du classement des villes:", error);
    throw error;
  }
}
