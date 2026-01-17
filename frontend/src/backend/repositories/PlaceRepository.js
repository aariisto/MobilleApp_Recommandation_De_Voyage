/**
 * Repository pour la gestion des lieux (places)
 * Accès aux données de la table places
 */

import dbConnection from '../database/connection';

class PlaceRepository {
  /**
   * Récupère tous les lieux
   * @returns {Promise<Array>}
   */
  async getAllPlaces() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, lat, lon, city_id FROM places;',
        []
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching places:', error);
      throw error;
    }
  }

  /**
   * Récupère un lieu par son ID
   * @param {number} placeId
   * @returns {Promise<Object|null>}
   */
  async getPlaceById(placeId) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, lat, lon, city_id FROM places WHERE id = ?;',
        [placeId]
      );
      return result.rows._array[0] || null;
    } catch (error) {
      console.error('Error fetching place by ID:', error);
      throw error;
    }
  }

  /**
   * Récupère les lieux d'une ville
   * @param {number} cityId
   * @returns {Promise<Array>}
   */
  async getPlacesByCity(cityId) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, name, lat, lon, city_id FROM places WHERE city_id = ?;',
        [cityId]
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching places by city:', error);
      throw error;
    }
  }

  /**
   * Récupère les lieux avec leurs catégories
   * @param {number} cityId - Optionnel, filtre par ville
   * @returns {Promise<Array>}
   */
  async getPlacesWithCategories(cityId = null) {
    try {
      let sql = `
        SELECT 
          p.id,
          p.name,
          p.lat,
          p.lon,
          p.city_id,
          GROUP_CONCAT(c.name) as categories,
          GROUP_CONCAT(c.id) as category_ids
        FROM places p
        LEFT JOIN place_categories pc ON p.id = pc.place_id
        LEFT JOIN categories c ON pc.category_id = c.id
      `;
      
      const params = [];
      if (cityId) {
        sql += ' WHERE p.city_id = ?';
        params.push(cityId);
      }
      
      sql += ' GROUP BY p.id ORDER BY p.name;';
      
      const result = await dbConnection.executeSql(sql, params);
      
      return result.rows._array.map(place => ({
        ...place,
        categories: place.categories ? place.categories.split(',') : [],
        category_ids: place.category_ids ? place.category_ids.split(',').map(Number) : []
      }));
    } catch (error) {
      console.error('Error fetching places with categories:', error);
      throw error;
    }
  }

  /**
   * Récupère les lieux par catégorie
   * @param {number} categoryId
   * @returns {Promise<Array>}
   */
  async getPlacesByCategory(categoryId) {
    try {
      const result = await dbConnection.executeSql(
        `SELECT p.id, p.name, p.lat, p.lon, p.city_id
         FROM places p
         INNER JOIN place_categories pc ON p.id = pc.place_id
         WHERE pc.category_id = ?;`,
        [categoryId]
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching places by category:', error);
      throw error;
    }
  }

  /**
   * Recherche des lieux par nom
   * @param {string} searchTerm
   * @param {number} cityId - Optionnel, filtre par ville
   * @returns {Promise<Array>}
   */
  async searchPlacesByName(searchTerm, cityId = null) {
    try {
      let sql = 'SELECT id, name, lat, lon, city_id FROM places WHERE name LIKE ?';
      const params = [`%${searchTerm}%`];
      
      if (cityId) {
        sql += ' AND city_id = ?';
        params.push(cityId);
      }
      
      sql += ' ORDER BY name;';
      
      const result = await dbConnection.executeSql(sql, params);
      return result.rows._array;
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  /**
   * Insère un nouveau lieu
   * @param {Object} placeData - {name, lat, lon, city_id}
   * @returns {Promise<number>} - ID du lieu inséré
   */
  async insertPlace(placeData) {
    try {
      const { name, lat, lon, city_id } = placeData;
      
      const result = await dbConnection.executeSql(
        'INSERT INTO places (name, lat, lon, city_id) VALUES (?, ?, ?, ?);',
        [name, lat, lon, city_id]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error inserting place:', error);
      throw error;
    }
  }

  /**
   * Associe des catégories à un lieu
   * @param {number} placeId
   * @param {Array<number>} categoryIds
   * @returns {Promise<boolean>}
   */
  async addCategoriesToPlace(placeId, categoryIds) {
    try {
      const queries = categoryIds.map(categoryId => ({
        sql: 'INSERT OR IGNORE INTO place_categories (place_id, category_id) VALUES (?, ?);',
        params: [placeId, categoryId]
      }));
      
      await dbConnection.executeTransaction(queries);
      return true;
    } catch (error) {
      console.error('Error adding categories to place:', error);
      throw error;
    }
  }

  /**
   * Supprime un lieu
   * @param {number} placeId
   * @returns {Promise<boolean>}
   */
  async deletePlace(placeId) {
    try {
      await dbConnection.executeSql(
        'DELETE FROM places WHERE id = ?;',
        [placeId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting place:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de lieux
   * @returns {Promise<number>}
   */
  async countPlaces() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT COUNT(*) as count FROM places;',
        []
      );
      return result.rows._array[0].count;
    } catch (error) {
      console.error('Error counting places:', error);
      throw error;
    }
  }
}

export default new PlaceRepository();