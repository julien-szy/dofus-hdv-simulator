# 🏪 Calculateur de Craft Dofus HDV

Une application web moderne pour calculer la rentabilité des crafts dans Dofus, avec les vraies recettes et prix de l'Hôtel des Ventes.

## ✨ Fonctionnalités

- 🔍 **Recherche d'objets** avec l'API DofusDude officielle
- 💰 **Calcul de prix optimaux** (achat par 1, 10 ou 100 unités)
- 🧮 **Algorithme intelligent** qui choisit la meilleure stratégie d'achat selon la quantité
- ⚒️ **Gestion des métiers** avec vérification des niveaux requis
- 💾 **Sauvegarde automatique** de tous vos calculs et paramètres
- 📊 **Résumé détaillé** avec ROI, taxes HDV, et bénéfices
- ✏️ **Édition des calculs** existants
- 📱 **Interface responsive** pour mobile et desktop

## 🚀 Démo en ligne

[Voir l'application](https://julien-szy.github.io/dofus-hdv-simulator/)

## 🛠️ Technologies utilisées

- **React 18** - Framework frontend moderne
- **Vite** - Build tool ultra-rapide
- **CSS3** - Styles modernes avec Grid/Flexbox
- **DofusDude API** - Données officielles Dofus
- **GitHub Pages** - Hébergement gratuit

## 📦 Installation locale

```bash
# Cloner le projet
git clone https://github.com/julien-szy/dofus-hdv-simulator.git
cd dofus-hdv-simulator

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build
```

## 🎮 Comment utiliser

1. **Configurez vos métiers** : Cliquez sur "🔧 Mes Métiers" et entrez vos niveaux
2. **Recherchez un objet** : Tapez le nom d'un équipement craftable
3. **Entrez les prix** : Saisissez les prix x1, x10, x100 que vous voyez à l'HDV
4. **L'algorithme calcule** automatiquement la stratégie d'achat optimale
5. **Ajoutez le prix de vente** et la quantité à crafter
6. **Calculez la rentabilité** et voyez vos bénéfices !

## 🧠 Algorithme de prix intelligent

L'application utilise un algorithme avancé qui :
- **Privilégie les gros lots** pour les grandes quantités (50+ unités)
- **Applique une pénalité d'inflation** pour les achats unitaires en masse
- **Compare tous les prix** pour les petites quantités
- **Affiche la stratégie recommandée** pour chaque matériau

## 📊 Fonctionnalités avancées

- **Calcul des taxes HDV** (2% automatique)
- **ROI en pourcentage** pour chaque craft
- **Résumé global** de tous vos calculs
- **Modification des calculs** existants
- **Sauvegarde locale** persistante

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Optimiser le code

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **DofusDB** pour l'API officielle Dofus
- **Ankama** pour le jeu Dofus
- **La communauté React** pour les outils fantastiques
