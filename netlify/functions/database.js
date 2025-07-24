const { neon } = require('@neondatabase/serverless');

// Fonction Netlify pour gérer la base de données
exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Connexion à la base de données Neon
    const sql = neon(process.env.NETLIFY_DATABASE_URL);
    
    // Parser les paramètres
    const { action, table } = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};

    console.log('Database action:', action, 'table:', table);

    switch (action) {
      case 'init':
        // Initialiser les tables
        await initializeTables(sql);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Tables initialized successfully' })
        };

      case 'get_user':
        // Récupérer un utilisateur
        const { email } = event.queryStringParameters;
        const user = await getUser(sql, email);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(user)
        };

      case 'create_user':
        // Créer un utilisateur
        const newUser = await createUser(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(newUser)
        };

      case 'get_favorites':
        // Récupérer les favoris d'un utilisateur
        const { user_id } = event.queryStringParameters;
        const favorites = await getFavorites(sql, user_id);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(favorites)
        };

      case 'add_favorite':
        // Ajouter un favori
        const favorite = await addFavorite(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(favorite)
        };

      case 'remove_favorite':
        // Supprimer un favori
        await removeFavorite(sql, body);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Favorite removed' })
        };

      case 'save_calculation':
        // Sauvegarder un calcul
        const savedCalculation = await saveCalculation(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(savedCalculation)
        };

      case 'get_calculations':
        // Récupérer les calculs
        const { user_id: calcUserId } = event.queryStringParameters;
        const calculations = await getCalculations(sql, calcUserId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(calculations)
        };

      case 'save_material_price':
        // Sauvegarder un prix de matériau
        const savedPrice = await saveMaterialPrice(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(savedPrice)
        };

      case 'get_material_prices':
        // Récupérer les prix des matériaux
        const { user_id: priceUserId } = event.queryStringParameters;
        const prices = await getMaterialPrices(sql, priceUserId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(prices)
        };

      case 'save_professions':
        // Sauvegarder les métiers
        const savedProfessions = await saveProfessions(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(savedProfessions)
        };

      case 'get_professions':
        // Récupérer les métiers
        const { user_id: profUserId } = event.queryStringParameters;
        const professions = await getProfessions(sql, profUserId);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(professions)
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Fonctions utilitaires
async function initializeTables(sql) {
  // Créer la table des utilisateurs
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100),
      server_preference VARCHAR(50) DEFAULT 'Ily',
      theme_preference VARCHAR(20) DEFAULT 'dark',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Créer la table des favoris
  await sql`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL,
      item_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, item_id)
    )
  `;

  // Créer la table de l'historique
  await sql`
    CREATE TABLE IF NOT EXISTS user_searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      search_term VARCHAR(255),
      item_id INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Créer la table des calculs de craft
  await sql`
    CREATE TABLE IF NOT EXISTS user_calculations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL,
      item_name VARCHAR(255),
      sell_price DECIMAL(10,2),
      quantity INTEGER DEFAULT 1,
      total_cost DECIMAL(10,2),
      total_revenue DECIMAL(10,2),
      profit DECIMAL(10,2),
      roi DECIMAL(5,2),
      calculation_data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Créer la table des prix de matériaux
  await sql`
    CREATE TABLE IF NOT EXISTS user_material_prices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL,
      material_name VARCHAR(255),
      price_x1 DECIMAL(10,2),
      price_x10 DECIMAL(10,2),
      price_x100 DECIMAL(10,2),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, material_id)
    )
  `;

  // Créer la table des métiers/niveaux
  await sql`
    CREATE TABLE IF NOT EXISTS user_professions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      profession_name VARCHAR(100),
      level INTEGER DEFAULT 1,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, profession_name)
    )
  `;

  // Créer la table des paramètres utilisateur
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      setting_key VARCHAR(100),
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, setting_key)
    )
  `;

  console.log('✅ All tables initialized successfully');
}

async function getUser(sql, email) {
  const users = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return users[0] || null;
}

async function createUser(sql, userData) {
  const { email, username, server_preference, theme_preference } = userData;
  
  const users = await sql`
    INSERT INTO users (email, username, server_preference, theme_preference)
    VALUES (${email}, ${username}, ${server_preference || 'Ily'}, ${theme_preference || 'dark'})
    RETURNING *
  `;
  
  return users[0];
}

async function getFavorites(sql, userId) {
  const favorites = await sql`
    SELECT * FROM user_favorites 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return favorites;
}

async function addFavorite(sql, favoriteData) {
  const { user_id, item_id, item_name } = favoriteData;
  
  const favorites = await sql`
    INSERT INTO user_favorites (user_id, item_id, item_name)
    VALUES (${user_id}, ${item_id}, ${item_name})
    ON CONFLICT (user_id, item_id) DO NOTHING
    RETURNING *
  `;
  
  return favorites[0];
}

async function removeFavorite(sql, favoriteData) {
  const { user_id, item_id } = favoriteData;

  await sql`
    DELETE FROM user_favorites
    WHERE user_id = ${user_id} AND item_id = ${item_id}
  `;
}

// Fonctions pour les calculs
async function saveCalculation(sql, calculationData) {
  const {
    user_id, item_id, item_name, sell_price, quantity,
    total_cost, total_revenue, profit, roi, calculation_data
  } = calculationData;

  const calculations = await sql`
    INSERT INTO user_calculations
    (user_id, item_id, item_name, sell_price, quantity, total_cost, total_revenue, profit, roi, calculation_data)
    VALUES (${user_id}, ${item_id}, ${item_name}, ${sell_price}, ${quantity}, ${total_cost}, ${total_revenue}, ${profit}, ${roi}, ${JSON.stringify(calculation_data)})
    RETURNING *
  `;

  return calculations[0];
}

async function getCalculations(sql, userId) {
  const calculations = await sql`
    SELECT * FROM user_calculations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return calculations;
}

// Fonctions pour les prix des matériaux
async function saveMaterialPrice(sql, priceData) {
  const { user_id, material_id, material_name, price_x1, price_x10, price_x100 } = priceData;

  const prices = await sql`
    INSERT INTO user_material_prices
    (user_id, material_id, material_name, price_x1, price_x10, price_x100)
    VALUES (${user_id}, ${material_id}, ${material_name}, ${price_x1}, ${price_x10}, ${price_x100})
    ON CONFLICT (user_id, material_id)
    DO UPDATE SET
      material_name = EXCLUDED.material_name,
      price_x1 = EXCLUDED.price_x1,
      price_x10 = EXCLUDED.price_x10,
      price_x100 = EXCLUDED.price_x100,
      updated_at = NOW()
    RETURNING *
  `;

  return prices[0];
}

async function getMaterialPrices(sql, userId) {
  const prices = await sql`
    SELECT * FROM user_material_prices
    WHERE user_id = ${userId}
    ORDER BY material_name
  `;
  return prices;
}

// Fonctions pour les métiers
async function saveProfessions(sql, professionData) {
  const { user_id, professions } = professionData;

  // Supprimer les anciens métiers
  await sql`
    DELETE FROM user_professions WHERE user_id = ${user_id}
  `;

  // Insérer les nouveaux métiers
  const results = [];
  for (const [profession_name, level] of Object.entries(professions)) {
    const profession = await sql`
      INSERT INTO user_professions (user_id, profession_name, level)
      VALUES (${user_id}, ${profession_name}, ${level})
      RETURNING *
    `;
    results.push(profession[0]);
  }

  return results;
}

async function getProfessions(sql, userId) {
  const professions = await sql`
    SELECT * FROM user_professions
    WHERE user_id = ${userId}
    ORDER BY profession_name
  `;
  return professions;
}
