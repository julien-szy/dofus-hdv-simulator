// Service pour importer toutes les données DofusDB et les stocker en BDD
class DofusDataImporter {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.dbUrl = import.meta.env.DEV 
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database'
  }

  // Récupérer tous les métiers depuis DofusDB
  async fetchAllJobs() {
    try {
      console.log('📥 Récupération des métiers depuis DofusDB...')
      
      const response = await fetch(
        `${this.baseApiUrl}/jobs?$skip=0&$limit=50&$sort[name]=1&lang=fr`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ ${data.data?.length || 0} métiers récupérés sur ${data.total || 'inconnu'} total`)
      console.log('📋 Métiers trouvés:', data.data?.map(j => `${j.name} (${j.id})`).join(', '))

      return data.data || []
    } catch (error) {
      console.error('❌ Erreur récupération métiers:', error)
      throw error
    }
  }

  // Récupérer toutes les recettes d'un métier
  async fetchJobRecipes(jobId, jobName) {
    try {
      console.log(`📥 Récupération des recettes pour ${jobName} (ID: ${jobId})...`)
      
      const response = await fetch(
        `${this.baseApiUrl}/recipes?jobId=${jobId}&$skip=0&$limit=1000&lang=fr`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ ${data.data?.length || 0} recettes récupérées pour ${jobName} sur ${data.total || 'inconnu'} total`)

      if (data.data && data.data.length > 0) {
        console.log(`🎯 Premières recettes ${jobName}:`, data.data.slice(0, 3).map(r => r.result?.name || 'Sans nom'))
      } else {
        console.warn(`⚠️ Aucune recette trouvée pour ${jobName}`)
      }

      return data.data || []
    } catch (error) {
      console.error(`❌ Erreur récupération recettes pour ${jobName}:`, error)
      throw error
    }
  }

  // Récupérer les détails d'un item depuis DofusDB
  async fetchItemDetails(itemId) {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/items/${itemId}?lang=fr`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const item = await response.json()
      return item
    } catch (error) {
      console.warn(`⚠️ Impossible de récupérer l'item ${itemId}:`, error)
      return null
    }
  }

  // Formater une recette pour la BDD
  formatRecipeForDB(recipe, jobName) {
    const resultItem = recipe.result
    
    return {
      item_id: resultItem.id,
      item_name: resultItem.name,
      item_type: resultItem.type?.name || 'Inconnu',
      profession: jobName,
      level_required: recipe.level || 1,
      item_data: {
        ankama_id: resultItem.id,
        name: resultItem.name,
        type: resultItem.type || { name: 'Inconnu' },
        level: recipe.level || 1,
        profession: jobName,
        description: resultItem.description || '',
        craftable: true,
        recipe: {
          id: recipe.id,
          level: recipe.level,
          ingredients: recipe.ingredients || [],
          quantities: recipe.quantities || []
        }
      }
    }
  }

  // Importer tous les métiers et leurs recettes
  async importAllCraftableData() {
    try {
      console.log('🚀 Début de l\'importation complète des données DofusDB...')
      
      // 1. Récupérer tous les métiers
      const jobs = await this.fetchAllJobs()
      
      let totalItems = 0
      const allCraftableItems = []
      
      // 2. Pour chaque métier, récupérer ses recettes
      for (const job of jobs) {
        try {
          console.log(`\n🔄 Traitement du métier: ${job.name} (${job.id})`)
          const recipes = await this.fetchJobRecipes(job.id, job.name)

          let jobItemCount = 0

          // 3. Formater chaque recette pour la BDD
          for (const recipe of recipes) {
            if (recipe.result && recipe.result.id) {
              const formattedItem = this.formatRecipeForDB(recipe, job.name)
              allCraftableItems.push(formattedItem)
              totalItems++
              jobItemCount++
            } else {
              console.warn(`⚠️ Recette sans résultat valide:`, recipe)
            }
          }

          console.log(`✅ ${job.name}: ${jobItemCount} objets ajoutés (${recipes.length} recettes traitées)`)

          // Petite pause pour éviter de surcharger l'API
          await this.sleep(100)

        } catch (error) {
          console.warn(`⚠️ Erreur pour le métier ${job.name}:`, error)
          continue
        }
      }
      
      console.log(`📦 ${totalItems} objets craftables formatés`)
      
      // 4. Sauvegarder en BDD par chunks pour éviter les timeouts
      const chunkSize = 100
      let savedCount = 0
      
      for (let i = 0; i < allCraftableItems.length; i += chunkSize) {
        const chunk = allCraftableItems.slice(i, i + chunkSize)
        
        try {
          await this.saveCraftableItemsChunk(chunk)
          savedCount += chunk.length
          console.log(`💾 ${savedCount}/${totalItems} objets sauvegardés...`)
        } catch (error) {
          console.error(`❌ Erreur sauvegarde chunk ${i}-${i + chunkSize}:`, error)
        }
        
        // Pause entre les chunks
        await this.sleep(200)
      }
      
      console.log(`✅ Importation terminée ! ${savedCount} objets craftables importés`)
      
      return {
        success: true,
        totalJobs: jobs.length,
        totalItems: savedCount,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('❌ Erreur importation complète:', error)
      throw error
    }
  }

  // Sauvegarder un chunk d'objets craftables
  async saveCraftableItemsChunk(items) {
    try {
      const response = await fetch(`${this.dbUrl}?action=save_craftable_items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('❌ Erreur sauvegarde chunk:', error)
      throw error
    }
  }

  // Mettre à jour seulement les nouveaux items
  async updateCraftableData() {
    try {
      console.log('🔄 Mise à jour des données craftables...')
      
      // Récupérer la liste des items existants
      const existingItems = await this.getExistingItemIds()
      
      const jobs = await this.fetchAllJobs()
      const newItems = []
      
      for (const job of jobs) {
        try {
          const recipes = await this.fetchJobRecipes(job.id, job.name)
          
          for (const recipe of recipes) {
            if (recipe.result && recipe.result.id) {
              // Vérifier si l'item existe déjà
              if (!existingItems.has(recipe.result.id)) {
                const formattedItem = this.formatRecipeForDB(recipe, job.name)
                newItems.push(formattedItem)
              }
            }
          }
          
          await this.sleep(100)
        } catch (error) {
          console.warn(`⚠️ Erreur mise à jour métier ${job.name}:`, error)
        }
      }
      
      if (newItems.length > 0) {
        await this.saveCraftableItemsChunk(newItems)
        console.log(`✅ ${newItems.length} nouveaux objets ajoutés`)
      } else {
        console.log('✅ Aucun nouvel objet à ajouter')
      }
      
      return {
        success: true,
        newItems: newItems.length,
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error)
      throw error
    }
  }

  // Récupérer les IDs des items existants
  async getExistingItemIds() {
    try {
      const response = await fetch(`${this.dbUrl}?action=get_craftable_items`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const items = await response.json()
      return new Set(items.map(item => item.item_id))
    } catch (error) {
      console.error('❌ Erreur récupération items existants:', error)
      return new Set()
    }
  }

  // Obtenir les statistiques d'importation
  async getImportStats() {
    try {
      const response = await fetch(`${this.dbUrl}?action=get_craftable_items`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const items = await response.json()
      
      const statsByProfession = {}
      for (const item of items) {
        if (!statsByProfession[item.profession]) {
          statsByProfession[item.profession] = 0
        }
        statsByProfession[item.profession]++
      }

      return {
        totalItems: items.length,
        byProfession: statsByProfession,
        lastUpdate: items.length > 0 ? Math.max(...items.map(i => new Date(i.updated_at).getTime())) : null
      }
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error)
      return null
    }
  }

  // Utilitaire pour les pauses
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Instance singleton
export const dofusDataImporter = new DofusDataImporter()
export default dofusDataImporter
