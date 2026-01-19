/**
 * Service pour récupérer les activités des villes par thème
 * Utilise les catégories pour suggérer des places aléatoires
 */

import ThemeFilterService from "./ThemeFilterService";
import PlaceRepository from "../repositories/PlaceRepository";
import CategoryRepository from "../repositories/CategoryRepository";
import PlaceLikedRepository from "../repositories/PlaceLikedRepository";

class CityActivityService {
  // Patterns de catégories par thème (depuis ThemeFilterService)
  themePatterns = {
    Nature: [/^natural/, /^beach/, /^island/, /^national_park/],
    Histoire: [
      /^heritage/,
      /^tourism\.sights/,
      /^religion/,
      /^memorial/,
      /^building\.historic/,
    ],
    Gastronomie: [
      /^catering\.restaurant/,
      /^production\.winery/,
      /^production\.brewery/,
    ],
    Shopping: [
      /^commercial\.shopping_mall/,
      /^commercial\.marketplace/,
      /^commercial\.gift_and_souvenir/,
    ],
    Divertissement: [
      /^ski/,
      /^adult\.nightclub/,
      /^adult\.casino/,
      /^entertainment\.theme_park/,
      /^sport\.stadium/,
    ],
  };

  /**
   * Récupère les activités d'une ville par catégorie
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{Nature: Array, Histoire: Array, Gastronomie: Array, Shopping: Array, Divertissement: Array}>}
   */
  async getCityActivities(cityId) {
    try {
      const activities = {
        Nature: [],
        Histoire: [],
        Gastronomie: [],
        Shopping: [],
        Divertissement: [],
      };

      // Récupérer les thèmes de la ville via ThemeFilterService
      const cityThemes = await ThemeFilterService.getCityThemes(cityId);

      // Pour chaque thème trouvé, récupérer les places
      for (const themeInfo of cityThemes) {
        const result = await this.getActivitiesByTheme(cityId, themeInfo.theme);
        if (result.isMatch) {
          activities[themeInfo.theme] = result.places;
        }
      }

      return activities;
    } catch (error) {
      console.error("Error fetching city activities:", error);
      throw error;
    }
  }

  /**
   * Récupère 5 places aléatoires pour un thème donné d'une ville
   * @param {number} cityId - ID de la ville
   * @param {string} theme - Thème (Nature, Histoire, Gastronomie, Shopping, Divertissement)
   * @returns {Promise<{isMatch: boolean, places: Array}>}
   */
  async getActivitiesByTheme(cityId, theme) {
    try {
      // Récupérer toutes les places de la ville
      const allPlaces = await PlaceRepository.getPlacesByCity(cityId);

      // Récupérer les patterns du thème
      const patterns = this.themePatterns[theme];

      // Filtrer les places qui correspondent au thème
      const matchedPlaces = [];
      for (const place of allPlaces) {
        const placeCategories =
          await CategoryRepository.getPlaceCategoriesByPlace(place.id);
        const placeCategoryNames = placeCategories.map((cat) =>
          cat.toLowerCase().replace(/\s+/g, "_"),
        );

        const hasMatchingCategory = placeCategoryNames.some((cat) =>
          patterns.some((pattern) => pattern.test(cat)),
        );

        if (hasMatchingCategory) {
          matchedPlaces.push(place);
        }
      }

      // Sélectionner 5 places aléatoires
      const randomPlaces = this.getRandomPlaces(matchedPlaces, 5);

      return {
        isMatch: true,
        places: randomPlaces,
      };
    } catch (error) {
      console.error(`Error fetching activities for theme ${theme}:`, error);
      throw error;
    }
  }

  /**
   * Sélectionne n places aléatoires depuis un tableau
   * @param {Array} places - Tableau de places
   * @param {number} count - Nombre de places à sélectionner
   * @returns {Array}
   */
  getRandomPlaces(places, count) {
    if (places.length <= count) {
      return places;
    }

    const shuffled = [...places].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Récupère des recommandations basées sur les places likées
   * Pour chaque ville où il y a des places likées :
   * - Récupère 2 places au hasard de 2 thèmes différents (si possible)
   * @returns {Promise<Object>} - { cityId: [place1, place2], ... }
   */
  async getRecommendationsFromLikedPlaces() {
    try {
      // 1. Récupérer directement les city_id des places likées (JOIN SQL)
      const cityIds = await PlaceLikedRepository.getAllPlacesLiked();

      console.log(
        `🏙️ DEBUG: Villes identifiées via les likes : ${cityIds.join(", ")}`,
      );

      if (cityIds.length === 0) {
        console.log("⚠️ Aucune ville likée trouvée dans la DB.");
        return {};
      }

      const recommendations = {};

      // 2. Pour chaque ville, récupérer les activités et sélectionner 2 places
      for (const cityId of cityIds) {
        console.log(`🔄 Processing City ID: ${cityId}`);
        // Utiliser getCityActivities pour obtenir les places par thème
        const activities = await this.getCityActivities(cityId);

        console.log(
          `📊 Activities for city ${cityId}:`,
          Object.keys(activities)
            .map((theme) => `${theme}: ${activities[theme].length} places`)
            .join(", "),
        );

        // Préparer un tableau de [thème, places]
        const themesWithPlaces = Object.entries(activities).filter(
          ([theme, places]) => places.length > 0,
        );

        console.log(
          `✅ Themes with places for city ${cityId}: ${themesWithPlaces.map(([t]) => t).join(", ")}`,
        );

        // Mélanger les thèmes pour la variété
        const shuffledThemes = themesWithPlaces.sort(() => Math.random() - 0.5);

        const selectedPlaces = [];

        // Essayer de sélectionner 2 places de thèmes différents
        for (const [theme, places] of shuffledThemes) {
          if (selectedPlaces.length >= 2) break;

          // Prendre une place aléatoire de ce thème
          const randomPlace = places[Math.floor(Math.random() * places.length)];

          selectedPlaces.push({
            ...randomPlace,
            theme: theme,
          });
        }

        console.log(
          `🎯 Selected ${selectedPlaces.length} places for city ${cityId}`,
        );
        recommendations[cityId] = selectedPlaces;
      }

      console.log(
        `📋 Final recommendations cities: ${Object.keys(recommendations).join(", ")}`,
      );
      return recommendations;
    } catch (error) {
      console.error("Error getting recommendations from liked places:", error);
      throw error;
    }
  }
}

export default new CityActivityService();
