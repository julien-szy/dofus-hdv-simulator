// Service de synchronisation entre cache local et BDD
import userService from './userService.js'

class SyncService {
  constructor() {
    this.baseUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database';
  }

  // Synchroniser les calculs de craft
  async syncCalculations(calculations) {
    const user = userService.getCurrentUser();
    if (!user) {
      return;
    }

    try {
      for (const calc of calculations) {
        await this.saveCalculation(calc);
      }
    } catch (error) {
      console.error('Erreur sync calculs:', error);
    }
  }

  async saveCalculation(calculation) {
    const user = userService.getCurrentUser();
    if (!user) return;

    try {
      const response = await fetch(`${this.baseUrl}?action=save_calculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: calculation.item?.ankama_id || 0,
          item_name: calculation.item?.name || 'Inconnu',
          sell_price: calculation.sellPrice || 0,
          quantity: calculation.quantity || 1,
          total_cost: calculation.totalCost || 0,
          total_revenue: calculation.totalRevenue || 0,
          profit: calculation.profit || 0,
          roi: calculation.roi || 0,
          calculation_data: calculation
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Erreur sauvegarde calcul:', error);
      throw error;
    }
  }

  async loadCalculations() {
    const user = userService.getCurrentUser();
    if (!user) return [];

    try {
      const response = await fetch(`${this.baseUrl}?action=get_calculations&user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const calculations = await response.json();

      
      // Transformer les données pour correspondre au format local
      return calculations.map(calc => {
        try {
          // Gérer le cas où calculation_data est déjà un objet ou une string
          let calculationData;
          if (typeof calc.calculation_data === 'string') {
            calculationData = JSON.parse(calc.calculation_data);
          } else if (typeof calc.calculation_data === 'object') {
            calculationData = calc.calculation_data;
          } else {
            console.warn('calculation_data invalide pour calcul:', calc.id);
            calculationData = { item: null, materialPrices: {} };
          }

          return {
            id: calc.id,
            item: calculationData.item || null,
            sellPrice: calc.sell_price,
            quantity: calc.quantity,
            totalCost: calc.total_cost,
            totalRevenue: calc.total_revenue,
            profit: calc.profit,
            roi: calc.roi,
            materialPrices: calculationData.materialPrices || {},
            timestamp: calc.created_at
          };
        } catch (error) {
          console.error(`Erreur parsing calcul ${calc.id}:`, error);
          return null; // Sera filtré
        }
      }).filter(calc => calc !== null); // Supprimer les calculs invalides
    } catch (error) {
      console.error('❌ Erreur chargement calculs:', error);
      return [];
    }
  }

  // Synchroniser les prix des matériaux
  async syncMaterialPrice(materialId, materialName, prices) {
    const user = userService.getCurrentUser();
    if (!user) return;

    try {
      const response = await fetch(`${this.baseUrl}?action=save_material_price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          material_id: materialId,
          material_name: materialName,
          price_x1: prices.x1 || null,
          price_x10: prices.x10 || null,
          price_x100: prices.x100 || null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Erreur sauvegarde prix:', error);
      throw error;
    }
  }

  async loadMaterialPrices() {
    const user = userService.getCurrentUser();
    if (!user) return {};

    try {
      const response = await fetch(`${this.baseUrl}?action=get_material_prices&user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const prices = await response.json();

      
      // Transformer en format local
      const pricesMap = {};
      prices.forEach(price => {
        pricesMap[price.material_id] = {
          x1: price.price_x1,
          x10: price.price_x10,
          x100: price.price_x100,
          name: price.material_name
        };
      });
      
      return pricesMap;
    } catch (error) {
      console.error('❌ Erreur chargement prix:', error);
      return {};
    }
  }

  // Synchroniser les métiers
  async syncProfessions(professions) {
    const user = userService.getCurrentUser();
    if (!user) return;

    try {
      const response = await fetch(`${this.baseUrl}?action=save_professions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          professions: professions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error('❌ Erreur sauvegarde métiers:', error);
      throw error;
    }
  }

  async loadProfessions() {
    const user = userService.getCurrentUser();
    if (!user) return {};

    try {
      const response = await fetch(`${this.baseUrl}?action=get_professions&user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const professions = await response.json();

      
      // Transformer en format local
      const professionsMap = {};
      professions.forEach(prof => {
        professionsMap[prof.profession_name] = prof.level;
      });
      
      return professionsMap;
    } catch (error) {
      console.error('❌ Erreur chargement métiers:', error);
      return {};
    }
  }

  // Synchronisation complète au login
  async fullSync() {
    const user = userService.getCurrentUser();
    if (!user) {
      return;
    }
    
    try {
      // Charger toutes les données depuis la BDD
      const [calculations, materialPrices, professions] = await Promise.all([
        this.loadCalculations(),
        this.loadMaterialPrices(),
        this.loadProfessions()
      ]);


      
      return {
        calculations,
        materialPrices,
        professions
      };
    } catch (error) {
      console.error('❌ Erreur synchronisation complète:', error);
      return null;
    }
  }

  // Supprimer un calcul de la BDD
  async deleteCalculation(calculationId) {
    try {


      const response = await fetch(`${this.baseUrl}?action=delete_calculation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculation_id: calculationId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error(`❌ Erreur suppression calcul ${calculationId}:`, error);
      throw error;
    }
  }
}

// Instance singleton
export const syncService = new SyncService();
export default syncService;
