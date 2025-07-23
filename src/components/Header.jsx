import UserAuth from './UserAuth.jsx'

const Header = ({
  setShowProfessionModal,
  checkProfessionLevels,
  setCheckProfessionLevels
}) => {
  return (
    <div className="hdv-header">
      <div className="header-controls">
        <div>
          <h1 className="hdv-title">⚒️ Calculateur de Craft Dofus</h1>
          <p className="hdv-subtitle">Calculez la rentabilité de vos crafts avec les vraies recettes (DofusDude API)</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          <UserAuth />

          <button
            className="btn btn-primary"
            onClick={() => setShowProfessionModal(true)}
            style={{ height: 'fit-content' }}
          >
            🔧 Mes Métiers
          </button>

          <div className="profession-toggle">
            <input
              type="checkbox"
              id="checkProfessionLevels"
              checked={checkProfessionLevels}
              onChange={(e) => setCheckProfessionLevels(e.target.checked)}
            />
            <label htmlFor="checkProfessionLevels">
              Vérifier les niveaux de métiers
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
