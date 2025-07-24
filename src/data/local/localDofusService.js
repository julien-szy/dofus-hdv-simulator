// Service local Dofus - Version test
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class LocalDofusService {
  constructor() {
    this.data = null
    this.isInitialized = false
    console.log('🚀 Service local initialisé')
  }

  async initialize() {
    if (this.isInitialized) return this.data
    
    try {
      const dataPath = path.join(__dirname, 'dofus-data.json')
      const dataContent = fs.readFileSync(dataPath, 'utf8')
      this.data = JSON.parse(dataContent)
      this.isInitialized = true
      
      console.log(`📊 ${this.data.metadata.totalItems} items, ${this.data.metadata.totalRecipes} recettes`)
      return this.data
    } catch (error) {
      console.error('❌ Erreur chargement données:', error)
      throw error
    }
  }

  async searchItems(query, limit = 10) {
    await this.initialize()
    if (!query || query.trim().length < 2) return []
    
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

  async getItemDetails(itemId) {
    await this.initialize()
    return this.data.items[itemId] || null
  }

  async getItemRecipes(itemId) {
    await this.initialize()
    return this.data.recipes[itemId] || []
  }

  async checkItemHasRecipe(itemId) {
    await this.initialize()
    return this.data.recipes[itemId] && this.data.recipes[itemId].length > 0
  }

  async getMaterialDetails(materialId) {
    await this.initialize()
    return this.data.items[materialId] || null
  }

  async getAllJobs() {
    await this.initialize()
    return Object.values(this.data.jobs)
  }

  getImageUrl(imagePath) {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    const imageId = imagePath.split('/').pop()
    return `/images/items/${imageId}`
  }

  async getStats() {
    await this.initialize()
    
    return {
      initialized: this.isInitialized,
      ...this.data.metadata,
      cacheSize: this.getCacheSize()
    }
  }

  getCacheSize() {
    if (!this.data) return 0
    
    const dataSize = JSON.stringify(this.data).length
    return Math.round(dataSize / 1024) // KB
  }
}

export default new LocalDofusService()
