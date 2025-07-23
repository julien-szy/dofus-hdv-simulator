import { useState, useEffect } from 'react';
import userService from '../services/userService';

export default function UserAuth() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Initialiser la base de données d'abord
      await userService.initializeDatabase();
      
      // Connecter l'utilisateur
      const loggedUser = await userService.loginUser(email, username);
      setUser(loggedUser);
      setShowLogin(false);
      setEmail('');
      setUsername('');
    } catch (err) {
      setError('Erreur lors de la connexion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    userService.logout();
    setUser(null);
  };

  if (user) {
    return (
      <div className="user-auth">
        <div className="user-info">
          <span className="user-welcome">
            👋 Salut, <strong>{user.username}</strong>
          </span>
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-auth">
      {!showLogin ? (
        <button 
          onClick={() => setShowLogin(true)}
          className="login-btn"
        >
          🔑 Se connecter
        </button>
      ) : (
        <div className="login-form">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nom d'utilisateur (optionnel)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading || !email}
                className="submit-btn"
              >
                {loading ? '⏳ Connexion...' : '✅ Se connecter'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setError('');
                  setEmail('');
                  setUsername('');
                }}
                disabled={loading}
                className="cancel-btn"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
