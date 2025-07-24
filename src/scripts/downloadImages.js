// Script pour télécharger toutes les images DofusDB en local
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ImageDownloader {
  constructor() {
    this.baseUrl = 'https://api.dofusdb.fr/img/items'
    this.outputDir = path.join(__dirname, '../../public/images')
    this.itemsDir = path.join(this.outputDir, 'items')
    this.resourcesDir = path.join(this.outputDir, 'resources')
    this.downloadedCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    this.forceDownload = process.env.FORCE_DOWNLOAD === 'true'
  }

  // Créer les dossiers nécessaires
  createDirectories() {
    console.log('📁 Création des dossiers...')
    
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    
    if (!fs.existsSync(this.itemsDir)) {
      fs.mkdirSync(this.itemsDir, { recursive: true })
    }
    
    if (!fs.existsSync(this.resourcesDir)) {
      fs.mkdirSync(this.resourcesDir, { recursive: true })
    }
    
    console.log('✅ Dossiers créés')
  }

  // Télécharger une image
  async downloadImage(iconId, type = 'items') {
    const url = `${this.baseUrl}/${iconId}.png`
    const outputDir = type === 'items' ? this.itemsDir : this.resourcesDir
    const filePath = path.join(outputDir, `${iconId}.png`)
    
    // Vérifier si le fichier existe déjà (sauf en mode force)
    if (fs.existsSync(filePath) && !this.forceDownload) {
      this.skippedCount++
      return { success: true, skipped: true, path: filePath }
    }
    
    try {
      console.log(`📥 Téléchargement: ${iconId}.png`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`⚠️ Erreur ${response.status} pour ${iconId}`)
        this.errorCount++
        return { success: false, error: `HTTP ${response.status}` }
      }
      
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      this.downloadedCount++
      console.log(`✅ ${iconId}.png téléchargé (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
      
      return { success: true, path: filePath, size: buffer.byteLength }
      
    } catch (error) {
      console.error(`❌ Erreur téléchargement ${iconId}:`, error.message)
      this.errorCount++
      return { success: false, error: error.message }
    }
  }

  // Télécharger avec délai pour éviter de surcharger l'API
  async downloadWithDelay(iconId, type = 'items', delay = 100) {
    const result = await this.downloadImage(iconId, type)
    
    // Petit délai pour être sympa avec l'API DofusDB
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    return result
  }

  // Télécharger une liste d'images
  async downloadBatch(iconIds, type = 'items', batchSize = 10) {
    console.log(`🚀 Téléchargement de ${iconIds.length} images (${type})`)
    
    const results = []
    
    for (let i = 0; i < iconIds.length; i += batchSize) {
      const batch = iconIds.slice(i, i + batchSize)
      console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(iconIds.length / batchSize)}`)
      
      const batchPromises = batch.map(iconId => 
        this.downloadWithDelay(iconId, type, 50) // 50ms entre chaque téléchargement
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Pause entre les batches
      if (i + batchSize < iconIds.length) {
        console.log('⏸️ Pause 1s entre les batches...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  // Obtenir les statistiques
  getStats() {
    return {
      downloaded: this.downloadedCount,
      errors: this.errorCount,
      skipped: this.skippedCount,
      total: this.downloadedCount + this.errorCount + this.skippedCount
    }
  }

  // Afficher le résumé
  printSummary() {
    const stats = this.getStats()
    console.log('\n📊 RÉSUMÉ DU TÉLÉCHARGEMENT')
    console.log('================================')
    console.log(`✅ Téléchargées: ${stats.downloaded}`)
    console.log(`⏭️ Ignorées (déjà présentes): ${stats.skipped}`)
    console.log(`❌ Erreurs: ${stats.errors}`)
    console.log(`📊 Total traité: ${stats.total}`)
    
    if (stats.errors > 0) {
      console.log(`⚠️ Taux d'erreur: ${((stats.errors / stats.total) * 100).toFixed(1)}%`)
    }
  }

  // Calculer la taille totale du dossier
  calculateTotalSize() {
    const calculateDirSize = (dirPath) => {
      if (!fs.existsSync(dirPath)) return 0
      
      let totalSize = 0
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)
        totalSize += stats.size
      }
      
      return totalSize
    }
    
    const itemsSize = calculateDirSize(this.itemsDir)
    const resourcesSize = calculateDirSize(this.resourcesDir)
    const totalSize = itemsSize + resourcesSize
    
    console.log('\n💾 TAILLE DES IMAGES')
    console.log('====================')
    console.log(`📦 Items: ${(itemsSize / 1024 / 1024).toFixed(1)} MB`)
    console.log(`🧱 Ressources: ${(resourcesSize / 1024 / 1024).toFixed(1)} MB`)
    console.log(`📊 Total: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)
    
    return { itemsSize, resourcesSize, totalSize }
  }
}

export default ImageDownloader
