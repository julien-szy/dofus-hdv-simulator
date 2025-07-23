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
      <div style={{ textAlign: 'center', padding: '20px', color: '#f4e4bc' }}>
        Recherche en cours...
      </div>
    )
  }

  if (searchResults.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ color: '#b8860b', marginBottom: '10px' }}>Résultats de recherche:</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {searchResults.map((item, index) => (
          <div
            key={index}
            onClick={() => selectItem(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px',
              background: 'rgba(139, 105, 20, 0.2)',
              borderRadius: '5px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(139, 105, 20, 0.4)'
              e.target.style.borderColor = '#8b6914'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(139, 105, 20, 0.2)'
              e.target.style.borderColor = 'transparent'
            }}
          >
            {item.image_urls && (
              <img
                src={item.image_urls.icon}
                alt={item.name}
                style={{ width: '32px', height: '32px' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#f4e4bc' }}>{item.name}</div>
              <div style={{ fontSize: '0.9em', color: '#ccc' }}>
                Niveau {item.level} - {item.type.name}
              </div>
              {(() => {
                const status = getCraftStatus(item, playerProfessions, checkProfessionLevels)
                return (
                  <div style={{ fontSize: '0.8em', marginTop: '2px' }}>
                    <span style={{ 
                      color: status.status === 'check_disabled' ? '#ffc107' : 
                             status.canCraft ? '#4caf50' : '#f44336'
                    }}>
                      🔧 {status.message}
                    </span>
                  </div>
                )
              })()}
            </div>
            <div style={{ marginLeft: '10px' }}>
              {(() => {
                const status = getCraftStatus(item, playerProfessions, checkProfessionLevels)
                if (status.status === 'check_disabled') {
                  return <span style={{ color: '#ffc107', fontSize: '1.2em' }}>⚠️</span>
                }
                return status.canCraft ? (
                  <span style={{ color: '#4caf50', fontSize: '1.2em' }}>✅</span>
                ) : (
                  <span style={{ color: '#f44336', fontSize: '1.2em' }}>❌</span>
                )
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SearchResults
