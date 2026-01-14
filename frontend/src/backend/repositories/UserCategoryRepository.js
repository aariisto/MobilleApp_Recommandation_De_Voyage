/**
 * Repository pour gérer les likes/dislikes de catégories avec pondération
 * Système de pénalité : Score = Similarité - Σ(points × penaltyFactor)
 */

import dbConnection from "../database/connection";

class UserCategoryRepository {
  // ==================== LIKES ====================

  /**
   * Ajoute ou incrémente un like (+1 point, max 5)
   * @param {number} userId
   * @param {string} categoryName
   * @param {number} points - Points à ajouter (défaut: 1)
   */
  async addOrIncrementLike(userId, categoryName, points = 1) {
    try {
      // Vérifier si existe déjà
      const existing = await dbConnection.executeSql(
        "SELECT id, points FROM user_category_likes WHERE user_id = ? AND category_name = ?;",
        [userId, categoryName]
      );

      if (existing.rows._array.length > 0) {
        // Incrémente (cap à 5)
        const newPoints = Math.min(existing.rows._array[0].points + points, 5);
        await dbConnection.executeSql(
          "UPDATE user_category_likes SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;",
          [newPoints, existing.rows._array[0].id]
        );
        console.log(`✅ Like mis à jour: ${categoryName} (${newPoints} points)`);
      } else {
        // Crée nouvelle entrée
        const initialPoints = Math.min(points, 5);
        await dbConnection.executeSql(
          "INSERT INTO user_category_likes (user_id, category_name, points) VALUES (?, ?, ?);",
          [userId, categoryName, initialPoints]
        );
        console.log(`✅ Like ajouté: ${categoryName} (${initialPoints} points)`);
      }
    } catch (error) {
      console.error("❌ Erreur ajout/incrémentation like:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les likes d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Array<{category_name: string, points: number}>>}
   */
  async getUserLikes(userId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT category_name, points FROM user_category_likes WHERE user_id = ? ORDER BY points DESC;",
        [userId]
      );
      return result.rows._array;
    } catch (error) {
      console.error("❌ Erreur récupération likes:", error);
      throw error;
    }
  }

  /**
   * Supprime un like
   * @param {number} userId
   * @param {string} categoryName
   */
  async removeLike(userId, categoryName) {
    try {
      await dbConnection.executeSql(
        "DELETE FROM user_category_likes WHERE user_id = ? AND category_name = ?;",
        [userId, categoryName]
      );
      console.log(`✅ Like supprimé: ${categoryName}`);
    } catch (error) {
      console.error("❌ Erreur suppression like:", error);
      throw error;
    }
  }

  // ==================== DISLIKES ====================

  /**
   * Ajoute ou incrémente un dislike (+1 point, max 5)
   * @param {number} userId
   * @param {string} categoryName
   * @param {number} points - Points à ajouter (défaut: 1)
   */
  async addOrIncrementDislike(userId, categoryName, points = 1) {
    try {
      // Vérifier si existe déjà
      const existing = await dbConnection.executeSql(
        "SELECT id, points FROM user_category_dislikes WHERE user_id = ? AND category_name = ?;",
        [userId, categoryName]
      );

      if (existing.rows._array.length > 0) {
        // Incrémente (cap à 5)
        const newPoints = Math.min(existing.rows._array[0].points + points, 5);
        await dbConnection.executeSql(
          "UPDATE user_category_dislikes SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;",
          [newPoints, existing.rows._array[0].id]
        );
        console.log(`✅ Dislike mis à jour: ${categoryName} (${newPoints} points)`);
      } else {
        // Crée nouvelle entrée
        const initialPoints = Math.min(points, 5);
        await dbConnection.executeSql(
          "INSERT INTO user_category_dislikes (user_id, category_name, points) VALUES (?, ?, ?);",
          [userId, categoryName, initialPoints]
        );
        console.log(`✅ Dislike ajouté: ${categoryName} (${initialPoints} points)`);
      }
    } catch (error) {
      console.error("❌ Erreur ajout/incrémentation dislike:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les dislikes d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Array<{category_name: string, points: number}>>}
   */
  async getUserDislikes(userId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT category_name, points FROM user_category_dislikes WHERE user_id = ? ORDER BY points DESC;",
        [userId]
      );
      return result.rows._array;
    } catch (error) {
      console.error("❌ Erreur récupération dislikes:", error);
      throw error;
    }
  }

  /**
   * Supprime un dislike
   * @param {number} userId
   * @param {string} categoryName
   */
  async removeDislike(userId, categoryName) {
    try {
      await dbConnection.executeSql(
        "DELETE FROM user_category_dislikes WHERE user_id = ? AND category_name = ?;",
        [userId, categoryName]
      );
      console.log(`✅ Dislike supprimé: ${categoryName}`);
    } catch (error) {
      console.error("❌ Erreur suppression dislike:", error);
      throw error;
    }
  }

  // ==================== UTILS ====================

  /**
   * Récupère le profil complet des préférences (likes + dislikes)
   * @param {number} userId
   * @returns {Promise<{likes: Array, dislikes: Array}>}
   */
  async getUserPreferencesProfile(userId) {
    const likes = await this.getUserLikes(userId);
    const dislikes = await this.getUserDislikes(userId);
    return { likes, dislikes };
  }

  /**
   * Réinitialise toutes les préférences d'un utilisateur
   * @param {number} userId
   */
  async resetUserPreferences(userId) {
    try {
      await dbConnection.executeSql(
        "DELETE FROM user_category_likes WHERE user_id = ?;",
        [userId]
      );
      await dbConnection.executeSql(
        "DELETE FROM user_category_dislikes WHERE user_id = ?;",
        [userId]
      );
      console.log(`✅ Préférences réinitialisées pour user ${userId}`);
    } catch (error) {
      console.error("❌ Erreur réinitialisation préférences:", error);
      throw error;
    }
  }
}

export default new UserCategoryRepository();
