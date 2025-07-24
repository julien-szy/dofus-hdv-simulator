import { useState, useEffect } from 'react'
import dofusDataImporter from '../services/dofusDataImporter.js'
import autoImportService from '../services/autoImportService.js'
import debugDofusAPI from '../utils/debugDofusAPI.js'

const DataImporter = ({ isOpen, onClose }) => {
  const [importing, setImporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [stats, setStats] = useState(null)
  const [importLog, setImportLog] = useState([])
  const [progress, setProgress] = useState(0)
  const [autoStatus, setAutoStatus] = useState(null)
  const [availableJobs, setAvailableJobs] = useState([])
  const [jobImporting, setJobImporting] = useState({})
  const [selectedJobItems, setSelectedJobItems] = useState({})
  const [loadingItems, setLoadingItems] = useState({})

  // Charger les statistiques au démarrage
  useEffect(() => {
    if (isOpen) {
      loadStats()
      loadAutoStatus()
      loadAvailableJobs()
    }
  }, [isOpen])

  const loadStats = async () => {
    try {
      console.log('🔄 Chargement des statistiques...')
      const importStats = await dofusDataImporter.getImportStats()
      console.log('📊 Stats reçues:', importStats)
      setStats(importStats)
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error)
      setStats({
        totalItems: 0,
        byProfession: {},
        lastUpdate: null
      })
    }
  }

  const loadAutoStatus = () => {
    const status = autoImportService.getStatus()
    setAutoStatus(status)
  }

  const loadAvailableJobs = async () => {
    try {
      const jobs = await dofusDataImporter.fetchAllJobs()
      console.log('🔧 Métiers chargés:', jobs)

      // Vérifier que jobs est un array et que chaque job a les bonnes propriétés
      const validJobs = Array.isArray(jobs) ? jobs.filter(job => {
        const isValid = job &&
          typeof job === 'object' &&
          (job.id !== undefined && job.id !== null) &&
          (job.name !== undefined && job.name !== null)

        if (!isValid) {
          console.warn('⚠️ Métier invalide:', job)
        }

        return isValid
      }).map(job => {
        // Normaliser le nom du métier (extraire le français si c'est un objet multilingue)
        let jobName = job.name
        if (typeof jobName === 'object' && jobName !== null) {
          jobName = jobName.fr || jobName.en || jobName.de || jobName.es || jobName.pt || `Métier ${job.id}`
        }

        return {
          ...job,
          name: jobName
        }
      }) : []

      setAvailableJobs(validJobs)
      console.log(`✅ ${validJobs.length} métiers valides chargés`)
    } catch (error) {
      console.error('Erreur chargement métiers:', error)
      setAvailableJobs([])
    }
  }

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setImportLog(prev => [...prev, { timestamp, message, type }])
  }

  // Vider complètement la base de données
  const handleClearDatabase = async () => {
    if (importing || updating) return

    const confirmed = confirm(
      '⚠️ ATTENTION !\n\n' +
      'Cette action va SUPPRIMER TOUTES les données de la base :\n' +
      '• Tous les objets craftables\n' +
      '• Toutes les recettes\n' +
      '• Toutes les statistiques\n\n' +
      'Cette action est IRRÉVERSIBLE !\n\n' +
      'Êtes-vous sûr de vouloir continuer ?'
    )

    if (!confirmed) return

    setImporting(true)
    setImportLog([])

    try {
      addLog('🗑️ Suppression de toutes les données...', 'warning')

      const baseUrl = import.meta.env.DEV
        ? 'http://localhost:8888/.netlify/functions/database'
        : '/.netlify/functions/database'

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all_data' })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        addLog('✅ Base de données vidée avec succès', 'success')
        addLog('💡 Vous pouvez maintenant relancer un import complet', 'info')
        await loadStats()
        loadAutoStatus()
      } else {
        addLog(`❌ Erreur: ${result.error}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur lors de la suppression: ${error.message}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  // Test de connexion à la base de données
  const testDatabaseConnection = async () => {
    try {
      addLog('🔍 Test de connexion à la base de données...', 'info')

      const dbUrl = import.meta.env.DEV
        ? 'http://localhost:8888/.netlify/functions/database'
        : '/.netlify/functions/database'

      addLog(`📡 URL testée: ${dbUrl}`, 'info')

      const response = await fetch(`${dbUrl}?action=get_import_stats`)
      addLog(`📡 Réponse: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error')

      if (response.ok) {
        const data = await response.json()
        addLog(`📊 Données reçues: ${JSON.stringify(data).substring(0, 200)}...`, 'info')
        addLog(`📊 Type: ${typeof data}, Array: ${Array.isArray(data)}, Longueur: ${Array.isArray(data) ? data.length : 'N/A'}`, 'info')
      } else {
        const errorText = await response.text()
        addLog(`❌ Erreur: ${errorText}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur de connexion: ${error.message}`, 'error')
    }
  }

  const handleFullImport = async () => {
    if (importing) return

    setImporting(true)
    setImportLog([])
    setProgress(0)

    try {
      addLog('🚀 Début de l\'import complet forcé par admin...', 'info')
      addLog('📡 Connexion à l\'API DofusDB...', 'info')

      // Écouter les événements de progression
      const handleProgress = (event) => {
        if (event.detail.type === 'import_progress') {
          setProgress(event.detail.progress || 0)
          addLog(event.detail.message, event.detail.logType || 'info')
        }
      }

      window.addEventListener('dofus_import_progress', handleProgress)

      const result = await autoImportService.forceFullImport()

      window.removeEventListener('dofus_import_progress', handleProgress)

      if (result.success) {
        addLog(`🎉 Import complet terminé avec succès !`, 'success')
        addLog(`📊 Résultats:`, 'info')
        addLog(`   • ${result.totalItems} objets craftables importés`, 'success')
        addLog(`   • ${result.totalJobs} métiers traités`, 'success')
        addLog(`   • Base de données mise à jour`, 'success')
        setProgress(100)
        await loadStats()
        loadAutoStatus()
      } else if (result.error) {
        addLog(`❌ Erreur lors de l'importation: ${result.error}`, 'error')
      } else {
        addLog('❌ Erreur inconnue lors de l\'importation', 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur fatale: ${error.message}`, 'error')
      console.error('Erreur import complet:', error)
    } finally {
      setImporting(false)
    }
  }

  const handleUpdate = async () => {
    if (updating) return

    setUpdating(true)
    setImportLog([])

    try {
      addLog('🔧 Mise à jour forcée par admin...', 'info')

      const result = await autoImportService.forceUpdate()

      if (result.success) {
        addLog(`✅ Mise à jour terminée ! ${result.newItems} nouveaux objets ajoutés`, 'success')
        await loadStats()
        loadAutoStatus()
      } else {
        addLog('❌ Erreur lors de la mise à jour', 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleDebugAPI = async () => {
    setImportLog([])
    addLog('🔍 Début du debug API DofusDB...', 'info')

    try {
      // Lancer le debug complet
      await debugDofusAPI.runFullDebug()
      addLog('✅ Debug terminé - Vérifiez la console pour les détails', 'success')
    } catch (error) {
      addLog(`❌ Erreur debug: ${error.message}`, 'error')
    }
  }

  const handleJobImport = async (jobId, jobName) => {
    if (jobImporting[jobId]) return

    setJobImporting(prev => ({ ...prev, [jobId]: true }))
    addLog(`🎯 Import du métier: ${jobName}`, 'info')

    try {
      const result = await dofusDataImporter.importSingleJob(jobId, jobName)

      if (result.success) {
        const icon = getJobIcon(jobName)
        if (result.totalItems > 0) {
          addLog(`${icon} ${jobName}: ${result.totalItems} objets importés depuis ${result.totalRecipes} recettes`, 'success')
          if (result.skippedItems > 0) {
            addLog(`⚠️ ${jobName}: ${result.skippedItems} recettes ignorées (sans résultat valide)`, 'warning')
          }
        } else {
          addLog(`${icon} ${jobName}: ${result.message || 'Aucun objet à importer'}`, 'info')
        }
        await loadStats()
        loadAutoStatus()

        // Recharger les items du métier si ils sont affichés
        if (selectedJobItems[jobName]) {
          await loadJobItems(jobName)
        }
      } else {
        addLog(`❌ Erreur ${jobName}: ${result.error}`, 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur import ${jobName}: ${error.message}`, 'error')
    } finally {
      setJobImporting(prev => ({ ...prev, [jobId]: false }))
    }
  }

  const loadJobItems = async (jobName) => {
    if (loadingItems[jobName]) return

    setLoadingItems(prev => ({ ...prev, [jobName]: true }))

    try {
      const baseUrl = import.meta.env.DEV
        ? 'http://localhost:8888/.netlify/functions/database'
        : '/.netlify/functions/database'

      const response = await fetch(`${baseUrl}?action=get_items_by_profession&profession=${encodeURIComponent(jobName)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const items = await response.json()
      setSelectedJobItems(prev => ({ ...prev, [jobName]: items }))
      addLog(`📋 ${items.length} objets chargés pour ${jobName}`, 'info')
    } catch (error) {
      console.error(`Erreur chargement items ${jobName}:`, error)
      addLog(`❌ Erreur chargement items ${jobName}: ${error.message}`, 'error')
    } finally {
      setLoadingItems(prev => ({ ...prev, [jobName]: false }))
    }
  }

  const cleanJobDuplicates = async (jobName) => {
    try {
      const baseUrl = import.meta.env.DEV
        ? 'http://localhost:8888/.netlify/functions/database'
        : '/.netlify/functions/database'

      const response = await fetch(`${baseUrl}?action=clean_duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profession: jobName })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      addLog(`🧹 ${result.deletedCount} doublons supprimés pour ${jobName}`, 'success')

      // Recharger les stats et items
      await loadStats()
      if (selectedJobItems[jobName]) {
        await loadJobItems(jobName)
      }
    } catch (error) {
      console.error(`Erreur nettoyage ${jobName}:`, error)
      addLog(`❌ Erreur nettoyage ${jobName}: ${error.message}`, 'error')
    }
  }

  const extractResources = async () => {
    try {
      addLog('🔍 Extraction des ressources depuis les recettes...', 'info')

      const baseUrl = import.meta.env.DEV
        ? 'http://localhost:8888/.netlify/functions/database'
        : '/.netlify/functions/database'

      const response = await fetch(`${baseUrl}?action=extract_resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        addLog(`✅ ${result.resourcesCount} ressources extraites et sauvegardées`, 'success')
        addLog(`✅ ${result.linksCount} liaisons item-ressource créées`, 'success')
      } else {
        addLog(`❌ Erreur extraction: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erreur extraction ressources:', error)
      addLog(`❌ Erreur extraction ressources: ${error.message}`, 'error')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Jamais'
    return new Date(timestamp).toLocaleString()
  }

  // Obtenir l'icône d'un métier
  const getJobIcon = (jobName) => {
    const icons = {
      'Alchimiste': '🧪',
      'Forgeron d\'Épées': '⚔️',
      'Forgeron de Dagues': '🗡️',
      'Forgeron de Marteaux': '🔨',
      'Forgeron de Pelles': '⛏️',
      'Forgeron de Haches': '🪓',
      'Sculpteur d\'Arcs': '🏹',
      'Sculpteur de Bâtons': '🪄',
      'Sculpteur de Baguettes': '✨',
      'Cordonnier': '👢',
      'Joaillomage': '💎',
      'Tailleur': '🧵',
      'Forgeron de Boucliers': '🛡️',
      'Bricoleur': '🔧',
      'Mineur': '⛏️',
      'Bûcheron': '🪓',
      'Pêcheur': '🎣',
      'Chasseur': '🏹',
      'Paysan': '🌾',
      'Boucher': '🥩',
      'Poissonnier': '🐟',
      'Boulanger': '🍞'
    }

    return icons[jobName] || '⚒️' // Icône par défaut
  }

  if (!isOpen) return null

  return (
    <div className="importer-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="importer-modal">
        <div className="importer-header">
          <h2>🔧 Importation des Données DofusDB</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div className="importer-content">
          {/* Statut Auto-Import */}
          <div className="auto-import-status">
            <h3>🤖 Statut Auto-Importation</h3>
            {autoStatus ? (
              <div className="status-grid">
                <div className="status-item">
                  <div className="status-label">Statut</div>
                  <div className={`status-value ${autoStatus.importInProgress ? 'importing' : 'idle'}`}>
                    {autoStatus.importInProgress ? '🔄 Import en cours...' : '✅ Actif'}
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">Dernière vérification</div>
                  <div className="status-value">{autoStatus.lastCheck}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Dernier import</div>
                  <div className="status-value">{autoStatus.lastImport}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Prochaine vérification</div>
                  <div className="status-value">{autoStatus.nextCheck}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Temps depuis dernier import</div>
                  <div className="status-value">{autoStatus.timeSinceLastImport}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Mise à jour nécessaire</div>
                  <div className={`status-value ${autoStatus.needsUpdate ? 'needs-update' : 'up-to-date'}`}>
                    {autoStatus.needsUpdate ? '⚠️ Oui' : '✅ Non'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading">Chargement du statut...</div>
            )}
          </div>

          {/* Statistiques */}
          <div className="importer-stats">
            <h3>📊 Statistiques actuelles</h3>
            {stats ? (
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalItems}</div>
                  <div className="stat-label">Objets craftables</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{Object.keys(stats.byProfession || {}).length}</div>
                  <div className="stat-label">Métiers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'Jamais'}
                  </div>
                  <div className="stat-label">Dernière MAJ</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{Object.keys(stats.byProfession).length}</div>
                  <div className="stat-label">Métiers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{formatDate(stats.lastUpdate)}</div>
                  <div className="stat-label">Dernière mise à jour</div>
                </div>
              </div>
            ) : (
              <div className="loading">Chargement des statistiques...</div>
            )}

            {stats && stats.byProfession && (
              <div className="profession-stats">
                <h4>Répartition par métier :</h4>
                <div className="profession-list">
                  {Object.entries(stats.byProfession).map(([profession, count]) => (
                    <div key={profession} className="profession-item">
                      <span className="profession-name">{profession}</span>
                      <span className="profession-count">{count} objets</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="importer-actions">
            <h3>⚙️ Actions</h3>
            <div className="action-buttons">
              <button
                onClick={testDatabaseConnection}
                className="btn btn-secondary"
              >
                🔍 Test BDD
              </button>
              <button
                onClick={handleFullImport}
                disabled={importing || updating}
                className="btn btn-primary btn-import"
              >
                {importing ? '🔄 Importation en cours...' : '📥 Importation complète'}
              </button>

              <button
                onClick={handleUpdate}
                disabled={importing || updating}
                className="btn btn-secondary btn-update"
              >
                {updating ? '🔄 Mise à jour...' : '🔄 Mise à jour incrémentale'}
              </button>

              <button
                onClick={handleDebugAPI}
                disabled={importing || updating}
                className="btn btn-warning btn-debug"
              >
                🔍 Debug API
              </button>

              <button
                onClick={handleClearDatabase}
                disabled={importing || updating}
                className="btn btn-danger btn-clear"
              >
                🗑️ Vider BDD
              </button>

              <button
                onClick={extractResources}
                disabled={importing || updating}
                className="btn btn-info"
                title="Extraire les ressources depuis les recettes"
              >
                🧪 Extraire Ressources
              </button>
            </div>

            <div className="action-descriptions">
              <div className="action-desc">
                <strong>🔍 Test BDD :</strong> Vérifie la connexion à la base de données et affiche les informations de debug.
              </div>
              <div className="action-desc">
                <strong>📥 Importation complète :</strong> Récupère TOUS les métiers et leurs recettes depuis DofusDB. Peut prendre 10-30 minutes.
              </div>
              <div className="action-desc">
                <strong>🔄 Mise à jour incrémentale :</strong> Met à jour seulement les nouveaux objets depuis la dernière importation.
              </div>
              <div className="action-desc">
                <strong>🔍 Debug API :</strong> Teste les endpoints DofusDB et affiche les informations de debug détaillées.
              </div>
              <div className="action-desc">
                <strong>🗑️ Vider BDD :</strong> <span style="color: #dc3545;">SUPPRIME TOUTES</span> les données. Utilisez avant un import complet si problème.
              </div>
              <div className="action-desc">
                <strong>🧪 Extraire Ressources :</strong> Analyse les recettes pour extraire toutes les ressources nécessaires.
              </div>
              <div className="action-desc">
                <strong>Mise à jour incrémentale :</strong> Ajoute seulement les nouveaux objets craftables.
              </div>
            </div>
          </div>

          {/* Import par métier */}
          <div className="job-import-section">
            <h3>⚒️ Import par Métier</h3>
            <div className="job-import-description">
              <p>Importez les recettes d'un métier spécifique. Utile pour tester ou corriger des données manquantes.</p>
            </div>

            {availableJobs.length > 0 ? (
              <div className="jobs-grid">
                {availableJobs.map((job) => {
                  // Protection contre les objets invalides
                  if (!job || typeof job !== 'object' || !job.id || !job.name) {
                    console.warn('⚠️ Métier invalide ignoré:', job)
                    return null
                  }

                  // Obtenir l'icône et les stats du métier
                  const jobIcon = getJobIcon(job.name)
                  const jobStats = stats?.byProfession?.[job.name] || 0

                  return (
                    <div key={job.id} className="job-item">
                      <div className="job-item-header">
                        <div className="job-info">
                          <div className="job-header">
                            <span className="job-icon">{jobIcon}</span>
                            <div className="job-name">{job.name || `Métier ${job.id}`}</div>
                          </div>
                          <div className="job-stats">
                            <span className="job-count">{jobStats} objets</span>
                            <span className="job-id">ID: {job.id}</span>
                          </div>
                        </div>
                        <div className="job-actions">
                        <button
                          onClick={() => handleJobImport(job.id, job.name)}
                          disabled={jobImporting[job.id] || importing || updating}
                          className={`btn btn-sm btn-job-import ${jobStats > 0 ? 'btn-update' : 'btn-new'}`}
                          title={jobStats > 0 ? `Mettre à jour (${jobStats} objets)` : 'Premier import'}
                        >
                          {jobImporting[job.id] ? '🔄' : jobStats > 0 ? '🔄' : '📥'}
                          {jobImporting[job.id] ? 'Import...' : jobStats > 0 ? 'Maj' : 'Import'}
                        </button>

                        <button
                          onClick={() => selectedJobItems[job.name] ?
                            setSelectedJobItems(prev => ({ ...prev, [job.name]: null })) :
                            loadJobItems(job.name)
                          }
                          disabled={loadingItems[job.name]}
                          className="btn btn-sm btn-secondary"
                          title="Voir les objets de ce métier"
                        >
                          {loadingItems[job.name] ? '⏳' : selectedJobItems[job.name] ? '👁️' : '📋'}
                          {selectedJobItems[job.name] ? 'Masquer' : 'Voir items'}
                        </button>

                        {jobStats > 0 && (
                          <button
                            onClick={() => cleanJobDuplicates(job.name)}
                            disabled={importing || updating}
                            className="btn btn-sm btn-warning"
                            title="Nettoyer les doublons"
                          >
                            🧹 Clean
                          </button>
                        )}
                        </div>
                      </div>

                      {/* Affichage des items du métier */}
                      {selectedJobItems[job.name] && (
                        <div className="job-items">
                          <div className="job-items-header">
                            <h4>📋 Items {job.name} ({selectedJobItems[job.name].length})</h4>
                          </div>
                          <div className="job-items-list">
                            {selectedJobItems[job.name].slice(0, 20).map((item, index) => (
                              <div key={item.item_id || index} className="job-item-row">
                                <span className="item-name">{item.item_name}</span>
                                <span className="item-level">Niv. {item.level_required || 1}</span>
                                <span className="item-type">{item.item_type || 'Inconnu'}</span>
                              </div>
                            ))}
                            {selectedJobItems[job.name].length > 20 && (
                              <div className="job-items-more">
                                ... et {selectedJobItems[job.name].length - 20} autres items
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="loading">Chargement des métiers...</div>
            )}
          </div>

          {/* Barre de progression */}
          {importing && (
            <div className="import-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}% terminé</div>
            </div>
          )}

          {/* Log d'importation */}
          {importLog.length > 0 && (
            <div className="import-log">
              <h3>📝 Journal d'importation</h3>
              <div className="log-container">
                {importLog.map((entry, index) => (
                  <div key={index} className={`log-entry log-${entry.type}`}>
                    <span className="log-time">{entry.timestamp}</span>
                    <span className="log-message">{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="importer-footer">
          <div className="importer-warning">
            ⚠️ L'importation complète peut prendre plusieurs minutes et consommer de la bande passante.
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataImporter
