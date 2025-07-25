import { useState, useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from './utils/storage.js'
import localDataService from './services/localDataService.js'
import optimizedUserService from './services/optimizedUserService.js'
import { enrichItemWithProfession } from './utils/professionUtils.js'
import { calculateCraftCost } from './utils/craftCalculations.js'
import { loadStoredPrices, savePrice, getMaterialPrice, getAllStoredPrices, migratePricesWithNames } from './services/priceStorage.js'
import syncService from './services/syncService.js'
import trendsService from './services/trendsService.js'
import autoImportService from './services/autoImportService.js'

import Header from './components/Header.jsx'
import SearchForm from './components/SearchForm.jsx'
import RecipeDisplay from './components/RecipeDisplay.jsx'
import ResultsSummary from './components/ResultsSummary.jsx'
import UserProfile from './components/UserProfile.jsx'
import PriceManager from './components/PriceManager.jsx'
import PriceTrends from './components/PriceTrends.jsx'
import CacheStats from './components/CacheStats.jsx'
import UserAuth from './components/UserAuth.jsx'
import ItemMessage from './components/ItemMessage.jsx'
import ServerTutorial from './components/ServerTutorial.jsx'
import DataImporter from './components/DataImporter.jsx'
import ArchitectureTest from './components/ArchitectureTest.jsx'
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
  const [itemMessage, setItemMessage] = useState(null)
  const [showServerTutorial, setShowServerTutorial] = useState(false)
  const [showDataImporter, setShowDataImporter] = useState(false)
  const [showArchitectureTest, setShowArchitectureTest] = useState(false)

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    // Initialiser la base de données et l'utilisateur
    await optimizedUserService.initializeDatabase()
    
    // Vérifier si un utilisateur est connecté
    const user = optimizedUserService.getCurrentUser()
    console.log('🔍 Utilisateur détecté:', user)
    setCurrentUser(user)

    if (user) {
      // Utilisateur connecté - charger toutes les données
      setCraftCalculations(loadFromLocalStorage(STORAGE_KEYS.CALCULATIONS, []))
      setPlayerProfessions(loadFromLocalStorage(STORAGE_KEYS.PROFESSIONS, {}))
      setCheckProfessionLevels(loadFromLocalStorage(STORAGE_KEYS.CHECK_LEVELS, true))

      // Charger les prix stockés localement et migrer les noms manquants
      await migratePricesWithNames(localDataService.getMaterialDetails.bind(localDataService))
      getAllStoredPrices()


      // Charger le serveur de l'utilisateur
      const userServer = trendsService.getCurrentUserServer()
      setCurrentServer(userServer || '')
      // Démarrer l'auto-importation en arrière-plan
      autoImportService.startAutoImport()
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


      }
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error)
    }
  }

  // Sauvegarder les calculs quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CALCULATIONS, craftCalculations)

    // DÉSACTIVÉ TEMPORAIREMENT : Synchronisation automatique qui causait des boucles infinies
    // TODO: Implémenter une synchronisation manuelle ou avec debounce
    /*
    const user = userService.getCurrentUser()
    if (user && craftCalculations.length > 0) {
      const calculationsToSync = craftCalculations.filter(calc => {
        return !calc.dbId || (Date.now() - calc.id < 5000)
      })

      if (calculationsToSync.length > 0) {

        syncService.syncCalculations(calculationsToSync).catch(console.error)
      }
    }
    */
  }, [craftCalculations])

  // Sauvegarder les métiers quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.PROFESSIONS, playerProfessions)

    // DÉSACTIVÉ TEMPORAIREMENT : Synchronisation automatique qui causait des boucles infinies
    /*
    const user = userService.getCurrentUser()
    if (user && Object.keys(playerProfessions).length > 0) {
      syncService.syncProfessions(playerProfessions).catch(console.error)
    }
    */
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

    })

    // Écouter les notifications d'auto-import
    window.addEventListener('autoImportNotification', (event) => {
      const { type, message } = event.detail
      setItemMessage({ type, message })
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

  // Recherche d'objets craftables avec cache intelligent
  const handleSearch = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Utiliser le service local optimisé
      const items = await localDataService.searchItems(term, 10)
      // Enrichir les objets avec les informations de métier manquantes
      const enrichedItems = items.map(item => enrichItemWithProfession(item))
      setSearchResults(enrichedItems)

    } catch (error) {
      setSearchResults([])
      setItemMessage({
        type: 'error',
        message: `Erreur de recherche: ${error.message}`
      })
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
      const hasRecipe = await localDataService.checkItemHasRecipe(item.id)

      if (!hasRecipe) {
        setItemMessage({
          type: 'no-recipe',
          message: `L'objet "${item.name}" ne peut pas être crafté. Cet item n'a pas de recette de craft disponible.`
        })
        setLoading(false)
        return
      }

      // 2. Récupérer les détails complets de l'objet avec sa recette
      const detailedItem = await localDataService.getItemDetails(item.id)

      if (!detailedItem.recipe || detailedItem.recipe.length === 0) {
        alert('Erreur lors du chargement de la recette. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // Récupérer les détails des matériaux
      const materialsWithDetails = await Promise.all(
        detailedItem.recipe.ingredients.map(async (ingredient) => {
          try {
            const materialData = await localDataService.getMaterialDetails(ingredient.id)
            return {
              item_ankama_id: ingredient.id,
              quantity: ingredient.quantity,
              name: materialData?.name || ingredient.name,
              image_urls: materialData?.img ? { icon: materialData.img } : null,
              level: materialData?.level || 1
            }
          } catch (error) {
            console.error('Erreur lors du chargement du matériau:', error)
            return {
              item_ankama_id: ingredient.id,
              quantity: ingredient.quantity,
              name: ingredient.name,
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

    } catch (error) {
      console.error('Erreur lors de la sélection de l\'objet:', error)
      alert('Erreur lors du chargement de l\'objet. Veuillez réessayer.')
    }
    setLoading(false)
  }

  // Mettre à jour le prix d'un matériau avec stockage persistant
  const updateMaterialPrice = async (materialId, price, quantityType = 1) => {
    // Vérifier si un serveur est défini
    if (!currentServer) {
      setShowServerTutorial(true)
      return
    }

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

  const removeCraftCalculation = async (id) => {
    // 1. Supprimer localement immédiatement pour l'UX
    setCraftCalculations(prev => prev.filter(calc => calc.id !== id))

    // 2. Supprimer de la BDD si utilisateur connecté
    const user = userService.getCurrentUser()
    if (user) {
      try {
        await syncService.deleteCalculation(id)
      } catch (error) {
        console.error(`❌ Erreur suppression calcul ${id} de la BDD:`, error)
        // Ne pas remettre le calcul en cas d'erreur BDD,
        // l'utilisateur a déjà vu la suppression locale
      }
    }
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



  // Si pas d'utilisateur connecté, afficher seulement l'écran de connexion
  if (!currentUser) {
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
        setShowDataImporter={setShowDataImporter}
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



      {/* Messages stylés */}
      {itemMessage && (
        <ItemMessage
          type={itemMessage.type}
          message={itemMessage.message}
          onClose={() => setItemMessage(null)}
        />
      )}

      {/* Tutoriel serveur */}
      <ServerTutorial
        isOpen={showServerTutorial}
        onClose={() => setShowServerTutorial(false)}
        onOpenProfile={() => setShowUserProfile(true)}
      />

      {/* Importateur de données */}
      <DataImporter
        isOpen={showDataImporter}
        onClose={() => setShowDataImporter(false)}
      />

      {/* Test de l'architecture optimisée */}
      <ArchitectureTest />
    </div>
  )
}

export default App
