import { useState, useEffect } from 'react'
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from './utils/storage.js'
import { searchItems, getItemDetails, getMaterialDetails } from './services/dofusApi.js'
import { enrichItemWithProfession } from './utils/professionUtils.js'
import { calculateCraftCost } from './utils/craftCalculations.js'
import Header from './components/Header.jsx'
import SearchForm from './components/SearchForm.jsx'
import RecipeDisplay from './components/RecipeDisplay.jsx'
import ResultsSummary from './components/ResultsSummary.jsx'
import ProfessionModal from './components/ProfessionModal.jsx'
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
  const [showProfessionModal, setShowProfessionModal] = useState(false)
  const [checkProfessionLevels, setCheckProfessionLevels] = useState(true)

  // Charger les données sauvegardées au démarrage
  useEffect(() => {
    setCraftCalculations(loadFromLocalStorage(STORAGE_KEYS.CALCULATIONS, []))
    setPlayerProfessions(loadFromLocalStorage(STORAGE_KEYS.PROFESSIONS, {}))
    setCheckProfessionLevels(loadFromLocalStorage(STORAGE_KEYS.CHECK_LEVELS, true))
  }, [])

  // Sauvegarder les calculs quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CALCULATIONS, craftCalculations)
  }, [craftCalculations])

  // Sauvegarder les métiers quand ils changent
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.PROFESSIONS, playerProfessions)
  }, [playerProfessions])

  // Sauvegarder l'option de vérification des niveaux
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.CHECK_LEVELS, checkProfessionLevels)
  }, [checkProfessionLevels])

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
      // Récupérer les détails complets de l'objet avec sa recette
      const detailedItem = await getItemDetails(item.ankama_id)
      
      if (!detailedItem.recipe || detailedItem.recipe.length === 0) {
        alert('Cet objet n\'a pas de recette de craft disponible.')
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

      // Initialiser les prix des matériaux à 0
      const initialPrices = {}
      materialsWithDetails.forEach(material => {
        initialPrices[material.item_ankama_id] = {
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

  // Mettre à jour le prix d'un matériau
  const updateMaterialPrice = (materialId, price, quantityType = 1) => {
    setMaterialPrices(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [`price_${quantityType}`]: parseFloat(price) || 0
      }
    }))
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

  return (
    <div className="hdv-container">
      <Header 
        setShowProfessionModal={setShowProfessionModal}
        checkProfessionLevels={checkProfessionLevels}
        setCheckProfessionLevels={setCheckProfessionLevels}
      />

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

      <ProfessionModal 
        showModal={showProfessionModal}
        setShowModal={setShowProfessionModal}
        playerProfessions={playerProfessions}
        updateProfessionLevel={updateProfessionLevel}
      />
    </div>
  )
}

export default App
