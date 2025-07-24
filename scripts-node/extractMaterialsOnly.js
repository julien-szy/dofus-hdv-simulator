// Script pour extraire SEULEMENT les images des matériaux de DofusDB.fr
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class MaterialsExtractor {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.imagesDir = path.join(__dirname, '../public/images')
    this.downloadedCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    
    console.log('🔧 Extracteur d\'images des matériaux')
    console.log(`📁 Images: ${this.imagesDir}`)
  }

  // Créer les dossiers
  createDirectories() {
    console.log('📁 Création des dossiers...')
    
    const dirs = [
      path.join(this.imagesDir, 'materials'),
      path.join(this.imagesDir, 'defaults')
    ]
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`✅ Créé: ${dir}`)
      }
    })
  }

  // Délai simple
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Récupérer TOUTES les recettes pour avoir les matériaux
  async fetchAllRecipes() {
    console.log('🔍 Récupération de toutes les recettes pour les matériaux...')
    
    const allRecipes = []
    let skip = 0
    const limit = 100
    
    while (true) {
      try {
        const url = `${this.baseApiUrl}/recipes?$limit=${limit}&$skip=${skip}`
        console.log(`📦 Récupération recettes ${skip + 1}-${skip + limit}...`)
        
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        
        const data = await response.json()
        const recipes = data.data || []
        
        if (recipes.length === 0) break
        
        allRecipes.push(...recipes)
        skip += limit
        
        console.log(`✅ ${allRecipes.length} recettes récupérées...`)
        
        await this.sleep(100)
        
      } catch (error) {
        console.error(`❌ Erreur récupération recettes:`, error)
        break
      }
    }
    
    console.log(`🎉 ${allRecipes.length} recettes récupérées au total`)
    return allRecipes
  }



  // Télécharger une image de matériau
  async downloadMaterialImage(iconId) {
    const url = `${this.baseApiUrl}/img/items/${iconId}.png`
    const filePath = path.join(this.imagesDir, 'materials', `${iconId}.png`)
    
    if (fs.existsSync(filePath)) {
      this.skippedCount++
      return { success: true, skipped: true }
    }
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`⚠️ Erreur ${response.status} pour ${iconId}`)
        this.errorCount++
        return { success: false, error: `HTTP ${response.status}` }
      }
      
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(filePath, Buffer.from(buffer))
      
      this.downloadedCount++
      console.log(`✅ ${iconId}.png (${(buffer.byteLength / 1024).toFixed(1)} KB)`)
      
      return { success: true, size: buffer.byteLength }
      
    } catch (error) {
      console.error(`❌ Erreur ${iconId}:`, error.message)
      this.errorCount++
      return { success: false, error: error.message }
    }
  }

  // Identifier et télécharger les images des matériaux (seulement ceux utilisés dans les recettes)
  async downloadMaterialImages(recipes) {
    console.log('🖼️ Identification et téléchargement des images de matériaux (utilisés dans les recettes)...')
    
    const materialIds = new Set()
    const materialImages = new Map()
    
    // Collecter SEULEMENT les IDs de matériaux depuis les recettes (ingrédients)
    recipes.forEach(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients.forEach(ingredient => {
          if (ingredient.img && !materialIds.has(ingredient.id)) {
            materialIds.add(ingredient.id)
            const iconId = ingredient.img.split('/').pop().replace('.png', '')
            materialImages.set(ingredient.id, {
              id: ingredient.id,
              name: ingredient.name?.fr || ingredient.name?.en || 'Matériau inconnu',
              iconId: iconId,
              img: ingredient.img
            })
          }
        })
      }
    })
    
    console.log(`📊 ${materialImages.size} matériaux utilisés dans les recettes identifiés`)
    
    // Télécharger par batch de 5
    const materialArray = Array.from(materialImages.values())
    const batchSize = 5
    
    for (let i = 0; i < materialArray.length; i += batchSize) {
      const batch = materialArray.slice(i, i + batchSize)
      
      console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(materialArray.length/batchSize)}`)
      
      const promises = batch.map(material => this.downloadMaterialImage(material.iconId))
      await Promise.all(promises)
      
      await this.sleep(200) // Délai entre batches
    }
    
    console.log(`🎉 Téléchargement terminé: ${this.downloadedCount} téléchargées, ${this.skippedCount} ignorées, ${this.errorCount} erreurs`)
    
    return materialImages
  }

  // Créer un fichier de mapping des matériaux
  async createMaterialMapping(materialImages) {
    console.log('📝 Création du mapping des matériaux...')
    
    const materialMapping = {
      materials: {},
      metadata: {
        totalMaterials: materialImages.size,
        extractedAt: new Date().toISOString()
      }
    }
    
    // Mapping des matériaux
    materialImages.forEach((material, id) => {
      materialMapping.materials[id] = {
        id: material.id,
        name: material.name,
        iconId: material.iconId,
        imagePath: `/images/materials/${material.iconId}.png`
      }
    })
    
    // Sauvegarder le mapping
    const mappingFile = path.join(this.imagesDir, 'materials-mapping.json')
    fs.writeFileSync(mappingFile, JSON.stringify(materialMapping, null, 2))
    console.log(`✅ Mapping des matériaux sauvegardé: ${mappingFile}`)
    
    return materialMapping
  }

  // Créer un service pour les matériaux
  async createMaterialService() {
    console.log('🔧 Création du service de matériaux...')
    
    const serviceCode = `// Service d'images de matériaux pour Dofus
export class MaterialService {
  static getMaterialImage(materialId, iconId) {
    return \`/images/materials/\${iconId}.png\`
  }
  
  static getMaterialImageUrl(imagePath) {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) {
      // Convertir URL externe en URL locale
      const iconId = imagePath.split('/').pop()
      return \`/images/materials/\${iconId}\`
    }
    return imagePath
  }
  
  static isMaterial(item) {
    // Considérer comme matériau si pas d'équipement
    return !item.level || item.level === 0 || item.type?.includes('Ressource')
  }
}

export default MaterialService
`
    
    const serviceFile = path.join(__dirname, '../src/services/materialService.js')
    fs.writeFileSync(serviceFile, serviceCode)
    console.log(`✅ Service de matériaux créé: ${serviceFile}`)
  }

  // Créer un fichier .gitattributes pour Git LFS
  async createGitAttributes() {
    console.log('📝 Création du fichier .gitattributes...')
    
    const gitAttributesContent = `# Optimisation des images pour Git LFS
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.gif filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text`
    
    const gitAttributesPath = path.join(__dirname, '../.gitattributes')
    fs.writeFileSync(gitAttributesPath, gitAttributesContent)
    console.log('✅ Fichier .gitattributes créé')
  }

  // Afficher les stats
  printStats(materialImages) {
    console.log('\n📊 STATISTIQUES DES MATÉRIAUX')
    console.log('='.repeat(50))
    console.log(`🖼️ Images téléchargées: ${this.downloadedCount}`)
    console.log(`⏭️ Images ignorées: ${this.skippedCount}`)
    console.log(`❌ Erreurs: ${this.errorCount}`)
    console.log(`🔧 Matériaux identifiés: ${materialImages.size}`)
    console.log(`📁 Dossier: ${this.imagesDir}/materials`)
    console.log('='.repeat(50))
    
    // Afficher quelques exemples de matériaux
    console.log('\n📋 Exemples de matériaux:')
    let count = 0
    materialImages.forEach((material, id) => {
      if (count < 10) {
        console.log(`   - ${material.name} (ID: ${id})`)
        count++
      }
    })
    if (materialImages.size > 10) {
      console.log(`   ... et ${materialImages.size - 10} autres`)
    }
  }

  // Exécuter l'extraction de matériaux
  async run() {
    console.log('🚀 Démarrage de l\'extraction des matériaux...')
    
    try {
      // 1. Créer les dossiers
      this.createDirectories()
      
      // 2. Récupérer les recettes pour identifier les matériaux
      const recipes = await this.fetchAllRecipes()
      
      // 3. Identifier et télécharger les images de matériaux
      const materialImages = await this.downloadMaterialImages(recipes)
      
      // 4. Créer le mapping des matériaux
      const materialMapping = await this.createMaterialMapping(materialImages)
      
      // 5. Créer le service de matériaux
      await this.createMaterialService()
      
      // 6. Créer .gitattributes
      await this.createGitAttributes()
      
      // 7. Afficher les stats
      this.printStats(materialImages)
      
      console.log('\n🎉 EXTRACTION DES MATÉRIAUX TERMINÉE!')
      console.log('📝 Prochaines étapes:')
      console.log('1. Installer Git LFS: https://git-lfs.github.com/')
      console.log('2. git lfs install')
      console.log('3. git add public/images/materials/')
      console.log('4. git commit -m "🔧 Ajout des images de matériaux Dofus"')
      console.log('5. git push')
      console.log('6. Utiliser MaterialService dans votre app')
      
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  }
}

// Exécuter
const extractor = new MaterialsExtractor()
extractor.run() 