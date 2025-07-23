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
    console.log('Requesting URL:', apiUrl)

    // Faire la requête vers l'API DofusDude
    const response = await fetch(apiUrl, {
      method: event.httpMethod,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dofus-HDV-Calculator/1.0'
      }
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', errorText)

      // Retourner les données mock en cas d'erreur API
      const mockItems = [
        {
          ankama_id: 26584,
          name: "Épée du Bouftou",
          level: 1,
          type: { name: "Épée" },
          recipe: [
            { item_ankama_id: 289, item_subtype: "resource", quantity: 10 },
            { item_ankama_id: 371, item_subtype: "resource", quantity: 5 }
          ]
        }
      ]

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockItems)
      }
    }

    const data = await response.json()
    console.log('API Response data:', data)

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
