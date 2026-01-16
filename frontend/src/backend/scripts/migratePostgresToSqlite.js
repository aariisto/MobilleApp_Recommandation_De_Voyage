/**
 * Script de migration PostgreSQL → SQLite
 * Transfère toutes les données de la base PostgreSQL test_dump vers SQLite
 *
 * Prérequis:
 * npm install pg better-sqlite3 dotenv
 */

// Charger les variables d'environnement depuis .env
require("dotenv").config();

const { Client } = require("pg");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// Configuration PostgreSQL
const PG_CONFIG = {
  user: "postgres",
  host: "localhost",
  database: "cities",
  password: "postgres",
  port: 5432,
};

// Chemin vers la base SQLite (directement dans assets pour l'app mobile)
const SQLITE_DB_PATH = path.join(__dirname, "../../../assets/travel.db");

// Créer le dossier data s'il n'existe pas
const dataDir = path.dirname(SQLITE_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Convertit un array PostgreSQL en BLOB SQLite
 */
function vectorToBlob(pgArray) {
  if (!pgArray) return null;

  // Créer un Float64Array depuis l'array PostgreSQL
  const float64Array = new Float64Array(pgArray);

  // Convertir en Buffer (BLOB)
  const buffer = Buffer.from(float64Array.buffer);

  return buffer;
}

/**
 * Crée le schéma SQLite
 */
function createSchema(db) {
  console.log("🔧 Creating SQLite schema...");

  // Table countries
  db.exec(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // Table cities
  db.exec(`
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
  `);

  // Table categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      parent_id INTEGER,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_category_name ON categories(name);
  `);

  // Table places
  db.exec(`
    CREATE TABLE IF NOT EXISTS places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      city_id INTEGER,
      FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_city_id ON places(city_id);
  `);

  // Table place_categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS place_categories (
      place_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      PRIMARY KEY (place_id, category_id),
      FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Table user_profiles
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      dateOfBirth TEXT,
      country TEXT,
      preferences TEXT,
      preferences_vector BLOB,
      weaknesses TEXT,
      user_embedding BLOB,
      weaknesses_vector BLOB,
      updated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Table user_category_likes
  db.exec(`
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
  `);

  // Table user_category_dislikes
  db.exec(`
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
  `);

  console.log("✅ Schema created");
}

/**
 * Migre la table countries
 */
async function migrateCountries(pgClient, sqliteDb) {
  console.log("📦 Migrating countries...");

  const result = await pgClient.query(
    "SELECT id, name FROM countries ORDER BY id;"
  );

  const insert = sqliteDb.prepare(
    "INSERT INTO countries (id, name) VALUES (?, ?)"
  );
  const insertMany = sqliteDb.transaction((countries) => {
    for (const country of countries) {
      insert.run(country.id, country.name);
    }
  });

  insertMany(result.rows);

  console.log(`✅ Migrated ${result.rows.length} countries`);
  return result.rows.length;
}

/**
 * Migre la table cities
 */
async function migrateCities(pgClient, sqliteDb) {
  console.log("📦 Migrating cities...");

  const result = await pgClient.query(
    "SELECT id, name, lat, lon, country_id, embedding FROM cities ORDER BY id;"
  );

  const insert = sqliteDb.prepare(
    "INSERT INTO cities (id, name, lat, lon, country_id, embedding) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const insertMany = sqliteDb.transaction((cities) => {
    for (const city of cities) {
      const embeddingBlob = city.embedding
        ? vectorToBlob(city.embedding)
        : null;
      insert.run(
        city.id,
        city.name,
        city.lat,
        city.lon,
        city.country_id,
        embeddingBlob
      );
    }
  });

  insertMany(result.rows);

  console.log(`✅ Migrated ${result.rows.length} cities`);
  return result.rows.length;
}

/**
 * Migre la table categories
 */
async function migrateCategories(pgClient, sqliteDb) {
  console.log("📦 Migrating categories...");

  const result = await pgClient.query(
    "SELECT id, name, parent_id FROM categories ORDER BY id;"
  );

  const insert = sqliteDb.prepare(
    "INSERT INTO categories (id, name, parent_id) VALUES (?, ?, ?)"
  );

  const insertMany = sqliteDb.transaction((categories) => {
    for (const category of categories) {
      insert.run(category.id, category.name, category.parent_id);
    }
  });

  insertMany(result.rows);

  console.log(`✅ Migrated ${result.rows.length} categories`);
  return result.rows.length;
}

/**
 * Migre la table places
 */
async function migratePlaces(pgClient, sqliteDb) {
  console.log("📦 Migrating places...");

  const result = await pgClient.query(
    "SELECT id, name, lat, lon, city_id FROM places ORDER BY id;"
  );

  const insert = sqliteDb.prepare(
    "INSERT INTO places (id, name, lat, lon, city_id) VALUES (?, ?, ?, ?, ?)"
  );

  const insertMany = sqliteDb.transaction((places) => {
    for (const place of places) {
      insert.run(place.id, place.name, place.lat, place.lon, place.city_id);
    }
  });

  insertMany(result.rows);

  console.log(`✅ Migrated ${result.rows.length} places`);
  return result.rows.length;
}

/**
 * Migre la table place_categories
 */
async function migratePlaceCategories(pgClient, sqliteDb) {
  console.log("📦 Migrating place_categories...");

  const result = await pgClient.query(
    "SELECT place_id, category_id FROM place_categories ORDER BY place_id, category_id;"
  );

  const insert = sqliteDb.prepare(
    "INSERT INTO place_categories (place_id, category_id) VALUES (?, ?)"
  );

  const insertMany = sqliteDb.transaction((relations) => {
    for (const relation of relations) {
      insert.run(relation.place_id, relation.category_id);
    }
  });

  insertMany(result.rows);

  console.log(`✅ Migrated ${result.rows.length} place-category relations`);
  return result.rows.length;
}

/**
 * Vérifie les données migrées
 */
function verifyMigration(db) {
  console.log("\n🔍 Verifying migration...");

  const tables = [
    "countries",
    "cities",
    "categories",
    "places",
    "place_categories",
  ];

  tables.forEach((table) => {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`  ${table}: ${result.count} rows`);
  });
}

/**
 * Fonction principale de migration
 */
async function migrate() {
  const pgClient = new Client(PG_CONFIG);
  let sqliteDb;

  try {
    console.log("🚀 Starting migration from PostgreSQL to SQLite\n");

    // Connexion à PostgreSQL
    console.log("🔌 Connecting to PostgreSQL...");
    await pgClient.connect();
    console.log("✅ Connected to PostgreSQL\n");

    // Ouvrir/créer la base SQLite
    console.log("🔌 Opening SQLite database...");
    sqliteDb = new Database(SQLITE_DB_PATH);
    console.log("✅ SQLite database opened\n");

    // Créer le schéma
    createSchema(sqliteDb);
    console.log("");

    // Migrer les données
    const stats = {
      countries: 0,
      cities: 0,
      categories: 0,
      places: 0,
      place_categories: 0,
    };

    stats.countries = await migrateCountries(pgClient, sqliteDb);
    stats.cities = await migrateCities(pgClient, sqliteDb);
    stats.categories = await migrateCategories(pgClient, sqliteDb);
    stats.places = await migratePlaces(pgClient, sqliteDb);
    stats.place_categories = await migratePlaceCategories(pgClient, sqliteDb);

    // Vérification
    verifyMigration(sqliteDb);

    // Résumé
    const totalRows = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`📊 Total rows migrated: ${totalRows}`);
    console.log(`💾 SQLite database: ${SQLITE_DB_PATH}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    // Fermeture des connexions
    await pgClient.end();
    if (sqliteDb) {
      sqliteDb.close();
    }
    console.log("\n👋 Connections closed");
  }
}

// Exécuter la migration
if (require.main === module) {
  migrate().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { migrate };
