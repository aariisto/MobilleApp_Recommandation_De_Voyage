/**
 * Gestion de la connexion SQLite pour React Native
 * Utilise expo-sqlite pour la compatibilité React Native
 */

import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.dbName = "travel.db";
    this.isInitialized = false;
  }

  /**
   * Copie la base de données depuis les assets vers le dossier SQLite
   * @returns {Promise<void>}
   */
  async copyDatabaseFromAssets() {
    if (this.isInitialized) {
      return;
    }

    const dbPath = `${FileSystem.documentDirectory}SQLite/${this.dbName}`;
    const dbDir = `${FileSystem.documentDirectory}SQLite`;

    try {
      // Créer le dossier SQLite s'il n'existe pas
      const dirInfo = await FileSystem.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        console.log("📁 Creating SQLite directory...");
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      // Vérifier si la base existe déjà
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (fileInfo.exists) {
        console.log("✅ Database already exists, skipping copy");
        this.isInitialized = true;
        return;
      }

      console.log("📦 Copying database from assets...");

      // Charger l'asset depuis le dossier assets
      const asset = Asset.fromModule(require("../../../assets/travel.db"));
      await asset.downloadAsync();

      // Copier vers le dossier SQLite
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath,
      });

      console.log("✅ Database copied successfully from assets");

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Error copying database:", error);
      throw error;
    }
  }

  /**
   * Ouvre ou crée la base de données SQLite
   * @returns {Promise<SQLite.SQLiteDatabase>}
   */
  async openDatabase() {
    if (this.db) {
      return this.db;
    }

    try {
      // Copier la base de données depuis les assets avant de l'ouvrir
      await this.copyDatabaseFromAssets();

      this.db = await SQLite.openDatabaseAsync(this.dbName);
      console.log("✅ Database opened successfully");
      return this.db;
    } catch (error) {
      console.error("❌ Error opening database:", error);
      throw error;
    }
  }

  /**
   * Exécute une requête SQL
   * @param {string} sql - Requête SQL
   * @param {Array} params - Paramètres de la requête
   * @returns {Promise<Object>}
   */
  async executeSql(sql, params = []) {
    const db = await this.openDatabase();

    try {
      // Pour les requêtes SELECT
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        const rows = await db.getAllAsync(sql, params);
        return { rows: { _array: rows } }; // Format compatible avec ancienne API
      }
      // Pour les requêtes INSERT, UPDATE, DELETE
      const result = await db.runAsync(sql, params);
      return result;
    } catch (error) {
      console.error("SQL Error:", error);
      throw error;
    }
  }

  /**
   * Exécute plusieurs requêtes dans une transaction
   * @param {Array<{sql: string, params: Array}>} queries
   * @returns {Promise<Array>}
   */
  async executeTransaction(queries) {
    const db = await this.openDatabase();

    try {
      const results = [];
      await db.withTransactionAsync(async () => {
        for (let i = 0; i < queries.length; i++) {
          const { sql, params = [] } = queries[i];
          const result = await db.runAsync(sql, params);
          results[i] = result;
        }
      });
      return results;
    } catch (error) {
      console.error("Transaction Error:", error);
      throw error;
    }
  }

  /**
   * Ferme la base de données
   */
  async closeDatabase() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log("✅ Database connection closed");
    }
  }

  /**
   * Obtient l'instance de la base de données
   * @returns {SQLite.SQLiteDatabase}
   */
  getDatabase() {
    return this.db;
  }
}

// Export singleton
const dbConnection = new DatabaseConnection();
export default dbConnection;
