/**
 * Repository pour la gestion des profils utilisateur
 * Accès aux données de la table user_profiles
 */

import dbConnection from "../database/connection";
import { blobToVector, vectorToBlob } from "../algorithms/vectorUtils";
import { getUserEmbedding } from "../algorithms/rankUtils";

class UserRepository {
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
   * @param {Array<string>} [userData.weaknesses] - Points faibles / catégories non-aimées
   * @param {Array<number>} [userData.weaknessesVector] - Vecteur de weaknesses pour l'IA
   * @param {Array<number>} [userData.userEmbedding] - Vecteur d'embedding utilisateur
   * @returns {Promise<number>} - ID du profil créé
   */
  async createProfile(userData) {
    try {
      // Migration rapide : Ajout de la colonne gender si elle n'existe pas
      try {
        await dbConnection.executeSql('ALTER TABLE user_profiles ADD COLUMN gender TEXT;');
        console.log("✅ Column 'gender' added successfully");
      } catch (e) {
        console.log("ℹ️ Column 'gender' might already exist or error:", e.message);
      }

      const {
        firstName,
        lastName,
        email,
        gender = null,
        dateOfBirth = null,
        country = null,
        preferences = [],
        preferencesVector = null,
        weaknesses = [],
        weaknessesVector = null,
        userEmbedding = null,
      } = userData;

      console.log("💾 Inserting profile with Gender:", gender);

      const vectorBlob = preferencesVector
        ? vectorToBlob(preferencesVector)
        : null;

      const weaknessesVectorBlob = weaknessesVector
        ? vectorToBlob(weaknessesVector)
        : null;

      const userEmbeddingBlob = userEmbedding
        ? vectorToBlob(userEmbedding)
        : null;

      const result = await dbConnection.executeSql(
        `INSERT INTO user_profiles (firstName, lastName, email, gender, dateOfBirth, country, preferences, preferences_vector, weaknesses, weaknesses_vector, user_embedding) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          firstName,
          lastName,
          email,
          gender, // Ajout du genre
          dateOfBirth,
          country,
          JSON.stringify(preferences),
          vectorBlob,
          JSON.stringify(weaknesses),
          weaknessesVectorBlob,
          userEmbeddingBlob,
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error creating profile:", error);
      throw error;
    }
  }

  /**
   * Met à jour le profil utilisateur (il n'y a toujours qu'un seul utilisateur)
   * @param {Object} userData - Données à mettre à jour
   * @returns {Promise<boolean>}
   */
  async updateProfile(userData) {
    try {
      const fields = [];
      const values = [];

      if (userData.firstName !== undefined) {
        fields.push("firstName = ?");
        values.push(userData.firstName);
      }
      if (userData.lastName !== undefined) {
        fields.push("lastName = ?");
        values.push(userData.lastName);
      }
      if (userData.email !== undefined) {
        fields.push("email = ?");
        values.push(userData.email);
      }
      if (userData.gender !== undefined) {
        fields.push("gender = ?");
        values.push(userData.gender);
      }
      if (userData.dateOfBirth !== undefined) {
        fields.push("dateOfBirth = ?");
        values.push(userData.dateOfBirth);
      }
      if (userData.country !== undefined) {
        fields.push("country = ?");
        values.push(userData.country);
      }
      if (userData.preferences !== undefined) {
        fields.push("preferences = ?");
        values.push(JSON.stringify(userData.preferences));
      }
      if (userData.preferencesVector !== undefined) {
        fields.push("preferences_vector = ?");
        values.push(vectorToBlob(userData.preferencesVector));
      }
      if (userData.weaknesses !== undefined) {
        fields.push("weaknesses = ?");
        values.push(JSON.stringify(userData.weaknesses));
      }
      if (userData.weaknessesVector !== undefined) {
        fields.push("weaknesses_vector = ?");
        values.push(vectorToBlob(userData.weaknessesVector));
      }
      if (userData.userEmbedding !== undefined) {
        fields.push("user_embedding = ?");
        values.push(vectorToBlob(userData.userEmbedding));
      }
      if (userData.updated !== undefined) {
        fields.push("updated = ?");
        values.push(userData.updated);
      }

      if (fields.length === 0) {
        return true; // Rien à mettre à jour
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");

      // Met à jour le premier (et unique) utilisateur
      const sql = `UPDATE user_profiles SET ${fields.join(
        ", "
      )} WHERE id = (SELECT id FROM user_profiles LIMIT 1);`;

      await dbConnection.executeSql(sql, values);

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
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
        "SELECT COUNT(*) as count FROM user_profiles;",
        []
      );
      return result.rows._array[0].count;
    } catch (error) {
      console.error("Error counting profiles:", error);
      throw error;
    }
  }

  /**
   * Récupère le profil utilisateur (il n'y a toujours qu'un seul utilisateur)
   * @param {Array<string>} [fields] - Champs à récupérer. Si vide ou non fourni, retourne tout.
   *   Valeurs possibles: 'id', 'firstName', 'lastName', 'email', 'dateOfBirth', 'country',
   *   'preferences', 'preferencesVector', 'weaknesses', 'weaknessesVector', 'userEmbedding',
   *   'updated', 'createdAt', 'updatedAt'
   * @returns {Promise<Object|null>} - Le profil utilisateur (complet ou partiel) ou null si aucun
   * @example
   *   // Récupérer tout le profil
   *   const profile = await UserRepository.getProfile();
   *   // Récupérer seulement certains champs
   *   const partial = await UserRepository.getProfile(['firstName', 'email', 'userEmbedding']);
   */
  async getProfile(fields = []) {
    try {
      // On récupère le dernier profil créé (ORDER BY id DESC)
      const result = await dbConnection.executeSql(
        "SELECT * FROM user_profiles ORDER BY id DESC LIMIT 1;",
        []
      );

      if (result.rows._array.length === 0) {
        return null;
      }

      const row = result.rows._array[0];

      // Mapping complet des champs
      const allFields = {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        gender: row.gender, // Ajout du mapping pour le genre
        dateOfBirth: row.dateOfBirth,
        country: row.country,
        preferences: row.preferences ? JSON.parse(row.preferences) : [],
        preferencesVector: row.preferences_vector
          ? blobToVector(row.preferences_vector)
          : null,
        weaknesses: row.weaknesses ? JSON.parse(row.weaknesses) : [],
        weaknessesVector: row.weaknesses_vector
          ? blobToVector(row.weaknesses_vector)
          : null,
        userEmbedding: row.user_embedding
          ? blobToVector(row.user_embedding)
          : null,
        updated: row.updated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      // Si aucun champ spécifié, retourner tout
      if (!fields || fields.length === 0) {
        return allFields;
      }

      // Sinon, retourner seulement les champs demandés
      const result_obj = {};
      for (const field of fields) {
        if (field in allFields) {
          result_obj[field] = allFields[field];
        }
      }
      return result_obj;
    } catch (error) {
      console.error("Error getting profile:", error);
      throw error;
    }
  }

  /**
   * Génère et stocke l'embedding utilisateur basé sur ses préférences
   * Utilise getUserEmbedding de rankUtils (likes - dislikes)
   * @param {Array<string>} likedCategories - Tableau des catégories aimées (ex: ["museum", "beach", "restaurant"])
   * @param {Array<string>} [dislikedCategories=[]] - Tableau des catégories non-aimées (ex: ["nightclub", "casino"])
   * @returns {Promise<number[]>} - L'embedding généré (384 dimensions)
   */
  async generateAndStoreUserEmbedding(
    likedCategories,
    dislikedCategories = []
  ) {
    try {
      // Convertir les tableaux en strings séparées par des espaces
      const likesText = likedCategories.join(" ");
      const dislikesText = dislikedCategories.join(" ");

      console.log("📝 Generating embedding for likes:", likesText);
      if (dislikesText) {
        console.log("📝 Dislikes:", dislikesText);
      }

      // Utiliser getUserEmbedding de rankUtils (calcule likes - dislikes)
      const embedding = await getUserEmbedding(likesText, dislikesText);

      console.log(`✅ Embedding généré: ${embedding.length} dimensions`);

      // Stocker l'embedding dans la base de données
      await this.updateProfile({
        userEmbedding: embedding,
        preferences: likesText, // Sauvegarder les catégories aimées
        weaknesses: dislikesText,
        updated: 1, // Et les catégories non-aimées
      });

      console.log("💾 Embedding stocké dans user_embedding");

      return embedding;
    } catch (error) {
      console.error("Error generating user embedding:", error);
      throw error;
    }
  }
}

export default new UserRepository();