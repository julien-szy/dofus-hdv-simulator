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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // L'API DofusDude retourne directement un tableau
    const items = Array.isArray(data) ? data : []

    // Filtrer les objets qui ont une recette
    const itemsWithRecipe = items.filter(item => item.recipe && item.recipe.length > 0)

    return itemsWithRecipe
  } catch (error) {
    console.error('Erreur API, utilisation des données de démonstration:', error.message)

    // En cas d'erreur API, utiliser les données mock
    const filteredMockItems = mockItems.filter(item =>
      item.name.toLowerCase().includes(term.toLowerCase())
    )

    return filteredMockItems
  }
}

// Récupérer les détails d'un objet
export const getItemDetails = async (itemId) => {
  try {
    const baseUrl = getApiBaseUrl()
    const url = `${baseUrl}/dofus3/v1/fr/items/equipment/${itemId}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error.message)
    throw error
  }
}

// Récupérer les détails d'un matériau
export const getMaterialDetails = async (materialId, subtype) => {
  try {
    const baseUrl = getApiBaseUrl()
    const url = `${baseUrl}/dofus3/v1/fr/items/${subtype}/${materialId}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur matériau, utilisation des données de démonstration:', error.message)

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
