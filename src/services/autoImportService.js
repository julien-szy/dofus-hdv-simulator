// Service d'auto-importation intelligent pour les données DofusDB
import dofusDataImporter from './dofusDataImporter.js'

class AutoImportService {
  constructor() {
    this.importInProgress = false
    this.lastCheckKey = 'dofus_last_import_check'
    this.lastImportKey = 'dofus_last_import_date'
    this.checkInterval = 7 * 24 * 60 * 60 * 1000 // 7 jours en millisecondes
    this.forceCheckInterval = 24 * 60 * 60 * 1000 // 1 jour pour vérification forcée
  }

  // Démarrer le service d'auto-importation
  async startAutoImport() {
    console.log('🤖 Service d\'auto-importation démarré')
    
    // Vérifier immédiatement au démarrage
    await this.checkAndImportIfNeeded()
    
    // Programmer les vérifications périodiques
    this.schedulePeriodicChecks()
  }

  // Vérifier si un import est nécessaire
  async checkAndImportIfNeeded(force = false) {
    if (this.importInProgress) {
      console.log('⏳ Import déjà en cours, ignorer...')
      return { skipped: true, reason: 'Import en cours' }
    }

    try {
      const now = Date.now()
      const lastCheck = parseInt(localStorage.getItem(this.lastCheckKey) || '0')
      const lastImport = parseInt(localStorage.getItem(this.lastImportKey) || '0')

      // Vérifier si assez de temps s'est écoulé
      if (!force && (now - lastCheck) < this.forceCheckInterval) {
        console.log('⏰ Vérification trop récente, attendre...')
        return { skipped: true, reason: 'Vérification récente' }
      }

      // Mettre à jour la date de dernière vérification
      localStorage.setItem(this.lastCheckKey, now.toString())

      // Vérifier les statistiques actuelles
      const stats = await dofusDataImporter.getImportStats()
      
      if (!stats || stats.totalItems === 0) {
        // Aucune donnée : import complet nécessaire
        console.log('📥 Aucune donnée trouvée, import complet nécessaire')
        return await this.performFullImport()
      }

      // Vérifier si un import incrémental est nécessaire
      if (force || (now - lastImport) > this.checkInterval) {
        console.log('🔄 Vérification des mises à jour nécessaire')
        return await this.performIncrementalUpdate()
      }

      console.log('✅ Données à jour, aucun import nécessaire')
      return { skipped: true, reason: 'Données à jour' }

    } catch (error) {
      console.error('❌ Erreur vérification auto-import:', error)
      return { error: error.message }
    }
  }

  // Effectuer un import complet
  async performFullImport() {
    if (this.importInProgress) return { skipped: true, reason: 'Import en cours' }

    this.importInProgress = true
    console.log('🚀 Début de l\'import complet automatique...')

    try {
      const result = await dofusDataImporter.importAllCraftableData()
      
      if (result.success) {
        const now = Date.now()
        localStorage.setItem(this.lastImportKey, now.toString())
        localStorage.setItem(this.lastCheckKey, now.toString())
        
        console.log(`✅ Import complet terminé : ${result.totalItems} objets depuis ${result.totalJobs} métiers`)
        
        // Notifier l'utilisateur discrètement
        this.showDiscreteNotification('success', `${result.totalItems} objets craftables importés`)
        
        return {
          success: true,
          type: 'full',
          totalItems: result.totalItems,
          totalJobs: result.totalJobs
        }
      } else {
        throw new Error('Import complet échoué')
      }
    } catch (error) {
      console.error('❌ Erreur import complet:', error)
      this.showDiscreteNotification('error', 'Erreur lors de l\'import des données')
      return { error: error.message }
    } finally {
      this.importInProgress = false
    }
  }

  // Effectuer une mise à jour incrémentale
  async performIncrementalUpdate() {
    if (this.importInProgress) return { skipped: true, reason: 'Import en cours' }

    this.importInProgress = true
    console.log('🔄 Début de la mise à jour incrémentale...')

    try {
      const result = await dofusDataImporter.updateCraftableData()
      
      if (result.success) {
        const now = Date.now()
        localStorage.setItem(this.lastImportKey, now.toString())
        localStorage.setItem(this.lastCheckKey, now.toString())
        
        if (result.newItems > 0) {
          console.log(`✅ Mise à jour terminée : ${result.newItems} nouveaux objets ajoutés`)
          this.showDiscreteNotification('info', `${result.newItems} nouveaux objets craftables`)
        } else {
          console.log('✅ Aucun nouvel objet à ajouter')
        }
        
        return {
          success: true,
          type: 'incremental',
          newItems: result.newItems
        }
      } else {
        throw new Error('Mise à jour incrémentale échouée')
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour incrémentale:', error)
      return { error: error.message }
    } finally {
      this.importInProgress = false
    }
  }

  // Programmer les vérifications périodiques
  schedulePeriodicChecks() {
    // Vérification toutes les heures
    setInterval(() => {
      this.checkAndImportIfNeeded()
    }, 60 * 60 * 1000) // 1 heure

    console.log('⏰ Vérifications périodiques programmées (toutes les heures)')
  }

  // Afficher une notification discrète
  showDiscreteNotification(type, message) {
    // Créer un événement personnalisé pour notifier l'app
    const event = new CustomEvent('autoImportNotification', {
      detail: { type, message }
    })
    window.dispatchEvent(event)
  }

  // Forcer un import (pour les admins)
  async forceFullImport() {
    console.log('🔧 Import forcé par admin')
    return await this.performFullImport()
  }

  // Forcer une mise à jour (pour les admins)
  async forceUpdate() {
    console.log('🔧 Mise à jour forcée par admin')
    return await this.performIncrementalUpdate()
  }

  // Obtenir le statut du service
  getStatus() {
    const lastCheck = parseInt(localStorage.getItem(this.lastCheckKey) || '0')
    const lastImport = parseInt(localStorage.getItem(this.lastImportKey) || '0')
    const now = Date.now()

    return {
      importInProgress: this.importInProgress,
      lastCheck: lastCheck ? new Date(lastCheck).toLocaleString() : 'Jamais',
      lastImport: lastImport ? new Date(lastImport).toLocaleString() : 'Jamais',
      nextCheck: lastCheck ? new Date(lastCheck + this.forceCheckInterval).toLocaleString() : 'Bientôt',
      timeSinceLastImport: lastImport ? this.formatDuration(now - lastImport) : 'Jamais',
      needsUpdate: !lastImport || (now - lastImport) > this.checkInterval
    }
  }

  // Formater une durée en texte lisible
  formatDuration(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000))
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''} ${hours}h`
    } else if (hours > 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`
    } else {
      return 'Moins d\'une heure'
    }
  }

  // Réinitialiser les données (admin seulement)
  resetImportData() {
    localStorage.removeItem(this.lastCheckKey)
    localStorage.removeItem(this.lastImportKey)
    console.log('🧹 Données d\'import réinitialisées')
  }

  // Arrêter le service
  stop() {
    // Note: clearInterval nécessiterait de stocker l'ID, 
    // mais pour cette implémentation simple, on laisse tourner
    console.log('⏹️ Service d\'auto-importation arrêté')
  }
}

// Instance singleton
export const autoImportService = new AutoImportService()
export default autoImportService
