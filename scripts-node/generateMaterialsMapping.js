import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MaterialsGenerator {
  constructor() {
    this.publicDir = path.join(__dirname, '../public');
  }

  async generateMaterialsMapping() {
    try {
      console.log('🔍 Génération du mapping des matériaux...');
      
      // Charger les données
      const dofusDataPath = path.join(this.publicDir, 'dofus-data.json');
      const dofusData = JSON.parse(await fs.readFile(dofusDataPath, 'utf8'));
      
      const materials = {};
      const materialIds = new Set();
      
      // Collecter tous les IDs de matériaux depuis les recettes
      for (const [itemId, recipes] of Object.entries(dofusData.recipes || {})) {
        for (const recipe of recipes) {
          for (const ingredient of recipe.ingredients || []) {
            if (ingredient.id) {
              materialIds.add(ingredient.id.toString());
            }
          }
        }
      }
      
      console.log(`📊 ${materialIds.size} matériaux trouvés dans les recettes`);
      
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
            harvestable: false,
            droppable: false,
            craftable: false
          };
        } else {
          console.log(`⚠️ Item ${materialId} non trouvé dans les données`);
        }
      }
      
      // Sauvegarder le mapping des matériaux
      const materialsPath = path.join(this.publicDir, 'materials-mapping.json');
      await fs.writeFile(materialsPath, JSON.stringify(materials, null, 2));
      
      console.log(`✅ ${Object.keys(materials).length} matériaux générés`);
      console.log(`📁 Fichier sauvegardé : ${materialsPath}`);
      
      return materials;
      
    } catch (error) {
      console.error('❌ Erreur génération matériaux:', error);
      return {};
    }
  }

  async run() {
    console.log('🎯 Générateur de Matériaux - Dofus HDV');
    console.log('=====================================');
    
    await this.generateMaterialsMapping();
    
    console.log('\n✅ Génération terminée !');
  }
}

// Exécuter le script
const generator = new MaterialsGenerator();
generator.run().catch(console.error); 