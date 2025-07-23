// Service de cache intelligent avec IndexedDB pour les données Dofus
class DofusDataCache {
  constructor() {
    this.dbName = 'DofusHDVCache'
    this.version = 1
    this.db = null
    this.init()
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Store pour les résultats de recherche
        if (!db.objectStoreNames.contains('searchResults')) {
          const searchStore = db.createObjectStore('searchResults', { keyPath: 'query' })
          searchStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Store pour les détails d'items
        if (!db.objectStoreNames.contains('itemDetails')) {
          const itemStore = db.createObjectStore('itemDetails', { keyPath: 'ankama_id' })
          itemStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        // Store pour les détails de matériaux
        if (!db.objectStoreNames.contains('materialDetails')) {
          const materialStore = db.createObjectStore('materialDetails', { keyPath: 'ankama_id' })
          materialStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Cache des résultats de recherche (TTL: 1 heure)
  async cacheSearchResults(query, results) {
    if (!this.db) await this.init()
    
    const transaction = this.db.transaction(['searchResults'], 'readwrite')
    const store = transaction.objectStore('searchResults')
    
    const cacheData = {
      query: query.toLowerCase(),
      results,
      timestamp: Date.now(),
      ttl: 60 * 60 * 1000 // 1 heure
    }
    
    return store.put(cacheData)
  }

  // Récupérer les résultats de recherche du cache
  async getCachedSearchResults(query) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['searchResults'], 'readonly')
      const store = transaction.objectStore('searchResults')
      const request = store.get(query.toLowerCase())
      
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }
        
        // Vérifier si le cache n'a pas expiré
        const now = Date.now()
        if (now - result.timestamp > result.ttl) {
          // Cache expiré, le supprimer
          this.deleteCachedSearchResults(query)
          resolve(null)
          return
        }
        
        resolve(result.results)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Cache des détails d'items (TTL: 24 heures)
  async cacheItemDetails(itemId, data) {
    if (!this.db) await this.init()
    
    const transaction = this.db.transaction(['itemDetails'], 'readwrite')
    const store = transaction.objectStore('itemDetails')
    
    const cacheData = {
      ankama_id: itemId,
      data,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000 // 24 heures
    }
    
    return store.put(cacheData)
  }

  // Récupérer les détails d'item du cache
  async getCachedItemDetails(itemId) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['itemDetails'], 'readonly')
      const store = transaction.objectStore('itemDetails')
      const request = store.get(itemId)
      
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }
        
        // Vérifier si le cache n'a pas expiré
        const now = Date.now()
        if (now - result.timestamp > result.ttl) {
          // Cache expiré, le supprimer
          this.deleteCachedItemDetails(itemId)
          resolve(null)
          return
        }
        
        resolve(result.data)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Cache des détails de matériaux (TTL: 24 heures)
  async cacheMaterialDetails(materialId, data) {
    if (!this.db) await this.init()
    
    const transaction = this.db.transaction(['materialDetails'], 'readwrite')
    const store = transaction.objectStore('materialDetails')
    
    const cacheData = {
      ankama_id: materialId,
      data,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000 // 24 heures
    }
    
    return store.put(cacheData)
  }

  // Récupérer les détails de matériau du cache
  async getCachedMaterialDetails(materialId) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['materialDetails'], 'readonly')
      const store = transaction.objectStore('materialDetails')
      const request = store.get(materialId)
      
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }
        
        // Vérifier si le cache n'a pas expiré
        const now = Date.now()
        if (now - result.timestamp > result.ttl) {
          // Cache expiré, le supprimer
          this.deleteCachedMaterialDetails(materialId)
          resolve(null)
          return
        }
        
        resolve(result.data)
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  // Supprimer les caches expirés
  async deleteCachedSearchResults(query) {
    if (!this.db) await this.init()
    const transaction = this.db.transaction(['searchResults'], 'readwrite')
    const store = transaction.objectStore('searchResults')
    return store.delete(query.toLowerCase())
  }

  async deleteCachedItemDetails(itemId) {
    if (!this.db) await this.init()
    const transaction = this.db.transaction(['itemDetails'], 'readwrite')
    const store = transaction.objectStore('itemDetails')
    return store.delete(itemId)
  }

  async deleteCachedMaterialDetails(materialId) {
    if (!this.db) await this.init()
    const transaction = this.db.transaction(['materialDetails'], 'readwrite')
    const store = transaction.objectStore('materialDetails')
    return store.delete(materialId)
  }

  // Nettoyer tous les caches expirés
  async cleanExpiredCache() {
    if (!this.db) await this.init()
    
    const now = Date.now()
    const stores = ['searchResults', 'itemDetails', 'materialDetails']
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore('storeName')
      const index = store.index('timestamp')
      
      const request = index.openCursor()
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const record = cursor.value
          if (now - record.timestamp > record.ttl) {
            cursor.delete()
          }
          cursor.continue()
        }
      }
    }
  }

  // Obtenir les statistiques du cache
  async getCacheStats() {
    if (!this.db) await this.init()
    
    const stats = {}
    const stores = ['searchResults', 'itemDetails', 'materialDetails']
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const countRequest = store.count()
      
      stats[storeName] = await new Promise((resolve) => {
        countRequest.onsuccess = () => resolve(countRequest.result)
      })
    }
    
    return stats
  }

  // Vider tout le cache
  async clearAllCache() {
    if (!this.db) await this.init()
    
    const stores = ['searchResults', 'itemDetails', 'materialDetails']
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      await store.clear()
    }
  }
}

// Instance singleton
export const dataCache = new DofusDataCache()
export default dataCache
