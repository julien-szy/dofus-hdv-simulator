// Script de migration : Extraire les données statiques de la BDD vers JSON local
// Ce script permet d'alléger la BDD de 90% en déplaçant les données statiques

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataMigrationService {
  constructor() {
    this.outputDir = path.join(__dirname, '../src/data/local');
    this.publicDir = path.join(__dirname, '../public');
  }

  async createDirectories() {
    const dirs = [this.outputDir, this.publicDir];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`✅ Dossier créé : ${dir}`);
      } catch (error) {
        console.log(`ℹ️ Dossier existe déjà : ${dir}`);
      }
    }
  }

  async extractCraftableItems() {
    console.log('🔍 Extraction des items craftables...');
    
    try {
      // Charger les données existantes
      const dofusDataPath = path.join(this.outputDir, 'dofus-data.json');
      const dofusData = JSON.parse(await fs.readFile(dofusDataPath, 'utf8'));
      
      const craftableItems = {};
      
      // Extraire les items qui ont des recettes
      for (const [itemId, item] of Object.entries(dofusData.items || {})) {
        if (item.hasRecipe && dofusData.recipes && dofusData.recipes[itemId]) {
          const recipe = dofusData.recipes[itemId][0];
          
          craftableItems[itemId] = {
            id: item.id,
            name: item.name,
            level: item.level,
            type: item.type,
            profession: recipe?.jobName || 'Inconnu',
            recipe: {
              jobId: recipe?.jobId,
              jobName: recipe?.jobName,
              ingredients: recipe?.ingredients || []
            }
          };
        }
      }
      
      // Sauvegarder le mapping des items craftables
      const craftableItemsPath = path.join(this.publicDir, 'craftable-items-mapping.json');
      await fs.writeFile(craftableItemsPath, JSON.stringify(craftableItems, null, 2));
      
      console.log(`✅ ${Object.keys(craftableItems).length} items craftables extraits`);
      return craftableItems;
      
    } catch (error) {
      console.error('❌ Erreur extraction items craftables:', error);
      return {};
    }
  }

  async extractMaterials() {
    console.log('🔍 Extraction des matériaux...');
    
    try {
      // Charger les données existantes
      const dofusDataPath = path.join(this.publicDir, 'dofus-data.json');
      const dofusData = JSON.parse(await fs.readFile(dofusDataPath, 'utf8'));
      
      const materials = {};
      const materialIds = new Set();
      
      // Collecter tous les IDs de matériaux depuis les recettes
      for (const recipes of Object.values(dofusData.recipes || {})) {
        for (const recipe of recipes) {
          for (const ingredient of recipe.ingredients || []) {
            if (ingredient.id) {
              materialIds.add(ingredient.id.toString());
            }
          }
        }
      }
      
      // Extraire les matériaux
      for (const materialId of materialIds) {
        const item = dofusData.items[materialId];
        if (item) {
          materials[materialId] = {
            id: item.id,
            name: item.name,
            level: item.level,
            type: item.type,
            img: item.img,
            harvestable: false, // À déterminer plus tard
            droppable: false,   // À déterminer plus tard
            craftable: false    // À déterminer plus tard
          };
        }
      }
      
      // Sauvegarder le mapping des matériaux
      const materialsPath = path.join(this.publicDir, 'materials-mapping.json');
      await fs.writeFile(materialsPath, JSON.stringify(materials, null, 2));
      
      console.log(`✅ ${Object.keys(materials).length} matériaux extraits`);
      return materials;
      
    } catch (error) {
      console.error('❌ Erreur extraction matériaux:', error);
      return {};
    }
  }

  async createOptimizedDofusData() {
    console.log('🔍 Création du fichier dofus-data optimisé...');
    
    try {
      // Charger les données existantes
      const dofusDataPath = path.join(this.publicDir, 'dofus-data.json');
      const dofusData = JSON.parse(await fs.readFile(dofusDataPath, 'utf8'));
      
      // Créer une version optimisée avec seulement les données nécessaires
      const optimizedData = {
        items: {},
        recipes: {},
        jobs: dofusData.jobs || {},
        metadata: {
          ...dofusData.metadata,
          optimizedAt: new Date().toISOString(),
          totalItems: 0,
          totalRecipes: 0,
          totalJobs: Object.keys(dofusData.jobs || {}).length
        }
      };
      
      // Extraire seulement les items qui ont des recettes ou qui sont des matériaux
      const relevantItemIds = new Set();
      
      // Items avec recettes
      for (const itemId of Object.keys(dofusData.recipes || {})) {
        relevantItemIds.add(itemId);
      }
      
      // Matériaux utilisés dans les recettes
      for (const recipes of Object.values(dofusData.recipes || {})) {
        for (const recipe of recipes) {
          for (const ingredient of recipe.ingredients || []) {
            if (ingredient.id) {
              relevantItemIds.add(ingredient.id.toString());
            }
          }
        }
      }
      
      // Copier les items pertinents
      for (const itemId of relevantItemIds) {
        if (dofusData.items[itemId]) {
          optimizedData.items[itemId] = dofusData.items[itemId];
        }
      }
      
      // Copier les recettes
      optimizedData.recipes = dofusData.recipes || {};
      
      // Mettre à jour les métadonnées
      optimizedData.metadata.totalItems = Object.keys(optimizedData.items).length;
      optimizedData.metadata.totalRecipes = Object.keys(optimizedData.recipes).length;
      
      // Sauvegarder la version optimisée
      const optimizedPath = path.join(this.outputDir, 'dofus-data-optimized.json');
      await fs.writeFile(optimizedPath, JSON.stringify(optimizedData, null, 2));
      
      console.log(`✅ Données optimisées créées :`);
      console.log(`   - Items : ${optimizedData.metadata.totalItems}`);
      console.log(`   - Recettes : ${optimizedData.metadata.totalRecipes}`);
      console.log(`   - Métiers : ${optimizedData.metadata.totalJobs}`);
      
      return optimizedData;
      
    } catch (error) {
      console.error('❌ Erreur création données optimisées:', error);
      return null;
    }
  }

  async generateMigrationReport() {
    console.log('📊 Génération du rapport de migration...');
    
    try {
      const report = {
        migrationDate: new Date().toISOString(),
        filesCreated: [],
        statistics: {},
        recommendations: []
      };
      
      // Vérifier les fichiers créés
      const filesToCheck = [
        { path: path.join(this.publicDir, 'craftable-items-mapping.json'), name: 'craftable-items-mapping.json' },
        { path: path.join(this.publicDir, 'materials-mapping.json'), name: 'materials-mapping.json' },
        { path: path.join(this.outputDir, 'dofus-data-optimized.json'), name: 'dofus-data-optimized.json' }
      ];
      
      for (const file of filesToCheck) {
        try {
          const stats = await fs.stat(file.path);
          const content = JSON.parse(await fs.readFile(file.path, 'utf8'));
          
          report.filesCreated.push({
            name: file.name,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            records: Object.keys(content).length
          });
        } catch (error) {
          console.warn(`⚠️ Fichier non trouvé : ${file.name}`);
        }
      }
      
      // Statistiques
      const dofusDataPath = path.join(this.outputDir, 'dofus-data.json');
      if (await fs.access(dofusDataPath).then(() => true).catch(() => false)) {
        const originalData = JSON.parse(await fs.readFile(dofusDataPath, 'utf8'));
        const optimizedData = JSON.parse(await fs.readFile(path.join(this.outputDir, 'dofus-data-optimized.json'), 'utf8'));
        
        const originalSize = JSON.stringify(originalData).length;
        const optimizedSize = JSON.stringify(optimizedData).length;
        const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        report.statistics = {
          originalItems: Object.keys(originalData.items || {}).length,
          optimizedItems: Object.keys(optimizedData.items || {}).length,
          originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
          optimizedSize: `${(optimizedSize / 1024).toFixed(2)} KB`,
          sizeReduction: `${reduction}%`
        };
      }
      
      // Recommandations
      report.recommendations = [
        "Remplacer les imports de dofus-data.json par dofus-data-optimized.json",
        "Utiliser LocalDataService pour accéder aux données statiques",
        "Supprimer les tables craftable_items, craft_resources, etc. de la BDD",
        "Garder uniquement les tables utilisateur en BDD"
      ];
      
      // Sauvegarder le rapport
      const reportPath = path.join(__dirname, 'migration-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('✅ Rapport de migration généré :', reportPath);
      console.log('\n📋 Résumé :');
      console.log(`   - Fichiers créés : ${report.filesCreated.length}`);
      console.log(`   - Réduction taille : ${report.statistics.sizeReduction || 'N/A'}`);
      console.log(`   - Items optimisés : ${report.statistics.optimizedItems || 'N/A'}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Erreur génération rapport:', error);
      return null;
    }
  }

  async run() {
    console.log('🚀 Début de la migration vers les données locales...\n');
    
    try {
      // 1. Créer les dossiers
      await this.createDirectories();
      
      // 2. Extraire les données
      const [craftableItems, materials, optimizedData] = await Promise.all([
        this.extractCraftableItems(),
        this.extractMaterials(),
        this.createOptimizedDofusData()
      ]);
      
      // 3. Générer le rapport
      const report = await this.generateMigrationReport();
      
      console.log('\n🎉 Migration terminée avec succès !');
      console.log('\n📁 Fichiers créés :');
      console.log('   - public/craftable-items-mapping.json');
      console.log('   - public/materials-mapping.json');
      console.log('   - src/data/local/dofus-data-optimized.json');
      console.log('   - scripts-node/migration-report.json');
      
      console.log('\n🔧 Prochaines étapes :');
      console.log('   1. Tester LocalDataService avec les nouveaux fichiers');
      console.log('   2. Adapter les composants pour utiliser les services optimisés');
      console.log('   3. Supprimer les tables statiques de la BDD');
      console.log('   4. Mettre à jour la documentation');
      
      return {
        success: true,
        craftableItems: Object.keys(craftableItems).length,
        materials: Object.keys(materials).length,
        report
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exécuter la migration
const migrationService = new DataMigrationService();
migrationService.run().then(result => {
  if (result.success) {
    console.log('\n✅ Migration réussie !');
    process.exit(0);
  } else {
    console.log('\n❌ Migration échouée !');
    process.exit(1);
  }
});

export default DataMigrationService; 