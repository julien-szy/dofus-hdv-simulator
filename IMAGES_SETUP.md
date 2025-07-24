# 🎨 Configuration du Système d'Images

## 🚀 **Nouveau Système d'Images 100% Local**

Fini les problèmes d'API lente ! Toutes les images sont maintenant stockées localement.

## 📋 **Étapes de Configuration**

### 1. **Télécharger toutes les images**
```bash
npm run download-all-images
```

Cette commande va :
- ✅ Récupérer tous les métiers depuis DofusDB
- ✅ Extraire tous les iconIds des recettes
- ✅ Télécharger toutes les images nécessaires
- ✅ Les stocker dans `/public/images/items/`
- ✅ Créer des images par défaut pour les cas d'erreur

**Durée estimée :** 10-30 minutes selon votre connexion

### 2. **Nettoyer les logs de debug**
```bash
npm run clean-debug
```

Supprime tous les logs de debug qui polluent la console.

### 3. **Vérifier les images par défaut**

Les images par défaut sont déjà créées dans `/public/images/defaults/` :
- `default-item.svg` - Pour les objets
- `default-resource.svg` - Pour les ressources  
- `default-equipment.svg` - Pour les équipements
- `loading.svg` - Pendant le chargement
- `error.svg` - En cas d'erreur

## 🔧 **Utilisation dans le Code**

### **Ancien système (avec API)**
```jsx
import OptimizedImage from '../components/OptimizedImage.jsx'

<OptimizedImage iconId="1234" type="item" size="medium" />
```

### **Nouveau système (100% local)**
```jsx
import LocalImage from '../components/LocalImage.jsx'

<LocalImage iconId="1234" type="item" size="medium" />
```

## 📊 **Avantages du Nouveau Système**

| Aspect | Ancien (API) | Nouveau (Local) |
|--------|-------------|-----------------|
| **Vitesse** | 2-10 secondes | Instantané |
| **Fiabilité** | Dépend de l'API | 100% fiable |
| **Offline** | ❌ Non | ✅ Oui |
| **Timeouts** | ❌ Fréquents | ✅ Jamais |
| **Maintenance** | ❌ Complexe | ✅ Simple |

## 🛠️ **Migration du Code Existant**

### **Remplacer les imports**
```jsx
// Ancien
import OptimizedImage from '../components/OptimizedImage.jsx'
import { useImagePreloader } from '../utils/imageUtils.js'

// Nouveau  
import LocalImage from '../components/LocalImage.jsx'
import { useLocalImages } from '../components/LocalImage.jsx'
```

### **Remplacer les composants**
```jsx
// Ancien
<OptimizedImage 
  iconId={item.iconId} 
  type="item" 
  size="medium"
  showPlaceholder={true}
/>

// Nouveau
<LocalImage 
  iconId={item.iconId} 
  type="item" 
  size="medium"
  showPlaceholder={true}
/>
```

## 📁 **Structure des Fichiers**

```
public/
├── images/
│   ├── items/           # Toutes les images d'objets (1234.png, 5678.png, etc.)
│   └── defaults/        # Images par défaut (SVG)
│       ├── default-item.svg
│       ├── default-resource.svg
│       ├── default-equipment.svg
│       ├── loading.svg
│       └── error.svg
```

## 🔄 **Mise à Jour des Images**

Pour ajouter de nouvelles images (nouveaux objets) :

```bash
# Télécharger seulement les nouvelles images
npm run download-images-only

# Ou re-télécharger tout (si problème)
npm run download-all-images
```

## 🐛 **Dépannage**

### **Images manquantes**
Si certaines images n'apparaissent pas :
1. Vérifiez que le fichier existe dans `/public/images/items/`
2. Re-lancez `npm run download-all-images`
3. L'image par défaut s'affichera automatiquement

### **Erreurs de téléchargement**
```bash
# Vérifier les logs
npm run download-all-images

# Si trop d'erreurs, réessayer plus tard
# L'API DofusDB peut être temporairement surchargée
```

### **Espace disque**
Les images prennent environ **100-500 MB** au total.
Si c'est trop, vous pouvez :
1. Supprimer les images inutilisées
2. Utiliser seulement les images par défaut

## ✅ **Checklist de Migration**

- [ ] Exécuter `npm run download-all-images`
- [ ] Exécuter `npm run clean-debug`  
- [ ] Remplacer `OptimizedImage` par `LocalImage`
- [ ] Tester l'affichage des images
- [ ] Vérifier que les images par défaut fonctionnent
- [ ] Commit et push vers GitHub

## 🎯 **Résultat Final**

Après migration :
- ⚡ **Chargement instantané** des images
- 🛡️ **Aucun timeout** ou erreur d'API
- 📱 **Fonctionne offline**
- 🧹 **Console propre** (plus de logs de debug)
- 🚀 **Application plus rapide** et stable

## 📞 **Support**

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console
2. Testez avec `npm run download-all-images --verbose`
3. Vérifiez l'espace disque disponible
