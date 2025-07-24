# 🗄️ Plan d'Optimisation de la Base de Données

## 🎯 Objectif : Alléger la BDD de 90%

### ❌ **À SUPPRIMER de la BDD** (données statiques)
- `craftable_items` → Remplacé par JSON local
- `craft_resources` → Remplacé par JSON local  
- `item_resource_requirements` → Remplacé par JSON local
- `search_cache` → Remplacé par IndexedDB local

### ✅ **À GARDER en BDD** (données dynamiques)
- `users` - Profils utilisateurs
- `user_favorites` - Favoris personnels
- `user_calculations` - Calculs sauvegardés
- `user_material_prices` - Prix personnalisés
- `user_professions` - Niveaux de métiers
- `user_settings` - Paramètres utilisateur
- `user_searches` - Historique de recherche

## 🏗️ Nouvelle Architecture

### **Frontend (JSON Local)**
```
src/data/local/
├── dofus-data.json          # Items + recettes
├── craftable-items.json     # Items craftables uniquement
├── materials.json           # Matériaux uniquement
└── professions.json         # Métiers
```

### **Backend (BDD Légère)**
```sql
-- Tables utilisateur uniquement
users (id, email, username, server_preference, theme_preference)
user_favorites (user_id, item_id, item_name)
user_calculations (user_id, item_id, sell_price, quantity, profit, roi)
user_material_prices (user_id, material_id, price_x1, price_x10, price_x100)
user_professions (user_id, profession_name, level)
user_settings (user_id, setting_key, setting_value)
user_searches (user_id, search_term, item_id)
```

### **Cache Local (IndexedDB)**
```
DofusHDVCache/
├── searchResults/           # Cache des recherches
├── itemDetails/            # Détails d'items
└── materialDetails/        # Détails de matériaux
```

## 🚀 Avantages

### **Performance**
- **Taille BDD** : 90% de réduction
- **Requêtes** : Plus rapides (moins de tables)
- **Déploiement** : Plus simple

### **Coûts**
- **Stockage** : Réduction drastique
- **Bandwidth** : Moins de transferts
- **Maintenance** : Plus simple

### **Flexibilité**
- **Données statiques** : Mises à jour via Git
- **Données dynamiques** : BDD optimisée
- **Cache** : IndexedDB pour performance

## 📋 Plan de Migration

### **Étape 1 : Préparer les services locaux**
- [ ] Créer `LocalDataService` pour les données statiques
- [ ] Adapter `CraftableItemService` et `MaterialService`
- [ ] Tester l'accès aux données locales

### **Étape 2 : Migrer les données**
- [ ] Extraire les données de la BDD vers JSON
- [ ] Supprimer les tables statiques
- [ ] Mettre à jour les requêtes

### **Étape 3 : Optimiser les services**
- [ ] Adapter `userService` pour BDD légère
- [ ] Optimiser `priceStorage` 
- [ ] Tester les performances

### **Étape 4 : Nettoyer le code**
- [ ] Supprimer les imports inutiles
- [ ] Simplifier les composants
- [ ] Mettre à jour la documentation

## 💾 Structure des Données Locales

### **craftable-items.json**
```json
{
  "44": {
    "id": 44,
    "name": "Épée de Boisaille",
    "level": 7,
    "type": "Épée",
    "profession": "Forgeron",
    "recipe": {
      "ingredients": [
        {"id": 16512, "name": "Bois de Châtaignier", "quantity": 3},
        {"id": 303, "name": "Fer", "quantity": 3}
      ]
    }
  }
}
```

### **materials.json**
```json
{
  "16512": {
    "id": 16512,
    "name": "Bois de Châtaignier",
    "type": "Ressource",
    "harvestable": true
  }
}
```

## 🔧 Services à Créer

### **LocalDataService**
```javascript
class LocalDataService {
  async getCraftableItems() { /* JSON local */ }
  async getMaterials() { /* JSON local */ }
  async searchItems(query) { /* Recherche locale */ }
  async getItemRecipe(itemId) { /* Recette locale */ }
}
```

### **OptimizedUserService**
```javascript
class OptimizedUserService {
  // Seulement les données utilisateur
  async savePrice(userId, materialId, prices) { /* BDD */ }
  async getFavorites(userId) { /* BDD */ }
  async saveCalculation(userId, calculation) { /* BDD */ }
}
```

## 📊 Estimation des Gains

### **Avant**
- BDD : ~50MB (items + recettes + cache)
- Requêtes : Complexes (jointures)
- Maintenance : Lourde

### **Après**
- BDD : ~5MB (données utilisateur uniquement)
- Requêtes : Simples (par utilisateur)
- Maintenance : Légère

### **Performance**
- **Chargement** : 2s → 200ms
- **Recherche** : 1s → 50ms
- **Sauvegarde** : 500ms → 100ms 