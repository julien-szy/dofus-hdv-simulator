// Utilitaires pour la gestion des images optimisées
import imageService from '../services/imageService.js'

// Fonction helper pour obtenir une URL d'image avec fallback
export const getImageUrl = (iconId, type = 'item') => {
  return imageService.getImageUrl(iconId, type)
}

// Fonction pour pré-charger des images en arrière-plan
export const preloadImages = async (iconIds, type = 'item') => {
  if (!iconIds || iconIds.length === 0) return

  console.log(`🚀 Pré-chargement de ${iconIds.length} images (${type})`)
  
  // Filtrer les IDs valides
  const validIds = iconIds.filter(id => id && !imageService.cache.has(id) && !imageService.failedImages.has(id))
  
  if (validIds.length === 0) {
    console.log('✅ Toutes les images sont déjà en cache ou ont échoué')
    return
  }

  // Pré-charger par petits lots
  const batchSize = 5
  let loaded = 0
  let failed = 0

  for (let i = 0; i < validIds.length; i += batchSize) {
    const batch = validIds.slice(i, i + batchSize)
    
    const promises = batch.map(async (iconId) => {
      try {
        const imageUrl = `${imageService.baseUrl}/${iconId}.png`
        await imageService.preloadImage(iconId, imageUrl, type)
        loaded++
      } catch (error) {
        failed++
      }
    })
    
    await Promise.allSettled(promises)
    
    // Petite pause entre les lots
    if (i + batchSize < validIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log(`📊 Pré-chargement terminé: ${loaded} réussies, ${failed} échouées`)
  
  // Vérifier si on doit activer le mode dégradé
  imageService.autoDetectDegradedMode()
}

// Fonction pour extraire les iconIds d'une liste d'objets
export const extractIconIds = (items, iconIdField = 'iconId') => {
  if (!Array.isArray(items)) return []
  
  return items
    .map(item => {
      if (typeof iconIdField === 'function') {
        return iconIdField(item)
      }
      return item[iconIdField] || item.icon_id || item.iconId
    })
    .filter(id => id && typeof id === 'string' || typeof id === 'number')
    .map(id => String(id))
}

// Fonction pour extraire les iconIds des recettes
export const extractRecipeIconIds = (recipes) => {
  if (!Array.isArray(recipes)) return []
  
  const iconIds = new Set()
  
  recipes.forEach(recipe => {
    // Ajouter l'item résultat
    if (recipe.result?.iconId) {
      iconIds.add(String(recipe.result.iconId))
    }
    
    // Ajouter les ingrédients
    if (Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ingredient => {
        if (ingredient.iconId) {
          iconIds.add(String(ingredient.iconId))
        }
      })
    }
  })
  
  return Array.from(iconIds)
}

// Fonction pour obtenir les statistiques des images
export const getImageStats = () => {
  return imageService.getStats()
}

// Fonction pour afficher les statistiques
export const printImageStats = () => {
  imageService.printStats()
}

// Fonction pour activer/désactiver le mode dégradé
export const setDegradedMode = (enabled) => {
  imageService.setDegradedMode(enabled)
}

// Fonction pour nettoyer le cache
export const clearImageCache = () => {
  imageService.clearCache()
}

// Fonction pour vérifier si une image est disponible
export const isImageAvailable = (iconId) => {
  if (!iconId) return false
  return imageService.cache.has(iconId) && !imageService.failedImages.has(iconId)
}

// Fonction pour obtenir le statut d'une image
export const getImageStatus = (iconId) => {
  if (!iconId) return 'no-id'
  if (imageService.cache.has(iconId)) return 'cached'
  if (imageService.failedImages.has(iconId)) return 'failed'
  if (imageService.loadingImages.has(iconId)) return 'loading'
  return 'not-loaded'
}

// Fonction pour forcer le rechargement d'une image
export const reloadImage = async (iconId, type = 'item') => {
  if (!iconId) return false
  
  // Supprimer du cache et de la liste des échecs
  imageService.cache.delete(iconId)
  imageService.failedImages.delete(iconId)
  
  // Recharger
  try {
    const imageUrl = `${imageService.baseUrl}/${iconId}.png`
    await imageService.preloadImage(iconId, imageUrl, type)
    return true
  } catch (error) {
    return false
  }
}

// Fonction pour initialiser le service d'images avec une configuration
export const initImageService = (config = {}) => {
  if (config.timeout) {
    imageService.imageTimeout = config.timeout
  }
  
  if (config.degradedMode !== undefined) {
    imageService.setDegradedMode(config.degradedMode)
  }
  
  if (config.baseUrl) {
    imageService.baseUrl = config.baseUrl
  }
  
  console.log('🎨 Service d\'images initialisé avec la configuration:', config)
}

// Export par défaut
export default {
  getImageUrl,
  preloadImages,
  extractIconIds,
  extractRecipeIconIds,
  getImageStats,
  printImageStats,
  setDegradedMode,
  clearImageCache,
  isImageAvailable,
  getImageStatus,
  reloadImage,
  initImageService
}
