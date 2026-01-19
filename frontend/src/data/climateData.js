/**
 * Module de gestion du climat selon les saisons
 * Utilise les données générées automatiquement pour les 200 villes
 */

// Import du fichier JSON généré
const citySeasonalClimate = require('./city_seasonal_climate.json');

/**
 * Détermine la saison selon le mois (1-12) pour l'hémisphère nord
 */
const getSeason = (month) => {
  if (month >= 12 || month <= 2) return 'hiver';
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  return 'automne';
};

/**
 * Récupère le climat d'une ville selon la date de voyage
 * @param {string} cityName - Nom de la ville
 * @param {Date} travelDate - Date du voyage (optionnel, par défaut aujourd'hui)
 * @returns {string} - 'froid', 'tempéré' ou 'chaud'
 */
export const getClimate = (cityName, travelDate = new Date()) => {
  const month = travelDate.getMonth() + 1; // getMonth() retourne 0-11
  const season = getSeason(month);
  
  // Récupérer le climat saisonnier depuis le fichier JSON
  if (citySeasonalClimate[cityName]) {
    return citySeasonalClimate[cityName][season] || 'tempéré';
  }
  
  // Fallback
  return 'tempéré';
};

/**
 * Récupère l'icône correspondant au climat
 * @param {string} climate - 'froid', 'tempéré' ou 'chaud'
 * @returns {string} - Nom de l'icône Ionicons
 */
export const getClimateIcon = (climate) => {
  switch(climate) {
    case 'froid':
      return 'snow-outline';
    case 'chaud':
      return 'sunny-outline';
    case 'tempéré':
      return 'partly-sunny-outline';
    default:
      return 'thermometer-outline';
  }
};

/**
 * Récupère la couleur correspondant au climat
 * @param {string} climate - 'froid', 'tempéré' ou 'chaud'
 * @returns {string} - Code couleur hexadécimal
 */
export const getClimateColor = (climate) => {
  switch(climate) {
    case 'froid':
      return '#4A90E2'; // Bleu
    case 'chaud':
      return '#FF6B6B'; // Rouge
    case 'tempéré':
      return '#FFA726'; // Orange
    default:
      return '#95a5a6';
  }
};

/**
 * Récupère le label correspondant au climat
 * @param {string} climate - 'froid', 'tempéré' ou 'chaud'
 * @returns {string} - Label en français
 */
export const getClimateLabel = (climate) => {
  switch(climate) {
    case 'froid':
      return 'Froid';
    case 'chaud':
      return 'Chaud';
    case 'tempéré':
      return 'Tempéré';
    default:
      return 'Tempéré';
  }
};

/**
 * Récupère la saison actuelle
 * @param {Date} travelDate - Date du voyage (optionnel, par défaut aujourd'hui)
 * @returns {string} - 'hiver', 'printemps', 'été' ou 'automne'
 */
export const getCurrentSeason = (travelDate = new Date()) => {
  const month = travelDate.getMonth() + 1;
  return getSeason(month);
};

/**
 * Récupère toutes les informations climatiques d'une ville pour une date donnée
 * @param {string} cityName - Nom de la ville
 * @param {Date} travelDate - Date du voyage (optionnel, par défaut aujourd'hui)
 * @returns {Object} - Objet contenant toutes les infos climatiques
 */
export const getClimateInfo = (cityName, travelDate = new Date()) => {
  const climate = getClimate(cityName, travelDate);
  return {
    climate,
    icon: getClimateIcon(climate),
    color: getClimateColor(climate),
    label: getClimateLabel(climate),
    season: getCurrentSeason(travelDate)
  };
};
