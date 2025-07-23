import { DOFUS_PROFESSIONS } from '../data/professions.js'

const ProfessionModal = ({
  showModal,
  setShowModal,
  playerProfessions,
  updateProfessionLevel
}) => {
  if (!showModal) return null

  // Fermer la modal en cliquant dehors
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false)
    }
  }

  // Fermer avec Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowModal(false)
    }
  }

  return (
    <div
      className="profession-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="profession-modal">
        <div className="profession-modal-header">
          <h2>🔧 Gestion de vos Métiers</h2>
          <button
            className="modal-close-btn"
            onClick={() => setShowModal(false)}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <p className="profession-modal-subtitle">
          Indiquez vos niveaux de métiers pour voir quels objets vous pouvez crafter
        </p>

        <div className="professions-grid">
          {Object.entries(DOFUS_PROFESSIONS).map(([professionName, profession]) => (
            <div key={profession.id} className="profession-item">
              <div className="profession-info">
                <span className="profession-name">{profession.name}</span>
                <span className="profession-emoji">⚒️</span>
              </div>
              <div className="profession-level">
                <label htmlFor={`level-${professionName}`}>Niveau</label>
                <input
                  id={`level-${professionName}`}
                  type="number"
                  min="0"
                  max="200"
                  value={playerProfessions[professionName] || ''}
                  onChange={(e) => updateProfessionLevel(professionName, e.target.value)}
                  placeholder="0"
                  className="level-input"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="profession-modal-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(false)}
          >
            ✅ Sauvegarder et Fermer
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir remettre tous vos métiers à 0 ?')) {
                Object.keys(DOFUS_PROFESSIONS).forEach(profession => {
                  updateProfessionLevel(profession, 0)
                })
              }
            }}
          >
            🗑️ Tout Remettre à 0
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfessionModal
