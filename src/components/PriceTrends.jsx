import { useState, useEffect } from 'react'
import { searchItems } from '../services/dofusDbApi.js'
import userService from '../services/userService.js'
import trendsService from '../services/trendsService.js'

const DOFUS_SERVERS = [
  'Dakal', 'Mikhal', 'Kourial', // Pionniers
  'Draconiros', 'Imagiro', 'Orukam', 'Hell Mina', 'Tylezia', 'Tal Kasha', 'Ombre' // Historiques
]

const PriceTrends = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedServer, setSelectedServer] = useState('')
  const [loading, setLoading] = useState(false)
  const [priceHistory, setPriceHistory] = useState([])
  const [chartData, setChartData] = useState(null)
  const [trendStats, setTrendStats] = useState(null)

  // Charger le serveur de l'utilisateur au démarrage
  useEffect(() => {
    const userServer = trendsService.getCurrentUserServer()
    if (userServer) {
      setSelectedServer(userServer)
    }
  }, [isOpen])

  // Rechercher des items
  const handleSearch = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results = await searchItems(term)
      setSearchResults(results.slice(0, 10)) // Limiter à 10 résultats
    } catch (error) {
      console.error('Erreur recherche:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // Sélectionner un item
  const selectItem = async (item) => {
    setSelectedItem(item)
    setSearchResults([])
    setSearchTerm(item.name)
    
    if (selectedServer) {
      await loadPriceHistory(item.ankama_id, selectedServer)
    }
  }

  // Charger l'historique des prix
  const loadPriceHistory = async (itemId, server) => {
    setLoading(true)
    try {
      // Charger les vraies données depuis le service
      const historyData = await trendsService.getPriceHistory(itemId, server, 30)
      setPriceHistory(historyData)
      setChartData(formatChartData(historyData))

      // Calculer les statistiques de tendance
      const stats = trendsService.calculateTrendStats(historyData)
      setTrendStats(stats)

      console.log(`📊 Historique chargé: ${historyData.length} points, tendance: ${stats.trend}`)
    } catch (error) {
      console.error('Erreur chargement historique:', error)
      setPriceHistory([])
      setChartData(null)
      setTrendStats(null)
    } finally {
      setLoading(false)
    }
  }



  // Formater les données pour le chart
  const formatChartData = (data) => {
    const colors = trendsService.getChartColors()

    return {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Prix x1',
          data: data.map(d => d.price_x1),
          borderColor: colors.price_x1.border,
          backgroundColor: colors.price_x1.background,
          tension: 0.4
        },
        {
          label: 'Prix x10',
          data: data.map(d => d.price_x10),
          borderColor: colors.price_x10.border,
          backgroundColor: colors.price_x10.background,
          tension: 0.4
        },
        {
          label: 'Prix x100',
          data: data.map(d => d.price_x100),
          borderColor: colors.price_x100.border,
          backgroundColor: colors.price_x100.background,
          tension: 0.4
        }
      ]
    }
  }

  // Utiliser les fonctions du service
  const formatPrice = trendsService.formatPrice

  if (!isOpen) return null

  return (
    <div className="trends-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="trends-modal">
        {/* Header */}
        <div className="trends-modal-header">
          <h2>📈 Tendances des Prix</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Search Section */}
        <div className="trends-search-section">
          <div className="trends-search-container">
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Rechercher un item ou une ressource..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="trends-search-input"
              />
              {loading && <div className="search-loading">🔍</div>}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results-dropdown">
                {searchResults.map(item => (
                  <div
                    key={item.ankama_id}
                    className="search-result-item"
                    onClick={() => selectItem(item)}
                  >
                    <div className="result-name">{item.name}</div>
                    <div className="result-type">{item.type?.name || 'Inconnu'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="server-selector">
            <label>🌍 Serveur</label>
            <select
              value={selectedServer}
              onChange={(e) => {
                setSelectedServer(e.target.value)
                if (selectedItem && e.target.value) {
                  loadPriceHistory(selectedItem.ankama_id, e.target.value)
                }
              }}
              className="server-select"
            >
              <option value="">Choisir un serveur...</option>
              {DOFUS_SERVERS.map(server => (
                <option key={server} value={server}>{server}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Section */}
        <div className="trends-content">
          {selectedItem && selectedServer ? (
            <div className="trends-results">
              {/* Item Info */}
              <div className="selected-item-info">
                <h3>{selectedItem.name}</h3>
                <p>Serveur : <strong>{selectedServer}</strong></p>
                {trendStats && (
                  <div className={`trend-indicator trend-${trendStats.trend}`}>
                    {trendStats.trend === 'up' && '📈 '}
                    {trendStats.trend === 'down' && '📉 '}
                    {trendStats.trend === 'stable' && '➡️ '}
                    {trendStats.trend === 'up' ? 'Hausse' : trendStats.trend === 'down' ? 'Baisse' : 'Stable'}
                    {trendStats.percentage !== 0 && ` (${trendStats.percentage > 0 ? '+' : ''}${trendStats.percentage}%)`}
                    <span className={`confidence confidence-${trendStats.confidence}`}>
                      • {trendStats.dataPoints} données • Confiance {trendStats.confidence === 'high' ? 'élevée' : trendStats.confidence === 'medium' ? 'moyenne' : 'faible'}
                    </span>
                  </div>
                )}
              </div>

              {/* Chart Placeholder */}
              <div className="chart-container">
                {loading ? (
                  <div className="chart-loading">
                    <div className="loading-spinner"></div>
                    <p>Chargement des données...</p>
                  </div>
                ) : priceHistory && priceHistory.length > 0 ? (
                  <div className="chart-content">
                    <h4>📊 Évolution des Prix (30 derniers jours)</h4>

                    {/* Résumé des prix actuels */}
                    <div className="current-prices">
                      <div className="price-card">
                        <div className="price-label">Prix unitaire</div>
                        <div className="price-value">{formatPrice(priceHistory[priceHistory.length - 1]?.price_x1)}</div>
                      </div>
                      <div className="price-card">
                        <div className="price-label">Prix x10</div>
                        <div className="price-value">{formatPrice(priceHistory[priceHistory.length - 1]?.price_x10)}</div>
                      </div>
                      <div className="price-card">
                        <div className="price-label">Prix x100</div>
                        <div className="price-value">{formatPrice(priceHistory[priceHistory.length - 1]?.price_x100)}</div>
                      </div>
                    </div>

                    {/* Zone graphique future */}
                    <div className="chart-future">
                      <div className="chart-placeholder-clean">
                        <div className="placeholder-icon">📈</div>
                        <h5>Graphique d'évolution</h5>
                        <p>Les graphiques détaillés seront disponibles prochainement</p>
                        <div className="data-info">
                          <span>📊 {priceHistory.length} points de données disponibles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <div className="no-data-icon">📊</div>
                    <h4>Aucune donnée disponible</h4>
                    <p>Cet item n'a pas encore de données de prix sur ce serveur.</p>
                    <div className="no-data-help">
                      <p>💡 Les données apparaîtront quand des utilisateurs saisiront des prix pour cet item</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="trends-placeholder">
              <div className="placeholder-content">
                <div className="placeholder-icon">📈</div>
                <h3>Analysez les Tendances du Marché</h3>
                <p>Recherchez un item et sélectionnez un serveur pour voir l'évolution des prix</p>
                <div className="placeholder-features">
                  <div className="feature">📊 Graphiques en temps réel</div>
                  <div className="feature">📈 Tendances haussières/baissières</div>
                  <div className="feature">🌍 Données par serveur</div>
                  <div className="feature">💰 Prix x1, x10, x100</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="trends-modal-footer">
          <div className="trends-info">
            <p>💡 Les données sont basées sur les prix saisis par les utilisateurs de manière anonyme</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceTrends
