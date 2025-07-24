# 🔄 Guide de Migration vers l'Architecture Optimisée

## 🎯 Objectif

Alléger la base de données de 90% en déplaçant les données statiques vers des fichiers JSON locaux.

## 📊 Avant/Après

### **Avant (Architecture actuelle)**
```
BDD (50MB)
├── craftable_items (20k+ items)
├── craft_resources (5k+ matériaux)
├── item_resource_requirements (50k+ relations)
├── search_cache (recherches)
└── Tables utilisateur (5MB)
```

### **Après (Architecture optimisée)**
```
Frontend (JSON local)
├── dofus-data-optimized.json (items + recettes)
├── craftable-items-mapping.json (items craftables)
└── materials-mapping.json (matériaux)

BDD (5MB)
└── Tables utilisateur uniquement
```

## 🚀 Étapes de Migration

### **1. Préparer les données locales**

```bash
# Extraire les données statiques vers JSON
npm run migrate-to-local
```

Ce script va créer :
- `public/craftable-items-mapping.json`
- `public/materials-mapping.json`
- `src/data/local/dofus-data-optimized.json`
- `scripts-node/migration-report.json`

### **2. Tester les nouveaux services**

```javascript
// Remplacer les imports existants
import localDataService from './services/localDataService.js';
import optimizedUserService from './services/optimizedUserService.js';

// Au lieu de
import userService from './services/userService.js';
```

### **3. Adapter les composants**

#### **Avant**
```javascript
// Recherche d'items
const results = await searchItems(query);

// Détails d'item
const item = await getItemDetails(itemId);

// Prix utilisateur
const prices = await userService.getMaterialPrices(userId);
```

#### **Après**
```javascript
// Recherche d'items (local)
const results = await localDataService.searchItems(query);

// Détails d'item (local)
const item = await localDataService.getItemDetails(itemId);

// Prix utilisateur (BDD optimisée)
const prices = await optimizedUserService.getMaterialPrices(userId);
```

### **4. Mettre à jour App.jsx**

```javascript
// Remplacer les imports
import localDataService from './services/localDataService.js';
import optimizedUserService from './services/optimizedUserService.js';

// Supprimer
// import { searchItems, getItemDetails } from './services/dofusDbApi.js';
// import userService from './services/userService.js';

// Adapter les appels
const handleSearch = async (query) => {
  const results = await localDataService.searchItems(query);
  setSearchResults(results);
};

const handleItemSelect = async (itemId) => {
  const item = await localDataService.getItemDetails(itemId);
  setSelectedItem(item);
};
```

### **5. Nettoyer la BDD**

Une fois les tests validés, supprimer les tables statiques :

```sql
-- Tables à supprimer
DROP TABLE IF EXISTS craftable_items;
DROP TABLE IF EXISTS craft_resources;
DROP TABLE IF EXISTS item_resource_requirements;
DROP TABLE IF EXISTS search_cache;
```

## 🔧 Services Disponibles

### **LocalDataService** (Données statiques)
```javascript
// Recherche
await localDataService.searchItems(query, limit);

// Détails
await localDataService.getItemDetails(itemId);
await localDataService.getMaterialDetails(materialId);

// Recettes
await localDataService.getItemRecipe(itemId);
await localDataService.checkItemHasRecipe(itemId);

// Métiers
await localDataService.getProfessions();
await localDataService.getProfessionById(professionId);

// Statistiques
await localDataService.getStats();
await localDataService.validateData();
```

### **OptimizedUserService** (Données dynamiques)
```javascript
// Utilisateur
await optimizedUserService.createUser(userData);
await optimizedUserService.getUser(email);
await optimizedUserService.loginUser(email, username, password);

// Favoris
await optimizedUserService.getFavorites(userId);
await optimizedUserService.addFavorite(userId, itemId, itemName);
await optimizedUserService.removeFavorite(userId, itemId);

// Calculs
await optimizedUserService.saveCalculation(calculationData);
await optimizedUserService.getCalculations(userId);
await optimizedUserService.deleteCalculation(userId, calculationId);

// Prix
await optimizedUserService.saveMaterialPrice(priceData);
await optimizedUserService.getMaterialPrices(userId);

// Métiers
await optimizedUserService.saveProfession(userId, professionName, level);
await optimizedUserService.getProfessions(userId);

// Paramètres
await optimizedUserService.saveSetting(userId, key, value);
await optimizedUserService.getSettings(userId);
```

## 📁 Structure des Fichiers

### **Fichiers JSON créés**

#### **craftable-items-mapping.json**
```json
{
  "44": {
    "id": 44,
    "name": "Épée de Boisaille",
    "level": 7,
    "type": "Épée",
    "profession": "Forgeron",
    "recipe": {
      "jobId": 11,
      "jobName": "Forgeron",
      "ingredients": [
        {"id": 16512, "name": "Bois de Châtaignier", "quantity": 3},
        {"id": 303, "name": "Fer", "quantity": 3}
      ]
    }
  }
}
```

#### **materials-mapping.json**
```json
{
  "16512": {
    "id": 16512,
    "name": "Bois de Châtaignier",
    "level": 1,
    "type": "Ressource",
    "img": "/images/materials/16512.png",
    "harvestable": true,
    "droppable": false,
    "craftable": false
  }
}
```

#### **dofus-data-optimized.json**
```json
{
  "items": { /* Items avec recettes + matériaux */ },
  "recipes": { /* Recettes complètes */ },
  "jobs": { /* Métiers */ },
  "metadata": {
    "optimizedAt": "2025-01-XX",
    "totalItems": 2500,
    "totalRecipes": 2000,
    "totalJobs": 10
  }
}
```

## 🧪 Tests de Validation

### **1. Test des services locaux**
```javascript
// Tester la recherche
const results = await localDataService.searchItems('épée');
console.log('Résultats recherche:', results.length);

// Tester les détails
const item = await localDataService.getItemDetails('44');
console.log('Détails item:', item.name);

// Tester les statistiques
const stats = await localDataService.getStats();
console.log('Statistiques:', stats);
```

### **2. Test des services utilisateur**
```javascript
// Tester la connexion
const user = await optimizedUserService.loginUser('test@test.com', 'test', 'password');
console.log('Utilisateur connecté:', user.id);

// Tester les favoris
const favorites = await optimizedUserService.getFavorites(user.id);
console.log('Favoris:', favorites.length);
```

### **3. Test de performance**
```javascript
// Mesurer le temps de recherche
const start = performance.now();
const results = await localDataService.searchItems('épée');
const end = performance.now();
console.log(`Recherche: ${end - start}ms`);
```

## ⚠️ Points d'Attention

### **1. Images locales**
- Vérifier que les images sont bien dans `public/images/`
- Les services utilisent les chemins locaux

### **2. Cache IndexedDB**
- Le cache local reste fonctionnel
- Les données statiques sont en JSON

### **3. Fallback**
- En cas d'erreur, les services retournent des valeurs par défaut
- L'application continue de fonctionner

### **4. Migration progressive**
- Tester d'abord en local
- Déployer progressivement
- Garder l'ancien code en backup

## 📈 Gains Attendus

### **Performance**
- **Recherche** : 2s → 50ms
- **Détails** : 1s → 20ms
- **Chargement** : 3s → 500ms

### **Coûts**
- **Stockage BDD** : 50MB → 5MB
- **Bandwidth** : -80%
- **Maintenance** : -70%

### **Flexibilité**
- **Données statiques** : Mises à jour via Git
- **Données dynamiques** : BDD optimisée
- **Déploiement** : Plus simple

## 🔄 Rollback

En cas de problème, revenir à l'ancienne architecture :

1. Restaurer les imports originaux
2. Recharger les tables BDD
3. Désactiver les nouveaux services

## 📞 Support

En cas de problème :
1. Vérifier les logs de migration
2. Tester les services individuellement
3. Consulter le rapport de migration
4. Vérifier la structure des fichiers JSON 