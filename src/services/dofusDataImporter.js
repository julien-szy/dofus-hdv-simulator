// Service pour importer toutes les données DofusDB et les stocker en BDD
class DofusDataImporter {
  constructor() {
    this.baseApiUrl = 'https://api.dofusdb.fr'
    this.dbUrl = import.meta.env.DEV
      ? 'http://localhost:8888/.netlify/functions/database'
      : '/.netlify/functions/database'
    this.isImporting = false;
    this.shouldStop = false;
  }

  // Méthode pour arrêter l'import en cours
  stopImport() {
    console.log('🛑 Arrêt de l\'import demandé');
    this.shouldStop = true;
  }

  // Vérifier si on doit arrêter
  checkShouldStop() {
    if (this.shouldStop) {
      console.log('🛑 Import arrêté par l\'utilisateur');
      this.shouldStop = false;
      this.isImporting = false;
      throw new Error('Import arrêté par l\'utilisateur');
    }
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

      if (data.data && data.data.length > 0) {
        console.log('📋 Métiers trouvés:')
        data.data.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.name || 'Sans nom'} (ID: ${job.id || 'Sans ID'})`)
        })
      }

      return data.data || []
    } catch (error) {
      console.error('❌ Erreur récupération métiers:', error)
      throw error
    }
  }

  // Récupérer toutes les recettes d'un métier avec pagination intelligente
  async fetchJobRecipes(jobId, jobName) {
    try {
      console.log(`📥 Récupération des recettes pour ${jobName} (ID: ${jobId})...`)

      let allRecipes = []
      let skip = 0
      const limit = 50 // Chunks de 50 comme demandé
      let totalExpected = null
      let pageNumber = 1

      while (true) {
        console.log(`📄 Page ${pageNumber}: skip=${skip}, limit=${limit}`)

        const response = await fetch(
          `${this.baseApiUrl}/recipes?jobId=${jobId}&$skip=${skip}&$limit=${limit}&lang=fr`
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const recipes = data.data || []

        // Stocker le total à la première requête
        if (totalExpected === null) {
          totalExpected = data.total || 0
          console.log(`🎯 Total attendu pour ${jobName}: ${totalExpected} recettes`)
        }

        console.log(`📄 Page ${pageNumber}: ${recipes.length} recettes récupérées`)

        // Ajouter les recettes à notre collection
        allRecipes = allRecipes.concat(recipes)

        // Conditions d'arrêt :
        // 1. Pas de recettes dans cette page
        // 2. On a récupéré moins que la limite (dernière page)
        // 3. On a atteint le total attendu
        if (recipes.length === 0 ||
            recipes.length < limit ||
            allRecipes.length >= totalExpected) {
          console.log(`🏁 Fin pagination ${jobName}: ${allRecipes.length}/${totalExpected} recettes`)
          break
        }

        // Préparer la page suivante
        skip += limit
        pageNumber++

        // Pause entre les pages pour éviter de surcharger l'API
        await this.sleep(200)

        // Vérifier si on doit arrêter l'import
        this.checkShouldStop()

        // Sécurité : éviter les boucles infinies
        if (pageNumber > 50) {
          console.warn(`⚠️ Arrêt sécurité après 50 pages pour ${jobName}`)
          break
        }
      }

      console.log(`✅ ${allRecipes.length} recettes TOTALES récupérées pour ${jobName} (attendu: ${totalExpected})`)

      if (allRecipes.length > 0) {
        console.log(`🎯 Premières recettes ${jobName}:`, allRecipes.slice(0, 3).map(r => r.result?.name || 'Sans nom'))
        console.log(`🎯 Dernières recettes ${jobName}:`, allRecipes.slice(-3).map(r => r.result?.name || 'Sans nom'))
      } else {
        console.warn(`⚠️ Aucune recette trouvée pour ${jobName}`)
      }

      return allRecipes
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

  // Formater une recette pour la BDD avec validation des longueurs
  formatRecipeForDB(recipe, jobName) {
    const resultItem = recipe.result

    // Fonction pour tronquer les chaînes trop longues
    const truncateString = (str, maxLength) => {
      if (!str) return ''
      return str.length > maxLength ? str.substring(0, maxLength - 3) + '...' : str
    }

    // Valider et tronquer les champs si nécessaire
    const itemName = truncateString(resultItem.name, 497) // 500 - 3 pour "..."
    const itemType = truncateString(resultItem.type?.name || 'Inconnu', 197)
    const profession = truncateString(jobName, 197)

    return {
      item_id: resultItem.id,
      item_name: itemName,
      item_type: itemType,
      profession: profession,
      level_required: recipe.level || 1,
      item_data: {
        ankama_id: resultItem.id,
        name: resultItem.name, // Nom complet dans le JSON
        type: resultItem.type || { name: 'Inconnu' },
        level: recipe.level || 1,
        profession: jobName, // Nom complet dans le JSON
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
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i]
        try {
          // Vérifier si on doit arrêter l'import
          this.checkShouldStop()

          console.log(`\n🔄 [${i+1}/${jobs.length}] Traitement du métier: ${job.name} (${job.id})`)
          const recipes = await this.fetchJobRecipes(job.id, job.name)

          let jobItemCount = 0
          let jobSkippedCount = 0

          console.log(`📦 Formatage de ${recipes.length} recettes pour ${job.name}...`)

          // 3. Formater chaque recette pour la BDD
          for (const recipe of recipes) {
            if (recipe.result && recipe.result.id) {
              try {
                const formattedItem = this.formatRecipeForDB(recipe, job.name)

                // Vérifier les longueurs avant d'ajouter
                if (formattedItem.item_name.length > 500) {
                  console.warn(`⚠️ Nom trop long (${formattedItem.item_name.length}): ${formattedItem.item_name}`)
                }
                if (formattedItem.profession.length > 200) {
                  console.warn(`⚠️ Métier trop long (${formattedItem.profession.length}): ${formattedItem.profession}`)
                }

                allCraftableItems.push(formattedItem)
                totalItems++
                jobItemCount++
              } catch (error) {
                console.error(`❌ Erreur formatage recette ${recipe.id}:`, error)
                jobSkippedCount++
              }
            } else {
              jobSkippedCount++
            }
          }

          console.log(`✅ ${job.name}: ${jobItemCount} objets ajoutés, ${jobSkippedCount} ignorés (${recipes.length} recettes traitées)`)
          console.log(`📊 Progression globale: ${totalItems} objets formatés`)

          // Petite pause pour éviter de surcharger l'API
          await this.sleep(300)

        } catch (error) {
          console.warn(`⚠️ Erreur pour le métier ${job.name}:`, error)
          continue
        }
      }
      
      console.log(`📦 ${totalItems} objets craftables formatés`)
      
      // 4. Sauvegarder en BDD par chunks pour éviter les timeouts
      const chunkSize = 50 // Réduire la taille pour éviter les erreurs
      let savedCount = 0

      for (let i = 0; i < allCraftableItems.length; i += chunkSize) {
        const chunk = allCraftableItems.slice(i, i + chunkSize)

        try {
          await this.saveCraftableItemsChunk(chunk)
          savedCount += chunk.length
          console.log(`💾 ${savedCount}/${totalItems} objets sauvegardés...`)
        } catch (error) {
          console.error(`❌ Erreur sauvegarde chunk ${i}-${i + chunkSize}:`, error)
          console.error(`📋 Premier item du chunk problématique:`, chunk[0])

          // Essayer de sauvegarder item par item pour identifier le problème
          for (const item of chunk) {
            try {
              await this.saveCraftableItemsChunk([item])
              savedCount++
              console.log(`✅ Item sauvé individuellement: ${item.item_name}`)
            } catch (itemError) {
              console.error(`❌ Item problématique: ${item.item_name}`, itemError)
              console.error(`📋 Données de l'item:`, item)
            }
          }
        }

        // Pause entre les chunks
        await this.sleep(300)
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
      console.log(`🔍 Récupération stats depuis: ${this.dbUrl}?action=get_craftable_items`)
      const response = await fetch(`${this.dbUrl}?action=get_craftable_items`)

      console.log(`📡 Réponse stats: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour stats`)
        return {
          totalItems: 0,
          byProfession: {},
          lastUpdate: null
        }
      }

      const items = await response.json()
      console.log(`📊 Items reçus:`, items)
      console.log(`📊 Type de réponse:`, typeof items, Array.isArray(items))

      // Vérifier que items est un array
      if (!Array.isArray(items)) {
        console.warn('⚠️ Réponse stats invalide:', items)
        return {
          totalItems: 0,
          byProfession: {},
          lastUpdate: null
        }
      }

      const statsByProfession = {}
      for (const item of items) {
        if (item && item.profession) {
          if (!statsByProfession[item.profession]) {
            statsByProfession[item.profession] = 0
          }
          statsByProfession[item.profession]++
        }
      }

      return {
        totalItems: items.length,
        byProfession: statsByProfession,
        lastUpdate: items.length > 0 && items[0].updated_at ?
          Math.max(...items.filter(i => i.updated_at).map(i => new Date(i.updated_at).getTime())) :
          null
      }
    } catch (error) {
      console.error('❌ Erreur récupération stats:', error)
      return {
        totalItems: 0,
        byProfession: {},
        lastUpdate: null
      }
    }
  }

  // Importer un métier spécifique avec pagination complète
  async importSingleJob(jobId, jobName) {
    try {
      console.log(`🎯 Import spécifique du métier: ${jobName} (ID: ${jobId})`)

      // Récupérer TOUTES les recettes du métier avec pagination
      const recipes = await this.fetchJobRecipes(jobId, jobName)

      if (recipes.length === 0) {
        return {
          success: true,
          jobName,
          totalRecipes: 0,
          totalItems: 0,
          message: 'Aucune recette trouvée'
        }
      }

      console.log(`📦 Formatage de ${recipes.length} recettes pour ${jobName}...`)

      // Formater les recettes
      const craftableItems = []
      let formattedCount = 0
      let skippedCount = 0

      for (const recipe of recipes) {
        if (recipe.result && recipe.result.id) {
          try {
            const formattedItem = this.formatRecipeForDB(recipe, jobName)
            craftableItems.push(formattedItem)
            formattedCount++
          } catch (error) {
            console.error(`❌ Erreur formatage recette ${recipe.id}:`, error)
            skippedCount++
          }
        } else {
          skippedCount++
        }
      }

      console.log(`📦 ${formattedCount} objets formatés, ${skippedCount} ignorés pour ${jobName}`)

      if (craftableItems.length === 0) {
        return {
          success: true,
          jobName,
          totalRecipes: recipes.length,
          totalItems: 0,
          message: 'Aucun objet valide à importer'
        }
      }

      // Sauvegarder par chunks
      const chunkSize = 25 // Chunks plus petits pour stabilité
      let savedCount = 0
      const totalChunks = Math.ceil(craftableItems.length / chunkSize)

      console.log(`💾 Sauvegarde en ${totalChunks} chunks de ${chunkSize} objets...`)

      for (let i = 0; i < craftableItems.length; i += chunkSize) {
        const chunk = craftableItems.slice(i, i + chunkSize)
        const chunkNumber = Math.floor(i / chunkSize) + 1

        try {
          await this.saveCraftableItemsChunk(chunk)
          savedCount += chunk.length
          console.log(`💾 Chunk ${chunkNumber}/${totalChunks}: ${savedCount}/${craftableItems.length} objets sauvés`)
        } catch (error) {
          console.error(`❌ Erreur sauvegarde chunk ${chunkNumber} pour ${jobName}:`, error)

          // Essayer item par item en cas d'erreur de chunk
          for (const item of chunk) {
            try {
              await this.saveCraftableItemsChunk([item])
              savedCount++
            } catch (itemError) {
              console.error(`❌ Item problématique ${jobName}: ${item.item_name}`, itemError)
            }
          }
        }

        // Pause entre chunks
        await this.sleep(300)
      }

      console.log(`✅ Import ${jobName} terminé: ${savedCount}/${craftableItems.length} objets sauvés depuis ${recipes.length} recettes`)

      return {
        success: true,
        jobName,
        totalRecipes: recipes.length,
        totalItems: savedCount,
        formattedItems: formattedCount,
        skippedItems: skippedCount,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`❌ Erreur import métier ${jobName}:`, error)
      return {
        success: false,
        jobName,
        error: error.message
      }
    }
  }

  // Utilitaire pour les pauses
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Instance singleton
export const dofusDataImporter = new DofusDataImporter()

// Fonction globale pour arrêter l'import (accessible depuis la console)
if (typeof window !== 'undefined') {
  window.stopDofusImport = () => {
    console.log('🛑 Arrêt de tous les imports Dofus...')
    dofusDataImporter.stopImport()
  }
}

export default dofusDataImporter
