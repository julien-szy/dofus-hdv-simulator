// Service pour interagir avec l'API DofusDB.fr (NOUVELLE API RECOMMANDÉE)
import dataCache from './dataCache.js'

const API_BASE_URL = 'https://api.dofusdb.fr'

// Rechercher des objets avec DofusDB.fr
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

    console.log(`🌐 Cache miss, appel DofusDB.fr pour: "${term}"`)
    
    // 2. Appel API DofusDB.fr
    const url = `${API_BASE_URL}/items?name.fr[$regex]=${encodeURIComponent(term)}&hasRecipe=true&$limit=10`
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
    const items = data.data || []

    // 3. Transformer les données pour correspondre à notre format
    const transformedItems = items.map(item => ({
      ankama_id: item.id,
      name: item.name?.fr || item.name || 'Nom inconnu',
      level: item.level || 1,
      type: {
        name: item.type?.name?.fr || 'Type inconnu'
      },
      image_urls: {
        icon: item.img || `https://api.dofusdb.fr/img/items/${item.iconId}.png`
      },
      recipe: [], // Sera rempli par getItemRecipe
      hasRecipe: item.hasRecipe || false
    }))

    // 4. Mettre en cache le résultat
    await dataCache.cacheSearchResults(term, transformedItems)
    console.log(`💾 Résultats DofusDB.fr mis en cache pour: "${term}"`)

    return transformedItems
  } catch (error) {
    console.error('Erreur API DofusDB.fr:', error.message)
    
    // Fallback vers l'ancienne API en cas d'erreur
    const { searchItems: fallbackSearch } = await import('./dofusApi.js')
    return fallbackSearch(term)
  }
}

// Récupérer les détails d'un objet avec DofusDB.fr
export const getItemDetails = async (itemId) => {
  try {
    // 1. Vérifier le cache d'abord
    const cachedItem = await dataCache.getCachedItemDetails(itemId)
    if (cachedItem) {
      console.log(`🚀 Cache hit pour item: ${itemId}`)
      return cachedItem
    }

    console.log(`🌐 Cache miss, appel DofusDB.fr pour item: ${itemId}`)

    // 2. Appel API DofusDB.fr
    const url = `${API_BASE_URL}/items/${itemId}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const item = await response.json()

    // 3. Transformer les données
    const transformedItem = {
      ankama_id: item.id,
      name: item.name?.fr || item.name || 'Nom inconnu',
      level: item.level || 1,
      type: {
        name: item.type?.name?.fr || 'Type inconnu'
      },
      image_urls: {
        icon: item.img || `https://api.dofusdb.fr/img/items/${item.iconId}.png`
      },
      recipe: [], // Sera rempli par getItemRecipe
      hasRecipe: item.hasRecipe || false
    }

    // 4. Mettre en cache le résultat
    await dataCache.cacheItemDetails(itemId, transformedItem)
    console.log(`💾 Item DofusDB.fr mis en cache: ${itemId}`)

    return transformedItem
  } catch (error) {
    console.error('Erreur lors de la récupération des détails DofusDB.fr:', error.message)
    
    // Fallback vers l'ancienne API
    const { getItemDetails: fallbackDetails } = await import('./dofusApi.js')
    return fallbackDetails(itemId)
  }
}

// Récupérer la recette d'un objet avec DofusDB.fr
export const getItemRecipe = async (itemId) => {
  try {
    console.log(`🔍 Récupération recette DofusDB.fr pour item: ${itemId}`)

    // Récupérer la recette
    const url = `${API_BASE_URL}/recipes?resultId=${itemId}&$limit=1`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const recipes = data.data || []

    if (recipes.length === 0) {
      console.log(`❌ Aucune recette trouvée pour item: ${itemId}`)
      return []
    }

    const recipe = recipes[0]
    
    // 3. Transformer la recette au format attendu
    const transformedRecipe = recipe.ingredientIds.map((ingredientId, index) => ({
      item_ankama_id: ingredientId,
      item_subtype: 'resource', // DofusDB.fr ne spécifie pas le subtype
      quantity: recipe.quantities[index] || 1
    }))

    console.log(`✅ Recette DofusDB.fr récupérée pour item: ${itemId}`, transformedRecipe)
    return transformedRecipe
  } catch (error) {
    console.error('Erreur lors de la récupération de la recette DofusDB.fr:', error.message)
    return []
  }
}

// Récupérer les détails d'un matériau avec DofusDB.fr
export const getMaterialDetails = async (materialId) => {
  try {
    // 1. Vérifier le cache d'abord
    const cachedMaterial = await dataCache.getCachedMaterialDetails(materialId)
    if (cachedMaterial) {
      console.log(`🚀 Cache hit pour matériau: ${materialId}`)
      return cachedMaterial
    }

    console.log(`🌐 Cache miss, appel DofusDB.fr pour matériau: ${materialId}`)

    // 2. Appel API DofusDB.fr
    const url = `${API_BASE_URL}/items/${materialId}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const material = await response.json()

    // 3. Transformer les données
    const transformedMaterial = {
      ankama_id: material.id,
      name: material.name?.fr || material.name || 'Matériau inconnu',
      level: material.level || 1,
      image_urls: {
        icon: material.img || `https://api.dofusdb.fr/img/items/${material.iconId}.png`
      }
    }

    // 4. Mettre en cache le résultat
    await dataCache.cacheMaterialDetails(materialId, transformedMaterial)
    console.log(`💾 Matériau DofusDB.fr mis en cache: ${materialId}`)

    return transformedMaterial
  } catch (error) {
    console.error('Erreur matériau DofusDB.fr:', error.message)
    
    // Fallback vers l'ancienne API
    const { getMaterialDetails: fallbackMaterial } = await import('./dofusApi.js')
    return fallbackMaterial(materialId, 'resource')
  }
}

// Récupérer toutes les recettes (pour import en BDD)
export const getAllRecipes = async (limit = 100, skip = 0) => {
  try {
    const url = `${API_BASE_URL}/recipes?$limit=${limit}&$skip=${skip}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      recipes: data.data || [],
      total: data.total || 0,
      hasMore: (skip + limit) < (data.total || 0)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des recettes:', error.message)
    return { recipes: [], total: 0, hasMore: false }
  }
}

// Récupérer tous les items (pour import en BDD)
export const getAllItems = async (limit = 100, skip = 0) => {
  try {
    const url = `${API_BASE_URL}/items?$limit=${limit}&$skip=${skip}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      items: data.data || [],
      total: data.total || 0,
      hasMore: (skip + limit) < (data.total || 0)
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des items:', error.message)
    return { items: [], total: 0, hasMore: false }
  }
}

export default {
  searchItems,
  getItemDetails,
  getItemRecipe,
  getMaterialDetails,
  getAllRecipes,
  getAllItems
}
