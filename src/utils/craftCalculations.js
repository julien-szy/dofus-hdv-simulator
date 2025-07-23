// Utilitaires pour les calculs de craft

// Obtenir le prix unitaire optimal pour un matériau selon la quantité nécessaire
export const getOptimalPrice = (materialPrices, materialId, neededQuantity) => {
  const prices = materialPrices[materialId] || {}
  const price1 = prices.price_1 || 0
  const price10 = prices.price_10 || 0
  const price100 = prices.price_100 || 0

  // Calculer le prix unitaire pour chaque option
  const unitPrice1 = price1
  const unitPrice10 = price10 / 10
  const unitPrice100 = price100 / 100

  // Logique intelligente selon la quantité nécessaire
  let bestPrice = 0
  let bestType = 1
  let strategy = ""

  // Si on a besoin de beaucoup (50+), privilégier les gros lots
  if (neededQuantity >= 50) {
    if (price100 > 0) {
      bestPrice = unitPrice100
      bestType = 100
      strategy = "Grosse quantité → achat par 100"
    } else if (price10 > 0) {
      bestPrice = unitPrice10
      bestType = 10
      strategy = "Grosse quantité → achat par 10"
    } else if (price1 > 0) {
      // Appliquer une pénalité d'inflation pour les achats unitaires en grosse quantité
      bestPrice = unitPrice1 * (1 + Math.min(neededQuantity * 0.02, 0.5)) // Max 50% d'inflation
      bestType = 1
      strategy = `Achat unitaire avec inflation (+${Math.round(Math.min(neededQuantity * 2, 50))}%)`
    }
  }
  // Si on a besoin d'une quantité moyenne (10-49), privilégier les lots de 10
  else if (neededQuantity >= 10) {
    if (price10 > 0 && (unitPrice10 < unitPrice1 || unitPrice1 === 0)) {
      bestPrice = unitPrice10
      bestType = 10
      strategy = "Quantité moyenne → achat par 10"
    } else if (price100 > 0 && unitPrice100 < unitPrice1) {
      bestPrice = unitPrice100
      bestType = 100
      strategy = "Lot de 100 plus avantageux"
    } else if (price1 > 0) {
      // Légère pénalité d'inflation pour quantité moyenne
      bestPrice = unitPrice1 * (1 + Math.min(neededQuantity * 0.01, 0.2)) // Max 20% d'inflation
      bestType = 1
      strategy = `Achat unitaire avec légère inflation (+${Math.round(Math.min(neededQuantity, 20))}%)`
    }
  }
  // Pour les petites quantités (1-9), comparer tous les prix
  else {
    const options = []
    if (price1 > 0) options.push({ price: unitPrice1, type: 1, strategy: "Achat unitaire" })
    if (price10 > 0) options.push({ price: unitPrice10, type: 10, strategy: "Achat par 10" })
    if (price100 > 0) options.push({ price: unitPrice100, type: 100, strategy: "Achat par 100" })
    
    if (options.length > 0) {
      const best = options.reduce((min, option) => option.price < min.price ? option : min)
      bestPrice = best.price
      bestType = best.type
      strategy = best.strategy
    }
  }

  return { 
    unitPrice: bestPrice, 
    buyType: bestType, 
    totalCost: bestPrice * neededQuantity,
    strategy: strategy
  }
}

// Calculer le coût total de craft
export const calculateCraftCost = (selectedItem, materialPrices) => {
  if (!selectedItem || !selectedItem.recipe) return { totalCost: 0, breakdown: [] }
  
  let totalCost = 0
  const breakdown = []
  
  selectedItem.recipe.forEach(material => {
    const optimal = getOptimalPrice(materialPrices, material.item_ankama_id, material.quantity)
    totalCost += optimal.totalCost
    
    breakdown.push({
      name: material.name,
      quantity: material.quantity,
      unitPrice: optimal.unitPrice,
      buyType: optimal.buyType,
      totalCost: optimal.totalCost
    })
  })
  
  return { totalCost, breakdown }
}

// Formater les kamas
export const formatKamas = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(Math.floor(amount)) + ' K'
}
