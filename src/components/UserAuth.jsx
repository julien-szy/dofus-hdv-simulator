import { useState, useEffect } from 'react';
import userService from '../services/userService';
import '../styles/UserAuth.css';

export default function UserAuth() {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
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

      // Connecter ou créer l'utilisateur
      const loggedUser = await userService.loginUser(email, username || email.split('@')[0]);
      setUser(loggedUser);
      setShowModal(false);
      setEmail('');
      setUsername('');
    } catch (err) {
      setError(isLogin ? 'Erreur lors de la connexion: ' + err.message : 'Erreur lors de l\'inscription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    userService.logout();
    setUser(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
    setEmail('');
    setUsername('');
  };

  if (user) {
    return (
      <div className="user-auth-container">
        <div className="user-profile">
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="user-name">{user.username}</span>
          <button
            onClick={handleLogout}
            className="logout-btn"
            title="Déconnexion"
          >
            🚪
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="auth-trigger-btn"
      >
        🔑 Se connecter
      </button>

      {showModal && (
        <div className="auth-modal-overlay" onClick={closeModal}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h2>{isLogin ? '🔑 Connexion' : '📝 Inscription'}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="auth-tabs">
              <button
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                Connexion
              </button>
              <button
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                Inscription
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>📧 Email</label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>👤 Nom d'utilisateur {!isLogin && '(optionnel)'}</label>
                <input
                  type="text"
                  placeholder={isLogin ? "Votre nom d'utilisateur" : "Comment vous appeler ?"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-message">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="submit-btn"
              >
                {loading ? (
                  <>⏳ {isLogin ? 'Connexion...' : 'Inscription...'}</>
                ) : (
                  <>{isLogin ? '🔑 Se connecter' : '📝 S\'inscrire'}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
