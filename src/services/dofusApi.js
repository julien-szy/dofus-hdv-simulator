// Service pour interagir avec l'API DofusDude
import { mockItems, mockMaterials } from '../data/mockItems.js'

// Déterminer l'URL de base selon l'environnement
const getApiBaseUrl = () => {
  // En développement, utiliser le proxy Vite
  if (import.meta.env.DEV) {
    return '/api'
  }
  // En production, utiliser notre fonction Netlify
  return '/api'
}

// Rechercher des objets
export const searchItems = async (term) => {
  if (!term || term.length < 3) {
    return []
  }

  try {
    const baseUrl = getApiBaseUrl()
    const url = `${baseUrl}/dofus3/v1/fr/items/equipment/search?query=${encodeURIComponent(term)}&limit=10`
    console.log('URL de recherche:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors'
    })
    
    console.log('Réponse status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Données reçues:', data)
    
    // L'API DofusDude retourne un objet avec une propriété "value" contenant les résultats
    const items = data.value || data.items || data || []
    console.log('Items trouvés:', items.length)
    
    return items
  } catch (error) {
    console.error('Erreur lors de la recherche (utilisation des données de démonstration):', error)

    // En cas d'erreur API, utiliser les données mock
    const filteredMockItems = mockItems.filter(item =>
      item.name.toLowerCase().includes(term.toLowerCase())
    )

    console.log('Utilisation des données de démonstration:', filteredMockItems.length, 'items')
    return filteredMockItems
  }
}

// Récupérer les détails d'un objet
export const getItemDetails = async (itemId) => {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/dofus3/v1/fr/items/equipment/${itemId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error)
    throw error
  }
}

// Récupérer les détails d'un matériau
export const getMaterialDetails = async (materialId, subtype) => {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/dofus3/v1/fr/items/${subtype}/${materialId}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération du matériau (utilisation des données de démonstration):', error)

    // En cas d'erreur API, utiliser les données mock
    const mockMaterial = mockMaterials[materialId]
    if (mockMaterial) {
      return mockMaterial
    }

    // Si pas de données mock, retourner un objet par défaut
    return {
      ankama_id: materialId,
      name: `Matériau ${materialId}`,
      level: 1
    }
  }
}
