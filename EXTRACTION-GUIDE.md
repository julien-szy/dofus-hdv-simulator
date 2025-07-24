# 🚀 Guide d'extraction des données Dofus

Ce guide explique comment extraire toutes les données DofusDB et télécharger toutes les images en local.

## 📋 Vue d'ensemble

Le système va :
1. **Extraire** tous les items craftables de DofusDB
2. **Simplifier** les données (nom FR, level, profession, etc.)
3. **Télécharger** toutes les images en local
4. **Stocker** en base de données locale

## 🗄️ Structure finale

### Base de données
```sql
-- Items craftables
items (m_id, name_fr, level, type_id, icon_id, profession, image_path)

-- Ressources/matériaux  
craft_resources (m_id, name_fr, level, icon_id, image_path)

-- Recettes (liaisons)
item_recipes (item_id, resource_id, quantity)
```

### Images locales
```
public/
  images/
    items/          -- Images des items craftables
      2469.png      -- Gelano
      2470.png      -- Autre item
    resources/      -- Images des ressources
      757.png       -- Gelée Bleuet
      368.png       -- Gelée Fraise
```

## 🧪 Test d'abord

Avant de lancer l'extraction complète, teste avec quelques métiers :

```bash
npm run test-extraction
```

Ce script va :
- Extraire seulement 2 métiers (Bijoutier + Forgeron)
- Télécharger seulement 20 images
- Afficher un aperçu des données
- Vérifier que tout fonctionne

## 🚀 Extraction complète

Une fois le test validé, lance l'extraction complète :

```bash
npm run extract-data
```

⚠️ **Attention** : Cela va :
- Extraire TOUS les métiers (~15-20 métiers)
- Télécharger TOUTES les images (~3000-4000 images)
- Prendre 30-60 minutes selon ta connexion
- Occuper ~100-500 MB d'espace disque

## 📊 Estimation des volumes

- **Items craftables** : ~2000-3000 items
- **Ressources uniques** : ~500-800 ressources  
- **Images totales** : ~3500-4000 images
- **Taille estimée** : 100-500 MB
- **Durée** : 30-60 minutes

## 🔧 Scripts disponibles

```bash
# Test rapide (recommandé en premier)
npm run test-extraction

# Extraction complète (après validation du test)
npm run extract-data

# Téléchargement d'images uniquement
npm run download-images
```

## 📝 Logs et monitoring

Les scripts affichent des logs détaillés :
- ✅ Succès (vert)
- ⚠️ Avertissements (jaune)  
- ❌ Erreurs (rouge)
- 📊 Statistiques en temps réel

Exemple de sortie :
```
🔧 Traitement du métier: Bijoutier
📦 Batch 1/10
✅ 2469.png téléchargé (8.2 KB)
📊 RÉSUMÉ: 1250 téléchargées, 45 erreurs
💾 Total: 127.3 MB
```

## 🚨 En cas de problème

### Erreurs réseau
- Le script fait des pauses automatiques
- Relance le script, il reprend où il s'est arrêté
- Les images déjà téléchargées sont ignorées

### Espace disque insuffisant
- Vérifie l'espace disponible avant de lancer
- Tu peux supprimer `/public/images/` et relancer

### API DofusDB indisponible
- Attends quelques minutes et relance
- Le script gère automatiquement les erreurs temporaires

## ✅ Validation

Après l'extraction, vérifie :

1. **Dossiers créés** :
   ```
   public/images/items/     (avec ~2000-3000 .png)
   public/images/resources/ (avec ~500-800 .png)
   ```

2. **Logs de fin** :
   ```
   📊 Items extraits: 2847
   🧱 Ressources extraites: 756  
   🔗 Recettes créées: 12453
   💾 Total: 234.7 MB
   ```

3. **Test dans l'app** :
   - Les images s'affichent depuis `/images/`
   - Plus d'appels vers DofusDB pour les images

## 🎯 Prochaines étapes

Une fois l'extraction terminée :
1. Créer l'API interne pour servir les données
2. Modifier le frontend pour utiliser l'API locale
3. Supprimer les dépendances vers DofusDB

**L'app sera alors 100% autonome !** 🎉
