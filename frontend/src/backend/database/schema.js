/**
 * Schéma de la base de données SQLite
 * Structure basée sur la base PostgreSQL test_dump
 */

import dbConnection from "./connection";

/**
 * Crée toutes les tables de la base de données
 */
export const initializeDatabase = async () => {
  try {
    console.log("🔧 Initializing database schema...");

    const tables = [
      createCountriesTable(),
      createCitiesTable(),
      createCategoriesTable(),
      createPlacesTable(),
      createPlaceCategoriesTable(),
      createUserProfilesTable(),
      createUserCategoryLikesTable(),
      createUserCategoryDislikesTable(),
      createPlaceLikedTable(),
    ];

    await dbConnection.executeTransaction(tables);

    console.log("✅ Database schema initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

/**
 * Table countries
 * Structure: id, name
 */
const createCountriesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `,
  params: [],
});

/**
 * Table cities
 * Structure: id, name, lat, lon, country_id, embedding
 * Note: embedding stocké comme BLOB (array de doubles)
 */
const createCitiesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      country_id INTEGER,
      embedding BLOB,
      description TEXT,
      FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Table categories
 * Structure: id, name, parent_id
 */
const createCategoriesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `,
  params: [],
});

/**
 * Index sur le nom des catégories pour recherche rapide
 */
const createCategoryNameIndex = () => ({
  sql: `
    CREATE INDEX IF NOT EXISTS idx_category_name ON categories(name);
  `,
  params: [],
});

/**
 * Table places
 * Structure: id, name, lat, lon, city_id
 */
const createPlacesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      city_id INTEGER,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Index sur city_id pour les jointures rapides
 */
const createPlacesCityIndex = () => ({
  sql: `
    CREATE INDEX IF NOT EXISTS idx_city_id ON places(city_id);
  `,
  params: [],
});

/**
 * Table place_categories (table de liaison many-to-many)
 * Structure: place_id, category_id
 */
const createPlaceCategoriesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS place_categories (
      place_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (place_id, category_id),
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Table user_profiles pour stocker les informations et préférences utilisateur
 */
const createUserProfilesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      gender TEXT,
      dateOfBirth TEXT,
      country TEXT,
      preferences TEXT,
      preferences_vector BLOB,
      weaknesses TEXT,
      weaknesses_vector BLOB,
      user_embedding BLOB,
      updated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `,
  params: [],
});

/**
 * Table user_category_likes - Stocke les catégories aimées avec pondération (1-5 points)
 */
const createUserCategoryLikesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS user_category_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      points INTEGER DEFAULT 1 CHECK(points >= 1 AND points <= 5),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_name),
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Table user_category_dislikes - Stocke les catégories non aimées avec pondération (1-5 points)
 * Utilisé pour le calcul de pénalité : Score = Similarité - Σ(points × penaltyFactor)
 */
const createUserCategoryDislikesTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS user_category_dislikes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category_name TEXT NOT NULL,
      points INTEGER DEFAULT 1 CHECK(points >= 1 AND points <= 5),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, category_name),
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Table place_liked - Stocke les villes aimées par les utilisateurs
 */
const createPlaceLikedTable = () => ({
  sql: `
    CREATE TABLE IF NOT EXISTS place_liked (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_ville INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_ville) REFERENCES cities(id) ON DELETE CASCADE
    );
  `,
  params: [],
});

/**
 * Supprime toutes les tables (utile pour reset)
 */
export const dropAllTables = async () => {
  const dropQueries = [
    { sql: "DROP TABLE IF EXISTS place_liked;", params: [] },
    { sql: "DROP TABLE IF EXISTS user_category_likes;", params: [] },
    { sql: "DROP TABLE IF EXISTS user_category_dislikes;", params: [] },
    { sql: "DROP TABLE IF EXISTS place_categories;", params: [] },
    { sql: "DROP TABLE IF EXISTS places;", params: [] },
    { sql: "DROP TABLE IF EXISTS cities;", params: [] },
    { sql: "DROP TABLE IF EXISTS categories;", params: [] },
    { sql: "DROP TABLE IF EXISTS countries;", params: [] },
    { sql: "DROP TABLE IF EXISTS user_profiles;", params: [] },
  ];

  await dbConnection.executeTransaction(dropQueries);
  console.log("✅ All tables dropped");
};

/**
 * Obtient les informations sur les tables
 */
export const getTableInfo = async (tableName) => {
  const result = await dbConnection.executeSql(
    `PRAGMA table_info(${tableName});`,
    [],
  );
  return result.rows._array;
};

/**
 * Compte le nombre de lignes dans une table
 */
export const countRows = async (tableName) => {
  const result = await dbConnection.executeSql(
    `SELECT COUNT(*) as count FROM ${tableName};`,
    [],
  );
  return result.rows._array[0].count;
};
