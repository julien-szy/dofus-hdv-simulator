// Version browser-safe du téléchargeur d'images (sans modules Node.js)
class BrowserImageDownloader {
  constructor() {
    this.baseUrl = 'https://api.dofusdb.fr/img/items'
    this.downloadedCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    this.forceDownload = false
  }

  // Créer les dossiers (simulation côté browser)
  createDirectories() {
    console.log('📁 Simulation création dossiers (browser mode)')
    // En mode browser, on ne peut pas créer de dossiers
    // Cette fonction existe pour la compatibilité
  }

  // Télécharger une image (simulation côté browser)
  async downloadImage(iconId, type = 'items') {
    const url = `${this.baseUrl}/${iconId}.png`
    
    try {
      console.log(`📥 Vérification: ${iconId}.png`)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`⚠️ Erreur ${response.status} pour ${iconId}`)
        this.errorCount++
        return { success: false, error: `HTTP ${response.status}` }
      }
      
      const buffer = await response.arrayBuffer()
      
      this.downloadedCount++
      console.log(`✅ ${iconId}.png vérifié (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
      
      return { 
        success: true, 
        path: `/images/${type}/${iconId}.png`, 
        size: buffer.byteLength,
        verified: true
      }
      
    } catch (error) {
      console.error(`❌ Erreur vérification ${iconId}:`, error.message)
      this.errorCount++
      return { success: false, error: error.message }
    }
  }

  // Télécharger avec délai
  async downloadWithDelay(iconId, type = 'items', delay = 100) {
    const result = await this.downloadImage(iconId, type)
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    return result
  }

  // Vérifier quelles images manquent (simulation)
  getMissingImages(iconIds, type = 'items') {
    console.log(`📊 ${type}: simulation vérification ${iconIds.length} images`)
    // En mode browser, on considère que toutes les images sont "manquantes"
    // pour forcer la vérification
    return iconIds
  }

  // Télécharger une liste d'images (vérification seulement)
  async downloadBatch(iconIds, type = 'items', batchSize = 10) {
    console.log(`🔍 Vérification de ${iconIds.length} images (${type}) - Mode Browser`)
    
    const results = []
    
    for (let i = 0; i < iconIds.length; i += batchSize) {
      const batch = iconIds.slice(i, i + batchSize)
      console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(iconIds.length / batchSize)} (${batch.length} images)`)
      
      const batchPromises = batch.map(iconId => 
        this.downloadWithDelay(iconId, type, 100)
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Afficher le progrès
      const verified = results.filter(r => r.success).length
      const errors = results.filter(r => !r.success).length
      console.log(`📈 Progrès: ${verified} vérifiées, ${errors} erreurs`)
      
      // Pause entre les batches
      if (i + batchSize < iconIds.length) {
        const pauseTime = iconIds.length > 100 ? 1000 : 500
        console.log(`⏸️ Pause ${pauseTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, pauseTime))
      }
    }
    
    return results
  }

  // Afficher le résumé
  printSummary() {
    console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION')
    console.log('============================')
    console.log(`✅ Images vérifiées: ${this.downloadedCount}`)
    console.log(`❌ Erreurs: ${this.errorCount}`)
    console.log(`⏭️ Ignorées: ${this.skippedCount}`)
    
    const total = this.downloadedCount + this.errorCount + this.skippedCount
    if (total > 0) {
      const successRate = ((this.downloadedCount / total) * 100).toFixed(1)
      console.log(`📈 Taux de succès: ${successRate}%`)
    }
  }

  // Calculer la taille totale (simulation)
  calculateTotalSize() {
    console.log('💾 Calcul de taille non disponible en mode browser')
    console.log('💡 Les images seront téléchargées via GitHub Actions')
  }

  // Obtenir les statistiques
  getStats() {
    return {
      downloaded: this.downloadedCount,
      errors: this.errorCount,
      skipped: this.skippedCount,
      mode: 'browser_verification'
    }
  }
}

export default BrowserImageDownloader
