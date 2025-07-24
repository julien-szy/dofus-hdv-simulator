// Script principal pour extraire les données et télécharger toutes les images

// Import conditionnel selon l'environnement

// Fonction pour initialiser le téléchargeur selon l'environnement
async function initializeImageDownloader() {
  if (typeof window !== 'undefined') {
    // Environnement browser : utiliser la version browser-safe
    const { default: BrowserImageDownloader } = await import('../src/scripts/downloadImagesBrowser.js')
    return new BrowserImageDownloader()
  } else {
    // Environnement Node.js : utiliser la version complète
    const { default: NodeImageDownloader } = await import('./downloadImages.js')
    return new NodeImageDownloader()
  }
}

class DataExtractor {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.dbUrl = import.meta.env?.DEV
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database'
    this.imageDownloader = null // Sera initialisé plus tard

    this.extractedItems = new Map()
    this.extractedResources = new Map()
    this.recipes = []

    // Configuration depuis les variables d'environnement (GitHub Actions)
    this.forceDownload = (typeof process !== 'undefined' && process.env?.FORCE_DOWNLOAD === 'true') || false
    this.maxImages = (typeof process !== 'undefined' && parseInt(process.env?.MAX_IMAGES)) || 0

    console.log(`🔧 Configuration:`)
    console.log(`   Force download: ${this.forceDownload}`)
    console.log(`   Max images: ${this.maxImages || 'illimité'}`)
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

    // Initialiser le téléchargeur d'images
    if (!this.imageDownloader) {
      this.imageDownloader = await initializeImageDownloader()
    }

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

    // Initialiser le téléchargeur d'images si pas déjà fait
    if (!this.imageDownloader) {
      this.imageDownloader = await initializeImageDownloader()
    }

    // Récupérer tous les icon_ids
    let itemIconIds = Array.from(this.extractedItems.values())
      .map(item => item.icon_id)
      .filter(id => id)

    let resourceIconIds = Array.from(this.extractedResources.values())
      .map(resource => resource.icon_id)
      .filter(id => id)

    // Appliquer la limite si définie
    if (this.maxImages > 0) {
      const halfLimit = Math.floor(this.maxImages / 2)
      itemIconIds = itemIconIds.slice(0, halfLimit)
      resourceIconIds = resourceIconIds.slice(0, halfLimit)
      console.log(`⚠️ Limite appliquée: ${this.maxImages} images max`)
    }

    console.log(`📦 ${itemIconIds.length} images d'items à télécharger`)
    console.log(`🧱 ${resourceIconIds.length} images de ressources à télécharger`)

    // Configurer le téléchargeur
    if (this.forceDownload) {
      console.log(`🔄 Mode force: re-téléchargement des images existantes`)
    }

    // Télécharger les images des items
    if (itemIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(itemIconIds, 'items', 3)
    }

    // Télécharger les images des ressources
    if (resourceIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(resourceIconIds, 'resources', 3)
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

  // Vérifier si on a besoin d'extraire les données
  needsDataExtraction() {
    // Si on force le téléchargement, on extrait aussi
    if (this.forceDownload) {
      console.log('🔄 Mode force: extraction des données nécessaire')
      return true
    }

    // En environnement Node.js, toujours extraire (pas de localStorage)
    if (typeof window === 'undefined') {
      console.log('🔄 Environnement Node.js: extraction nécessaire')
      return true
    }

    // Vérifier si on a déjà des données récentes (moins de 24h) - seulement côté client
    try {
      if (typeof localStorage !== 'undefined') {
        const lastExtraction = localStorage.getItem('last_data_extraction')
        if (lastExtraction) {
          const lastTime = parseInt(lastExtraction)
          const now = Date.now()
          const hoursSince = (now - lastTime) / (1000 * 60 * 60)

          if (hoursSince < 24) {
            console.log(`⏭️ Données extraites il y a ${hoursSince.toFixed(1)}h, skip extraction`)
            return false
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Pas d\'accès localStorage, extraction nécessaire')
    }

    console.log('🔄 Extraction des données nécessaire')
    return true
  }

  // Exécuter le script complet (optimisé)
  async run() {
    const startTime = Date.now()

    try {
      // Vérifier si l'extraction de données est nécessaire
      if (this.needsDataExtraction()) {
        await this.extractAllData()

        // Marquer la date d'extraction (seulement côté client)
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('last_data_extraction', Date.now().toString())
          }
        } catch (error) {
          console.log('⚠️ Impossible de sauvegarder dans localStorage')
        }
      } else {
        console.log('⏭️ Skip extraction des données (récentes)')

        // Simuler quelques données pour le téléchargement d'images
        console.log('📸 Mode téléchargement d\'images uniquement')

        // Récupérer les IDs depuis les images existantes si possible
        await this.loadExistingImageIds()
      }

      await this.downloadAllImages()
      await this.saveToDatabase()

      const duration = (Date.now() - startTime) / 1000
      console.log(`\n🎉 EXTRACTION TERMINÉE EN ${duration.toFixed(1)}s`)

    } catch (error) {
      console.error('❌ Erreur fatale:', error)
    }
  }

  // Charger les IDs depuis les images existantes (Node.js seulement)
  async loadExistingImageIds() {
    // Vérifier qu'on est en environnement Node.js
    if (typeof window !== 'undefined') {
      console.log('⚠️ loadExistingImageIds: environnement navigateur, skip')
      return
    }

    try {
      const fs = await import('fs')
      const path = await import('path')

      const itemsDir = path.join(process.cwd(), 'public/images/items')
      const resourcesDir = path.join(process.cwd(), 'public/images/resources')

      let itemIds = []
      let resourceIds = []

      if (fs.existsSync(itemsDir)) {
        itemIds = fs.readdirSync(itemsDir)
          .filter(file => file.endsWith('.png'))
          .map(file => parseInt(file.replace('.png', '')))
          .filter(id => !isNaN(id))
      }

      if (fs.existsSync(resourcesDir)) {
        resourceIds = fs.readdirSync(resourcesDir)
          .filter(file => file.endsWith('.png'))
          .map(file => parseInt(file.replace('.png', '')))
          .filter(id => !isNaN(id))
      }

      console.log(`📂 Images existantes: ${itemIds.length} items, ${resourceIds.length} ressources`)

      // Créer des objets factices pour le téléchargement
      itemIds.forEach(id => {
        this.extractedItems.set(id, { icon_id: id })
      })

      resourceIds.forEach(id => {
        this.extractedResources.set(id, { icon_id: id })
      })

    } catch (error) {
      console.warn('⚠️ Impossible de charger les IDs existants:', error.message)
    }
  }
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new DataExtractor()
  extractor.run()
}

export default DataExtractor
