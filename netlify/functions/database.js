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

      case 'save_craftable_items':
        // Sauvegarder les objets craftables
        const savedItems = await saveCraftableItems(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(savedItems)
        };

      case 'get_craftable_items':
        // Récupérer les objets craftables
        try {
          const { profession, search } = event.queryStringParameters || {};
          const craftableItems = await getCraftableItems(sql, profession, search);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(craftableItems)
          };
        } catch (error) {
          console.error('Erreur get_craftable_items:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur récupération objets craftables', details: error.message })
          };
        }

      case 'get_import_stats':
        // Récupérer les statistiques d'import
        try {
          const stats = await getImportStats(sql);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(stats)
          };
        } catch (error) {
          console.error('Erreur get_import_stats:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur récupération statistiques', details: error.message })
          };
        }

      case 'get_items_by_profession':
        // Récupérer les items détaillés par métier pour l'admin
        try {
          const { profession } = event.queryStringParameters || {};
          if (!profession) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Paramètre profession requis' })
            };
          }

          const items = await getItemsByProfession(sql, profession);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(items)
          };
        } catch (error) {
          console.error('Erreur get_items_by_profession:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur récupération items par métier', details: error.message })
          };
        }

      case 'clean_duplicates':
        // Nettoyer les doublons pour un métier
        try {
          const { profession } = body || {};
          if (!profession) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Paramètre profession requis' })
            };
          }

          const deletedCount = await cleanDuplicateItems(sql, profession);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, deletedCount, message: `${deletedCount} doublons supprimés` })
          };
        } catch (error) {
          console.error('Erreur clean_duplicates:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur nettoyage doublons', details: error.message })
          };
        }

      case 'search_items':
        // Recherche interne d'items craftables
        try {
          const { q, limit = 20 } = event.queryStringParameters || {};
          if (!q || q.length < 2) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Paramètre de recherche requis (minimum 2 caractères)' })
            };
          }

          const items = await searchCraftableItems(sql, q, parseInt(limit));
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(items)
          };
        } catch (error) {
          console.error('Erreur search_items:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur recherche items', details: error.message })
          };
        }

      case 'extract_resources':
        // Extraire les ressources depuis les recettes
        try {
          const result = await extractAndSaveResources(sql);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
          };
        } catch (error) {
          console.error('Erreur extract_resources:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur extraction ressources', details: error.message })
          };
        }

      case 'get_item_resources':
        // Récupérer les ressources d'un item
        try {
          const { item_id } = event.queryStringParameters || {};
          if (!item_id) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Paramètre item_id requis' })
            };
          }

          const resources = await getItemResources(sql, parseInt(item_id));
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resources)
          };
        } catch (error) {
          console.error('Erreur get_item_resources:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erreur récupération ressources item', details: error.message })
          };
        }

      case 'save_search_cache':
        // Sauvegarder une recherche dans le cache
        const cachedSearch = await saveSearchCache(sql, body);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(cachedSearch)
        };

      case 'get_search_cache':
        // Récupérer une recherche du cache
        const { term } = event.queryStringParameters;
        const searchResult = await getSearchCache(sql, term);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(searchResult)
        };

      case 'update_craftable_data':
        // Mettre à jour les données craftables depuis DofusDB
        const updateResult = await updateCraftableData(sql);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(updateResult)
        };

      case 'delete_calculation':
        // Supprimer un calcul
        const deletedCalculation = await deleteCalculation(sql, body);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(deletedCalculation)
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

  // Créer la table des objets craftables par métier
  await sql`
    CREATE TABLE IF NOT EXISTS craftable_items (
      id SERIAL PRIMARY KEY,
      item_id INTEGER UNIQUE NOT NULL,
      item_name VARCHAR(500) NOT NULL,
      item_type VARCHAR(200),
      profession VARCHAR(200) NOT NULL,
      level_required INTEGER DEFAULT 1,
      item_data JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Index pour optimiser les recherches
  await sql`
    CREATE INDEX IF NOT EXISTS idx_craftable_items_profession ON craftable_items(profession)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_craftable_items_name ON craftable_items(item_name)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_craftable_items_type ON craftable_items(item_type)
  `;

  // Créer la table des ressources (matériaux de craft)
  await sql`
    CREATE TABLE IF NOT EXISTS craft_resources (
      id SERIAL PRIMARY KEY,
      resource_id INTEGER UNIQUE NOT NULL,
      resource_name VARCHAR(500) NOT NULL,
      resource_type VARCHAR(200),
      is_harvestable BOOLEAN DEFAULT false,
      is_droppable BOOLEAN DEFAULT false,
      is_craftable BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Créer la table de liaison items-ressources
  await sql`
    CREATE TABLE IF NOT EXISTS item_resource_requirements (
      id SERIAL PRIMARY KEY,
      item_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (resource_id) REFERENCES craft_resources(resource_id),
      UNIQUE(item_id, resource_id)
    )
  `;

  // Index pour optimiser les recherches de ressources
  await sql`
    CREATE INDEX IF NOT EXISTS idx_craft_resources_name ON craft_resources(resource_name)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_craft_resources_type ON craft_resources(resource_type)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_resource_item ON item_resource_requirements(item_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_item_resource_resource ON item_resource_requirements(resource_id)
  `;

  // Créer la table du cache de recherche global
  await sql`
    CREATE TABLE IF NOT EXISTS search_cache (
      id SERIAL PRIMARY KEY,
      search_term VARCHAR(500) NOT NULL,
      search_results JSONB NOT NULL,
      search_count INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(search_term)
    )
  `;

  // Index pour optimiser les recherches dans le cache
  await sql`
    CREATE INDEX IF NOT EXISTS idx_search_cache_term ON search_cache(search_term)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_search_cache_count ON search_cache(search_count DESC)
  `;

  // Migration : Augmenter la taille des colonnes si nécessaire
  try {
    await sql`
      ALTER TABLE craftable_items
      ALTER COLUMN item_name TYPE VARCHAR(500),
      ALTER COLUMN item_type TYPE VARCHAR(200),
      ALTER COLUMN profession TYPE VARCHAR(200)
    `;
    console.log('✅ Migration des colonnes craftable_items effectuée');
  } catch (error) {
    // Ignorer si les colonnes ont déjà la bonne taille
    console.log('ℹ️ Migration des colonnes ignorée (déjà à jour)');
  }

  try {
    await sql`
      ALTER TABLE search_cache
      ALTER COLUMN search_term TYPE VARCHAR(500)
    `;
    console.log('✅ Migration des colonnes search_cache effectuée');
  } catch (error) {
    // Ignorer si les colonnes ont déjà la bonne taille
    console.log('ℹ️ Migration search_cache ignorée (déjà à jour)');
  }

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

// Fonctions pour les objets craftables
async function saveCraftableItems(sql, itemsData) {
  const { items } = itemsData;
  const results = [];

  for (const item of items) {
    const craftableItem = await sql`
      INSERT INTO craftable_items
      (item_id, item_name, item_type, profession, level_required, item_data)
      VALUES (${item.item_id}, ${item.item_name}, ${item.item_type}, ${item.profession}, ${item.level_required}, ${JSON.stringify(item.item_data)})
      ON CONFLICT (item_id)
      DO UPDATE SET
        item_name = EXCLUDED.item_name,
        item_type = EXCLUDED.item_type,
        profession = EXCLUDED.profession,
        level_required = EXCLUDED.level_required,
        item_data = EXCLUDED.item_data,
        updated_at = NOW()
      RETURNING *
    `;
    results.push(craftableItem[0]);
  }

  return results;
}

async function getCraftableItems(sql, profession = null, search = null) {
  try {
    console.log(`🔍 getCraftableItems appelé avec: profession=${profession}, search=${search}`);

    // Requête simple pour éviter les complications
    let query;

    if (profession && search) {
      query = sql`
        SELECT item_id, item_name, item_type, profession, level_required
        FROM craftable_items
        WHERE profession = ${profession}
        AND item_name ILIKE ${'%' + search + '%'}
        ORDER BY item_name
        LIMIT 100
      `;
    } else if (profession) {
      query = sql`
        SELECT item_id, item_name, item_type, profession, level_required
        FROM craftable_items
        WHERE profession = ${profession}
        ORDER BY item_name
        LIMIT 100
      `;
    } else if (search) {
      query = sql`
        SELECT item_id, item_name, item_type, profession, level_required
        FROM craftable_items
        WHERE item_name ILIKE ${'%' + search + '%'}
        ORDER BY item_name
        LIMIT 100
      `;
    } else {
      // Juste un count pour les stats
      query = sql`
        SELECT COUNT(*) as total FROM craftable_items
      `;
    }

    const items = await query;
    console.log(`✅ getCraftableItems: ${items.length} items récupérés`);
    return items;
  } catch (error) {
    console.error('❌ Erreur getCraftableItems:', error);
    // Retourner un tableau vide au lieu de throw
    return [];
  }
}

// Récupérer les statistiques d'import
async function getImportStats(sql) {
  try {
    console.log('📊 Récupération des statistiques d\'import...');

    // Récupérer tous les items avec leur métier
    const items = await sql`
      SELECT profession, COUNT(*) as count, MAX(updated_at) as last_update
      FROM craftable_items
      GROUP BY profession
      ORDER BY profession
    `;

    // Calculer le total
    const totalItems = items.reduce((sum, item) => sum + parseInt(item.count), 0);

    // Créer l'objet byProfession
    const byProfession = {};
    let lastUpdate = null;

    for (const item of items) {
      byProfession[item.profession] = parseInt(item.count);
      if (item.last_update && (!lastUpdate || new Date(item.last_update) > new Date(lastUpdate))) {
        lastUpdate = item.last_update;
      }
    }

    console.log(`✅ Stats: ${totalItems} items total, ${Object.keys(byProfession).length} métiers`);

    return {
      totalItems,
      byProfession,
      lastUpdate: lastUpdate ? new Date(lastUpdate).getTime() : null
    };
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    return {
      totalItems: 0,
      byProfession: {},
      lastUpdate: null
    };
  }
}

// Recherche interne d'items craftables (plus rapide que DofusDB)
async function searchCraftableItems(sql, searchTerm, limit = 20) {
  try {
    console.log(`🔍 Recherche interne: "${searchTerm}" (limit: ${limit})`);

    const items = await sql`
      SELECT
        item_id as ankama_id,
        item_name as name,
        item_type,
        profession,
        level_required as level,
        item_data,
        'true' as hasRecipe
      FROM craftable_items
      WHERE item_name ILIKE ${'%' + searchTerm + '%'}
      ORDER BY
        CASE
          WHEN item_name ILIKE ${searchTerm + '%'} THEN 1
          WHEN item_name ILIKE ${'%' + searchTerm + '%'} THEN 2
          ELSE 3
        END,
        item_name
      LIMIT ${limit}
    `;

    // Formater les résultats pour correspondre au format DofusDB
    const formattedItems = items.map(item => {
      let itemData = {};
      try {
        itemData = typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data || {};
      } catch (e) {
        console.warn('Erreur parsing item_data:', e);
      }

      return {
        ankama_id: item.ankama_id,
        name: item.name,
        level: item.level || 1,
        type: {
          name: item.item_type || 'Objet'
        },
        image_urls: itemData.image_urls || {
          icon: `https://api.dofusdb.fr/img/items/${item.ankama_id}.png`
        },
        recipe: itemData.recipe || [],
        hasRecipe: true,
        profession: item.profession
      };
    });

    console.log(`✅ ${formattedItems.length} items trouvés pour "${searchTerm}"`);
    return formattedItems;
  } catch (error) {
    console.error('❌ Erreur recherche interne:', error);
    return [];
  }
}

// Récupérer les items détaillés par métier pour l'admin
async function getItemsByProfession(sql, profession) {
  try {
    console.log(`🔍 Récupération des items pour le métier: ${profession}`);

    const items = await sql`
      SELECT
        item_id,
        item_name,
        item_type,
        profession,
        level_required,
        recipe_data,
        created_at,
        updated_at
      FROM craftable_items
      WHERE profession = ${profession}
      ORDER BY item_name
      LIMIT 500
    `;

    console.log(`✅ ${items.length} items trouvés pour ${profession}`);
    return items;
  } catch (error) {
    console.error(`❌ Erreur récupération items ${profession}:`, error);
    return [];
  }
}

// Fonction pour nettoyer les doublons
async function cleanDuplicateItems(sql, profession) {
  try {
    console.log(`🧹 Nettoyage des doublons pour: ${profession}`);

    // Supprimer les doublons en gardant le plus récent
    const result = await sql`
      DELETE FROM craftable_items
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY item_id, profession
                   ORDER BY updated_at DESC, created_at DESC
                 ) as rn
          FROM craftable_items
          WHERE profession = ${profession}
        ) t
        WHERE t.rn > 1
      )
    `;

    console.log(`✅ ${result.count || 0} doublons supprimés pour ${profession}`);
    return result.count || 0;
  } catch (error) {
    console.error(`❌ Erreur nettoyage doublons ${profession}:`, error);
    return 0;
  }
}

// Extraire et sauvegarder les ressources depuis les recettes
async function extractAndSaveResources(sql) {
  try {
    console.log('🔍 Extraction des ressources depuis les recettes...');

    // Récupérer tous les items avec leurs recettes
    const items = await sql`
      SELECT item_id, item_name, item_data
      FROM craftable_items
      WHERE item_data IS NOT NULL
    `;

    const resourcesMap = new Map();
    const itemResourceLinks = [];

    for (const item of items) {
      let itemData = {};
      try {
        itemData = typeof item.item_data === 'string' ? JSON.parse(item.item_data) : item.item_data || {};
      } catch (e) {
        continue;
      }

      const recipe = itemData.recipe || [];

      for (const ingredient of recipe) {
        if (ingredient.item_ankama_id && ingredient.name) {
          // Ajouter la ressource à la map
          if (!resourcesMap.has(ingredient.item_ankama_id)) {
            resourcesMap.set(ingredient.item_ankama_id, {
              resource_id: ingredient.item_ankama_id,
              resource_name: ingredient.name,
              resource_type: ingredient.type || 'Matériau',
              is_harvestable: false, // À déterminer plus tard
              is_droppable: false,   // À déterminer plus tard
              is_craftable: false    // À déterminer plus tard
            });
          }

          // Ajouter la liaison item-ressource
          itemResourceLinks.push({
            item_id: item.item_id,
            resource_id: ingredient.item_ankama_id,
            quantity: ingredient.quantity || 1
          });
        }
      }
    }

    console.log(`📦 ${resourcesMap.size} ressources uniques trouvées`);
    console.log(`🔗 ${itemResourceLinks.length} liaisons item-ressource créées`);

    // Sauvegarder les ressources
    let savedResources = 0;
    for (const resource of resourcesMap.values()) {
      try {
        await sql`
          INSERT INTO craft_resources
          (resource_id, resource_name, resource_type, is_harvestable, is_droppable, is_craftable)
          VALUES (${resource.resource_id}, ${resource.resource_name}, ${resource.resource_type},
                  ${resource.is_harvestable}, ${resource.is_droppable}, ${resource.is_craftable})
          ON CONFLICT (resource_id)
          DO UPDATE SET
            resource_name = EXCLUDED.resource_name,
            resource_type = EXCLUDED.resource_type,
            updated_at = NOW()
        `;
        savedResources++;
      } catch (error) {
        console.warn(`⚠️ Erreur sauvegarde ressource ${resource.resource_name}:`, error.message);
      }
    }

    // Sauvegarder les liaisons item-ressource
    let savedLinks = 0;
    for (const link of itemResourceLinks) {
      try {
        await sql`
          INSERT INTO item_resource_requirements
          (item_id, resource_id, quantity)
          VALUES (${link.item_id}, ${link.resource_id}, ${link.quantity})
          ON CONFLICT (item_id, resource_id)
          DO UPDATE SET
            quantity = EXCLUDED.quantity
        `;
        savedLinks++;
      } catch (error) {
        console.warn(`⚠️ Erreur sauvegarde liaison ${link.item_id}-${link.resource_id}:`, error.message);
      }
    }

    console.log(`✅ ${savedResources} ressources sauvegardées`);
    console.log(`✅ ${savedLinks} liaisons sauvegardées`);

    return {
      success: true,
      resourcesCount: savedResources,
      linksCount: savedLinks
    };
  } catch (error) {
    console.error('❌ Erreur extraction ressources:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Récupérer les ressources nécessaires pour un item
async function getItemResources(sql, itemId) {
  try {
    const resources = await sql`
      SELECT
        cr.resource_id,
        cr.resource_name,
        cr.resource_type,
        cr.is_harvestable,
        cr.is_droppable,
        cr.is_craftable,
        irr.quantity
      FROM item_resource_requirements irr
      JOIN craft_resources cr ON irr.resource_id = cr.resource_id
      WHERE irr.item_id = ${itemId}
      ORDER BY cr.resource_name
    `;

    return resources;
  } catch (error) {
    console.error(`❌ Erreur récupération ressources item ${itemId}:`, error);
    return [];
  }
}

// Fonctions pour le cache de recherche
async function saveSearchCache(sql, searchData) {
  const { search_term, search_results } = searchData;

  const cachedSearch = await sql`
    INSERT INTO search_cache (search_term, search_results)
    VALUES (${search_term}, ${JSON.stringify(search_results)})
    ON CONFLICT (search_term)
    DO UPDATE SET
      search_results = EXCLUDED.search_results,
      search_count = search_cache.search_count + 1,
      updated_at = NOW()
    RETURNING *
  `;

  return cachedSearch[0];
}

async function getSearchCache(sql, searchTerm) {
  const cached = await sql`
    SELECT * FROM search_cache
    WHERE search_term = ${searchTerm}
  `;

  if (cached.length > 0) {
    // Incrémenter le compteur d'utilisation
    await sql`
      UPDATE search_cache
      SET search_count = search_count + 1
      WHERE search_term = ${searchTerm}
    `;

    return cached[0];
  }

  return null;
}

// Fonction pour mettre à jour les données craftables (à appeler périodiquement)
async function updateCraftableData(sql) {
  // Cette fonction sera appelée pour mettre à jour les données depuis DofusDB
  // Pour le moment, on retourne juste un message
  return {
    message: 'Update function ready - will be implemented with DofusDB integration',
    timestamp: new Date().toISOString()
  };
}

// Supprimer un calcul
async function deleteCalculation(sql, data) {
  const { calculation_id } = data;

  try {
    console.log(`🗑️ Suppression du calcul ${calculation_id}`);

    const deletedCalculation = await sql`
      DELETE FROM calculations
      WHERE id = ${calculation_id}
      RETURNING *
    `;

    if (deletedCalculation.length === 0) {
      console.log(`⚠️ Calcul ${calculation_id} non trouvé`);
      return {
        success: false,
        message: 'Calcul non trouvé'
      };
    }

    console.log(`✅ Calcul ${calculation_id} supprimé avec succès`);
    return {
      success: true,
      deletedCalculation: deletedCalculation[0],
      message: 'Calcul supprimé avec succès'
    };
  } catch (error) {
    console.error(`❌ Erreur suppression calcul ${calculation_id}:`, error);
    throw error;
  }
}
