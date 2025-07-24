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
export const savePrice = (materialId, priceType, price, materialName = null, server = null) => {
  try {
    const storedPrices = loadStoredPrices()

    if (!storedPrices[materialId]) {
      storedPrices[materialId] = {
        price_1: 0,
        price_10: 0,
        price_100: 0,
        name: materialName || `Matériau ${materialId}`,
        server: server || 'Inconnu',
        updated_at: new Date().toISOString()
      }
    }

    // Mettre à jour le nom et serveur si fournis
    if (materialName) {
      storedPrices[materialId].name = materialName
    }
    if (server) {
      storedPrices[materialId].server = server
    }

    storedPrices[materialId][priceType] = parseFloat(price) || 0
    storedPrices[materialId].updated_at = new Date().toISOString()

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPrices))
    console.log(`💾 Prix sauvegardé: ${materialName || materialId} - ${priceType} = ${price} (${server || 'Serveur inconnu'})`)

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

// Migrer les anciens prix pour ajouter les noms manquants
export const migratePricesWithNames = async (getMaterialDetailsFunc) => {
  try {
    const storedPrices = loadStoredPrices()
    let hasChanges = false

    for (const [materialId, priceData] of Object.entries(storedPrices)) {
      // Si le nom n'existe pas, le récupérer
      if (!priceData.name) {
        try {
          const materialDetails = await getMaterialDetailsFunc(materialId)
          priceData.name = materialDetails.name || `Matériau ${materialId}`
          hasChanges = true
          console.log(`📝 Nom ajouté pour matériau ${materialId}: ${priceData.name}`)
        } catch (error) {
          console.warn(`⚠️ Impossible de récupérer le nom pour ${materialId}:`, error)
          priceData.name = `Matériau ${materialId}`
          hasChanges = true
        }
      }
    }

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPrices))
      console.log('✅ Migration des noms de matériaux terminée')
    }

    return storedPrices
  } catch (error) {
    console.error('❌ Erreur lors de la migration des prix:', error)
    return loadStoredPrices()
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
  importPrices,
  migratePricesWithNames
}
