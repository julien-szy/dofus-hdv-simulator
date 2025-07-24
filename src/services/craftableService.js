// Service pour gérer les objets craftables et le cache de recherche
import { searchItems as searchDofusDB } from './dofusDbApi.js'

class CraftableService {
  constructor() {
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database';
    
    // Cache local pour éviter les appels répétés
    this.localCache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  // Rechercher des items avec cache intelligent
  async searchItems(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return []
    }

    const normalizedTerm = searchTerm.toLowerCase().trim()

    // 1. Vérifier le cache local
    const localCached = this.getFromLocalCache(normalizedTerm)
    if (localCached) {
      console.log(`🚀 Cache local hit pour: ${normalizedTerm}`)
      return localCached
    }

    // 2. Vérifier le cache BDD
    try {
      const dbCached = await this.getSearchCache(normalizedTerm)
      if (dbCached) {
        console.log(`💾 Cache BDD hit pour: ${normalizedTerm}`)
        this.setLocalCache(normalizedTerm, dbCached.search_results)
        return dbCached.search_results
      }
    } catch (error) {
      console.warn('Erreur cache BDD:', error)
    }

    // 3. Recherche interne dans la BDD (plus rapide que DofusDB)
    try {
      console.log(`🔍 Recherche interne pour: ${normalizedTerm}`)
      const internalResults = await this.searchInternalItems(normalizedTerm)

      if (internalResults.length > 0) {
        console.log(`⚒️ ${internalResults.length} objets trouvés en interne pour: ${normalizedTerm}`)

        // Sauvegarder dans le cache
        await this.saveSearchCache(normalizedTerm, internalResults)
        this.setLocalCache(normalizedTerm, internalResults)

        return internalResults
      }
    } catch (error) {
      console.warn('Erreur recherche interne:', error)
    }

    // 4. Fallback vers l'ancienne méthode craftables
    try {
      const craftableResults = await this.searchCraftableItems(normalizedTerm)
      if (craftableResults.length > 0) {
        console.log(`⚒️ ${craftableResults.length} objets craftables trouvés pour: ${normalizedTerm}`)

        // Sauvegarder dans le cache
        await this.saveSearchCache(normalizedTerm, craftableResults)
        this.setLocalCache(normalizedTerm, craftableResults)

        return craftableResults
      }
    } catch (error) {
      console.warn('Erreur recherche craftables:', error)
    }

    // 5. Fallback vers DofusDB (et filtrer les résultats) - en dernier recours
    try {
      console.log(`🌐 Recherche DofusDB pour: ${normalizedTerm}`)
      const dofusResults = await searchDofusDB(normalizedTerm)

      // Filtrer pour ne garder que les objets craftables
      const filteredResults = await this.filterCraftableOnly(dofusResults)

      if (filteredResults.length > 0) {
        // Sauvegarder dans le cache
        await this.saveSearchCache(normalizedTerm, filteredResults)
        this.setLocalCache(normalizedTerm, filteredResults)
      }

      console.log(`✅ ${filteredResults.length} objets craftables filtrés depuis DofusDB`)
      return filteredResults

    } catch (error) {
      console.error('Erreur recherche DofusDB:', error)
      return []
    }
  }

  // Recherche interne dans la BDD (plus rapide)
  async searchInternalItems(searchTerm) {
    try {
      const response = await fetch(`${this.baseUrl}?action=search_items&q=${encodeURIComponent(searchTerm)}&limit=20`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const items = await response.json()
      console.log(`🔍 Recherche interne: ${items.length} résultats pour "${searchTerm}"`)

      return items
    } catch (error) {
      console.error('Erreur recherche interne:', error)
      return []
    }
  }

  // Rechercher dans les objets craftables stockés
  async searchCraftableItems(searchTerm) {
    try {
      const response = await fetch(
        `${this.baseUrl}?action=get_craftable_items&search=${encodeURIComponent(searchTerm)}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const craftableItems = await response.json()
      
      // Convertir au format attendu par l'app
      return craftableItems.map(item => ({
        ankama_id: item.item_id,
        name: item.item_name,
        type: { name: item.item_type },
        level: item.level_required,
        profession: item.profession,
        ...JSON.parse(item.item_data || '{}')
      }))
      
    } catch (error) {
      console.error('Erreur recherche objets craftables:', error)
      return []
    }
  }

  // Filtrer les résultats DofusDB pour ne garder que les craftables
  async filterCraftableOnly(items) {
    try {
      const craftableIds = await this.getAllCraftableIds()
      return items.filter(item => craftableIds.has(item.ankama_id))
    } catch (error) {
      console.warn('Erreur filtrage craftables:', error)
      // En cas d'erreur, retourner tous les items (fallback)
      return items
    }
  }

  // Obtenir tous les IDs d'objets craftables
  async getAllCraftableIds() {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_craftable_items`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const craftableItems = await response.json()
      return new Set(craftableItems.map(item => item.item_id))
      
    } catch (error) {
      console.error('Erreur récupération IDs craftables:', error)
      return new Set()
    }
  }

  // Sauvegarder une recherche dans le cache BDD
  async saveSearchCache(searchTerm, results) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_search_cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_term: searchTerm,
          search_results: results
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log(`💾 Recherche mise en cache: ${searchTerm}`)
    } catch (error) {
      console.warn('Erreur sauvegarde cache:', error)
    }
  }

  // Récupérer une recherche du cache BDD
  async getSearchCache(searchTerm) {
    try {
      const response = await fetch(
        `${this.baseUrl}?action=get_search_cache&term=${encodeURIComponent(searchTerm)}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.search_results ? result : null
      
    } catch (error) {
      console.warn('Erreur récupération cache:', error)
      return null
    }
  }

  // Gestion du cache local
  setLocalCache(key, value) {
    this.localCache.set(key, {
      data: value,
      timestamp: Date.now()
    })
  }

  getFromLocalCache(key) {
    const cached = this.localCache.get(key)
    if (!cached) return null
    
    // Vérifier l'expiration
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.localCache.delete(key)
      return null
    }
    
    return cached.data
  }

  // Nettoyer le cache local expiré
  cleanExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.localCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.localCache.delete(key)
      }
    }
  }

  // Ajouter des objets craftables (pour l'admin)
  async addCraftableItems(items) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_craftable_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log(`✅ ${result.length} objets craftables ajoutés`)
      return result
      
    } catch (error) {
      console.error('Erreur ajout objets craftables:', error)
      throw error
    }
  }

  // Obtenir les statistiques du cache
  getCacheStats() {
    return {
      localCacheSize: this.localCache.size,
      localCacheKeys: Array.from(this.localCache.keys())
    }
  }

  // Vider le cache local
  clearLocalCache() {
    this.localCache.clear()
    console.log('🧹 Cache local vidé')
  }
}

// Instance singleton
export const craftableService = new CraftableService()
export default craftableService
