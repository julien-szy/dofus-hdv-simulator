// Script pour créer des images par défaut statiques
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DefaultImageCreator {
  constructor() {
    this.outputDir = path.join(__dirname, '../public/images')
    this.defaultsDir = path.join(this.outputDir, 'defaults')
  }

  // Créer les dossiers nécessaires
  createDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
    if (!fs.existsSync(this.defaultsDir)) {
      fs.mkdirSync(this.defaultsDir, { recursive: true })
    }
  }

  // Créer un SVG par défaut pour les items
  createDefaultItemSVG() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="itemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#itemGradient)" stroke="#6c757d" stroke-width="2" rx="8"/>
  <circle cx="32" cy="28" r="8" fill="#495057"/>
  <rect x="24" y="36" width="16" height="12" fill="#495057" rx="2"/>
  <text x="32" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#6c757d">ITEM</text>
</svg>`
  }

  // Créer un SVG par défaut pour les ressources
  createDefaultResourceSVG() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="resourceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8f5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c8e6c9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#resourceGradient)" stroke="#4caf50" stroke-width="2" rx="8"/>
  <polygon points="32,16 40,28 24,28" fill="#2e7d32"/>
  <rect x="28" y="28" width="8" height="16" fill="#2e7d32"/>
  <ellipse cx="32" cy="46" rx="6" ry="3" fill="#2e7d32"/>
  <text x="32" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#2e7d32">RESOURCE</text>
</svg>`
  }

  // Créer un SVG par défaut pour les équipements
  createDefaultEquipmentSVG() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="equipmentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fff3e0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffe0b2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#equipmentGradient)" stroke="#ff9800" stroke-width="2" rx="8"/>
  <rect x="30" y="16" width="4" height="20" fill="#e65100"/>
  <ellipse cx="32" cy="20" rx="8" ry="4" fill="#e65100"/>
  <polygon points="24,36 40,36 36,44 28,44" fill="#e65100"/>
  <text x="32" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#e65100">EQUIPMENT</text>
</svg>`
  }

  // Créer un SVG de chargement
  createLoadingSVG() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f1f3f4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#dadce0;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#loadingGradient)" stroke="#9aa0a6" stroke-width="2" rx="8"/>
  <circle cx="32" cy="32" r="12" fill="none" stroke="#9aa0a6" stroke-width="3" stroke-linecap="round">
    <animate attributeName="stroke-dasharray" values="0 75;25 50;0 75" dur="1.5s" repeatCount="indefinite"/>
    <animate attributeName="stroke-dashoffset" values="0;-25;-50" dur="1.5s" repeatCount="indefinite"/>
  </circle>
  <text x="32" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#9aa0a6">LOADING</text>
</svg>`
  }

  // Créer un SVG d'erreur
  createErrorSVG() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffebee;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ffcdd2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" fill="url(#errorGradient)" stroke="#f44336" stroke-width="2" rx="8"/>
  <circle cx="32" cy="32" r="12" fill="none" stroke="#d32f2f" stroke-width="3"/>
  <line x1="26" y1="26" x2="38" y2="38" stroke="#d32f2f" stroke-width="3" stroke-linecap="round"/>
  <line x1="38" y1="26" x2="26" y2="38" stroke="#d32f2f" stroke-width="3" stroke-linecap="round"/>
  <text x="32" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="#d32f2f">ERROR</text>
</svg>`
  }

  // Sauvegarder un SVG en fichier
  saveSVG(filename, svgContent) {
    const filePath = path.join(this.defaultsDir, filename)
    fs.writeFileSync(filePath, svgContent, 'utf8')
    console.log(`✅ Créé: ${filename}`)
  }

  // Créer toutes les images par défaut
  async createAllDefaults() {
    console.log('🎨 Création des images par défaut...')
    
    this.createDirectories()

    // Créer les SVG
    this.saveSVG('default-item.svg', this.createDefaultItemSVG())
    this.saveSVG('default-resource.svg', this.createDefaultResourceSVG())
    this.saveSVG('default-equipment.svg', this.createDefaultEquipmentSVG())
    this.saveSVG('loading.svg', this.createLoadingSVG())
    this.saveSVG('error.svg', this.createErrorSVG())

    // Créer aussi des versions PNG si possible (nécessite une lib comme sharp)
    try {
      await this.createPNGVersions()
    } catch (error) {
      console.log('ℹ️ Versions PNG non créées (sharp non disponible)')
    }

    console.log('🎉 Images par défaut créées avec succès!')
  }

  // Créer des versions PNG (optionnel, nécessite sharp)
  async createPNGVersions() {
    try {
      const sharp = await import('sharp')
      
      const svgFiles = [
        'default-item.svg',
        'default-resource.svg', 
        'default-equipment.svg',
        'loading.svg',
        'error.svg'
      ]

      for (const svgFile of svgFiles) {
        const svgPath = path.join(this.defaultsDir, svgFile)
        const pngPath = path.join(this.defaultsDir, svgFile.replace('.svg', '.png'))
        
        await sharp.default(svgPath)
          .png()
          .resize(64, 64)
          .toFile(pngPath)
        
        console.log(`✅ PNG créé: ${svgFile.replace('.svg', '.png')}`)
      }
    } catch (error) {
      // Sharp n'est pas installé, ce n'est pas grave
      throw error
    }
  }

  // Créer un fichier de configuration pour les images par défaut
  createConfig() {
    const config = {
      defaultImages: {
        item: '/images/defaults/default-item.svg',
        resource: '/images/defaults/default-resource.svg',
        equipment: '/images/defaults/default-equipment.svg',
        loading: '/images/defaults/loading.svg',
        error: '/images/defaults/error.svg'
      },
      fallbackStrategy: 'immediate', // ou 'lazy'
      timeout: 3000,
      retryAttempts: 1
    }

    const configPath = path.join(this.outputDir, 'image-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('✅ Configuration créée: image-config.json')
  }

  // Exécuter la création complète
  async run() {
    try {
      await this.createAllDefaults()
      this.createConfig()
      
      console.log('\n🎯 RÉSUMÉ:')
      console.log('- Images par défaut créées dans /public/images/defaults/')
      console.log('- Configuration sauvée dans /public/images/image-config.json')
      console.log('- Prêt à utiliser avec le service d\'images optimisé!')
      
    } catch (error) {
      console.error('❌ Erreur:', error.message)
    }
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  const creator = new DefaultImageCreator()
  creator.run()
}

export default DefaultImageCreator
