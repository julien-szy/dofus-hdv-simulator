import { useState, useEffect } from 'react'
import { searchItems } from '../services/dofusDbApi.js'
import userService from '../services/userService.js'

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
      // Simuler des données pour le moment (en attendant la vraie API)
      const mockData = generateMockPriceHistory(itemId, server)
      setPriceHistory(mockData)
      setChartData(formatChartData(mockData))
    } catch (error) {
      console.error('Erreur chargement historique:', error)
      setPriceHistory([])
      setChartData(null)
    } finally {
      setLoading(false)
    }
  }

  // Générer des données mock pour le développement
  const generateMockPriceHistory = (itemId, server) => {
    const data = []
    const basePrice = Math.floor(Math.random() * 10000) + 1000
    const now = new Date()

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      const variation = (Math.random() - 0.5) * 0.2 // ±20% variation
      const price = Math.max(100, Math.floor(basePrice * (1 + variation)))
      
      data.push({
        date: date.toISOString().split('T')[0],
        price_x1: price,
        price_x10: Math.floor(price * 0.95),
        price_x100: Math.floor(price * 0.9),
        server: server,
        item_id: itemId
      })
    }
    
    return data
  }

  // Formater les données pour le chart
  const formatChartData = (data) => {
    return {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Prix x1',
          data: data.map(d => d.price_x1),
          borderColor: '#d4af37',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          tension: 0.4
        },
        {
          label: 'Prix x10',
          data: data.map(d => d.price_x10),
          borderColor: '#b8860b',
          backgroundColor: 'rgba(184, 134, 11, 0.1)',
          tension: 0.4
        },
        {
          label: 'Prix x100',
          data: data.map(d => d.price_x100),
          borderColor: '#8b7355',
          backgroundColor: 'rgba(139, 115, 85, 0.1)',
          tension: 0.4
        }
      ]
    }
  }

  // Formater les prix
  const formatPrice = (price) => {
    if (!price) return '0 K'
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M K`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K K`
    return `${price} K`
  }

  // Calculer la tendance
  const calculateTrend = (data) => {
    if (data.length < 2) return { trend: 'stable', percentage: 0 }
    
    const recent = data.slice(-7) // 7 derniers jours
    const older = data.slice(-14, -7) // 7 jours précédents
    
    const recentAvg = recent.reduce((sum, d) => sum + d.price_x1, 0) / recent.length
    const olderAvg = older.reduce((sum, d) => sum + d.price_x1, 0) / older.length
    
    const percentage = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1)
    
    if (percentage > 5) return { trend: 'up', percentage }
    if (percentage < -5) return { trend: 'down', percentage }
    return { trend: 'stable', percentage }
  }

  const trend = priceHistory.length > 0 ? calculateTrend(priceHistory) : null

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
                {trend && (
                  <div className={`trend-indicator trend-${trend.trend}`}>
                    {trend.trend === 'up' && '📈 '}
                    {trend.trend === 'down' && '📉 '}
                    {trend.trend === 'stable' && '➡️ '}
                    {trend.trend === 'up' ? 'Hausse' : trend.trend === 'down' ? 'Baisse' : 'Stable'}
                    {trend.percentage !== 0 && ` (${trend.percentage > 0 ? '+' : ''}${trend.percentage}%)`}
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
                ) : chartData ? (
                  <div className="chart-placeholder">
                    <h4>📊 Évolution des Prix (30 derniers jours)</h4>
                    <div className="chart-mock">
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-color legend-x1"></span>
                          <span>Prix x1</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color legend-x10"></span>
                          <span>Prix x10</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color legend-x100"></span>
                          <span>Prix x100</span>
                        </div>
                      </div>
                      <div className="chart-area">
                        <p>📊 Chart sera intégré ici avec Chart.js</p>
                        <div className="price-summary">
                          <div className="price-stat">
                            <span>Prix actuel x1:</span>
                            <strong>{formatPrice(priceHistory[priceHistory.length - 1]?.price_x1)}</strong>
                          </div>
                          <div className="price-stat">
                            <span>Prix actuel x10:</span>
                            <strong>{formatPrice(priceHistory[priceHistory.length - 1]?.price_x10)}</strong>
                          </div>
                          <div className="price-stat">
                            <span>Prix actuel x100:</span>
                            <strong>{formatPrice(priceHistory[priceHistory.length - 1]?.price_x100)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <p>Aucune donnée disponible pour cet item sur ce serveur</p>
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
