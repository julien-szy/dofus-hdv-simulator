# 📸 Banque d'images automatique avec GitHub Actions

Guide pour créer une banque d'images permanente qui se met à jour automatiquement.

## 🎯 Objectif

Créer une **banque d'images fixe** stockée dans ton repository pour que :
- ✅ **Aucun utilisateur** ne télécharge depuis DofusDB
- ✅ **Chargement instantané** des images
- ✅ **Autonomie totale** de ton app
- ✅ **Mise à jour automatique** des nouvelles images

## 🚀 Comment ça marche

### **1. GitHub Action automatique**
```
Déclenchement → Extraction DofusDB → Téléchargement images → Commit → Netlify redéploie
```

### **2. Résultat final**
```
public/
  images/
    items/          ← 2000-3000 images d'items
      2469.png      ← Gelano
      2470.png      ← Autre item
    resources/      ← 500-800 images de ressources  
      757.png       ← Gelée Bleuet
      368.png       ← Gelée Fraise
```

### **3. Dans ton app**
```javascript
// Plus d'appels DofusDB ! Images locales instantanées
<img src="/images/items/2469.png" alt="Gelano" />
```

## 🔧 Utilisation

### **Déclenchement manuel (recommandé)**

1. **Va sur GitHub** → ton repository
2. **Actions** → "📸 Télécharger toutes les images DofusDB"
3. **Run workflow** → Configure les options :
   - **Force download** : Re-télécharger les images existantes
   - **Max images** : Limiter le nombre (0 = illimité)
4. **Run workflow** → L'action se lance

### **Options disponibles**

#### **Force download** (true/false)
- `false` : Ignore les images déjà présentes (rapide)
- `true` : Re-télécharge tout (mise à jour complète)

#### **Max images** (nombre)
- `0` : Télécharge tout (recommandé)
- `100` : Limite à 100 images (test)
- `1000` : Limite à 1000 images

## 📊 Résultats attendus

### **Première exécution complète :**
```
✅ Extraction terminée
📦 Items: 2847 images téléchargées
🧱 Ressources: 756 images téléchargées  
💾 Taille totale: 234.7 MB
🚀 Commit et push automatique
🌐 Netlify redéploie (5-10 minutes)
```

### **Exécutions suivantes :**
```
ℹ️ Aucune nouvelle image
✅ La banque d'images est à jour
```

## ⏱️ Temps d'exécution

- **Première fois** : 30-60 minutes (téléchargement complet)
- **Mises à jour** : 5-15 minutes (nouvelles images seulement)
- **Redéploiement Netlify** : 5-10 minutes

## 🔍 Monitoring

### **Pendant l'exécution :**
- Logs en temps réel dans GitHub Actions
- Progression par métier et par batch
- Statistiques de téléchargement

### **Après l'exécution :**
- Commit automatique avec résumé détaillé
- Notification Netlify de redéploiement
- Images disponibles sur ton site

## 🚨 Gestion d'erreurs

### **API DofusDB indisponible :**
- L'action se termine en erreur
- Aucun commit effectué
- Relance manuellement plus tard

### **Espace disque insuffisant :**
- Très rare (GitHub donne 14 GB)
- L'action s'arrête proprement

### **Timeout :**
- GitHub Actions timeout après 6h
- Largement suffisant pour tout télécharger

## 🔄 Automatisation avancée

### **Déclenchement automatique (optionnel) :**
```yaml
# Dans .github/workflows/download-images.yml
on:
  schedule:
    - cron: '0 2 * * 0'  # Chaque dimanche à 2h du matin
```

### **Déclenchement sur push :**
```yaml
on:
  push:
    branches: [ main ]
    paths: [ 'src/scripts/**' ]  # Si tu modifies les scripts
```

## 📋 Checklist de mise en place

### **✅ Étapes à suivre :**

1. **Push la GitHub Action** (déjà fait)
2. **Va sur GitHub Actions** de ton repository
3. **Lance "📸 Télécharger toutes les images DofusDB"**
4. **Attends la fin** (30-60 minutes)
5. **Vérifie le commit** automatique
6. **Attends le redéploiement** Netlify
7. **Teste ton site** → images instantanées !

### **✅ Vérifications :**

- [ ] Dossier `public/images/items/` avec ~2000-3000 .png
- [ ] Dossier `public/images/resources/` avec ~500-800 .png
- [ ] Commit automatique avec message détaillé
- [ ] Site redéployé sur Netlify
- [ ] Images s'affichent instantanément
- [ ] Plus d'appels vers DofusDB pour les images

## 🎉 Résultat final

Une fois terminé, ton app aura :
- ✅ **Banque d'images complète** intégrée
- ✅ **Chargement instantané** pour tous les utilisateurs
- ✅ **Autonomie totale** (pas de dépendance DofusDB)
- ✅ **Mise à jour facile** (relancer l'action)
- ✅ **Performance optimale** (pas de téléchargement côté client)

**Ton app sera 100% autonome et ultra-rapide !** 🚀
