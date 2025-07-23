// Fonction Vercel pour proxy vers l'API DofusDude
export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Gérer les requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { path } = req.query
    
    if (!path) {
      return res.status(400).json({ error: 'Missing path parameter' })
    }

    // Construire l'URL vers DofusDude
    const apiUrl = `https://api.dofusdu.de${path}`
    
    // Faire la requête
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dofus-HDV-Calculator/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    res.status(200).json(data)

  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch from DofusDude API',
      message: error.message 
    })
  }
}
