// Service pour interagir avec l'API DofusDB.fr (NOUVELLE API RECOMMANDÉE)
import dataCache from './dataCache.js'

const API_BASE_URL = 'https://api.dofusdb.fr'

// Fonction pour normaliser les termes de recherche (enlever accents, etc.)
const normalizeSearchTerm = (term) => {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .trim()
}

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

    // 2. Préparer plusieurs variantes de recherche
    const searchVariants = [
      term, // Terme original (avec accents si présents)
      normalizeSearchTerm(term), // Terme sans accents
    ]

    let allItems = []

    // 3. Essayer chaque variante de recherche
    for (const searchTerm of searchVariants) {
      if (searchTerm && searchTerm.length >= 3) {
        console.log(`🔍 Recherche DofusDB.fr avec: "${searchTerm}"`)

        // Recherche par nom
        const nameUrl = `${API_BASE_URL}/items?name.fr[$regex]=${encodeURIComponent(searchTerm)}&$limit=20`
        console.log(`🔗 URL nom: ${nameUrl}`)

        try {
          const nameResponse = await fetch(nameUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          })

          if (nameResponse.ok) {
            const nameData = await nameResponse.json()
            const nameItems = nameData.data || []
            console.log(`📦 Recherche nom "${searchTerm}": ${nameItems.length} items`)
            allItems.push(...nameItems)
          }
        } catch (error) {
          console.warn(`⚠️ Erreur recherche nom "${searchTerm}":`, error.message)
        }

        // Recherche par slug (sans accents)
        const slugUrl = `${API_BASE_URL}/items?slug.fr[$regex]=${encodeURIComponent(searchTerm)}&$limit=20`
        console.log(`🔗 URL slug: ${slugUrl}`)

        try {
          const slugResponse = await fetch(slugUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            }
          })

          if (slugResponse.ok) {
            const slugData = await slugResponse.json()
            const slugItems = slugData.data || []
            console.log(`📦 Recherche slug "${searchTerm}": ${slugItems.length} items`)
            allItems.push(...slugItems)
          }
        } catch (error) {
          console.warn(`⚠️ Erreur recherche slug "${searchTerm}":`, error.message)
        }
      }
    }

    // 4. Dédupliquer les résultats par ID
    const uniqueItems = allItems.filter((item, index, self) =>
      index === self.findIndex(i => i.id === item.id)
    )
    console.log(`📦 Total unique items: ${uniqueItems.length}`)

    // 5. Retourner TOUS les items trouvés (on vérifiera les recettes au clic)
    console.log(`🎯 Items trouvés: ${uniqueItems.length} items`)

    // 6. Transformer les données pour correspondre à notre format
    const transformedItems = uniqueItems.map(item => ({
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

    // 7. Mettre en cache le résultat
    await dataCache.cacheSearchResults(term, transformedItems)
    console.log(`💾 Résultats DofusDB.fr mis en cache pour: "${term}" (${transformedItems.length} items trouvés)`)

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

      // Vérifier si l'item en cache a une recette vide mais devrait en avoir une
      if ((!cachedItem.recipe || cachedItem.recipe.length === 0) && cachedItem.hasRecipe) {
        console.log(`🔄 Item en cache sans recette mais hasRecipe=true, mise à jour du cache`)
        // Continue pour recharger avec la recette
      } else {
        return cachedItem
      }
    }

    console.log(`🌐 Cache miss, appel DofusDB.fr pour item: ${itemId}`)

    // 2. Appel API DofusDB.fr
    const url = `${API_BASE_URL}/items/${itemId}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const item = await response.json()

    // 3. Récupérer la recette si l'item en a une
    let recipe = []
    if (item.hasRecipe) {
      console.log(`🔍 Récupération de la recette pour item: ${itemId}`)
      recipe = await getItemRecipe(itemId)
    }

    // 4. Transformer les données
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
      recipe: recipe,
      hasRecipe: item.hasRecipe || false
    }

    // 5. Mettre en cache le résultat
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

    // Récupérer la recette avec la syntaxe MongoDB
    const url = `${API_BASE_URL}/recipes?resultId[$in][]=${itemId}&$limit=1`
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

// Fonction pour vérifier si un item a une recette
export const checkItemHasRecipe = async (itemId) => {
  try {
    console.log(`🔍 Vérification recette pour item ID: ${itemId}`)

    // Utiliser la syntaxe MongoDB avec [$in][] même pour un seul ID
    const recipeUrl = `${API_BASE_URL}/recipes?resultId[$in][]=${itemId}&$limit=1`
    console.log(`🔗 URL recette: ${recipeUrl}`)

    const response = await fetch(recipeUrl)

    if (!response.ok) {
      console.log(`❌ Erreur API recettes: ${response.status}`)
      return false
    }

    const data = await response.json()
    const recipes = data.data || []

    console.log(`📜 Réponse API recettes:`, data)

    if (recipes.length > 0) {
      console.log(`✅ Recette trouvée pour item ${itemId}`)
      return true
    } else {
      console.log(`❌ Aucune recette pour item ${itemId}`)
      return false
    }
  } catch (error) {
    console.error(`⚠️ Erreur vérification recette:`, error)
    return false
  }
}

export default {
  searchItems,
  getItemDetails,
  getItemRecipe,
  getMaterialDetails,
  getAllRecipes,
  getAllItems,
  checkItemHasRecipe
}
