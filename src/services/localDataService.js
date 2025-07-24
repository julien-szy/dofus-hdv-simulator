// Service pour gérer toutes les données statiques localement
// Remplace les tables craftable_items, craft_resources, etc. de la BDD

class LocalDataService {
  constructor() {
    this.data = null;
    this.craftableItems = null;
    this.materials = null;
    this.professions = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Charger les données depuis les fichiers JSON locaux
      const [dofusData, craftableItemsMapping, materialsMapping] = await Promise.all([
        this.loadJsonFile('/dofus-data.json'),
        this.loadJsonFile('/craftable-items-mapping.json'),
        this.loadJsonFile('/materials-mapping.json')
      ]);

      this.data = dofusData;
      this.craftableItems = craftableItemsMapping;
      this.materials = materialsMapping;
      this.professions = dofusData.jobs || {};

      this.initialized = true;
      console.log('✅ LocalDataService initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur initialisation LocalDataService:', error);
      throw error;
    }
  }

  async loadJsonFile(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`⚠️ Impossible de charger ${path}:`, error.message);
      return {};
    }
  }

  // === RECHERCHE D'ITEMS ===
  async searchItems(query, limit = 10) {
    await this.initialize();
    
    if (!query || query.length < 2) return [];

    const results = [];
    const searchTerm = query.toLowerCase();

    // Rechercher dans les items craftables
    for (const [itemId, item] of Object.entries(this.data.items || {})) {
      if (item.name && item.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: item.id,
          name: item.name,
          level: item.level,
          type: item.type,
          hasRecipe: item.hasRecipe,
          img: item.img
        });

        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // === DÉTAILS D'ITEM ===
  async getItemDetails(itemId) {
    await this.initialize();

    const item = this.data.items?.[itemId];
    if (!item) return null;

    // Récupérer la recette si elle existe
    const recipe = this.data.recipes?.[itemId]?.[0] || null;

    return {
      ...item,
      recipe: recipe ? {
        jobId: recipe.jobId,
        jobName: recipe.jobName,
        ingredients: recipe.ingredients || []
      } : null
    };
  }

  // === RECETTES ===
  async getItemRecipe(itemId) {
    await this.initialize();

    const recipes = this.data.recipes?.[itemId];
    if (!recipes || recipes.length === 0) return null;

    return recipes[0]; // Retourner la première recette
  }

  async checkItemHasRecipe(itemId) {
    await this.initialize();
    return !!(this.data.recipes?.[itemId] && this.data.recipes[itemId].length > 0);
  }

  // === MATÉRIAUX ===
  async getMaterialDetails(materialId) {
    await this.initialize();

    // Chercher dans les matériaux extraits
    if (this.materials && this.materials[materialId]) {
      return this.materials[materialId];
    }

    // Fallback : chercher dans les items généraux
    const item = this.data.items?.[materialId];
    if (item) {
      return {
        id: item.id,
        name: item.name,
        level: item.level,
        type: item.type,
        img: item.img
      };
    }

    return null;
  }

  // === ITEMS CRAFTABLES ===
  async getCraftableItems() {
    await this.initialize();
    return this.craftableItems || {};
  }

  async getCraftableItemsByProfession(profession) {
    await this.initialize();
    
    if (!this.craftableItems) return [];

    return Object.values(this.craftableItems).filter(item => 
      item.profession && item.profession.toLowerCase() === profession.toLowerCase()
    );
  }

  // === MATÉRIAUX ===
  async getMaterials() {
    await this.initialize();
    return this.materials || {};
  }

  async searchMaterials(query, limit = 10) {
    await this.initialize();
    
    if (!query || query.length < 2) return [];

    const results = [];
    const searchTerm = query.toLowerCase();

    for (const [materialId, material] of Object.entries(this.materials || {})) {
      if (material.name && material.name.toLowerCase().includes(searchTerm)) {
        results.push({
          id: material.id,
          name: material.name,
          type: material.type,
          img: material.img
        });

        if (results.length >= limit) break;
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  // === MÉTIERS ===
  async getProfessions() {
    await this.initialize();
    return this.professions || {};
  }

  async getProfessionById(professionId) {
    await this.initialize();
    return this.professions?.[professionId] || null;
  }

  // === STATISTIQUES ===
  async getStats() {
    await this.initialize();
    
    return {
      totalItems: Object.keys(this.data.items || {}).length,
      totalCraftableItems: Object.keys(this.craftableItems || {}).length,
      totalMaterials: Object.keys(this.materials || {}).length,
      totalProfessions: Object.keys(this.professions || {}).length,
      totalRecipes: Object.keys(this.data.recipes || {}).length,
      lastUpdated: this.data.metadata?.extractedAt || 'Inconnu'
    };
  }

  // === CACHE LOCAL ===
  async cacheSearchResults(query, results) {
    // Utiliser le service de cache existant
    const cacheService = new (await import('./dataCache.js')).default();
    await cacheService.cacheSearchResults(query, results);
  }

  async getCachedSearchResults(query) {
    const cacheService = new (await import('./dataCache.js')).default();
    return await cacheService.getCachedData('searchResults', query);
  }

  // === VALIDATION ===
  async validateData() {
    await this.initialize();
    
    const issues = [];
    
    if (!this.data.items) issues.push('Données items manquantes');
    if (!this.craftableItems) issues.push('Mapping items craftables manquant');
    if (!this.materials) issues.push('Mapping matériaux manquant');
    
    return {
      valid: issues.length === 0,
      issues,
      stats: await this.getStats()
    };
  }
}

// Instance singleton
const localDataService = new LocalDataService();

export default localDataService; 