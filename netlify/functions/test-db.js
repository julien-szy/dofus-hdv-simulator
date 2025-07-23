// Test simple de la base de données
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // Vérifier si la variable d'environnement existe
    const dbUrl = process.env.NETLIFY_DATABASE_URL;
    
    if (!dbUrl) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'NETLIFY_DATABASE_URL not found',
          env: Object.keys(process.env).filter(key => key.includes('DATABASE'))
        })
      }
    }

    // Essayer d'importer neon
    const { neon } = require('@neondatabase/serverless');
    const sql = neon(dbUrl);

    // Test simple
    const result = await sql`SELECT 1 as test`;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database connection successful!',
        test: result[0],
        dbUrlExists: !!dbUrl
      })
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    }
  }
}
