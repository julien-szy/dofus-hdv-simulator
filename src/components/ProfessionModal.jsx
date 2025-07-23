import { DOFUS_PROFESSIONS } from '../data/professions.js'

const ProfessionModal = ({ 
  showModal, 
  setShowModal, 
  playerProfessions, 
  updateProfessionLevel 
}) => {
  if (!showModal) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #2c1810 0%, #4a2c1a 100%)',
        border: '3px solid #8b6914',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: '#b8860b', marginBottom: '20px', textAlign: 'center' }}>
          🔧 Gestion de vos Métiers
        </h2>
        
        <p style={{ color: '#f4e4bc', marginBottom: '20px', textAlign: 'center' }}>
          Indiquez vos niveaux de métiers pour voir quels objets vous pouvez crafter
        </p>

        <div style={{ display: 'grid', gap: '15px', marginBottom: '30px' }}>
          {Object.entries(DOFUS_PROFESSIONS).map(([professionName, profession]) => (
            <div key={profession.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '10px',
              background: 'rgba(139, 105, 20, 0.2)',
              borderRadius: '8px',
              border: '1px solid #8b6914'
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#f4e4bc', fontWeight: 'bold' }}>
                  {profession.name}
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#ccc', fontSize: '0.9em' }}>Niveau:</span>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={playerProfessions[professionName] || ''}
                  onChange={(e) => updateProfessionLevel(professionName, e.target.value)}
                  placeholder="0"
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '2px solid #8b6914',
                    borderRadius: '5px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#f4e4bc',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(false)}
          >
            Sauvegarder et Fermer
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
            Tout Remettre à 0
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfessionModal
