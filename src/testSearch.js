// Test rapide de la recherche
import { LocalDataService } from './services/localDataService.js';

async function testSearch() {
  console.log('🧪 Test de la recherche...');
  
  const service = new LocalDataService();
  
  try {
    // Initialiser le service
    await service.initialize();
    
    // Test 1: Recherche "épée"
    console.log('\n🔍 Test recherche "épée":');
    const results1 = await service.searchItems('épée', 5);
    console.log(`Résultats: ${results1.length}`);
    results1.forEach(item => console.log(`  - ${item.name} (niv ${item.level})`));
    
    // Test 2: Recherche "arc"
    console.log('\n🔍 Test recherche "arc":');
    const results2 = await service.searchItems('arc', 5);
    console.log(`Résultats: ${results2.length}`);
    results2.forEach(item => console.log(`  - ${item.name} (niv ${item.level})`));
    
    // Test 3: Recherche matériaux "bois"
    console.log('\n🔍 Test recherche matériaux "bois":');
    const materials = await service.searchMaterials('bois', 5);
    console.log(`Résultats: ${materials.length}`);
    materials.forEach(mat => console.log(`  - ${mat.name}`));
    
    // Test 4: Statistiques
    console.log('\n📊 Statistiques:');
    const stats = await service.getStats();
    console.log(`  - Items craftables: ${stats.totalItems}`);
    console.log(`  - Matériaux: ${stats.totalMaterials}`);
    console.log(`  - Professions: ${stats.totalProfessions}`);
    
    console.log('\n✅ Tests terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

// Exécuter le test
testSearch(); 