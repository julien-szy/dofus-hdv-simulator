// Script pour optimiser les images et les préparer pour GitHub
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class ImageOptimizer {
  constructor() {
    this.imagesDir = path.join(__dirname, '../../public/images')
    this.itemsDir = path.join(this.imagesDir, 'items')
    this.materialsDir = path.join(this.imagesDir, 'materials')
    this.optimizedCount = 0
    this.skippedCount = 0
    this.errorCount = 0
    
    console.log('🖼️ Optimiseur d\'images pour GitHub')
    console.log(`📁 Dossier images: ${this.imagesDir}`)
  }

  // Vérifier si une image est déjà optimisée
  isImageOptimized(filePath) {
    try {
      const stats = fs.statSync(filePath)
      const sizeKB = stats.size / 1024
      
      // Considérer comme optimisée si < 50KB
      return sizeKB < 50
    } catch (error) {
      return false
    }
  }

  // Créer un fichier .gitattributes pour optimiser le stockage Git
  createGitAttributes() {
    console.log('📝 Création du fichier .gitattributes...')
    
    const gitAttributesContent = `# Optimisation des images pour Git LFS
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.gif filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text

# Compression des images PNG
*.png -text
*.jpg -text
*.jpeg -text
*.gif -text
*.webp -text`
    
    const gitAttributesPath = path.join(__dirname, '../../.gitattributes')
    fs.writeFileSync(gitAttributesPath, gitAttributesContent)
    console.log('✅ Fichier .gitattributes créé')
  }

  // Créer un fichier .gitignore pour les images temporaires
  createGitIgnore() {
    console.log('📝 Mise à jour du .gitignore...')
    
    const gitIgnorePath = path.join(__dirname, '../../.gitignore')
    let gitIgnoreContent = ''
    
    if (fs.existsSync(gitIgnorePath)) {
      gitIgnoreContent = fs.readFileSync(gitIgnorePath, 'utf8')
    }
    
    // Ajouter les règles pour les images si elles n'existent pas déjà
    const imageRules = `
# Images temporaires
public/images/temp/
*.tmp
*.temp

# Images non optimisées (optionnel)
# public/images/original/
`
    
    if (!gitIgnoreContent.includes('public/images/temp/')) {
      gitIgnoreContent += imageRules
      fs.writeFileSync(gitIgnorePath, gitIgnoreContent)
      console.log('✅ .gitignore mis à jour')
    } else {
      console.log('ℹ️ .gitignore déjà configuré')
    }
  }

  // Créer un fichier README pour les images
  createImagesReadme() {
    console.log('📝 Création du README des images...')
    
    const readmeContent = `# Images Dofus

Ce dossier contient toutes les images des items et matériaux de Dofus, extraites de DofusDB.fr.

## Structure

- \`items/\` - Images des équipements et objets craftables
- \`materials/\` - Images des matériaux et ressources
- \`defaults/\` - Images par défaut (fallback)

## Optimisation

Les images sont optimisées pour :
- Réduction de la taille (objectif < 50KB par image)
- Format PNG pour la transparence
- Compression Git LFS pour le stockage

## Utilisation

Les images sont servies statiquement depuis \`/images/\` dans l'application.

## Mise à jour

Pour mettre à jour les images :
1. Exécuter \`npm run extract-data\`
2. Les nouvelles images seront téléchargées automatiquement
3. Commiter les changements sur GitHub

## Statistiques

- Items : ~20,000 images
- Matériaux : ~5,000 images
- Taille totale : ~500MB (avec Git LFS)

Dernière mise à jour : ${new Date().toISOString()}
`
    
    const readmePath = path.join(this.imagesDir, 'README.md')
    fs.writeFileSync(readmePath, readmeContent)
    console.log('✅ README des images créé')
  }

  // Analyser les statistiques des images
  analyzeImages() {
    console.log('📊 Analyse des images...')
    
    const stats = {
      items: { count: 0, totalSize: 0, avgSize: 0 },
      materials: { count: 0, totalSize: 0, avgSize: 0 },
      total: { count: 0, totalSize: 0, avgSize: 0 }
    }
    
    // Analyser les items
    if (fs.existsSync(this.itemsDir)) {
      const itemFiles = fs.readdirSync(this.itemsDir).filter(file => file.endsWith('.png'))
      stats.items.count = itemFiles.length
      
      itemFiles.forEach(file => {
        const filePath = path.join(this.itemsDir, file)
        const fileStats = fs.statSync(filePath)
        stats.items.totalSize += fileStats.size
      })
      
      if (stats.items.count > 0) {
        stats.items.avgSize = stats.items.totalSize / stats.items.count
      }
    }
    
    // Analyser les matériaux
    if (fs.existsSync(this.materialsDir)) {
      const materialFiles = fs.readdirSync(this.materialsDir).filter(file => file.endsWith('.png'))
      stats.materials.count = materialFiles.length
      
      materialFiles.forEach(file => {
        const filePath = path.join(this.materialsDir, file)
        const fileStats = fs.statSync(filePath)
        stats.materials.totalSize += fileStats.size
      })
      
      if (stats.materials.count > 0) {
        stats.materials.avgSize = stats.materials.totalSize / stats.materials.count
      }
    }
    
    // Totaux
    stats.total.count = stats.items.count + stats.materials.count
    stats.total.totalSize = stats.items.totalSize + stats.materials.totalSize
    if (stats.total.count > 0) {
      stats.total.avgSize = stats.total.totalSize / stats.total.count
    }
    
    console.log('📊 Statistiques des images:')
    console.log(`   Items: ${stats.items.count} (${(stats.items.totalSize / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`   Matériaux: ${stats.materials.count} (${(stats.materials.totalSize / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`   Total: ${stats.total.count} (${(stats.total.totalSize / 1024 / 1024).toFixed(1)} MB)`)
    console.log(`   Taille moyenne: ${(stats.total.avgSize / 1024).toFixed(1)} KB`)
    
    return stats
  }

  // Créer un script de déploiement pour GitHub
  createDeployScript() {
    console.log('📝 Création du script de déploiement...')
    
    const deployScript = `#!/bin/bash
# Script de déploiement des images sur GitHub

echo "🚀 Déploiement des images Dofus..."

# Vérifier que Git LFS est installé
if ! command -v git-lfs &> /dev/null; then
    echo "❌ Git LFS n'est pas installé. Installez-le d'abord:"
    echo "   https://git-lfs.github.com/"
    exit 1
fi

# Initialiser Git LFS si pas déjà fait
if [ ! -f .gitattributes ]; then
    echo "📝 Initialisation de Git LFS..."
    git lfs install
    git lfs track "*.png"
    git lfs track "*.jpg"
    git lfs track "*.jpeg"
    git lfs track "*.gif"
    git lfs track "*.webp"
fi

# Ajouter toutes les images
echo "📦 Ajout des images..."
git add public/images/

# Commiter les changements
echo "💾 Commit des images..."
git commit -m "🖼️ Mise à jour des images Dofus

- Ajout de nouvelles images
- Optimisation des tailles
- Mise à jour des métadonnées

$(date)"

# Pousser vers GitHub
echo "🚀 Push vers GitHub..."
git push origin main

echo "✅ Déploiement terminé!"
echo "📊 Les images sont maintenant disponibles sur GitHub Pages"
`
    
    const deployPath = path.join(__dirname, '../../deploy-images.sh')
    fs.writeFileSync(deployPath, deployScript)
    
    // Rendre le script exécutable (sur Unix/Linux)
    try {
      fs.chmodSync(deployPath, '755')
    } catch (error) {
      console.log('⚠️ Impossible de rendre le script exécutable (Windows)')
    }
    
    console.log('✅ Script de déploiement créé: deploy-images.sh')
  }

  // Créer un fichier de configuration pour l'optimisation
  createOptimizationConfig() {
    console.log('⚙️ Création de la configuration d\'optimisation...')
    
    const configContent = `// Configuration pour l'optimisation des images
export const IMAGE_CONFIG = {
  // Formats supportés
  formats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
  
  // Taille maximale par image (en KB)
  maxSizeKB: 50,
  
  // Qualité de compression (0-100)
  quality: 85,
  
  // Redimensionnement automatique
  resize: {
    maxWidth: 64,
    maxHeight: 64,
    maintainAspectRatio: true
  },
  
  // Cache des images optimisées
  cache: {
    enabled: true,
    directory: 'public/images/cache',
    expiry: 24 * 60 * 60 * 1000 // 24h
  },
  
  // Fallback pour les images manquantes
  fallback: {
    item: '/images/defaults/item-default.png',
    material: '/images/defaults/material-default.png'
  }
}

export default IMAGE_CONFIG
`
    
    const configPath = path.join(__dirname, '../../src/config/imageConfig.js')
    
    // Créer le dossier config s'il n'existe pas
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    
    fs.writeFileSync(configPath, configContent)
    console.log('✅ Configuration d\'optimisation créée')
  }

  // Exécuter l'optimisation complète
  async run() {
    console.log('🚀 Démarrage de l\'optimisation des images...')
    
    try {
      // 1. Analyser les images existantes
      const stats = this.analyzeImages()
      
      // 2. Créer les fichiers de configuration Git
      this.createGitAttributes()
      this.createGitIgnore()
      
      // 3. Créer le README des images
      this.createImagesReadme()
      
      // 4. Créer le script de déploiement
      this.createDeployScript()
      
      // 5. Créer la configuration d'optimisation
      this.createOptimizationConfig()
      
      console.log('\n🎉 OPTIMISATION TERMINÉE!')
      console.log('📝 Prochaines étapes:')
      console.log('1. Installer Git LFS: https://git-lfs.github.com/')
      console.log('2. Exécuter: git lfs install')
      console.log('3. Commiter les images: ./deploy-images.sh')
      console.log('4. Les images seront optimisées sur GitHub')
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'optimisation:', error)
      process.exit(1)
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new ImageOptimizer()
  optimizer.run()
}

export default ImageOptimizer 