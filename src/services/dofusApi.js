// Service pour interagir avec l'API DofusDude avec cache intelligent
import { mockItems, mockMaterials } from '../data/mockItems.js'
import dataCache from './dataCache.js'

// Déterminer l'URL de base selon l'environnement
const getApiBaseUrl = () => {
  // En développement, utiliser le proxy Vite
  if (import.meta.env.DEV) {
    return '/api'
  }
  // En production, utiliser notre fonction Netlify
  return '/.netlify/functions/dofus-proxy'
}

// Rechercher des objets avec cache intelligent
export const searchItems = async (term) => {
  if (!term || term.length < 3) {
    return []
  }

  try {
    // 1. Vérifier le cache d'abord
    const cachedResults = await dataCache.getCachedSearchResults(term)
    if (cachedResults) {
      console.log(`🚀 Cache hit pour recherche: "${term}"`)
      return cachedResults
    }

    console.log(`🌐 Cache miss, appel API pour: "${term}"`)

    // 2. Appel API si pas en cache
    const baseUrl = getApiBaseUrl()

    let url, response
    if (import.meta.env.DEV) {
      // En développement, utiliser le proxy Vite
      url = `${baseUrl}/dofus3/v1/fr/items/equipment/search?query=${encodeURIComponent(term)}&limit=10`
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
    } else {
      // En production, utiliser la fonction Netlify
      url = `${baseUrl}?path=/dofus3/v1/fr/items/equipment/search&query=${encodeURIComponent(term)}&limit=10`
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // L'API DofusDude retourne directement un tableau
    const items = Array.isArray(data) ? data : []

    // Filtrer les objets qui ont une recette
    const itemsWithRecipe = items.filter(item => item.recipe && item.recipe.length > 0)

    // 3. Mettre en cache le résultat
    await dataCache.cacheSearchResults(term, itemsWithRecipe)
    console.log(`💾 Résultats mis en cache pour: "${term}"`)

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

// Récupérer les détails d'un objet avec cache
export const getItemDetails = async (itemId) => {
  try {
    // 1. Vérifier le cache d'abord
    const cachedItem = await dataCache.getCachedItemDetails(itemId)
    if (cachedItem) {
      console.log(`🚀 Cache hit pour item: ${itemId}`)
      return cachedItem
    }

    console.log(`🌐 Cache miss, appel API pour item: ${itemId}`)

    // 2. Appel API si pas en cache
    const baseUrl = getApiBaseUrl()

    let url, response
    if (import.meta.env.DEV) {
      url = `${baseUrl}/dofus3/v1/fr/items/equipment/${itemId}`
      response = await fetch(url)
    } else {
      url = `${baseUrl}?path=/dofus3/v1/fr/items/equipment/${itemId}`
      response = await fetch(url)
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const itemData = await response.json()

    // 3. Mettre en cache le résultat
    await dataCache.cacheItemDetails(itemId, itemData)
    console.log(`💾 Item mis en cache: ${itemId}`)

    return itemData
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error.message)
    throw error
  }
}

// Récupérer les détails d'un matériau avec cache
export const getMaterialDetails = async (materialId, subtype) => {
  try {
    // 1. Vérifier le cache d'abord
    const cachedMaterial = await dataCache.getCachedMaterialDetails(materialId)
    if (cachedMaterial) {
      console.log(`🚀 Cache hit pour matériau: ${materialId}`)
      return cachedMaterial
    }

    console.log(`🌐 Cache miss, appel API pour matériau: ${materialId}`)

    // 2. Appel API si pas en cache
    const baseUrl = getApiBaseUrl()

    let url, response
    if (import.meta.env.DEV) {
      url = `${baseUrl}/dofus3/v1/fr/items/${subtype}/${materialId}`
      response = await fetch(url)
    } else {
      url = `${baseUrl}?path=/dofus3/v1/fr/items/${subtype}/${materialId}`
      response = await fetch(url)
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const materialData = await response.json()

    // 3. Mettre en cache le résultat
    await dataCache.cacheMaterialDetails(materialId, materialData)
    console.log(`💾 Matériau mis en cache: ${materialId}`)

    return materialData
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
