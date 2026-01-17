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
   * Récupère les activités avec détails complets (incluant les catégories)
   * @param {number} cityId - ID de la ville
   * @returns {Promise<Object>}
   */
  async getCityActivitiesWithDetails(cityId) {
    try {
      const activities = await this.getCityActivities(cityId);
      const activitiesWithDetails = {};

      for (const [theme, places] of Object.entries(activities)) {
        if (places.length > 0) {
          const placesWithCategories = await Promise.all(
            places.map(async (place) => {
              const categories =
                await CategoryRepository.getPlaceCategoriesByPlace(place.id);
              return {
                ...place,
                categories,
              };
            }),
          );
          activitiesWithDetails[theme] = placesWithCategories;
        } else {
          activitiesWithDetails[theme] = [];
        }
      }

      return activitiesWithDetails;
    } catch (error) {
      console.error("Error fetching city activities with details:", error);
      throw error;
    }
  }

  /**
   * Récupère des recommandations basées sur les places likées
   * Pour chaque ville où il y a des places likées :
   * - Récupère 2 places au hasard de 2 thèmes différents (si possible)
   * @returns {Promise<Object>} - { cityId: [place1, place2], ... }
   */
  async getRecommendationsFromLikedPlaces() {
    try {
      // 1. Récupérer toutes les places likées
      const allLiked = await PlaceLikedRepository.getAllPlacesLiked();

      // 2. Grouper par ville
      const citiesMap = new Map();
      for (const liked of allLiked) {
        const place = await PlaceRepository.getPlaceById(liked.id_places);
        if (place && place.city_id) {
          if (!citiesMap.has(place.city_id)) {
            citiesMap.set(place.city_id, []);
          }
        }
      }

      const recommendations = {};

      // 3. Pour chaque ville, récupérer 2 places de thèmes différents
      for (const cityId of citiesMap.keys()) {
        // Récupérer les thèmes disponibles de cette ville
        const cityThemes = await ThemeFilterService.getCityThemes(cityId);

        // Mélanger les thèmes pour avoir de la variété
        const shuffledThemes = cityThemes.sort(() => Math.random() - 0.5);

        const selectedPlaces = [];
        const usedThemes = new Set();

        // Essayer de trouver 2 places de thèmes différents
        for (const themeInfo of shuffledThemes) {
          if (selectedPlaces.length >= 2) break;

          // Récupérer les places pour ce thème
          const result = await this.getActivitiesByTheme(
            cityId,
            themeInfo.theme,
          );

          if (result.isMatch && result.places.length > 0) {
            // Prendre une place au hasard
            const randomPlace =
              result.places[Math.floor(Math.random() * result.places.length)];

            // Éviter les doublons
            const isDuplicate = selectedPlaces.some(
              (p) => p.id === randomPlace.id,
            );

            if (!isDuplicate) {
              selectedPlaces.push({
                ...randomPlace,
                theme: themeInfo.theme,
              });
              usedThemes.add(themeInfo.theme);
            }
          }
        }

        // Si on n'a qu'une seule place, essayer d'en ajouter une autre du même thème
        if (selectedPlaces.length === 1 && usedThemes.size > 0) {
          const firstTheme = Array.from(usedThemes)[0];
          const result = await this.getActivitiesByTheme(cityId, firstTheme);

          for (const place of result.places) {
            if (selectedPlaces.length >= 2) break;
            if (!selectedPlaces.some((p) => p.id === place.id)) {
              selectedPlaces.push({ ...place, theme: firstTheme });
            }
          }
        }

        recommendations[cityId] = selectedPlaces;
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting recommendations from liked places:", error);
      throw error;
    }
  }
}

export default new CityActivityService();
