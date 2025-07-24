// Script de debug pour analyser les appels DofusDB
const DEBUG_API_URL = 'https://api.dofusdb.fr'

// Fonction pour tester l'API des métiers
export async function debugJobsAPI() {
  console.log('🔍 DEBUG: Test de l\'API des métiers...')
  
  try {
    const response = await fetch(`${DEBUG_API_URL}/jobs?$skip=0&$limit=50&$sort[name]=1&lang=fr`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('📊 Réponse complète métiers:', data)
    console.log(`📈 Nombre total de métiers: ${data.total || 'inconnu'}`)
    console.log(`📋 Métiers récupérés: ${data.data?.length || 0}`)
    
    if (data.data && data.data.length > 0) {
      console.log('🎯 Premiers métiers:')
      data.data.slice(0, 5).forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.name} (ID: ${job.id})`)
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ Erreur test API métiers:', error)
    return null
  }
}

// Fonction pour tester l'API des recettes d'un métier spécifique
export async function debugRecipesAPI(jobId, jobName, limit = 1000) {
  console.log(`🔍 DEBUG: Test des recettes pour ${jobName} (ID: ${jobId})...`)
  
  try {
    const url = `${DEBUG_API_URL}/recipes?jobId=${jobId}&$skip=0&$limit=${limit}&lang=fr`
    console.log(`🌐 URL appelée: ${url}`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    console.log(`📊 Réponse complète recettes ${jobName}:`, data)
    console.log(`📈 Nombre total de recettes: ${data.total || 'inconnu'}`)
    console.log(`📋 Recettes récupérées: ${data.data?.length || 0}`)
    
    if (data.data && data.data.length > 0) {
      console.log(`🎯 Premières recettes de ${jobName}:`)
      data.data.slice(0, 3).forEach((recipe, index) => {
        console.log(`  ${index + 1}. ${recipe.result?.name || 'Nom inconnu'} (Niveau: ${recipe.level || 'N/A'})`)
        console.log(`     - ID recette: ${recipe.id}`)
        console.log(`     - ID résultat: ${recipe.result?.id}`)
      })
    }
    
    return data
  } catch (error) {
    console.error(`❌ Erreur test API recettes ${jobName}:`, error)
    return null
  }
}

// Fonction pour tester plusieurs métiers
export async function debugMultipleJobs() {
  console.log('🔍 DEBUG: Test de plusieurs métiers...')
  
  // D'abord récupérer la liste des métiers
  const jobsData = await debugJobsAPI()
  
  if (!jobsData || !jobsData.data) {
    console.error('❌ Impossible de récupérer les métiers')
    return
  }
  
  // Tester les 5 premiers métiers
  const jobsToTest = jobsData.data.slice(0, 5)
  const results = []
  
  for (const job of jobsToTest) {
    console.log(`\n--- Test du métier: ${job.name} ---`)
    
    const recipesData = await debugRecipesAPI(job.id, job.name)
    
    results.push({
      jobId: job.id,
      jobName: job.name,
      totalRecipes: recipesData?.total || 0,
      fetchedRecipes: recipesData?.data?.length || 0,
      hasData: recipesData?.data && recipesData.data.length > 0
    })
    
    // Pause entre les appels
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n📊 RÉSUMÉ DES TESTS:')
  console.table(results)
  
  return results
}

// Fonction pour tester avec différentes limites
export async function debugLimits() {
  console.log('🔍 DEBUG: Test avec différentes limites...')
  
  // Prendre le premier métier pour tester
  const jobsData = await debugJobsAPI()
  if (!jobsData?.data?.[0]) {
    console.error('❌ Aucun métier trouvé')
    return
  }
  
  const testJob = jobsData.data[0]
  const limits = [10, 50, 100, 500, 1000, 2000]
  
  console.log(`🎯 Test avec le métier: ${testJob.name}`)
  
  for (const limit of limits) {
    console.log(`\n--- Test avec limite: ${limit} ---`)
    
    const recipesData = await debugRecipesAPI(testJob.id, testJob.name, limit)
    
    console.log(`📋 Limite ${limit}: ${recipesData?.data?.length || 0} recettes récupérées (total: ${recipesData?.total || 'inconnu'})`)
    
    // Pause entre les appels
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

// Fonction pour analyser la structure d'une recette
export async function debugRecipeStructure() {
  console.log('🔍 DEBUG: Analyse de la structure des recettes...')
  
  const jobsData = await debugJobsAPI()
  if (!jobsData?.data?.[0]) return
  
  const testJob = jobsData.data[0]
  const recipesData = await debugRecipesAPI(testJob.id, testJob.name, 5)
  
  if (recipesData?.data?.[0]) {
    const sampleRecipe = recipesData.data[0]
    console.log('🔬 Structure d\'une recette type:')
    console.log(JSON.stringify(sampleRecipe, null, 2))
    
    console.log('\n🎯 Champs importants:')
    console.log(`- ID: ${sampleRecipe.id}`)
    console.log(`- Niveau: ${sampleRecipe.level}`)
    console.log(`- Résultat: ${sampleRecipe.result?.name} (ID: ${sampleRecipe.result?.id})`)
    console.log(`- Type résultat: ${sampleRecipe.result?.type?.name}`)
    console.log(`- Ingrédients: ${sampleRecipe.ingredients?.length || 0}`)
  }
}

// Fonction principale de debug
export async function runFullDebug() {
  console.log('🚀 DÉBUT DU DEBUG COMPLET DofusDB API')
  console.log('=====================================')
  
  try {
    // 1. Test de base des métiers
    await debugJobsAPI()
    
    console.log('\n')
    
    // 2. Test de plusieurs métiers
    await debugMultipleJobs()
    
    console.log('\n')
    
    // 3. Test des limites
    await debugLimits()
    
    console.log('\n')
    
    // 4. Analyse de structure
    await debugRecipeStructure()
    
    console.log('\n✅ DEBUG TERMINÉ')
    
  } catch (error) {
    console.error('❌ Erreur pendant le debug:', error)
  }
}

// Exporter pour utilisation dans la console
window.debugDofusAPI = {
  debugJobsAPI,
  debugRecipesAPI,
  debugMultipleJobs,
  debugLimits,
  debugRecipeStructure,
  runFullDebug
}

export default {
  debugJobsAPI,
  debugRecipesAPI,
  debugMultipleJobs,
  debugLimits,
  debugRecipeStructure,
  runFullDebug
}
