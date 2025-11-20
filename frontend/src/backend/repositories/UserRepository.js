/**
 * Repository pour la gestion des profils utilisateur
 * Accès aux données de la table user_profiles
 */

import dbConnection from '../database/connection';
import { blobToVector, vectorToBlob } from '../algorithms/vectorUtils';

class UserRepository {
  /**
   * Récupère tous les profils utilisateur
   * @returns {Promise<Array>}
   */
  async getAllProfiles() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, created_at, updated_at FROM user_profiles;',
        []
      );
      return result.rows._array;
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      throw error;
    }
  }

  /**
   * Récupère un profil utilisateur par son ID
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  async getProfileById(userId) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, preferences_vector, created_at, updated_at FROM user_profiles WHERE id = ?;',
        [userId]
      );
      
      if (result.rows._array.length === 0) return null;
      
      const profile = result.rows._array[0];
      
      // Convertir le BLOB en vecteur si présent
      if (profile.preferences_vector) {
        profile.preferencesArray = blobToVector(profile.preferences_vector);
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile by ID:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau profil utilisateur
   * @param {Array<number>} preferencesVector - Vecteur de préférences
   * @returns {Promise<number>} - ID du profil créé
   */
  async createProfile(preferencesVector = null) {
    try {
      const vectorBlob = preferencesVector ? vectorToBlob(preferencesVector) : null;
      
      const result = await dbConnection.executeSql(
        'INSERT INTO user_profiles (preferences_vector) VALUES (?);',
        [vectorBlob]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Met à jour le vecteur de préférences d'un utilisateur
   * @param {number} userId
   * @param {Array<number>} preferencesVector
   * @returns {Promise<boolean>}
   */
  async updatePreferences(userId, preferencesVector) {
    try {
      const vectorBlob = vectorToBlob(preferencesVector);
      
      await dbConnection.executeSql(
        'UPDATE user_profiles SET preferences_vector = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;',
        [vectorBlob, userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Supprime un profil utilisateur
   * @param {number} userId
   * @returns {Promise<boolean>}
   */
  async deleteProfile(userId) {
    try {
      await dbConnection.executeSql(
        'DELETE FROM user_profiles WHERE id = ?;',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  /**
   * Récupère le profil le plus récent (utile pour un système mono-utilisateur)
   * @returns {Promise<Object|null>}
   */
  async getLatestProfile() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, preferences_vector, created_at, updated_at FROM user_profiles ORDER BY updated_at DESC LIMIT 1;',
        []
      );
      
      if (result.rows._array.length === 0) return null;
      
      const profile = result.rows._array[0];
      
      // Convertir le BLOB en vecteur si présent
      if (profile.preferences_vector) {
        profile.preferencesArray = blobToVector(profile.preferences_vector);
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching latest profile:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de profils
   * @returns {Promise<number>}
   */
  async countProfiles() {
    try {
      const result = await dbConnection.executeSql(
        'SELECT COUNT(*) as count FROM user_profiles;',
        []
      );
      return result.rows._array[0].count;
    } catch (error) {
      console.error('Error counting profiles:', error);
      throw error;
    }
  }
}

export default new UserRepository();
