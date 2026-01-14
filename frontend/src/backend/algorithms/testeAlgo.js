/**
 * Port JavaScript de teste_algo.py
 * Contient uniquement la fonction rank_cities_by_similarity
 */

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
 * Cela permet de "repousser" les résultats qui contiendraient les dislikes.
 * 
 * Exemple :
 *     - likesText = "plage restaurant"
 *     - dislikesText = "montagne froid"
 *     - final = embedding(plage restaurant) - embedding(montagne froid)
 *     → Le système recommandera des destinations avec plage/restaurant
 *       ET évitera montagne/froid
 * 
 * @param {string} likesText - Le texte représentant ce que l'utilisateur AIME (obligatoire)
 *                            (ex: "plage restaurant shopping")
 * @param {string} dislikesText - Le texte représentant ce que l'utilisateur N'AIME PAS (optionnel)
 *                               (ex: "montagne froid humidité")
 * @returns {Promise<number[]>} Une liste de floats représentant le vecteur d'embedding final (likes - dislikes)
 */
export async function getUserEmbedding(likesText, dislikesText = "") {
  try {
    Logger.info("Génération de l'embedding utilisateur...");
    
    // Génération de l'embedding pour les préférences (likes)
    Logger.info(`Génération de l'embedding pour les préférences (likes): '${likesText}'`);
    const embeddingLikes = await InferenceService.generateEmbedding(likesText);
    
    // Si dislikesText est fourni, générer son embedding
    if (dislikesText && dislikesText.trim()) {
      Logger.info(`Génération de l'embedding pour les aversions (dislikes): '${dislikesText}'`);
      const embeddingDislikes = await InferenceService.generateEmbedding(dislikesText);
      
      // Calcul du vecteur final : likes - dislikes
      // Cette soustraction "repousse" les résultats qui correspondent aux dislikes
      Logger.info("Calcul du vecteur final : embedding_likes - embedding_dislikes");
      const embeddingFinal = embeddingLikes.map((val, idx) => val - embeddingDislikes[idx]);
      
      return embeddingFinal;
    } else {
      // Si pas de dislikes, on utilise juste le embedding des likes
      Logger.info("Pas de dislikes fourni, utilisation directe de l'embedding des likes");
      return embeddingLikes;
    }
  } catch (error) {
    Logger.error("Erreur lors de la génération de l'embedding utilisateur:", error);
    throw error;
  }
}

/**
 * Calcule la similarité cosinus entre deux vecteurs.
 * 
 * @param {number[]} vec1 - Premier vecteur (liste de floats)
 * @param {number[]} vec2 - Deuxième vecteur (liste de floats)
 * @returns {number} Un float entre -1 et 1 représentant la similarité cosinus
 *                  - 1.0 : vecteurs identiques
 *                  - 0.0 : vecteurs orthogonaux
 *                  - -1.0 : vecteurs opposés
 */
export function cosineSimilarity(vec1, vec2) {
  try {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      Logger.warn("Vecteurs invalides ou de tailles différentes");
      return 0.0;
    }

    // Calcul du produit scalaire
    let dotProduct = 0;
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
    }

    // Calcul des normes
    let normV1 = 0;
    let normV2 = 0;
    for (let i = 0; i < vec1.length; i++) {
      normV1 += vec1[i] * vec1[i];
      normV2 += vec2[i] * vec2[i];
    }
    normV1 = Math.sqrt(normV1);
    normV2 = Math.sqrt(normV2);

    // Vérification pour éviter la division par zéro
    if (normV1 === 0 || normV2 === 0) {
      Logger.warn("Un des vecteurs a une norme nulle");
      return 0.0;
    }

    // Calcul de la similarité cosinus
    const similarity = dotProduct / (normV1 * normV2);

    return similarity;
  } catch (error) {
    Logger.error("Erreur lors du calcul de la similarité cosinus:", error);
    throw error;
  }
}

/**
 * Classe les villes par similarité avec le texte utilisateur (likes et dislikes).
 * 
 * @param {string} userText - Texte utilisateur (ex: "plage restaurant shopping")
 * @param {Array<{id: number, name: string, embedding: number[]}>} cities - Liste des villes avec leurs embeddings
 * @param {string} dislikesText - Texte des préférences à ÉVITER (optionnel)
 * @returns {Promise<Array<{id: number, name: string, similarity: number}>>} Liste des villes triées par similarité décroissante
 */
export async function rankCitiesBySimilarity(userText, cities, dislikesText = "") {
  try {
    Logger.info(`Calcul de la similarité pour: '${userText}'`);
    
    // Génération de l'embedding utilisateur (avec likes et optionnellement dislikes)
    const userEmbedding = await getUserEmbedding(userText, dislikesText);
    Logger.info(`✓ Embedding utilisateur généré (dimension: ${userEmbedding.length})`);
    
    // Calcul de la similarité pour chaque ville
    const rankedCities = [];
    for (const city of cities) {
      const cityId = city.id;
      const cityName = city.name;
      const cityEmbedding = city.embedding;
      
      // Calcul de la similarité
      const similarity = cosineSimilarity(userEmbedding, cityEmbedding);
      
      rankedCities.push({
        id: cityId,
        name: cityName,
        similarity: similarity
      });
    }
    
    // Tri par similarité décroissante
    rankedCities.sort((a, b) => b.similarity - a.similarity);
    
    Logger.info(`✓ ${rankedCities.length} villes classées par similarité`);
    
    return rankedCities;
  } catch (error) {
    Logger.error("Erreur lors du classement des villes:", error);
    throw error;
  }
}
