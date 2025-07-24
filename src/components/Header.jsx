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
          {/* Toggle métiers stylé */}
          <div className="profession-verification-toggle">
            <input
              type="checkbox"
              id="checkProfessionLevels"
              checked={checkProfessionLevels}
              onChange={(e) => setCheckProfessionLevels(e.target.checked)}
              className="verification-checkbox"
            />
            <label htmlFor="checkProfessionLevels" className="verification-label">
              <div className="verification-switch">
                <div className="verification-slider">
                  <span className="slider-icon">{checkProfessionLevels ? '⚒️' : '❌'}</span>
                </div>
              </div>
              <div className="verification-text">
                <span className="verification-title">Activer la vérification métier pour le craft</span>
                <span className="verification-subtitle">
                  {checkProfessionLevels ? 'Vérifie automatiquement vos niveaux' : 'Aucune vérification des niveaux'}
                </span>
              </div>
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
