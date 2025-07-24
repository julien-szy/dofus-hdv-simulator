import { getCraftStatus } from '../utils/professionUtils.js'
import { getOptimalPrice, calculateCraftCost } from '../utils/craftCalculations.js'
import { formatKamas } from '../utils/formatters.js'

const RecipeDisplay = ({
  selectedItem,
  editingCalculation,
  playerProfessions,
  checkProfessionLevels,
  materialPrices,
  updateMaterialPrice,
  addCraftCalculation,
  updateCraftCalculation,
  cancelEditing
}) => {
  if (!selectedItem) return null

  return (
    <div className="item-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#b8860b', margin: 0 }}>
          {editingCalculation ? '✏️ Modification: ' : 'Recette: '}{selectedItem.name}
        </h2>
        {selectedItem.recipe_profession && (() => {
          const status = getCraftStatus(selectedItem, playerProfessions, checkProfessionLevels)
          const bgColor = status.status === 'check_disabled' ? 'rgba(255, 193, 7, 0.2)' :
                          status.canCraft ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'
          const borderColor = status.status === 'check_disabled' ? '#ffc107' :
                             status.canCraft ? '#4caf50' : '#f44336'
          const textColor = status.status === 'check_disabled' ? '#ffc107' :
                           status.canCraft ? '#4caf50' : '#f44336'
          
          return (
            <div className="craft-status" style={{
              background: bgColor,
              borderColor: borderColor,
              color: textColor
            }}>
              {status.status === 'check_disabled' ? '⚠️' : status.canCraft ? '✅' : '❌'} {status.message}
              {status.status === 'level_too_low' && (
                <div style={{ fontSize: '0.8em', marginTop: '2px' }}>
                  Niveau requis: {status.requiredLevel} | Votre niveau: {status.playerLevel}
                </div>
              )}
              {status.status === 'check_disabled' && (
                <div style={{ fontSize: '0.8em', marginTop: '2px' }}>
                  Vérification des niveaux désactivée
                </div>
              )}
            </div>
          )
        })()}
      </div>
      
      {editingCalculation && (
        <div className="edit-mode-warning">
          <strong>⚠️ Mode édition</strong> - Vous modifiez un calcul existant. Les prix actuels sont pré-remplis.
        </div>
      )}

      {/* Informations de l'objet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {selectedItem.image_urls && (
            <img
              src={selectedItem.image_urls.icon}
              alt={selectedItem.name}
              style={{ width: '48px', height: '48px' }}
            />
          )}
          <div>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#f4e4bc' }}>
              {selectedItem.name}
            </div>
            <div style={{ color: '#ccc' }}>
              Niveau {selectedItem.level} - {selectedItem.type.name}
            </div>
          </div>
        </div>
      </div>

      {/* Matériaux nécessaires */}
      <h3 style={{ color: '#b8860b', marginBottom: '15px' }}>Matériaux nécessaires:</h3>
      <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
        {selectedItem.recipe.map((material, index) => (
          <div key={index} className="material-item">
            {material.image_urls && (
              <img
                src={material.image_urls.icon}
                alt={material.name}
                style={{ width: '32px', height: '32px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#f4e4bc' }}>
                {material.name} x{material.quantity}
              </div>
              <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                Niveau {material.level}
              </div>
            </div>
            <div className="material-prices">
              {/* Prix par unité */}
              <div className="price-input-row">
                <span className="price-label">Prix x1:</span>
                <input
                  type="number"
                  placeholder="Prix unitaire"
                  value={materialPrices[material.item_ankama_id]?.price_1 || ''}
                  onChange={(e) => updateMaterialPrice(material.item_ankama_id, e.target.value, 1)}
                  className="price-input"
                />
                <span style={{ color: '#f4e4bc', fontSize: '0.9em' }}>K</span>
              </div>

              {/* Prix par 10 */}
              <div className="price-input-row">
                <span className="price-label">Prix x10:</span>
                <input
                  type="number"
                  placeholder="Prix pour 10"
                  value={materialPrices[material.item_ankama_id]?.price_10 || ''}
                  onChange={(e) => updateMaterialPrice(material.item_ankama_id, e.target.value, 10)}
                  className="price-input"
                />
                <span style={{ color: '#f4e4bc', fontSize: '0.9em' }}>K</span>
                {materialPrices[material.item_ankama_id]?.price_10 && (
                  <span style={{ color: '#ccc', fontSize: '0.8em' }}>
                    ({((materialPrices[material.item_ankama_id].price_10 || 0) / 10).toFixed(1)}K/u)
                  </span>
                )}
              </div>

              {/* Prix par 100 */}
              <div className="price-input-row">
                <span className="price-label">Prix x100:</span>
                <input
                  type="number"
                  placeholder="Prix pour 100"
                  value={materialPrices[material.item_ankama_id]?.price_100 || ''}
                  onChange={(e) => updateMaterialPrice(material.item_ankama_id, e.target.value, 100)}
                  className="price-input"
                />
                <span style={{ color: '#f4e4bc', fontSize: '0.9em' }}>K</span>
                {materialPrices[material.item_ankama_id]?.price_100 && (
                  <span style={{ color: '#ccc', fontSize: '0.8em' }}>
                    ({((materialPrices[material.item_ankama_id].price_100 || 0) / 100).toFixed(1)}K/u)
                  </span>
                )}
              </div>

              {/* Affichage du meilleur prix avec stratégie */}
              {(() => {
                const optimal = getOptimalPrice(materialPrices, material.item_ankama_id, material.quantity)
                if (optimal.unitPrice > 0) {
                  return (
                    <div className="optimal-price">
                      <div>✓ Optimal: {(optimal.unitPrice || 0).toFixed(1)}K/u (par {optimal.buyType}) = {(optimal.totalCost || 0).toFixed(0)}K total</div>
                      <div style={{ fontSize: '0.9em', color: '#81c784', marginTop: '2px' }}>
                        💡 {optimal.strategy}
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Coût total et prix de vente */}
      <div className="form-row">
        <div className="form-group">
          <label>Coût total du craft</label>
          <div className="cost-summary">
            <div style={{ marginBottom: '10px' }}>
              Coût total: {formatKamas(calculateCraftCost(selectedItem, materialPrices).totalCost)}
            </div>
            
            {/* Détail des coûts optimaux */}
            <div className="cost-breakdown">
              {calculateCraftCost(selectedItem, materialPrices).breakdown.map((item, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {item.name}: {item.quantity} × {(item.unitPrice || 0).toFixed(1)}K = {(item.totalCost || 0).toFixed(0)}K
                  {item.buyType > 1 && (
                    <span style={{ color: '#4caf50' }}> (par {item.buyType})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="sellPrice">Prix de vente unitaire (K)</label>
          <input
            type="number"
            id="sellPrice"
            placeholder="Prix de vente à l'HDV"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quantity">Quantité à crafter</label>
          <input
            type="number"
            id="quantity"
            defaultValue="1"
            min="1"
          />
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={editingCalculation ? updateCraftCalculation : addCraftCalculation}
        >
          {editingCalculation ? 'Mettre à jour le calcul' : 'Calculer la rentabilité'}
        </button>
        
        {editingCalculation && (
          <button 
            className="btn btn-danger" 
            onClick={cancelEditing}
            style={{ marginLeft: '10px' }}
          >
            Annuler l'édition
          </button>
        )}
      </div>
    </div>
  )
}

export default RecipeDisplay
