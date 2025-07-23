// Service pour gérer le stockage persistant des prix des matériaux

const STORAGE_KEY = 'dofus_hdv_material_prices'

// Charger tous les prix depuis localStorage
export const loadStoredPrices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Erreur lors du chargement des prix:', error)
    return {}
  }
}

// Sauvegarder un prix pour un matériau
export const savePrice = (materialId, priceType, price) => {
  try {
    const storedPrices = loadStoredPrices()
    
    if (!storedPrices[materialId]) {
      storedPrices[materialId] = {
        price_1: 0,
        price_10: 0,
        price_100: 0
      }
    }
    
    storedPrices[materialId][priceType] = parseFloat(price) || 0
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPrices))
    console.log(`💾 Prix sauvegardé: ${materialId} - ${priceType} = ${price}`)
    
    return storedPrices
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du prix:', error)
    return loadStoredPrices()
  }
}

// Récupérer les prix d'un matériau
export const getMaterialPrice = (materialId) => {
  const storedPrices = loadStoredPrices()
  return storedPrices[materialId] || {
    price_1: 0,
    price_10: 0,
    price_100: 0
  }
}

// Récupérer tous les prix stockés
export const getAllStoredPrices = () => {
  return loadStoredPrices()
}

// Supprimer le prix d'un matériau
export const removeMaterialPrice = (materialId) => {
  try {
    const storedPrices = loadStoredPrices()
    delete storedPrices[materialId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPrices))
    console.log(`🗑️ Prix supprimé pour: ${materialId}`)
    return storedPrices
  } catch (error) {
    console.error('Erreur lors de la suppression du prix:', error)
    return loadStoredPrices()
  }
}

// Vider tous les prix
export const clearAllPrices = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('🗑️ Tous les prix supprimés')
    return {}
  } catch (error) {
    console.error('Erreur lors de la suppression des prix:', error)
    return {}
  }
}

// Exporter les prix (pour backup)
export const exportPrices = () => {
  const prices = loadStoredPrices()
  const dataStr = JSON.stringify(prices, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  
  const link = document.createElement('a')
  link.href = URL.createObjectURL(dataBlob)
  link.download = `dofus_hdv_prices_${new Date().toISOString().split('T')[0]}.json`
  link.click()
}

// Importer les prix (depuis backup)
export const importPrices = (jsonData) => {
  try {
    const prices = JSON.parse(jsonData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prices))
    console.log('📥 Prix importés avec succès')
    return prices
  } catch (error) {
    console.error('Erreur lors de l\'importation des prix:', error)
    throw new Error('Format de fichier invalide')
  }
}

export default {
  loadStoredPrices,
  savePrice,
  getMaterialPrice,
  getAllStoredPrices,
  removeMaterialPrice,
  clearAllPrices,
  exportPrices,
  importPrices
}
