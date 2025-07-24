import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CompleteDofusDataCreator {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.publicDir = path.join(this.baseDir, 'public');
  }

  async loadJsonFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`❌ Erreur lecture ${filePath}:`, error);
      return null;
    }
  }

  async createCompleteDofusData() {
    console.log('🔄 Création du fichier dofus-data.json complet...');
    
    // Charger les fichiers de mapping complets
    const craftableItems = await this.loadJsonFile(path.join(this.publicDir, 'craftable-items-mapping.json'));
    const materials = await this.loadJsonFile(path.join(this.publicDir, 'materials-mapping.json'));
    
    if (!craftableItems || !materials) {
      console.error('❌ Impossible de charger les fichiers de mapping');
      return;
    }

    const itemsData = craftableItems.craftableItems || craftableItems;
    const materialsData = materials.materials || materials;
    console.log(`📊 Items craftables chargés: ${Object.keys(itemsData).length}`);
    console.log(`📊 Matériaux chargés: ${Object.keys(materialsData).length}`);

    const completeData = {
      items: itemsData,
      materials: materialsData,
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
        totalItems: Object.keys(itemsData).length,
        totalMaterials: Object.keys(materialsData).length,
        version: "2.0.0-complete"
      }
    };

    const outputPath = path.join(this.publicDir, 'dofus-data.json');
    await fs.writeFile(outputPath, JSON.stringify(completeData, null, 2));
    
    console.log('✅ Fichier dofus-data.json complet créé !');
    console.log(`📊 Résumé final:`);
    console.log(`   - Items craftables: ${Object.keys(itemsData).length}`);
    console.log(`   - Matériaux: ${Object.keys(materialsData).length}`);
    console.log(`   - Professions: ${Object.keys(completeData.professions).length}`);
    console.log(`   - Taille fichier: ${(JSON.stringify(completeData).length / 1024 / 1024).toFixed(2)} MB`);
    
    return completeData;
  }

  async run() {
    try {
      await this.createCompleteDofusData();
    } catch (error) {
      console.error('❌ Erreur création données complètes:', error);
    }
  }
}

// Exécution
const creator = new CompleteDofusDataCreator();
creator.run(); 