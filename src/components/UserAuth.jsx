import { useState, useEffect } from 'react';
import userService from '../services/userService';
import '../styles/UserAuth.css';

export default function UserAuth() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = connexion, false = inscription
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Charger l'utilisateur au démarrage
    const currentUser = userService.getCurrentUser();
    setUser(currentUser);

    // Initialiser la base de données si nécessaire
    if (currentUser) {
      userService.initializeDatabase().catch(console.error);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Initialiser la base de données d'abord
      await userService.initializeDatabase();

      // Connecter ou créer l'utilisateur selon le mode
      const loggedUser = await userService.loginUser(
        isLogin ? username + '@dofus.com' : email, // Email fictif pour connexion
        username,
        password
      );
      setUser(loggedUser);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(`Erreur lors de ${isLogin ? 'la connexion' : 'l\'inscription'}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');

    try {
      // Simuler une connexion sociale
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pour la démo, créer un utilisateur fictif
      const socialUser = {
        id: Date.now(),
        email: `user@${provider}.com`,
        username: `User${provider}`,
        provider: provider,
        created_at: new Date().toISOString()
      };

      await userService.initializeDatabase();
      userService.saveUserToStorage(socialUser);
      setUser(socialUser);
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(`Erreur lors de la connexion avec ${provider}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
  };

  const handleLogout = () => {
    userService.logout();
    setUser(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Fermer la modal en cliquant dehors
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  // Fermer avec Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  if (user) {
    return (
      <div className="user-profile-modern">
        <div className="user-avatar-modern">
          <div className="avatar-circle">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-status-dot"></div>
        </div>
        <div className="user-info">
          <span className="user-name-modern">{user.username}</span>
          <span className="user-status">En ligne</span>
        </div>
        <button
          onClick={handleLogout}
          className="logout-btn-modern"
          title="Déconnexion"
        >
          <span className="logout-icon">⚡</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-modern btn-login disabled"
        title="Bientôt disponible !"
        disabled
      >
        <span className="btn-icon">🔑</span>
        <span className="btn-text">Se connecter</span>
        <div className="btn-glow"></div>
      </button>

      {showModal && (
        <div
          className="auth-modal-overlay-modern"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="auth-modal-modern" onClick={(e) => e.stopPropagation()}>
            {/* Header clean */}
            <div className="auth-modal-header-clean">
              <div className="auth-welcome">
                <h2>Bienvenue sur Dofus HDV</h2>
                <p>Connectez-vous ou créez votre compte pour continuer</p>
              </div>
              <button className="modal-close-btn-clean" onClick={closeModal} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="auth-content">
              {/* Formulaire avec mode connexion/inscription */}
              <form onSubmit={handleSubmit} className="auth-form-clean">
                <div className="form-group">
                  <label>👤 {isLogin ? 'Pseudo' : 'Pseudo'}</label>
                  <input
                    type="text"
                    placeholder={isLogin ? 'Votre pseudo' : 'Choisissez votre pseudo'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="auth-input-clean"
                  />
                </div>

                <div className="form-group">
                  <label>🔒 Mot de passe</label>
                  <input
                    type="password"
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="auth-input-clean"
                  />
                </div>

                {/* Champ email uniquement pour l'inscription */}
                {!isLogin && (
                  <div className="form-group">
                    <label>📧 Adresse email</label>
                    <input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="auth-input-clean"
                    />
                  </div>
                )}

                {/* Options connexion */}
                {isLogin && (
                  <div className="login-options">
                    <label className="remember-me">
                      <input type="checkbox" />
                      <span>Se souvenir de moi</span>
                    </label>
                    <a href="#" className="forgot-password">Mot de passe oublié ?</a>
                  </div>
                )}

                {error && (
                  <div className="auth-error-clean">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Bouton principal */}
                <button
                  type="submit"
                  disabled={loading || !username || !password || (!isLogin && !email)}
                  className={`auth-submit-clean ${isLogin ? 'login-btn' : 'signup-btn'}`}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      <span>{isLogin ? 'Connexion...' : 'Inscription...'}</span>
                    </>
                  ) : (
                    <>
                      <span className="submit-icon">{isLogin ? '🔑' : '🚀'}</span>
                      <span>{isLogin ? 'Connexion' : 'Inscription'}</span>
                    </>
                  )}
                </button>

                {/* Bouton pour changer de mode */}
                <button
                  type="button"
                  onClick={switchMode}
                  className={`auth-switch-btn ${!isLogin ? 'login-btn' : 'signup-btn'}`}
                  disabled={loading}
                >
                  {!isLogin ? 'Connexion' : 'Inscription'}
                </button>

                {/* Footer simple */}
                <div className="auth-footer">
                  <p>En vous connectant, vous acceptez nos conditions d'utilisation</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
