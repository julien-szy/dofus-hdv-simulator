import { neon } from '@neondatabase/serverless';

// Fonction Netlify pour gérer la base de données
export async function handler(event, context) {
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

  console.log('Tables initialized');
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
