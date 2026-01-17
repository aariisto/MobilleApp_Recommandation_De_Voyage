/**
 * Service de filtrage des villes par thème
 * Utilise les catégories des villes pour déterminer les thèmes
 */

import CategoryRepository from "../repositories/CategoryRepository";

class ThemeFilterService {
  /**
   * Détecte si une ville est du thème Nature
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{cityId, theme, matched_categories}>}
   */
  async filterNature(cityId) {
    const categories = await CategoryRepository.getCityCategoriesByCity(cityId);
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const naturePatterns = [/^natural/, /^beach/, /^island/, /^national_park/];

    const matched = categoryNames.filter((cat) =>
      naturePatterns.some((pattern) => pattern.test(cat)),
    );

    if (matched.length > 0) {
      return {
        cityId,
        theme: "Nature",
        matched_categories: matched,
        isMatch: true,
      };
    }

    return {
      cityId,
      theme: "Nature",
      matched_categories: [],
      isMatch: false,
    };
  }

  /**
   * Détecte si une ville est du thème Histoire
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{cityId, theme, matched_categories}>}
   */
  async filterHistory(cityId) {
    const categories = await CategoryRepository.getCityCategoriesByCity(cityId);
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const historyPatterns = [
      /^heritage/,
      /^tourism\.sights/,
      /^religion/,
      /^memorial/,
      /^building\.historic/,
    ];

    const matched = categoryNames.filter((cat) =>
      historyPatterns.some((pattern) => pattern.test(cat)),
    );

    if (matched.length > 0) {
      return {
        cityId,
        theme: "Histoire",
        matched_categories: matched,
        isMatch: true,
      };
    }

    return {
      cityId,
      theme: "Histoire",
      matched_categories: [],
      isMatch: false,
    };
  }

  /**
   * Détecte si une ville est du thème Gastronomie
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{cityId, theme, matched_categories}>}
   */
  async filterGastronomy(cityId) {
    const categories = await CategoryRepository.getCityCategoriesByCity(cityId);
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const gastronomyPatterns = [
      /^catering\.restaurant/,
      /^production\.winery/,
      /^production\.brewery/,
    ];

    const matched = categoryNames.filter((cat) =>
      gastronomyPatterns.some((pattern) => pattern.test(cat)),
    );

    if (matched.length > 0) {
      return {
        cityId,
        theme: "Gastronomie",
        matched_categories: matched,
        isMatch: true,
      };
    }

    return {
      cityId,
      theme: "Gastronomie",
      matched_categories: [],
      isMatch: false,
    };
  }

  /**
   * Détecte si une ville est du thème Shopping
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{cityId, theme, matched_categories}>}
   */
  async filterShopping(cityId) {
    const categories = await CategoryRepository.getCityCategoriesByCity(cityId);
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const shoppingPatterns = [
      /^commercial\.shopping_mall/,
      /^commercial\.marketplace/,
      /^commercial\.gift_and_souvenir/,
    ];

    const matched = categoryNames.filter((cat) =>
      shoppingPatterns.some((pattern) => pattern.test(cat)),
    );

    if (matched.length > 0) {
      return {
        cityId,
        theme: "Shopping",
        matched_categories: matched,
        isMatch: true,
      };
    }

    return {
      cityId,
      theme: "Shopping",
      matched_categories: [],
      isMatch: false,
    };
  }

  /**
   * Détecte si une ville est du thème Divertissement
   * @param {number} cityId - ID de la ville
   * @returns {Promise<{cityId, theme, matched_categories}>}
   */
  async filterEntertainment(cityId) {
    const categories = await CategoryRepository.getCityCategoriesByCity(cityId);
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const entertainmentPatterns = [
      /^ski/,
      /^adult\.nightclub/,
      /^adult\.casino/,
      /^entertainment\.theme_park/,
      /^sport\.stadium/,
    ];

    const matched = categoryNames.filter((cat) =>
      entertainmentPatterns.some((pattern) => pattern.test(cat)),
    );

    if (matched.length > 0) {
      return {
        cityId,
        theme: "Divertissement",
        matched_categories: matched,
        isMatch: true,
      };
    }

    return {
      cityId,
      theme: "Divertissement",
      matched_categories: [],
      isMatch: false,
    };
  }

  /**
   * Filtre une liste de villes par thème
   * @param {Array<number>} cityIds - Liste des IDs de villes
   * @param {string} theme - Thème à filtrer (Nature, Histoire, Gastronomie, Shopping, Divertissement)
   * @returns {Promise<Array>} - Villes matchant le thème
   */
  async filterCitiesByTheme(cityIds, theme) {
    const filterMethod = {
      Nature: this.filterNature.bind(this),
      Histoire: this.filterHistory.bind(this),
      Gastronomie: this.filterGastronomy.bind(this),
      Shopping: this.filterShopping.bind(this),
      Divertissement: this.filterEntertainment.bind(this),
    }[theme];

    if (!filterMethod) {
      throw new Error(
        `Thème invalide: ${theme}. Thèmes acceptés: Nature, Histoire, Gastronomie, Shopping, Divertissement`,
      );
    }

    const results = await Promise.all(
      cityIds.map((cityId) => filterMethod(cityId)),
    );

    return results.filter((result) => result.isMatch);
  }

  /**
   * Récupère tous les thèmes d'une ville
   * @param {number} cityId - ID de la ville
   * @returns {Promise<Array<{theme: string, matched_categories: Array}>>}
   */
  async getCityThemes(cityId) {
    const themes = [
      { name: "Nature", method: this.filterNature.bind(this) },
      { name: "Histoire", method: this.filterHistory.bind(this) },
      { name: "Gastronomie", method: this.filterGastronomy.bind(this) },
      { name: "Shopping", method: this.filterShopping.bind(this) },
      { name: "Divertissement", method: this.filterEntertainment.bind(this) },
    ];

    const results = await Promise.all(
      themes.map(async ({ name, method }) => {
        const result = await method(cityId);
        return result;
      }),
    );

    // Retourner seulement les thèmes qui matchent
    return results
      .filter((result) => result.isMatch)
      .map((result) => ({
        theme: result.theme,
        matched_categories: result.matched_categories,
      }));
  }
}

export default new ThemeFilterService();
