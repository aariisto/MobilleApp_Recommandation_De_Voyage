CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  country_id INT REFERENCES countries(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  city_id INT REFERENCES cities(id) ON DELETE CASCADE
);

CREATE TABLE place_categories (
  place_id INT REFERENCES places(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, category_id)
);



CREATE INDEX idx_city_id ON places(city_id);
CREATE INDEX idx_place_category ON place_categories(category_id);
CREATE INDEX idx_category_name ON categories(name);


