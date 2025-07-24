# Optimisation des Déploiements Netlify

## Problème
Les déploiements Netlify prennent 20+ minutes à cause des images qui sont re-déployées à chaque push.

## Solutions Implémentées

### 1. Configuration Netlify Optimisée (`netlify.toml`)

```toml
# Cache des dépendances pour accélérer les builds
[[plugins]]
  package = "@netlify/plugin-cache-core"

# Cache persistant pour les images
[[plugins]]
  package = "@netlify/plugin-cache-optim"

# Optimisation automatique des images
[[plugins]]
  package = "@netlify/plugin-image-optim"

# Headers de cache pour les images (1 an)
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2. Build Optimisé (`scripts-node/optimizedBuild.js`)

Le script de build optimisé :
- ✅ Restaure les images depuis le cache Netlify
- ✅ Évite de re-télécharger les images à chaque build
- ✅ Copie les images vers le cache pour le prochain build
- ✅ Accélère significativement les builds suivants

### 2. Exclusion des Images (`.netlifyignore`)

Les images sont exclues du déploiement automatique et gérées séparément via Git LFS.

### 3. Scripts de Déploiement Séparés

#### Déploiement des Images Seulement
```bash
npm run deploy-images
```
- Déploie uniquement les images via Git LFS
- Plus rapide car pas de build complet

#### Déploiement de l'Application Seulement
```bash
npm run deploy-app
```
- Build et déploiement de l'app sans les images
- Utilise les images déjà déployées

## Workflow Recommandé

### Premier Déploiement (Images + App)
1. **Déployer les images** : `npm run deploy-images`
2. **Attendre** que Netlify termine le déploiement des images
3. **Déployer l'app** : `npm run deploy-app`

### Déploiements Suivants

#### Si vous modifiez seulement le code :
```bash
npm run deploy-app
```
- ⚡ Rapide (2-3 minutes)
- Pas de re-déploiement des images

#### Si vous modifiez seulement les images :
```bash
npm run deploy-images
```
- ⚡ Rapide (5-10 minutes)
- Pas de re-build de l'application

#### Si vous modifiez les deux :
```bash
npm run deploy-images
# Attendre la fin
npm run deploy-app
```

## Configuration Netlify

### Variables d'Environnement
Ajoutez dans les paramètres Netlify :
```
NODE_VERSION=18
NPM_FLAGS=--legacy-peer-deps
```

### Build Hooks (Optionnel)
Pour déclencher des déploiements manuels :
1. Allez dans Site settings > Build & deploy > Build hooks
2. Créez un hook pour le déploiement des images
3. Utilisez-le avec `curl -X POST -d {} https://api.netlify.com/build_hooks/YOUR_HOOK_ID`

## Monitoring

### Vérifier les Temps de Build
- Dashboard Netlify > Deploys
- Les builds avec cache seront marqués "Cached"

### Vérifier le Cache des Images
- Ouvrez les DevTools de votre site
- Onglet Network > Images
- Vérifiez que `Cache-Control: public, max-age=31536000` est présent

## Dépannage

### Images qui ne se chargent pas
1. Vérifiez que Git LFS est configuré : `git lfs status`
2. Vérifiez que les images sont trackées : `git lfs ls-files`
3. Re-déployez les images : `npm run deploy-images`

### Build qui échoue
1. Vérifiez les logs dans Netlify
2. Testez localement : `npm run build`
3. Vérifiez les dépendances : `npm install`

### Cache qui ne fonctionne pas
1. Vérifiez que les plugins sont installés
2. Vérifiez la configuration `netlify.toml`
3. Contactez le support Netlify si nécessaire

## Avantages

✅ **Déploiements rapides** : 2-3 minutes au lieu de 20+  
✅ **Cache intelligent** : Les images ne sont re-déployées que si modifiées  
✅ **Flexibilité** : Déploiement séparé des images et du code  
✅ **Optimisation automatique** : Images optimisées par Netlify  
✅ **Headers de cache** : Images mises en cache 1 an côté client  

## Commandes Utiles

```bash
# Vérifier l'état Git LFS
git lfs status

# Voir les fichiers trackés par LFS
git lfs ls-files

# Vérifier la taille du repo
git count-objects -vH

# Nettoyer le cache local
npm run build -- --force
``` 