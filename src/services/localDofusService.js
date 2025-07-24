// Service local pour remplacer l'API DofusDB.fr
// Ce service utilise les données extraites localement

class LocalDofusService {
  constructor() {
    this.data = null
    this.isInitialized = false
    this.initPromise = null
    
    console.log('🚀 Service local Dofus initialisé')
  }

  // Initialiser le service en chargeant les données
  async initialize() {
    if (this.isInitialized) {
      return this.data
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.loadData()
    return this.initPromise
  }

  // Charger les données depuis les fichiers JSON
  async loadData() {
    try {
      console.log('📦 Chargement des données locales...')
      
      // Charger les données principales
      const dataResponse = await fetch('/src/data/local/dofus-data.json')
      if (!dataResponse.ok) {
        throw new Error(`Impossible de charger les données: ${dataResponse.status}`)
      }
      
      this.data = await dataResponse.json()
      this.isInitialized = true
      
      console.log(`✅ Données chargées: ${this.data.metadata.totalItems} items, ${this.data.metadata.totalRecipes} recettes, ${this.data.metadata.totalJobs} métiers`)
      
      return this.data
      
    } catch (error) {
      console.error('❌ Erreur chargement données locales:', error)
      throw error
    }
  }

  // Recherche d'items avec cache intelligent
  async searchItems(query, limit = 10) {
    await this.initialize()
    
    if (!query || query.trim().length < 2) {
      return []
    }

    const results = []
    const searchTerm = query.toLowerCase().trim()
    
    // Recherche dans les items
    for (const [id, item] of Object.entries(this.data.items)) {
      const itemName = item.name.toLowerCase()
      
      // Recherche exacte en premier
      if (itemName === searchTerm) {
        results.unshift({
          id: parseInt(id),
          ...item,
          matchType: 'exact'
        })
      }
      // Recherche par début de mot
      else if (itemName.startsWith(searchTerm)) {
        results.push({
          id: parseInt(id),
          ...item,
          matchType: 'starts'
        })
      }
      // Recherche par inclusion
      else if (itemName.includes(searchTerm)) {
        results.push({
          id: parseInt(id),
          ...item,
          matchType: 'contains'
        })
      }
      
      if (results.length >= limit * 2) break // Plus de résultats pour le tri
    }
    
    // Trier par pertinence et limiter
    const sortedResults = results
      .sort((a, b) => {
        // Priorité: exact > starts > contains
        const priority = { exact: 3, starts: 2, contains: 1 }
        return priority[b.matchType] - priority[a.matchType]
      })
      .slice(0, limit)
      .map(item => {
        const { matchType, ...cleanItem } = item
        return cleanItem
      })
    
    console.log(`🔍 Recherche "${query}": ${sortedResults.length} résultats`)
    return sortedResults
  }

  // Détails d'un item
  async getItemDetails(itemId) {
    await this.initialize()
    
    const item = this.data.items[itemId]
    if (!item) {
      console.warn(`⚠️ Item non trouvé: ${itemId}`)
      return null
    }
    
    return {
      id: parseInt(itemId),
      ...item
    }
  }

  // Recettes d'un item
  async getItemRecipes(itemId) {
    await this.initialize()
    
    const recipes = this.data.recipes[itemId] || []
    
    // Enrichir les recettes avec les détails des ingrédients
    const enrichedRecipes = recipes.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients.map(ingredient => {
        const materialDetails = this.data.items[ingredient.id]
        return {
          ...ingredient,
          level: materialDetails?.level || 0,
          type: materialDetails?.type || 'Matériau',
          rarity: materialDetails?.rarity || null
        }
      })
    }))
    
    console.log(`📋 ${enrichedRecipes.length} recettes trouvées pour l'item ${itemId}`)
    return enrichedRecipes
  }

  // Vérifier si un item a des recettes
  async checkItemHasRecipe(itemId) {
    await this.initialize()
    
    const hasRecipe = this.data.recipes[itemId] && this.data.recipes[itemId].length > 0
    return hasRecipe
  }

  // Détails d'un matériau
  async getMaterialDetails(materialId) {
    await this.initialize()
    
    const material = this.data.items[materialId]
    if (!material) {
      console.warn(`⚠️ Matériau non trouvé: ${materialId}`)
      return null
    }
    
    return {
      id: parseInt(materialId),
      ...material
    }
  }

  // Tous les métiers
  async getAllJobs() {
    await this.initialize()
    
    const jobs = Object.values(this.data.jobs)
    console.log(`⚒️ ${jobs.length} métiers chargés`)
    return jobs
  }

  // Recherche avancée par métier
  async searchItemsByJob(jobName, limit = 20) {
    await this.initialize()
    
    const results = []
    const jobSearchTerm = jobName.toLowerCase()
    
    for (const [id, item] of Object.entries(this.data.items)) {
      if (item.job && item.job.toLowerCase().includes(jobSearchTerm)) {
        results.push({
          id: parseInt(id),
          ...item
        })
        
        if (results.length >= limit) break
      }
    }
    
    console.log(`🔍 ${results.length} items trouvés pour le métier "${jobName}"`)
    return results
  }

  // Recherche par niveau
  async searchItemsByLevel(minLevel, maxLevel, limit = 20) {
    await this.initialize()
    
    const results = []
    
    for (const [id, item] of Object.entries(this.data.items)) {
      if (item.level >= minLevel && item.level <= maxLevel) {
        results.push({
          id: parseInt(id),
          ...item
        })
        
        if (results.length >= limit) break
      }
    }
    
    console.log(`🔍 ${results.length} items trouvés entre les niveaux ${minLevel}-${maxLevel}`)
    return results
  }

  // Statistiques du service
  getStats() {
    if (!this.data) {
      return { initialized: false }
    }
    
    return {
      initialized: true,
      ...this.data.metadata,
      cacheSize: this.getCacheSize()
    }
  }

  // Taille du cache (simulation)
  getCacheSize() {
    if (!this.data) return 0
    
    const dataSize = JSON.stringify(this.data).length
    return Math.round(dataSize / 1024) // KB
  }

  // Vérifier si le service est prêt
  isReady() {
    return this.isInitialized && this.data !== null
  }

  // Obtenir l'URL d'une image locale
  getImageUrl(imagePath) {
    if (!imagePath) return null
    
    // Si c'est déjà une URL complète, la retourner
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    // Sinon, construire l'URL locale
    const imageId = imagePath.split('/').pop()
    return `/images/items/${imageId}`
  }

  // Obtenir l'URL d'une image de matériau
  getMaterialImageUrl(imagePath) {
    if (!imagePath) return null
    
    if (imagePath.startsWith('http')) {
      return imagePath
    }
    
    const imageId = imagePath.split('/').pop()
    return `/images/materials/${imageId}`
  }

  // Recherche rapide (sans initialisation)
  quickSearch(query, limit = 5) {
    if (!this.isInitialized || !this.data) {
      console.warn('⚠️ Service non initialisé, utilisation de la recherche lente')
      return this.searchItems(query, limit)
    }
    
    const results = []
    const searchTerm = query.toLowerCase().trim()
    
    for (const [id, item] of Object.entries(this.data.items)) {
      if (item.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: parseInt(id),
          ...item
        })
        
        if (results.length >= limit) break
      }
    }
    
    return results
  }
}

// Créer une instance singleton
const localDofusService = new LocalDofusService()

export default localDofusService 