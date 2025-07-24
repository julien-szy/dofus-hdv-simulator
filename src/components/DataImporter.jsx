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

  // Charger les statistiques au démarrage
  useEffect(() => {
    if (isOpen) {
      loadStats()
      loadAutoStatus()
    }
  }, [isOpen])

  const loadStats = async () => {
    try {
      const importStats = await dofusDataImporter.getImportStats()
      setStats(importStats)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const loadAutoStatus = () => {
    const status = autoImportService.getStatus()
    setAutoStatus(status)
  }

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setImportLog(prev => [...prev, { timestamp, message, type }])
  }

  const handleFullImport = async () => {
    if (importing) return

    setImporting(true)
    setImportLog([])
    setProgress(0)

    try {
      addLog('🔧 Import forcé par admin...', 'info')

      const result = await autoImportService.forceFullImport()

      if (result.success) {
        addLog(`✅ Importation terminée ! ${result.totalItems} objets importés depuis ${result.totalJobs} métiers`, 'success')
        setProgress(100)
        await loadStats()
        loadAutoStatus()
      } else {
        addLog('❌ Erreur lors de l\'importation', 'error')
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error')
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Jamais'
    return new Date(timestamp).toLocaleString()
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
            </div>

            <div className="action-descriptions">
              <div className="action-desc">
                <strong>Importation complète :</strong> Récupère tous les métiers et toutes leurs recettes depuis DofusDB. Peut prendre plusieurs minutes.
              </div>
              <div className="action-desc">
                <strong>Mise à jour incrémentale :</strong> Ajoute seulement les nouveaux objets craftables.
              </div>
            </div>
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
