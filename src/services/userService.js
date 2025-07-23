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

  // Initialiser les tables de la base de données (local storage pour le moment)
  async initializeDatabase() {
    try {
      // Simuler une initialisation réussie
      console.log('Database initialized (local storage mode)');
      return { success: true, message: 'Local storage initialized' };
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Connexion utilisateur (local storage pour le moment)
  async loginUser(email, username = null) {
    try {
      // Simuler un délai de connexion
      await new Promise(resolve => setTimeout(resolve, 500));

      // Vérifier si l'utilisateur existe dans le localStorage
      let user = this.getLocalUser(email);

      if (!user) {
        // Créer un nouvel utilisateur local
        user = this.createLocalUser({
          email,
          username: username || email.split('@')[0]
        });
      }

      this.saveUserToStorage(user);
      return user;
    } catch (error) {
      console.error('Error logging in user:', error);
      throw error;
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

  // Récupérer un utilisateur par email (version locale)
  async getUser(email) {
    return this.getLocalUser(email);
  }

  // Créer un nouvel utilisateur (version locale)
  async createUser(userData) {
    return this.createLocalUser(userData);
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
