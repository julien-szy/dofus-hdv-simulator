// Fonction Netlify pour proxy vers l'API DofusDude
export async function handler(event, context) {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    // Extraire le chemin de l'API depuis les paramètres
    const { path } = event.queryStringParameters || {}
    
    if (!path) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing path parameter' })
      }
    }

    // Construire l'URL vers DofusDude
    const apiUrl = `https://api.dofusdu.de${path}`
    
    // Faire la requête vers l'API DofusDude
    const response = await fetch(apiUrl, {
      method: event.httpMethod,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dofus-HDV-Calculator/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }

  } catch (error) {
    console.error('Proxy error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch from DofusDude API',
        message: error.message 
      })
    }
  }
}
