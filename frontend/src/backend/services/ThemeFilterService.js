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

    // Exécution séquentielle pour éviter de surcharger SQLite (qui plante avec trop de requêtes parallèles via Promise.all)
    const results = [];
    for (const cityId of cityIds) {
      try {
        const result = await filterMethod(cityId);
        results.push(result);
      } catch (e) {
        console.warn(`Erreur filtre ${theme} pour city ${cityId}:`, e);
      }
    }

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

  /**
   * Détecte les thèmes à partir d'un tableau de catégories
   * @param {Array<string>} categories - Tableau des noms de catégories
   * @returns {Object} - Objet contenant true/false pour chaque thème
   */
  getThemesFromCategories(categories) {
    const categoryNames = categories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "_"),
    );

    const patterns = {
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

    const result = {};

    // Pour chaque thème, vérifier si au moins une catégorie correspond
    for (const [theme, themePatterns] of Object.entries(patterns)) {
      result[theme] = categoryNames.some((cat) =>
        themePatterns.some((pattern) => pattern.test(cat)),
      );
    }

    return result;
  }

  async calculateThemeStatistics(cityIds) {
    const themeCounts = {
      Nature: 0,
      Histoire: 0,
      Gastronomie: 0,
      Shopping: 0,
      Divertissement: 0,
    };

    // Pour chaque ville, on récupère ses thèmes
    for (const cityId of cityIds) {
      try {
        const themes = await this.getCityThemes(cityId);
        themes.forEach((t) => {
          if (themeCounts[t.theme] !== undefined) {
            themeCounts[t.theme]++;
          }
        });
      } catch (error) {
        console.warn(`Erreur calcul stats pour city ${cityId}:`, error);
      }
    }

    // Couleurs définies pour le chart
    const themeColors = {
      Nature: "#4CAF50", // Vert
      Histoire: "#FF9800", // Orange
      Gastronomie: "#F44336", // Rouge
      Shopping: "#9C27B0", // Violet
      Divertissement: "#2196F3", // Bleu
    };

    return Object.keys(themeCounts)
      .map((theme) => ({
        name: theme,
        population: themeCounts[theme], // React Native Chart Kit utilise 'population' pour la valeur
        color: themeColors[theme],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      }))
      .filter((item) => item.population > 0); // On ne retourne que les thèmes présents
  }
}

export default new ThemeFilterService();
