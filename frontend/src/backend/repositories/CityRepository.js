/**
 * Repository pour la gestion des villes (cities)
 * Accès aux données de la table cities
 */

import dbConnection from "../database/connection";
import { blobToVector, vectorToBlob } from "../algorithms/vectorUtils";

class CityRepository {
  /**
   * Récupère toutes les villes
   * @returns {Promise<Array>}
   */
  async getAllCities() {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id FROM cities;",
        []
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error fetching cities:", error);
      throw error;
    }
  }

  /**
   * Récupère une ville par son ID
   * @param {number} cityId
   * @returns {Promise<Object|null>}
   */
  async getCityById(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id FROM cities WHERE id = ?;",
        [cityId]
      );
      return result.rows._array[0] || null;
    } catch (error) {
      console.error("Error fetching city by ID:", error);
      throw error;
    }
  }

  /**
   * Récupère une ville avec son embedding
   * @param {number} cityId
   * @returns {Promise<Object|null>}
   */
  async getCityWithEmbedding(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id, embedding FROM cities WHERE id = ?;",
        [cityId]
      );

      if (result.rows._array.length === 0) return null;

      const city = result.rows._array[0];

      // Convertir le BLOB en vecteur si présent
      if (city.embedding) {
        city.embeddingVector = blobToVector(city.embedding);
      }

      return city;
    } catch (error) {
      console.error("Error fetching city with embedding:", error);
      throw error;
    }
  }

  /**
   * Récupère la description d'une ville par son ID
   * @param {number} cityId
   * @returns {Promise<string|null>}
   */
  async getDescriptionById(cityId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT description FROM cities WHERE id = ?;",
        [cityId]
      );
      return result.rows._array[0]?.description || null;
    } catch (error) {
      console.error("Error fetching city description:", error);
      throw error;
    }
  }

  /**
   * Récupère les villes par pays
   * @param {number} countryId
   * @returns {Promise<Array>}
   */
  async getCitiesByCountry(countryId) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id FROM cities WHERE country_id = ?;",
        [countryId]
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error fetching cities by country:", error);
      throw error;
    }
  }

  /**
   * Recherche des villes par nom (recherche partielle)
   * @param {string} searchTerm
   * @returns {Promise<Array>}
   */
  async searchCitiesByName(searchTerm) {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id FROM cities WHERE name LIKE ? ORDER BY name;",
        [`%${searchTerm}%`]
      );
      return result.rows._array;
    } catch (error) {
      console.error("Error searching cities:", error);
      throw error;
    }
  }

  /**
   * Récupère les villes avec leurs embeddings pour calcul de similarité
   * @returns {Promise<Array>}
   */
  async getAllCitiesWithEmbeddings() {
    try {
      const result = await dbConnection.executeSql(
        "SELECT id, name, lat, lon, country_id, embedding FROM cities WHERE embedding IS NOT NULL;",
        []
      );

      return result.rows._array.map((city) => ({
        ...city,
        embeddingVector: city.embedding ? blobToVector(city.embedding) : null,
      }));
    } catch (error) {
      console.error("Error fetching cities with embeddings:", error);
      throw error;
    }
  }

  /**
   * Récupère TOUS les embeddings des villes au format JSON simple
   * Format de sortie : [{id, name, embedding}, ...]
   * @returns {Promise<Array>}
   */
  async getAllCityEmbeddings() {
    try {
      console.log("🔍 Checking total cities in database...");
      const countResult = await dbConnection.executeSql(
        "SELECT COUNT(*) as count FROM cities",
        []
      );
      console.log(
        `📊 Total cities in table: ${countResult.rows._array[0].count}`
      );

      console.log(
        "🔍 Executing query: SELECT id, name, embedding FROM cities WHERE embedding IS NOT NULL ORDER BY id;"
      );

      const result = await dbConnection.executeSql(
        "SELECT id, name, embedding FROM cities WHERE embedding IS NOT NULL ORDER BY id;",
        []
      );

      console.log(
        `📦 Query returned ${result.rows._array.length} rows with embeddings`
      );

      // Convertir les BLOBs en vecteurs et retourner format simple
      return result.rows._array.map((city) => ({
        id: city.id,
        name: city.name,
        embedding: city.embedding ? blobToVector(city.embedding) : [],
      }));
    } catch (error) {
      console.error("Error fetching all city embeddings:", error);
      throw error;
    }
  }

  /**
   * Insère une nouvelle ville
   * @param {Object} cityData - {name, lat, lon, country_id, embedding}
   * @returns {Promise<number>} - ID de la ville insérée
   */
  async insertCity(cityData) {
    try {
      const { name, lat, lon, country_id, embedding } = cityData;
      const embeddingBlob = embedding ? vectorToBlob(embedding) : null;

      const result = await dbConnection.executeSql(
        "INSERT INTO cities (name, lat, lon, country_id, embedding) VALUES (?, ?, ?, ?, ?);",
        [name, lat, lon, country_id, embeddingBlob]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error inserting city:", error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle ville
   * @param {Object} cityData
   * @returns {Promise<number>} ID de la ville créée
   */
  async createCity(cityData) {
    try {
      const { id, name, lat, lon, country_id, embedding } = cityData;
      const embeddingBlob = embedding ? vectorToBlob(embedding) : null;

      const result = await dbConnection.executeSql(
        "INSERT INTO cities (id, name, lat, lon, country_id, embedding) VALUES (?, ?, ?, ?, ?, ?);",
        [id, name, lat, lon, country_id, embeddingBlob]
      );

      return result.lastInsertRowid || id;
    } catch (error) {
      console.error("Error creating city:", error);
      throw error;
    }
  }

  /**
   * Met à jour une ville
   * @param {number} cityId
   * @param {Object} cityData
   * @returns {Promise<boolean>}
   */
  async updateCity(cityId, cityData) {
    try {
      const { name, lat, lon, country_id, embedding } = cityData;
      const embeddingBlob = embedding ? vectorToBlob(embedding) : null;

      await dbConnection.executeSql(
        "UPDATE cities SET name = ?, lat = ?, lon = ?, country_id = ?, embedding = ? WHERE id = ?;",
        [name, lat, lon, country_id, embeddingBlob, cityId]
      );

      return true;
    } catch (error) {
      console.error("Error updating city:", error);
      throw error;
    }
  }

  /**
   * Supprime une ville
   * @param {number} cityId
   * @returns {Promise<boolean>}
   */
  async deleteCity(cityId) {
    try {
      await dbConnection.executeSql("DELETE FROM cities WHERE id = ?;", [
        cityId,
      ]);
      return true;
    } catch (error) {
      console.error("Error deleting city:", error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de villes
   * @returns {Promise<number>}
   */
  async countCities() {
    try {
      const result = await dbConnection.executeSql(
        "SELECT COUNT(*) as count FROM cities;",
        []
      );
      return result.rows._array[0].count;
    } catch (error) {
      console.error("Error counting cities:", error);
      throw error;
    }
  }
}

export default new CityRepository();
