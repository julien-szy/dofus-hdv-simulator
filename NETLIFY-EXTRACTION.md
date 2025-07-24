# 🌐 Extraction sur Netlify

Guide pour extraire les données DofusDB directement depuis ton site en production.

## 🎯 Solutions disponibles

### **Option 1 : Netlify Functions (Implémentée)**
✅ **Avantages :**
- Extraction directe depuis l'interface web
- Pas besoin d'installer Node.js localement
- Fonctionne en production sur Netlify

❌ **Limitations :**
- Timeout de 10 secondes par fonction
- Impossible de stocker des images directement
- Extraction par petits batches seulement

### **Option 2 : GitHub Actions (Recommandée pour les images)**
✅ **Avantages :**
- Peut télécharger toutes les images
- Commit automatique des fichiers
- Pas de limite de temps

❌ **Inconvénients :**
- Plus complexe à configurer

### **Option 3 : Local puis commit**
✅ **Avantages :**
- Contrôle total
- Pas de limitations

❌ **Inconvénients :**
- Nécessite Node.js en local

## 🚀 Comment utiliser l'extracteur Netlify

### 1. **Accès à l'interface**
- Va sur ton site en production
- Connecte-toi en tant qu'admin
- Clique sur le bouton "🌐 Extract" dans le header

### 2. **Extraction des données**
- Clique sur "🔄 Recharger métiers" pour voir tous les métiers
- Choisis entre :
  - **"🚀 Extraire tout"** : Tous les métiers (peut prendre du temps)
  - **"Extraire"** sur un métier spécifique : Plus rapide

### 3. **Limitations importantes**
⚠️ **Timeout de 10 secondes** : Les fonctions Netlify s'arrêtent après 10s
⚠️ **Pas d'images** : Netlify ne peut pas stocker de fichiers
⚠️ **Petits batches** : Limite de 100-200 recettes par métier

## 📊 Résultats attendus

L'extracteur va :
1. **Récupérer** les données des métiers DofusDB
2. **Simplifier** les informations (nom FR, level, etc.)
3. **Identifier** toutes les images nécessaires
4. **Afficher** les statistiques dans les logs

Exemple de sortie :
```
✅ Bijoutier: 45 items, 123 ressources, 67 recettes
📸 89 images identifiées
💾 Sauvegarde en BDD à implémenter
```

## 🔧 Prochaines étapes

### **Pour les données :**
1. Implémenter la sauvegarde en base de données
2. Créer l'API interne pour servir les données
3. Modifier le frontend pour utiliser l'API locale

### **Pour les images :**
**Option A - GitHub Actions :**
```yaml
# .github/workflows/download-images.yml
name: Download Images
on: workflow_dispatch
jobs:
  download:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run extract-data
      - run: git add public/images/
      - run: git commit -m "📸 Images téléchargées"
      - run: git push
```

**Option B - Local :**
```bash
# Sur ton PC
git clone https://github.com/julien-szy/dofus-hdv-simulator.git
cd dofus-hdv-simulator
npm install
npm run extract-data
git add public/images/
git commit -m "📸 Images téléchargées"
git push
```

## 🎯 Recommandation

1. **Utilise l'extracteur Netlify** pour récupérer les données
2. **Utilise GitHub Actions ou local** pour télécharger les images
3. **Combine les deux** pour avoir une app 100% autonome

## 🚨 En cas de problème

### **Timeout de fonction :**
- Réduis le nombre de recettes par métier (limit: 50)
- Extrais métier par métier au lieu de tout en une fois

### **Erreurs API :**
- Vérifie que DofusDB est accessible
- Attends quelques minutes et réessaie

### **Pas de données :**
- Vérifie les logs dans la console (F12)
- Assure-toi d'être connecté en tant qu'admin

## ✅ Test rapide

Pour tester que tout fonctionne :
1. Va sur ton site
2. Ouvre l'extracteur Netlify
3. Clique sur "Extraire" pour le métier "Bijoutier"
4. Vérifie les logs pour voir les données extraites

Si ça marche, tu peux lancer l'extraction complète ! 🎉
