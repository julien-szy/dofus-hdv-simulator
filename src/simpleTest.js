// Test simple du service local
import localDofusService from './data/local/localDofusService.js'

console.log('🧪 Test simple du service local...')

// Test de base
localDofusService.searchItems('épée', 3).then(results => {
  console.log('✅ Recherche réussie:', results.length, 'résultats')
  results.forEach(item => {
    console.log(`   - ${item.name} (niveau ${item.level})`)
  })
}).catch(error => {
  console.error('❌ Erreur:', error)
}) 