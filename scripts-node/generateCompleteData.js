import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CompleteDataGenerator {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.publicDir = path.join(this.baseDir, 'public');
    this.craftableImagesDir = path.join(this.publicDir, 'images', 'craftable-items');
    this.materialsImagesDir = path.join(this.publicDir, 'images', 'materials');
    this.outputDir = this.publicDir;
  }

  async getImageIds(directory) {
    try {
      const files = await fs.readdir(directory);
      return files
        .filter(file => file.endsWith('.png'))
        .map(file => file.replace('.png', ''));
    } catch (error) {
      console.error(`❌ Erreur lecture dossier ${directory}:`, error);
      return [];
    }
  }

  async fetchItemData(itemId) {
    try {
      const response = await fetch(`https://api.dofusdb.fr/items/${itemId}`);
      if (!response.ok) {
        console.warn(`⚠️ Item ${itemId} non trouvé`);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Erreur fetch item ${itemId}:`, error);
      return null;
    }
  }

  async fetchRecipeData(itemId) {
    try {
      const response = await fetch(`https://api.dofusdb.fr/items/${itemId}/recipe`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Erreur fetch recipe ${itemId}:`, error);
      return null;
    }
  }

  async generateCraftableItemsMapping() {
    console.log('🔄 Génération mapping items craftables...');
    
    const itemIds = await this.getImageIds(this.craftableImagesDir);
    console.log(`📊 ${itemIds.length} items craftables trouvés`);

    const craftableItems = {};
    let processed = 0;

    for (const itemId of itemIds) {
      try {
        const itemData = await this.fetchItemData(itemId);
        if (itemData) {
          const recipeData = await this.fetchRecipeData(itemId);
          
          craftableItems[itemId] = {
            id: itemId,
            name: itemData.name?.fr || itemData.name?.en || 'Nom inconnu',
            level: itemData.level || 0,
            type: itemData.type?.name?.fr || 'Type inconnu',
            imgUrl: `/images/craftable-items/${itemId}.png`,
            recipe: recipeData ? {
              ingredients: recipeData.ingredients || [],
              job: recipeData.job?.name?.fr || 'Métier inconnu',
              level: recipeData.level || 0
            } : null
          };
        }
        
        processed++;
        if (processed % 50 === 0) {
          console.log(`⏳ Progression: ${processed}/${itemIds.length} (${Math.round(processed/itemIds.length*100)}%)`);
        }
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erreur traitement item ${itemId}:`, error);
      }
    }

    const outputPath = path.join(this.outputDir, 'craftable-items-mapping.json');
    await fs.writeFile(outputPath, JSON.stringify(craftableItems, null, 2));
    console.log(`✅ Mapping items craftables généré: ${Object.keys(craftableItems).length} items`);
    
    return craftableItems;
  }

  async generateMaterialsMapping() {
    console.log('🔄 Génération mapping matériaux...');
    
    const materialIds = await this.getImageIds(this.materialsImagesDir);
    console.log(`📊 ${materialIds.length} matériaux trouvés`);

    const materials = {};
    let processed = 0;

    for (const materialId of materialIds) {
      try {
        const materialData = await this.fetchItemData(materialId);
        if (materialData) {
          materials[materialId] = {
            id: materialId,
            name: materialData.name?.fr || materialData.name?.en || 'Nom inconnu',
            level: materialData.level || 0,
            type: materialData.type?.name?.fr || 'Type inconnu',
            imgUrl: `/images/materials/${materialId}.png`
          };
        }
        
        processed++;
        if (processed % 50 === 0) {
          console.log(`⏳ Progression: ${processed}/${materialIds.length} (${Math.round(processed/materialIds.length*100)}%)`);
        }
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erreur traitement matériau ${materialId}:`, error);
      }
    }

    const outputPath = path.join(this.outputDir, 'materials-mapping.json');
    await fs.writeFile(outputPath, JSON.stringify(materials, null, 2));
    console.log(`✅ Mapping matériaux généré: ${Object.keys(materials).length} matériaux`);
    
    return materials;
  }

  async generateCompleteDofusData() {
    console.log('🔄 Génération données Dofus complètes...');
    
    const craftableItems = await this.generateCraftableItemsMapping();
    const materials = await this.generateMaterialsMapping();

    const completeData = {
      items: craftableItems,
      materials: materials,
      professions: {
        // Professions de base
        "1": { id: 1, name: "Bûcheron", icon: "🌳" },
        "2": { id: 2, name: "Forgeron", icon: "⚒️" },
        "3": { id: 3, name: "Paysan", icon: "🌾" },
        "4": { id: 4, name: "Alchimiste", icon: "🧪" },
        "5": { id: 5, name: "Cordonnier", icon: "👞" },
        "6": { id: 6, name: "Bijoutier", icon: "💎" },
        "7": { id: 7, name: "Tailleur", icon: "✂️" },
        "8": { id: 8, name: "Mineur", icon: "⛏️" },
        "9": { id: 9, name: "Boulanger", icon: "🍞" },
        "10": { id: 10, name: "Boucher", icon: "🥩" },
        "11": { id: 11, name: "Pêcheur", icon: "🎣" },
        "12": { id: 12, name: "Sculpteur", icon: "🗿" },
        "13": { id: 13, name: "Chasseur", icon: "🏹" },
        "14": { id: 14, name: "Paysan", icon: "🌾" }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        totalItems: Object.keys(craftableItems).length,
        totalMaterials: Object.keys(materials).length,
        version: "2.0.0"
      }
    };

    const outputPath = path.join(this.outputDir, 'dofus-data-complete.json');
    await fs.writeFile(outputPath, JSON.stringify(completeData, null, 2));
    
    console.log('✅ Données Dofus complètes générées');
    console.log(`📊 Résumé:`);
    console.log(`   - Items craftables: ${Object.keys(craftableItems).length}`);
    console.log(`   - Matériaux: ${Object.keys(materials).length}`);
    console.log(`   - Professions: ${Object.keys(completeData.professions).length}`);
    
    return completeData;
  }

  async run() {
    console.log('🚀 Début génération données complètes...');
    console.log('⏱️  Temps estimé: 10-15 minutes (avec délais API)');
    
    const startTime = Date.now();
    
    try {
      await this.generateCompleteDofusData();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Génération terminée en ${duration} secondes`);
      
    } catch (error) {
      console.error('❌ Erreur génération:', error);
    }
  }
}

// Exécution
const generator = new CompleteDataGenerator();
generator.run(); 