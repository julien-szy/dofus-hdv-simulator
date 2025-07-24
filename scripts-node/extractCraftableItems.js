// Script pour extraire SEULEMENT les images des items qui ont des recettes (craftables)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class CraftableItemsExtractor {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.imagesDir = path.join(__dirname, '../public/images')
    this.downloadedCount = 0
    this.errorCount = 0
    this.skippedCount = 0
    
    console.log('🔧 Extracteur d\'images des items craftables')
    console.log(`📁 Images: ${this.imagesDir}`)
  }

  // Créer les dossiers
  createDirectories() {
    console.log('📁 Création des dossiers...')
    
    const dirs = [
      path.join(this.imagesDir, 'craftable-items'),
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

  // Récupérer TOUTES les recettes
  async fetchAllRecipes() {
    console.log('🔍 Récupération de toutes les recettes...')
    
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

  // Identifier les items craftables (qui ont des recettes)
  identifyCraftableItems(recipes) {
    console.log('🔍 Identification des items craftables...')
    
    const craftableItems = new Map()
    
    recipes.forEach(recipe => {
      if (recipe.result && recipe.result.id && recipe.result.img) {
        const iconId = recipe.result.img.split('/').pop().replace('.png', '')
        craftableItems.set(recipe.result.id, {
          id: recipe.result.id,
          name: recipe.result.name?.fr || recipe.result.name?.en || 'Item craftable inconnu',
          iconId: iconId,
          img: recipe.result.img,
          level: recipe.result.level,
          type: recipe.result.type
        })
      }
    })
    
    console.log(`📊 ${craftableItems.size} items craftables identifiés`)
    return craftableItems
  }

  // Télécharger une image d'item craftable
  async downloadCraftableItemImage(iconId) {
    const url = `${this.baseApiUrl}/img/items/${iconId}.png`
    const filePath = path.join(this.imagesDir, 'craftable-items', `${iconId}.png`)
    
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

  // Télécharger les images des items craftables
  async downloadCraftableItemImages(craftableItems) {
    console.log('🖼️ Téléchargement des images d\'items craftables...')
    
    // Télécharger par batch de 5
    const itemArray = Array.from(craftableItems.values())
    const batchSize = 5
    
    for (let i = 0; i < itemArray.length; i += batchSize) {
      const batch = itemArray.slice(i, i + batchSize)
      
      console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(itemArray.length/batchSize)}`)
      
      const promises = batch.map(item => this.downloadCraftableItemImage(item.iconId))
      await Promise.all(promises)
      
      await this.sleep(200) // Délai entre batches
    }
    
    console.log(`🎉 Téléchargement terminé: ${this.downloadedCount} téléchargées, ${this.skippedCount} ignorées, ${this.errorCount} erreurs`)
    
    return craftableItems
  }

  // Créer un fichier de mapping des items craftables
  async createCraftableItemMapping(craftableItems) {
    console.log('📝 Création du mapping des items craftables...')
    
    const craftableItemMapping = {
      craftableItems: {},
      metadata: {
        totalCraftableItems: craftableItems.size,
        extractedAt: new Date().toISOString()
      }
    }
    
    // Mapping des items craftables
    craftableItems.forEach((item, id) => {
      craftableItemMapping.craftableItems[id] = {
        id: item.id,
        name: item.name,
        iconId: item.iconId,
        level: item.level,
        type: item.type,
        imagePath: `/images/craftable-items/${item.iconId}.png`
      }
    })
    
    // Sauvegarder le mapping
    const mappingFile = path.join(this.imagesDir, 'craftable-items-mapping.json')
    fs.writeFileSync(mappingFile, JSON.stringify(craftableItemMapping, null, 2))
    console.log(`✅ Mapping des items craftables sauvegardé: ${mappingFile}`)
    
    return craftableItemMapping
  }

  // Créer un service pour les items craftables
  async createCraftableItemService() {
    console.log('🔧 Création du service d\'items craftables...')
    
    const serviceCode = `// Service d'images d'items craftables pour Dofus
export class CraftableItemService {
  static getCraftableItemImage(itemId, iconId) {
    return \`/images/craftable-items/\${iconId}.png\`
  }
  
  static getCraftableItemImageUrl(imagePath) {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) {
      // Convertir URL externe en URL locale
      const iconId = imagePath.split('/').pop()
      return \`/images/craftable-items/\${iconId}\`
    }
    return imagePath
  }
  
  static isCraftableItem(item) {
    // Un item est craftable s'il a une recette
    return item.hasRecipe || item.craftable
  }
}

export default CraftableItemService
`
    
    const serviceFile = path.join(__dirname, '../src/services/craftableItemService.js')
    fs.writeFileSync(serviceFile, serviceCode)
    console.log(`✅ Service d'items craftables créé: ${serviceFile}`)
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
  printStats(craftableItems) {
    console.log('\n📊 STATISTIQUES DES ITEMS CRAFTABLES')
    console.log('='.repeat(50))
    console.log(`🖼️ Images téléchargées: ${this.downloadedCount}`)
    console.log(`⏭️ Images ignorées: ${this.skippedCount}`)
    console.log(`❌ Erreurs: ${this.errorCount}`)
    console.log(`🔧 Items craftables identifiés: ${craftableItems.size}`)
    console.log(`📁 Dossier: ${this.imagesDir}/craftable-items`)
    console.log('='.repeat(50))
    
    // Afficher quelques exemples d'items craftables
    console.log('\n📋 Exemples d\'items craftables:')
    let count = 0
    craftableItems.forEach((item, id) => {
      if (count < 10) {
        console.log(`   - ${item.name} (Niveau: ${item.level || 'N/A'})`)
        count++
      }
    })
    if (craftableItems.size > 10) {
      console.log(`   ... et ${craftableItems.size - 10} autres`)
    }
  }

  // Exécuter l'extraction d'items craftables
  async run() {
    console.log('🚀 Démarrage de l\'extraction des items craftables...')
    
    try {
      // 1. Créer les dossiers
      this.createDirectories()
      
      // 2. Récupérer toutes les recettes
      const recipes = await this.fetchAllRecipes()
      
      // 3. Identifier les items craftables
      const craftableItems = this.identifyCraftableItems(recipes)
      
      // 4. Télécharger les images des items craftables
      await this.downloadCraftableItemImages(craftableItems)
      
      // 5. Créer le mapping des items craftables
      const craftableItemMapping = await this.createCraftableItemMapping(craftableItems)
      
      // 6. Créer le service d'items craftables
      await this.createCraftableItemService()
      
      // 7. Créer .gitattributes
      await this.createGitAttributes()
      
      // 8. Afficher les stats
      this.printStats(craftableItems)
      
      console.log('\n🎉 EXTRACTION DES ITEMS CRAFTABLES TERMINÉE!')
      console.log('📝 Prochaines étapes:')
      console.log('1. Installer Git LFS: https://git-lfs.github.com/')
      console.log('2. git lfs install')
      console.log('3. git add public/images/craftable-items/')
      console.log('4. git commit -m "🔧 Ajout des images d\'items craftables Dofus"')
      console.log('5. git push')
      console.log('6. Utiliser CraftableItemService dans votre app')
      
    } catch (error) {
      console.error('❌ Erreur:', error)
      process.exit(1)
    }
  }
}

// Exécuter
const extractor = new CraftableItemsExtractor()
extractor.run() 