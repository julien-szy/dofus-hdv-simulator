import { useState, useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from './utils/storage.js'
// import { searchItems, getItemDetails, getMaterialDetails } from './services/dofusApi.js'
import { searchItems, getItemDetails, getMaterialDetails, getItemRecipe, checkItemHasRecipe } from './services/dofusDbApi.js'
import { enrichItemWithProfession } from './utils/professionUtils.js'
import { calculateCraftCost } from './utils/craftCalculations.js'
import { loadStoredPrices, savePrice, getMaterialPrice, getAllStoredPrices, migratePricesWithNames } from './services/priceStorage.js'
import syncService from './services/syncService.js'
import userService from './services/userService.js'
import trendsService from './services/trendsService.js'
import Header from './components/Header.jsx'
import SearchForm from './components/SearchForm.jsx'
import RecipeDisplay from './components/RecipeDisplay.jsx'
import ResultsSummary from './components/ResultsSummary.jsx'
import UserProfile from './components/UserProfile.jsx'
import PriceManager from './components/PriceManager.jsx'
import PriceTrends from './components/PriceTrends.jsx'
import CacheStats from './components/CacheStats.jsx'
import UserAuth from './components/UserAuth.jsx'
import './styles/App.css'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [craftCalculations, setCraftCalculations] = useState([])
  const [loading, setLoading] = useState(false)
  const [materialPrices, setMaterialPrices] = useState({})
  const [editingCalculation, setEditingCalculation] = useState(null)
  const [playerProfessions, setPlayerProfessions] = useState({})
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [checkProfessionLevels, setCheckProfessionLevels] = useState(true)
  const [showPriceManager, setShowPriceManager] = useState(false)
  const [showPriceTrends, setShowPriceTrends] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [currentServer, setCurrentServer] = useState('')

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    // Vérifier si un utilisateur est connecté
    const user = userService.getCurrentUser()
    setCurrentUser(user)
    console.log('🔍 Vérification utilisateur au démarrage:', user ? `Connecté: ${user.username}` : 'Non connecté')

    if (user) {
      // Utilisateur connecté - charger toutes les données
      setCraftCalculations(loadFromLocalStorage(STORAGE_KEYS.CALCULATIONS, []))
      setPlayerProfessions(loadFromLocalStorage(STORAGE_KEYS.PROFESSIONS, {}))
      setCheckProfessionLevels(loadFromLocalStorage(STORAGE_KEYS.CHECK_LEVELS, true))

      // Charger les prix stockés localement et migrer les noms manquants
      await migratePricesWithNames(getMaterialDetails)
      const storedPrices = getAllStoredPrices()
      console.log(`💰 ${Object.keys(storedPrices).length} prix chargés depuis le stockage local`)

      // Charger le serveur de l'utilisateur
      const userServer = trendsService.getCurrentUserServer()
      setCurrentServer(userServer || '')
      console.log(`🌍 Serveur utilisateur: ${userServer || 'Non défini'}`)

      console.log(`👤 Utilisateur connecté: ${user.username}, synchronisation...`)
      await syncUserData()
    }
    // Si pas d'utilisateur connecté, on ne charge rien - l'app sera bloquée
  }

  const syncUserData = async () => {
    try {
      const syncedData = await syncService.fullSync()
      if (syncedData) {
        // Fusionner les données de la BDD avec les données locales
        if (syncedData.calculations.length > 0) {
          setCraftCalculations(prev => {
            const merged = [...prev, ...syncedData.calculations]
            // Supprimer les doublons par ID
            const unique = merged.filter((calc, index, self) =>
              index === self.findIndex(c => c.id === calc.id)
            )
            saveToLocalStorage(STORAGE_KEYS.CALCULATIONS, unique)
            return unique
          })
        }

        if (Object.keys(syncedData.professions).length > 0) {
          setPlayerProfessions(prev => {
            const merged = { ...prev, ...syncedData.professions }
            saveToLocalStorage(STORAGE_KEYS.PROFESSIONS, merged)
            return merged
          })
        }

        console.log('✅ Données utilisateur synchronisées')
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
    }
  }

  // Sauvegarder les calculs quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CALCULATIONS, craftCalculations)

    // Synchroniser avec la BDD si utilisateur connecté
    const user = userService.getCurrentUser()
    if (user && craftCalculations.length > 0) {
      syncService.syncCalculations(craftCalculations).catch(console.error)
    }
  }, [craftCalculations])

  // Sauvegarder les métiers quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.PROFESSIONS, playerProfessions)

    // Synchroniser avec la BDD si utilisateur connecté
    const user = userService.getCurrentUser()
    if (user && Object.keys(playerProfessions).length > 0) {
      syncService.syncProfessions(playerProfessions).catch(console.error)
    }
  }, [playerProfessions])

  // Sauvegarder l'option de vérification des niveaux
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CHECK_LEVELS, checkProfessionLevels)
  }, [checkProfessionLevels])

  // Écouter les changements d'utilisateur connecté
  useEffect(() => {
    const handleUserChange = () => {
      const user = userService.getCurrentUser()
      setCurrentUser(user)
      if (user) {
        console.log(`👤 Nouvel utilisateur connecté: ${user.username}`)
        syncUserData()
        // Recharger les données quand l'utilisateur se connecte
        loadInitialData()
      }
    }

    // Écouter les changements dans le localStorage pour détecter les connexions
    window.addEventListener('storage', handleUserChange)

    // Écouter les événements personnalisés pour les changements d'utilisateur
    window.addEventListener('userLogin', handleUserChange)
    window.addEventListener('userLogout', () => {
      setCurrentUser(null)
      // Nettoyer les données quand l'utilisateur se déconnecte
      setCraftCalculations([])
      setPlayerProfessions({})
      setMaterialPrices({})
    })

    // Écouter l'événement pour ouvrir le profil
    window.addEventListener('openUserProfile', () => {
      setShowUserProfile(true)
    })

    // Écouter les changements de serveur
    window.addEventListener('serverChanged', (event) => {
      setCurrentServer(event.detail || '')
      console.log(`🌍 Serveur changé: ${event.detail || 'Non défini'}`)
    })

    return () => {
      window.removeEventListener('storage', handleUserChange)
      window.removeEventListener('userLogin', handleUserChange)
      window.removeEventListener('userLogout', () => setCurrentUser(null))
      window.removeEventListener('openUserProfile', () => setShowUserProfile(true))
      window.removeEventListener('serverChanged', () => {})
    }
  }, [])

  // Mettre à jour le niveau d'un métier
  const updateProfessionLevel = (profession, level) => {
    setPlayerProfessions(prev => ({
      ...prev,
      [profession]: parseInt(level) || 0
    }))
  }

  // Recherche d'objets via l'API DofusDude
  const handleSearch = async (term) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const items = await searchItems(term)
      // Enrichir les objets avec les informations de métier manquantes
      const enrichedItems = items.map(item => enrichItemWithProfession(item))
      setSearchResults(enrichedItems)
    } catch (error) {
      setSearchResults([])
      alert(`Erreur de recherche: ${error.message}. Vérifiez la console pour plus de détails.`)
    }
    setLoading(false)
  }

  // Recherche automatique quand le terme change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchTerm)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Sélectionner un objet et charger sa recette
  const selectItem = async (item) => {
    setLoading(true)
    try {
      // 1. Vérifier d'abord si l'item a une recette
      console.log(`🔍 Vérification recette pour: ${item.name} (ID: ${item.ankama_id})`)
      const hasRecipe = await checkItemHasRecipe(item.ankama_id)

      if (!hasRecipe) {
        alert(`❌ L'objet "${item.name}" ne peut pas être crafté.\n\nCet item n'a pas de recette de craft disponible.`)
        setLoading(false)
        return
      }

      console.log(`✅ Recette confirmée pour: ${item.name}`)

      // 2. Récupérer les détails complets de l'objet avec sa recette
      const detailedItem = await getItemDetails(item.ankama_id)

      if (!detailedItem.recipe || detailedItem.recipe.length === 0) {
        alert('Erreur lors du chargement de la recette. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // Récupérer les détails des matériaux
      const materialsWithDetails = await Promise.all(
        detailedItem.recipe.map(async (recipeItem) => {
          try {
            const materialData = await getMaterialDetails(recipeItem.item_ankama_id, recipeItem.item_subtype)
            return {
              ...recipeItem,
              name: materialData.name,
              image_urls: materialData.image_urls,
              level: materialData.level
            }
          } catch (error) {
            console.error('Erreur lors du chargement du matériau:', error)
            return {
              ...recipeItem,
              name: `Matériau ${recipeItem.item_ankama_id}`,
              image_urls: null,
              level: 1
            }
          }
        })
      )

      // Enrichir l'objet avec les informations de métier
      const enrichedItem = enrichItemWithProfession({
        ...detailedItem,
        recipe: materialsWithDetails
      })
      
      setSelectedItem(enrichedItem)

      // Initialiser les prix des matériaux avec les prix stockés
      const storedPrices = getAllStoredPrices()
      const initialPrices = {}
      materialsWithDetails.forEach(material => {
        const materialId = material.item_ankama_id
        initialPrices[materialId] = storedPrices[materialId] || {
          price_1: 0,
          price_10: 0,
          price_100: 0
        }
      })
      setMaterialPrices(initialPrices)
      console.log(`💰 Prix initialisés avec ${Object.keys(storedPrices).length} prix stockés`)
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'objet:', error)
      alert('Erreur lors du chargement de l\'objet. Veuillez réessayer.')
    }
    setLoading(false)
  }

  // Mettre à jour le prix d'un matériau avec stockage persistant
  const updateMaterialPrice = async (materialId, price, quantityType = 1) => {
    const priceType = `price_${quantityType}`

    // 1. Récupérer le nom du matériau si pas déjà en cache
    let materialName = null
    try {
      const materialDetails = await getMaterialDetails(materialId)
      materialName = materialDetails.name
    } catch (error) {
      console.warn('Impossible de récupérer le nom du matériau:', error)
    }

    // 2. Sauvegarder en localStorage avec le nom et serveur
    const updatedStoredPrices = savePrice(materialId, priceType, price, materialName, currentServer)

    // 3. Mettre à jour l'état local
    setMaterialPrices(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [priceType]: parseFloat(price) || 0
      }
    }))

    // 4. Synchroniser avec la BDD si utilisateur connecté
    const user = userService.getCurrentUser()
    if (user) {
      try {
        const materialData = updatedStoredPrices[materialId]
        await syncService.syncMaterialPrice(
          materialId,
          materialData.name || materialName || 'Matériau inconnu',
          {
            x1: materialData.price_1,
            x10: materialData.price_10,
            x100: materialData.price_100
          }
        )

        // 5. Sauvegarder pour les tendances (anonymisé)
        if (currentServer) {
          await trendsService.savePriceTrend(
            materialId,
            materialData.name || materialName || 'Matériau inconnu',
            currentServer,
            materialData
          )
        }
      } catch (error) {
        console.error('❌ Erreur sync prix matériau:', error)
      }
    }

    // 6. Mettre à jour tous les calculs existants
    setCraftCalculations(prevCalculations =>
      prevCalculations.map(calc => {
        // Vérifier si ce calcul utilise ce matériau
        const usesMaterial = calc.item.recipe?.some(material =>
          material.item_ankama_id === materialId
        )

        if (usesMaterial) {
          // Recalculer avec les nouveaux prix
          const updatedMaterialPrices = {
            ...calc.materialPrices,
            [materialId]: updatedStoredPrices[materialId]
          }

          const craftResult = calculateCraftCost(calc.item, updatedMaterialPrices)
          const newCraftCost = craftResult.totalCost
          const netSellPrice = calc.sellPrice - Math.floor(calc.sellPrice * 0.02)
          const newProfit = (netSellPrice - newCraftCost) * calc.quantity
          const newProfitPercentage = newCraftCost > 0 ? ((netSellPrice - newCraftCost) / newCraftCost * 100) : 0

          console.log(`🔄 Calcul mis à jour pour ${calc.item.name}: ${calc.craftCost} → ${newCraftCost}`)

          return {
            ...calc,
            craftCost: newCraftCost,
            profit: newProfit,
            profitPercentage: newProfitPercentage,
            materialPrices: updatedMaterialPrices
          }
        }

        return calc
      })
    )
  }

  // Ajouter un calcul de craft
  const addCraftCalculation = () => {
    if (!selectedItem) return

    const craftResult = calculateCraftCost(selectedItem, materialPrices)
    const craftCost = craftResult.totalCost
    const sellPrice = parseFloat(document.getElementById('sellPrice')?.value) || 0
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1
    
    if (sellPrice <= 0) {
      alert('Veuillez entrer un prix de vente valide')
      return
    }

    // Calcul de la taxe HDV (2% sur le prix de vente)
    const tax = Math.floor(sellPrice * 0.02)
    const netSellPrice = sellPrice - tax
    const profit = (netSellPrice - craftCost) * quantity
    const profitPercentage = craftCost > 0 ? ((netSellPrice - craftCost) / craftCost * 100) : 0

    const calculation = {
      id: Date.now(),
      item: selectedItem,
      craftCost,
      sellPrice,
      netSellPrice,
      tax,
      quantity,
      profit,
      profitPercentage,
      materialPrices: { ...materialPrices }
    }

    setCraftCalculations(prev => [...prev, calculation])
    
    // Reset
    setSelectedItem(null)
    setMaterialPrices({})
    setSearchTerm('')
    setSearchResults([])
    document.getElementById('sellPrice').value = ''
    document.getElementById('quantity').value = '1'
  }

  // Éditer un calcul existant
  const editCraftCalculation = (calculation) => {
    setSelectedItem(calculation.item)
    setMaterialPrices(calculation.materialPrices)
    setEditingCalculation(calculation)
    
    // Remplir les champs de prix de vente et quantité
    setTimeout(() => {
      const sellPriceInput = document.getElementById('sellPrice')
      const quantityInput = document.getElementById('quantity')
      if (sellPriceInput) sellPriceInput.value = calculation.sellPrice
      if (quantityInput) quantityInput.value = calculation.quantity
    }, 100)
  }

  // Mettre à jour un calcul existant
  const updateCraftCalculation = () => {
    if (!editingCalculation || !selectedItem) return

    const craftResult = calculateCraftCost(selectedItem, materialPrices)
    const craftCost = craftResult.totalCost
    const sellPrice = parseFloat(document.getElementById('sellPrice')?.value) || 0
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1

    if (sellPrice <= 0) {
      alert('Veuillez entrer un prix de vente valide')
      return
    }

    // Calcul de la taxe HDV (2% sur le prix de vente)
    const tax = Math.floor(sellPrice * 0.02)
    const netSellPrice = sellPrice - tax
    const profit = (netSellPrice - craftCost) * quantity
    const profitPercentage = craftCost > 0 ? ((netSellPrice - craftCost) / craftCost * 100) : 0

    const updatedCalculation = {
      ...editingCalculation,
      craftCost,
      sellPrice,
      netSellPrice,
      tax,
      quantity,
      profit,
      profitPercentage,
      materialPrices: { ...materialPrices }
    }

    setCraftCalculations(prev => 
      prev.map(calc => calc.id === editingCalculation.id ? updatedCalculation : calc)
    )
    
    // Reset
    setSelectedItem(null)
    setMaterialPrices({})
    setEditingCalculation(null)
    setSearchTerm('')
    setSearchResults([])
    document.getElementById('sellPrice').value = ''
    document.getElementById('quantity').value = '1'
  }

  const removeCraftCalculation = (id) => {
    setCraftCalculations(prev => prev.filter(calc => calc.id !== id))
  }

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingCalculation(null)
    setSelectedItem(null)
    setMaterialPrices({})
    setSearchTerm('')
    setSearchResults([])
    if (document.getElementById('sellPrice')) document.getElementById('sellPrice').value = ''
    if (document.getElementById('quantity')) document.getElementById('quantity').value = '1'
  }

  // Debug: afficher l'état de connexion
  console.log('🔍 État currentUser dans App:', currentUser)

  // Si pas d'utilisateur connecté, afficher seulement l'écran de connexion
  if (!currentUser) {
    console.log('🚫 Pas d\'utilisateur connecté - Affichage écran de connexion')
    return (
      <div className="hdv-container">
        <div className="auth-required-screen">
          <div className="auth-required-content">
            <div className="auth-required-logo">
              <div className="logo-icon">⚒️</div>
              <h1>Dofus HDV Calculator</h1>
              <p>Calculateur de craft professionnel</p>
            </div>

            <div className="auth-required-message">
              <h2>🔐 Connexion Obligatoire</h2>
              <p>Cette application nécessite une connexion pour fonctionner. Connectez-vous ou créez un compte gratuit pour commencer.</p>

              <div className="auth-required-features">
                <div className="feature-item">
                  <span className="feature-icon">💾</span>
                  <span>Sauvegarde automatique de vos calculs</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📱</span>
                  <span>Synchronisation multi-appareils</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💰</span>
                  <span>Historique des prix et métiers</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🚀</span>
                  <span>Accès à toutes les fonctionnalités</span>
                </div>
              </div>
            </div>

            <div className="auth-required-actions">
              <UserAuth />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hdv-container">
      <Header
        setShowPriceManager={setShowPriceManager}
        setShowPriceTrends={setShowPriceTrends}
        checkProfessionLevels={checkProfessionLevels}
        setCheckProfessionLevels={setCheckProfessionLevels}
      />

      <main className="main-content">
        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchResults={searchResults}
          loading={loading}
          selectItem={selectItem}
          playerProfessions={playerProfessions}
          checkProfessionLevels={checkProfessionLevels}
        />

        <RecipeDisplay
          selectedItem={selectedItem}
          editingCalculation={editingCalculation}
          playerProfessions={playerProfessions}
          checkProfessionLevels={checkProfessionLevels}
          materialPrices={materialPrices}
          updateMaterialPrice={updateMaterialPrice}
          addCraftCalculation={addCraftCalculation}
          updateCraftCalculation={updateCraftCalculation}
          cancelEditing={cancelEditing}
        />

        <ResultsSummary
          craftCalculations={craftCalculations}
          editCraftCalculation={editCraftCalculation}
          removeCraftCalculation={removeCraftCalculation}
        />
      </main>

      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        playerProfessions={playerProfessions}
        updateProfessionLevel={updateProfessionLevel}
      />

      <PriceManager
        isOpen={showPriceManager}
        onClose={() => setShowPriceManager(false)}
      />

      <PriceTrends
        isOpen={showPriceTrends}
        onClose={() => setShowPriceTrends(false)}
      />

      {/* Bouton Cache en position fixe */}
      <CacheStats />
    </div>
  )
}

export default App
