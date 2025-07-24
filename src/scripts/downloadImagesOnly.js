// Script optimisé pour télécharger SEULEMENT les images manquantes
import ImageDownloader from './downloadImages.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ImageOnlyDownloader {
  constructor() {
    this.imageDownloader = new ImageDownloader()
    this.imagesDir = path.join(__dirname, '../../public/images')
    this.itemsDir = path.join(this.imagesDir, 'items')
    this.resourcesDir = path.join(this.imagesDir, 'resources')
  }

  // Analyser les images existantes pour déterminer les IDs
  getExistingImageIds() {
    const itemIds = []
    const resourceIds = []

    try {
      if (fs.existsSync(this.itemsDir)) {
        const itemFiles = fs.readdirSync(this.itemsDir)
        itemFiles.forEach(file => {
          if (file.endsWith('.png')) {
            const id = parseInt(file.replace('.png', ''))
            if (!isNaN(id)) itemIds.push(id)
          }
        })
      }

      if (fs.existsSync(this.resourcesDir)) {
        const resourceFiles = fs.readdirSync(this.resourcesDir)
        resourceFiles.forEach(file => {
          if (file.endsWith('.png')) {
            const id = parseInt(file.replace('.png', ''))
            if (!isNaN(id)) resourceIds.push(id)
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture dossiers images:', error.message)
    }

    return { itemIds, resourceIds }
  }

  // Récupérer une liste d'IDs depuis DofusDB (échantillon)
  async getSampleImageIds() {
    console.log('🔍 Récupération d\'un échantillon d\'IDs depuis DofusDB...')
    
    try {
      // Récupérer quelques métiers pour avoir des IDs
      const jobsResponse = await fetch('https://api.dofusdb.fr/jobs?$limit=5')
      if (!jobsResponse.ok) throw new Error(`HTTP ${jobsResponse.status}`)
      
      const jobsData = await jobsResponse.json()
      const jobs = jobsData.data || []
      
      const allItemIds = new Set()
      const allResourceIds = new Set()
      
      for (const job of jobs) {
        try {
          console.log(`📦 Récupération échantillon métier: ${job.name?.fr || job.id}`)
          
          const recipesResponse = await fetch(`https://api.dofusdb.fr/recipes?jobId=${job.id}&$limit=50`)
          if (!recipesResponse.ok) continue
          
          const recipesData = await recipesResponse.json()
          const recipes = recipesData.data || []
          
          recipes.forEach(recipe => {
            // Ajouter l'item résultat
            if (recipe.result?.iconId) {
              allItemIds.add(recipe.result.iconId)
            }
            
            // Ajouter les ingrédients
            if (recipe.ingredients) {
              recipe.ingredients.forEach(ingredient => {
                if (ingredient.iconId) {
                  allResourceIds.add(ingredient.iconId)
                }
              })
            }
          })
          
          // Pause entre les métiers
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.warn(`⚠️ Erreur métier ${job.id}:`, error.message)
        }
      }
      
      console.log(`📊 Échantillon récupéré: ${allItemIds.size} items, ${allResourceIds.size} ressources`)
      
      return {
        itemIds: Array.from(allItemIds),
        resourceIds: Array.from(allResourceIds)
      }
      
    } catch (error) {
      console.error('❌ Erreur récupération échantillon:', error)
      return { itemIds: [], resourceIds: [] }
    }
  }

  // Télécharger seulement les images manquantes
  async downloadMissingImages() {
    console.log('🚀 TÉLÉCHARGEMENT OPTIMISÉ DES IMAGES')
    console.log('====================================')
    
    // Créer les dossiers
    this.imageDownloader.createDirectories()
    
    // Analyser les images existantes
    const existing = this.getExistingImageIds()
    console.log(`📂 Images existantes: ${existing.itemIds.length} items, ${existing.resourceIds.length} ressources`)
    
    // Si on a déjà beaucoup d'images et pas en mode force, skip
    const totalExisting = existing.itemIds.length + existing.resourceIds.length
    const forceDownload = (typeof process !== 'undefined' && process.env?.FORCE_DOWNLOAD === 'true') || false
    
    if (totalExisting > 100 && !forceDownload) {
      console.log('✅ Beaucoup d\'images déjà présentes, skip téléchargement')
      console.log('💡 Utilisez FORCE_DOWNLOAD=true pour forcer le re-téléchargement')
      return
    }
    
    // Récupérer des IDs depuis DofusDB
    const sample = await this.getSampleImageIds()
    
    // Combiner avec les IDs existants pour avoir une liste complète
    const allItemIds = [...new Set([...existing.itemIds, ...sample.itemIds])]
    const allResourceIds = [...new Set([...existing.resourceIds, ...sample.resourceIds])]
    
    console.log(`📊 Total à vérifier: ${allItemIds.length} items, ${allResourceIds.length} ressources`)
    
    // Télécharger les images manquantes
    if (allItemIds.length > 0) {
      console.log('\n📦 Téléchargement images items...')
      await this.imageDownloader.downloadBatch(allItemIds, 'items', 5)
    }
    
    if (allResourceIds.length > 0) {
      console.log('\n🧱 Téléchargement images ressources...')
      await this.imageDownloader.downloadBatch(allResourceIds, 'resources', 5)
    }
    
    // Afficher le résumé
    this.imageDownloader.printSummary()
    this.imageDownloader.calculateTotalSize()
  }

  // Exécuter le téléchargement
  async run() {
    const startTime = Date.now()
    
    try {
      await this.downloadMissingImages()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n🎉 TÉLÉCHARGEMENT TERMINÉ EN ${duration.toFixed(1)}s`)
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error)
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const downloader = new ImageOnlyDownloader()
  downloader.run()
}

export default ImageOnlyDownloader
