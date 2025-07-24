import { useState, useEffect } from 'react'
import { getAllStoredPrices, removeMaterialPrice, clearAllPrices, exportPrices, importPrices } from '../services/priceStorage.js'

const PriceManager = ({ isOpen, onClose }) => {
  const [storedPrices, setStoredPrices] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadPrices()
    }
  }, [isOpen])

  const loadPrices = () => {
    const prices = getAllStoredPrices()
    setStoredPrices(prices)
  }

  const handleRemovePrice = (materialId) => {
    if (confirm('Supprimer ce prix stocké ?')) {
      removeMaterialPrice(materialId)
      loadPrices()
    }
  }



  const handleExport = () => {
    exportPrices()
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          importPrices(e.target.result)
          loadPrices()
          alert('Prix importés avec succès !')
        } catch (error) {
          alert('Erreur lors de l\'importation : ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const filteredPrices = Object.entries(storedPrices).filter(([materialId, prices]) =>
    materialId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatPrice = (price) => {
    return price > 0 ? price.toLocaleString() + ' K' : '-'
  }

  if (!isOpen) return null

  return (
    <div className="price-manager-modal">
      <div className="price-manager-content">
        <div className="price-manager-header">
          <h3>💰 Gestionnaire de Prix</h3>
          <button onClick={onClose} className="price-manager-close">✕</button>
        </div>

        <div className="price-manager-body">
          <div className="price-manager-stats">
            <div className="price-stat">
              <span className="price-stat-label">📦 Matériaux avec prix</span>
              <span className="price-stat-value">{Object.keys(storedPrices).length}</span>
            </div>
          </div>

          <div className="price-manager-actions">
            <div className="price-search">
              <input
                type="text"
                placeholder="Rechercher un matériau..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="price-search-input"
              />
            </div>

            <div className="price-actions">
              <button onClick={handleExport} className="btn btn-secondary">
                📤 Exporter
              </button>
              <label className="btn btn-secondary">
                📥 Importer
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="price-list">
            {filteredPrices.length === 0 ? (
              <div className="price-empty">
                {searchTerm ? 'Aucun matériau trouvé' : 'Aucun prix stocké'}
              </div>
            ) : (
              <div className="price-table">
                <div className="price-table-header">
                  <div>Matériau ID</div>
                  <div>Prix x1</div>
                  <div>Prix x10</div>
                  <div>Prix x100</div>
                  <div>Actions</div>
                </div>
                {filteredPrices.map(([materialId, prices]) => (
                  <div key={materialId} className="price-table-row">
                    <div className="price-material-id">{materialId}</div>
                    <div className="price-value">{formatPrice(prices.price_1)}</div>
                    <div className="price-value">{formatPrice(prices.price_10)}</div>
                    <div className="price-value">{formatPrice(prices.price_100)}</div>
                    <div className="price-actions">
                      <button
                        onClick={() => handleRemovePrice(materialId)}
                        className="btn btn-danger btn-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="price-manager-info">
            <p>
              <strong>💡 Info :</strong><br/>
              • Les prix sont automatiquement sauvegardés<br/>
              • Ils se mettent à jour dans tous les calculs<br/>
              • Connectez-vous pour synchroniser vos données<br/>
              • Exportez régulièrement pour faire des sauvegardes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceManager
