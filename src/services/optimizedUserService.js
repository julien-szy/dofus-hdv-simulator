// Service utilisateur optimisé - Gère uniquement les données dynamiques
// Remplace userService.js pour une BDD allégée

class OptimizedUserService {
  constructor() {
    this.baseUrl = '/.netlify/functions/database';
    this.currentUser = null;
  }

  // === GESTION UTILISATEUR ===
  async initializeDatabase() {
    try {
      const response = await fetch(`${this.baseUrl}?action=init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Base de données optimisée initialisée');
      return result;
    } catch (error) {
      console.error('❌ Erreur initialisation BDD:', error);
      return { success: true, message: 'Mode local storage' };
    }
  }

  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=create_user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);
      throw error;
    }
  }

  async getUser(email) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_user&email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = await response.json();
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('❌ Erreur récupération utilisateur:', error);
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // === FAVORIS ===
  async getFavorites(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_favorites&user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération favoris:', error);
      return [];
    }
  }

  async addFavorite(userId, itemId, itemName) {
    try {
      const response = await fetch(`${this.baseUrl}?action=add_favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, item_id: itemId, item_name: itemName })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur ajout favori:', error);
      throw error;
    }
  }

  async removeFavorite(userId, itemId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=remove_favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, item_id: itemId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur suppression favori:', error);
      throw error;
    }
  }

  // === CALCULS SAUVEGARDÉS ===
  async saveCalculation(calculationData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_calculation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur sauvegarde calcul:', error);
      throw error;
    }
  }

  async getCalculations(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_calculations&user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération calculs:', error);
      return [];
    }
  }

  async deleteCalculation(userId, calculationId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=delete_calculation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, calculation_id: calculationId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur suppression calcul:', error);
      throw error;
    }
  }

  // === PRIX DES MATÉRIAUX ===
  async saveMaterialPrice(priceData) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_material_price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur sauvegarde prix:', error);
      throw error;
    }
  }

  async getMaterialPrices(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_material_prices&user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération prix:', error);
      return [];
    }
  }

  // === MÉTIERS UTILISATEUR ===
  async saveProfession(userId, professionName, level) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_profession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, profession_name: professionName, level })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur sauvegarde métier:', error);
      throw error;
    }
  }

  async getProfessions(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_professions&user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération métiers:', error);
      return [];
    }
  }

  // === PARAMÈTRES UTILISATEUR ===
  async saveSetting(userId, key, value) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_setting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, setting_key: key, setting_value: value })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètre:', error);
      throw error;
    }
  }

  async getSettings(userId) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_settings&user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération paramètres:', error);
      return [];
    }
  }

  // === HISTORIQUE DE RECHERCHE ===
  async saveSearch(userId, searchTerm, itemId = null) {
    try {
      const response = await fetch(`${this.baseUrl}?action=save_search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, search_term: searchTerm, item_id: itemId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur sauvegarde recherche:', error);
      // Ne pas throw pour ne pas bloquer l'application
    }
  }

  async getSearchHistory(userId, limit = 10) {
    try {
      const response = await fetch(`${this.baseUrl}?action=get_search_history&user_id=${userId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur récupération historique:', error);
      return [];
    }
  }

  // === CONNEXION/DÉCONNEXION ===
  async loginUser(email, username, password) {
    try {
      // Essayer de récupérer l'utilisateur existant
      let user = await this.getUser(email);
      
      if (!user) {
        // Créer un nouvel utilisateur
        user = await this.createUser({
          email,
          username,
          server_preference: 'Ily',
          theme_preference: 'dark'
        });
      }

      // Sauvegarder en local storage pour la persistance
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUser = user;

      return user;
    } catch (error) {
      console.error('❌ Erreur connexion:', error);
      throw error;
    }
  }

  logoutUser() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // === STATISTIQUES UTILISATEUR ===
  async getUserStats(userId) {
    try {
      const [favorites, calculations, prices, professions, searches] = await Promise.all([
        this.getFavorites(userId),
        this.getCalculations(userId),
        this.getMaterialPrices(userId),
        this.getProfessions(userId),
        this.getSearchHistory(userId, 100)
      ]);

      return {
        favoritesCount: favorites.length,
        calculationsCount: calculations.length,
        pricesCount: prices.length,
        professionsCount: professions.length,
        searchesCount: searches.length,
        lastActivity: searches.length > 0 ? searches[0].created_at : null
      };
    } catch (error) {
      console.error('❌ Erreur statistiques utilisateur:', error);
      return {
        favoritesCount: 0,
        calculationsCount: 0,
        pricesCount: 0,
        professionsCount: 0,
        searchesCount: 0,
        lastActivity: null
      };
    }
  }
}

// Instance singleton
const optimizedUserService = new OptimizedUserService();

export default optimizedUserService; 