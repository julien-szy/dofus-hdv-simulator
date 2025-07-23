// Service pour interagir avec l'API DofusDude via le SDK officiel
import { DofusDudeClient } from 'dofusdude-js'
import { mockItems, mockMaterials } from '../data/mockItems.js'

// Initialiser le client DofusDude
const client = new DofusDudeClient({
  // Le SDK gère automatiquement les CORS et les bonnes URLs
  apiKey: null // Pas besoin de clé API pour les endpoints publics
})

// Rechercher des objets
export const searchItems = async (term) => {
  if (!term || term.length < 3) {
    return []
  }

  try {
    console.log('Recherche avec le SDK DofusDude:', term)

    // Utiliser le SDK officiel pour la recherche
    const response = await client.getItemsEquipmentSearch({
      language: 'fr',
      game: 'dofus3',
      query: term,
      limit: 10
    })

    console.log('Réponse SDK:', response)

    // Le SDK retourne directement les données
    const items = response.data || response || []
    console.log('Items trouvés:', items.length)

    // Filtrer les objets qui ont une recette
    const itemsWithRecipe = items.filter(item => item.recipe && item.recipe.length > 0)

    return itemsWithRecipe
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
    console.log('Récupération détails objet avec SDK:', itemId)

    const response = await client.getItemsEquipmentSingle({
      language: 'fr',
      game: 'dofus3',
      ankamaId: itemId
    })

    return response.data || response
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error)
    throw error
  }
}

// Récupérer les détails d'un matériau
export const getMaterialDetails = async (materialId, subtype) => {
  try {
    console.log('Récupération détails matériau avec SDK:', materialId, subtype)

    // Utiliser le bon endpoint selon le subtype
    let response
    if (subtype === 'resource') {
      response = await client.getItemsResourcesSingle({
        language: 'fr',
        game: 'dofus3',
        ankamaId: materialId
      })
    } else {
      response = await client.getItemsConsumablesSingle({
        language: 'fr',
        game: 'dofus3',
        ankamaId: materialId
      })
    }

    return response.data || response
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
