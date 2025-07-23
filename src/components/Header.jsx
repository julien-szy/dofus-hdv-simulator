import { useState } from 'react'
import UserAuth from './UserAuth.jsx'
import CacheStats from './CacheStats.jsx'

const Header = ({
  setShowProfessionModal,
  setShowPriceManager,
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

        {/* Navigation principale */}
        <nav className="header-nav">
          <div className="nav-links">
            <a href="#" className="nav-link active">
              <span className="nav-icon">🏠</span>
              <span>Accueil</span>
            </a>
            <a href="#" className="nav-link disabled" title="Bientôt disponible !">
              <span className="nav-icon">📊</span>
              <span>Statistiques</span>
            </a>
            <a href="#" className="nav-link disabled" title="Bientôt disponible !">
              <span className="nav-icon">📈</span>
              <span>Tendances</span>
            </a>
          </div>
        </nav>

        {/* Contrôles utilisateur */}
        <div className="header-controls">
          {/* Toggle métiers */}
          <div className="profession-toggle-modern">
            <input
              type="checkbox"
              id="checkProfessionLevels"
              checked={checkProfessionLevels}
              onChange={(e) => setCheckProfessionLevels(e.target.checked)}
              className="toggle-checkbox"
            />
            <label htmlFor="checkProfessionLevels" className="toggle-label">
              <span className="toggle-text">Vérifier métiers</span>
              <div className="toggle-switch">
                <div className="toggle-slider"></div>
              </div>
            </label>
          </div>

          {/* Bouton Métiers moderne */}
          <button
            className="btn-modern btn-professions"
            onClick={() => setShowProfessionModal(true)}
          >
            <span className="btn-icon">🔧</span>
            <span className="btn-text">Mes Métiers</span>
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

          {/* Statistiques du cache */}
          <CacheStats />

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
