import { useState } from 'react'
import UserAuth from './UserAuth.jsx'
import CacheStats from './CacheStats.jsx'
import userService from '../services/userService.js'

const Header = ({
  setShowPriceManager,
  setShowPriceTrends,
  setShowDataImporter,
  setShowNetlifyExtractor,
  checkProfessionLevels,
  setCheckProfessionLevels
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    const user = userService.getCurrentUser()
    if (!user) return false

    // Liste des admins autorisés
    const adminUsernames = ['Snoopiisz', 'snoopiisz'] // Ajouter d'autres admins ici
    return adminUsernames.includes(user.username)
  }

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

          {/* Bouton Extracteur Netlify (visible seulement pour admins) */}
          {isAdmin() && (
            <button
              className="btn-modern btn-netlify"
              onClick={() => setShowNetlifyExtractor(true)}
            >
              <span className="btn-icon">🌐</span>
              <span className="btn-text">Extract</span>
              <div className="btn-glow"></div>
            </button>
          )}

          {/* Bouton Admin (visible seulement pour Snoopiisz et admins) */}
          {isAdmin() && (
            <button
              className="btn-modern btn-admin"
              onClick={() => setShowDataImporter(true)}
              title="Administration - Gestion des données DofusDB"
            >
              <span className="btn-icon">🔧</span>
              <span className="btn-text">Admin</span>
              <div className="btn-glow"></div>
            </button>
          )}

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
