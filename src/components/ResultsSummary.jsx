import { formatKamas } from '../utils/formatters.js'

const ResultsSummary = ({ 
  craftCalculations, 
  editCraftCalculation, 
  removeCraftCalculation 
}) => {
  if (craftCalculations.length === 0) return null

  // Calculs des totaux
  const totalProfit = craftCalculations.reduce((sum, calc) => sum + calc.profit, 0)
  const totalInvestment = craftCalculations.reduce((sum, calc) => sum + (calc.craftCost * calc.quantity), 0)
  const totalRevenue = craftCalculations.reduce((sum, calc) => sum + (calc.netSellPrice * calc.quantity), 0)
  const totalTax = craftCalculations.reduce((sum, calc) => sum + (calc.tax * calc.quantity), 0)
  const averageROI = totalInvestment > 0 ? (totalProfit / totalInvestment * 100) : 0

  return (
    <>
      <div className="results-container">
        <div className="result-card">
          <div className="result-title">Bénéfice Total</div>
          <div className={`result-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
            {formatKamas(totalProfit)}
          </div>
        </div>

        <div className="result-card">
          <div className="result-title">Coût Total Craft</div>
          <div className="result-value neutral">
            {formatKamas(totalInvestment)}
          </div>
        </div>

        <div className="result-card">
          <div className="result-title">Revenus Nets</div>
          <div className="result-value neutral">
            {formatKamas(totalRevenue)}
          </div>
        </div>

        <div className="result-card">
          <div className="result-title">Taxes HDV (2%)</div>
          <div className="result-value negative">
            {formatKamas(totalTax)}
          </div>
        </div>

        <div className="result-card">
          <div className="result-title">ROI Moyen</div>
          <div className={`result-value ${averageROI >= 0 ? 'positive' : 'negative'}`}>
            {averageROI.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="calculations-list">
        <h2 style={{ color: '#b8860b', marginBottom: '20px' }}>Détail des calculs</h2>
        <div>
          {craftCalculations.map(calc => (
            <div key={calc.id} className="calculation-item">
              <div className="item-info">
                <div className="item-name">
                  {calc.item.image_urls && (
                    <img
                      src={calc.item.image_urls.icon}
                      alt={calc.item.name}
                      style={{ width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle' }}
                    />
                  )}
                  {calc.item.name}
                </div>
                <div className="item-details">
                  Qté: {calc.quantity} |
                  Coût craft: {formatKamas(calc.craftCost)} |
                  Vente: {formatKamas(calc.sellPrice)} |
                  Net: {formatKamas(calc.netSellPrice)} |
                  Taxe: {formatKamas(calc.tax)} |
                  ROI: {calc.profitPercentage.toFixed(1)}%
                </div>
              </div>
              <div className={`item-profit ${calc.profit >= 0 ? 'positive' : 'negative'}`}>
                {formatKamas(calc.profit)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => editCraftCalculation(calc)}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Modifier
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => removeCraftCalculation(calc.id)}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ResultsSummary
