/**
 * Repository pour la gestion des villes aimées
 * Accès aux données de la table place_liked
 */

import dbConnection from "../database/connection";

class PlaceLikedRepository {
  /**
   * Récupère tous les IDs des villes aimées
   * @returns {Promise<Array<number>>}
   */
  async getAllPlacesLiked() {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id_ville FROM place_liked;",
        [],
      );
      return result.rows._array.map((row) => row.id_ville);
    } catch (error) {
      console.error("Error fetching liked cities:", error);
      throw error;
    }
  }

  /**
   * Récupère une ville aimée par son ID
   * @param {number} likedId
   * @returns {Promise<Object|null>}
   */
  async getPlaceLikedById(likedId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, id_ville, created_at FROM place_liked WHERE id = ?;",
        [likedId],
      );
      return result.rows._array[0] || null;
    } catch (error) {
      console.error("Error fetching liked city by ID:", error);
      throw error;
    }
  }

  /**
   * Récupère toutes les entrées pour une ville donnée
   * @param {number} cityId
   * @returns {Promise<Array>}
   */
  async getLikedByCityId(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, id_ville, created_at FROM place_liked WHERE id_ville = ?;",
        [cityId],
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error fetching liked cities by city ID:", error);
      throw error;
    }
  }

  /**
   * Ajoute une ville aimée
   * @param {number} cityId
   * @returns {Promise<Object>}
   */
  async addPlaceLiked(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "INSERT INTO place_liked (id_ville) VALUES (?);",
        [cityId],
      );
      return {
        id: result.insertId,
        id_ville: cityId,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error adding liked city:", error);
      throw error;
    }
  }

  /**
   * Supprime une place aimée
   * @param {number} likedId
   * @returns {Promise<boolean>}
   */
  async removePlaceLiked(likedId) {
    try {
      const result = await dbConnection.executeSql(
        "DELETE FROM place_liked WHERE id = ?;",
        [likedId],
      );
      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error removing liked place:", error);
      throw error;
    }
  }

  /**
   * Supprime une ville aimée par son ID de ville
   * @param {number} cityId
   * @returns {Promise<boolean>}
   */
  async removePlaceLikedByCityId(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "DELETE FROM place_liked WHERE id_ville = ?;",
        [cityId],
      );
      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error removing liked city by city ID:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre de likes pour une ville
   * @param {number} cityId
   * @returns {Promise<number>}
   */
  async countLikesForCity(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT COUNT(*) as count FROM place_liked WHERE id_ville = ?;",
        [cityId],
      );
      return result.rows._array[0]?.count || 0;
    } catch (error) {
      console.error("Error counting likes for city:", error);
      throw error;
    }
  }
}

export default new PlaceLikedRepository();
