/**
 * Service de recommandation de villes basé sur les embeddings
 * Utilise les algorithmes de similarité vectorielle
 */

import CityRepository from '../repositories/CityRepository';
import UserRepository from '../repositories/UserRepository';
import CategoryRepository from '../repositories/CategoryRepository';
import { findTopKSimilar, cosineSimilarity, diversifyResults, filterByThreshold } from '../algorithms/similarity';
import { normalizeVector, averageVectors } from '../algorithms/vectorUtils';

class RecommendationService {
  /**
   * Recommande des villes basées sur le profil utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} topK - Nombre de recommandations
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>}
   */
  async recommendCitiesForUser(userId, topK = 10, options = {}) {
    try {
      const {
        diversify = true,
        diversityLambda = 0.5,
        minSimilarityThreshold = 0.3,
        excludeCityIds = []
      } = options;

      // Récupérer le profil utilisateur
      const userProfile = await UserRepository.getProfileById(userId);
      if (!userProfile || !userProfile.preferencesArray) {
        throw new Error('User profile or preferences not found');
      }

      // Normaliser le vecteur de préférences
      const normalizedPreferences = normalizeVector(userProfile.preferencesArray);

      // Récupérer toutes les villes avec leurs embeddings
      const cities = await CityRepository.getAllCitiesWithEmbeddings();

      // Filtrer les villes exclues
      const candidates = cities
        .filter(city => !excludeCityIds.includes(city.id))
        .map(city => ({
          id: city.id,
          vector: normalizeVector(city.embeddingVector),
          metadata: {
            name: city.name,
            lat: city.lat,
            lon: city.lon,
            country_id: city.country_id
          }
        }));

      // Trouver les villes les plus similaires
      let recommendations = findTopKSimilar(
        normalizedPreferences,
        candidates,
        topK * 2, // Prendre plus de résultats pour la diversification
        'cosine'
      );

      // Filtrer par seuil de similarité
      recommendations = filterByThreshold(recommendations, minSimilarityThreshold);

      // Diversifier les résultats si demandé
      if (diversify && recommendations.length > 1) {
        recommendations = diversifyResults(recommendations, diversityLambda);
      }

      // Limiter au nombre demandé
      recommendations = recommendations.slice(0, topK);

      // Enrichir avec les détails des villes
      return recommendations.map(rec => ({
        cityId: rec.id,
        cityName: rec.name,
        lat: rec.lat,
        lon: rec.lon,
        similarityScore: rec.score,
        countryId: rec.country_id
      }));

    } catch (error) {
      console.error('Error recommending cities for user:', error);
      throw error;
    }
  }

  /**
   * Recommande des villes similaires à une ville donnée
   * @param {number} cityId - ID de la ville de référence
   * @param {number} topK - Nombre de recommandations
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>}
   */
  async recommendSimilarCities(cityId, topK = 10, options = {}) {
    try {
      const {
        diversify = false,
        diversityLambda = 0.5,
        minSimilarityThreshold = 0.5
      } = options;

      // Récupérer la ville de référence avec son embedding
      const referenceCity = await CityRepository.getCityWithEmbedding(cityId);
      if (!referenceCity || !referenceCity.embeddingVector) {
        throw new Error('Reference city or embedding not found');
      }

      // Normaliser le vecteur de référence
      const normalizedReference = normalizeVector(referenceCity.embeddingVector);

      // Récupérer toutes les autres villes
      const cities = await CityRepository.getAllCitiesWithEmbeddings();

      // Préparer les candidats (exclure la ville de référence)
      const candidates = cities
        .filter(city => city.id !== cityId)
        .map(city => ({
          id: city.id,
          vector: normalizeVector(city.embeddingVector),
          metadata: {
            name: city.name,
            lat: city.lat,
            lon: city.lon,
            country_id: city.country_id
          }
        }));

      // Trouver les villes similaires
      let recommendations = findTopKSimilar(
        normalizedReference,
        candidates,
        topK * 2,
        'cosine'
      );

      // Filtrer par seuil
      recommendations = filterByThreshold(recommendations, minSimilarityThreshold);

      // Diversifier si demandé
      if (diversify && recommendations.length > 1) {
        recommendations = diversifyResults(recommendations, diversityLambda);
      }

      // Limiter au nombre demandé
      recommendations = recommendations.slice(0, topK);

      return recommendations.map(rec => ({
        cityId: rec.id,
        cityName: rec.name,
        lat: rec.lat,
        lon: rec.lon,
        similarityScore: rec.score,
        countryId: rec.country_id
      }));

    } catch (error) {
      console.error('Error recommending similar cities:', error);
      throw error;
    }
  }

  /**
   * Crée un vecteur de préférences basé sur les catégories sélectionnées
   * @param {Array<number>} categoryIds - IDs des catégories préférées
   * @returns {Promise<Float64Array>}
   */
  async createPreferencesFromCategories(categoryIds) {
    try {
      // Cette méthode nécessite d'avoir des embeddings pour les catégories
      // Pour l'instant, on crée un vecteur basique
      // TODO: Implémenter un système d'embeddings de catégories
      
      const allCategories = await CategoryRepository.getAllCategories();
      const vectorSize = 384; // Taille standard pour les embeddings (ajuster selon votre modèle)
      
      const preferencesVector = new Float64Array(vectorSize);
      
      // Approche simple : marquer les indices correspondant aux catégories
      categoryIds.forEach((categoryId, index) => {
        if (index < vectorSize) {
          preferencesVector[index] = 1.0;
        }
      });
      
      return normalizeVector(preferencesVector);
      
    } catch (error) {
      console.error('Error creating preferences from categories:', error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences utilisateur basées sur l'historique
   * @param {number} userId
   * @param {Array<number>} likedCityIds - Villes aimées
   * @param {Array<number>} dislikedCityIds - Villes non aimées
   * @returns {Promise<boolean>}
   */
  async updateUserPreferencesFromHistory(userId, likedCityIds = [], dislikedCityIds = []) {
    try {
      // Récupérer les embeddings des villes aimées
      const likedCities = await Promise.all(
        likedCityIds.map(id => CityRepository.getCityWithEmbedding(id))
      );

      const likedVectors = likedCities
        .filter(city => city && city.embeddingVector)
        .map(city => normalizeVector(city.embeddingVector));

      if (likedVectors.length === 0) {
        throw new Error('No valid embeddings found for liked cities');
      }

      // Calculer la moyenne des vecteurs aimés
      let preferencesVector = averageVectors(likedVectors);

      // Si des villes sont non aimées, ajuster le vecteur
      if (dislikedCityIds.length > 0) {
        const dislikedCities = await Promise.all(
          dislikedCityIds.map(id => CityRepository.getCityWithEmbedding(id))
        );

        const dislikedVectors = dislikedCities
          .filter(city => city && city.embeddingVector)
          .map(city => normalizeVector(city.embeddingVector));

        if (dislikedVectors.length > 0) {
          const avgDisliked = averageVectors(dislikedVectors);
          
          // Soustraire l'influence des villes non aimées (avec un poids plus faible)
          preferencesVector = normalizeVector(
            preferencesVector.map((val, i) => val - 0.3 * avgDisliked[i])
          );
        }
      }

      // Normaliser le vecteur final
      preferencesVector = normalizeVector(preferencesVector);

      // Mettre à jour le profil utilisateur
      await UserRepository.updatePreferences(userId, Array.from(preferencesVector));

      return true;

    } catch (error) {
      console.error('Error updating user preferences from history:', error);
      throw error;
    }
  }

  /**
   * Calcule la similarité entre deux villes
   * @param {number} cityId1
   * @param {number} cityId2
   * @returns {Promise<number>}
   */
  async calculateCitySimilarity(cityId1, cityId2) {
    try {
      const city1 = await CityRepository.getCityWithEmbedding(cityId1);
      const city2 = await CityRepository.getCityWithEmbedding(cityId2);

      if (!city1?.embeddingVector || !city2?.embeddingVector) {
        throw new Error('City embeddings not found');
      }

      const v1 = normalizeVector(city1.embeddingVector);
      const v2 = normalizeVector(city2.embeddingVector);

      return cosineSimilarity(v1, v2);

    } catch (error) {
      console.error('Error calculating city similarity:', error);
      throw error;
    }
  }
}

export default new RecommendationService();
