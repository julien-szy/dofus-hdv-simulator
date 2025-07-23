import { getCraftStatus } from '../utils/professionUtils.js'

const SearchResults = ({
  searchResults,
  loading,
  selectItem,
  playerProfessions,
  checkProfessionLevels
}) => {
  if (loading) {
    return (
      <div className="search-loading">
        <div className="loading-spinner"></div>
        <span>Recherche en cours...</span>
      </div>
    )
  }

  if (searchResults.length === 0) {
    return null
  }

  return (
    <div className="search-results-container">
      <div className="search-results-header">
        <h3>🔍 Résultats de recherche</h3>
        <span className="results-count">{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</span>
      </div>

      <div className="search-results-grid">
        {searchResults.map((item, index) => {
          const status = getCraftStatus(item, playerProfessions, checkProfessionLevels)

          return (
            <div
              key={index}
              onClick={() => selectItem(item)}
              className="search-result-card"
            >
              <div className="item-icon-container">
                {item.image_urls && (
                  <img
                    src={item.image_urls.icon}
                    alt={item.name}
                    className="item-icon"
                  />
                )}
                <div className={`craft-status-badge ${status.status}`}>
                  {status.status === 'check_disabled' ? '⚠️' :
                   status.canCraft ? '✅' : '❌'}
                </div>
              </div>

              <div className="item-info-container">
                <div className="item-name">{item.name}</div>
                <div className="item-meta">
                  <span className="item-level">Niv. {item.level}</span>
                  <span className="item-separator">•</span>
                  <span className="item-type">{item.type.name}</span>
                </div>
                <div className={`craft-status-text ${status.status}`}>
                  {status.message}
                </div>
              </div>

              <div className="item-action">
                <div className="select-arrow">→</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SearchResults
