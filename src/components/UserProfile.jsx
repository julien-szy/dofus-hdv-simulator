import { useState, useEffect } from 'react'
import { DOFUS_PROFESSIONS } from '../data/professions.js'
import userService from '../services/userService.js'
import syncService from '../services/syncService.js'

const DOFUS_SERVERS = {
  pioneers: {
    name: 'Serveurs Pionniers',
    servers: ['Dakal', 'Mikhal', 'Kourial']
  },
  historical: {
    name: 'Serveurs Historiques', 
    servers: ['Draconiros', 'Imagiro', 'Orukam', 'Hell Mina', 'Tylezia', 'Tal Kasha', 'Ombre']
  }
}

const AVATAR_OPTIONS = [
  '⚒️', '🛡️', '⚔️', '🏹', '🔮', '💎', '🌟', '🔥', '❄️', '⚡', '🌿', '🌙'
]

const UserProfile = ({
  isOpen,
  onClose,
  playerProfessions,
  updateProfessionLevel
}) => {
  const [user, setUser] = useState(null)
  const [avatar, setAvatar] = useState('⚒️')
  const [server, setServer] = useState('')
  const [budget, setBudget] = useState(0)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [activeTab, setActiveTab] = useState('character')

  useEffect(() => {
    const currentUser = userService.getCurrentUser()
    setUser(currentUser)
    
    // Charger les données du profil depuis localStorage
    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}')
    setAvatar(savedProfile.avatar || '⚒️')
    setServer(savedProfile.server || '')
    setBudget(savedProfile.budget || 0)
  }, [isOpen])

  const saveProfile = async () => {
    const profileData = { avatar, server, budget }
    localStorage.setItem('userProfile', JSON.stringify(profileData))
    
    // Sync avec la BDD si connecté
    if (user) {
      try {
        await syncService.syncProfessions(playerProfessions)
        console.log('✅ Profil sauvegardé')
      } catch (error) {
        console.error('❌ Erreur sauvegarde profil:', error)
      }
    }
  }

  const handleClose = () => {
    saveProfile()
    onClose()
  }

  const formatPrice = (price) => {
    if (!price) return '0 K'
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M K`
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K K`
    return `${price} K`
  }

  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="profile-modal">
        {/* Header */}
        <div className="profile-modal-header">
          <h2>📋 Fiche de Personnage</h2>
          <button onClick={handleClose} className="modal-close-btn">✕</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'character' ? 'active' : ''}`}
            onClick={() => setActiveTab('character')}
          >
            👤 Personnage
          </button>
          <button
            className={`profile-tab ${activeTab === 'professions' ? 'active' : ''}`}
            onClick={() => setActiveTab('professions')}
          >
            ⚒️ Métiers
          </button>
        </div>

        {/* Content */}
        <div className="profile-content">
          {activeTab === 'character' && (
            <div className="character-sheet">
              {/* Avatar Section */}
              <div className="character-avatar-section">
                <div className="character-avatar-container">
                  <div 
                    className="character-avatar-large"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  >
                    {avatar}
                  </div>
                  <button 
                    className="avatar-edit-btn"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  >
                    ✏️
                  </button>
                </div>
                
                {showAvatarPicker && (
                  <div className="avatar-picker">
                    {AVATAR_OPTIONS.map(option => (
                      <button
                        key={option}
                        className={`avatar-option ${avatar === option ? 'selected' : ''}`}
                        onClick={() => {
                          setAvatar(option)
                          setShowAvatarPicker(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Character Info */}
              <div className="character-info">
                <div className="info-field">
                  <label>👤 Pseudo</label>
                  <div className="info-value">{user?.username || 'Inconnu'}</div>
                </div>

                <div className="info-field">
                  <label>🌍 Serveur Dofus</label>
                  <select 
                    value={server} 
                    onChange={(e) => setServer(e.target.value)}
                    className="server-select"
                  >
                    <option value="">Choisir un serveur...</option>
                    <optgroup label={DOFUS_SERVERS.pioneers.name}>
                      {DOFUS_SERVERS.pioneers.servers.map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </optgroup>
                    <optgroup label={DOFUS_SERVERS.historical.name}>
                      {DOFUS_SERVERS.historical.servers.map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="info-field">
                  <label>💰 Budget d'investissement</label>
                  <div className="budget-input-container">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="budget-input"
                      min="0"
                      step="1000"
                    />
                    <span className="budget-unit">K</span>
                    <div className="budget-display">{formatPrice(budget)}</div>
                  </div>
                </div>

                <div className="info-field">
                  <label>📅 Membre depuis</label>
                  <div className="info-value">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Inconnu'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'professions' && (
            <div className="professions-sheet">
              <div className="professions-header">
                <h3>⚒️ Vos Métiers de Craft</h3>
                <p>Indiquez vos niveaux pour voir quels objets vous pouvez crafter</p>
              </div>

              <div className="professions-rpg-grid">
                {Object.entries(DOFUS_PROFESSIONS).map(([professionName, profession]) => (
                  <div key={profession.id} className="profession-rpg-item">
                    <div className="profession-icon">⚒️</div>
                    <div className="profession-details">
                      <div className="profession-name">{profession.name}</div>
                      <div className="profession-level-container">
                        <label>Niveau</label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={playerProfessions[professionName] || ''}
                          onChange={(e) => updateProfessionLevel(professionName, e.target.value)}
                          placeholder="0"
                          className="profession-level-input"
                        />
                        <div className="level-bar">
                          <div 
                            className="level-progress" 
                            style={{ width: `${Math.min((playerProfessions[professionName] || 0) / 200 * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="professions-actions">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm('Remettre tous vos métiers à 0 ?')) {
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
          )}


        </div>

        {/* Footer */}
        <div className="profile-modal-footer">
          <button onClick={handleClose} className="btn btn-primary">
            ✅ Sauvegarder et Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfile
