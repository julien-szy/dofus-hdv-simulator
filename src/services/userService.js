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
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize database');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Connexion utilisateur (simulation - en attendant l'auth)
  async loginUser(email, username = null) {
    try {
      // Vérifier si l'utilisateur existe
      let user = await this.getUser(email);
      
      if (!user) {
        // Créer un nouvel utilisateur
        user = await this.createUser({
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

  // Déconnexion
  logout() {
    this.clearUserFromStorage();
  }

  // Récupérer un utilisateur par email
  async getUser(email) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_user&email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Créer un nouvel utilisateur
  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=create_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Récupérer les favoris de l'utilisateur actuel
  async getFavorites() {
    if (!this.currentUser) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=get_favorites&user_id=${this.currentUser.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to get favorites');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Ajouter un favori
  async addFavorite(itemId, itemName) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=add_favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.currentUser.id,
          item_id: itemId,
          item_name: itemName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add favorite');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  }

  // Supprimer un favori
  async removeFavorite(itemId) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const response = await fetch(`${this.baseUrl}?action=remove_favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: this.currentUser.id,
          item_id: itemId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }
      
      return await response.json();
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
