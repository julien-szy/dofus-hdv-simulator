import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MaterialsFixer {
  constructor() {
    this.publicDir = path.join(__dirname, '../public');
  }

  async fixMaterialsMapping() {
    try {
      console.log('🔧 Correction du mapping des matériaux...');
      
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
      
      // Créer les matériaux directement depuis les recettes
      for (const [itemId, recipes] of Object.entries(dofusData.recipes || {})) {
        for (const recipe of recipes) {
          for (const ingredient of recipe.ingredients || []) {
            if (ingredient.id) {
              const materialId = ingredient.id.toString();
              materials[materialId] = {
                id: ingredient.id,
                name: ingredient.name,
                level: 0, // Niveau par défaut
                type: 'Matériau',
                img: ingredient.img,
                harvestable: false,
                droppable: false,
                craftable: false
              };
            }
          }
        }
      }
      
      // Sauvegarder le mapping des matériaux
      const materialsPath = path.join(this.publicDir, 'materials-mapping.json');
      await fs.writeFile(materialsPath, JSON.stringify(materials, null, 2));
      
      console.log(`✅ ${Object.keys(materials).length} matériaux générés`);
      console.log(`📁 Fichier sauvegardé : ${materialsPath}`);
      
      return materials;
      
    } catch (error) {
      console.error('❌ Erreur correction matériaux:', error);
      return {};
    }
  }

  async run() {
    console.log('🎯 Correcteur de Matériaux - Dofus HDV');
    console.log('=====================================');
    
    await this.fixMaterialsMapping();
    
    console.log('\n✅ Correction terminée !');
  }
}

// Exécuter le script
const fixer = new MaterialsFixer();
fixer.run().catch(console.error); 