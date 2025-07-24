// Version browser-safe du script d'extraction (sans modules Node.js)
class BrowserDataExtractor {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.dbUrl = import.meta.env?.DEV
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database'
    
    this.extractedItems = new Map()
    this.extractedResources = new Map()
    this.recipes = []
  }

  // Récupérer tous les métiers
  async fetchAllJobs() {
    try {
      console.log('🔍 Récupération de la liste des métiers...')
      const response = await fetch(`${this.baseApiUrl}/jobs`)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      const jobs = data.data || []
      
      console.log(`✅ ${jobs.length} métiers trouvés`)
      return jobs
      
    } catch (error) {
      console.error('❌ Erreur récupération métiers:', error)
      return []
    }
  }

  // Récupérer les recettes d'un métier
  async fetchJobRecipes(jobId) {
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
    if (!recipe.result) return null
    
    return {
      m_id: recipe.result.id,
      name_fr: recipe.result.name?.fr || 'Nom inconnu',
      level: recipe.level || 1,
      profession: jobName,
      icon_id: recipe.result.iconId || null,
      type: 'craftable'
    }
  }

  // Extraire les données d'une ressource
  extractResourceData(ingredient) {
    if (!ingredient) return null
    
    return {
      m_id: ingredient.id,
      name_fr: ingredient.name?.fr || 'Ressource inconnue',
      icon_id: ingredient.iconId || null,
      type: 'resource'
    }
  }

  // Traiter les recettes d'un métier
  async processJobRecipes(jobId, jobName) {
    console.log(`\n🔧 Traitement du métier: ${jobName}`)
    
    const recipes = await this.fetchJobRecipes(jobId)
    
    if (recipes.length === 0) {
      console.log(`⚠️ Aucune recette trouvée pour ${jobName}`)
      return
    }
    
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
        
      } catch (error) {
        console.warn(`⚠️ Erreur traitement recette:`, error.message)
      }
    }
    
    console.log(`✅ ${jobName}: ${this.extractedItems.size} items, ${this.extractedResources.size} ressources`)
  }

  // Extraire toutes les données
  async extractAllData() {
    console.log('🚀 DÉBUT DE L\'EXTRACTION COMPLÈTE (Browser)')
    console.log('==========================================')
    
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
    console.log('=========================')
    console.log(`📦 Items craftables: ${this.extractedItems.size}`)
    console.log(`🧱 Ressources: ${this.extractedResources.size}`)
    console.log(`🔗 Recettes: ${this.recipes.length}`)
  }

  // Sauvegarder en base de données
  async saveToDatabase() {
    console.log('\n💾 SAUVEGARDE EN BASE DE DONNÉES')
    console.log('=================================')
    
    try {
      // Convertir les Maps en arrays
      const items = Array.from(this.extractedItems.values())
      const resources = Array.from(this.extractedResources.values())
      
      const payload = {
        action: 'bulk_import',
        items: items,
        resources: resources,
        recipes: this.recipes
      }
      
      console.log(`📤 Envoi de ${items.length} items, ${resources.length} ressources, ${this.recipes.length} recettes...`)
      
      const response = await fetch(this.dbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Sauvegarde réussie !')
        console.log(`   • ${result.itemsInserted || 0} items sauvegardés`)
        console.log(`   • ${result.resourcesInserted || 0} ressources sauvegardées`)
        console.log(`   • ${result.recipesInserted || 0} recettes sauvegardées`)
      } else {
        console.error('❌ Erreur sauvegarde:', result.error)
      }
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error)
    }
  }

  // Obtenir les statistiques
  getStats() {
    return {
      items: this.extractedItems.size,
      resources: this.extractedResources.size,
      recipes: this.recipes.length,
      imageIds: {
        items: Array.from(this.extractedItems.values())
          .map(item => item.icon_id)
          .filter(id => id),
        resources: Array.from(this.extractedResources.values())
          .map(resource => resource.icon_id)
          .filter(id => id)
      }
    }
  }

  // Exécuter l'extraction complète
  async run() {
    const startTime = Date.now()
    
    try {
      await this.extractAllData()
      await this.saveToDatabase()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n🎉 EXTRACTION TERMINÉE EN ${duration.toFixed(1)}s`)
      
      return {
        success: true,
        stats: this.getStats(),
        duration: duration
      }
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default BrowserDataExtractor
