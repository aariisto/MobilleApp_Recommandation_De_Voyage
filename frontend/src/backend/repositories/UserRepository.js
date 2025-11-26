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
        'SELECT id, firstName, lastName, email, dateOfBirth, country, preferences, strengths, weaknesses, created_at, updated_at FROM user_profiles;',
        []
      );
      
      // Parse JSON fields
      return result.rows._array.map(profile => ({
        ...profile,
        preferences: profile.preferences ? JSON.parse(profile.preferences) : [],
        strengths: profile.strengths ? JSON.parse(profile.strengths) : [],
        weaknesses: profile.weaknesses ? JSON.parse(profile.weaknesses) : []
      }));
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
        'SELECT id, firstName, lastName, email, dateOfBirth, country, preferences, preferences_vector, strengths, weaknesses, created_at, updated_at FROM user_profiles WHERE id = ?;',
        [userId]
      );
      
      if (result.rows._array.length === 0) return null;
      
      const profile = result.rows._array[0];
      
      // Parse JSON fields
      profile.preferences = profile.preferences ? JSON.parse(profile.preferences) : [];
      profile.strengths = profile.strengths ? JSON.parse(profile.strengths) : [];
      profile.weaknesses = profile.weaknesses ? JSON.parse(profile.weaknesses) : [];
      
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
   * Récupère un profil utilisateur par email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async getProfileByEmail(email) {
    try {
      const result = await dbConnection.executeSql(
        'SELECT id, firstName, lastName, email, dateOfBirth, country, preferences, preferences_vector, strengths, weaknesses, created_at, updated_at FROM user_profiles WHERE email = ?;',
        [email]
      );
      
      if (result.rows._array.length === 0) return null;
      
      const profile = result.rows._array[0];
      
      // Parse JSON fields
      profile.preferences = profile.preferences ? JSON.parse(profile.preferences) : [];
      profile.strengths = profile.strengths ? JSON.parse(profile.strengths) : [];
      profile.weaknesses = profile.weaknesses ? JSON.parse(profile.weaknesses) : [];
      
      // Convertir le BLOB en vecteur si présent
      if (profile.preferences_vector) {
        profile.preferencesArray = blobToVector(profile.preferences_vector);
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau profil utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @param {string} userData.firstName - Prénom
   * @param {string} userData.lastName - Nom
   * @param {string} userData.email - Email
   * @param {string} [userData.dateOfBirth] - Date de naissance (format ISO)
   * @param {string} [userData.country] - Pays
   * @param {Array<string>} [userData.preferences] - Préférences (choix du QCM)
   * @param {Array<number>} [userData.preferencesVector] - Vecteur de préférences pour l'IA
   * @param {Array<string>} [userData.strengths] - Points forts (double-clic)
   * @param {Array<string>} [userData.weaknesses] - Points faibles (long press)
   * @returns {Promise<number>} - ID du profil créé
   */
  async createProfile(userData) {
    try {
      const {
        firstName,
        lastName,
        email,
        dateOfBirth = null,
        country = null,
        preferences = [],
        preferencesVector = null,
        strengths = [],
        weaknesses = []
      } = userData;

      const vectorBlob = preferencesVector ? vectorToBlob(preferencesVector) : null;
      
      const result = await dbConnection.executeSql(
        `INSERT INTO user_profiles (firstName, lastName, email, dateOfBirth, country, preferences, preferences_vector, strengths, weaknesses) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          firstName,
          lastName,
          email,
          dateOfBirth,
          country,
          JSON.stringify(preferences),
          vectorBlob,
          JSON.stringify(strengths),
          JSON.stringify(weaknesses)
        ]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  /**
   * Met à jour un profil utilisateur
   * @param {number} userId
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise<boolean>}
   */
  async updateProfile(userId, userData) {
    try {
      const fields = [];
      const values = [];

      if (userData.firstName !== undefined) {
        fields.push('firstName = ?');
        values.push(userData.firstName);
      }
      if (userData.lastName !== undefined) {
        fields.push('lastName = ?');
        values.push(userData.lastName);
      }
      if (userData.email !== undefined) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.dateOfBirth !== undefined) {
        fields.push('dateOfBirth = ?');
        values.push(userData.dateOfBirth);
      }
      if (userData.country !== undefined) {
        fields.push('country = ?');
        values.push(userData.country);
      }
      if (userData.preferences !== undefined) {
        fields.push('preferences = ?');
        values.push(JSON.stringify(userData.preferences));
      }
      if (userData.preferencesVector !== undefined) {
        fields.push('preferences_vector = ?');
        values.push(vectorToBlob(userData.preferencesVector));
      }
      if (userData.strengths !== undefined) {
        fields.push('strengths = ?');
        values.push(JSON.stringify(userData.strengths));
      }
      if (userData.weaknesses !== undefined) {
        fields.push('weaknesses = ?');
        values.push(JSON.stringify(userData.weaknesses));
      }

      if (fields.length === 0) {
        return true; // Rien à mettre à jour
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const sql = `UPDATE user_profiles SET ${fields.join(', ')} WHERE id = ?;`;
      
      await dbConnection.executeSql(sql, values);
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
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
        'SELECT id, firstName, lastName, email, dateOfBirth, country, preferences, preferences_vector, strengths, weaknesses, created_at, updated_at FROM user_profiles ORDER BY updated_at DESC LIMIT 1;',
        []
      );
      
      if (result.rows._array.length === 0) return null;
      
      const profile = result.rows._array[0];
      
      // Parse JSON fields
      profile.preferences = profile.preferences ? JSON.parse(profile.preferences) : [];
      profile.strengths = profile.strengths ? JSON.parse(profile.strengths) : [];
      profile.weaknesses = profile.weaknesses ? JSON.parse(profile.weaknesses) : [];
      
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
