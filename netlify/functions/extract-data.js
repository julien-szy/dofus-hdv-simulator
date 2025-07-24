// Netlify Function pour extraire les données DofusDB
export const handler = async (event, context) => {
  // Vérifier la méthode
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const { action, jobId, limit } = JSON.parse(event.body || '{}')

  try {
    switch (action) {
      case 'get_jobs':
        return await getAllJobs()
      
      case 'extract_job':
        return await extractJob(jobId, limit)
      
      case 'download_images':
        return await downloadImages(JSON.parse(event.body).iconIds)
      
      case 'get_progress':
        return await getExtractionProgress()
      
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Action not supported' })
        }
    }
  } catch (error) {
    console.error('Erreur extraction:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur serveur',
        message: error.message 
      })
    }
  }
}

// Récupérer tous les métiers
async function getAllJobs() {
  try {
    const response = await fetch('https://api.dofusdb.fr/jobs')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const jobs = data.data || []
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        jobs: jobs.map(job => ({
          id: job.id,
          name: job.name?.fr || 'Métier inconnu',
          icon_id: job.iconId
        }))
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// Extraire un métier spécifique
async function extractJob(jobId, limit = 50) {
  try {
    console.log(`Extraction métier ${jobId}, limite: ${limit}`)
    
    // Récupérer les recettes du métier
    const recipesUrl = `https://api.dofusdb.fr/recipes?jobId=${jobId}&$limit=${limit}`
    const response = await fetch(recipesUrl)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const recipes = data.data || []
    
    const extractedItems = []
    const extractedResources = []
    const itemRecipes = []
    const imageIds = new Set()
    
    // Traiter chaque recette
    for (const recipe of recipes) {
      try {
        // Extraire l'item
        if (recipe.result && recipe.result.name?.fr) {
          const item = {
            m_id: recipe.result.id,
            name_fr: recipe.result.name.fr,
            level: recipe.result.level || 1,
            type_id: recipe.result.typeId || 0,
            icon_id: recipe.result.iconId,
            profession: recipe.jobName || 'Inconnu',
            image_path: `/images/items/${recipe.result.iconId}.png`
          }
          
          extractedItems.push(item)
          imageIds.add(recipe.result.iconId)
        }
        
        // Extraire les ressources
        if (recipe.ingredients && recipe.quantities) {
          for (let i = 0; i < recipe.ingredients.length; i++) {
            const ingredient = recipe.ingredients[i]
            const quantity = recipe.quantities[i] || 1
            
            if (ingredient && ingredient.name?.fr) {
              const resource = {
                m_id: ingredient.id,
                name_fr: ingredient.name.fr,
                level: ingredient.level || 1,
                icon_id: ingredient.iconId,
                image_path: `/images/resources/${ingredient.iconId}.png`
              }
              
              extractedResources.push(resource)
              imageIds.add(ingredient.iconId)
              
              // Créer la liaison recette
              if (recipe.result) {
                itemRecipes.push({
                  item_id: recipe.result.id,
                  resource_id: ingredient.id,
                  quantity: quantity
                })
              }
            }
          }
        }
      } catch (recipeError) {
        console.warn('Erreur traitement recette:', recipeError)
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          items: extractedItems,
          resources: extractedResources,
          recipes: itemRecipes,
          imageIds: Array.from(imageIds),
          totalRecipes: recipes.length
        }
      })
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// Télécharger des images (simulation - Netlify ne peut pas écrire de fichiers)
async function downloadImages(iconIds) {
  try {
    const results = []
    
    // Simuler le téléchargement en vérifiant que les images existent
    for (const iconId of iconIds.slice(0, 10)) { // Limiter pour éviter timeout
      try {
        const imageUrl = `https://api.dofusdb.fr/img/items/${iconId}.png`
        const response = await fetch(imageUrl, { method: 'HEAD' })
        
        results.push({
          iconId,
          exists: response.ok,
          size: response.headers.get('content-length') || 0
        })
      } catch (error) {
        results.push({
          iconId,
          exists: false,
          error: error.message
        })
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Images vérifiées (téléchargement simulé)',
        results: results,
        note: 'Netlify ne peut pas stocker de fichiers. Utilise GitHub Actions ou local.'
      })
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}

// Obtenir le progrès de l'extraction
async function getExtractionProgress() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      progress: {
        status: 'ready',
        message: 'Prêt pour extraction',
        note: 'Utilise l\'interface admin pour lancer l\'extraction par métier'
      }
    })
  }
}
