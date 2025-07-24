# Workflow Quotidien - Dofus HDV

## 🚀 Développement Rapide

### Pour les modifications de code uniquement :

```bash
# 1. Développez votre code
npm run dev

# 2. Quand vous voulez déployer
npm run push
```

**Résultat** : Déploiement en 2-3 minutes ⚡

### Pour les modifications d'images uniquement :

```bash
# 1. Modifiez vos images
# 2. Déployez les images
npm run deploy-images
```

**Résultat** : Déploiement en 5-10 minutes 🖼️

### Pour les modifications code + images :

```bash
# 1. Déployez d'abord les images
npm run deploy-images

# 2. Attendez la fin du déploiement Netlify

# 3. Déployez le code
npm run push
```

## 🎯 Commandes Principales

| Commande | Usage | Temps |
|----------|-------|-------|
| `npm run push` | Code uniquement | 2-3 min |
| `npm run deploy-images` | Images uniquement | 5-10 min |
| `npm run dev` | Développement local | Instantané |

## 💡 Conseils

### ✅ Faites
- Utilisez `npm run push` pour le code
- Utilisez `npm run deploy-images` pour les images
- Développez en local avec `npm run dev`

### ❌ Évitez
- `git push` direct (peut inclure les images)
- Modifier code + images en même temps
- Pousser sans vérifier les changements

## 🔄 Workflow Recommandé

1. **Développement** : `npm run dev`
2. **Test** : Vérifiez que ça marche
3. **Déploiement** : `npm run push`
4. **Vérification** : Testez sur Netlify

## 🚨 En cas de problème

### Déploiement qui prend trop de temps
- Vérifiez si des images ont été modifiées
- Utilisez `npm run deploy-images` séparément

### Images qui ne se chargent pas
- Vérifiez Git LFS : `git lfs status`
- Re-déployez les images : `npm run deploy-images`

### Code qui ne se met pas à jour
- Vérifiez le statut : `git status`
- Forcez le push : `git push --force`

## 📊 Monitoring

- **Dashboard Netlify** : Surveillez les temps de build
- **GitHub** : Vérifiez les commits
- **Site en production** : Testez les fonctionnalités

---

**🎉 Avec ce workflow, plus de 20 minutes d'attente !** 