// Script de test pour vérifier l'extraction sur quelques métiers
import DataExtractor from './extractAndDownload.js'

class TestExtractor extends DataExtractor {
  constructor() {
    super()
    this.testJobs = [
      { id: 16, name: { fr: 'Bijoutier' } },  // Bijoutier pour tester avec Gelano
      { id: 11, name: { fr: 'Forgeron' } }    // Forgeron pour tester quelques armes
    ]
  }

  // Override pour tester seulement quelques métiers
  async fetchAllJobs() {
    console.log('🧪 MODE TEST - Utilisation de métiers prédéfinis')
    return this.testJobs
  }

  // Override pour limiter le nombre de recettes par métier
  async fetchJobRecipes(jobId) {
    console.log(`🔍 TEST - Récupération de 20 recettes max pour métier ${jobId}...`)
    
    try {
      const url = `${this.baseApiUrl}/recipes?jobId=${jobId}&$limit=20`
      const response = await fetch(url)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const data = await response.json()
      const recipes = data.data || []
      
      console.log(`✅ ${recipes.length} recettes récupérées pour test`)
      return recipes
      
    } catch (error) {
      console.error(`❌ Erreur récupération recettes métier ${jobId}:`, error)
      return []
    }
  }

  // Override pour télécharger seulement quelques images
  async downloadAllImages() {
    console.log('\n🖼️ TEST - TÉLÉCHARGEMENT DE QUELQUES IMAGES')
    console.log('============================================')
    
    // Prendre seulement les 10 premières images de chaque type
    const itemIconIds = Array.from(this.extractedItems.values())
      .map(item => item.icon_id)
      .filter(id => id)
      .slice(0, 10)
    
    const resourceIconIds = Array.from(this.extractedResources.values())
      .map(resource => resource.icon_id)
      .filter(id => id)
      .slice(0, 10)
    
    console.log(`📦 ${itemIconIds.length} images d'items à télécharger (test)`)
    console.log(`🧱 ${resourceIconIds.length} images de ressources à télécharger (test)`)
    
    // Télécharger avec des batches plus petits
    if (itemIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(itemIconIds, 'items', 2)
    }
    
    if (resourceIconIds.length > 0) {
      await this.imageDownloader.downloadBatch(resourceIconIds, 'resources', 2)
    }
    
    this.imageDownloader.printSummary()
    this.imageDownloader.calculateTotalSize()
  }

  // Afficher un aperçu des données extraites
  showDataPreview() {
    console.log('\n📋 APERÇU DES DONNÉES EXTRAITES')
    console.log('===============================')
    
    // Afficher quelques items
    console.log('\n📦 ITEMS (5 premiers):')
    const items = Array.from(this.extractedItems.values()).slice(0, 5)
    items.forEach(item => {
      console.log(`  • ${item.name_fr} (ID: ${item.m_id}, Niv: ${item.level}, Métier: ${item.profession})`)
    })
    
    // Afficher quelques ressources
    console.log('\n🧱 RESSOURCES (5 premières):')
    const resources = Array.from(this.extractedResources.values()).slice(0, 5)
    resources.forEach(resource => {
      console.log(`  • ${resource.name_fr} (ID: ${resource.m_id}, Niv: ${resource.level})`)
    })
    
    // Afficher quelques recettes
    console.log('\n🔗 RECETTES (5 premières):')
    this.recipes.slice(0, 5).forEach(recipe => {
      const item = this.extractedItems.get(recipe.item_id)
      const resource = this.extractedResources.get(recipe.resource_id)
      if (item && resource) {
        console.log(`  • ${item.name_fr} nécessite ${recipe.quantity}x ${resource.name_fr}`)
      }
    })
  }

  // Exécuter le test complet
  async runTest() {
    const startTime = Date.now()
    
    console.log('🧪 DÉBUT DU TEST D\'EXTRACTION')
    console.log('==============================')
    
    try {
      await this.extractAllData()
      this.showDataPreview()
      await this.downloadAllImages()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n🎉 TEST TERMINÉ EN ${duration.toFixed(1)}s`)
      
      console.log('\n✅ Si le test fonctionne bien, lance:')
      console.log('   npm run extract-data')
      console.log('   pour l\'extraction complète !')
      
    } catch (error) {
      console.error('❌ Erreur dans le test:', error)
    }
  }
}

// Exécuter le test
const testExtractor = new TestExtractor()
testExtractor.runTest()
