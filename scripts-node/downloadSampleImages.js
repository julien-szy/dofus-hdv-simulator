// Script pour télécharger quelques images d'exemple
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class SampleImageDownloader {
  constructor() {
    this.baseUrl = 'https://api.dofusdb.fr/img/items'
    this.outputDir = path.join(__dirname, '../public/images/items')
    this.downloadedCount = 0
    this.errorCount = 0
  }

  // Créer le dossier de sortie
  createDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
      console.log('📁 Dossier créé:', this.outputDir)
    }
  }

  // Télécharger une image
  async downloadImage(iconId) {
    const url = `${this.baseUrl}/${iconId}.png`
    const filePath = path.join(this.outputDir, `${iconId}.png`)
    
    // Vérifier si le fichier existe déjà
    if (fs.existsSync(filePath)) {
      console.log(`⏭️ Ignoré (existe): ${iconId}.png`)
      return { success: true, skipped: true }
    }

    try {
      console.log(`📥 Téléchargement: ${iconId}.png`)
      const response = await fetch(url)
      
      if (!response.ok) {
        console.log(`❌ Erreur HTTP ${response.status}: ${iconId}.png`)
        this.errorCount++
        return { success: false, error: `HTTP ${response.status}` }
      }

      const buffer = await response.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2)
      console.log(`✅ Téléchargé: ${iconId}.png (${sizeMB} MB)`)
      this.downloadedCount++
      
      return { success: true, size: buffer.byteLength }
    } catch (error) {
      console.log(`❌ Erreur: ${iconId}.png - ${error.message}`)
      this.errorCount++
      return { success: false, error: error.message }
    }
  }

  // Télécharger une liste d'images d'exemple
  async downloadSampleImages() {
    console.log('🚀 Téléchargement d\'images d\'exemple')
    console.log('===================================')
    
    this.createDirectory()
    
    // IDs d'exemple (objets craftables courants)
    const sampleIds = [
      '1', '2', '3', '4', '5',           // Premiers objets
      '100', '101', '102', '103', '104', // Objets basiques
      '200', '201', '202', '203', '204', // Objets intermédiaires
      '300', '301', '302', '303', '304', // Objets avancés
      '1000', '1001', '1002', '1003',    // Objets spéciaux
      '2000', '2001', '2002', '2003',    // Ressources
      '3000', '3001', '3002', '3003',    // Équipements
      '4000', '4001', '4002', '4003',    // Consommables
      '5000', '5001', '5002', '5003'     // Autres
    ]
    
    console.log(`📊 ${sampleIds.length} images d'exemple à télécharger`)
    
    for (let i = 0; i < sampleIds.length; i++) {
      const iconId = sampleIds[i]
      await this.downloadImage(iconId)
      
      // Petite pause entre les téléchargements
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Afficher le progrès
      if ((i + 1) % 5 === 0) {
        const progress = ((i + 1) / sampleIds.length * 100).toFixed(1)
        console.log(`📈 Progrès: ${progress}% (${i + 1}/${sampleIds.length})`)
      }
    }
    
    this.printStats()
  }

  // Afficher les statistiques
  printStats() {
    console.log('\n🎉 TÉLÉCHARGEMENT TERMINÉ')
    console.log('========================')
    console.log(`✅ Images téléchargées: ${this.downloadedCount}`)
    console.log(`❌ Erreurs: ${this.errorCount}`)
    
    if (this.downloadedCount > 0) {
      console.log('\n📁 Images disponibles dans:', this.outputDir)
      console.log('🔗 URL d\'accès: /images/items/[ID].png')
    }
    
    if (this.errorCount > 0) {
      console.log('\n⚠️ Certaines images n\'ont pas pu être téléchargées')
      console.log('Les images par défaut seront utilisées à la place')
    }
  }

  // Vérifier les images existantes
  checkExistingImages() {
    try {
      if (fs.existsSync(this.outputDir)) {
        const files = fs.readdirSync(this.outputDir)
        const imageFiles = files.filter(f => f.endsWith('.png'))
        console.log(`📂 ${imageFiles.length} images déjà présentes`)
        return imageFiles.length
      }
    } catch (error) {
      console.warn('Erreur vérification images:', error.message)
    }
    return 0
  }

  // Exécuter le téléchargement
  async run() {
    const startTime = Date.now()
    
    try {
      console.log('🎯 Téléchargement d\'images d\'exemple pour test')
      
      this.checkExistingImages()
      await this.downloadSampleImages()
      
      const duration = (Date.now() - startTime) / 1000
      console.log(`\n⏱️ Durée: ${duration.toFixed(1)} secondes`)
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error)
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const downloader = new SampleImageDownloader()
  downloader.run()
}

export default SampleImageDownloader
