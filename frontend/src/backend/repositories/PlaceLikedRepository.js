/**
 * Repository pour la gestion des places aimées
 * Accès aux données de la table place_liked
 */

import dbConnection from "../database/connection";

class PlaceLikedRepository {
  /**
   * Récupère toutes les places aimées
   * @returns {Promise<Array>}
   */
  async getAllPlacesLiked() {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, id_places, created_at FROM place_liked;",
        [],
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error fetching liked places:", error);
      throw error;
    }
  }

  /**
   * Récupère une place aimée par son ID
   * @param {number} likedId
   * @returns {Promise<Object|null>}
   */
  async getPlaceLikedById(likedId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, id_places, created_at FROM place_liked WHERE id = ?;",
        [likedId],
      );
      return result.rows._array[0] || null;
    } catch (error) {
      console.error("Error fetching liked place by ID:", error);
      throw error;
    }
  }

  /**
   * Récupère toutes les places aimées pour une place donnée
   * @param {number} placeId
   * @returns {Promise<Array>}
   */
  async getLikedByPlaceId(placeId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, id_places, created_at FROM place_liked WHERE id_places = ?;",
        [placeId],
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error fetching liked places by place ID:", error);
      throw error;
    }
  }

  /**
   * Ajoute une place aimée
   * @param {number} placeId
   * @returns {Promise<Object>}
   */
  async addPlaceLiked(placeId) {
    try {
      const result = await dbConnection.executeSql(
        "INSERT INTO place_liked (id_places) VALUES (?);",
        [placeId],
      );
      return {
        id: result.insertId,
        id_places: placeId,
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error adding liked place:", error);
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
   * Supprime une place aimée par son ID de place
   * @param {number} placeId
   * @returns {Promise<boolean>}
   */
  async removePlaceLikedByPlaceId(placeId) {
    try {
      const result = await dbConnection.executeSql(
        "DELETE FROM place_liked WHERE id_places = ?;",
        [placeId],
      );
      return result.rowsAffected > 0;
    } catch (error) {
      console.error("Error removing liked place by place ID:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre de likes pour une place
   * @param {number} placeId
   * @returns {Promise<number>}
   */
  async countLikesForPlace(placeId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT COUNT(*) as count FROM place_liked WHERE id_places = ?;",
        [placeId],
      );
      return result.rows._array[0]?.count || 0;
    } catch (error) {
      console.error("Error counting likes for place:", error);
      throw error;
    }
  }
}

export default new PlaceLikedRepository();
