# 📦 Extraction des Images Dofus

Ce guide explique comment extraire les images nécessaires pour l'application Dofus HDV.

## 🎯 Scripts Disponibles

### 1. **Extraction des Items Craftables**
```bash
npm run extract-craftable-items
```
- Récupère les images des **items qui ont des recettes**
- Sauvegarde dans `public/images/craftable-items/`
- Crée `src/services/craftableItemService.js`

### 2. **Extraction des Matériaux**
```bash
npm run extract-materials
```
- Récupère les images des **matériaux utilisés dans les recettes**
- Sauvegarde dans `public/images/materials/`
- Crée `src/services/materialService.js`

### 3. **Extraction Complète**
```bash
npm run extract-all
```
- Lance les 2 extractions en parallèle
- Plus rapide que de les lancer séparément

### 4. **Optimisation des Images**
```bash
npm run optimize-images
```
- Optimise les images téléchargées
- Configure Git LFS pour les gros fichiers

## 📁 Structure des Dossiers

```
public/images/
├── craftable-items/     # Items qui ont des recettes
├── materials/          # Matériaux utilisés dans les recettes
└── defaults/           # Images par défaut
```

## 🔧 Services Créés

### CraftableItemService
```javascript
import CraftableItemService from './services/craftableItemService.js'

// Obtenir l'URL d'une image d'item craftable
const imageUrl = CraftableItemService.getCraftableItemImage(itemId, iconId)
```

### MaterialService
```javascript
import MaterialService from './services/materialService.js'

// Obtenir l'URL d'une image de matériau
const imageUrl = MaterialService.getMaterialImage(materialId, iconId)
```

## 🚀 Workflow Recommandé

1. **Extraire les images** :
   ```bash
   npm run extract-all
   ```

2. **Optimiser les images** :
   ```bash
   npm run optimize-images
   ```

3. **Configurer Git LFS** :
   ```bash
   git lfs install
   git add public/images/
   git commit -m "📦 Ajout des images Dofus"
   git push
   ```

## 📊 Statistiques

- **Items craftables** : ~2000-3000 images
- **Matériaux** : ~500-1000 images
- **Temps d'extraction** : 10-15 minutes
- **Taille totale** : ~50-100 MB

## ⚠️ Notes Importantes

- Les scripts ne téléchargent que les images **utiles pour le craft**
- Les images sont organisées par type (craftables vs matériaux)
- Git LFS est recommandé pour gérer les gros fichiers
- Les services créés facilitent l'utilisation dans l'application 