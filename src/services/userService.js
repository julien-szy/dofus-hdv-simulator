// Service pour gérer les utilisateurs et leurs données

class UserService {
  constructor() {
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database';
    this.currentUser = null;
    this.loadUserFromStorage();
  }

  // Charger l'utilisateur depuis le localStorage
  loadUserFromStorage() {
    const userData = localStorage.getItem('dofus_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  // Sauvegarder l'utilisateur dans le localStorage
  saveUserToStorage(user) {
    this.currentUser = user;
    localStorage.setItem('dofus_user', JSON.stringify(user));
  }

  // Supprimer l'utilisateur du localStorage
  clearUserFromStorage() {
    this.currentUser = null;
    localStorage.removeItem('dofus_user');
  }

  // Initialiser les tables de la base de données
  async initializeDatabase() {
    try {
      const response = await fetch(`${this.baseUrl}?action=init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Database initialized:', result.message);
      return result;
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      // Fallback vers le mode local storage
      console.log('🔄 Fallback to local storage mode');
      return { success: true, message: 'Local storage fallback' };
    }
  }

  // Connexion utilisateur
  async loginUser(email, username = null, password = null) {
    try {
      // D'abord essayer de récupérer l'utilisateur de la BDD
      let user = await this.getUser(email);

      if (!user) {
        // Créer un nouvel utilisateur
        user = await this.createUser({
          email,
          username: username || email.split('@')[0]
        });
        console.log('✅ Nouvel utilisateur créé:', user.username);
      } else {
        console.log('✅ Utilisateur existant connecté:', user.username);
      }

      this.saveUserToStorage(user);
      return user;
    } catch (error) {
      console.error('❌ Error logging in user:', error);

      // Fallback vers le mode local storage
      console.log('🔄 Fallback to local storage mode');
      let user = this.getLocalUser(email);

      if (!user) {
        user = this.createLocalUser({
          email,
          username: username || email.split('@')[0]
        });
      }

      this.saveUserToStorage(user);
      return user;
    }
  }

  // Récupérer un utilisateur local
  getLocalUser(email) {
    const users = JSON.parse(localStorage.getItem('dofus_users') || '{}');
    return users[email] || null;
  }

  // Créer un utilisateur local
  createLocalUser(userData) {
    const users = JSON.parse(localStorage.getItem('dofus_users') || '{}');
    const user = {
      id: Date.now(), // ID simple basé sur timestamp
      email: userData.email,
      username: userData.username,
      created_at: new Date().toISOString()
    };

    users[userData.email] = user;
    localStorage.setItem('dofus_users', JSON.stringify(users));

    return user;
  }

  // Déconnexion
  logout() {
    this.clearUserFromStorage();
  }

  // Récupérer un utilisateur par email
  async getUser(email) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_user&email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('❌ Error getting user from database:', error);
      // Fallback vers le localStorage
      return this.getLocalUser(email);
    }
  }

  // Créer un nouvel utilisateur
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=create_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();
      return user;
    } catch (error) {
      console.error('❌ Error creating user in database:', error);
      // Fallback vers le localStorage
      return this.createLocalUser(userData);
    }
  }

  // Récupérer les favoris de l'utilisateur actuel (local storage)
  async getFavorites() {
    if (!this.currentUser) {
      return [];
    }

    try {
      const favorites = JSON.parse(localStorage.getItem(`dofus_favorites_${this.currentUser.id}`) || '[]');
      return favorites;
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Ajouter un favori (local storage)
  async addFavorite(itemId, itemName) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const favorites = await this.getFavorites();
      const newFavorite = {
        id: Date.now(),
        user_id: this.currentUser.id,
        item_id: itemId,
        item_name: itemName,
        created_at: new Date().toISOString()
      };

      // Vérifier si déjà en favori
      if (!favorites.some(fav => fav.item_id === itemId)) {
        favorites.push(newFavorite);
        localStorage.setItem(`dofus_favorites_${this.currentUser.id}`, JSON.stringify(favorites));
      }

      return newFavorite;
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  // Supprimer un favori (local storage)
  async removeFavorite(itemId) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(fav => fav.item_id !== itemId);
      localStorage.setItem(`dofus_favorites_${this.currentUser.id}`, JSON.stringify(updatedFavorites));

      return { success: true };
    } catch (error) {
      console.error('Error removing favorite:', error);
      throw error;
    }
  }

  // Vérifier si un objet est en favori
  async isFavorite(itemId) {
    const favorites = await this.getFavorites();
    return favorites.some(fav => fav.item_id === itemId);
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    return this.currentUser;
  }

  // Vérifier si l'utilisateur est connecté
  isLoggedIn() {
    return this.currentUser !== null;
  }
}

// Instance singleton
export const userService = new UserService();
export default userService;
