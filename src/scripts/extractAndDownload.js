// Script principal pour extraire les données et télécharger toutes les images
import ImageDownloader from './downloadImages.js'

class DataExtractor {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.dbUrl = import.meta.env?.DEV
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database'
    this.imageDownloader = new ImageDownloader()
    
    this.extractedItems = new Map()
    this.extractedResources = new Map()
    this.recipes = []
  }

  // Récupérer tous les métiers
  async fetchAllJobs() {
    console.log('🔍 Récupération de tous les métiers...')
    
    try {
      const response = await fetch(`${this.baseApiUrl}/jobs`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const jobs = await response.json()
      console.log(`✅ ${jobs.data.length} métiers trouvés`)
      
      return jobs.data
    } catch (error) {
      console.error('❌ Erreur récupération métiers:', error)
      return []
    }
  }

  // Récupérer toutes les recettes d'un métier
  async fetchJobRecipes(jobId) {
    console.log(`🔍 Récupération recettes métier ${jobId}...`)
    
    try {
      let allRecipes = []
      let skip = 0
      const limit = 100
      
      while (true) {
        const url = `${this.baseApiUrl}/recipes?jobId=${jobId}&$limit=${limit}&$skip=${skip}`
        const response = await fetch(url)
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        const recipes = data.data || []
        
        if (recipes.length === 0) break
        
        allRecipes.push(...recipes)
        skip += limit
        
        console.log(`📦 ${allRecipes.length} recettes récupérées...`)
        
        // Pause pour être sympa avec l'API
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      console.log(`✅ ${allRecipes.length} recettes totales pour métier ${jobId}`)
      return allRecipes
      
    } catch (error) {
      console.error(`❌ Erreur récupération recettes métier ${jobId}:`, error)
      return []
    }
  }

  // Extraire les données d'un item
  extractItemData(recipe, jobName) {
    if (!recipe.result || !recipe.result.name?.fr) return null
    
    const item = recipe.result
    
    return {
      m_id: item.id,
      name_fr: item.name.fr,
      level: item.level || 1,
      type_id: item.typeId || 0,
      icon_id: item.iconId,
      profession: jobName,
      image_path: `/images/items/${item.iconId}.png`
    }
  }

  // Extraire les données d'une ressource
  extractResourceData(ingredient) {
    if (!ingredient || !ingredient.name?.fr) return null
    
    return {
      m_id: ingredient.id,
      name_fr: ingredient.name.fr,
      level: ingredient.level || 1,
      icon_id: ingredient.iconId,
      image_path: `/images/resources/${ingredient.iconId}.png`
    }
  }

  // Traiter toutes les recettes d'un métier
  async processJobRecipes(jobId, jobName) {
    console.log(`\n🔧 Traitement du métier: ${jobName}`)
    
    const recipes = await this.fetchJobRecipes(jobId)
    let processedCount = 0
    
    for (const recipe of recipes) {
      try {
        // Extraire l'item
        const itemData = this.extractItemData(recipe, jobName)
        if (itemData) {
          this.extractedItems.set(itemData.m_id, itemData)
        }
        
        // Extraire les ressources et créer les recettes
        if (recipe.ingredients && recipe.ingredientIds && recipe.quantities) {
          for (let i = 0; i < recipe.ingredients.length; i++) {
            const ingredient = recipe.ingredients[i]
            const quantity = recipe.quantities[i] || 1
            
            // Extraire la ressource
            const resourceData = this.extractResourceData(ingredient)
            if (resourceData) {
              this.extractedResources.set(resourceData.m_id, resourceData)
              
              // Créer la liaison recette
              if (itemData) {
                this.recipes.push({
                  item_id: itemData.m_id,
                  resource_id: resourceData.m_id,
                  quantity: quantity
                })
              }
            }
          }
        }
        
        processedCount++
        
      } catch (error) {
        console.error(`⚠️ Erreur traitement recette:`, error)
      }
    }
    
    console.log(`✅ ${processedCount} recettes traitées pour ${jobName}`)
  }

  // Extraire toutes les données
  async extractAllData() {
    console.log('🚀 DÉBUT DE L\'EXTRACTION COMPLÈTE')
    console.log('===================================')
    
    // Créer les dossiers pour les images
    this.imageDownloader.createDirectories()
    
    // Récupérer tous les métiers
    const jobs = await this.fetchAllJobs()
    
    if (jobs.length === 0) {
      console.error('❌ Aucun métier trouvé, arrêt du script')
      return
    }
    
    // Traiter chaque métier
    for (const job of jobs) {
      if (job.name?.fr) {
        await this.processJobRecipes(job.id, job.name.fr)
        
        // Pause entre les métiers
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log('\n📊 RÉSUMÉ DE L\'EXTRACTION')
    console.log('==========================')
    console.log(`📦 Items extraits: ${this.extractedItems.size}`)
    console.log(`🧱 Ressources extraites: ${this.extractedResources.size}`)
    console.log(`🔗 Recettes créées: ${this.recipes.length}`)
  }

  // Télécharger toutes les images
  async downloadAllImages() {
    console.log('\n🖼️ TÉLÉCHARGEMENT DES IMAGES')
    console.log('=============================')
    
    // Récupérer tous les icon_ids
    const itemIconIds = Array.from(this.extractedItems.values())
      .map(item => item.icon_id)
      .filter(id => id)
    
    const resourceIconIds = Array.from(this.extractedResources.values())
      .map(resource => resource.icon_id)
      .filter(id => id)
    
    console.log(`📦 ${itemIconIds.length} images d'items à télécharger`)
    console.log(`🧱 ${resourceIconIds.length} images de ressources à télécharger`)
    
    // Télécharger les images des items
    if (itemIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(itemIconIds, 'items', 5)
    }
    
    // Télécharger les images des ressources
    if (resourceIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(resourceIconIds, 'resources', 5)
    }
    
    // Afficher le résumé
    this.imageDownloader.printSummary()
    this.imageDownloader.calculateTotalSize()
  }

  // Sauvegarder en base de données
  async saveToDatabase() {
    console.log('\n💾 SAUVEGARDE EN BASE DE DONNÉES')
    console.log('=================================')
    
    try {
      // Sauvegarder les items
      const itemsArray = Array.from(this.extractedItems.values())
      console.log(`📦 Sauvegarde de ${itemsArray.length} items...`)
      
      // Sauvegarder les ressources
      const resourcesArray = Array.from(this.extractedResources.values())
      console.log(`🧱 Sauvegarde de ${resourcesArray.length} ressources...`)
      
      // Sauvegarder les recettes
      console.log(`🔗 Sauvegarde de ${this.recipes.length} recettes...`)
      
      // TODO: Implémenter les appels API vers la base de données
      console.log('⚠️ Sauvegarde BDD à implémenter')
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde BDD:', error)
    }
  }

  // Exécuter le script complet
  async run() {
    const startTime = Date.now()
    
    try {
      await this.extractAllData()
      await this.downloadAllImages()
      await this.saveToDatabase()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n🎉 EXTRACTION TERMINÉE EN ${duration.toFixed(1)}s`)
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error)
    }
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new DataExtractor()
  extractor.run()
}

export default DataExtractor
