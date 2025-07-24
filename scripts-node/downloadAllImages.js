// Script pour télécharger TOUTES les images nécessaires en local
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class CompleteImageDownloader {
  constructor() {
    this.baseUrl = 'https://api.dofusdb.fr/img/items'
    this.outputDir = path.join(__dirname, '../public/images')
    this.itemsDir = path.join(this.outputDir, 'items')
    this.resourcesDir = path.join(this.outputDir, 'resources')
    
    this.downloadedCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    
    // Statistiques
    this.stats = {
      totalRequested: 0,
      downloaded: 0,
      errors: 0,
      skipped: 0,
      totalSize: 0
    }
  }

  // Créer les dossiers nécessaires
  createDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    if (!fs.existsSync(this.itemsDir)) {
      fs.mkdirSync(this.itemsDir, { recursive: true })
    }
    if (!fs.existsSync(this.resourcesDir)) {
      fs.mkdirSync(this.resourcesDir, { recursive: true })
    }
  }

  // Télécharger une image
  async downloadImage(iconId, type = 'items') {
    const url = `${this.baseUrl}/${iconId}.png`
    const outputDir = type === 'items' ? this.itemsDir : this.resourcesDir
    const filePath = path.join(outputDir, `${iconId}.png`)
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(filePath)) {
      this.stats.skipped++
      return { success: true, skipped: true, path: filePath }
    }

    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        this.stats.errors++
        return { success: false, error: `HTTP ${response.status}` }
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      this.stats.downloaded++
      this.stats.totalSize += buffer.byteLength
      
      return { 
        success: true, 
        path: filePath, 
        size: buffer.byteLength 
      }
    } catch (error) {
      this.stats.errors++
      return { success: false, error: error.message }
    }
  }

  // Télécharger avec délai
  async downloadWithDelay(iconId, type = 'items', delay = 50) {
    const result = await this.downloadImage(iconId, type)
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    return result
  }

  // Récupérer tous les items depuis la base de données locale
  async fetchAllItemsFromDB() {
    try {
      const baseUrl = 'http://localhost:8888/.netlify/functions/database'
      const response = await fetch(`${baseUrl}?action=get_all_items`)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Erreur récupération items depuis BDD:', error)
      console.log('💡 Assurez-vous que:')
      console.log('  1. Le serveur de dev est lancé (npm run dev)')
      console.log('  2. Les données ont été importées (DataImporter)')
      return []
    }
  }

  // Extraire tous les iconIds depuis la base de données
  async extractAllIconIds() {
    console.log('🔍 Extraction des iconIds depuis la base de données...')

    const allIconIds = new Set()
    const items = await this.fetchAllItemsFromDB()

    if (items.length === 0) {
      console.log('❌ Aucun item trouvé dans la base de données')
      console.log('� Lancez d\'abord l\'import des données via DataImporter')
      return []
    }

    console.log(`📋 ${items.length} items trouvés dans la BDD`)

    for (const item of items) {
      // Ajouter l'iconId de l'item principal
      if (item.icon_id) {
        allIconIds.add(String(item.icon_id))
      }

      // Ajouter les iconIds des ingrédients si disponibles
      if (item.recipe && Array.isArray(item.recipe)) {
        item.recipe.forEach(ingredient => {
          if (ingredient.icon_id) {
            allIconIds.add(String(ingredient.icon_id))
          }
        })
      }
    }

    console.log(`✅ ${allIconIds.size} iconIds uniques extraits`)
    return Array.from(allIconIds)
  }

  // Télécharger toutes les images par lots
  async downloadAllImages() {
    console.log('🚀 TÉLÉCHARGEMENT COMPLET DES IMAGES')
    console.log('===================================')
    
    this.createDirectories()
    
    // Extraire tous les iconIds
    const iconIds = await this.extractAllIconIds()
    this.stats.totalRequested = iconIds.length
    
    if (iconIds.length === 0) {
      console.log('❌ Aucun iconId trouvé')
      return
    }
    
    console.log(`📊 ${iconIds.length} images à télécharger`)
    
    // Télécharger par lots de 10
    const batchSize = 10
    const totalBatches = Math.ceil(iconIds.length / batchSize)
    
    for (let i = 0; i < iconIds.length; i += batchSize) {
      const batch = iconIds.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`📦 Lot ${batchNum}/${totalBatches} (${batch.length} images)`)
      
      const promises = batch.map(iconId => 
        this.downloadWithDelay(iconId, 'items', 50)
      )
      
      await Promise.all(promises)
      
      // Afficher le progrès
      const progress = ((i + batchSize) / iconIds.length * 100).toFixed(1)
      console.log(`📈 Progrès: ${progress}% - Téléchargées: ${this.stats.downloaded}, Erreurs: ${this.stats.errors}, Ignorées: ${this.stats.skipped}`)
      
      // Pause entre les lots
      if (i + batchSize < iconIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    this.printFinalStats()
  }

  // Afficher les statistiques finales
  printFinalStats() {
    const totalSizeMB = (this.stats.totalSize / (1024 * 1024)).toFixed(2)
    
    console.log('\n🎉 TÉLÉCHARGEMENT TERMINÉ')
    console.log('========================')
    console.log(`📊 Statistiques:`)
    console.log(`  - Total demandé: ${this.stats.totalRequested}`)
    console.log(`  - Téléchargées: ${this.stats.downloaded}`)
    console.log(`  - Ignorées (déjà présentes): ${this.stats.skipped}`)
    console.log(`  - Erreurs: ${this.stats.errors}`)
    console.log(`  - Taille totale: ${totalSizeMB} MB`)
    
    const successRate = ((this.stats.downloaded / this.stats.totalRequested) * 100).toFixed(1)
    console.log(`  - Taux de réussite: ${successRate}%`)
    
    if (this.stats.errors > 0) {
      console.log(`\n⚠️ ${this.stats.errors} erreurs détectées`)
      console.log('Les images manquantes utiliseront les images par défaut')
    }
    
    console.log('\n✅ Toutes les images sont maintenant disponibles localement!')
    console.log('Vous pouvez maintenant utiliser l\'application sans dépendre de l\'API DofusDB')
  }

  // Vérifier les images existantes
  checkExistingImages() {
    let existingCount = 0
    
    try {
      if (fs.existsSync(this.itemsDir)) {
        const files = fs.readdirSync(this.itemsDir)
        existingCount += files.filter(f => f.endsWith('.png')).length
      }
      
      if (fs.existsSync(this.resourcesDir)) {
        const files = fs.readdirSync(this.resourcesDir)
        existingCount += files.filter(f => f.endsWith('.png')).length
      }
    } catch (error) {
      console.warn('Erreur vérification images existantes:', error.message)
    }
    
    console.log(`📂 ${existingCount} images déjà présentes`)
    return existingCount
  }

  // Exécuter le téléchargement complet
  async run() {
    const startTime = Date.now()
    
    try {
      console.log('🎯 Démarrage du téléchargement complet des images')
      
      this.checkExistingImages()
      await this.downloadAllImages()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n⏱️ Durée totale: ${duration.toFixed(1)} secondes`)
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error)
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const downloader = new CompleteImageDownloader()
  downloader.run()
}

export default CompleteImageDownloader
