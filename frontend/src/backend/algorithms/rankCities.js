/**
 * rankCities.js - Port JavaScript de teste_algo.py
 * Classifie les villes par similarité avec les préférences utilisateur
 */

import InferenceService from '../services/InferenceService';
import { Logger } from '../utils/Logger';

/**
 * Calcule la similarité cosinus entre deux vecteurs
 * @param {number[]} vec1 - Premier vecteur
 * @param {number[]} vec2 - Deuxième vecteur
 * @returns {number} - Similarité cosinus (-1 à 1)
 */
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    Logger.error('Vecteurs invalides pour cosine similarity');
    return 0;
  }

  // Produit scalaire
  let dotProduct = 0;
  let normV1 = 0;
  let normV2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    normV1 += vec1[i] * vec1[i];
    normV2 += vec2[i] * vec2[i];
  }

  normV1 = Math.sqrt(normV1);
  normV2 = Math.sqrt(normV2);

  // Éviter division par zéro
  if (normV1 === 0 || normV2 === 0) {
    Logger.warn('Un des vecteurs a une norme nulle');
    return 0;
  }

  return dotProduct / (normV1 * normV2);
}

/**
 * Génère un embedding utilisateur en tenant compte des likes et dislikes
 * 
 * Logique:
 * - embedding_likes pour ce que l'utilisateur AIME
 * - embedding_dislikes pour ce que l'utilisateur N'AIME PAS
 * - Vecteur final = embedding_likes - embedding_dislikes
 * 
 * Cela "repousse" les résultats qui contiennent les dislikes
 * 
 * @param {string} likesText - Texte des préférences (obligatoire)
 * @param {string} dislikesText - Texte des aversions (optionnel)
 * @returns {Promise<number[]>} - Embedding utilisateur
 */
export async function getUserEmbedding(likesText, dislikesText = '') {
  try {
    Logger.info(`Génération de l'embedding pour likes: "${likesText}"`);
    
    // Génération de l'embedding pour les préférences (likes)
    const embeddingLikes = await InferenceService.generateEmbedding(likesText);
    Logger.debug(`✓ Embedding likes généré (dimension: ${embeddingLikes.length})`);

    // Si dislikes fourni, générer son embedding
    if (dislikesText && dislikesText.trim()) {
      Logger.info(`Génération de l'embedding pour dislikes: "${dislikesText}"`);
      const embeddingDislikes = await InferenceService.generateEmbedding(dislikesText);
      Logger.debug(`✓ Embedding dislikes généré (dimension: ${embeddingDislikes.length})`);

      // Calcul du vecteur final : likes - dislikes
      // Cette soustraction "repousse" les résultats qui correspondent aux dislikes
      const embeddingFinal = embeddingLikes.map((val, idx) => val - embeddingDislikes[idx]);
      Logger.info('Calcul du vecteur final : embedding_likes - embedding_dislikes');
      
      return embeddingFinal;
    }

    // Si pas de dislikes, utiliser juste l'embedding des likes
    Logger.info('Pas de dislikes fourni, utilisation directe de l\'embedding des likes');
    return embeddingLikes;

  } catch (error) {
    Logger.error('Erreur lors de la génération de l\'embedding utilisateur:', error);
    throw error;
  }
}

/**
 * Classe les villes par similarité avec les préférences utilisateur
 * 
 * @param {string} userText - Texte des préférences utilisateur (ex: "plage restaurant shopping")
 * @param {Array<{id: number, name: string, embedding: number[]}>} cities - Liste des villes avec embeddings
 * @param {string} dislikesText - Texte des aversions (optionnel)
 * @returns {Promise<Array<{id: number, name: string, similarity: number}>>} - Villes triées par similarité décroissante
 */
export async function rankCitiesBySimilarity(userText, cities, dislikesText = '') {
  try {
    Logger.info(`Calcul de la similarité pour: "${userText}"`);
    
    // Génération de l'embedding utilisateur (avec likes et optionnellement dislikes)
    const userEmbedding = await getUserEmbedding(userText, dislikesText);
    Logger.debug(`✓ Embedding utilisateur généré (dimension: ${userEmbedding.length})`);

    // Calcul de la similarité pour chaque ville
    const rankedCities = [];
    
    for (const city of cities) {
      const cityId = city.id;
      const cityName = city.name;
      const cityEmbedding = city.embedding;

      // Vérification
      if (!cityEmbedding || !Array.isArray(cityEmbedding)) {
        Logger.warn(`Ville ${cityName} (ID: ${cityId}) sans embedding valide, ignorée`);
        continue;
      }

      // Calcul de la similarité
      const similarity = cosineSimilarity(userEmbedding, cityEmbedding);

      rankedCities.push({
        id: cityId,
        name: cityName,
        similarity: similarity,
      });
    }

    // Tri par similarité décroissante
    rankedCities.sort((a, b) => b.similarity - a.similarity);

    Logger.success(`✓ ${rankedCities.length} villes classées par similarité`);

    return rankedCities;

  } catch (error) {
    Logger.error('Erreur lors du classement des villes:', error);
    throw error;
  }
}
