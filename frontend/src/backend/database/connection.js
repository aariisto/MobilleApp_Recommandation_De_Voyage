/**
 * Gestion de la connexion SQLite pour React Native
 * Utilise expo-sqlite pour la compatibilité React Native
 */

import * as SQLite from 'expo-sqlite';

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.dbName = 'travel.db';
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
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      console.log('✅ Database opened successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Error opening database:', error);
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
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = await db.getAllAsync(sql, params);
        return { rows: { _array: rows } }; // Format compatible avec ancienne API
      }
      // Pour les requêtes INSERT, UPDATE, DELETE
      const result = await db.runAsync(sql, params);
      return result;
    } catch (error) {
      console.error('SQL Error:', error);
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
      console.error('Transaction Error:', error);
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
      console.log('✅ Database connection closed');
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
