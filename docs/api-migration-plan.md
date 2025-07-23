# 🗄️ Plan de Migration vers DofusDB.fr + BDD Interne

## 🎯 NOUVELLE DÉCOUVERTE : DofusDB.fr est MEILLEUR !

### 🚀 API DofusDB.fr (RECOMMANDÉE) :
- `GET /items?name.fr[$regex]=terme&$limit=10` - Recherche avancée
- `GET /items/{id}` - Détails item complet
- `GET /recipes?resultId={id}` - Recettes par item
- `GET /recipes?$limit=100` - Toutes les recettes

### 📊 Données disponibles :
- **Items** : 20k+ équipements avec toutes les infos
- **Recipes** : 4k+ recettes avec ingrédients complets
- **Jobs** : Métiers avec IDs et noms
- **Images** : URLs directes vers les assets

## 🎯 Solution Proposée : Cache Intelligent

### Phase 1 : Cache Local (Immédiat)
```javascript
// Service de cache avec IndexedDB
class DofusDataCache {
  async cacheSearchResults(query, results) {
    // Cache les résultats de recherche avec TTL
  }
  
  async cacheItemDetails(itemId, data) {
    // Cache permanent pour les détails d'items
  }
  
  async getCachedData(key) {
    // Récupère depuis IndexedDB
  }
}
```

### Phase 2 : BDD Interne (V2)
```sql
-- Schema de base
CREATE TABLE items (
  ankama_id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  level INTEGER,
  type_name VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE materials (
  ankama_id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  level INTEGER,
  subtype VARCHAR(50),
  image_url TEXT
);

CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(ankama_id),
  material_id INTEGER REFERENCES materials(ankama_id),
  quantity INTEGER
);
```

### Phase 3 : Sync Intelligent
```javascript
// Système de synchronisation
class DataSyncService {
  async syncAllItems() {
    // Import initial de tous les items
  }
  
  async syncUpdates() {
    // Sync incrémental des changements
  }
  
  async scheduleSync() {
    // Sync automatique hebdomadaire
  }
}
```

## 🚀 Plan d'Implémentation

### Étape 1 : Migration vers DofusDB.fr (IMMÉDIAT)
- [x] ✅ Cache IndexedDB créé et fonctionnel
- [ ] 🔄 Adapter l'API service pour DofusDB.fr
- [ ] 🔄 Tester la nouvelle recherche
- [ ] 🔄 Migrer les recettes

### Étape 2 : BDD Supabase (Semaine prochaine)
- [ ] Setup Supabase
- [ ] Créer le schéma optimisé
- [ ] Script d'import DofusDB.fr (meilleur que DofusDude)
- [ ] API backend avec cache

### Étape 3 : Migration Progressive
- [ ] Basculer recherche vers DofusDB.fr
- [ ] Basculer détails vers BDD interne
- [ ] Désactiver proxy DofusDude
- [ ] Monitoring performances

## 🎯 PROCHAINE ÉTAPE : Migrer vers DofusDB.fr

### Structure DofusDB.fr :
```json
{
  "id": 44,
  "name": {"fr": "Épée de Boisaille"},
  "level": 7,
  "img": "https://api.dofusdb.fr/img/items/6007.png",
  "hasRecipe": true,
  "type": {"name": {"fr": "Épée"}},
  "job": {"name": {"fr": "Forgeron"}}
}
```

### Recettes DofusDB.fr :
```json
{
  "resultId": 44,
  "ingredientIds": [16512, 303],
  "quantities": [3, 3],
  "ingredients": [/* objets complets */],
  "job": {"name": {"fr": "Forgeron"}}
}
```

## 📈 Avantages

### Performance :
- **Recherche** : 2s → 50ms
- **Détails** : 1s → 20ms
- **Offline** : Fonctionne sans internet

### Contrôle :
- **Données custom** : Prix, stats perso
- **Pas de rate limit** : API illimitée
- **Évolutivité** : Ajout facile de features

### Coûts :
- **Gratuit** : Supabase free tier
- **Pas de proxy** : Économie Netlify functions
- **Scalable** : Croissance maîtrisée
