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

    // Construire l'URL vers DofusDude avec tous les paramètres
    const url = new URL(`https://api.dofusdu.de${path}`)

    // Ajouter tous les autres paramètres de query string
    Object.keys(event.queryStringParameters || {}).forEach(key => {
      if (key !== 'path') {
        url.searchParams.append(key, event.queryStringParameters[key])
      }
    })

    const apiUrl = url.toString()
    console.log('Requesting URL:', apiUrl)
    console.log('Query params:', event.queryStringParameters)

    // Faire la requête vers l'API DofusDude
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dofus-HDV-Calculator/1.0'
      }
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)

      // Retourner l'erreur pour debug au lieu des données mock
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: `API Error: ${response.status}`,
          details: errorText,
          url: apiUrl
        })
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
