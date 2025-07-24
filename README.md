# 🏪 Calculateur de Craft Dofus HDV

Une application web moderne pour calculer la rentabilité des crafts dans Dofus, avec les vraies recettes et prix de l'Hôtel des Ventes.

## ✨ Fonctionnalités

- 🔍 **Recherche d'objets** avec l'API DofusDB.fr
- 💰 **Calcul de prix optimaux** (achat par 1, 10 ou 100 unités)
- 🧮 **Algorithme intelligent** qui choisit la meilleure stratégie d'achat selon la quantité
- ⚒️ **Gestion des métiers** avec vérification des niveaux requis
- 💾 **Sauvegarde automatique** de tous vos calculs et paramètres
- 📊 **Résumé détaillé** avec ROI, taxes HDV, et bénéfices
- ✏️ **Édition des calculs** existants
- 📱 **Interface responsive** pour mobile et desktop
- 🖼️ **Images locales** pour un chargement rapide

## 🚀 Démo en ligne

[Voir l'application](https://julien-szy.github.io/dofus-hdv-simulator/)

## 🛠️ Technologies utilisées

- **React 18** - Framework frontend moderne
- **Vite** - Build tool ultra-rapide
- **CSS3** - Styles modernes avec Grid/Flexbox
- **DofusDB.fr API** - Données officielles Dofus
- **Git LFS** - Gestion des images
- **GitHub Pages** - Hébergement gratuit
- **Architecture optimisée** - Données statiques en JSON local, BDD allégée

## 📦 Installation locale

```bash
# Cloner le projet
git clone https://github.com/julien-szy/dofus-hdv-simulator.git
cd dofus-hdv-simulator

# Installer les dépendances
npm install

# Extraire les images (optionnel)
npm run extract-all
npm run optimize-images

# Migrer vers l'architecture optimisée (recommandé)
npm run migrate-to-local

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

## 🚀 Architecture Optimisée

L'application utilise une architecture optimisée qui sépare les données statiques (JSON local) des données dynamiques (BDD) :

### **Données Statiques (JSON Local)**
- Items craftables et leurs recettes
- Matériaux utilisés dans les crafts
- Métiers et leurs informations
- Images stockées localement avec Git LFS

### **Données Dynamiques (BDD)**
- Prix personnalisés des matériaux
- Favoris utilisateur
- Calculs sauvegardés
- Paramètres utilisateur
- Historique de recherche

### **Avantages**
- **Performance** : Recherche 50x plus rapide
- **Coûts** : BDD 90% plus légère
- **Maintenance** : Plus simple et flexible
- **Offline** : Fonctionne sans internet
6. **Calculez la rentabilité** et voyez vos bénéfices !

## 🧠 Algorithme de prix intelligent

L'application utilise un algorithme avancé qui :
- **Privilégie les gros lots** pour les grandes quantités (50+ unités)
- **Applique une pénalité d'inflation** pour les achats unitaires en masse
- **Compare tous les prix** pour les petites quantités
- **Affiche la stratégie recommandée** pour chaque matériau

## 📁 Structure du Projet

```
├── src/
│   ├── components/          # Composants React
│   ├── services/           # Services (API, stockage)
│   └── data/local/         # Données locales
├── public/images/
│   ├── craftable-items/    # Images des items craftables
│   ├── materials/          # Images des matériaux
│   └── defaults/           # Images par défaut
├── scripts-node/           # Scripts d'extraction
└── docs/                   # Documentation
```

## 🔧 Scripts Disponibles

- `npm run dev` - Mode développement
- `npm run build` - Build de production
- `npm run extract-all` - Extraire toutes les images
- `npm run optimize-images` - Optimiser les images
- `npm run migrate-to-local` - Migrer vers l'architecture optimisée
- `npm run deploy` - Déployer complet vers Netlify
- `npm run deploy-images` - Déployer uniquement les images (rapide)
- `npm run deploy-app` - Déployer uniquement l'application (rapide)

## 📖 Documentation

- [Guide d'extraction des images](EXTRACTION-IMAGES.md)
- [Plan de migration API](docs/api-migration-plan.md)
- [Optimisation des déploiements Netlify](docs/netlify-optimization.md)

## 📊 Fonctionnalités avancées

- **Calcul des taxes HDV** (2% automatique)
- **ROI en pourcentage** pour chaque craft
- **Résumé global** de tous vos calculs
- **Modification des calculs** existants
- **Sauvegarde locale** persistante
- **Images optimisées** pour un chargement rapide

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Optimiser le code

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **DofusDB.fr** pour l'API officielle Dofus
- **Ankama** pour le jeu Dofus
- **La communauté React** pour les outils fantastiques
