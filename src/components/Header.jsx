import { useState } from 'react'
import UserAuth from './UserAuth.jsx'
import CacheStats from './CacheStats.jsx'

const Header = ({
  setShowPriceManager,
  setShowPriceTrends,
  checkProfessionLevels,
  setCheckProfessionLevels
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="hdv-header">
      <div className="header-content">
        {/* Logo et titre */}
        <div className="header-brand">
          <div className="brand-logo">
            <div className="logo-icon">⚒️</div>
            <div className="brand-text">
              <h1 className="hdv-title">Dofus HDV</h1>
              <p className="hdv-subtitle">Calculator Pro</p>
            </div>
          </div>
        </div>



        {/* Contrôles utilisateur */}
        <div className="header-controls">
          {/* Toggle métiers compact */}
          <div className="profession-toggle-compact">
            <input
              type="checkbox"
              id="checkProfessionLevels"
              checked={checkProfessionLevels}
              onChange={(e) => setCheckProfessionLevels(e.target.checked)}
              className="compact-checkbox"
            />
            <label htmlFor="checkProfessionLevels" className="compact-label" title="Activer la vérification métier pour le craft">
              <div className="compact-switch">
                <div className="compact-slider">
                  <span className="compact-icon">{checkProfessionLevels ? '⚒️' : '❌'}</span>
                </div>
              </div>
              <span className="compact-text">Vérifier métiers</span>
            </label>
          </div>

          {/* Bouton Tendances */}
          <button
            className="btn-modern btn-trends"
            onClick={() => setShowPriceTrends(true)}
          >
            <span className="btn-icon">📈</span>
            <span className="btn-text">Tendances</span>
            <div className="btn-glow"></div>
          </button>

          {/* Bouton Gestionnaire de Prix */}
          <button
            className="btn-modern btn-prices"
            onClick={() => setShowPriceManager(true)}
          >
            <span className="btn-icon">💰</span>
            <span className="btn-text">Prix</span>
            <div className="btn-glow"></div>
          </button>

          {/* Authentification */}
          <div className="auth-container">
            <UserAuth />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
