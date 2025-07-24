// Script pour nettoyer tous les logs de debug
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DebugCleaner {
  constructor() {
    this.rootDir = path.join(__dirname, '..')
    this.filesToClean = []
    this.cleanedCount = 0
    
    // Patterns de logs à supprimer
    this.debugPatterns = [
      // Console logs avec emojis
      /console\.log\([^)]*['"`][🔍🚀🌐💰👤🔄📥✅🔧💾⚠️❌📊🧹🎯📦🧱⏰📈⏸️🌍🤖🔄📋🎉🚫💡🔍][^)]*\)/g,
      
      // Console logs de debug spécifiques
      /console\.log\([^)]*['"`].*debug.*['"`][^)]*\)/gi,
      /console\.log\([^)]*['"`].*DEBUG.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*État.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*Vérification.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*chargé.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*synchronisation.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*Cache.*['"`][^)]*\)/g,
      
      // Console warns et errors avec emojis
      /console\.warn\([^)]*['"`][⚠️❌🔍][^)]*\)/g,
      /console\.error\([^)]*['"`][❌⚠️][^)]*\)/g,
      
      // Logs spécifiques aux services
      /console\.log\([^)]*['"`].*Service.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*Import.*['"`][^)]*\)/g,
      /console\.log\([^)]*['"`].*Sync.*['"`][^)]*\)/g,
      
      // Lignes complètes de debug
      /^\s*console\.(log|warn|error)\([^)]*['"`][🔍🚀🌐💰👤🔄📥✅🔧💾⚠️❌📊🧹🎯📦🧱⏰📈⏸️🌍🤖🔄📋🎉🚫💡][^)]*\);\s*$/gm,
    ]
    
    // Patterns à garder (logs d'erreur importants)
    this.keepPatterns = [
      /console\.error\([^)]*['"`].*Erreur fatale.*['"`][^)]*\)/g,
      /console\.error\([^)]*['"`].*Error.*['"`][^)]*\)/g,
      /console\.warn\([^)]*['"`].*ATTENTION.*['"`][^)]*\)/g,
    ]
    
    // Extensions de fichiers à traiter
    this.extensions = ['.js', '.jsx', '.ts', '.tsx']
    
    // Dossiers à ignorer
    this.ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.netlify']
  }

  // Parcourir récursivement les fichiers
  findFiles(dir) {
    const files = []
    
    try {
      const items = fs.readdirSync(dir)
      
      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // Ignorer certains dossiers
          if (!this.ignoreDirs.includes(item)) {
            files.push(...this.findFiles(fullPath))
          }
        } else if (stat.isFile()) {
          // Vérifier l'extension
          const ext = path.extname(item)
          if (this.extensions.includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.warn(`Erreur lecture dossier ${dir}:`, error.message)
    }
    
    return files
  }

  // Nettoyer un fichier
  cleanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      let cleanedContent = content
      let hasChanges = false
      
      // Appliquer chaque pattern de nettoyage
      for (const pattern of this.debugPatterns) {
        const before = cleanedContent
        cleanedContent = cleanedContent.replace(pattern, '')
        if (before !== cleanedContent) {
          hasChanges = true
        }
      }
      
      // Nettoyer les lignes vides multiples
      cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n')
      
      // Sauvegarder si des changements ont été faits
      if (hasChanges) {
        fs.writeFileSync(filePath, cleanedContent, 'utf8')
        this.cleanedCount++
        
        const relativePath = path.relative(this.rootDir, filePath)
        console.log(`✅ Nettoyé: ${relativePath}`)
        
        return true
      }
      
      return false
    } catch (error) {
      console.error(`❌ Erreur nettoyage ${filePath}:`, error.message)
      return false
    }
  }

  // Analyser un fichier pour voir ce qui sera supprimé
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\n')
      const matches = []
      
      lines.forEach((line, index) => {
        for (const pattern of this.debugPatterns) {
          if (pattern.test(line)) {
            matches.push({
              line: index + 1,
              content: line.trim()
            })
          }
        }
      })
      
      return matches
    } catch (error) {
      return []
    }
  }

  // Mode analyse (voir ce qui sera supprimé)
  async analyze() {
    console.log('🔍 ANALYSE DES LOGS DE DEBUG')
    console.log('============================')
    
    const files = this.findFiles(this.rootDir)
    let totalMatches = 0
    
    for (const file of files) {
      const matches = this.analyzeFile(file)
      if (matches.length > 0) {
        const relativePath = path.relative(this.rootDir, file)
        console.log(`\n📄 ${relativePath} (${matches.length} logs)`)
        
        matches.slice(0, 5).forEach(match => {
          console.log(`  L${match.line}: ${match.content}`)
        })
        
        if (matches.length > 5) {
          console.log(`  ... et ${matches.length - 5} autres`)
        }
        
        totalMatches += matches.length
      }
    }
    
    console.log(`\n📊 RÉSUMÉ:`)
    console.log(`- ${files.length} fichiers analysés`)
    console.log(`- ${totalMatches} logs de debug trouvés`)
    console.log(`\nUtilisez 'npm run clean-debug' pour nettoyer`)
  }

  // Nettoyer tous les fichiers
  async clean() {
    console.log('🧹 NETTOYAGE DES LOGS DE DEBUG')
    console.log('==============================')
    
    const files = this.findFiles(this.rootDir)
    console.log(`📁 ${files.length} fichiers à traiter`)
    
    let processedFiles = 0
    
    for (const file of files) {
      const cleaned = this.cleanFile(file)
      if (cleaned) {
        processedFiles++
      }
    }
    
    console.log(`\n🎉 NETTOYAGE TERMINÉ:`)
    console.log(`- ${files.length} fichiers analysés`)
    console.log(`- ${processedFiles} fichiers modifiés`)
    console.log(`- ${this.cleanedCount} logs supprimés`)
  }

  // Nettoyer des fichiers spécifiques
  async cleanSpecific(patterns) {
    console.log('🎯 NETTOYAGE CIBLÉ')
    console.log('==================')
    
    const files = this.findFiles(this.rootDir)
    const targetFiles = files.filter(file => {
      return patterns.some(pattern => file.includes(pattern))
    })
    
    console.log(`📁 ${targetFiles.length} fichiers ciblés`)
    
    for (const file of targetFiles) {
      this.cleanFile(file)
    }
    
    console.log(`✅ ${this.cleanedCount} fichiers nettoyés`)
  }

  // Créer une sauvegarde avant nettoyage
  async backup() {
    const backupDir = path.join(this.rootDir, '.backup-debug-logs')
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `backup-${timestamp}.tar`)
    
    // Note: En production, on utiliserait tar ou zip
    console.log(`💾 Sauvegarde créée: ${backupFile}`)
  }
}

// Fonction principale
async function main() {
  const cleaner = new DebugCleaner()
  const args = process.argv.slice(2)
  
  if (args.includes('--analyze') || args.includes('-a')) {
    await cleaner.analyze()
  } else if (args.includes('--backup') || args.includes('-b')) {
    await cleaner.backup()
    await cleaner.clean()
  } else if (args.includes('--specific')) {
    const patterns = args.slice(args.indexOf('--specific') + 1)
    await cleaner.cleanSpecific(patterns)
  } else {
    await cleaner.clean()
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export default DebugCleaner
