import { useState, useEffect } from 'react'
import dataCache from '../services/dataCache.js'

const CacheStats = () => {
  const [stats, setStats] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  const loadStats = async () => {
    try {
      const cacheStats = await dataCache.getCacheStats()
      setStats(cacheStats)
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
    }
  }

  const clearCache = async () => {
    if (confirm('Êtes-vous sûr de vouloir vider tout le cache ?')) {
      try {
        await dataCache.clearAllCache()
        await loadStats()
        alert('Cache vidé avec succès !')
      } catch (error) {
        console.error('Erreur lors du vidage du cache:', error)
        alert('Erreur lors du vidage du cache')
      }
    }
  }

  const cleanExpired = async () => {
    try {
      await dataCache.cleanExpiredCache()
      await loadStats()
      alert('Cache nettoyé avec succès !')
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error)
      alert('Erreur lors du nettoyage du cache')
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="cache-stats-toggle"
        title="Statistiques du cache"
      >
        📊 Cache
      </button>
    )
  }

  return (
    <div className="cache-stats-modal">
      <div
        className="cache-stats-content"
        style={{
          position: 'fixed',
          top: '20vh',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000001,
          maxHeight: '60vh',
          overflowY: 'auto'
        }}
      >
        <div className="cache-stats-header">
          <h3>📊 Statistiques du Cache</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="cache-stats-close"
          >
            ✕
          </button>
        </div>

        {stats ? (
          <div className="cache-stats-body">
            <div className="cache-stats-grid">
              <div className="cache-stat-item">
                <div className="cache-stat-label">🔍 Recherches</div>
                <div className="cache-stat-value">{stats.searchResults || 0}</div>
              </div>
              
              <div className="cache-stat-item">
                <div className="cache-stat-label">⚔️ Items</div>
                <div className="cache-stat-value">{stats.itemDetails || 0}</div>
              </div>
              
              <div className="cache-stat-item">
                <div className="cache-stat-label">🧱 Matériaux</div>
                <div className="cache-stat-value">{stats.materialDetails || 0}</div>
              </div>
            </div>

            <div className="cache-stats-actions">
              <button
                onClick={loadStats}
                className="cache-btn cache-btn-refresh"
              >
                🔄 Actualiser
              </button>
              
              <button
                onClick={cleanExpired}
                className="cache-btn cache-btn-clean"
              >
                🧹 Nettoyer
              </button>
              
              <button
                onClick={clearCache}
                className="cache-btn cache-btn-clear"
              >
                🗑️ Vider
              </button>
            </div>

            <div className="cache-stats-info">
              <p>
                <strong>🚀 Avantages du cache :</strong><br/>
                • Recherches instantanées<br/>
                • Moins d'appels API<br/>
                • Fonctionne hors ligne
              </p>
            </div>
          </div>
        ) : (
          <div className="cache-stats-loading">
            Chargement des statistiques...
          </div>
        )}
      </div>
    </div>
  )
}

export default CacheStats
