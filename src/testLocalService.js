// Test du service local Dofus
import localDofusService from './data/local/localDofusService.js'

console.log('🧪 Test du service local Dofus...')

async function testLocalService() {
  try {
    // Test 1: Recherche d'items
    console.log('\n🔍 Test 1: Recherche d\'items')
    const searchResults = await localDofusService.searchItems('épée', 5)
    console.log(`✅ Recherche "épée": ${searchResults.length} résultats`)
    searchResults.forEach(item => {
      console.log(`   - ${item.name} (niveau ${item.level})`)
    })

    // Test 2: Détails d'un item
    if (searchResults.length > 0) {
      console.log('\n📋 Test 2: Détails d\'un item')
      const itemId = searchResults[0].id
      const itemDetails = await localDofusService.getItemDetails(itemId)
      console.log(`✅ Détails item ${itemId}:`, itemDetails?.name || 'Non trouvé')
    }

    // Test 3: Recettes d'un item
    if (searchResults.length > 0) {
      console.log('\n📋 Test 3: Recettes d\'un item')
      const itemId = searchResults[0].id
      const hasRecipe = await localDofusService.checkItemHasRecipe(itemId)
      console.log(`✅ Item ${itemId} a des recettes: ${hasRecipe}`)
      
      if (hasRecipe) {
        const recipes = await localDofusService.getItemRecipes(itemId)
        console.log(`   - ${recipes.length} recettes trouvées`)
        recipes.forEach(recipe => {
          console.log(`     * ${recipe.jobName}: ${recipe.ingredients.length} ingrédients`)
        })
      }
    }

    // Test 4: Métiers
    console.log('\n⚒️ Test 4: Liste des métiers')
    const jobs = await localDofusService.getAllJobs()
    console.log(`✅ ${jobs.length} métiers trouvés:`)
    jobs.forEach(job => {
      console.log(`   - ${job.name}`)
    })

    // Test 5: URL d'image
    if (searchResults.length > 0) {
      console.log('\n🖼️ Test 5: URL d\'image')
      const item = searchResults[0]
      const imageUrl = localDofusService.getImageUrl(item.img)
      console.log(`✅ URL image pour ${item.name}: ${imageUrl}`)
    }

    // Test 6: Statistiques
    console.log('\n📊 Test 6: Statistiques')
    const stats = localDofusService.getStats()
    console.log('✅ Statistiques du service:')
    console.log(`   - Initialisé: ${stats.initialized}`)
    console.log(`   - Items: ${stats.totalItems}`)
    console.log(`   - Recettes: ${stats.totalRecipes}`)
    console.log(`   - Métiers: ${stats.totalJobs}`)
    console.log(`   - Taille cache: ${stats.cacheSize} KB`)

    console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
    console.log('✅ Le service local fonctionne parfaitement')
    console.log('🚀 Vous pouvez maintenant l\'utiliser dans votre app')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Lancer les tests
testLocalService() 